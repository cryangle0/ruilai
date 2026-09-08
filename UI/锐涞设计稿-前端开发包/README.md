# 锐涞经销商管理系统 · 前端开发包（Design Kit）

基于已确认的高保真设计稿（PC 后台 11 屏 + 小程序 7 屏）整理的分层设计元素包，供前端开发直接使用。所有页面均为**语义化 HTML + 可复用 CSS 类**结构（DOM 即图层），无任何位图依赖（图表为内联 SVG，图标为独立 SVG 文件）。

---

## 目录结构

```
frontend-kit/
├── README.md                 # 本说明
├── design-tokens.css         # 设计令牌（CSS 变量：颜色/字体/间距/圆角/阴影/控件尺寸）
├── design-tokens.json        # 设计令牌（JSON 版，供组件库/主题生成/代码生成使用）
├── style.css                 # PC 端共享组件样式（全部页面引用的核心样式表）
├── components.html           # 组件库展示页（15 类可复用组件 + 色板 + 图标集，浏览器打开即可预览）
├── icons/                    # 37 个独立 SVG 图标（stroke=currentColor，可随父元素着色）
│   ├── icon-bell.svg  icon-search.svg  icon-shield-check.svg  ...
├── pages/
│   ├── pc/                   # PC 端 11 屏页面（1920×1080 画布）
│   │   ├── dashboard.html    #   01 工作台
│   │   ├── list.html         #   02 一级代理商列表
│   │   ├── detail.html       #   03 一级代理详情 + 编辑弹窗
│   │   ├── sn.html           #   04 SN 码库
│   │   ├── sn-detail.html    #   05 SN 详情弹窗
│   │   ├── sn-edit.html      #   06 编辑 SN 弹窗
│   │   ├── product.html      #   07 商品库
│   │   ├── product-edit.html #   08 修改商品弹窗
│   │   ├── return.html       #   09 退货管理（状态切换/筛选栏/汇总统计三区标准页）
│   │   ├── anomaly.html      #   10 异常管理
│   │   └── stats.html        #   11 数据统计（浅色底 + 科技感图表）
│   └── mini/                 # 小程序端 7 屏页面（750 宽竖版，长页按内容延伸）
│       ├── mini-scan.html    #   扫码
│       ├── mini-data.html    #   数据看板
│       ├── mini-biz.html     #   业务
│       ├── mini-service.html #   售后
│       ├── mini-stock.html   #   库存详情
│       ├── mini-purchase.html#   提交采购单（购物车）
│       └── mini-return-detail.html # 退货单详情
```

---

## 快速开始

1. **预览组件库**：浏览器直接打开 `components.html`（含全部组件的用法与样式类名）。
2. **预览页面**：打开 `pages/pc/*.html`（引用 `../../style.css`，已按相对路径配好）或 `pages/mini/*.html`（样式内联，零依赖）。
3. **接入项目**：
   - 复制 `style.css`（或按需裁剪）到项目，页面按 `style.css` 中的类名组织 DOM；
   - 主题/样式变量从 `design-tokens.css` 或 `design-tokens.json` 取；
   - 图标直接引用 `icons/*.svg`。

---

## 设计令牌速览

| 类别 | 令牌 | 值 |
|---|---|---|
| 主色 | `--color-primary` | `#1A68D7`（hover `#1559BC` / active `#124E9E`） |
| 主色渐变 | `--grad-primary` | `linear-gradient(135deg,#2B7BF0,#1A68D7)` |
| 成功 / 警告 / 危险 | `--color-success/warning/danger` | `#1B9E5A / #E08A1E / #DE4B4B` |
| 图表辅助色 | `--chart-cyan/orange/green/gray` | `#0EA5C8 / #F5A623 / #34D399 / #9AA4B2` |
| 页面底 / 卡片 | `--color-bg / --color-card` | `#F3F5F9 / #FFFFFF` |
| 文字三阶 | `--color-text-1/2/3` | `#1B2430 / #5B6472 / #9AA4B2` |
| 圆角 | `--radius-lg/md/sm` | `12 / 8 / 6 px` |
| 卡片阴影 | `--shadow-card` | `0 1px 2px rgba(22,32,64,.04), 0 4px 16px rgba(22,32,64,.05)` |
| 画布 | — | PC `1920×1080`；小程序 `750` 宽 @2x 导出 |

---

## 关键设计规范（开发时须遵循）

1. **主色唯一性**：品牌色、重点操作、关键状态、强调区域一律 `#1A68D7`；警示/异常用语义红 `#DE4B4B`，禁用其他自定义色做主操作。
2. **侧栏角标**：待办小圆圈统一红色（`.nav-badge` 红色胶囊），不随分组变色；二级菜单不设前置图标。
3. **列表文字**：除状态列（用 `.tag` 标签）外，其余列文字统一 13px、常规字重、`--color-text-1`，不单独加粗。
4. **异常数红色规则**：`异常数 = 0` 时不显示红色（默认 `--color-text-1`），非 0 时用 `.kpi-v.red`。
5. **标签页层级**：主标签用下划线式 `.tab-lg`（选中主色 + 渐变下划线 + 实心数字徽标）；次级状态用 `.tab-sm` 小号胶囊；需要上下两级时用 `.tab-stack`（退货/SN/异常三区标准）。
6. **筛选栏标准**：`.filter-panel` 白卡 + 左侧 4px 主色竖条；控件紧凑宽度（select 132px / input 200px / date 220px）；查询按钮 `padding:0 22px`。
7. **汇总统计标准**：`.kpi-row` 左侧 4px 语义色条（蓝/橙/红/灰）+ 42px 圆角图标底 + 24px 大数字。
8. **确认弹窗**：图标为圆角方形底（44px、10px 圆角）+ 语义色 SVG（处理成功/确认用绿色盾牌对勾 `icon-shield-check`），文案横排，不用圆形感叹号。
9. **数据统计图表**：浅色底与全站一致；折线/环形/排行条为内联 SVG，刻度文字用 HTML 定位保证不变形；KPI 用渐变光条/辉光圆点营造科技感。
10. **SN/单号等代码类字段**：使用等宽字体 `--font-mono`（SFMono/Consolas）。
