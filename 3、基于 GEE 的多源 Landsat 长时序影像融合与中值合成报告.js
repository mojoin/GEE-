/**
 * GEE App: Landsat 5/7/8/9 多源影像融合与中值合成工具
 * 功能: 自动归一化不同 Landsat 传感器的波段，生成长时间序列的中值合成影像
 */

// =========================================
// 1. 初始化设置
// =========================================

// 加载您的默认区域 (海淀)
// 注意此处以北京市海淀区为例子
var roi = ee.FeatureCollection("projects/maxhecheng/assets/haidian");
Map.centerObject(roi, 10);

// 默认可视化参数 (真彩色)
var visParams = {
  bands: ['Red', 'Green', 'Blue'],
  min: 0.0,
  max: 0.3,
  gamma: 1.4
};

// =========================================
// 2. 数据处理核心函数
// =========================================

// --- 2.1 去云与缩放系数应用 ---

// 适用于 Landsat 8 和 9 的去云与缩放
function preprocessL89(image) {
  var qa = image.select('QA_PIXEL');
  // Bit 3: Cloud, Bit 4: Cloud Shadow
  var mask = qa.bitwiseAnd(1 << 3).eq(0)
    .and(qa.bitwiseAnd(1 << 4).eq(0));
    
  // 应用缩放系数 (Collection 2)
  // Optical: 0.0000275 * pixel - 0.2
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  
  // 替换原始波段并应用掩膜
  return image.addBands(opticalBands, null, true)
    .updateMask(mask)
    .select(['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'], 
            ['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2']) // 重命名为通用名称
    .copyProperties(image, ['system:time_start', 'system:id']);
}

// 适用于 Landsat 5 和 7 的去云与缩放
function preprocessL57(image) {
  var qa = image.select('QA_PIXEL');
  // Bit 3: Cloud, Bit 4: Cloud Shadow
  var mask = qa.bitwiseAnd(1 << 3).eq(0)
    .and(qa.bitwiseAnd(1 << 4).eq(0));

  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  
  return image.addBands(opticalBands, null, true)
    .updateMask(mask)
    .select(['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B7'], 
            ['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2']) // 重命名为通用名称以匹配 L8/9
    .copyProperties(image, ['system:time_start', 'system:id']);
}

// =========================================
// 3. UI 界面构建
// =========================================

var panel = ui.Panel({style: {width: '350px', padding: '10px', backgroundColor: '#f5f5f5'}});
ui.root.insert(0, panel);

panel.add(ui.Label({
  value: 'Landsat 5-9 多源融合合成',
  style: {fontSize: '20px', fontWeight: 'bold', margin: '10px 0'}
}));

panel.add(ui.Label('该工具自动融合 Landsat 5, 7, 8, 9 数据，统一波段并计算中值合成。', {color: '#555', fontSize: '12px'}));

// 时间选择
var datePanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal')});
var startInput = ui.Textbox({value: '2022-01-01', style: {width: '100px'}});
var endInput = ui.Textbox({value: '2023-12-31', style: {width: '100px'}});
datePanel.add(ui.Label('日期范围: ')).add(startInput).add(ui.Label('-')).add(endInput);
panel.add(datePanel);

// 传感器信息显示面板
var infoPanel = ui.Panel({style: {margin: '10px 0', color: 'gray', fontSize: '11px'}});
panel.add(infoPanel);

// 运行按钮
var runBtn = ui.Button({
  label: '生成合成影像 (Run)',
  style: {stretch: 'horizontal', color: 'white', backgroundColor: '#4CAF50'},
  onClick: runAnalysis
});
panel.add(runBtn);

// 下载面板
var downloadPanel = ui.Panel({style: {margin: '10px 0'}});
panel.add(downloadPanel);

// =========================================
// 4. 核心执行逻辑
// =========================================

function runAnalysis() {
  Map.layers().reset();
  downloadPanel.clear();
  infoPanel.clear();
  
  var startDate = startInput.getValue();
  var endDate = endInput.getValue();
  
  // 绘制默认区域边框
  var empty = ee.Image().byte();
  var outline = empty.paint({featureCollection: roi, color: 1, width: 2});
  Map.addLayer(outline, {palette: 'red'}, 'AOI');
  
  // --- 4.1 加载各传感器数据 ---
  
  // Landsat 9
  var l9 = ee.ImageCollection("LANDSAT/LC09/C02/T1_L2")
    .filterBounds(roi)
    .filterDate(startDate, endDate)
    .map(preprocessL89);
    
  // Landsat 8
  var l8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
    .filterBounds(roi)
    .filterDate(startDate, endDate)
    .map(preprocessL89);
    
  // Landsat 7 (注意：2003年后有SLC-off条带，但在中值合成中通常能很好地去除)
  var l7 = ee.ImageCollection("LANDSAT/LE07/C02/T1_L2")
    .filterBounds(roi)
    .filterDate(startDate, endDate)
    .map(preprocessL57);
    
  // Landsat 5
  var l5 = ee.ImageCollection("LANDSAT/LT05/C02/T1_L2")
    .filterBounds(roi)
    .filterDate(startDate, endDate)
    .map(preprocessL57);

  // --- 4.2 融合 Collections (Merge) ---
  // 将所有处理后的 Collection 合并为一个
  var mergedCol = l9.merge(l8).merge(l7).merge(l5);
  
  // 统计影像数量
  mergedCol.size().evaluate(function(count) {
    if (count === 0) {
      infoPanel.add(ui.Label('❌ 当前时间段内无可用 Landsat 影像。', {color: 'red'}));
      return;
    }
    
    infoPanel.add(ui.Label('分析完成。共融合影像数: ' + count + ' 景'));
    infoPanel.add(ui.Label('包含传感器: 自动匹配 L5/7/8/9'));

    // --- 4.3 计算中值合成 (Median Composite) ---
    var medianImage = mergedCol.median().clip(roi);
    
    Map.addLayer(medianImage, visParams, 'Landsat 中值合成 (' + startDate + '-' + endDate + ')');
    
    // --- 4.4 导出选项 ---
    
    // 导出到 Drive 按钮
    var exportBtn = ui.Button({
      label: '🚀 创建导出任务 (GeoTIFF)',
      style: {color: 'black', margin: '5px 0'},
      onClick: function() {
        Export.image.toDrive({
          image: medianImage.select(['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2']), // 只导出光学波段
          description: 'Landsat_Merged_Median_' + startDate + '_' + endDate,
          scale: 30,
          region: roi,
          maxPixels: 1e9,
          fileFormat: 'GeoTIFF'
        });
        downloadPanel.add(ui.Label('✅ 任务已创建，请在 Tasks 栏点击 Run', {color: 'green'}));
      }
    });
    downloadPanel.add(exportBtn);
  });
}