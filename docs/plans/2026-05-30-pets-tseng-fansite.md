# 曾沛慈 Pets Tseng 粉丝站 — 实现计划

> **For Hermes:** 用 subagent-driven-development skill 逐任务执行本计划。

**Goal:** 搭建一个曾沛慈（Pets Tseng）的单页粉丝网站，含音乐、文字介绍、嵌入视频、应援打投数据看板，红粉色主题，可静态托管。

**Architecture:** 纯静态单页（无构建步骤）。`index.html` 用 Tailwind CDN 做布局与红粉主题，Chart.js CDN 渲染数据看板图表。所有内容/数据集中在已写好的 `data.js`（一个全局 `SITE` 对象），`app.js` 负责把 `SITE` 渲染进 DOM。这样易维护、易托管（GitHub Pages / Vercel / Netlify 直接拖目录即可）。

**Tech Stack:** HTML5 + Tailwind CSS (CDN) + Chart.js (CDN) + 原生 JS。无 Node 构建。

**设计系统（来自 ui-ux-pro-max-skill + 用户要求）:**
- 主色：红粉色 `#EC4899`（pink-500）为品牌主色，辅以玫红 `#DB2777`、暖珊瑚 `#F43F5E`；强调 `#F59E0B`。
- 背景：浅色 `#FFF1F5`（粉白），深色区块 `#1A0A12`。
- 字体：标题 Righteous，正文 Poppins + Noto Sans SC（中文）。Google Fonts CDN。
- 布局模式：Video-First Hero → 关于 → 音乐作品 → 视频墙 → 应援打投看板 → 页脚。
- 图表：横向条形图（音源榜排名）、折线图（播放量趋势）、进度条（集资）、统计卡片。
- 必守：无 emoji 当图标（用内联 SVG）、hover 150–300ms 过渡、对比度 4.5:1、响应式 375/768/1024、prefers-reduced-motion。

**已完成：** `/home/qiaochuz/pets-tseng-site/data.js`（SITE 对象，含传记/5张专辑/曲目/视频/示例打投数据，已标注【示例数据】）。

---

### Task 1: 创建 index.html 骨架 + 主题 + 区块容器

**Objective:** 建立页面结构、引入 CDN、定义红粉主题与字体，放置所有空区块容器。

**Files:**
- Create: `/home/qiaochuz/pets-tseng-site/index.html`

**要点：**
- `<head>`：viewport meta、标题「曾沛慈 Pets Tseng | 官方粉丝站」、Tailwind CDN、Chart.js CDN、Google Fonts（Righteous + Poppins + Noto Sans SC）。
- 内联 `tailwind.config` 扩展 `colors.brand`（pink/rose/coral/amber 系）与 `fontFamily`（display=Righteous, body=Poppins/Noto Sans SC）。
- `<body>` 含固定顶部导航（锚点：关于/音乐/视频/应援数据），及空容器：
  - `<section id="hero">`、`<section id="about">`、`<section id="music">`、`<section id="video">`、`<section id="campaign">`、`<footer>`。
- 引入 `data.js` 与 `app.js`（在 body 末尾）。
- 顶部导航当前区块高亮、移动端可收起。
- 全局 CSS：`prefers-reduced-motion` 时禁用动画；`scroll-behavior: smooth`。

**验证：** 浏览器/本地 server 打开无 JS 报错，区块占位可见，主题色与字体生效。

---

### Task 2: 渲染 Hero + 关于 + 页脚（app.js 第一部分）

**Objective:** 用 SITE.artist 填充 Hero（姓名/英文名/tagline/CTA 滚动到音乐）、关于区块（bio + 出生/籍贯）、页脚（官方链接 SITE.artist.links）。

**Files:**
- Create: `/home/qiaochuz/pets-tseng-site/app.js`（先实现 hero/about/footer 渲染函数 + 导航高亮）

**要点：**
- Hero：红粉渐变背景，大标题 Righteous，副标题 tagline，「探索音乐」CTA 平滑滚动到 #music。
- 关于：卡片式 bio，旁列出生日期/籍贯，标注「资料来源：维基百科」。
- 页脚：links 渲染为按钮，每个带内联 SVG 图标（非 emoji），`target=_blank rel=noopener`。
- 链接外部全部 `rel="noopener noreferrer"`。

**验证：** 刷新后 Hero/关于/页脚显示真实内容，链接可点击新开页。

---

### Task 3: 渲染音乐区块（专辑时间线 + 曲目播放列表）

**Objective:** 用 SITE.albums 渲染 5 张专辑时间线卡片，用 SITE.tracks 渲染代表曲目列表。

**Files:**
- Modify: `/home/qiaochuz/pets-tseng-site/app.js`（新增 renderMusic）

**要点：**
- 专辑：响应式网格卡片（年份徽章 + 标题 + 厂牌 + note），hover 抬升过渡。
- 曲目：列表项含曲名/出处；`audio` 为空时显示「前往官方平台试听」按钮（链到 YouTube 搜索），非空时用 `<audio controls>`。
- 标注哪些是公开资料。

**验证：** 5 张专辑按年份显示，曲目列表正确，空 audio 显示外链按钮。

---

### Task 4: 渲染视频墙（YouTube 嵌入 / 占位）

**Objective:** 用 SITE.videos 渲染视频网格。ytid 非空时用 `<iframe>` 懒加载嵌入；为空时显示「在 YouTube 搜索」占位卡（链到 searchQ 搜索结果），避免嵌入失效视频。

**Files:**
- Modify: `/home/qiaochuz/pets-tseng-site/app.js`（新增 renderVideos）

**要点：**
- iframe `loading="lazy"`、16:9 aspect-ratio、`title` 属性。
- 占位卡：播放按钮 SVG + 标题 + 「YouTube 搜索」外链。

**验证：** 三个视频卡显示；当前 ytid 为空，显示搜索占位卡且链接正确。

---

### Task 5: 渲染应援打投数据看板（统计卡 + 集资进度 + 两个图表）

**Objective:** 用 SITE.campaign 渲染：4 个统计卡片、集资进度条、音源榜横向条形图（Chart.js）、播放量趋势折线图（Chart.js）。

**Files:**
- Modify: `/home/qiaochuz/pets-tseng-site/app.js`（新增 renderCampaign）

**要点：**
- 顶部显著标注「示例数据，请替换」与 updatedAt。
- 统计卡：value 大字 + delta（trend up 用品牌色 + 上升 SVG 箭头，非 emoji）。
- 进度条：fundingPercent 宽度，显示 current/goal（千分位格式化）。
- 条形图：横向 bar，主角条用品牌粉高亮，降序，value 标签可见。
- 折线图：粉色线 + 20% 填充，tooltip 显示精确值，respL prefers-reduced-motion 时禁用动画。
- 图表 `responsive:true, maintainAspectRatio:false`，容器固定高度避免 CLS。
- 提供数据表格 fallback（无障碍）或 aria-label 摘要。

**验证：** 看板渲染，两个图表正确绘制，进度条宽度对，缩放窗口图表自适应，无 console 报错。

---

### Task 6: 响应式与无障碍收尾 + 本地预览验证

**Objective:** 跨断点检查、补齐 a11y、本地起 server 截图验证整体效果。

**Files:**
- Modify: `index.html` / `app.js`（按需修补）
- Create: `/home/qiaochuz/pets-tseng-site/README.md`（如何编辑 data.js、如何本地预览、如何部署到 GitHub Pages/Vercel/Netlify）

**要点：**
- 375 / 768 / 1024 三断点无横向滚动，导航移动端可用。
- 所有图标为 SVG，所有交互元素 hover/focus 态可见，对比度达标。
- `python3 -m http.server` 本地起站，用浏览器或 vision 截图核对红粉主题与各区块。
- README 写清维护与部署步骤。

**验证：** 本地 server 200，页面完整渲染，三断点正常，README 完整。

---

## 执行说明
- 单页静态站无单测框架；每个任务的「验证」用本地 http server + 浏览器 console 检查（无 JS 报错）+ 截图核对，替代 TDD 的 test 步骤。
- Task 2–5 都修改同一个 app.js，**必须串行执行**（不可并行，避免文件冲突）。
- 每个任务后做 spec 审查 + 质量审查，通过再进入下一任务。
