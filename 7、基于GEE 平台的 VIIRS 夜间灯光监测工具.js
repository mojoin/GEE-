/**
 * VIIRS 夜间灯光监测 (下载增强版)
 * 特性：自定义时间 | 动图直接下载 | 数据批量导出到 Drive
 */

// ======================= 1. 核心数据准备 =======================

var roi = ee.FeatureCollection("projects/maxhecheng/assets/chengdu");

// VIIRS 基础集合
var rawColl = ee.ImageCollection("NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG")
  .select('avg_rad'); 

Map.centerObject(roi, 8);
Map.setOptions('HYBRID');

// 全局变量
var app = {
  startYear: 2018,
  endYear: 2023,
  currentLayerYear: 2018
};


// ======================= 2. UI 框架搭建 =======================

var panel = ui.Panel({
  style: {width: '400px', padding: '10px', position: 'top-left'}
});
ui.root.insert(0, panel);

panel.add(ui.Label('🌃 VIIRS 灯光数据浏览', {fontWeight: 'bold', fontSize: '20px'}));


// ======================= 3. 时间范围设置区 =======================

var configPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('horizontal'),
  style: {border: '1px solid #ddd', padding: '5px', margin: '10px 0'}
});

var startInput = ui.Textbox({
  value: app.startYear.toString(),
  placeholder: '开始年份',
  style: {width: '60px', margin: '0 5px'}
});

var endInput = ui.Textbox({
  value: app.endYear.toString(),
  placeholder: '结束年份',
  style: {width: '60px', margin: '0 5px'}
});

var updateBtn = ui.Button({
  label: '🔄 更新并刷新',
  onClick: function() {
    var s = parseInt(startInput.getValue());
    var e = parseInt(endInput.getValue());
    if (s && e && s <= e) {
      app.startYear = s;
      app.endYear = e;
      refreshApp(); // 触发刷新
    } else {
      alert('请输入有效的年份范围');
    }
  },
  style: {margin: '0 10px', color: 'blue'}
});

panel.add(ui.Label('1. 设置时间范围 (支持2012-至今)', {fontWeight: 'bold'}));
configPanel.add(ui.Label('范围:'));
configPanel.add(startInput);
configPanel.add(ui.Label('至'));
configPanel.add(endInput);
configPanel.add(updateBtn);
panel.add(configPanel);


// ======================= 4. 滑块控制区 =======================

panel.add(ui.Label('2. 年份选择 (加载数据)', {fontWeight: 'bold', margin: '15px 0 5px 0'}));

var yearSlider = ui.Slider({
  min: app.startYear, max: app.endYear, value: app.startYear, step: 1,
  style: {width: '90%'},
  onChange: function(y) { loadYearData(y); }
});
panel.add(yearSlider);

panel.add(ui.Label('3. 月份切换 (快速浏览)', {fontWeight: 'bold', margin: '15px 0 5px 0'}));
var monthSlider = ui.Slider({
  min: 1, max: 12, value: 1, step: 1,
  style: {width: '90%'},
  onChange: function(m) { updateVisibleLayer(m); }
});
panel.add(monthSlider);


// ======================= 5. 图表区 =======================

panel.add(ui.Label('4. 趋势分析 (点击跳转)', {fontWeight: 'bold', margin: '20px 0 5px 0'}));
var chartPanel = ui.Panel();
panel.add(chartPanel);


// ======================= 6. 数据导出区 (新增) =======================

panel.add(ui.Label('5. 数据下载 (导出到 Tasks)', {fontWeight: 'bold', margin: '20px 0 5px 0'}));
panel.add(ui.Label('提示: 点击按钮后，请去右侧 Tasks 面板点击 Run', {fontSize: '11px', color: 'gray'}));

// 导出当前年份按钮
var btnExportCurrent = ui.Button({
  label: '📥 导出当前选中年份的所有月度数据',
  onClick: function() {
    var y = yearSlider.getValue();
    var col = rawColl.filterDate(y + '-01-01', (y + 1) + '-01-01');
    var size = col.size().getInfo();
    
    if (size === 0) { alert(y + '年没有数据'); return; }
    
    var list = col.toList(size);
    for (var i = 0; i < size; i++) {
      var img = ee.Image(list.get(i)).clip(roi);
      var date = img.date().format('YYYY_MM').getInfo();
      
      Export.image.toDrive({
        image: img,
        description: 'VIIRS_' + date,
        scale: 500,
        region: roi.geometry(),
        crs: 'EPSG:4326',
        folder: 'VIIRS_Export_' + y
      });
    }
    alert('已为 ' + y + ' 年创建 ' + size + ' 个导出任务，请查看 Tasks 面板。');
  },
  style: {width: '95%'}
});
panel.add(btnExportCurrent);

// 导出均值按钮
var btnExportMean = ui.Button({
  label: '📥 导出整个时段的平均值图',
  onClick: function() {
    var img = rawColl.filterDate(app.startYear + '-01-01', (app.endYear + 1) + '-01-01')
      .mean()
      .clip(roi);
      
    Export.image.toDrive({
      image: img,
      description: 'VIIRS_Mean_' + app.startYear + '_' + app.endYear,
      scale: 500,
      region: roi.geometry(),
      crs: 'EPSG:4326',
      folder: 'VIIRS_Export_Mean'
    });
    alert('均值图导出任务已创建，请查看 Tasks 面板。');
  },
  style: {width: '95%', color: 'green'}
});
panel.add(btnExportMean);


// ======================= 7. 核心逻辑函数 =======================

// --- 逻辑A: 切换月份可见性 ---
function updateVisibleLayer(monthIndex) {
  var layers = Map.layers();
  var count = layers.length();
  for (var i = 1; i < count; i++) {
    var layer = layers.get(i);
    layer.setShown(i === monthIndex);
  }
}

// --- 逻辑B: 加载特定年份数据 (含修复) ---
function loadYearData(year) {
  app.currentLayerYear = year;
  Map.layers().reset();
  
  Map.addLayer(roi, {color: 'red', fillColor: '00000000'}, '🔴 研究区 ROI');
  print('正在加载 ' + year + ' 年数据...');
  
  var yearCol = rawColl.filterDate(year + '-01-01', (year + 1) + '-01-01');
  
  yearCol.toList(12).evaluate(function(imgs) {
    if (!imgs || imgs.length === 0) {
      print('⚠️ ' + year + ' 年无数据');
      return;
    }
    
    imgs.forEach(function(imgInfo, index) {
      // 强制 Select 修复报错
      var img = ee.Image(imgInfo.id).select('avg_rad').clip(roi); 
      var layerName = year + '年' + (index + 1) + '月';
      var visParams = {
        min: 0, max: 60, 
        palette: ['black', 'purple', 'cyan', 'green', 'yellow', 'white']
      };
      
      var currentMonthVal = monthSlider.getValue();
      Map.addLayer(img, visParams, layerName, (index + 1) === currentMonthVal);
    });
    
    print(year + ' 年加载完成。');
  });
}

// --- 逻辑C: 点击图表跳转 ---
var onChartClick = function(xValue, yValue, seriesName) {
  if (!xValue) return;
  var date = new Date(xValue);
  var clickYear = date.getFullYear();
  var clickMonth = date.getMonth() + 1;
  
  if (clickYear !== yearSlider.getValue()) {
    yearSlider.setValue(clickYear);
  }
  monthSlider.setValue(clickMonth);
};

// --- 逻辑D: 全局刷新 ---
function refreshApp() {
  yearSlider.setMin(app.startYear);
  yearSlider.setMax(app.endYear);
  yearSlider.setValue(app.startYear);
  
  chartPanel.clear();
  var chart = ui.Chart.image.series({
    imageCollection: rawColl.filterDate(app.startYear + '-01-01', (app.endYear + 1) + '-01-01'),
    region: roi,
    reducer: ee.Reducer.mean(),
    scale: 1000
  }).setOptions({
    title: '区域均值 (' + app.startYear + '-' + app.endYear + ')',
    vAxis: {title: '辐射值'},
    legend: {position: 'none'},
    lineWidth: 1,
    pointSize: 3,
    colors: ['red'],
    height: '200px'
  });
  chart.onClick(onChartClick);
  chartPanel.add(chart);
  
  updateGif();
  loadYearData(app.startYear);
}

// --- 逻辑E: 更新动图与下载链接 ---
var gifContainer = ui.Panel({
  style: {position: 'bottom-right', padding: '0px', backgroundColor: 'white'}
});
Map.add(gifContainer);

function updateGif() {
  gifContainer.clear();
  var visParams = {min: 0, max: 60, palette: ['black', 'purple', 'cyan', 'green', 'yellow', 'white']};
  var gifParams = {region: roi.geometry(), dimensions: 250, framesPerSecond: 4, crs: 'EPSG:3857'};
  
  var gifCol = rawColl.filterDate(app.startYear + '-01-01', (app.endYear + 1) + '-01-01');
  
  // 1. 生成动图 Visual
  var rgbVis = gifCol.map(function(img) { return img.visualize(visParams).clip(roi); });
  
  // 2. 显示动图
  gifContainer.add(ui.Label('预览: ' + app.startYear + '-' + app.endYear, {fontSize:'10px', fontWeight:'bold', margin:'2px'}));
  gifContainer.add(ui.Thumbnail({image: rgbVis, params: gifParams, style: {height: '200px', width: '200px'}}));
  
  // 3. 生成并显示下载链接 (URL)
  // 注意：getVideoThumbURL 是异步生成的，如果是大区域可能会比较慢
  var url = rgbVis.getVideoThumbURL(gifParams);
  
  gifContainer.add(ui.Label({
    value: '⬇️ 点击下载 .gif 动图',
    style: {
      color: 'blue', 
      fontWeight: 'bold', 
      textDecoration: 'underline', 
      margin: '5px 0 5px 0',
      textAlign: 'center',
      width: '200px'
    },
    targetUrl: url
  }));
}

// ======================= 8. 启动程序 =======================
refreshApp();
