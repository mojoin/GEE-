/**
 * @name Sentinel-2 水体叶绿素 a (Chl-a) 质量浓度反演工具
 * @description 基于 NDCI 算法的遥感监测系统
 */

// =================================================================
// 1. 系统配置与界面初始化
// =================================================================

// 设置初始地图样式
Map.style().set('cursor', 'crosshair');
Map.setCenter(120.15, 30.28, 12); // 默认定位（如：西湖/太湖区域）

// 创建控制面板
var panel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '350px', padding: '10px', border: '1px solid #ddd'}
});

var title = ui.Label({
  value: '🌊 水体叶绿素 a 监测系统',
  style: {fontSize: '20px', fontWeight: 'bold', color: '#0056b3', margin: '10px 0'}
});

var description = ui.Label('本工具基于 Sentinel-2 影像，利用 NDCI 指数反演水体叶绿素 a 浓度。支持动态监测、图表分析与数据导出。', 
  {fontSize: '13px', color: '#666'});

panel.add(title).add(description);

// =================================================================
// 2. 核心处理函数 (计算逻辑)
// =================================================================

/**
 * Sentinel-2 去云处理并保留属性
 */
function maskS2Clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
    .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  
  return image.updateMask(mask)
    .multiply(0.0001)
    .copyProperties(image, image.propertyNames());
}

/**
 * 水体掩膜 (使用 MNDWI)
 */
function getWaterMask(image) {
  return image.select('MNDWI').gt(0); 
}

/**
 * 叶绿素 a 反演算法 (NDCI) 与 指数计算
 */
function calculateIndices(image) {
  var ndci = image.normalizedDifference(['B5', 'B4']).rename('NDCI');
  var mndwi = image.normalizedDifference(['B3', 'B11']).rename('MNDWI');
  var chla = ndci.multiply(14.5).add(15.0).rename('Chla_conc'); 
  
  return image.addBands([ndci, mndwi, chla]);
}

// =================================================================
// 3. 交互控制组件
// =================================================================

var dateLabel = ui.Label('第一步：选择监测时间范围', {fontWeight: 'bold', margin: '10px 0 5px 0'});
var startDate = ui.Textbox({value: '2023-01-01', placeholder: 'YYYY-MM-DD', style: {width: '100px'}});
var endDate = ui.Textbox({value: '2023-12-31', placeholder: 'YYYY-MM-DD', style: {width: '100px'}});
var datePanel = ui.Panel([startDate, ui.Label('至'), endDate], ui.Panel.Layout.flow('horizontal'));

panel.add(dateLabel).add(datePanel);

var roiLabel = ui.Label('第二步：在地图上绘制/选择感兴趣区域 (ROI)', {fontWeight: 'bold'});
panel.add(roiLabel);

var runButton = ui.Button({
  label: '🚀 执行分析',
  onClick: runAnalysis,
  style: {width: '100%', color: '#d9534f'}
});
panel.add(runButton);

var chartPanel = ui.Panel({style: {margin: '10px 0'}});
panel.add(chartPanel);

// =================================================================
// 4. 主运行逻辑
// =================================================================

function runAnalysis() {
  chartPanel.clear();
  var roi = Map.drawingTools().layers().get(0) ? Map.drawingTools().layers().get(0).getEeObject() : Map.getBounds();
  
  if (!roi) {
    chartPanel.add(ui.Label('错误：请先在地图左侧使用绘图工具绘制一个区域！', {color: 'red'}));
    return;
  }

  var s2Col = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(roi)
    .filterDate(startDate.getValue(), endDate.getValue())
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(maskS2Clouds)
    .map(calculateIndices);

  s2Col.size().evaluate(function(count) {
    if (count === 0) {
      chartPanel.add(ui.Label('错误：没有找到影像，请调整时间或区域。', {color: 'red'}));
      return;
    }

    var medianImg = s2Col.median().clip(roi);
    var waterMask = getWaterMask(medianImg);
    var chlaFinal = medianImg.select('Chla_conc').updateMask(waterMask);

    var rgbVis = {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3};
    var chlaVis = {
      min: 0, 
      max: 50, 
      palette: ['#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000']
    };

    Map.layers().reset();
    Map.addLayer(medianImg, rgbVis, '1. 真彩色影像 (S2 RGB)');
    Map.addLayer(medianImg.select('MNDWI'), {min: -0.5, max: 0.5}, '2. 水体指数 (MNDWI)', false);
    Map.addLayer(chlaFinal, chlaVis, '3. 叶绿素 a 浓度 (mg/m³)');

    // 修复：将图表分辨率提高到 100m 以处理大区域，防止像素超限错误
    var chart = ui.Chart.image.series({
      imageCollection: s2Col.select('Chla_conc'),
      region: roi,
      reducer: ee.Reducer.mean(),
      scale: 100 // 提高 scale 可处理更大范围
    }).setOptions({
      title: '区域平均叶绿素 a 浓度变化趋势',
      hAxis: {title: '时间'},
      vAxis: {title: 'Chl-a (mg/m³)'},
      lineWidth: 2,
      pointSize: 4,
      series: {0: {color: '#228B22'}}
    });
    
    chartPanel.add(chart);

    // 修复：添加 bestEffort: true 并设置极大的 maxPixels 以应对大面积水域
    var stats = chlaFinal.reduceRegion({
      reducer: ee.Reducer.mean().combine(ee.Reducer.minMax(), '', true),
      geometry: roi,
      scale: 20,
      maxPixels: 1e13,
      bestEffort: true
    });

    stats.evaluate(function(result) {
      if (result && result.Chla_conc_mean !== null) {
        var statsLabel = ui.Label({
          value: '当前区域均值: ' + result.Chla_conc_mean.toFixed(2) + ' mg/m³',
          style: {fontSize: '15px', fontWeight: 'bold', color: '#333', backgroundColor: '#f0f0f0', padding: '8px'}
        });
        chartPanel.insert(0, statsLabel);
      }
    });

    var exportBtn = ui.Button({
      label: '💾 导出分析结果 (Google Drive)',
      onClick: function() {
        Export.image.toDrive({
          image: chlaFinal,
          description: 'Chla_Inversion_Result',
          scale: 20,
          region: roi,
          fileFormat: 'GeoTIFF',
          maxPixels: 1e13
        });
        print('导出任务已提交。');
      }
    });
    panel.add(exportBtn);
  });
}

/**
 * 优化后的图例：增强了字体大小和背景对比度
 */
function addLegend() {
  var legend = ui.Panel({
    style: {
      position: 'bottom-right', 
      padding: '10px 15px',
      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
      border: '1px solid #999',
      width: '200px'
    }
  });

  var legendTitle = ui.Label({
    value: 'Chl-a 浓度 (mg/m³)', 
    style: {
      fontWeight: 'bold', 
      fontSize: '16px', 
      margin: '0 0 10px 0',
      color: '#333'
    }
  });
  legend.add(legendTitle);

  var palette = ['#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF7F00', '#FF0000'];
  var labels = ['0 - 10 (极低)', '10 - 20 (低)', '20 - 30 (中)', '30 - 40 (较高)', '40 - 50 (高)', '50+ (极高)'];
  
  for (var i = 0; i < 6; i++) {
    var colorBox = ui.Label({
      style: {
        backgroundColor: palette[i], 
        padding: '10px', 
        margin: '0 0 5px 0',
        border: '0.5px solid #888'
      }
    });
    
    var description = ui.Label({
      value: labels[i], 
      style: {
        margin: '0 0 5px 10px',
        fontSize: '14px', 
        fontWeight: '500',
        color: '#444'
      }
    });
    
    var legendItem = ui.Panel([colorBox, description], ui.Panel.Layout.Flow('horizontal'));
    legend.add(legendItem);
  }
  Map.add(legend);
}

addLegend();
ui.root.insert(0, panel);

print('--- 操作指南 ---');
print('请在地图上绘制区域后点击“执行分析”。如果区域非常大，建议将日期范围缩小。');
