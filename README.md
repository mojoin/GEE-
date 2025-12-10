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
## (Interactive NDMI Analysis Tool based on Google Earth Engine)

![GEE Badge](https://img.shields.io/badge/Platform-Google%20Earth%20Engine-green)
![Data Badge](https://img.shields.io/badge/Data-Sentinel--2%20MSI-blue)
![Status Badge](https://img.shields.io/badge/Status-Active-success)

## 基于 GEE 的 Sentinel-2 NDMI 交互式时序分析工具

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

# 3、基于 GEE 的多源 Landsat 长时序影像融合与中值合成报告

![GEE Badge](https://img.shields.io/badge/Platform-Google%20Earth%20Engine-green)
![Data Badge](https://img.shields.io/badge/Data-Landsat%205%2F7%2F8%2F9-blue)
![Status Badge](https://img.shields.io/badge/Status-Completed-success)

## 1. 项目背景 (Background)

Landsat 系列卫星提供了长达 40 年以上的地球表面观测记录。然而，在进行长时序分析时，单一传感器往往无法覆盖所有时间段（如 L5 覆盖早期，L8/9 覆盖近期）。此外，不同传感器的波段定义和辐射特性存在差异。

本项目旨在基于 Google Earth Engine (GEE) 平台，构建一套自动化工作流，**无缝融合 Landsat 5, 7, 8, 9 四代卫星数据**，通过波段对齐和去云处理，生成高质量的研究区（AOI）中值合成影像（Median Composite）。

## 效果图
图像可以选择时间区间,点击生成可在gee上生成对应图像

<img width="1912" height="948" alt="67b33dee-acad-4a89-9cb8-906541e87811" src="https://github.com/user-attachments/assets/e1fa9926-1528-4427-9db9-b5e80146778d" />

点击创建导出任务,可以获得geotiff影像点击run可保存在Google云盘可以在Google 云盘下载

<img width="525" height="352" alt="image" src="https://github.com/user-attachments/assets/61e6a0a5-e5be-46cf-a8bf-5ab9e97d3b38" />

在Google云盘中找到文件保存位置

<img width="1912" height="948" alt="image" src="https://github.com/user-attachments/assets/9ce8219d-0899-4b6c-a8ab-fe2b693077eb" />

geotiff图像可以直接在qgis(或者airgis上加载,生成有图例,有标题的学术图片)

<img width="1920" height="1032" alt="8a5e5750-7380-438b-8b59-74be5f143c12" src="https://github.com/user-attachments/assets/d1afa74b-fa5f-43ad-8a65-2188e07af129" />


## 2. 数据源 (Data Sources)

本项目使用了 USGS Landsat Collection 2 Level-2 (表面反射率) 数据集：

| 卫星传感器 | 数据集 ID (GEE) | 时间覆盖 | 备注 |
| :--- | :--- | :--- | :--- |
| **Landsat 9** | `LANDSAT/LC09/C02/T1_L2` | 2021-至今 | 最新数据 |
| **Landsat 8** | `LANDSAT/LC08/C02/T1_L2` | 2013-至今 | 目前主力 |
| **Landsat 7** | `LANDSAT/LE07/C02/T1_L2` | 1999-至今 | 含 SLC-off 条带 |
| **Landsat 5** | `LANDSAT/LT05/C02/T1_L2` | 1984-2012 | 历史数据 |

* **研究区域 (AOI)**: `projects/maxhecheng/assets/haidian` (北京市海淀区矢量边界)

## 3. 技术路线与算法 (Methodology)

### 3.1 核心难点解决方案
为了实现多源融合，必须解决以下一致性问题：

1.  **波段号不一致 (Band Misalignment)**:
    * L8/L9 的近红外波段是 **B5**，而 L5/L7 是 **B4**。
    * **解决方案**: 建立波段映射关系，将所有影像的波段统一重命名为标准名称：`['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2']`。

2.  **定量化差异 (Scale Factors)**:
    * Collection 2 数据以整数形式存储。
    * **解决方案**: 应用线性缩放公式还原物理值：
        $$SR = Pixel \times 0.0000275 - 0.2$$

3.  **去云掩膜 (Cloud Masking)**:
    * 利用 `QA_PIXEL` 波段的位操作 (Bitwise Operation) 识别云和云影。

### 3.2 处理流程图

```mermaid
graph TD
    A[开始: 输入时间范围 & AOI] --> B{选择可用数据源}
    B -->|1984-2012| C[Landsat 5 Collection]
    B -->|1999-2022| D[Landsat 7 Collection]
    B -->|2013-至今| E[Landsat 8 Collection]
    B -->|2021-至今| F[Landsat 9 Collection]
    
    C & D --> G[预处理 L5/7]
    E & F --> H[预处理 L8/9]
    
    subgraph 预处理逻辑
    G --> G1[去云 QA Mask]
    G --> G2[应用缩放因子]
    G --> G3[波段重命名 (B1->Blue...)]
    
    H --> H1[去云 QA Mask]
    H --> H2[应用缩放因子]
    H --> H3[波段重命名 (B2->Blue...)]
    end
    
    G3 & H3 --> I[数据集合并 (Merge Collection)]
    I --> J[中值合成 (Median Reducer)]
    J --> K[裁剪至 AOI]
    K --> L[输出结果: 可视化 & 导出 GeoTIFF]
.
├── code.js            # GEE 核心脚本代码
├── assets/            # (说明) 存放矢量边界数据
│   └── haidian        # 默认分析区域 Asset
└── README.md          # 项目说明文档
