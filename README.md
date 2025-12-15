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
```text```

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
```
# 4、Landsat 8 地表温度(LST) 分地物时空分析工具
>  (Spatiotemporal Analysis of LST by Land Cover Types based on GEE)

![GEE Badge](https://img.shields.io/badge/Platform-Google%20Earth%20Engine-green)
![Data Badge](https://img.shields.io/badge/Data-Landsat%208%20%26%20ESA%20WorldCover-blue)
![Status Badge](https://img.shields.io/badge/Status-Active-success)

## 📖 项目简介 (Introduction)

本项目是一个基于 **Google Earth Engine (GEE)** 的在线分析工具，旨在研究不同地表覆盖类型（Land Cover Types）对地表温度（LST）的影响。

传统的地表温度分析通常只关注整个区域的均值，忽略了地物差异。本工具利用 **ESA WorldCover 10m** 高分辨率土地覆盖产品，自动提取研究区内的**森林、建筑、农田、水体、草地**五类典型地物，并基于 **Landsat 8** 热红外波段计算各年份、各月份的温度变化趋势。

## ✨ 核心功能 (Key Features)

* **无需人工训练分类**：直接集成 ESA WorldCover 数据，自动生成高精度地物掩膜 (Mask)。
* **五类地物对比**：
    * 🌲 **森林 (Trees)**
    * 🏙️ **建筑 (Built-up)**
    * 🌾 **农田 (Cropland)**
    * 💧 **水体 (Water)**
    * 🌿 **草地 (Grassland)**
* **LST 反演与统计**：自动进行去云处理、热红外辐射定标，并转换为摄氏度 (°C)。
* **多维数据可视化**：
    * **时序图表**：生成五条折线，直观展示不同地物随季节的温度差异（热岛效应分析）。
    * **空间分布**：加载特定月份的 LST 均值影像。
![注意现在时间是3月份的北京显示非常的蓝,如果切换到7,8月就很红了](https://i-blog.csdnimg.cn/direct/e2e63559f9e1448d8d60d9b61b206264.png)

* **灵活导出**：
    * 支持导出 **GeoTIFF** 格式的月度温度分布图。(点击上图的"导出geotiff",在tasks里面就有一个图形下载(run),点击后就可以保存到Google云盘下载后进而可以导入QGIS和ArcGIS)
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/3d8bd744a7b144eca79bb700ff7f4fcb.png)

    * 支持导出 **CSV/Excel** 格式的时间序列统计数据。
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/5b620ce0e2a946d7afd6c16a06409dc6.png)
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/0fa0d13429ab4f66b0a91d045bbbd8d5.png)
注意这里可以切换图层且可以切换图层的透明度
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/6ce138df013d4d4180e2bb91904cc286.png)
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/a7b6eed3f1fc44e5b2fbe27c5a01dd90.png)

## 🧮 数据源与方法 (Data & Methodology)
### 系统架构与流程
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/b76d910b12124fae91db96ccea9846c6.png)
### 1. 数据集 (Datasets)
| 数据类型 | 数据源 ID (GEE) | 用途 | 分辨率 |
| :--- | :--- | :--- | :--- |
| **地表温度** | `LANDSAT/LC08/C02/T1_L2` | 提取 `ST_B10` 波段计算 LST | 30m (重采样) |
| **土地覆盖** | `ESA/WorldCover/v100` | 提取地物分类标签 | 10m |

### 2. 算法原理 (Algorithm)

#### 2.1 地物提取
利用 ESA WorldCover 的 `Map` 值进行重分类掩膜：
* Value `10` → 🌲 森林
* Value `30` → 🌿 草地
* Value `40` → 🌾 农田
* Value `50` → 🏙️ 建筑 (不透水面)
* Value `80` → 💧 水体

#### 2.2 温度反演公式
将 Landsat 8 的数字量化值 (DN) 转换为摄氏度：

$$LST (°C) = (DN \times 0.00341802 + 149.0) - 273.15$$

#### 2.3 区域统计
对于每一景影像 $Image_i$，计算特定地物 $Class_k$ 掩膜区域内的像素均值：

$$MeanLST_{i,k} = \frac{1}{N} \sum_{p \in ROI \cap Mask_k} LST(p)$$

## 🚀 快速开始 (Usage)

### 环境要求
* Google Earth Engine 账号
* 现代浏览器 (Chrome/Edge)

### 操作步骤
1.  **打开代码链接**：(在此填入你的 GEE Link)
2.  **设置区域**：
    * *默认*：自动加载海淀区。
    * *自定义*：使用地图左上角的绘图工具画一个框，工具将优先分析手绘区域。
3.  **配置参数**：
    * 设置 **开始日期** 和 **结束日期** (例如 `2023-01-01` 至 `2023-12-31`)。
    * 输入 **指定月份** (例如 `2023-07`) 用于导出影像。
4.  **运行分析**：点击绿色的 **"开始分析 (Run Analysis)"** 按钮。
5.  **获取结果**：
    * **查看图表**：左下角面板将显示五色折线图。
    * **下载数据**：点击图表右上角的弹出图标下载 CSV。
    * **下载影像**：点击右侧面板的 "导出" 按钮，在 Tasks 中下载 GeoTIFF。

## 📊 典型分析结果示例
通常情况下，图表将展示明显的**城市热岛效应**与**冷岛效应**：
* 📈 **高温组**：建筑用地 (Built-up) 通常温度最高，夏季尤为明显。
* 📉 **低温组**：水体 (Water) 和 森林 (Forest) 温度最低，起到降温作用。
* 〰️ **波动组**：农田 (Cropland) 受季节与耕作影响，温度波动较大（如裸土期温度高，灌溉期温度低）。

# 5、Sentinel-1 SAR 地震滑坡变化检测系统：2022 泸定地震案例
> (Sentinel-1 SAR Change Detection System: 2022 Luding Earthquake Case)

![GEE Badge](https://img.shields.io/badge/Platform-Google%20Earth%20Engine-green)
![Data Badge](https://img.shields.io/badge/Data-Sentinel--1%20SAR-blue)
![Status Badge](https://img.shields.io/badge/Event-Luding%206.8M%20Earthquake-red)

## 📖 项目简介 (Introduction)

本项目基于 **Google Earth Engine (GEE)** 平台，利用全天候、全天时的 **Sentinel-1 合成孔径雷达 (SAR)** 数据，构建了一套针对地质灾害的变化检测系统。

> 原先想做汶川地震,但是汶川2008年时并没有sentinal-1卫星

当前配置专门针对 **2022年9月5日四川泸定 6.8 级地震**。由于地震发生在多云雾的高山峡谷地区，光学卫星（如 Landsat/Sentinel-2）往往受云层遮挡无法及时获取影像，而 SAR 雷达影像具有穿透云雾的能力，是第一时间监测地震诱发滑坡（Landslides）、崩塌（Collapse）及堰塞湖的理想工具。

## ✨ 核心功能 (Key Features)

* **卷帘对比分析 (Split Panel)**：
    * 集成交互式卷帘工具，左侧显示**震前 (Pre-event)** 影像，右侧显示**震后 (Post-event)** 变化合成影像，支持毫秒级同步拖动对比。
* **RGB 变化检测算法 (RGB Composite)**：
    * 利用 RGB 假彩色合成技术，将前后时相的雷达回波强度差异转化为直观的颜色（红色/青色），快速识别受灾区域。
* **多时相去噪合成**：
    * 采用中值 (Median) 合成算法，有效去除 SAR 影像特有的斑点噪声 (Speckle Noise)。
* **数据导出**：
    * 支持导出 GeoTIFF 格式的**变化差异图 (Difference Map)**，便于后续在 ArcGIS/QGIS 中进行滑坡编目。

## 📍 案例设置 (Case Study Settings)

* **目标事件**：四川泸定 6.8 级地震
* **震发时间**：2022年9月5日
* **研究区域 (AOI)**：`projects/maxhecheng/assets/luding`
* **时间窗口**：
    * 📅 **震前 (Pre)**：2022-08-01 至 2022-09-04
    * 📅 **震后 (Post)**：2022-09-06 至 2022-10-06

## 🧮 算法原理 (Methodology)

### 1. 数据源
使用 `COPERNICUS/S1_GRD` 数据集 (Sentinel-1 Ground Range Detected)。
* **极化方式**：`VH` (Vertical transmit, Horizontal receive)。VH 极化对植被结构和体积散射更敏感，能有效区分滑坡发生前后的地表粗糙度变化。
* **轨道方向**：`DESCENDING` (降轨)。针对川西南北走向的山脉，降轨数据通常能获得较好的观测几何。

### 2. RGB 变化检测合成
为了直观展示变化，我们构建了以下假彩色合成方案：

| 通道 (Channel) | 数据源 (Source) | 物理意义 |
| :--- | :--- | :--- |
| **R (Red)** | **震后影像 (Post-event)** | 震后回波强度 |
| **G (Green)** | **震前影像 (Pre-event)** | 震前回波强度 |
| **B (Blue)** | **震前影像 (Pre-event)** | 震前回波强度 |

### 3. 结果解译指南 (Interpretation)

通过上述合成方式，图像颜色代表了特定的地质变化：

* 🔴 **红色 / 粉色 (Red/Pink)**：**后向散射增强 (Backscatter Increase)**
    * **原因**：地震导致原本覆盖植被（较平滑/体积散射）的山体发生滑坡，暴露出**粗糙的岩石和堆积体**。粗糙表面在雷达波下会产生更强的回波。
    * **结论**：**滑坡、崩塌、建筑物倒塌废墟**。
    
* 🔵 **青色 / 蓝色 (Cyan/Blue)**：**后向散射减弱 (Backscatter Decrease)**
    * **原因**：原本是陆地或植被的区域被水淹没（水体发生镜面反射，回波极低），或者是形成了极为平滑的泥流。
    * **结论**：**堰塞湖、水体淹没区**。

* ⚪ **灰色 (Gray)**：**无变化 (No Change)**
    * **原因**：震前震后雷达强度基本一致。

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/5aaa6dfa100148df8e16c13cd59d0720.png)
![请添加图片描述](https://i-blog.csdnimg.cn/direct/0666f3590c5145bf89b54bfe74b8b698.gif)

## 🚀 快速使用 (Usage)

1.  **加载脚本**：将代码复制到 GEE Code Editor。
2.  **确认参数**：
    * 左侧面板已默认填入泸定地震时间（2022年8月 vs 9月）。
    * 如需分析其他地震，请手动修改日期和 ROI。
3.  **运行分析**：点击红色的 **"开始分析 (Analyze)"** 按钮。
4.  **交互判读**：
    * 拖动地图中间的分割线。
    * 寻找**红色斑块**，这些通常是高位崩塌或滑坡源头。
5.  **下载结果**：点击左侧底部的 "数据导出" 按钮，在 Tasks 面板下载 `.tif` 文件。

以下是下载在QGIS中打开的样子
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/36af4ee62fc74137813267475edb43b2.png)
所有亮白/发白的地方 = 地震把山震碎了、房子倒了
所有纯黑小点点 = 地震后突然出现的水（堰塞湖）
灰色区域 = 平安无事
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/30f1f44fd9c642fca65bdff2e883963f.png)



# 6、RSEI 生态环境质量智能评估系统 (GEE App)
![GEE Badge](https://img.shields.io/badge/Platform-Google%20Earth%20Engine-green)
> **平台:** Google Earth Engine (GEE)  
> **核心算法:** 主成分分析 (PCA) / 遥感生态指数 (RSEI)

## 📖 项目简介

本项目是一个基于 Google Earth Engine 的自动化遥感生态指数 (RSEI) 计算工具。它集成了 **绿度、湿度、热度、干度** 四大生态指标，利用 **主成分分析 (PCA)** 技术自动构建 RSEI 模型。

**相较于传统版本，本代码解决了以下痛点：**

1.  **稳定性修复**: 彻底解决了 GEE 中常见的 `Dimensions mismatch` (矩阵维度不匹配) 错误，采用“客户端权重计算 + 代数加权法”，确保 PCA 永不报错。
2.  **可视化增强**: 地图支持 5 层叠加显示 (RSEI + 4个分量)，并配备了专属图例。
3.  **多维图表**: 内置 3 类统计图表（直方图、均值对比图、分布曲线图），一键分析生态短板。
4.  **智能校正**: 自动检测特征向量方向，确保 RSEI 数值逻辑正确 (数值越高，生态越好)。

-----

## 🛠️ 主要功能

### 1\. 四大生态指标自动计算

脚本自动处理 Landsat 8 影像，计算以下指标：

  * **🟢 绿度 (Greenness):** 使用 **NDVI** (归一化植被指数) 表征植被覆盖。
  * **💧 湿度 (Wetness):** 使用 **Tasseled Cap Wet** (缨帽变换湿度分量) 表征土壤/植被含水量。
  * **🔥 热度 (Heat):** 使用 **LST** (地表温度) 表征城市热岛效应。
  * **🏜️ 干度 (Dryness):** 使用 **NDBSI** (建筑指数 SI + 裸土指数 IBI) 表征地表硬化程度。

### 2\. 交互式分析面板

  * **时间滑块**: 自由选择年份 (2014-2023)，默认筛选夏季 (6-9月) 影像以获得最佳植被表现
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/0de634f72330471989dd8e519d00d4ac.png)
  * **图层管理**: 可在地图上自由切换查看单一分量，通过颜色直观判断区域是“太热”还是“太干”。
  ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/d3de072a0c90483dbdec84958426c490.png)

  * **图表看板**:
      * **RSEI 分布图**: 了解整体生态得分分布。
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/b45da476b4604a20bc45c888005f67b5.png)

      * **分量均值对比**: 快速识别该区域的主要生态制约因素。
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/5210af8f6a62492b8f1a8f563023dc6a.png)

      * **数值分布曲线**: 详细查看各指标的数据分布形态。
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/1b343e7c9de2456ca45ea553595ef6e2.png)

### 3\. 结果导出

支持一键将计算好的 RSEI 结果导出为 **GeoTIFF** 格式至 Google Drive，保留地理坐标，方便在 ArcGIS/QGIS 中进一步制图。
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/74e08e6b131b4161b137ac2934393b2e.png)


-----

## 🚀 快速开始

### 1\. 设置分析区域 (ROI)

代码默认使用了我的测试 Asset ID，**请务必修改为你自己的区域**，否则可能无法运行或权限报错。

找到代码第 **13** 行：

```javascript
// ❌ 原始代码 (可能无权限)
var roi = ee.FeatureCollection("projects/maxhecheng/assets/haidian");

// ✅ 修改方式 1: 使用你上传的 Shapefile (Asset ID)
var roi = ee.FeatureCollection("users/你的用户名/你的文件名");

// ✅ 修改方式 2: 使用简单的几何点缓冲区 (测试用)
var roi = ee.Geometry.Point([116.3, 39.95]).buffer(10000); 
```

### 2\. 运行代码

1.  将完整代码复制到 [GEE Code Editor](https://code.earthengine.google.com/)。
2.  点击上方的 **Run** 按钮。
3.  在右侧面板选择年份，点击 **"🚀 开始全指标分析"**。

-----

## 📊 结果解读指南

### 图层颜色说明

| 图层 | 颜色条 | 含义 |
| :--- | :--- | :--- |
| **RSEI (生态指数)** | 红 ➝ 绿 | **绿色**越深，生态质量越**好** |
| **绿度 (NDVI)** | 白 ➝ 绿 | **绿色**越深，植被越茂密 |
| **湿度 (Wet)** | 灰 ➝ 蓝 | **蓝色**越深，水分越充足 |
| **热度 (LST)** | 蓝 ➝ 红 | **红色**越深，地表温度越**高** (负面) |
| **干度 (Dry)** | 绿 ➝ 红 | **红色**越深，建筑/裸土越**多** (负面) |

### 图表分析技巧

  * **柱状图 (均值对比)**:
      * 如果 **干度 (Dry)** 柱子最高：说明该区域建筑密度大，硬化严重。
      * 如果 **热度 (Heat)** 柱子最高：说明热岛效应是主要问题。
      * 如果 **绿度 (Green)** 柱子很低：说明缺绿。
  * **曲线图**:
      * 理想的生态城市，绿度和湿度曲线应偏右 (高值)，热度和干度曲线应偏左 (低值)。
  ### GEE界面总览
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/da3ef434d6ea4cea82406f2d9638b241.png)

-----

## ⚠️ 常见问题 (FAQ)

**Q: 为什么提示 "No images found"?**
A:可能是该年份在选定区域云量过多 (代码默认过滤 \>30% 云量)。

  * **解决方法**: 尝试更换年份，或在代码中调整 `CLOUD_COVER` 阈值，或放宽日期范围。

**Q: 为什么 RSEI 只有 0 或 1？**
A: 这种情况通常是极端值归一化导致的。

  * **解决方法**: 代码中已设置 `bestEffort: true` 和较大的 `scale` 来缓解此问题。如果依然出现，说明区域内可能有异常像素（如大面积水体或云）。

**Q: 为什么 PC1 计算不会报错了？**
A: 传统写法直接在 Server 端进行矩阵相乘，容易因像素对齐问题导致 `Dimensions mismatch`。本版本采用了**混合计算法**：先在 Client 端获取特征向量权重，再用简单的代数加权公式生成 PC1，稳定性提升 100%。

-----


#  7、VIIRS 夜间灯光监测工具

这是一个基于 **Google Earth Engine (GEE)** 的交互式应用程序，用于监测、分析和下载 NOAA VIIRS 月度夜间灯光数据。该工具集成了动态可视化、时序分析、GIF 动图生成以及**批量数据导出到 Google Drive** 的功能。

## ✨ 主要功能

![请添加图片描述](https://i-blog.csdnimg.cn/direct/a5b1acd6597b44d08ec9255c4ee59366.gif)

<img width="1912" height="948" alt="image" src="https://github.com/user-attachments/assets/866953db-aac8-49f0-8d65-a70b97d0bd5c" />


1.  **自定义时间范围**: 支持用户输入任意年份范围（2014年至今），一键更新面板数据。
>注意不一定是最新的今天，因为 GEE 数据更新会有一定延迟

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/189429fc36364f6da12a4706cf3c56be.png)

2.  **交互式图层浏览**:
      * **年份滑块**: 加载指定年份的所有月度数据。
      * **月份滑块**: 快速切换当前年份下的月份图层，查看细节。
      
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/e1d7b76419be43e5a7f516b7e0af31e4.png)

注意图层处也可以选择显示某年某月的数据

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/2d1e4f7b68cc42d4b7583328587e0986.png)



3.  **时序趋势分析**: 集成交互式图表，点击图表上的数据点，地图会自动跳转到对应的年份和月份。
4.  **GIF 动图生成**:
      * 自动生成所选时间段内的灯光变化动图。
      * **直接下载链接**: 提供生成的 `.gif` 文件下载链接，无需通过 Drive 即可保存预览。
      * 
![请添加图片描述](https://i-blog.csdnimg.cn/direct/0daff164ccd24a049d8de2ac261526ac.gif)

5.  **数据批量导出 (增强功能)**:
      * **按月批量导出**: 一键将选中年份的所有月度影像导出到 Google Drive (Tasks)。
      * **均值导出**: 导出整个时间段内的平均灯光强度图。
      * 
![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/1711567d7a16457e8db74ed49aafd7b4.png)

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/168de7b64b0c4362b39012468aacdd14.png)

## 🛠️ 数据集信息


  * **数据源**: `NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG`
  * **波段**: `avg_rad` (平均辐射亮度)
  * **分辨率**: 约 500米
  * **可视化阈值**: 0 (黑) - 60 (白)

## 🚀 快速开始

### 1\. 必要的配置 (重要)

代码中使用了自定义的感兴趣区域 (ROI)。在运行代码前，请务必修改 **第 8 行** 的 `roi` 变量为你自己的资产路径或几何图形。

```javascript
// 修改前
var roi = ee.FeatureCollection("projects/maxhecheng/assets/chengdu");

// 修改示例 (使用几何图形)
// var roi = ee.Geometry.Polygon([...]); 
// 或者使用你自己的 table assets
// var roi = ee.FeatureCollection("users/your_username/your_shapefile");
```

### 2\. 使用指南

#### 🕒 设置时间

在左侧面板顶部输入**开始年份**和**结束年份**，点击 **`🔄 更新并刷新`** 按钮。系统将重新计算图表并加载数据。

#### 🗺️ 浏览地图

  * 拖动 **年份滑块** 加载特定年份的数据。
  * 拖动 **月份滑块** 在地图上切换 1-12 月的显示。

#### 📊 趋势分析

点击左侧面板下方的折线图。点击图表上的任意一点，地图会自动跳转到该时间点，方便对比异常值。

#### 💾 数据下载

  * **导出当前年份**: 点击 `📥 导出当前选中年份的所有月度数据`。
      * *操作*: 此时右侧 **Tasks** 面板会出现 12 个任务，点击 `Run` 即可保存到 Google Drive 的 `VIIRS_Export_YYYY` 文件夹中。
  * **导出均值**: 点击 `📥 导出整个时段的平均值图` 保存多主要时段的平均影像。

#### 🎞️ 动图下载

地图右下角会自动生成预览动图。点击下方的蓝色链接 **`⬇️ 点击下载 .gif 动图`** 即可直接将动图保存到本地。

## 📂 输出文件说明

| 导出类型 | 文件命名格式 | 存储位置 (Drive) |
| :--- | :--- | :--- |
| **月度数据** | `VIIRS_YYYY_MM.tif` | 文件夹: `VIIRS_Export_YYYY` |
| **均值数据** | `VIIRS_Mean_StartYear_EndYear.tif` | 文件夹: `VIIRS_Export_Mean` |

## ⚠️ 注意事项

1.  **Tasks 面板**: 点击导出按钮后，必须去 GEE 编辑器右侧的 `Tasks` 选项卡点击 `Run` 才能真正开始下载。
2.  **GIF 生成速度**: 如果研究区域 (ROI) 非常大，生成 GIF 下载链接可能需要几秒钟到几分钟的时间。
3.  **数据缺失**: 如果某一年份 NOAA 没有数据（或尚未发布），控制台会打印 "⚠️ 无数据" 的提示。
