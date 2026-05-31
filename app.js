/* =========================================================================
 *  曾沛慈 Pets Tseng 应援站 — 渲染层
 *  从 data.js 的全局 SITE 对象读内容，填进各 <section>。
 *  逐个 render 函数填充，结构稳定，便于维护。
 * ========================================================================= */

/* ---------- 工具函数 ---------- */
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function $(id) { return document.getElementById(id); }
function reducedMotion() {
  return window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
/* 内联 SVG 图标（不使用 emoji 作为结构图标） */
const ICON = {
  arrowUp: '<svg viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5"><path d="M10 3l5 6h-3v8H8V9H5l5-6z"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M8 5v14l11-7L8 5z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M14 3h7v7"/><path d="M10 14L21 3"/><path d="M21 14v7H3V3h7"/></svg>',
};

/* 音乐平台品牌图标（线性 SVG，统一 currentColor，配合各品牌 hover 色） */
const PLATFORM_ICON = {
  // Apple Music：音符
  apple: '<svg viewBox="0 0 24 24" fill="currentColor" class="w-[18px] h-[18px]"><path d="M9 17.5a2.5 2.5 0 1 1-2.5-2.5c.18 0 .34.02.5.05V7l9-2v8.5a2.5 2.5 0 1 1-2.5-2.5c.18 0 .34.02.5.05V6.3L9 7.8v9.7z"/></svg>',
  // QQ 音乐：企鹅 + 音符（简化）
  qq: '<svg viewBox="0 0 24 24" fill="currentColor" class="w-[18px] h-[18px]"><path d="M12 2c3.3 0 6 2.9 6 6.4 0 1.3.5 2 1.1 2.9.5.8 1 1.6 1 2.8 0 1.1-.7 1.7-1.5 1.5-.5-.1-.9-.5-1.2-1-.2.9-.6 1.7-1.1 2.3.7.3 1.2.7 1.2 1.2 0 .8-1.6 1.4-3.6 1.5-.6.4-1.4.6-2.4.6s-1.8-.2-2.4-.6c-2-.1-3.6-.7-3.6-1.5 0-.5.5-.9 1.2-1.2-.5-.6-.9-1.4-1.1-2.3-.3.5-.7.9-1.2 1-.8.2-1.5-.4-1.5-1.5 0-1.2.5-2 1-2.8.6-.9 1.1-1.6 1.1-2.9C6 4.9 8.7 2 12 2z"/></svg>',
  // YouTube Music：圆形 + 播放三角
  ytm: '<svg viewBox="0 0 24 24" fill="currentColor" class="w-[18px] h-[18px]"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM10 8.3v7.4l6-3.7-6-3.7z"/></svg>',
};
/* 各平台 hover 品牌色（用内联 class，Tailwind 任意值） */
const PLATFORM_META = {
  apple: { label: "Apple Music", hover: "hover:bg-[#fa233b] hover:border-[#fa233b]" },
  qq:    { label: "QQ 音乐",     hover: "hover:bg-[#31c27c] hover:border-[#31c27c]" },
  ytm:   { label: "YouTube Music", hover: "hover:bg-[#ff0000] hover:border-[#ff0000]" },
};
function platformBar(p) {
  if (!p) return "";
  const order = ["qq", "ytm", "apple"];
  const btns = order.filter(k => p[k]).map(k => {
    const m = PLATFORM_META[k];
    return `<a href="${esc(p[k])}" target="_blank" rel="noopener noreferrer"
       aria-label="在 ${esc(m.label)} 收听" title="${esc(m.label)}"
       class="inline-flex items-center justify-center w-11 h-11 rounded-full
              border border-brand-200 text-brand-600 bg-white cursor-pointer
              ${m.hover} hover:text-white transition-colors duration-200">
       ${PLATFORM_ICON[k]}</a>`;
  }).join("");
  return `<div class="flex items-center gap-2 mt-3" role="group" aria-label="收听平台">${btns}</div>`;
}

/* ---------- 渲染函数（逐步填充） ---------- */
function renderHero() {
  const s = SITE;
  $("hero").innerHTML = `
    <div class="relative overflow-hidden bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 text-white">
      <div class="absolute inset-0 opacity-20"
           style="background:radial-gradient(circle at 20% 20%, #fff 0, transparent 40%),
                  radial-gradient(circle at 80% 60%, #fff 0, transparent 35%);"></div>
      <div class="relative max-w-6xl mx-auto px-5 py-24 sm:py-32 text-center">
        <p class="font-display tracking-widest text-brand-100 mb-3">${esc(s.enName)}</p>
        <h1 class="font-display text-5xl sm:text-7xl mb-5 drop-shadow">${esc(s.name)}</h1>
        <p class="text-lg sm:text-2xl font-medium mb-2">${esc(s.tagline)}</p>
        <p class="text-brand-100 max-w-xl mx-auto mb-8">${esc(s.heroNote)}</p>
        <a href="#music"
           class="inline-flex items-center gap-2 bg-white text-brand-600 font-bold
                  px-7 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105
                  transition-all duration-200">
          ${ICON.play} 探索音乐
        </a>
      </div>
    </div>`;
}
function renderAbout() {
  const a = SITE.about;
  const bio = a.bio.map(p => `<p class="mb-4 leading-relaxed">${esc(p)}</p>`).join("");
  const info = a.info.map(i => `
    <div class="flex justify-between py-2.5 border-b border-brand-100 last:border-0">
      <dt class="text-gray-500">${esc(i.label)}</dt>
      <dd class="font-medium text-gray-800">${esc(i.value)}</dd>
    </div>`).join("");
  $("about").innerHTML = `
    <div class="max-w-6xl mx-auto px-5 py-20">
      <h2 class="font-display text-3xl sm:text-4xl text-brand-600 mb-10 text-center">关于 曾沛慈</h2>
      <div class="grid md:grid-cols-5 gap-10 items-start">
        <div class="md:col-span-3 text-gray-700">${bio}
          <p class="text-xs text-gray-400 mt-6">${esc(a.source)}</p>
        </div>
        <div class="md:col-span-2 bg-white rounded-2xl shadow-sm border border-brand-100 p-6">
          <h3 class="font-display text-brand-500 mb-3">个人资料</h3>
          <dl>${info}</dl>
        </div>
      </div>
    </div>`;
}
function renderMusic() {
  // 专辑卡 + CD 唱片展示
  const albums = SITE.albums.map(al => {
    const coverInner = al.cover
      ? `<img src="${esc(al.cover)}" alt="${esc(al.title)} 封面"
             class="w-full h-full object-cover rounded-lg" loading="lazy">`
      : `<div class="w-full h-full rounded-lg bg-gradient-to-br from-brand-400 to-brand-700
                     flex flex-col items-center justify-center text-white p-3 text-center">
           <span class="font-display text-lg leading-tight">${esc(al.title)}</span>
           <span class="text-brand-100 text-xs mt-1">${esc(al.year)}</span>
         </div>`;
    const coverWrap = al.link
      ? `<a href="${esc(al.link)}" target="_blank" rel="noopener noreferrer"
            class="relative z-10 block w-full h-full" title="在 Apple Music 收听">${coverInner}</a>`
      : `<div class="relative z-10 w-full h-full">${coverInner}</div>`;
    return `
    <div class="album-card group bg-white rounded-2xl shadow-sm border border-brand-100
                p-5 hover:shadow-lg transition-shadow duration-200">
      <div class="relative w-full aspect-square mb-4">
        <!-- CD 唱片：藏在封面后面，hover 时滑出并旋转 -->
        <div class="cd-wrap absolute inset-0 z-0 flex items-center justify-center">
          <div class="cd-disc cd-spin w-[88%] h-[88%] rounded-full shadow-md
                      group-hover:[animation-play-state:running]"></div>
        </div>
        <!-- 专辑封面：盖在上层 -->
        ${coverWrap}
      </div>
      <div class="flex items-center gap-2 mb-1">
        <span class="text-xs font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">${esc(al.year)}</span>
        <span class="text-xs text-gray-400">${esc(al.type)}</span>
      </div>
      <h3 class="font-display text-lg text-gray-800">${esc(al.title)}</h3>
      <p class="text-sm text-brand-500">${esc(al.label)}</p>
      <p class="text-sm text-gray-500 mt-1">${esc(al.note)}</p>
      ${platformBar(al.platforms)}
    </div>`;
  }).join("");

  $("music").innerHTML = `
    <div class="bg-white/60">
      <div class="max-w-6xl mx-auto px-5 py-20">
        <h2 class="font-display text-3xl sm:text-4xl text-brand-600 mb-2 text-center">音乐作品</h2>
        <p class="text-center text-gray-500 mb-10">把鼠标移到专辑上，唱片会从封面里转出来</p>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">${albums}</div>
      </div>
    </div>`;
}
function renderVideos() {
  const cards = SITE.videos.map(v => {
    const head = `
      <div class="px-4 py-3">
        <h3 class="font-medium text-gray-800 leading-snug">${esc(v.title)}</h3>
        <p class="text-xs text-brand-500 mt-0.5">${esc(v.channel)}</p>
        <p class="text-xs text-gray-400">${esc(v.note)}</p>
      </div>`;
    if (v.bili) {
      // 内嵌 B站官方播放器（真实 BV 号）
      return `
      <div class="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
        <div class="relative w-full" style="aspect-ratio:16/9;">
          <iframe class="absolute inset-0 w-full h-full" loading="lazy"
            src="https://player.bilibili.com/player.html?bvid=${esc(v.bili)}&autoplay=0&high_quality=1&danmaku=0"
            title="${esc(v.title)}" frameborder="0" scrolling="no"
            allowfullscreen="true" allow="fullscreen"></iframe>
        </div>${head}
      </div>`;
    }
    if (v.biliSpace) {
      // B站个人主页入口卡
      const avatar = v.avatar
        ? `<img src="${esc(v.avatar)}" alt="${esc(v.title)}" referrerpolicy="no-referrer"
             class="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-md">`
        : `<div class="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center text-white text-2xl font-bold">B</div>`;
      const fans = v.fans
        ? `<span class="inline-flex items-center gap-1 bg-white/25 text-white text-xs font-medium px-2.5 py-1 rounded-full mt-2">★ ${esc(v.fans)}粉丝</span>`
        : "";
      return `
      <a href="https://space.bilibili.com/${esc(v.biliSpace)}"
         target="_blank" rel="noopener noreferrer"
         class="group bg-white rounded-2xl shadow-sm border border-brand-100
                overflow-hidden hover:shadow-lg transition-shadow duration-200 block">
        <div class="relative w-full flex flex-col items-center justify-center gap-2
                    bg-gradient-to-br from-[#fb7299] to-[#ff95b8] text-white"
             style="aspect-ratio:16/9;">
          ${avatar}
          <span class="text-sm font-semibold tracking-wide">哔哩哔哩 · 进入官方空间</span>
          ${fans}
        </div>${head}
      </a>`;
    }
    if (v.ytid) {
      return `
      <div class="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
        <div class="relative w-full" style="aspect-ratio:16/9;">
          <iframe class="absolute inset-0 w-full h-full" loading="lazy"
            src="https://www.youtube-nocookie.com/embed/${esc(v.ytid)}"
            title="${esc(v.title)}" frameborder="0" allowfullscreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
        </div>${head}
      </div>`;
    }
    const q = encodeURIComponent(v.searchQuery || (SITE.name + " " + v.title));
    return `
      <a href="https://www.youtube.com/results?search_query=${q}"
         target="_blank" rel="noopener noreferrer"
         class="group bg-white rounded-2xl shadow-sm border border-dashed border-brand-300
                overflow-hidden hover:shadow-lg transition-shadow duration-200 block">
        <div class="relative w-full flex items-center justify-center
                    bg-gradient-to-br from-brand-100 to-brand-200 text-brand-600"
             style="aspect-ratio:16/9;">
          <div class="flex flex-col items-center gap-2">
            ${ICON.search}<span class="text-sm font-medium">在 YouTube 搜索官方版本</span>
          </div>
        </div>${head}
      </a>`;
  }).join("");

  $("videos").innerHTML = `
    <div class="max-w-6xl mx-auto px-5 py-20">
      <h2 class="font-display text-3xl sm:text-4xl text-brand-600 mb-2 text-center">影音视频</h2>
      <p class="text-center text-gray-500 mb-10">官方 MV 直接播放；其余跳转官方频道搜索</p>
      <div class="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">${cards}</div>
    </div>`;
}
function renderDashboard() {
  const c = SITE.campaign;
  const demoBadge = c.isDemo
    ? `<span class="inline-block text-xs font-bold bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full">示例数据</span>`
    : "";

  // 微博《乘风2026》实时榜入口
  const weiboIcon = '<svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M9.8 19.6c-3.9.4-7.3-1.4-7.5-4s2.7-5 6.6-5.4 7.3 1.4 7.5 4-2.7 5-6.6 5.4zm.6-3.1c-.4.6-1.2.9-1.8.6s-.7-1-.4-1.6 1.1-.9 1.7-.6.8 1 .5 1.6zm1.3-1.6c-.1.2-.4.3-.6.2s-.3-.4-.2-.6.4-.3.6-.2.3.4.2.6zM18.6 8.6c-.3-.1-.6-.2-.4-.6.3-.7.3-1.4 0-1.9-.6-.9-2.2-.8-4.1 0 0 0-.6.3-.4-.2.3-1 .3-1.8-.2-2.3-1-1-3.8.1-6.2 2.5C5.3 8 4.2 9.9 4.2 11.5l.9-.9c.3-1.1 1.2-2.5 2.8-3.8 2-1.7 3.7-2.1 4.1-1.6.2.3 0 .9-.2 1.4 0 0-.2.5.2.5 1.5-.5 2.7-.4 3.1.2.2.3.1.8-.1 1.3 0 0-.1.3.2.3 1.3.4 2.7 1.4 2.7 3.1 0 2.9-4.2 6.5-9.3 6.5-3.9 0-7.4-2.1-7.4-5.7 0-1.9 1.2-4.1 3.2-6.2C9.6 4 12.6 2.9 14 4.3c.6.6.7 1.7.3 2.9 0 0-.2.5.4.3 1.8-.7 3.4-.4 4 .5.4.6.4 1.5-.1 2.5 0 0-.2.3.2.4 1.4.4 2.9 1.5 2.9 3.3 0 .3 0 .5-.1.8.4-1 .6-2 .6-3 0-2.3-1.6-3.6-2.7-4.1z"/><circle cx="19" cy="6.5" r="2" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
  let weiboBanner = "", weiboInline = "";
  if (c.weibo) {
    const w = c.weibo;
    weiboBanner = `
      <a href="${esc(w.url)}" target="_blank" rel="noopener noreferrer"
         aria-label="${esc(w.label)}（前往微博查看实时排名）"
         class="group flex items-center justify-center gap-3 max-w-2xl mx-auto mb-8
                bg-[#ff8200] hover:bg-[#e65c00] text-white font-medium cursor-pointer
                px-6 py-3.5 rounded-full shadow-md hover:shadow-lg
                transition-all duration-200">
        ${weiboIcon}
        <span>${esc(w.label)}</span>
        <span class="opacity-90 group-hover:translate-x-0.5 transition-transform">→</span>
      </a>`;
    weiboInline = `
      <a href="${esc(w.url)}" target="_blank" rel="noopener noreferrer"
         aria-label="前往微博查看实时排名"
         class="inline-flex items-center gap-1 text-xs text-[#ff8200] hover:text-[#e65c00]
                cursor-pointer transition-colors">
        ${esc(w.note)} ${ICON.external}</a>`;
  }

  const stats = c.stats.map(s => `
    <div class="bg-white rounded-2xl shadow-sm border border-brand-100 p-5">
      <p class="text-sm text-gray-500">${esc(s.label)}</p>
      <p class="font-display text-3xl text-brand-600 mt-1">${esc(s.value)}</p>
      <p class="text-xs mt-1 flex items-center gap-1 ${s.up ? "text-green-600" : "text-gray-400"}">
        ${s.up ? ICON.arrowUp : ""}${esc(s.delta)}</p>
    </div>`).join("");

  const f = c.funding;
  const pct = Math.min(100, Math.round((f.current / f.goal) * 100));
  const funding = `
    <div class="bg-white rounded-2xl shadow-sm border border-brand-100 p-6">
      <div class="flex justify-between items-baseline mb-2">
        <h3 class="font-medium text-gray-800">${esc(f.label)}</h3>
        <span class="font-display text-brand-600">${pct}%</span>
      </div>
      <div class="w-full h-4 bg-brand-100 rounded-full overflow-hidden"
           role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <div class="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all"
             style="width:${pct}%"></div>
      </div>
      <p class="text-xs text-gray-500 mt-2">
        ${f.current.toLocaleString()} / ${f.goal.toLocaleString()} ${esc(f.unit)}</p>
    </div>`;

  // 数据表 fallback（无障碍）
  const r = c.ranking, tr = c.trend;
  const rankRows = r.labels.map((l,i) =>
    `<tr><td class="py-1 pr-4">${esc(l)}</td><td class="py-1 text-right">${r.values[i]}</td></tr>`).join("");
  const trendRows = tr.labels.map((l,i) =>
    `<tr><td class="py-1 pr-4">${esc(l)}</td><td class="py-1 text-right">${tr.values[i].toLocaleString()}</td></tr>`).join("");

  $("dashboard").innerHTML = `
    <div class="bg-gradient-to-b from-white/60 to-brand-100/40">
      <div class="max-w-6xl mx-auto px-5 py-20">
        <div class="text-center mb-3">${demoBadge}</div>
        <h2 class="font-display text-3xl sm:text-4xl text-brand-600 mb-2 text-center">${esc(c.title)}</h2>
        <p class="text-center text-gray-500 mb-10">${esc(c.subtitle)}</p>

        ${weiboBanner}

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">${stats}</div>
        <div class="mb-8">${funding}</div>

        <div class="grid md:grid-cols-2 gap-6">
          <div class="bg-white rounded-2xl shadow-sm border border-brand-100 p-5 min-w-0">
            <div class="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <h3 class="font-medium text-gray-800">${esc(r.title)}</h3>
              ${weiboInline}
            </div>
            <div class="relative w-full min-w-0" style="height:260px;">
              <canvas id="rankChart"></canvas>
            </div>
          </div>
          <div class="bg-white rounded-2xl shadow-sm border border-brand-100 p-5 min-w-0">
            <h3 class="font-medium text-gray-800 mb-3">${esc(tr.title)}</h3>
            <div class="relative w-full min-w-0" style="height:260px;">
              <canvas id="trendChart"></canvas>
            </div>
          </div>
        </div>

        <details class="mt-6 bg-white/70 rounded-xl border border-brand-100 p-4 text-sm">
          <summary class="cursor-pointer font-medium text-brand-600">查看数据表</summary>
          <div class="grid sm:grid-cols-2 gap-6 mt-4">
            <table class="w-full"><caption class="text-left text-gray-500 mb-1">音源榜排名</caption><tbody>${rankRows}</tbody></table>
            <table class="w-full"><caption class="text-left text-gray-500 mb-1">每日投票趋势</caption><tbody>${trendRows}</tbody></table>
          </div>
        </details>
      </div>
    </div>`;

  // 绘制图表
  const noAnim = reducedMotion();
  const baseOpts = { responsive:true, maintainAspectRatio:false,
    animation: noAnim ? false : undefined };

  const rankColors = r.labels.map(l => l === r.highlight ? "#dc2626" : "#fecaca");
  new Chart($("rankChart"), {
    type: "bar",
    data: { labels: r.labels, datasets: [{ data: r.values, backgroundColor: rankColors,
             borderRadius: 6 }] },
    options: Object.assign({}, baseOpts, {
      indexAxis: "y",
      plugins: { legend: { display:false } },
      scales: { x: { beginAtZero:true, grid:{ color:"#fde8e8" } }, y: { grid:{ display:false } } },
    }),
  });

  new Chart($("trendChart"), {
    type: "line",
    data: { labels: tr.labels, datasets: [{ data: tr.values, label:"投票数",
             borderColor:"#dc2626", backgroundColor:"rgba(239,68,68,0.15)",
             fill:true, tension:0.35, pointBackgroundColor:"#dc2626" }] },
    options: Object.assign({}, baseOpts, {
      plugins: { legend: { display:false } },
      scales: { y: { beginAtZero:true, grid:{ color:"#fde8e8" } }, x: { grid:{ display:false } } },
    }),
  });
}
function renderFooter() {
  const links = SITE.links.map(l =>
    `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer"
        class="inline-flex items-center gap-1 hover:text-white transition-colors duration-200">
       ${esc(l.label)} ${ICON.external}</a>`).join("");
  $("footer").innerHTML = `
    <div class="bg-brand-800 text-brand-200">
      <div class="max-w-6xl mx-auto px-5 py-12 text-center">
        <p class="font-display text-2xl text-white mb-1">${esc(SITE.name)}</p>
        <p class="text-sm mb-5">${esc(SITE.enName)}</p>
        <div class="flex flex-wrap justify-center gap-5 text-sm mb-6">${links}</div>
        <p class="text-xs text-brand-300/80 max-w-xl mx-auto">${esc(SITE.disclaimer)}</p>
      </div>
    </div>`;
}

function initNavHighlight() {
  const links = Array.from(document.querySelectorAll(".nav-link"));
  const map = links.map(a => ({ a, sec: document.querySelector(a.getAttribute("href")) }))
                   .filter(x => x.sec);
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(a => a.classList.remove("active"));
        const hit = map.find(x => x.sec === en.target);
        if (hit) hit.a.classList.add("active");
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  map.forEach(x => obs.observe(x.sec));
}

/* ---------- 入口 ---------- */
function init() {
  try { renderHero(); } catch (e) { console.error("renderHero", e); }
  try { renderAbout(); } catch (e) { console.error("renderAbout", e); }
  try { renderMusic(); } catch (e) { console.error("renderMusic", e); }
  try { renderVideos(); } catch (e) { console.error("renderVideos", e); }
  try { renderDashboard(); } catch (e) { console.error("renderDashboard", e); }
  try { renderFooter(); } catch (e) { console.error("renderFooter", e); }
  try { initNavHighlight(); } catch (e) { console.error("initNavHighlight", e); }
}
document.addEventListener("DOMContentLoaded", init);
