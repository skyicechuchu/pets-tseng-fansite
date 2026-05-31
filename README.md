# 曾沛慈 Pets Tseng 应援站

一个单页静态粉丝应援网站，含 **音乐作品（CD 唱片展示）、关于介绍、可播放嵌入视频、应援打投数据看板**。红粉色主题，无构建步骤，可直接托管。

## 文件结构

```
pets-tseng-site/
├── index.html   # 页面骨架（主题、字体、CDN、区块容器、导航、CD 旋转动画 CSS）
├── data.js      # 【所有内容/数据集中在这里】改这个文件即可更新网站
├── app.js       # 渲染逻辑（把 data.js 的内容填进页面 + 画图表）
├── docs/plans/  # 实现计划文档
└── README.md
```

技术栈：HTML5 + Tailwind CSS (CDN) + Chart.js (CDN) + 原生 JavaScript。无需 npm / 构建。

## 本地预览

```bash
cd pets-tseng-site
python3 -m http.server 8099
# 浏览器打开 http://localhost:8099
```

必须用 http server 打开，不要直接 file:// 双击 index.html，否则 data.js/app.js 加载会受限。

## 如何更新内容（只改 data.js）

打开 `data.js`，里面是一个全局 `SITE` 对象：

- `SITE.name` / `SITE.enName` / `SITE.tagline` / `SITE.heroNote` —— 首屏标题与标语。
- `SITE.about` —— `bio`（段落数组）+ `info`（资料卡 label/value）+ `source`（来源说明）。
- `SITE.albums` —— 专辑列表（year/title/type/label/note/cover）。
  - `cover` 填封面图 URL 则显示真实封面；留空则用品牌色生成占位封面。
  - 每张专辑卡背后有一张 **CD 唱片**，鼠标移上去会滑出并旋转（CD 展示）。
- `SITE.tracks` —— 代表曲目。`audio` 填音频文件 URL 就出现播放器；留空则显示
  "官方平台试听"外链（用 `link`）。
- `SITE.videos` —— 视频。
  - `ytid` 填**真实** YouTube 视频 ID 即可直接嵌入播放（youtube-nocookie）。
  - `ytid` 留空则显示"YouTube 搜索"占位卡（按 `searchQuery` 搜索）。
  - ⚠️ 切勿填猜测/未核实的 ID —— 死链会嵌入失败。填之前用以下命令核实：
    `curl -s "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<ID>&format=json"`
    返回标题/作者即为真实存在。
  - 当前已核实的 3 个官方 MV：
    - `olODk6jhMhM` 一个人想着一个人（Timeless Music 官方）
    - `7dKOb-dKAyg` 不过失去了一点点（福茂唱片 官方）
    - `lODRdCZU3Vs` 我的泪（福茂唱片 官方）
- `SITE.campaign` —— **应援打投数据看板**。目前是【示例数据】，`isDemo:true` 时页面顶部
  显示"示例数据"标识。换成真实数据后把 `isDemo` 设为 false。
  - `stats` —— 4 个统计卡（label/value/delta/up）。
  - `funding` —— 集资进度条（current/goal/unit/label，进度按 current/goal 自动算）。
  - `ranking` —— 音源榜对比（横向条形图，`highlight` 指定的名字自动高亮品牌色）。
  - `trend` —— 每日投票趋势（折线图，labels/values）。
- `SITE.links` —— 页脚官方链接。`SITE.disclaimer` —— 免责声明。

改完保存，刷新页面即可，无需重新构建。

> ⚠️ 看板数字目前是占位示例，页面也明确标注"示例数据"。换成真实应援数据前请勿对外宣称为真实战绩。

## 部署（任选其一，全部免费）

**GitHub Pages**
1. 把本目录推到一个 GitHub 仓库。
2. 仓库 Settings → Pages → Source 选 `main` 分支根目录。
3. 几分钟后访问 `https://<用户名>.github.io/<仓库名>/`。

**Vercel**：`npm i -g vercel` → 本目录运行 `vercel`，框架选 "Other"，纯静态。

**Netlify**：登录 netlify.com → "Add new site" → 拖拽本文件夹；或 `netlify deploy --dir . --prod`。

取舍：GitHub Pages 免费且与代码仓库一体，适合长期维护（与你已有的 QZ_home 备份习惯一致）；Vercel/Netlify 部署更快、自带 CDN 与自定义域名。纯静态三者体验接近，推荐 GitHub Pages。

## 验证（已通过）

用 headless Playwright 程序化验证：桌面 1280 与手机 375 两种视口下，hero/about/music/videos/dashboard 五区块全部渲染、两个 Chart.js 图表绘制成功、零 console error、零横向溢出；3 个 YouTube 嵌入地址 HTTP 200 可加载。

## 资料来源与免责声明

- 传记、专辑、视频信息整理自中文维基百科「曾沛慈」条目及 YouTube 官方频道等公开资料。
- 视频 ID 均经 YouTube oembed 接口核实为官方真实 MV。
- 本站为非官方粉丝向网站，仅整理公开信息，不代表艺人或经纪公司立场。
