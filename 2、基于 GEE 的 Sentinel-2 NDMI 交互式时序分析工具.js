/**
 * GEE App: NDMI 分析工具 (含导出功能)
 * 更新: 增加 Export to Drive 按钮，便于在 QGIS 中制作带图例的专题图
 */

// =========================================
// 1. 初始化与数据加载
// =========================================

var table = ee.FeatureCollection("projects/maxhecheng/assets/haidian");

Map.centerObject(table, 11); 
Map.style().set('cursor', 'crosshair');

var empty = ee.Image().byte();
var outline = empty.paint({
  featureCollection: table,
  color: 1,
  width: 2
});
Map.addLayer(outline, {palette: 'FF0000'}, '默认区域 (海淀)');

var ndmiVis = {
  min: -0.6,
  max: 0.6,
  palette: ['d7191c', 'fdae61', 'ffffbf', 'a6d96a', '1a9641']
};

function maskS2clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000).copyProperties(image, ['system:time_start']);
}

function addNDMI(image) {
  var ndmi = image.normalizedDifference(['B8', 'B11']).rename('NDMI');
  return image.addBands(ndmi).copyProperties(image, ['system:time_start']);
}

// =========================================
// 2. UI 界面布局
// =========================================

var panel = ui.Panel({
  style: {width: '350px', padding: '10px', backgroundColor: '#f5f5f5'}
});
ui.root.insert(0, panel);

panel.add(ui.Label({
  value: 'NDMI 区域水分监测',
  style: {fontSize: '20px', fontWeight: 'bold', margin: '10px 0'}
}));

panel.add(ui.Label('默认分析区域：projects/maxhecheng/assets/haidian', 
    {fontSize: '11px', color: 'gray', margin: '0 0 10px 0'}));

// 时间输入
var startDatePanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal')});
startDatePanel.add(ui.Label('开始日期:', {margin: '8px 8px 0 0'}));
var startInput = ui.Textbox({value: '2023-01-01', style: {width: '120px'}});
startDatePanel.add(startInput);

var endDatePanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal')});
endDatePanel.add(ui.Label('结束日期:', {margin: '8px 8px 0 0'}));
var endInput = ui.Textbox({value: '2023-12-31', style: {width: '120px'}});
endDatePanel.add(endInput);

panel.add(startDatePanel).add(endDatePanel);

var drawingTools = Map.drawingTools();
drawingTools.setShown(true);
while (drawingTools.layers().length() > 0) {
  var layer = drawingTools.layers().get(0);
  drawingTools.layers().remove(layer);
}
var dummyGeometry = ui.Map.GeometryLayer({geometries: null, name: 'geometry', color: 'red'});
drawingTools.layers().add(dummyGeometry);

// =========================================
// 3. 核心分析逻辑 (含导出)
// =========================================

var chartPanel = ui.Panel({style: {height: '250px', margin: '10px 0'}});
var imageInfoPanel = ui.Panel({style: {margin: '10px 0'}});
var downloadPanel = ui.Panel({style: {margin: '10px 0'}});

var runButton = ui.Button({
  label: '运行分析 (Run Analysis)',
  style: {stretch: 'horizontal', color: 'white', backgroundColor: '#4CAF50', margin: '20px 0'},
  onClick: function() {
    runAnalysis();
  }
});
panel.add(runButton);
panel.add(ui.Label('--- 分析结果 ---', {fontWeight: 'bold'}));
panel.add(imageInfoPanel).add(chartPanel).add(downloadPanel);

function clearResults() {
  chartPanel.clear();
  imageInfoPanel.clear();
  downloadPanel.clear();
  Map.layers().reset();
  Map.addLayer(outline, {palette: 'FF0000'}, '默认区域 (海淀)');
}

function runAnalysis() {
  clearResults();
  
  var aoi;
  var layer = drawingTools.layers().get(0);
  var geometries = layer.geometries(); 
  
  if (geometries.length() > 0) {
    aoi = layer.toGeometry();
    imageInfoPanel.add(ui.Label('正在分析：用户绘制区域', {color: 'blue'}));
  } else {
    aoi = table.geometry(); 
    imageInfoPanel.add(ui.Label('正在分析：默认区域 (上传 Asset)', {color: 'blue'}));
  }

  var start = startInput.getValue();
  var end = endInput.getValue();

  var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(aoi)
    .filterDate(start, end)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
    .map(maskS2clouds)
    .map(addNDMI);

  s2.size().evaluate(function(count) {
    if (count === 0) {
      imageInfoPanel.add(ui.Label('❌ 无可用图像。', {color: 'red'}));
      return;
    }

    var composite = s2.select('NDMI').median().clip(aoi);
    
    Map.centerObject(aoi); 
    Map.addLayer(composite, ndmiVis, 'NDMI 中值合成');

    var chart = ui.Chart.image.series({
      imageCollection: s2.select('NDMI'),
      region: aoi,
      reducer: ee.Reducer.mean(),
      scale: 30, 
      xProperty: 'system:time_start'
    })
    .setOptions({
      title: '区域平均 NDMI 趋势',
      vAxis: {title: 'NDMI', viewWindow: {min: -0.5, max: 0.6}},
      legend: {position: 'none'},
      lineWidth: 2,
      pointSize: 3
    });
    
    chartPanel.add(chart);
    imageInfoPanel.add(ui.Label('图像数量: ' + count));

    // --- 导出部分 1: 快速预览图 (无图例) ---
    var thumbParams = {
      min: -0.6, max: 0.6,
      palette: ['d7191c', 'fdae61', 'ffffbf', 'a6d96a', '1a9641'],
      dimensions: 1000,
      region: aoi,
      format: 'png'
    };
    var url = composite.getThumbURL(thumbParams);
    
    downloadPanel.add(ui.Label('下载选项:', {fontWeight: 'bold'}));
    downloadPanel.add(ui.Label({
      value: '1. 📥 下载预览图 (PNG, 无图例)',
      style: {color: 'blue', textDecoration: 'underline'},
      targetUrl: url
    }));
    
    // --- 导出部分 2: Export to Drive (为了 QGIS 出图) ---
    var exportBtn = ui.Button({
      label: '2. 🚀 创建导出任务 (GeoTIFF)',
      style: {color: 'black', margin: '5px 0'},
      onClick: function() {
        // 创建导出任务
        Export.image.toDrive({
          image: composite,
          description: 'NDMI_Export_' + start + '_' + end,
          scale: 10, // Sentinel-2 分辨率
          region: aoi,
          maxPixels: 1e9,
          fileFormat: 'GeoTIFF'
        });
        downloadPanel.add(ui.Label('✅ 任务已创建! 请去右侧 "Tasks" 栏点击 Run。', {color: 'green', fontSize: '10px'}));
      }
    });
    downloadPanel.add(exportBtn);
    downloadPanel.add(ui.Label('提示: 若需带图例的专业图，请下载 GeoTIFF 后在 QGIS 中制作，或直接使用截图工具 (Win+Shift+S)。', {fontSize: '10px', color: 'gray'}));
  });
}

// =========================================
// 4. 图例
// =========================================
var legend = ui.Panel({style: {position: 'bottom-right', padding: '8px 15px'}});
legend.add(ui.Label('NDMI 图例', {fontWeight: 'bold', fontSize: '16px'}));
var palette = ndmiVis.palette;
var names = ['干旱', '较干', '正常', '较湿', '湿润'];
for (var i = 0; i < names.length; i++) {
  var row = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'), style: {margin: '0 0 4px 0'}});
  row.add(ui.Label({style: {backgroundColor: palette[i], padding: '8px', margin: '0 4px 0 0', width: '30px'}}));
  row.add(ui.Label(names[i]));
  legend.add(row);
}
Map.add(legend);