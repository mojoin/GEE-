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
