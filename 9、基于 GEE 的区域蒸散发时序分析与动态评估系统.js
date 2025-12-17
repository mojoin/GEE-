// ===========================================================================
// [完美版] GEE 区域ET监测系统 (含动态图例 + 投影修复 + 稳定UI)
// ===========================================================================

// ---------------------------------------------------------------------------
// 1. 全局变量与配置
// ---------------------------------------------------------------------------

var regionOfInterest = null; 
var currentLegend = null; // 用于存储当前的图例面板，以便刷新时移除旧的

var DATA_CONFIG = {
  'MOD16A2 (MODIS全球ET)': {
    collectionId: 'MODIS/061/MOD16A2GF', 
    bands: { 'ET': 'ET', 'PET': 'PET' },
    scaleFactor: 0.1, 
    unit: 'mm/8days', // 单位
    visParams: {min: 0, max: 60, palette: ['#d73027', '#f46d43', '#fdae61', '#fee090', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4'].reverse()}
  },
  'PML_V2 (高精度ET及组分)': {
    collectionId: 'CAS/IGSNRR/PML/V2_v018',
    bands: { 'ET_water': 'ET_water', 'Ec': 'Ec', 'Es': 'Es', 'Ei': 'Ei', 'GPP': 'GPP' },
    scaleFactor: 1.0, 
    unit: 'mm/8days',
    visParams: {min: 0, max: 60, palette: ['#d73027', '#f46d43', '#fdae61', '#fee090', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4'].reverse()}
  }
};

var COMMON_PALETTE = ['#d73027', '#f46d43', '#fdae61', '#fee090', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4'].reverse();

// ---------------------------------------------------------------------------
// 2. UI 面板构建
// ---------------------------------------------------------------------------

var mainPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {width: '360px', padding: '8px', border: '1px solid black'}
});

mainPanel.add(ui.Label({
  value: '区域ET监测系统 (图例增强版)',
  style: {fontWeight: 'bold', fontSize: '20px', margin: '10px 0'}
}));

// --- A. 区域加载 ---
mainPanel.add(ui.Label('1. 区域选择 (Assets矢量):', {fontWeight: 'bold'}));
var assetInput = ui.Textbox({placeholder: '输入Table ID (如: users/name/city)', style: {width: '95%'}});
var loadStatus = ui.Label('', {fontSize: '11px', margin: '4px 0'}); 

var loadAssetBtn = ui.Button({
  label: '加载并修复区域几何',
  style: {width: '95%', color: 'green'},
  onClick: function() {
    var assetId = assetInput.getValue();
    if (!assetId) { loadStatus.setValue('错误: 请先输入 ID'); return; }
    loadStatus.setValue('正在处理几何...');
    
    ee.FeatureCollection(assetId).geometry().simplify(100).evaluate(function(geom, error) {
      if (error) {
        loadStatus.setValue('加载失败: ' + error);
        loadStatus.style().set('color', 'red');
      } else {
        regionOfInterest = ee.Geometry(geom);
        Map.centerObject(regionOfInterest);
        Map.layers().reset();
        Map.addLayer(regionOfInterest, {color: 'red'}, 'ROI (已简化)', true, 0.5);
        if (currentLegend) Map.remove(currentLegend); // 清除旧图例
        loadStatus.setValue('成功: 区域已加载。');
        loadStatus.style().set('color', 'green');
      }
    });
  }
});

mainPanel.add(assetInput);
mainPanel.add(loadAssetBtn);
mainPanel.add(loadStatus);

// --- B. 参数选择 ---
mainPanel.add(ui.Label('2. 时间与数据:', {fontWeight: 'bold'}));
var startDateSlider = ui.DateSlider({start: '2001-01-01', end: '2023-12-31', value: '2022-01-01', period: 1, style: {width: '95%'}});
mainPanel.add(startDateSlider);
var endDateSlider = ui.DateSlider({start: '2001-01-01', end: '2023-12-31', value: '2022-06-30', period: 1, style: {width: '95%'}});
mainPanel.add(endDateSlider);

var bandSelect = ui.Select({items: [], placeholder: '请先选择数据源', style: {width: '95%'}});
var dataSourceSelect = ui.Select({items: Object.keys(DATA_CONFIG), placeholder: '选择数据集', value: null, style: {width: '95%'}});

var updateBands = function(key) {
  if (!key) return;
  var bandsObj = DATA_CONFIG[key].bands;
  var bandNames = Object.keys(bandsObj);
  bandSelect.items().reset(bandNames);
  bandSelect.setValue(bandNames[0]);
};
dataSourceSelect.onChange(updateBands);
dataSourceSelect.setValue('MOD16A2 (MODIS全球ET)'); 

mainPanel.add(dataSourceSelect);
mainPanel.add(bandSelect);

// --- C. 按钮 ---
mainPanel.add(ui.Label('3. 分析操作:', {fontWeight: 'bold'}));
var btnPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'), style: {width: '100%'}});
var runAnalysisBtn = ui.Button({label: '执行分析', style: {width: '48%'}, onClick: runAnalysis});
var runGifBtn = ui.Button({label: '生成动图', style: {width: '48%'}, onClick: generateAnimation});
btnPanel.add(runAnalysisBtn);
btnPanel.add(runGifBtn);
mainPanel.add(btnPanel);

var resultsPanel = ui.Panel({style: {margin: '10px 0', borderTop: '1px solid #ddd'}});
mainPanel.add(resultsPanel);

ui.root.insert(0, mainPanel);


// ---------------------------------------------------------------------------
// 3. 辅助功能：创建图例
// ---------------------------------------------------------------------------

function updateLegend(visParams, title, unit) {
  // 如果已有图例，先移除
  if (currentLegend) {
    Map.remove(currentLegend);
  }

  // 创建渐变色条影像
  var legendImage = ee.Image.pixelLonLat().select(0);

  // 创建渐变色条组件
  var gradientBar = ui.Thumbnail({
    image: legendImage.visualize({min: 0, max: 1, palette: visParams.palette}),
    params: {bbox: [0, 0, 1, 0.1], dimensions: '100x12', format: 'png'},
    style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '20px'}
  });

  // 创建标签
  var legendLabels = ui.Panel({
    widgets: [
      ui.Label(visParams.min, {margin: '4px 8px'}),
      ui.Label((visParams.max + visParams.min) / 2, {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}),
      ui.Label(visParams.max, {margin: '4px 8px'})
    ],
    layout: ui.Panel.Layout.flow('horizontal')
  });

  var legendTitle = ui.Label({
    value: title + ' (' + unit + ')',
    style: {fontWeight: 'bold', fontSize: '12px', margin: '5px 0 0 5px'}
  });

  var panel = ui.Panel({
    widgets: [legendTitle, gradientBar, legendLabels],
    style: {position: 'bottom-left', padding: '8px 15px', backgroundColor: 'rgba(255, 255, 255, 0.8)'}
  });

  currentLegend = panel;
  Map.add(panel);
}


// ---------------------------------------------------------------------------
// 4. 核心功能函数
// ---------------------------------------------------------------------------

function getParams() {
  if (!regionOfInterest) { alert('请先加载区域！'); return null; }
  var sName = dataSourceSelect.getValue();
  var bName = bandSelect.getValue();
  if (!sName || !bName) return null;
  var conf = DATA_CONFIG[sName];
  return {
    region: regionOfInterest,
    conf: conf,
    bandId: conf.bands[bName],
    bandName: bName,
    start: startDateSlider.getValue()[0],
    end: endDateSlider.getValue()[0]
  };
}

function processCol(p) {
  return ee.ImageCollection(p.conf.collectionId)
    .filterDate(p.start, p.end)
    .filterBounds(p.region)
    .select(p.bandId)
    .map(function(img) {
      // 强制重投影为 WGS84，解决投影报错
      var reprojectedImg = img.reproject({crs: 'EPSG:4326', scale: 500});
      return reprojectedImg.multiply(p.conf.scaleFactor).copyProperties(img, ['system:time_start']);
    });
}

function runAnalysis() {
  var p = getParams();
  if (!p) return;
  
  resultsPanel.clear();
  resultsPanel.add(ui.Label('正在计算并生成图例...', {color: 'gray'}));
  
  Map.layers().reset();
  Map.addLayer(p.region, {color:'red'}, 'ROI', true, 0.3);

  var col = processCol(p);
  var meanImg = col.mean(); 
  
  // 动态调整可视化参数
  var vis = p.conf.visParams;
  var unit = p.conf.unit;
  
  if (p.bandId === 'GPP') {
    vis = {min: 0, max: 100, palette: COMMON_PALETTE};
    unit = 'gC/m²/8day'; // GPP 单位特殊处理
  }
  
  Map.addLayer(meanImg.clip(p.region), vis, p.bandName + ' Mean');

  // *** 调用图例生成函数 ***
  updateLegend(vis, p.bandName, unit);

  // 图表
  var chart = ui.Chart.image.series({
    imageCollection: col,
    region: p.region,
    reducer: ee.Reducer.mean(),
    scale: 500, 
    xProperty: 'system:time_start'
  }).setOptions({
    title: p.bandName + ' 时序变化',
    vAxis: {title: '数值 (' + unit + ')'},
    lineWidth: 2, pointSize: 3
  });
  
  resultsPanel.clear();
  resultsPanel.add(chart);
  
  // 下载
  resultsPanel.add(ui.Label('下载链接:', {fontWeight: 'bold'}));
  var urlLabel = ui.Label('生成中...');
  resultsPanel.add(urlLabel);
  
  meanImg.getDownloadURL({
    name: p.bandId + '_Mean',
    crs: 'EPSG:4326', 
    scale: 1000,
    region: p.region
  }, function(url) {
    urlLabel.setValue('点击下载 GeoTIFF');
    urlLabel.setUrl(url);
  });
}

function generateAnimation() {
  var p = getParams();
  if (!p) return;
  
  resultsPanel.clear();
  resultsPanel.add(ui.Label('正在生成动图...', {color: 'blue'}));

  var col = processCol(p);
  var vis = p.conf.visParams;
  var unit = p.conf.unit;
  if (p.bandId === 'GPP') {
    vis = {min: 0, max: 100, palette: COMMON_PALETTE};
    unit = 'gC/m²/8day';
  }
  
  // 动图时也更新图例，方便查看
  updateLegend(vis, p.bandName, unit);

  var rgbCol = col.map(function(img) {
    return img.visualize(vis).clip(p.region);
  });

  var gifParams = {
    region: p.region,
    dimensions: 500,
    crs: 'EPSG:3857', 
    framesPerSecond: 4
  };

  rgbCol.getVideoThumbURL(gifParams, function(url) {
    resultsPanel.clear();
    resultsPanel.add(ui.Label('动图生成成功:', {fontWeight:'bold'}));
    
    var thumb = ui.Thumbnail({
      image: rgbCol,
      params: gifParams,
      style: {width: '280px', height: 'auto', margin: '0 auto'}
    });
    resultsPanel.add(thumb);
    
    var link = ui.Label('点击下载 GIF 文件', {color: 'blue', textDecoration: 'underline'});
    link.setUrl(url);
    resultsPanel.add(link);
  });
}

Map.setOptions('SATELLITE');