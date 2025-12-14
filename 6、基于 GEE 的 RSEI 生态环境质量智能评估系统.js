/**
 * GEE App: RSEI 生态指数 - 全指标可视化增强版
 * 更新内容: 
 * 1. 地图加载所有分量图层 (绿度/湿度/热度/干度)
 * 2. 新增分量对比柱状图、分布曲线图
 * 3. 保持了代数法 PCA 的稳定性
 */

// =========================================
// 1. 初始化设置
// =========================================

var roi = ee.FeatureCollection("projects/maxhecheng/assets/haidian");
// 如果没有资产，可以用下面的点缓冲区代替测试
// var roi = ee.Geometry.Point([116.3, 39.95]).buffer(10000); 

Map.centerObject(roi, 10);
Map.setOptions('HYBRID');

// --- 可视化参数配置 ---
var visParams = {
  rsei: {min: 0, max: 1, palette: ['ff0000', 'ffaa00', 'ffff00', '00ff00', '006400']}, // 红->绿
  ndvi: {min: -0.2, max: 0.8, palette: ['white', 'green']}, // 白->绿
  wet:  {min: -0.15, max: 0.1, palette: ['e0e0e0', '0000ff']}, // 灰->蓝
  heat: {min: 20, max: 50, palette: ['0000ff', 'ffff00', 'ff0000']}, // 蓝->黄->红
  dry:  {min: 0, max: 0.8, palette: ['00ff00', 'ffff00', 'ff0000']} // 绿->黄->红 (越红越干)
};

// =========================================
// 2. UI 面板构建
// =========================================

var panel = ui.Panel({
  style: {width: '400px', padding: '10px', backgroundColor: '#f9f9f9', border: '1px solid #ddd'}
});
ui.root.insert(0, panel);

panel.add(ui.Label('📊 RSEI 全指标生态分析系统', {fontSize: '20px', fontWeight: 'bold', color: '#2c3e50'}));
panel.add(ui.Label('集成: 绿度(NDVI), 湿度(Wet), 热度(LST), 干度(NDBSI)', {fontSize: '11px', color: 'gray'}));

var yearSelect = ui.Slider({min: 2014, max: 2023, value: 2023, step: 1, style: {width: '300px'}});
panel.add(ui.Label('📅 选择年份 (建议选择夏季 6-9月):'));
panel.add(yearSelect);

var runBtn = ui.Button({
  label: '🚀 开始全指标分析',
  style: {stretch: 'horizontal', backgroundColor: '#2980b9', color: 'red', fontWeight: 'bold', margin: '15px 0'},
  onClick: runAnalysis
});
panel.add(runBtn);

// 结果容器 (使用滚动条，防止图表太多显示不下)
var resultPanel = ui.Panel({
  style: {height: '600px', stretch: 'both'} 
});
panel.add(resultPanel);

// =========================================
// 3. 核心算法函数
// =========================================

function preprocess(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(1 << 3).eq(0).and(qa.bitwiseAnd(1 << 4).eq(0));
  var optical = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermal = image.select('ST_B10').multiply(0.00341802).add(149.0).subtract(273.15).rename('LST');
  var mndwi = optical.normalizedDifference(['SR_B3', 'SR_B6']);
  var waterMask = mndwi.lt(0); // 剔除水体
  return image.addBands(optical, null, true)
              .addBands(thermal, null, true)
              .updateMask(mask)
              .updateMask(waterMask)
              .clip(roi);
}

function calcIndicators(image) {
  var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('Green');
  var wet = image.expression(
    '0.1511*B2 + 0.1973*B3 + 0.3283*B4 + 0.3407*B5 - 0.7117*B6 - 0.4559*B7',
    {
      'B2': image.select('SR_B2'), 'B3': image.select('SR_B3'), 'B4': image.select('SR_B4'),
      'B5': image.select('SR_B5'), 'B6': image.select('SR_B6'), 'B7': image.select('SR_B7')
    }
  ).rename('Wet');
  var heat = image.select('LST').rename('Heat');
  
  var swir1 = image.select('SR_B6');
  var nir = image.select('SR_B5');
  var red = image.select('SR_B4');
  var green = image.select('SR_B3');
  var blue = image.select('SR_B2');
  var si = ((swir1.add(red)).subtract(blue.add(nir))).divide((swir1.add(red)).add(blue.add(nir)));
  var ibi_a = swir1.multiply(2).divide(swir1.add(nir));
  var ibi_b = nir.divide(nir.add(red)).add(green.divide(green.add(swir1)));
  var ibi = (ibi_a.subtract(ibi_b)).divide(ibi_a.add(ibi_b));
  var dry = (si.add(ibi)).divide(2).rename('Dry');
  
  return image.addBands([ndvi, wet, heat, dry]);
}

function normalize(image, bandName) {
  var minMax = image.reduceRegion({
    reducer: ee.Reducer.minMax(),
    geometry: roi,
    scale: 500, 
    maxPixels: 1e9,
    bestEffort: true
  });
  var min = ee.Number(minMax.get(bandName + '_min'));
  var max = ee.Number(minMax.get(bandName + '_max'));
  return image.select(bandName).subtract(min).divide(max.subtract(min)).rename(bandName);
}

// =========================================
// 4. 执行逻辑
// =========================================

function runAnalysis() {
  Map.layers().reset();
  resultPanel.clear();
  
  var year = yearSelect.getValue();
  var startDate = year + '-06-01';
  var endDate = year + '-09-30';
  
  resultPanel.add(ui.Label('⏳ 数据处理中... PCA 计算可能需要几秒钟', {color: '#f39c12'}));
  
  var col = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
    .filterBounds(roi)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUD_COVER', 30))
    .map(preprocess);
    
  col.size().evaluate(function(count){
    if(count === 0) {
      resultPanel.clear();
      resultPanel.add(ui.Label('❌ 该年份无可用影像', {color: 'red'}));
      return;
    }
    
    // 1. 计算原始指标
    var img = calcIndicators(col.median().clip(roi));
    
    // 2. 归一化 (用于 PCA)
    var normGreen = normalize(img, 'Green');
    var normWet = normalize(img, 'Wet');
    var normHeat = normalize(img, 'Heat');
    var normDry = normalize(img, 'Dry');
    var normImg = ee.Image.cat([normGreen, normWet, normHeat, normDry]);

    // 3. PCA 计算 (计算协方差)
    var arrayImage = normImg.toArray();
    var covar = arrayImage.reduceRegion({
      reducer: ee.Reducer.covariance(),
      maxPixels: 1e9,
      scale: 500,
      geometry: roi,
      bestEffort: true
    });
    
    var covarArray = ee.Array(covar.get('array'));
    var eigen = covarArray.eigen();
    var eigenVector = eigen.slice(0, 1, 2).project([1]); 
    var eigenList = eigenVector.toList();
    
    // 4. 客户端处理结果
    eigenList.evaluate(function(weights) {
      resultPanel.clear();
      
      if (!weights || weights.length < 4) {
        resultPanel.add(ui.Label('计算失败，有效像素不足', {color: 'red'}));
        return;
      }
      
      // 代数法计算 PC1
      var pc1 = normGreen.multiply(weights[0])
                .add(normWet.multiply(weights[1]))
                .add(normHeat.multiply(weights[2]))
                .add(normDry.multiply(weights[3]))
                .rename('PC1');
      
      // 正负号校正 (确保绿度是正贡献)
      if (weights[0] < 0) {
        pc1 = pc1.multiply(-1);
        print('符号翻转: PC1方向校正');
      }
      
      var rsei = normalize(pc1, 'PC1').rename('RSEI');
      
      // ============================================
      // 🎨 核心升级: 添加所有图层到地图
      // ============================================
      
      // 1. RSEI (默认显示)
      Map.addLayer(rsei, visParams.rsei, '1. RSEI (生态指数)', true);
      
      // 2. 绿度 NDVI (默认隐藏)
      Map.addLayer(img.select('Green'), visParams.ndvi, '2. 绿度 (NDVI)', false);
      
      // 3. 湿度 Wet (默认隐藏)
      Map.addLayer(img.select('Wet'), visParams.wet, '3. 湿度 (Wet)', false);
      
      // 4. 热度 LST (默认隐藏)
      Map.addLayer(img.select('Heat'), visParams.heat, '4. 热度 (LST)', false);
      
      // 5. 干度 Dry (默认隐藏)
      Map.addLayer(img.select('Dry'), visParams.dry, '5. 干度 (NDBSI)', false);
      
      // 添加图例
      addLegend();

      // ============================================
      // 📊 核心升级: 增强统计图表
      // ============================================
      
      resultPanel.add(ui.Label('📈 统计图表看板', {fontSize: '16px', fontWeight: 'bold', margin: '10px 0'}));
      
      // --- 图表 1: RSEI 评分分布 (柱状/区域图) ---
      resultPanel.add(ui.Label('1. RSEI 评分分布', {fontSize: '12px', fontWeight: 'bold', color: '#555'}));
      var rseiHist = ui.Chart.image.histogram({
        image: rsei,
        region: roi,
        scale: 200,
        minBucketWidth: 0.05
      }).setOptions({
        title: 'RSEI 频率分布',
        hAxis: {title: 'RSEI (0=差, 1=优)'},
        vAxis: {title: '像素数量'},
        colors: ['#2ecc71'],
        legend: {position: 'none'}
      });
      resultPanel.add(rseiHist);
      
      // --- 图表 2: 四大分量均值对比 (柱状图) ---
      // 帮助用户判断该区域是“太干”还是“太热”
      resultPanel.add(ui.Label('2. 生态因子归一化均值对比', {fontSize: '12px', fontWeight: 'bold', color: '#555'}));
      
      var means = normImg.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: roi,
        scale: 200,
        bestEffort: true
      });
      
      // 将字典转为 Feature 以便绘图
      var meanFeatures = ee.FeatureCollection([
        ee.Feature(null, {'Type': '绿度 (Green)', 'Value': means.get('Green')}),
        ee.Feature(null, {'Type': '湿度 (Wet)', 'Value': means.get('Wet')}),
        ee.Feature(null, {'Type': '热度 (Heat)', 'Value': means.get('Heat')}),
        ee.Feature(null, {'Type': '干度 (Dry)', 'Value': means.get('Dry')})
      ]);
      
      var barChart = ui.Chart.feature.byFeature(meanFeatures, 'Type', 'Value')
        .setChartType('ColumnChart')
        .setOptions({
          title: '各指标平均水平 (归一化后 0-1)',
          vAxis: {title: '平均值', viewWindow: {min: 0, max: 1}},
          hAxis: {title: '指标'},
          colors: ['#3498db'],
          legend: {position: 'none'}
        });
      resultPanel.add(barChart);

      // --- 图表 3: 各分量数值分布 (曲线图/折线图) ---
      resultPanel.add(ui.Label('3. 各分量数值分布详情', {fontSize: '12px', fontWeight: 'bold', color: '#555'}));
      
      // 为了性能，我们把 4 个波段合在一起画直方图
      var indicatorsHist = ui.Chart.image.histogram({
        image: normImg,
        region: roi,
        scale: 300,
        minBucketWidth: 0.05
      }).setSeriesNames(['干度', '绿度', '热度', '湿度'])
        .setOptions({
        title: '各指标数据分布 (归一化)',
        hAxis: {title: '归一化值'},
        vAxis: {title: '像素数量'},
        curveType: 'function', // 平滑曲线
        colors: ['#e74c3c', '#27ae60', '#f1c40f', '#3498db'] // 红绿黄蓝
      });
      resultPanel.add(indicatorsHist);
      
      // 导出按钮
      var exportBtn = ui.Button({
        label: '💾 导出 RSEI 结果 (GeoTIFF)',
        style: {width: '100%', margin: '20px 0', backgroundColor: '#e74c3c', color: 'red'},
        onClick: function() {
          Export.image.toDrive({
            image: rsei,
            description: 'RSEI_' + year + '_Result',
            scale: 30,
            region: roi,
            maxPixels: 1e9,
            folder: 'GEE_RSEI'
          });
          print('导出任务已创建');
        }
      });
      resultPanel.add(exportBtn);
    });
  });
}

function addLegend() {
  var legend = ui.Panel({
    style: {
      position: 'bottom-left',
      padding: '8px 15px',
      backgroundColor: 'rgba(255, 255, 255, 0.8)'
    }
  });
  legend.add(ui.Label('RSEI 等级说明', {fontWeight: 'bold', fontSize: '12px'}));
  
  var colors = visParams.rsei.palette;
  var names = ['差 (Poor)', '较差 (Fair)', '中等 (Moderate)', '良 (Good)', '优 (Excellent)'];
  
  for(var i=0; i<5; i++){
    var row = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'), style: {margin: '2px 0'}});
    row.add(ui.Label(' ', {
      backgroundColor: '#' + colors[i],
      padding: '0 8px',
      margin: '0 8px 0 0',
      border: '1px solid rgba(0,0,0,0.2)'
    }));
    row.add(ui.Label(names[i], {fontSize: '11px'}));
    legend.add(row);
  }
  Map.add(legend);
}