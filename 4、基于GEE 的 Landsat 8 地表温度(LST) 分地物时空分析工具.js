/**
 * GEE App: 基于 Landsat 8 的五类典型地表点 LST 时空变化分析
 * 作者: Gemini AI
 * 功能: 
 * 1. 自动利用 ESA WorldCover 提取 5 类地物 (森林, 建筑, 农田, 水体, 草地)。
 * 2. 计算 Landsat 8 地表温度 (LST)。
 * 3. 生成分地物的温度时序折线图。
 * 4. 支持导出指定月份的 LST 影像和时序数据。
 */

// =========================================
// 1. 初始化与数据源配置
// =========================================

// 默认区域：海淀 (支持用户手绘覆盖)
var defaultRoi = ee.FeatureCollection("projects/maxhecheng/assets/haidian");
var drawingTools = Map.drawingTools();

// 土地覆盖数据 (ESA WorldCover 2020)
var landcover = ee.ImageCollection("ESA/WorldCover/v100").first();

// 地物类别映射 (ESA WorldCover Value -> 自定义类别)
// 10: Trees (森林), 30: Grassland (草地), 40: Cropland (农田), 50: Built-up (建筑), 80: Water (水体)
var classNames = ['森林', '草地', '农田', '建筑', '水体'];
var classValues = [10, 30, 40, 50, 80];
var classColors = ['006400', '32CD32', 'FFD700', 'FF0000', '0000FF']; // 绿, 浅绿, 金, 红, 蓝

// LST 可视化参数
var lstVis = {
  min: 0,
  max: 50,
  palette: ['040274', '040281', '0502a3', '0502b8', '0502ce', '0502e6',
            '0602ff', '235cb1', '307ef3', '269db1', '30c8e2', '32d3ef',
            '3be285', '3ff38f', '86e26f', '3ae237', 'b5e22e', 'd6e21f',
            'fff705', 'ffd611', 'ffb613', 'ff8b13', 'ff6e08', 'ff500d',
            'ff0000', 'de0101', 'c21301', 'a71001', '911003']
};

// =========================================
// 2. 核心处理函数
// =========================================

// 获取分析区域 (优先使用手绘，否则使用默认 Asset)
function getAOI() {
  var layers = drawingTools.layers();
  if (layers.length() > 0 && layers.get(0).get('geometries').length() > 0) {
    return layers.get(0).toGeometry();
  }
  return defaultRoi.geometry();
}

// Landsat 8 去云与温度转换 (Kelvin -> Celsius)
function processLandsat(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(1 << 3).eq(0).and(qa.bitwiseAnd(1 << 4).eq(0)); // 去云和云影

  // ST_B10 是热红外波段
  // Scale: 0.00341802, Offset: 149.0
  // Celsius = Kelvin - 273.15
  var lst = image.select('ST_B10').multiply(0.00341802).add(149.0).subtract(273.15).rename('LST');

  return image.addBands(lst).updateMask(mask)
    .copyProperties(image, ['system:time_start']);
}

// 计算单景影像中 5 类地物的平均温度
function calculateClassStats(image, aoi) {
  var dict = {};
  
  // 遍历 5 个类别
  for (var i = 0; i < classValues.length; i++) {
    var val = classValues[i];
    var name = classNames[i];
    
    // 创建该类别的掩膜 (例如：只保留水体像素)
    var classMask = landcover.eq(val).clip(aoi);
    
    // 掩膜 LST 影像
    var maskedLst = image.select('LST').updateMask(classMask);
    
    // 计算该类别区域内的平均温度
    var mean = maskedLst.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: aoi,
      scale: 100, // 为了速度，采样率设为 100m，导出时可用 30m
      maxPixels: 1e9,
      bestEffort: true
    });
    
    // 将结果存入属性，属性名为类别名 (如 "LST_水体")
    // 使用 set 无法直接在 map 中动态设 key，需构造 Feature 或 Dictionary
    // 这里我们简单地返回带新属性的 Image
    var tempVal = mean.get('LST');
    image = image.set(name, tempVal); // 将温度值设为影像的一个属性
  }
  return image;
}

// =========================================
// 3. UI 界面布局
// =========================================

var panel = ui.Panel({style: {width: '400px', padding: '10px', backgroundColor: '#f9f9f9'}});
ui.root.insert(0, panel);

panel.add(ui.Label('Landsat 8 地表温度(LST) 分类时空分析', {fontSize: '20px', fontWeight: 'bold'}));
panel.add(ui.Label('基于 ESA WorldCover 自动提取：森林、建筑、农田、水体、草地', {fontSize: '11px', color: 'gray'}));

// 时间范围选择
var datePanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal')});
var startInput = ui.Textbox({value: '2023-01-01', style: {width: '90px'}});
var endInput = ui.Textbox({value: '2023-12-31', style: {width: '90px'}});
datePanel.add(ui.Label('分析时段: ')).add(startInput).add(ui.Label('-')).add(endInput);
panel.add(datePanel);

// 指定导出月份
var monthPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal')});
var monthInput = ui.Textbox({value: '2023-07', placeholder: 'YYYY-MM', style: {width: '100px'}});
monthPanel.add(ui.Label('指定分析/导出月份 (YYYY-MM): ')).add(monthInput);
panel.add(monthPanel);

// 运行按钮
var runBtn = ui.Button({
  label: '开始分析 (Run Analysis)',
  style: {stretch: 'horizontal', color: 'white', backgroundColor: '#4CAF50', margin: '15px 0'},
  onClick: runAnalysis
});
panel.add(runBtn);

// 结果容器
var chartPanel = ui.Panel({style: {height: '300px', margin: '10px 0'}});
var downloadPanel = ui.Panel();
panel.add(ui.Label('--- 温度时序分析 ---', {fontWeight: 'bold'}));
panel.add(chartPanel);
panel.add(ui.Label('--- 导出数据 ---', {fontWeight: 'bold'}));
panel.add(downloadPanel);

// =========================================
// 4. 主逻辑执行
// =========================================

function runAnalysis() {
  Map.layers().reset();
  chartPanel.clear();
  downloadPanel.clear();
  
  var aoi = getAOI();
  Map.centerObject(aoi, 11);
  
  // 显示 AOI
  Map.addLayer(ee.Image().byte().paint(aoi, 1, 2), {palette: 'black'}, '分析区域 (AOI)');
  
  // 显示地物分类图 (作为底图参考)
  var lcVis = {min: 10, max: 100, palette: ['006400', 'ffbb22', 'ffff4c', 'f096ff', 'fa0000', 'b4b4b4', 'f0f0f0', '0064c8', '0096a0', '00cf75', 'fae6a0']};
  Map.addLayer(landcover.clip(aoi), {}, '地物分类 (ESA)', false); // 默认隐藏

  var startDate = startInput.getValue();
  var endDate = endInput.getValue();
  var targetMonthStr = monthInput.getValue(); // "2023-07"

  // 1. 获取 Landsat 8 数据集
  var l8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
    .filterBounds(aoi)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUD_COVER', 50)) // 稍微放宽云量，后续会mask
    .map(processLandsat);

  // 2. 生成时间序列数据 (为每一景影像计算 5 类地物的均温)
  // 注意：map 循环计算统计值在大量数据下较慢，这是 GEE 机制限制
  var statsCollection = l8.map(function(img) {
    return calculateClassStats(img, aoi);
  });

  // 3. 绘制多系列折线图
  // chart.feature.byFeature 使用 FeatureCollection (ImageCollection 也是一种 FeatureCollection)
  // X轴: system:time_start, Y轴: 各个类别的属性值
  var chart = ui.Chart.feature.byFeature({
    features: statsCollection,
    xProperty: 'system:time_start',
    yProperties: classNames
  })
  .setChartType('LineChart')
  .setOptions({
    title: '不同地表覆盖类型的 LST 温度变化趋势',
    vAxis: {title: '地表温度 (°C)'},
    hAxis: {title: '日期', format: 'MM-yy'},
    series: {
      0: {color: classColors[0]}, // 森林
      1: {color: classColors[1]}, // 草地
      2: {color: classColors[2]}, // 农田
      3: {color: classColors[3]}, // 建筑
      4: {color: classColors[4]}  // 水体
    },
    interpolateNulls: true, // 连接断点
    pointSize: 3
  });
  
  chartPanel.add(chart);
  
  // 4. 处理指定月份的数据 (用于地图展示和导出)
  var parts = targetMonthStr.split('-');
  var year = parseInt(parts[0]);
  var month = parseInt(parts[1]);
  
  // 筛选该月数据并合成
  var monthlyCol = l8.filter(ee.Filter.calendarRange(year, year, 'year'))
                     .filter(ee.Filter.calendarRange(month, month, 'month'));
                     
  monthlyCol.size().evaluate(function(count) {
    if (count === 0) {
      downloadPanel.add(ui.Label('⚠️ 指定月份 (' + targetMonthStr + ') 无可用影像，无法导出该月地图。', {color: 'orange'}));
    } else {
      var monthlyImg = monthlyCol.mean().select('LST').clip(aoi);
      
      // 添加到地图
      Map.addLayer(monthlyImg, lstVis, 'LST 均值 (' + targetMonthStr + ')');
      
      // 添加导出按钮
      var exportBtn = ui.Button({
        label: '🚀 导出 ' + targetMonthStr + ' LST 影像 (GeoTIFF)',
        style: {color: 'blue'},
        onClick: function() {
          Export.image.toDrive({
            image: monthlyImg,
            description: 'LST_Analysis_' + targetMonthStr + '_Haidian',
            scale: 30,
            region: aoi,
            maxPixels: 1e9,
            fileFormat: 'GeoTIFF'
          });
          downloadPanel.add(ui.Label('✅ 影像导出任务已创建 (Tasks)', {color: 'green', fontSize: '11px'}));
        }
      });
      downloadPanel.add(exportBtn);
    }
    
    // 提示如何导出表格
    downloadPanel.add(ui.Label('提示: 点击图表右上角的 "↗" 箭头可导出 CSV 时间序列数据。', {fontSize: '11px', color: '#666'}));
  });
}

// 绘制图例
var legend = ui.Panel({style: {position: 'bottom-left', padding: '8px 15px'}});
legend.add(ui.Label('地物分类', {fontWeight: 'bold', fontSize: '12px'}));
for (var i = 0; i < classNames.length; i++) {
  var row = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'), style: {margin: '0 0 4px 0'}});
  row.add(ui.Label({style: {backgroundColor: '#' + classColors[i], padding: '8px', margin: '0 4px 0 0', width: '20px'}}));
  row.add(ui.Label(classNames[i], {fontSize: '12px'}));
  legend.add(row);
}
Map.add(legend);