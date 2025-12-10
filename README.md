# 1、基于 GEE 的 NDVI 交互式时序可视化与趋势分析工具
## 功能:
1. 数据预处理：自动加载 Landsat 8 数据并进行去云处理。
2. NDVI 计算：计算归一化植被指数。
3. 趋势分析 (Trend Map)：利用线性回归计算 NDVI 的变化斜率（Slope），并在地图上可视化（变绿还是变黄）。
4. 交互式图表 (UI)：点击地图任意位置，右侧面板会自动生成该点的 NDVI 长时序变化曲线，并叠加线性趋势线。
GEE生成青藏高原的NDVI影像,在图中任意位置点击会放回此地区的NDVI时序分析库

<img width="1912" height="948" alt="image" src="https://github.com/user-attachments/assets/72db15a3-e790-4919-ad5c-6357112457e7" />

点击上图右下角可以放大图像(用于科研再合适不过了,注意此图可下载多种图片格式)

<img width="1912" height="948" alt="image" src="https://github.com/user-attachments/assets/ff06f16f-2b69-47cc-bae6-6554a8c6c004" />

## 本代码有多图层

<img width="258" height="160" alt="image" src="https://github.com/user-attachments/assets/8b49e130-bbe6-40dc-9994-98eb1ad0796e" />

● Selected Point：选中点的可视化（通常是红点或标记，用来显示你点击的位置）
● NDVI Trend Slope：NDVI长期趋势斜率（一般通过Mann-Kendall或线性回归计算得到的每个像元NDVI时间序列的变化速率，单位通常是NDVI/年）
● NDVI Mean (Avg)：多年平均NDVI（多时相NDVI的均值图，反映研究区总体植被覆盖水平,上有颜色的图就是为此图层）
● Boundary Outline：研究区/感兴趣区域的边界轮廓（通常是shapefile或FeatureCollection导入后显示的白色或黑色边框）

# 2、基于 GEE 的 Sentinel-2 NDMI 交互式时序分析工具
# (Interactive NDMI Analysis Tool based on Google Earth Engine)

![GEE Badge](https://img.shields.io/badge/Platform-Google%20Earth%20Engine-green)
![Data Badge](https://img.shields.io/badge/Data-Sentinel--2%20MSI-blue)
![Status Badge](https://img.shields.io/badge/Status-Active-success)

# 基于 GEE 的 Sentinel-2 NDMI 交互式时序分析工具

## 📖 项目简介 (Introduction)

本项目是一个基于 **Google Earth Engine (GEE)** 平台的在线应用程序，旨在利用 **Sentinel-2 (哨兵2号)** 高分辨率遥感影像，对特定区域进行 **NDMI (归一化水分指数)** 的长时序监测与分析。

该工具旨在为生态监测、农业估产及植被含水量分析提供便捷的交互式平台。它支持自动加载预设的感兴趣区域（如海淀区），同时也支持用户手动绘制分析范围。

## ✨ 核心功能 (Key Features)

* **多模式区域选择**：
    * **默认模式**：自动加载预上传的矢量 Asset (`projects/maxhecheng/assets/haidian`)。
    * **交互模式**：支持用户在地图上手动绘制矩形或多边形，程序将自动优先分析绘制区域。
* **自动化数据处理**：
    * 集成 Sentinel-2 去云算法 (基于 QA60 波段)。
    * 自动计算 NDMI 指数。
    * 生成指定时间窗口内的中值合成影像 (Median Composite)。
* **动态可视化与分析**：
    * 提供 NDMI 时间序列折线图，支持查看特定日期的数值。
    * 动态加载分级渲染的 NDMI 图层（干旱-湿润色带）。
    * 包含交互式图例。
* **多格式数据导出**：
    * **快速预览**：生成带地理参考的 PNG 缩略图下载链接。
    * **科研数据**：支持 **Export to Drive**，导出 GeoTIFF 格式原始数据（便于后续导入 QGIS/ArcGIS 制作专题图）。
    * **表格数据**：支持导出时间序列 CSV 文件。

## 🧮 算法原理 (Algorithm)

### 1. NDMI 计算公式
NDMI (Normalized Difference Moisture Index) 用于检测植被冠层的水分含量。

$$NDMI = \frac{(NIR - SWIR)}{(NIR + SWIR)}$$

在 Sentinel-2 数据中对应波段为：
$$NDMI = \frac{(Band 8 - Band 11)}{(Band 8 + Band 11)}$$

* **Band 8 (NIR)**: 近红外
* **Band 11 (SWIR)**: 短波红外

### 2. 去云处理
利用 Sentinel-2 的 `QA60` 波段位掩码技术，剔除云层和卷云干扰，确保合成影像的质量。

## 🚀 快速开始 (Usage)

### 运行环境
* 拥有 Google Earth Engine 账号。
* 浏览器推荐使用 Chrome 或 Edge。

### 操作步骤
1.  **打开脚本链接**：[在此处填入你的 GEE Code Editor 分享链接]
2.  **设置参数**：
    * 在左侧面板输入 **开始日期** 和 **结束日期**。
3.  **选择区域**：
    * *情况 A*：若不进行任何操作，默认分析预设区域（海淀区）。
    * *情况 B*：使用地图左上角的绘图工具画一个框，程序将分析你画的框。
4.  **运行分析**：
    * 点击绿色的 **"运行分析 (Run Analysis)"** 按钮。
5.  **查看与下载**：
    * 查看右侧地图渲染结果和左侧时间序列图表。
    * 点击 **"创建导出任务"** 按钮，然后在 GEE 右侧 `Tasks` 面板中点击 `Run` 下载 GeoTIFF。
界面展示图  

<img width="1912" height="948" alt="image" src="https://github.com/user-attachments/assets/75ca977a-aa53-420d-b3f8-7342970579cd" />

导出的PNG

<img width="996" height="784" alt="image" src="https://github.com/user-attachments/assets/543c03e9-992f-419c-9e90-d54d97e3ea72" />

NDMI平均趋势图(注意:可以下载为svg等图像)

<img width="1912" height="948" alt="image" src="https://github.com/user-attachments/assets/27e539ba-0e2f-457f-9005-ac6fb418b059" />



## 🛠️ 技术栈 (Tech Stack)
* **Language**: JavaScript (GEE API)
* **Data Source**: Copernicus Sentinel-2 MSI: MultiSpectral Instrument, Level-2A
* **Frontend**: GEE UI Widgets (Panels, Charts, Buttons)

## 📂 项目结构
```text
.
├── code.js            # GEE 核心脚本代码
├── assets/            # (说明) 存放矢量边界数据
│   └── haidian        # 默认分析区域 Asset
└── README.md          # 项目说明文档
