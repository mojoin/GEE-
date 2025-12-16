/**
 * 该脚本构建了一个交互式分析平台，支持多源遥感数据(Sentinel-2/Landsat)、
 * 多区域选择及自定义时间窗口的作物长势监测与产量估算。
 * * 主要功能：
 * 1. UI交互面板：选择卫星源、区域、时间。
 * 2. 自动化处理：根据选择的数据源自动匹配去云和NDVI计算算法。
 * 3. 动态可视化：实时渲染NDVI时序图和产量分布图。
 */

// --- 1. 全局配置与预定义数据 ---

// 预定义感兴趣区域 (ROI) 字典 - 模拟不同作物的典型产区
var rois = {
  '河南驻马店 (冬小麦)': ee.Geometry.Rectangle([114.0, 32.8, 114.2, 33.0]),
  '黑龙江建三江 (水稻)': ee.Geometry.Rectangle([132.5, 47.1, 132.7, 47.3]),
  '山东德州 (夏玉米)': ee.Geometry.Rectangle([116.2, 37.3, 116.4, 37.5])
};

// 应用初始状态
var appState = {
  satellite: 'Sentinel-2',
  startDate: '2023-03-01',
  endDate: '2023-06-20',
  region: '河南驻马店 (冬小麦)'
};

// --- 新增：图例容器与组件 ---

// 创建一个固定在地图左下角的面板用于显示图例
var legendContainer = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)' // 半透明白色背景
  }
});
Map.add(legendContainer);

/**
 * 辅助函数：创建渐变图例组件
 * @param {String} title 图例标题
 * @param {Object} visParams 可视化参数 {min, max, palette}
 */
function createLegend(title, visParams) {
  var legend = ui.Panel({
    style: {
      padding: '8px 10px',
      margin: '5px 0',
      backgroundColor: '#FFFFFF',
      border: '1px solid #DDDDDD',
      width: '160px'
    }
  });

  // 1. 图例标题
  var legendTitle = ui.Label({
    value: title,
    style: {fontWeight: 'bold', fontSize: '12px', margin: '0 0 6px 0'}
  });
  legend.add(legendTitle);

  // 2. 渐变色条 (使用 Thumbnail 生成)
  var colorBar = ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: {
      bbox: [0, 0, 1, 0.1],
      dimensions: '140x12',
      format: 'png',
      min: 0,
      max: 1,
      palette: visParams.palette,
    },
    style: {stretch: 'horizontal', margin: '0 0 4px 0', height: '12px'}
  });
  legend.add(colorBar);

  // 3. 数值标签 (Min / Max)
  var labels = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal'),
    style: {margin: '0'}
  });
  
  labels.add(ui.Label({value: visParams.min, style: {fontSize: '10px', margin: '0', color: '#555'}}));
  labels.add(ui.Label({value: '', style: {stretch: 'horizontal', margin: '0'}})); // 占位符，将Max推到右侧
  labels.add(ui.Label({value: visParams.max, style: {fontSize: '10px', margin: '0', color: '#555'}}));
  
  legend.add(labels);
  return legend;
}

// --- 2. 数据处理核心算法 (后端逻辑) ---

/**
 * Sentinel-2 数据处理流
 * 特点：10米分辨率，去云使用 QA60 波段
 */
function processSentinel2(start, end, region) {
  function maskS2clouds(image) {
    var qa = image.select('QA60');
    // 第10位(云)和第11位(卷云)
    var cloudBitMask = 1 << 10;
    var cirrusBitMask = 1 << 11;
    var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
        .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
    return image.updateMask(mask).divide(10000)
                .copyProperties(image, ["system:time_start"]);
  }
  
  var ds = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterDate(start, end)
                  .filterBounds(region)
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) // 初始过滤
                  .map(maskS2clouds);
                  
  return ds.map(function(img) {
    // S2 NDVI = (B8 - B4) / (B8 + B4)
    return img.normalizedDifference(['B8', 'B4']).rename('NDVI')
              .copyProperties(img, ['system:time_start']);
  });
}

/**
 * Landsat 8/9 (Collection 2 Level 2) 数据处理流
 * 特点：30米分辨率，去云使用 QA_PIXEL 波段，需应用缩放因子
 */
function processLandsat(start, end, region, collectionId) {
  function maskLandsatClouds(image) {
    var qa = image.select('QA_PIXEL');
    // Bit 3: Cloud, Bit 4: Cloud Shadow
    var mask = qa.bitwiseAnd(1 << 3).eq(0)
      .and(qa.bitwiseAnd(1 << 4).eq(0));
    
    // 应用缩放因子: Surface Reflectance = DN * 0.0000275 - 0.2
    return image.select('SR_B.').multiply(0.0000275).add(-0.2)
      .updateMask(mask)
      .copyProperties(image, ["system:time_start"]);
  }

  var ds = ee.ImageCollection(collectionId)
              .filterDate(start, end)
              .filterBounds(region)
              .filter(ee.Filter.lt('CLOUD_COVER', 40))
              .map(maskLandsatClouds);

  return ds.map(function(img) {
    // Landsat NDVI = (B5 - B4) / (B5 + B4)
    return img.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI')
              .copyProperties(img, ['system:time_start']);
  });
}

// --- 3. 分析执行主函数 ---

function runAnalysis() {
  // 3.1 界面重置
  Map.layers().reset();
  resultPanel.clear();
  // 清除旧图例
  legendContainer.clear(); 
  
  resultPanel.add(ui.Label('正在请求云端计算资源...', {color: 'gray', fontSize: '12px'}));

  var roi = rois[appState.region];
  Map.centerObject(roi, 11);

  // 3.2 根据用户选择获取数据
  var ndviCol;
  if (appState.satellite === 'Sentinel-2') {
    ndviCol = processSentinel2(appState.startDate, appState.endDate, roi);
  } else if (appState.satellite === 'Landsat 8') {
    ndviCol = processLandsat(appState.startDate, appState.endDate, roi, 'LANDSAT/LC08/C02/T1_L2');
  } else if (appState.satellite === 'Landsat 9') {
    ndviCol = processLandsat(appState.startDate, appState.endDate, roi, 'LANDSAT/LC09/C02/T1_L2');
  }

  // 3.3 计算季节性最大 NDVI (Maximum Value Composite)
  // 这代表了作物在生长季中最繁茂的时刻，与产量相关性最强
  var seasonalMaxNDVI = ndviCol.max().clip(roi);

  // 3.4 产量预测建模 (示例线性模型)
  // Yield (t/ha) = 12.5 * Max_NDVI - 1.5
  // 注意：不同作物和区域的系数应不同，此处为通用演示参数
  var predictedYield = seasonalMaxNDVI.expression(
    '12.5 * NDVI - 1.5', {'NDVI': seasonalMaxNDVI}
  ).rename('Yield_Prediction');
  
  // 掩膜低值 (去除水体、建筑等非农田区域)
  var vegMask = seasonalMaxNDVI.gt(0.25);
  predictedYield = predictedYield.updateMask(vegMask);
  seasonalMaxNDVI = seasonalMaxNDVI.updateMask(vegMask);

  // 3.5 地图可视化
  var ndviVis = {min: 0, max: 0.9, palette: ['white', 'yellow', 'green', 'darkgreen']};
  var yieldVis = {min: 2, max: 10, palette: ['d7191c', 'fdae61', 'ffffbf', 'a6d96a', '1a9641']};

  Map.addLayer(seasonalMaxNDVI, ndviVis, '季节性最大 NDVI (' + appState.satellite + ')');
  Map.addLayer(predictedYield, yieldVis, '预测产量 (吨/公顷)');

  // --- 新增：添加图例到地图 ---
  legendContainer.add(createLegend('NDVI (植被指数)', ndviVis));
  legendContainer.add(createLegend('预测产量 (吨/公顷)', yieldVis));

  // 3.6 生成分析图表
  generateCharts(ndviCol, predictedYield, roi);
}

// --- 4. 图表与统计生成 ---

function generateCharts(ndviCol, yieldImg, roi) {
  resultPanel.clear();

  // 1. NDVI 时序曲线图
  var chart1 = ui.Chart.image.series({
    imageCollection: ndviCol,
    region: roi,
    reducer: ee.Reducer.mean(),
    scale: 30, // 统计时的采样尺度，过小会导致计算超时
    xProperty: 'system:time_start'
  }).setOptions({
    title: '作物生长季 NDVI 时序变化',
    vAxis: {title: 'NDVI', viewWindow: {min: 0, max: 1}},
    hAxis: {title: '日期', format: 'MM-dd'},
    lineWidth: 2,
    pointSize: 3,
    colors: ['#388E3C'],
    legend: {position: 'none'}
  });
  
  resultPanel.add(chart1);

  // 2. 产量分布直方图
  var chart2 = ui.Chart.image.histogram({
    image: yieldImg,
    region: roi,
    scale: 30,
    maxPixels: 1e9,
    minBucketWidth: 0.5
  }).setOptions({
    title: '预测产量分布 (吨/公顷)',
    colors: ['#FBC02D'],
    legend: {position: 'none'},
    hAxis: {title: 'Yield (t/ha)'},
    vAxis: {title: 'Pixel Count'}
  });
  
  resultPanel.add(chart2);
  
  // 3. 区域平均产量统计
  var meanYield = yieldImg.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: roi,
    scale: 30,
    maxPixels: 1e9
  }).get('Yield_Prediction');
  
  // 异步获取并在UI显示结果
  meanYield.evaluate(function(val) {
    if (val) {
      var summaryBox = ui.Label({
        value: '📊 区域平均产量: ' + val.toFixed(2) + ' 吨/公顷', 
        style: {
          fontWeight: 'bold', 
          color: '#ffffff', 
          backgroundColor: '#2E7D32',
          padding: '8px', 
          margin: '10px 0',
          borderRadius: '4px'
        }
      });
      resultPanel.add(summaryBox);
    } else {
      resultPanel.add(ui.Label('数据不足，无法计算平均产量', {color: 'red'}));
    }
  });
}

// --- 5. UI 界面构建 ---

// 创建侧边栏
var mainPanel = ui.Panel({
  style: {width: '320px', padding: '10px', backgroundColor: '#f9f9f9', border: '1px solid #ddd'}
});

// 标题
var title = ui.Label({
  value: '🌾 作物产量预测分析平台',
  style: {fontWeight: 'bold', fontSize: '18px', margin: '0 0 10px 0', color: '#1B5E20'}
});

// 组件定义
var selectRegion = ui.Select({
  items: Object.keys(rois),
  value: appState.region,
  placeholder: '选择区域',
  onChange: function(v) { appState.region = v; }
});

var selectSat = ui.Select({
  items: ['Sentinel-2', 'Landsat 8', 'Landsat 9'],
  value: appState.satellite,
  onChange: function(v) { appState.satellite = v; }
});

var startDateBox = ui.Textbox({
  value: appState.startDate,
  placeholder: 'YYYY-MM-DD',
  onChange: function(v) { appState.startDate = v; }
});

var endDateBox = ui.Textbox({
  value: appState.endDate,
  placeholder: 'YYYY-MM-DD',
  onChange: function(v) { appState.endDate = v; }
});

var btnRun = ui.Button({
  label: '执行分析 / Run Analysis',
  style: {stretch: 'horizontal', color: '#555', border: '1px solid #ccc'},
  onClick: runAnalysis
});

// 结果展示容器
var resultPanel = ui.Panel({style: {margin: '15px 0'}});

// 布局组装
mainPanel.add(title);

mainPanel.add(ui.Label('1. 选择研究示范区 (Region):', {fontSize: '12px', color: '#666'}));
mainPanel.add(selectRegion);

mainPanel.add(ui.Label('2. 选择卫星数据源 (Satellite):', {fontSize: '12px', color: '#666'}));
mainPanel.add(selectSat);

mainPanel.add(ui.Label('3. 设置时间窗口 (YYYY-MM-DD):', {fontSize: '12px', color: '#666'}));
var datePanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal')});
datePanel.add(startDateBox);
datePanel.add(ui.Label('至', {margin: '8px 4px', fontSize: '12px'}));
datePanel.add(endDateBox);
mainPanel.add(datePanel);

mainPanel.add(ui.Label({value: ' ', style: {height: '5px'}})); // 间距
mainPanel.add(btnRun);

mainPanel.add(ui.Label('—————— 分析报告 ——————', {fontSize: '10px', color: '#999', margin: '15px 0 5px 0', textAlign: 'center', stretch: 'horizontal'}));
mainPanel.add(resultPanel);

// 将面板添加到地图根节点
ui.root.insert(0, mainPanel);

// 初始化运行
runAnalysis();

