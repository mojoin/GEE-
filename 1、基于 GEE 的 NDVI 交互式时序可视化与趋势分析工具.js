/**
 * 基于 GEE 的 NDVI 交互式时序可视化与趋势分析工具
 * 修改版：使用自定义 Asset 边界
 */

// --- 1. 参数设置 ---
var startDate = '2015-01-01';
var endDate = '2023-12-31';

// 【修改点 1】加载你的自定义 Asset 边界
// 请确保该路径在你的 Assets 选项卡中真实存在且有读取权限
var table = ee.FeatureCollection("projects/maxhecheng/assets/TPBoundary_HF");
var aoi = table.geometry(); 

// 让地图中心自动定位到你的边界
Map.centerObject(aoi);

// --- 2. 核心函数 (保持不变) ---

// 2.1 Landsat 8 去云与缩放因子校正函数
function preprocessL8(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(1 << 3).eq(0)
    .and(qa.bitwiseAnd(1 << 4).eq(0));
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  return image.addBands(opticalBands, null, true).updateMask(mask);
}

// 2.2 计算 NDVI 函数
function addNDVI(image) {
  var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
  return image.addBands(ndvi).copyProperties(image, ['system:time_start']);
}

// --- 3. 数据加载与处理 ---

var l8Col = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  // 【修改点 2】这里不再使用 Map.getBounds()，而是直接过滤你的 aoi 范围
  .filterBounds(aoi) 
  .filterDate(startDate, endDate)
  .map(preprocessL8)
  .map(addNDVI);

// --- 4. 空间趋势分析 (Linear Regression) ---

var collectionForTrend = l8Col.map(function(image) {
  var date = image.date();
  var years = date.difference(ee.Date('1970-01-01'), 'year');
  return image.addBands(ee.Image(years).rename('t').float());
});

var trend = collectionForTrend.select(['t', 'NDVI'])
  .reduce(ee.Reducer.linearFit());

// --- 5. 地图可视化 ---

Map.setOptions('HYBRID');

// 【修改点 3】裁剪结果，让图层只显示在你的边界形状内，而不是矩形
var ndviMean = l8Col.select('NDVI').mean().clip(aoi); 
var ndviVis = {min: 0, max: 0.8, palette: ['white', 'yellow', 'green', 'darkgreen']};

// 添加边界轮廓 (空心)，方便查看范围
Map.addLayer(ee.Image().paint(table, 0, 2), {palette: 'red'}, 'Boundary Outline');

Map.addLayer(ndviMean, ndviVis, 'NDVI Mean (Avg)', false);

// 同样对趋势图进行裁剪
var slopeVis = {min: -0.05, max: 0.05, palette: ['red', 'white', 'green']};
Map.addLayer(trend.select('scale').clip(aoi), slopeVis, 'NDVI Trend Slope');

// --- 6. 构建交互式 UI 面板 (保持不变) ---

var panel = ui.Panel();
panel.style().set({width: '400px', position: 'bottom-right'});
Map.add(panel);

var title = ui.Label({value: 'NDVI 时序分析工具', style: {fontSize: '20px', fontWeight: 'bold'}});
panel.add(title);
panel.add(ui.Label('点击地图任意位置查看该点的 NDVI 变化趋势。'));

Map.onClick(function(coords) {
  var point = ee.Geometry.Point(coords.lon, coords.lat);
  panel.widgets().set(2, ui.Label('正在计算图表...'));
  
  var dot = ui.Map.Layer(point, {color: 'red'}, 'Selected Point');
  Map.layers().set(3, dot); // 注意这里变成了set(3)，因为我们在前面加了一个边界图层

  var chart = ui.Chart.image.series({
    imageCollection: l8Col.select('NDVI'),
    region: point,
    reducer: ee.Reducer.mean(),
    scale: 30
  }).setOptions({
    title: 'NDVI 变化 (2015-2023)',
    vAxis: {title: 'NDVI', viewWindow: {min: -0.2, max: 1}},
    lineWidth: 1,
    pointSize: 3,
    trendlines: { 0: {type: 'linear', color: 'red', visibleInLegend: true} }
  });

  panel.widgets().set(2, chart);
});

Map.style().set('cursor', 'crosshair');