# 曾沛慈 Pets Tseng 应援站

一个单页静态粉丝应援网站，含 **音乐作品（CD 唱片展示）、关于介绍、可播放嵌入视频、应援打投数据看板**。红粉色主题，无构建步骤，可直接托管。

## 文件结构

```
pets-tseng-site/
├── index.html   # 页面骨架（主题、字体、CDN、区块容器、导航、CD 旋转动画 CSS）
├── data.v2.js   # 【所有内容/数据集中在这里】改这个文件即可更新网站
├── app.v2.js    # 渲染逻辑（把 data.v2.js 的内容填进页面 + 画图表）
├── wrangler.toml
├── workers/mgtv-monitor/ # Cloudflare Worker 后台采集器与 D1 migration
├── docs/plans/  # 实现计划文档
└── README.md
```

技术栈：HTML5 + Tailwind CSS (CDN) + Chart.js (CDN) + 原生 JavaScript。无需 npm / 构建。

## 分钟级投票监控架构

GitHub Pages 继续负责展示静态页面；Cloudflare Worker 负责后台每分钟采集 MGTV 票数，并把时间序列存进 Cloudflare D1。

```
GitHub Pages
  └─ 读取 Worker API：/latest /history
Cloudflare Worker
  ├─ Cron Trigger：* * * * * 每分钟采集
  └─ D1：保存分钟级快照与拆分后的榜单行
```

前端配置在 `data.v2.js`：

```js
workerApiBase: "",
```

部署 Worker 后，把它改成你的 Worker URL，例如：

```js
workerApiBase: "https://pets-vote-monitor.<你的 workers 子域>.workers.dev",
```

为空时，网页会自动 fallback 到浏览器直连 MGTV 接口；填好后，`数据看板` 会读 Worker 的 `/latest`，`数据监控` 会读 Worker 的 `/history`，所有访客看到同一份后台采集历史。

## 本地预览

```bash
cd pets-tseng-site
python3 -m http.server 8099
# 浏览器打开 http://localhost:8099
```

必须用 http server 打开，不要直接 file:// 双击 index.html，否则 data.v2.js/app.v2.js 加载会受限。

## Cloudflare Worker 部署

首次部署需要 Cloudflare 账号登录 Wrangler：

```bash
npx wrangler login
```

创建 D1 数据库：

```bash
npm run worker:d1:create
```

命令会输出一段 `[[d1_databases]]` 配置。把其中的 `database_id` 复制到 `wrangler.toml`，替换：

```toml
database_id = "REPLACE_WITH_D1_DATABASE_ID"
```

应用 D1 migration：

```bash
npm run worker:d1:migrate
```

设置一个手动采样 token。这个 token 只用于你自己触发 `/admin/collect`，不要写进仓库：

```bash
npx wrangler secret put COLLECT_TOKEN --config wrangler.toml
```

部署 Worker：

```bash
npm run worker:deploy
```

部署成功后，Cloudflare 会给出 Worker URL。把这个 URL 填回 `data.v2.js` 的 `workerApiBase`，再提交推送到 GitHub Pages。

如果想马上产生第一条数据，可以手动触发一次：

```bash
curl -X POST "https://pets-vote-monitor.<你的 workers 子域>.workers.dev/admin/collect" \
  -H "Authorization: Bearer <你的 COLLECT_TOKEN>"
```

也可以等 Cron 自动执行。`wrangler.toml` 已配置：

```toml
[triggers]
crons = ["* * * * *"]
```

本地开发 Worker：

```bash
npm run worker:dev
curl "http://localhost:8787/cdn-cgi/handler/scheduled?format=json"
```

常用公开 API：

- `GET /health`：查看 D1 里有多少快照、最近一次采样时间。
- `GET /latest`：返回最新完整榜单状态。
- `GET /history?limit=720`：返回最近 720 个快照，用于监控页趋势和异常分析。
- `GET /weibo/latest`：返回本地脚本上传的最新微博舞台推荐榜单。
- `GET /weibo/history?limit=720`：返回微博舞台推荐时间序列。

## 采集开关

三个数据源可以分别开关，页面会在 `数据看板` 和 `数据监控` 顶部显示当前状态：

| 页面名称 | 前端显示配置 | Worker / 脚本开关 | 说明 |
|---|---|---|---|
| 姐姐夯值统计 | `mgtv.hotVoteCollectionEnabled` | `HOT_VOTE_COLLECTION_ENABLED` | MGTV 姐姐夯值 Worker 采集 |
| 公演舞台统计 | `mgtv.stageCollectionEnabled` | `STAGE_COLLECTION_ENABLED` | MGTV 舞台助力 Worker 采集 |
| 公演舞台限时推荐 | `weiboStage.collectionEnabled` | `WEIBO_STAGE_COLLECTION_ENABLED` | 微博本地脚本采集并上传 Worker |

当前默认都是关闭状态。要开启某一项，不要一次性全开；只改对应项即可。

例如只开启微博舞台推荐：

```js
// data.v2.js
weiboStage: {
  collectionEnabled: true,
}
```

同时部署 Worker 时把对应变量设为：

```toml
WEIBO_STAGE_COLLECTION_ENABLED = "true"
```

本地脚本也可以临时覆盖：

```bash
WEIBO_STAGE_COLLECTION_ENABLED=true WEIBO_STAGE_COLLECT_TOKEN="<你的 COLLECT_TOKEN>" npm run weibo:watch
```

## 微博舞台推荐本地监控

微博 WBox 活动页需要登录态，登录 cookie 不适合放到 Cloudflare Worker。这里采用 **本地 Playwright 采集 + Worker 入库**：

```
本地电脑
  ├─ Playwright 使用 .auth/weibo-stage-profile 登录态
  ├─ 每 5 分钟打开微博活动页，读取推荐值
  ├─ 写入 data/weibo-stage-history.json 作为本地兜底
  └─ POST 到 Worker /admin/weibo/ingest

GitHub Pages
  └─ 数据监控页读取 /weibo/history
```

首次登录：

```bash
npm run weibo:login
```

浏览器会打开微博网页版 `https://weibo.com/?topnav=1&mod=logo`。自己完成登录即可，登录资料会保存在 `.auth/`，已加入 `.gitignore`。采集时仍会打开活动页 `WEIBO_STAGE_URL`。

采集一次：

```bash
WEIBO_STAGE_COLLECT_TOKEN="<你的 COLLECT_TOKEN>" npm run weibo:collect
```

持续每 5 分钟采集：

```bash
WEIBO_STAGE_COLLECTION_ENABLED=true WEIBO_STAGE_COLLECT_TOKEN="<你的 COLLECT_TOKEN>" npm run weibo:watch
```

如果想先只在本地看效果，不上传 Worker，也可以不设置 token；脚本会只更新 `data/weibo-stage-history.json`。这时请用本地 HTTP server 打开页面：

```bash
python3 -m http.server 8099
```

然后访问 `http://localhost:8099/#monitor`。不要用 `file://` 直接打开，因为浏览器通常会拦截本地 JSON 的 `fetch`。

常用环境变量：

- `WEIBO_STAGE_HEADLESS=0`：显示浏览器窗口，方便观察是否真的进入榜单。
- `WEIBO_STAGE_INTERVAL_MS=300000`：调整采集间隔，默认 5 分钟。
- `WEIBO_LOGIN_URL=...`：替换登录入口；默认是微博网页版。
- `WEIBO_STAGE_URL=...`：替换微博活动页入口。
- `WEIBO_STAGE_WORKER_API_BASE=...`：覆盖默认 Worker 地址。

### iPhone App 客户端采集

如果活动只能在微博 App 客户端里打开，使用 iPhone OCR 采集器。它不会控制你的手机点击，只负责从已连接的 iPhone 截屏、OCR、解析推荐值，并写入同一份 `data/weibo-stage-history.json` / Worker。

首次安装系统工具：

```bash
brew install libimobiledevice tesseract tesseract-lang
```

使用步骤：

1. 用 USB 连接 iPhone，手机上点 Trust。
2. 在 iPhone 微博 App 里打开活动榜单页，并保持手机解锁、屏幕停在榜单上。
3. 采集一次：

```bash
WEIBO_STAGE_COLLECTION_ENABLED=true npm run weibo:ios:collect
```

4. 持续每 5 分钟采集并上传 Worker：

```bash
WEIBO_STAGE_COLLECTION_ENABLED=true WEIBO_STAGE_COLLECT_TOKEN="<你的 COLLECT_TOKEN>" npm run weibo:ios:watch
```

调试截图/OCR 会放在 `tmp/weibo-ios/`。如果想先用一张截图测试解析：

```bash
WEIBO_STAGE_COLLECTION_ENABLED=true WEIBO_IOS_SCREENSHOT_PATH="/path/to/screenshot.png" npm run weibo:ios:collect
```

### Android 模拟器采集

如果不想用 iPhone，可以用 Android 模拟器当作“虚拟手机”。本机已配置的默认 AVD 名称是 `WeiboMonitor`。

首次准备：

```bash
brew install android-platform-tools android-commandlinetools openjdk tesseract tesseract-lang
```

检查当前 Android 环境：

```bash
npm run weibo:android:doctor
```

启动并调优模拟器：

```bash
npm run weibo:android:start
```

启动后，在模拟器里安装并登录微博 App。可以用 Google Play 安装，也可以自己下载微博 APK 后：

```bash
adb install /path/to/weibo.apk
```

启动模拟器并打开活动页：

```bash
npm run weibo:android:prepare
```

采集一次：

```bash
WEIBO_STAGE_COLLECTION_ENABLED=true npm run weibo:android:collect
```

持续每 5 分钟采集并上传 Worker：

```bash
WEIBO_STAGE_COLLECTION_ENABLED=true WEIBO_STAGE_COLLECT_TOKEN="<你的 COLLECT_TOKEN>" npm run weibo:android:watch
```

如果 `adb devices` 里有多个设备，用 `ADB_SERIAL=emulator-5554` 指定目标。`weibo:android:start` 会自动关闭动画、保持屏幕常亮、停掉 Play Store 后台，并使用较快的网络参数启动 AVD。调试截图/OCR 会放在 `tmp/weibo-android/`。

## 如何更新内容（只改 data.v2.js）

打开 `data.v2.js`，里面是一个全局 `SITE` 对象：

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
- `SITE.campaign` —— **乘风2026 芒推推助力统计**。
  - `mgtv.apiBase` —— MGTV 接口地址。
  - `mgtv.targetName` —— 高亮监控对象，当前为「曾沛慈」。
  - `mgtv.workerApiBase` —— Cloudflare Worker API 地址；为空时使用浏览器直连 fallback。
- `SITE.links` —— 页脚官方链接。`SITE.disclaimer` —— 免责声明。

改完保存，刷新页面即可，无需重新构建。

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
