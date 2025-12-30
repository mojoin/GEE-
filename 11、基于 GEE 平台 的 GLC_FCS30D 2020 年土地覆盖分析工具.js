// ===============================================================
// GLC_FCS30D 2020年 土地覆盖分析工具
// ===============================================================

// 1. 数据源初始化：GLC_FCS30D annual 瓦片拼接
var dataset = ee.ImageCollection("projects/sat-io/open-datasets/GLC-FCS30D/annual");
// b21 波段代表 2020 年
var lc2020 = dataset.mosaic().select('b21');

// ==================== 2. 定义可视化参数与中文名称 ====================

// --- A. 精细分类 (35类) ---
var palette = [
  '#ffff64', '#ffff64', '#aaf0f0', '#006400', '#704489', '#9d6969', '#00ff00', '#00d000',
  '#8fad8f', '#006400', '#00a000', '#003c00', '#285000', '#286400', '#788200', '#8ca000',
  '#be9600', '#966400', '#ffb432', '#ffdcd2', '#ff0000', '#a0a0a0', '#003c00', '#c31400',
  '#fff5d7', '#d7d7d7', '#a0a0a0', '#ffc0c0', '#003c00'
];

var classIds = [
  10, 11, 12, 20, 51, 52, 61, 62, 71, 72, 81, 82, 91, 92, 
  120, 121, 122, 130, 140, 150, 160, 170, 180, 190, 200, 201, 202, 210, 220
];

var classNamesCN = [
  '旱地农田', '草本覆盖', '乔木/灌木', '灌溉农田', '常绿阔叶(疏)', '常绿阔叶(密)',
  '落叶阔叶(疏)', '落叶阔叶(密)', '常绿针叶(疏)', '常绿针叶(密)', '落叶针叶(疏)', '落叶针叶(密)',
  '混交林(疏)', '混交林(密)', '灌木地', '常绿灌木', '落叶灌木', '草地', '地衣苔藓', '稀疏植被',
  '淡水淹没林', '咸水淹没林', '淹没灌木/草', '城市/不透水', '裸地', '固结裸地', '未固结裸地',
  '水体', '冰雪'
];

var idToNameDict = ee.Dictionary.fromLists(classIds.map(function(n){ return String(n) }), classNamesCN);

// --- B. 主要大类 (14类简化) ---
var majorRemap = lc2020.remap(
  classIds,
  [1,1,1,2,3,3,4,4,5,5,6,6,7,7,8,8,8,9,10,11,12,12,12,13,14,14,14,15,16], 0
);
var majorPalette = [
  '#ffff64', '#aaf0f0', '#006400', '#00ff00', '#8fad8f', '#00a000', '#285000', 
  '#788200', '#ffb432', '#ff0000', '#c31400', '#fff5d7', '#ffc0c0', '#d7d7d7'
];
var majorNamesCN = [
  '农田', '灌溉农田', '常绿阔叶', '落叶阔叶', '常绿针叶', '落叶针叶', '混交林',
  '灌木/草地', '稀疏/苔藓', '淹没植被', '城市', '裸地', '水体', '冰雪'
];
// 构建简化的字典用于统计
var majorIdList = [1,2,3,4,5,6,7,8,9,12,13,14,15,16]; 
var majorIdToNameDict = ee.Dictionary.fromLists(majorIdList.map(function(n){ return String(n) }), majorNamesCN);


// ==================== 3. 区域设置 (AOI) - 极简模式 ====================

// ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ 请在这里修改你的路径 ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
var aoiFc = ee.FeatureCollection('projects/maxhecheng/assets/haidian'); 
// ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
var aoi = aoiFc.geometry();

Map.centerObject(aoiFc, 10);


// ==================== 4. UI 面板 ====================
var panel = ui.Panel({style: {width: '400px', padding: '10px'}});
ui.root.insert(0, panel);

panel.add(ui.Label('GLC_FCS30D 2020 土地覆盖', {fontSize: '18px', fontWeight: 'bold'}));

// 图层切换
var layerSelect = ui.Select({
  items: ['精细分类 (35类)', '主要大类 (14类)'],
  value: '精细分类 (35类)',
  onChange: updateMap
});
panel.add(ui.Label('图层选择:'));
panel.add(layerSelect);

// 统计按钮
var chartPanel = ui.Panel();
var btnStats = ui.Button('📊 统计面积并绘图', generateStats);
panel.add(btnStats);
panel.add(chartPanel);

// 导出按钮
panel.add(ui.Label('数据导出:', {fontWeight: 'bold', margin: '10px'}));
var btnExpImg = ui.Button('导出 TIF 影像', function() {
  Export.image.toDrive({
    image: lc2020.clip(aoi),
    description: 'GLC2020_Export',
    folder: 'GEE_Exports',
    region: aoi,
    scale: 30,
    maxPixels: 1e13
  });
  print('影像导出任务已创建');
});
var btnExpTab = ui.Button('导出 CSV 表格', function() {
   generateStats(true); // 调用统计并触发导出
   print('表格导出任务已创建');
});
panel.add(ui.Panel([btnExpImg, btnExpTab], ui.Panel.Layout.flow('horizontal')));

// ==================== 5. 逻辑函数 ====================

function updateMap() {
  Map.layers().reset();
  Map.addLayer(aoiFc.style({color: 'red', fillColor: '00000000', width: 2}), {}, 'AOI');
  
  var mode = layerSelect.getValue();
  if (mode === '主要大类 (14类)') {
    Map.addLayer(majorRemap.clip(aoi), {min: 1, max: 16, palette: majorPalette}, '主要分类');
    updateLegend(majorNamesCN, majorPalette);
  } else {
    Map.addLayer(lc2020.clip(aoi), {min: 10, max: 220, palette: palette}, '精细分类');
    updateLegend(classNamesCN, palette);
  }
}

// 简单的图例刷新
var legendPanel = ui.Panel({style: {position: 'bottom-right', padding: '8px', backgroundColor: 'white'}});
Map.add(legendPanel);
function updateLegend(names, colors) {
  legendPanel.clear();
  legendPanel.add(ui.Label('图例', {fontWeight: 'bold'}));
  for (var i = 0; i < names.length; i++) {
    if(i >= colors.length) break;
    legendPanel.add(ui.Panel([
      ui.Label('', {backgroundColor: colors[i], padding: '8px', margin: '0 8px 0 0'}),
      ui.Label(names[i])
    ], ui.Panel.Layout.flow('horizontal')));
  }
}

// 统计核心 (含Pie Chart string修复)
function generateStats(isExport) {
  if(!isExport) {
      chartPanel.clear();
      chartPanel.add(ui.Label('计算中...'));
  }
   
  var mode = layerSelect.getValue();
  var isMajor = mode === '主要大类 (14类)';
  var img = isMajor ? majorRemap : lc2020;

  // ================= 修复代码开始 =================
  // 将值为 0 的像元设为透明（不参与统计），防止字典查找报错
  img = img.updateMask(img.gt(0)); 
  // ================= 修复代码结束 =================
   
  var areaImg = ee.Image.pixelArea().divide(1e6).addBands(img.rename('class'));
  var stats = areaImg.reduceRegion({
    reducer: ee.Reducer.sum().group({groupField: 1, groupName: 'classId'}),
    geometry: aoi,
    scale: 30,
    maxPixels: 1e13,
    bestEffort: true // 建议加上这个，防止大面积计算时内存溢出
  });
   
  var groupList = ee.List(stats.get('groups'));
  var chartFc = ee.FeatureCollection(groupList.map(function(item) {
    var d = ee.Dictionary(item);
    // 将数字转为整数再转字符串，确保格式匹配（如 10.0 -> "10"）
    var cIdStr = ee.Number(d.get('classId')).format('%d'); 
    var dictToUse = isMajor ? majorIdToNameDict : idToNameDict;
    
    // 使用 get 的第二个参数作为默认值，彻底防止报错
    var name = dictToUse.get(cIdStr, '未定义类别'); 
    
    return ee.Feature(null, {'类别': name, '面积(km²)': d.get('sum'), 'Label': name});
  }));
   
  if (isExport === true) {
      Export.table.toDrive({
        collection: chartFc,
        description: 'GLC2020_Stats',
        folder: 'GEE_Exports',
        fileFormat: 'CSV',
        selectors: ['类别', '面积(km²)']
      });
      return;
  }

  // 绘图
  var pieChart = ui.Chart.feature.byFeature(chartFc, 'Label', '面积(km²)')
    .setChartType('PieChart')
    .setOptions({title: '占比', colors: isMajor ? majorPalette : palette});
  var colChart = ui.Chart.feature.byFeature(chartFc, 'Label', '面积(km²)')
    .setChartType('ColumnChart')
    .setOptions({title: '面积统计', legend: {position: 'none'}, colors: ['#1E90FF']});
    
  chartPanel.clear();
  chartPanel.add(pieChart);
  chartPanel.add(colChart);
}

// 初始化运行
updateMap();