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
  const imgs = Array.isArray(s.heroImages) ? s.heroImages : [];
  const slides = imgs.map((src, i) => `
        <img src="${esc(src)}" alt="${esc(s.name)}" loading="eager"
             class="hero-photo absolute inset-0 w-full h-full object-contain ${i === 0 ? "is-active" : ""}" />`).join("");
  const credit = s.heroImageCredit
    ? `<p class="text-[10px] text-slate-400 text-center mt-3 px-4">${esc(s.heroImageCredit)}</p>`
    : "";
  $("hero").innerHTML = `
    <div class="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
      <div class="max-w-6xl mx-auto px-5 py-14 sm:py-20
                  grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center">
        <div class="text-center md:text-left order-2 md:order-1">
          <p class="font-display tracking-widest text-brand-400 mb-3">${esc(s.enName)}</p>
          <h1 class="font-display text-5xl sm:text-7xl mb-5 text-brand-600">${esc(s.name)}</h1>
          <p class="text-lg sm:text-2xl font-medium mb-2 text-slate-800">${esc(s.tagline)}</p>
          <p class="text-slate-500 max-w-xl mx-auto md:mx-0 mb-8">${esc(s.heroNote)}</p>
          <a href="#music"
             class="inline-flex items-center gap-2 bg-brand-500 text-white font-bold
                    px-7 py-3 rounded-full shadow-lg hover:bg-brand-600 hover:shadow-xl hover:scale-105
                    transition-all duration-200">
            ${ICON.play} 探索音乐
          </a>
        </div>
        <div class="order-1 md:order-2">
          <div class="relative w-full aspect-square max-w-md mx-auto
                      rounded-2xl overflow-hidden shadow-xl ring-4 ring-white bg-brand-50">
            <div class="hero-photos absolute inset-0">${slides}</div>
          </div>
          ${credit}
        </div>
      </div>
    </div>`;
  // 照片轮播：每 5 秒淡入淡出切换
  if (imgs.length > 1) {
    let idx = 0;
    const els = $("hero").querySelectorAll(".hero-photo");
    setInterval(() => {
      els[idx].classList.remove("is-active");
      idx = (idx + 1) % els.length;
      els[idx].classList.add("is-active");
    }, 5000);
  }
}
function renderDirectory() {
  const items = [
    { href: "#about", label: "关于" },
    { href: "#music", label: "音乐" },
    { href: "#videos", label: "影音" },
    { href: "#schedule", label: "行程" },
    { href: "#dashboard", label: "数据看板" },
    { href: "#monitor", label: "数据监控" },
  ];
  $("directory").innerHTML = `
    <div class="border-y border-brand-100 bg-white">
      <div class="mx-auto max-w-6xl px-5 py-5">
        <div class="flex items-center justify-between gap-4">
          <h2 class="font-display text-xl text-brand-600">页面目录</h2>
          <span class="hidden text-sm text-gray-400 sm:inline">快速跳转</span>
        </div>
        <nav class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="页面目录">
          ${items.map(item => `
            <a href="${esc(item.href)}"
               class="inline-flex min-h-12 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 px-4 text-sm font-bold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-100">
              ${esc(item.label)}
            </a>`).join("")}
        </nav>
      </div>
    </div>`;
}
function renderAbout() {
  const a = SITE.about;
  const bio = (a.bio || []).map(p => `<p class="mb-4 leading-relaxed">${esc(p)}</p>`).join("");
  const info = a.info.map(i => `
    <div class="flex justify-between py-2.5 border-b border-brand-100 last:border-0">
      <dt class="text-gray-500">${esc(i.label)}</dt>
      <dd class="font-medium text-gray-800">${esc(i.value)}</dd>
    </div>`).join("");

  // 社交平台 icon 一栏
  const SOCIAL_ICON = {
    bilibili:  '<svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M17.8 3.2a1 1 0 0 1 0 1.4L16.5 6H19a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h2.5L6.2 4.6a1 1 0 1 1 1.4-1.4L10 5.6q.2.2.3.4h3.4q.1-.2.3-.4l2.4-2.4a1 1 0 0 1 1.4 0zM5 8a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1zm3 3a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zm8 0a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1z"/></svg>',
    youtube:   '<svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.7-1.7C19.3 5.2 12 5.2 12 5.2s-7.3 0-8.9.4A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.7 1.7c1.6.4 8.9.4 8.9.4s7.3 0 8.9-.4a2.5 2.5 0 0 0 1.7-1.7C23 15.2 23 12 23 12zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    weibo:     '<svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M10.1 20.3c-4.3.4-8-1.5-8.3-4.4s2.9-5.5 7.2-5.9 8 1.5 8.3 4.4-2.9 5.5-7.2 5.9zm.5-3.4c-.4.7-1.3 1-2 .6s-.8-1.1-.4-1.8 1.2-1 1.9-.7.9 1.1.5 1.9zm1.4-1.7c-.1.2-.4.3-.6.2s-.3-.4-.2-.6.4-.3.6-.2.3.4.2.6zM20 9.1c-.3-.1-.6-.1-.4-.6.3-.7.3-1.4 0-1.9-.6-1-2.3-.8-4.2 0 0 0-.6.3-.5-.2.3-1 .3-1.9-.2-2.4-1-1-3.9.1-6.4 2.6"/><circle cx="19" cy="6" r="2.2" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    facebook:  '<svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>',
    douyin:    '<svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M19 8.2a6 6 0 0 1-3.5-1.1v6.7a5.3 5.3 0 1 1-5.3-5.3c.3 0 .5 0 .8.1v2.7a2.6 2.6 0 1 0 1.8 2.5V2.5h2.7A3.6 3.6 0 0 0 19 5.5z"/></svg>',
    xiaohongshu: '<svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2.2 5.2v5.6h1.3v-2.2h.9l1 2.2H13l-1.1-2.4a1.5 1.5 0 0 0 .9-1.4c0-1-.7-1.6-1.9-1.6H7.2zm1.3 1.1h1c.5 0 .8.2.8.6s-.3.6-.8.6h-1v-1.2zm5.6-1.1v5.6h3.7v-1.1h-2.4v-1.3h2.1v-1.1h-2.1v-1h2.3V9.2h-3.6z"/></svg>',
  };
  const socials = (a.socials || []).map(s => {
    const icon = SOCIAL_ICON[s.platform] || "";
    return `
      <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"
         title="${esc(s.label)}" aria-label="${esc(s.label)}"
         class="w-10 h-10 flex items-center justify-center rounded-full
                bg-brand-50 text-brand-500 border border-brand-100
                hover:bg-brand-500 hover:text-white hover:border-brand-500
                transition-colors duration-200">${icon}</a>`;
  }).join("");
  const socialBlock = socials ? `
          <h3 class="font-display text-brand-500 mb-3 mt-7">社交平台</h3>
          <div class="flex flex-wrap gap-3">${socials}</div>` : "";
  const sourceBlock = bio && a.source
    ? `<p class="text-xs text-gray-400 mt-6">${esc(a.source)}</p>`
    : "";
  const card = `
        <div class="${bio ? "md:col-span-2" : "mx-auto w-full max-w-xl"} bg-white rounded-2xl shadow-sm border border-brand-100 p-6">
          <h3 class="font-display text-brand-500 mb-3">个人资料</h3>
          <dl>${info}</dl>${socialBlock}
        </div>`;
  const content = bio
    ? `<div class="grid md:grid-cols-5 gap-10 items-start">
        <div class="md:col-span-3 text-gray-700">${bio}${sourceBlock}</div>
        ${card}
      </div>`
    : card;

  $("about").innerHTML = `
    <div class="max-w-6xl mx-auto px-5 py-20">
      <h2 class="font-display text-3xl sm:text-4xl text-brand-600 mb-10 text-center">关于 曾沛慈</h2>
      ${content}
    </div>`;
}
function renderMusic() {
  // 专辑卡 + CD 唱片展示
  const albums = SITE.albums.slice().sort((a, b) => Number(b.year || 0) - Number(a.year || 0)).map(al => {
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
function renderSchedule() {
  const sc = SITE.schedule;
  if (!sc || !Array.isArray(sc.events) || !sc.events.length) {
    $("schedule").innerHTML = "";
    return;
  }
  // 今天（按本地日期）零点，用于判断已结束的行程
  const today = new Date(); today.setHours(0, 0, 0, 0);

  // 解析日期 + 排序（升序）
  const evts = sc.events
    .map(e => {
      const d = new Date(e.date + "T00:00:00");
      return { ...e, _d: d, _done: e.status === "done" || (e.status !== "upcoming" && d < today) };
    })
    .sort((a, b) => a._d - b._d);

  const MONTH = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
  const calIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
  const pinIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  const clockIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 shrink-0"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

  const rows = evts.map(e => {
    const m = e._d.getMonth(), day = e._d.getDate();
    const done = e._done;
    const dateBox = `
      <div class="flex-shrink-0 w-16 sm:w-20 text-center rounded-xl py-2.5
                  ${done ? "bg-gray-100 text-gray-400" : "bg-brand-500 text-white shadow-sm"}">
        <div class="text-[11px] font-medium leading-none">${MONTH[m]}</div>
        <div class="font-display text-2xl sm:text-3xl leading-tight">${day}</div>
        <div class="text-[11px] leading-none">周${esc(e.weekday)}</div>
      </div>`;
    const timeStr = e.time ? e.time : "时间待定";
    const badge = done
      ? `<span class="inline-block text-[11px] font-bold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">已结束</span>`
      : `<span class="inline-block text-[11px] font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">即将到来</span>`;
    const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.venue)}`;
    return `
    <div class="flex items-stretch gap-4 bg-white rounded-2xl shadow-sm border border-brand-100
                p-4 hover:shadow-md transition-shadow duration-200 ${done ? "opacity-70" : ""}">
      ${dateBox}
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap mb-1">
          ${badge}
          ${e.city ? `<span class="text-[11px] text-gray-400">${esc(e.city)}</span>` : ""}
        </div>
        <h3 class="font-medium text-gray-800 leading-snug">${esc(e.name)}</h3>
        <div class="mt-2 space-y-1 text-sm text-gray-500">
          <p class="flex items-center gap-1.5 text-brand-500">${clockIcon}<span>${esc(timeStr)}</span></p>
          <a href="${mapHref}" target="_blank" rel="noopener noreferrer"
             class="flex items-start gap-1.5 hover:text-brand-600 transition-colors"
             title="在地图中查看">${pinIcon}<span class="break-words">${esc(e.venue)}</span></a>
        </div>
      </div>
    </div>`;
  }).join("");

  const srcLink = sc.sourceUrl
    ? `<a href="${esc(sc.sourceUrl)}" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-brand-500 hover:text-brand-600 transition-colors">原帖 ${ICON.external}</a>`
    : "";

  $("schedule").innerHTML = `
    <div class="bg-white/60">
      <div class="max-w-6xl mx-auto px-5 py-20">
        <div class="text-center mb-2 flex items-center justify-center gap-2 text-brand-400">${calIcon}</div>
        <h2 class="font-display text-3xl sm:text-4xl text-brand-600 mb-2 text-center">${esc(sc.title)}</h2>
        <p class="text-center text-gray-500 mb-10">${esc(sc.subtitle)}</p>
        <div class="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">${rows}</div>
        <p class="text-xs text-gray-400 text-center mt-8 max-w-2xl mx-auto">
          ${esc(sc.source)} ${srcLink}</p>
      </div>
    </div>`;
}
let dashboardRankChart = null;
let dashboardStageChart = null;
let dashboardHotVoteChart = null;
let dashboardWeiboStageChart = null;
let dashboardBilibiliPerformerChart = null;
let dashboardRefreshTimer = null;
let dashboardState = null;
let dashboardHotState = null;
let dashboardWeiboStageState = null;
let dashboardBilibiliState = null;
let dashboardSelectedPeriodId = null;
let dashboardHashAligned = false;
let monitorRateChart = null;
let monitorDataKind = "hot";
const monitorSelectedPeriodIds = {};
const monitorSelectedRowKeys = {};
let monitorHashAligned = false;
let monitorHistorySource = "local";
let monitorHistoryStatus = { ok: true, source: "local", count: 0, error: "" };
let monitorRetryTimer = null;
let monitorRefreshTimer = null;
let monitorAutoRetryCount = 0;
let monitorRenderToken = 0;
let monitorWindowMode = "today";
let monitorRangeStartTs = null;
let monitorRangeEndTs = null;
let mgtvForegroundRefreshBound = false;
let mgtvLastForegroundRefreshAt = 0;
const MONITOR_STORAGE_KEY = "pets_mgtv_monitor_v1";
const MONITOR_MAX_SNAPSHOTS = 720;
const MONITOR_WORKER_HISTORY_LIMIT = 1440;
const MONITOR_WORKER_RANGE_HISTORY_LIMIT = 30 * 24 * 60;
const MONITOR_EMPTY_RETRY_LIMIT = 36;
const MONITOR_EMPTY_RETRY_MS = 5000;
const MONITOR_MIN_RANGE_MS = 5 * 60 * 1000;
const MONITOR_NON_TARGET_COLORS = [
  "#2563eb",
  "#16a34a",
  "#7c3aed",
  "#0891b2",
  "#ca8a04",
  "#4f46e5",
  "#0f766e",
  "#64748b",
  "#84cc16",
  "#06b6d4",
  "#a855f7",
  "#14b8a6",
];
const BILIBILI_KNOWN_PERFORMERS = [
  "曾沛慈", "淡淡", "黄灿灿", "张月", "王濛", "王蒙", "陈瑶", "尚雯婕", "萨顶顶",
  "李小冉", "唐艺昕", "叶一茜", "徐梦洁", "谢娜", "万千惠", "张楚寒",
  "孟佳", "王霏霏", "乌兰图雅", "陈凯琳", "徐洁儿", "阚清子", "侯宇",
  "陈妍希", "何泓姗", "庄法", "江语晨", "维妮娜", "萧蔷", "陶昕然",
  "安崎", "李心洁", "何宣林", "温峥嵘", "者来女", "张慧雯", "代斯",
  "张艺上", "谢楠", "范玮琪", "孙怡", "李斯丹妮", "宋妍霏", "何洁", "马吟吟"
];
const BILIBILI_STACK_COLORS = [
  "#dc2626", "#2563eb", "#16a34a", "#7c3aed", "#0891b2", "#ca8a04",
  "#4f46e5", "#0f766e", "#64748b", "#db2777", "#ea580c", "#9333ea",
  "#0d9488", "#65a30d", "#0284c7", "#be123c", "#a16207", "#4338ca",
  "#15803d", "#c2410c"
];
const BILIBILI_TABLE_LIMIT = 20;
const MONITOR_WINDOW_OPTIONS = [
  { label: "今日", mode: "today" },
  { label: "6 小时", mode: "6h" },
  { label: "一周", mode: "7d" },
];
const MONITOR_DATASETS = {
  hot: {
    key: "hot",
    label: "姐姐夯值",
    title: "姐姐夯值投送增量走势",
    emptyName: "姐姐夯值",
    historyPath: "/hot/history",
    latestPath: "/hot/latest",
    valueLabel: "姐姐",
    yAxisLabel: "新增夯爆了",
    sourceLabel: "姐姐夯值页",
    sourceUrlKey: "hotVoteSourceUrl",
  },
  weibo: {
    key: "weibo",
    label: "微博舞台推荐",
    title: "微博舞台推荐增量走势",
    emptyName: "微博舞台推荐",
    historyPath: "/weibo/history",
    latestPath: "/weibo/latest",
    localConfigKey: "weiboStage",
    localHistoryUrlKey: "historyUrl",
    valueLabel: "作品",
    yAxisLabel: "新增推荐值（万）",
    sourceLabel: "微博推荐页",
    sourceConfigKey: "weiboStage",
    sourceUrlKey: "sourceUrl",
    displayScale: 10000,
    displayUnit: "万",
    highlightTitles: ["心引力", "怎么说我不爱你"],
  },
  bilibili: {
    key: "bilibili",
    label: "B站播放",
    title: "B站播放增量走势",
    emptyName: "B站播放",
    historyPath: "/bilibili/history",
    latestPath: "/bilibili/latest",
    sourceConfigKey: "bilibili",
    valueLabel: "视频",
    yAxisLabel: "新增播放量",
    sourceLabel: "B站",
    sourceUrlKey: "sourceUrl",
  },
  stage: {
    key: "stage",
    label: "舞台助力",
    title: "舞台助力增量走势",
    emptyName: "舞台助力",
    historyPath: "/history",
    latestPath: "/latest",
    valueLabel: "作品",
    yAxisLabel: "新增助力数",
    sourceLabel: "芒推推页面",
    sourceUrlKey: "sourceUrl",
  },
};

function monitorDatasetConfig() {
  return MONITOR_DATASETS[monitorDataKind] || MONITOR_DATASETS.hot;
}
function monitorDatasetEnabled(c, dataset) {
  if (!dataset) return false;
  if (dataset.key === "weibo") return Boolean(c && c.weiboStage && c.weiboStage.collectionEnabled === true);
  if (dataset.key === "bilibili") return Boolean(c && c.bilibili && c.bilibili.collectionEnabled === true);
  return true;
}
function enabledMonitorDatasets(c) {
  return Object.keys(MONITOR_DATASETS)
    .map(key => MONITOR_DATASETS[key])
    .filter(dataset => monitorDatasetEnabled(c, dataset));
}
function monitorRefreshMs(c, dataset) {
  if (dataset && dataset.sourceConfigKey && c && c[dataset.sourceConfigKey]) {
    return Number(c[dataset.sourceConfigKey].refreshMs || 0);
  }
  if (dataset && dataset.localConfigKey && c && c[dataset.localConfigKey]) {
    return Number(c[dataset.localConfigKey].refreshMs || 0);
  }
  return Number(c && c.mgtv && c.mgtv.refreshMs || 0);
}
function scheduleMonitorRefresh(c, dataset) {
  clearInterval(monitorRefreshTimer);
  monitorRefreshTimer = null;
  if (new URLSearchParams(window.location.search).get("noAutoRefresh") === "1") return;
  const ms = monitorRefreshMs(c, dataset);
  if (ms > 0) {
    monitorRefreshTimer = setInterval(() => {
      renderMonitor().catch(err => console.error("renderMonitor auto refresh", err));
    }, ms);
  }
}

function monitorDatasetConfigObject(c, dataset) {
  return dataset.sourceConfigKey ? c && c[dataset.sourceConfigKey] : c && c.mgtv;
}

function monitorDatasetSourceUrl(c, dataset) {
  const cfg = monitorDatasetConfigObject(c, dataset);
  return cfg && dataset.sourceUrlKey ? cfg[dataset.sourceUrlKey] : "";
}

function monitorHistorySourceLabel() {
  if (monitorHistorySource === "worker") return "后台时间序列";
  if (monitorHistorySource === "worker-latest") return "后台最新快照";
  if (monitorHistorySource === "local-json") return "本地采集文件";
  return "自动监控";
}

function collectionSwitches(c) {
  const mgtv = c && c.mgtv || {};
  const weibo = c && c.weiboStage || {};
  return [
    {
      key: "hot",
      label: "姐姐夯值统计",
      enabled: mgtv.hotVoteCollectionEnabled === true,
      note: "Worker",
    },
    {
      key: "stage",
      label: "公演舞台统计",
      enabled: mgtv.stageCollectionEnabled === true,
      note: "Worker",
    },
    {
      key: "weibo",
      label: "公演舞台限时推荐",
      enabled: weibo.collectionEnabled === true,
      visible: weibo.collectionEnabled === true,
      note: "本地脚本",
    },
    {
      key: "bilibili",
      label: "B站舞台数据",
      enabled: c && c.bilibili && c.bilibili.collectionEnabled === true,
      visible: c && c.bilibili && c.bilibili.collectionEnabled === true,
      note: "本地脚本",
    },
  ].filter(item => item.visible !== false);
}

function renderCollectionStatus(c) {
  const items = collectionSwitches(c).map(item => `
    <span class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium
      ${item.enabled ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-500"}">
      <span class="h-2 w-2 rounded-full ${item.enabled ? "bg-green-500" : "bg-gray-300"}"></span>
      <span>${esc(item.label)}</span>
      <span class="font-bold">${item.enabled ? "采集开" : "采集关"}</span>
      <span class="${item.enabled ? "text-green-600/70" : "text-gray-400"}">${esc(item.note)}</span>
    </span>`).join("");
  return `<div class="mt-5 flex flex-wrap items-center justify-center gap-2">${items}</div>`;
}

function fmtInt(n) {
  return Number(n || 0).toLocaleString("zh-CN");
}
function fmtWan(n) {
  const value = Number(n || 0) / 10000;
  return `${value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })} 万`;
}
function fmtCompact(n) {
  const value = Number(n || 0);
  if (Math.abs(value) >= 10000) {
    return `${(value / 10000).toLocaleString("zh-CN", { maximumFractionDigits: 1 })}万`;
  }
  return fmtInt(value);
}
function monitorDisplayValue(dataset, value) {
  if (dataset && dataset.displayScale) return fmtWan(value);
  return fmtInt(value);
}
function monitorChartValue(dataset, value) {
  if (dataset && dataset.displayScale) return Number(value || 0) / dataset.displayScale;
  return Number(value || 0);
}
function monitorAxisTick(dataset, value) {
  if (dataset && dataset.displayScale) {
    return `${Number(value || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 })}万`;
  }
  return fmtInt(value);
}
function fmtPct(value, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((Number(value || 0) / Number(total)) * 100));
}
function formatBeijingTime(ts, opts) {
  return new Date(ts).toLocaleString("zh-CN", Object.assign({
    timeZone: "Asia/Shanghai",
    hour12: false,
  }, opts || {}));
}
function formatBeijingClock(ts) {
  return formatBeijingTime(ts, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function formatBeijingDate(ts) {
  return formatBeijingTime(ts, { month: "2-digit", day: "2-digit" });
}
function beijingDateKey(ts) {
  return formatBeijingTime(ts, { year: "numeric", month: "2-digit", day: "2-digit" });
}
function shortDateRange(period) {
  const short = (s) => String(s || "").replace(/^\d{4}-/, "").replace(/:\d{2}$/, "");
  return period.startTime && period.endTime ? `${short(period.startTime)} - ${short(period.endTime)}` : "";
}
function workerApiBase(mgtv) {
  return String(mgtv && mgtv.workerApiBase || "").trim().replace(/\/$/, "");
}
function workerUrl(path, params, mgtv) {
  const base = workerApiBase(mgtv);
  if (!base) throw new Error("Worker API 未配置");
  const url = new URL(`${base}${path}`);
  Object.keys(params || {}).forEach(key => {
    if (params[key] != null && params[key] !== "") url.searchParams.set(key, params[key]);
  });
  return url.toString();
}
async function fetchWorkerJson(path, params, mgtv) {
  const res = await fetch(workerUrl(path, params, mgtv), {
    headers: { "Accept": "application/json" },
    cache: "no-store",
    mode: "cors",
    credentials: "omit",
  });
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(`Worker 返回非 JSON：${text.slice(0, 80) || err.message}`);
  }
  if (!res.ok || json.ok === false) throw new Error(json.error || `Worker HTTP ${res.status}`);
  return json;
}
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function fetchWorkerJsonWithRetry(path, params, mgtv, retries) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const bust = attempt ? { _retry: `${Date.now()}-${attempt}` } : {};
      return await fetchWorkerJson(path, Object.assign({}, params || {}, bust), mgtv);
    } catch (err) {
      lastError = err;
      if (attempt < retries) await wait(700 * (attempt + 1));
    }
  }
  throw lastError;
}
function monitorCustomRequestRange() {
  if (monitorWindowMode === "custom" && Number.isFinite(monitorRangeStartTs) && Number.isFinite(monitorRangeEndTs)) {
    const start = Math.min(monitorRangeStartTs, monitorRangeEndTs);
    const end = Math.max(monitorRangeStartTs, monitorRangeEndTs);
    return { startMs: Math.max(0, start - MONITOR_MIN_RANGE_MS), endMs: end };
  }
  return null;
}
async function monitorHistoryRangeAnchor(dataset, mgtv) {
  if (!dataset.latestPath) return Date.now();
  try {
    const json = await fetchWorkerJsonWithRetry(dataset.latestPath, { _rangeAnchor: Date.now() }, mgtv, 1);
    const metaTs = Number(json && json.meta && json.meta.capturedMs);
    const stateTs = Date.parse(json && json.state && json.state.updatedAt || "");
    if (Number.isFinite(metaTs) && metaTs > 0) return metaTs;
    if (Number.isFinite(stateTs) && stateTs > 0) return stateTs;
  } catch (err) {
    console.warn(`${dataset.emptyName}一周窗口锚点暂时不可用`, err);
  }
  return Date.now();
}
async function monitorHistoryRequestRange(dataset, mgtv) {
  const customRange = monitorCustomRequestRange();
  if (customRange) return customRange;
  if (monitorWindowMode === "7d") {
    const end = await monitorHistoryRangeAnchor(dataset, mgtv);
    return { startMs: Math.max(0, end - monitorWindowMs(monitorWindowMode) - MONITOR_MIN_RANGE_MS), endMs: end };
  }
  return null;
}
async function fetchMonitorHistoryJson(dataset, mgtv) {
  const params = { limit: MONITOR_WORKER_HISTORY_LIMIT };
  const requestRange = await monitorHistoryRequestRange(dataset, mgtv);
  if (requestRange) {
    params.limit = MONITOR_WORKER_RANGE_HISTORY_LIMIT;
    params.startMs = requestRange.startMs;
    params.endMs = requestRange.endMs;
  }
  try {
    return await fetchWorkerJsonWithRetry(dataset.historyPath, params, mgtv, 2);
  } catch (err) {
    if (MONITOR_WORKER_HISTORY_LIMIT <= 360) throw err;
    return fetchWorkerJsonWithRetry(
      dataset.historyPath,
      Object.assign({}, params, { limit: Math.min(Number(params.limit) || MONITOR_WORKER_HISTORY_LIMIT, 360), _fallback: Date.now() }),
      mgtv,
      1
    );
  }
}
function monitorSnapshotFitsRequestRange(snapshot) {
  const range = monitorCustomRequestRange();
  if (!range || !snapshot || !Number.isFinite(snapshot.ts)) return true;
  return snapshot.ts >= range.startMs && snapshot.ts <= range.endMs;
}
async function fetchMonitorLatestSnapshot(dataset, campaign) {
  if (!dataset.latestPath || !workerApiBase(campaign.mgtv)) return null;
  try {
    const json = await fetchWorkerJsonWithRetry(dataset.latestPath, { _latest: Date.now() }, campaign.mgtv, 1);
    const state = dataset.key === "bilibili"
      ? hydrateBilibiliState(json.state || {}, "worker", json.meta)
      : hydrateMgtvState(json.state || {}, "worker", json.meta);
    const snapshot = snapshotFromMgtvState(state);
    if (!snapshot.rows.length || !monitorSnapshotFitsRequestRange(snapshot)) return null;
    return hydrateMonitorSnapshot(snapshot);
  } catch (err) {
    console.warn(`${dataset.emptyName}最新快照暂时不可用`, err);
    return null;
  }
}
async function fetchLocalMonitorHistoryJson(dataset, campaign) {
  const cfg = dataset.localConfigKey ? campaign && campaign[dataset.localConfigKey] : null;
  const path = cfg && dataset.localHistoryUrlKey ? cfg[dataset.localHistoryUrlKey] : "";
  if (!path) throw new Error("local_history_not_configured");
  const url = new URL(path, window.location.href);
  url.searchParams.set("_", String(Date.now()));
  const res = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(`本地历史返回非 JSON：${text.slice(0, 80) || err.message}`);
  }
  if (!res.ok || json.ok === false) throw new Error(json.error || `本地历史 HTTP ${res.status}`);
  return Array.isArray(json) ? { ok: true, snapshots: json } : json;
}
function hydrateMgtvState(raw, source, meta) {
  const periods = (raw.periods || []).map(period => Object.assign({}, period, {
    periodId: Number(period.periodId),
    targetValueInt: Number(period.targetValueInt || 0),
    rows: (period.rows || []).map(row => Object.assign({}, row, {
      rank: Number(row.rank || 0),
      interactionValue: Number(row.interactionValue || 0),
      roundAmount: Number(row.roundAmount || 0),
      onScreenCount: Number(row.onScreenCount || 0),
      isTarget: Boolean(row.isTarget),
    })),
  }));
  return {
    config: raw.config || {},
    periods,
    currentPeriodId: Number(raw.currentPeriodId || (periods[0] && periods[0].periodId) || 0),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
    source: source || "live",
    meta: meta || {},
  };
}
function mgtvParams(extra, mgtv) {
  return Object.assign({
    appId: mgtv.appId,
    platform: mgtv.platform || "iphone",
    abroad: 0,
    did: "",
    device: "",
    appVersion: "",
    osType: "",
    uuid: "",
    ticket: "",
  }, extra || {});
}
function mgtvUrl(path, params, mgtv) {
  const base = (mgtv.apiBase || "https://hb-mangott.api.mgtv.com").replace(/\/$/, "");
  const query = new URLSearchParams();
  Object.keys(params).forEach(k => {
    if (params[k] != null) query.set(k, params[k]);
  });
  return `${base}${path}?${query.toString()}`;
}
async function fetchMgtv(path, params, mgtv) {
  const res = await fetch(mgtvUrl(path, params, mgtv), {
    headers: { "Accept": "application/json, text/plain, */*" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.msg || `API ${json.code}`);
  return json.data || {};
}
function normalizeMgtvRow(item, targetName) {
  const cover = (item.covers && item.covers[0]) || {};
  const title = cover.coverTitle || item.coverTitle || "";
  const guest = item.guest || "";
  return {
    rank: Number(item.rank || 0),
    title,
    guest,
    interactionValue: Number(item.interactionValue || cover.amount || 0),
    roundAmount: Number(item.roundAmount || cover.roundAmount || 0),
    onScreenCount: Number(item.onScreenCount || 0),
    cid: item.cid || "",
    coverId: cover.coverId || item.id || "",
    coverUrl: cover.coverUrl || "",
    isTarget: guest.includes(targetName) || title.includes(targetName),
  };
}
function stageLabel(period) {
  const raw = period.stageTag || period.periodName || "";
  if (raw && raw.includes("舞台")) return raw;
  if (raw) return `${raw}舞台`;
  return `period ${period.periodId}`;
}
function campaignPeriods(config) {
  const byId = new Map();
  const add = period => {
    if (!period || !period.periodId) return;
    const periodId = Number(period.periodId);
    byId.set(periodId, Object.assign({}, byId.get(periodId) || {}, period, { periodId }));
  };
  add(config.livePeriod);
  (config.stageTags || []).forEach(add);
  add(config.weeklyPeriod);
  return Array.from(byId.values());
}
async function loadLiveMgtvDashboardData(campaign) {
  const mgtv = campaign.mgtv;
  const targetName = mgtv.targetName || "曾沛慈";
  const config = await fetchMgtv("/online/live/campaign/config", mgtvParams({}, mgtv), mgtv);
  const current = config.livePeriod || config.weeklyPeriod || {};
  const stagePeriods = campaignPeriods(config);
  const periods = await Promise.all(stagePeriods.map(async tag => {
    const periodId = Number(tag.periodId);
    const merged = Object.assign({}, tag, periodId === Number(current.periodId) ? current : {});
    merged.periodId = periodId;
    merged.periodLabel = stageLabel(merged);
    merged.targetValueInt = Number(merged.targetValueInt || 0);
    const data = await fetchMgtv("/online/live/campaign/list", mgtvParams({ periodId }, mgtv), mgtv);
    merged.rows = (data.list || []).map(row => normalizeMgtvRow(row, targetName));
    return merged;
  }));
  return hydrateMgtvState({
    config,
    periods,
    currentPeriodId: Number(current.periodId || (periods[0] && periods[0].periodId) || 0),
    updatedAt: new Date().toISOString(),
  }, "live");
}
async function loadWorkerMgtvDashboardData(campaign) {
  const json = await fetchWorkerJson("/latest", {}, campaign.mgtv);
  return hydrateMgtvState(json.state || {}, "worker", json.meta);
}
async function loadWorkerHotVoteDashboardData(campaign) {
  const json = await fetchWorkerJson("/hot/latest", {}, campaign.mgtv);
  return hydrateMgtvState(json.state || {}, "worker", json.meta);
}
async function loadWorkerWeiboStageDashboardData(campaign) {
  const json = await fetchWorkerJson("/weibo/latest", {}, campaign.mgtv);
  return hydrateMgtvState(json.state || {}, "worker", json.meta);
}
function hydrateBilibiliState(raw, source, meta) {
  const periods = (raw.periods || []).map(period => Object.assign({}, period, {
    periodId: Number(period.periodId),
    targetValueInt: Number(period.targetValueInt || 0),
    rows: (period.rows || []).map(row => Object.assign({}, row, {
      rank: Number(row.rank || 0),
      interactionValue: Number(row.interactionValue || 0),
      roundAmount: Number(row.roundAmount || row.like || 0),
      onScreenCount: Number(row.onScreenCount || row.favorite || 0),
      like: Number(row.like || row.roundAmount || 0),
      favorite: Number(row.favorite || row.onScreenCount || 0),
      coin: Number(row.coin || 0),
      share: Number(row.share || 0),
      danmaku: Number(row.danmaku || 0),
      reply: Number(row.reply || 0),
      performers: splitBilibiliNames(row.performers || row.performerNames || row.performerText),
      performerText: row.performerText || splitBilibiliNames(row.performers || row.performerNames).join("/"),
      isTarget: Boolean(row.isTarget),
    })),
  }));
  return {
    periods,
    currentPeriodId: Number(raw.currentPeriodId || (periods[0] && periods[0].periodId) || 0),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
    source: source || "worker",
    meta: meta || {},
  };
}
async function loadWorkerBilibiliDashboardData(campaign) {
  try {
    const json = await fetchWorkerJson("/bilibili/latest", {}, campaign.mgtv);
    return hydrateBilibiliState(json.state || {}, "worker", json.meta);
  } catch (err) {
    if (!String(err && err.message || "").includes("no_snapshot_yet")) throw err;
    const json = await fetchWorkerJson("/bilibili/live", {}, campaign.mgtv);
    return hydrateBilibiliState(json.state || {}, "worker-live", json.meta);
  }
}
async function loadMgtvDashboardData(campaign) {
  if (workerApiBase(campaign.mgtv)) {
    try {
      return await loadWorkerMgtvDashboardData(campaign);
    } catch (err) {
      console.warn("Worker 数据暂时不可用，改用 MGTV 实时接口", err);
    }
  }
  return loadLiveMgtvDashboardData(campaign);
}
async function loadHotVoteDashboardData(campaign) {
  if (!workerApiBase(campaign.mgtv)) return null;
  try {
    return await loadWorkerHotVoteDashboardData(campaign);
  } catch (err) {
    console.warn("姐姐夯值数据暂时不可用", err);
    return null;
  }
}
async function loadWeiboStageDashboardData(campaign) {
  if (!campaign || !campaign.weiboStage || campaign.weiboStage.collectionEnabled !== true) return null;
  if (!workerApiBase(campaign.mgtv)) return null;
  try {
    return await loadWorkerWeiboStageDashboardData(campaign);
  } catch (err) {
    console.warn("公演舞台限时推荐数据暂时不可用", err);
    return null;
  }
}
async function loadBilibiliDashboardData(campaign) {
  if (!campaign || !campaign.bilibili || campaign.bilibili.collectionEnabled !== true) return null;
  if (!workerApiBase(campaign.mgtv)) return null;
  try {
    return await loadWorkerBilibiliDashboardData(campaign);
  } catch (err) {
    console.warn("B站舞台数据暂时不可用", err);
    return null;
  }
}
function normalizeBilibiliName(name) {
  const raw = String(name || "").trim();
  if (!raw) return "";
  const alias = { 王蒙: "王濛" };
  return alias[raw] || raw;
}
function uniqueBilibiliNames(names) {
  const seen = new Set();
  return (names || []).map(normalizeBilibiliName).filter(name => {
    if (!name || seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}
function splitBilibiliNames(value) {
  if (Array.isArray(value)) return uniqueBilibiliNames(value);
  if (typeof value !== "string") return [];
  return uniqueBilibiliNames(value.split(/[、/,，&|｜\s]+/));
}
function bilibiliVideoConfigMap(c) {
  const videos = c && c.bilibili && Array.isArray(c.bilibili.videos) ? c.bilibili.videos : [];
  return new Map(videos.map(video => [String(video.bvid || ""), video]));
}
function parseBilibiliNamesFromText(text) {
  const haystack = String(text || "");
  return uniqueBilibiliNames(BILIBILI_KNOWN_PERFORMERS.filter(name => haystack.includes(name)));
}
function bilibiliPerformersForRow(row, c, configMap) {
  const cfg = (configMap || bilibiliVideoConfigMap(c)).get(String(row && row.bvid || row && row.coverId || ""));
  const names =
    splitBilibiliNames(row && (row.performers || row.performerNames || row.performerText)) ||
    [];
  const configured = names.length ? names : splitBilibiliNames(cfg && cfg.performers);
  if (configured.length) return configured;

  const parsed = parseBilibiliNamesFromText([
    row && row.biliTitle,
    row && row.title,
    cfg && cfg.title,
    row && row.owner,
  ].filter(Boolean).join(" "));
  return parsed.length ? parsed : ["未识别"];
}
function bilibiliPerformerText(row, c, configMap) {
  return bilibiliPerformersForRow(row, c, configMap).join(" / ");
}
function bilibiliStageLabel(row) {
  return String(row && row.title || row && row.biliTitle || row && row.bvid || "未命名舞台").trim();
}
function bilibiliBarExcludedPerformers(c) {
  return new Set(splitBilibiliNames(c && c.bilibili && c.bilibili.barExcludedPerformers));
}
function buildBilibiliPerformerStacks(rows, c) {
  const configMap = bilibiliVideoConfigMap(c);
  const excluded = bilibiliBarExcludedPerformers(c);
  const stageLabels = [];
  const byPerformer = new Map();
  (rows || []).forEach(row => {
    const stage = bilibiliStageLabel(row);
    const views = Number(row && row.interactionValue || row && row.view || 0);
    if (!stageLabels.includes(stage)) stageLabels.push(stage);
    bilibiliPerformersForRow(row, c, configMap).forEach(name => {
      if (excluded.has(name)) return;
      if (!byPerformer.has(name)) byPerformer.set(name, new Map());
      const stageMap = byPerformer.get(name);
      stageMap.set(stage, Number(stageMap.get(stage) || 0) + views);
    });
  });
  const labels = Array.from(byPerformer.entries())
    .map(([name, stageMap]) => ({
      name,
      total: Array.from(stageMap.values()).reduce((sum, value) => sum + Number(value || 0), 0),
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "zh-CN"))
    .map(item => item.name);
  return { labels, stageLabels, byPerformer };
}
function sumRows(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}
function rowValue(row) {
  return Number(row && row.interactionValue || 0);
}
function rowSecondaryValue(row) {
  return Number(row && row.roundAmount || 0);
}
function renderDashboardLoading(c) {
  const collectionStatus = renderCollectionStatus(c);
  $("dashboard").innerHTML = `
    <div class="bg-gradient-to-b from-white/60 to-brand-100/40">
      <div class="max-w-6xl mx-auto px-5 py-20 text-center">
        <h2 class="font-display text-3xl sm:text-4xl text-brand-600 mb-2">${esc(c.title)}</h2>
        <p class="text-gray-500 mb-8">${esc(c.subtitle)}</p>
        ${collectionStatus}
        <div class="inline-flex items-center gap-3 rounded-full border border-brand-100 bg-white px-5 py-3 text-sm text-brand-600 shadow-sm">
          <span class="inline-block h-2.5 w-2.5 rounded-full bg-brand-500 animate-pulse"></span>
          正在同步芒推推数据
        </div>
      </div>
    </div>`;
  alignDashboardHash();
}
function renderDashboardError(c, err) {
  const collectionStatus = renderCollectionStatus(c);
  $("dashboard").innerHTML = `
    <div class="bg-gradient-to-b from-white/60 to-brand-100/40">
      <div class="max-w-6xl mx-auto px-5 py-20 text-center">
        <h2 class="font-display text-3xl sm:text-4xl text-brand-600 mb-2">${esc(c.title)}</h2>
        <p class="text-gray-500 mb-8">${esc(c.subtitle)}</p>
        ${collectionStatus}
        <div class="max-w-xl mx-auto rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <p class="font-medium text-gray-800 mb-2">数据暂时读取失败</p>
          <p class="text-sm text-gray-500 mb-5">${esc(err && err.message ? err.message : err)}</p>
          <button type="button" data-mgtv-refresh
            class="inline-flex items-center justify-center rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-colors">
            重新同步
          </button>
        </div>
      </div>
    </div>`;
  const btn = document.querySelector("[data-mgtv-refresh]");
  if (btn) btn.addEventListener("click", () => loadAndRenderMgtvDashboard(c));
}
function renderHotVoteDashboardSection(c, hotState) {
  const mgtv = c.mgtv || {};
  const period = hotState && hotState.periods && hotState.periods[0];
  if (!period || !(period.rows || []).length) return "";

  const rows = (period.rows || []).slice().sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0));
  const target = rows.find(row => row.isTarget) || rows.find(row => String(row.title || "").includes(mgtv.targetName || "曾沛慈")) || rows[0] || {};
  const hotTotal = sumRows(rows, "interactionValue");
  const share = fmtPct(rowValue(target), hotTotal);
  const updated = formatBeijingClock(hotState.updatedAt);
  const sourceLink = mgtv.hotVoteSourceUrl
    ? `<a href="${esc(mgtv.hotVoteSourceUrl)}" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 transition-colors">姐姐夯值页 ${ICON.external}</a>`
    : "";

  const stats = [
    { label: "沛慈夯爆了", value: fmtInt(rowValue(target)), note: `占全榜 ${share}%` },
    { label: "姐姐夯值排名", value: target.rank ? `#${target.rank}` : "--", note: target.guest || "暂无曲目" },
  ].map(item => `
    <div class="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
      <p class="text-sm text-gray-500">${esc(item.label)}</p>
      <p class="mt-1 font-display text-3xl text-brand-600">${esc(item.value)}</p>
      <p class="mt-1 truncate text-xs text-gray-500">${esc(item.note)}</p>
    </div>`).join("");

  const tableRows = rows.slice(0, 10).map(row => `
    <tr class="${row.isTarget ? "bg-brand-50/80 text-brand-800" : ""}">
      <td class="whitespace-nowrap px-3 py-2 font-bold">#${row.rank}</td>
      <td class="px-3 py-2 font-medium">${esc(row.title)}</td>
      <td class="px-3 py-2 text-right">${fmtInt(rowValue(row))}</td>
    </tr>`).join("");

  return `
    <section class="mb-10">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 class="font-display text-2xl text-brand-600">姐姐夯值统计</h3>
          <p class="mt-1 text-sm text-gray-500">最近采样 ${esc(updated)} 北京时间 · ${fmtInt(rows.length)} 位姐姐</p>
        </div>
        <div class="flex flex-wrap items-center gap-3 text-sm">
          ${sourceLink}
        </div>
      </div>
      <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">${stats}</div>
      <div class="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div class="min-w-0 rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
          <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h4 class="font-medium text-gray-800">姐姐夯爆了 Top 10</h4>
            <p class="text-xs text-gray-400">红色为${esc(mgtv.targetName || "曾沛慈")}</p>
          </div>
          <div class="relative w-full min-w-0" style="height:360px;">
            <canvas id="hotVoteChart"></canvas>
          </div>
        </div>
        <div class="min-w-0 overflow-hidden rounded-xl border border-brand-100 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-brand-50 text-xs text-brand-700">
                <tr>
                  <th class="px-3 py-2 text-left">排名</th>
                  <th class="px-3 py-2 text-left">姐姐</th>
                  <th class="px-3 py-2 text-right">夯爆了</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-brand-50">${tableRows}</tbody>
            </table>
          </div>
        </div>
      </div>
	    </section>`;
}
function weiboStageHighlights() {
  return MONITOR_DATASETS.weibo.highlightTitles || [];
}
function isWeiboStageHighlighted(row) {
  return weiboStageHighlights().includes(row && row.title);
}
function flattenWeiboStageRows(weiboState) {
  return (weiboState && weiboState.periods || []).flatMap(period =>
    (period.rows || []).map(row => Object.assign({}, row, {
      periodId: period.periodId,
      periodLabel: period.periodLabel,
    })));
}
function renderWeiboStageDashboardSection(c, weiboState) {
  const cfg = c.weiboStage || {};
  const periods = weiboState && weiboState.periods || [];
  const rows = flattenWeiboStageRows(weiboState);
  if (!periods.length || !rows.length) return "";

  const updated = formatBeijingClock(weiboState.updatedAt);
  const sourceLink = cfg.sourceUrl
    ? `<a href="${esc(cfg.sourceUrl)}" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 transition-colors">微博推荐页 ${ICON.external}</a>`
    : "";
  const highlightedRows = rows.filter(isWeiboStageHighlighted);
  const total = sumRows(rows, "interactionValue");
  const highlightTotal = sumRows(highlightedRows, "interactionValue");

  const topStats = periods.map(period => {
    const top = (period.rows || []).slice().sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0))[0] || {};
    return {
      label: period.periodLabel.replace("五公", "").replace("舞台推荐", "") || period.periodLabel,
      value: top.title || "--",
      note: top.interactionValue ? `${fmtWan(top.interactionValue)} · #${top.rank || 1}` : "暂无数据",
      highlighted: isWeiboStageHighlighted(top),
    };
  });
  const stats = topStats.concat([
    { label: "重点作品合计", value: fmtWan(highlightTotal), note: `${highlightedRows.map(row => row.title).join(" / ") || "暂无"}`, highlighted: true },
    { label: "全榜推荐值", value: fmtWan(total), note: `${rows.length} 个作品`, highlighted: false },
  ]).map(item => `
    <div class="rounded-xl border ${item.highlighted ? "border-red-100 bg-red-50/60" : "border-brand-100 bg-white"} p-5 shadow-sm">
      <p class="text-sm ${item.highlighted ? "text-red-500" : "text-gray-500"}">${esc(item.label)}</p>
      <p class="mt-1 font-display text-2xl ${item.highlighted ? "text-red-600" : "text-brand-600"}">${esc(item.value)}</p>
      <p class="mt-1 truncate text-xs text-gray-500">${esc(item.note)}</p>
    </div>`).join("");

  const tableRows = periods.map(period => {
    const periodRows = (period.rows || []).slice().sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0));
    return periodRows.map(row => {
      const highlighted = isWeiboStageHighlighted(row);
      return `
        <tr class="${highlighted ? "bg-red-50/80 text-red-800" : ""}">
          <td class="whitespace-nowrap px-3 py-2 text-gray-500">${esc(period.periodLabel.replace("五公", "").replace("舞台推荐", ""))}</td>
          <td class="whitespace-nowrap px-3 py-2 font-bold">#${row.rank}</td>
          <td class="px-3 py-2 font-medium">${esc(row.title)}</td>
          <td class="px-3 py-2 text-right">${fmtWan(row.interactionValue)}</td>
        </tr>`;
    }).join("");
  }).join("");

  return `
    <section class="mb-10">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 class="font-display text-2xl text-brand-600">公演舞台限时推荐统计</h3>
          <p class="mt-1 text-sm text-gray-500">最近采样 ${esc(updated)} 北京时间 · 每 5 分钟由本地模拟器上传 Worker</p>
        </div>
        <div class="flex flex-wrap items-center gap-3 text-sm">${sourceLink}</div>
      </div>
      <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">${stats}</div>
      <div class="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div class="min-w-0 rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
          <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h4 class="font-medium text-gray-800">当前推荐值对比</h4>
            <p class="text-xs text-gray-400">红色为重点作品</p>
          </div>
          <div class="relative w-full min-w-0" style="height:${Math.max(300, rows.length * 34)}px;">
            <canvas id="weiboStageChart"></canvas>
          </div>
        </div>
        <div class="min-w-0 overflow-hidden rounded-xl border border-brand-100 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-brand-50 text-xs text-brand-700">
                <tr>
                  <th class="px-3 py-2 text-left">类别</th>
                  <th class="px-3 py-2 text-left">排名</th>
                  <th class="px-3 py-2 text-left">作品</th>
                  <th class="px-3 py-2 text-right">推荐值</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-brand-50">${tableRows}</tbody>
            </table>
          </div>
        </div>
      </div>
    </section>`;
}
function renderBilibiliDashboardSection(c, biliState) {
  const cfg = c.bilibili || {};
  const period = biliState && biliState.periods && biliState.periods[0];
  const rows = (period && period.rows || []).slice().sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0));
  if (!rows.length) return "";
  const displayRows = rows.slice(0, BILIBILI_TABLE_LIMIT);

  const configMap = bilibiliVideoConfigMap(c);
  const stackData = buildBilibiliPerformerStacks(rows, c);
  const updated = formatBeijingClock(biliState.updatedAt);
  const cutoffNote = cfg.cutoffNote
    ? `<p class="mt-1 text-xs text-gray-400">${esc(cfg.cutoffNote)}</p>`
    : "";
  const sourceLink = cfg.sourceUrl
    ? `<a href="${esc(cfg.sourceUrl)}" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 transition-colors">B站 ${ICON.external}</a>`
    : "";
  const top = rows[0] || {};
  const topPerformer = (stackData.labels || []).map(name => ({
    name,
    total: Array.from((stackData.byPerformer.get(name) || new Map()).values())
      .reduce((sum, value) => sum + Number(value || 0), 0),
  }))[0] || null;
  const totalInteract = rows.reduce((sum, row) =>
    sum + Number(row.like || row.roundAmount || 0) + Number(row.favorite || row.onScreenCount || 0) +
      Number(row.coin || 0) + Number(row.share || 0), 0);
  const targetCount = rows.filter(row => bilibiliPerformersForRow(row, c, configMap).includes("曾沛慈")).length;

  const stats = [
    { label: "监控视频", value: `${rows.length} 个`, note: `表格显示播放量前 ${BILIBILI_TABLE_LIMIT}` },
    { label: "当前最高播放", value: fmtCompact(top.interactionValue), note: top.title ? `#${top.rank} ${top.title}` : "暂无" },
    { label: "演出者第一名", value: topPerformer ? topPerformer.name : "--", note: topPerformer ? `总播放量 ${fmtCompact(topPerformer.total)}` : "暂无" },
    { label: "总互动", value: fmtCompact(totalInteract), note: `含沛慈 ${targetCount} 个视频` },
  ].map(item => `
    <div class="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
      <p class="text-sm text-gray-500">${esc(item.label)}</p>
      <p class="mt-1 font-display text-3xl text-brand-600">${esc(item.value)}</p>
      <p class="mt-1 truncate text-xs text-gray-500">${esc(item.note)}</p>
    </div>`).join("");

  const tableRows = displayRows.map(row => {
    const url = row.url || (row.bvid ? `https://www.bilibili.com/video/${row.bvid}/` : "");
    const performerText = bilibiliPerformerText(row, c, configMap);
    const subtitle = row.biliTitle && row.biliTitle !== row.title
      ? `<p class="mt-0.5 max-w-[28rem] truncate text-xs text-gray-400">${esc(row.biliTitle)}</p>`
      : "";
    return `
      <tr class="${Number(row.rank || 0) <= 5 ? "bg-brand-50/70" : ""}">
        <td class="whitespace-nowrap px-3 py-2 font-bold">#${row.rank}</td>
        <td class="min-w-[14rem] px-3 py-2">
          <p class="font-medium text-gray-800">${esc(row.title)}</p>
          ${subtitle}
        </td>
        <td class="min-w-[12rem] px-3 py-2 text-gray-500">${esc(performerText)}</td>
        <td class="whitespace-nowrap px-3 py-2 text-right font-semibold text-brand-700">${fmtCompact(row.interactionValue)}</td>
        <td class="whitespace-nowrap px-3 py-2 text-right">${fmtCompact(row.like || row.roundAmount)}</td>
        <td class="whitespace-nowrap px-3 py-2 text-right">${fmtCompact(row.favorite || row.onScreenCount)}</td>
        <td class="whitespace-nowrap px-3 py-2 text-right">${fmtCompact(row.coin)}</td>
        <td class="whitespace-nowrap px-3 py-2 text-right">${fmtCompact(row.share)}</td>
        <td class="whitespace-nowrap px-3 py-2 text-right">
          ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-end gap-1 text-brand-600 hover:text-brand-700">${esc(row.bvid || "打开")} ${ICON.external}</a>` : "--"}
        </td>
      </tr>`;
  }).join("");
  const chartHeight = Math.max(280, stackData.labels.length * 34 + 96);

  return `
    <section class="mb-10">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 class="font-display text-2xl text-brand-600">B站舞台数据</h3>
          <p class="mt-1 text-sm text-gray-500">最近采样 ${esc(updated)} 北京时间 · 播放、点赞、收藏、投币、转发</p>
          ${cutoffNote}
        </div>
        <div class="flex flex-wrap items-center gap-3 text-sm">${sourceLink}</div>
      </div>
      <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">${stats}</div>
      <div class="mb-6 rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
        <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h4 class="font-medium text-gray-800">演出者播放量拆分</h4>
          <p class="text-xs text-gray-400">按全部监控舞台堆叠</p>
        </div>
        <div class="relative w-full min-w-0" style="height:${chartHeight}px;">
          <canvas id="bilibiliPerformerChart"></canvas>
        </div>
      </div>
      <div class="overflow-hidden rounded-xl border border-brand-100 bg-white shadow-sm">
        <div class="border-b border-brand-100 bg-white px-4 py-3 text-xs text-gray-500">
          表格仅显示当前播放量前 ${BILIBILI_TABLE_LIMIT} 个舞台；上方柱形图统计全部监控舞台。
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[58rem] text-sm">
            <thead class="bg-brand-50 text-xs text-brand-700">
              <tr>
                <th class="px-3 py-2 text-left">排名</th>
                <th class="px-3 py-2 text-left">舞台</th>
                <th class="px-3 py-2 text-left">演出者</th>
                <th class="px-3 py-2 text-right">播放</th>
                <th class="px-3 py-2 text-right">点赞</th>
                <th class="px-3 py-2 text-right">收藏</th>
                <th class="px-3 py-2 text-right">投币</th>
                <th class="px-3 py-2 text-right">转发</th>
                <th class="px-3 py-2 text-right">链接</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-50">${tableRows}</tbody>
          </table>
        </div>
      </div>
    </section>`;
}
function renderMgtvDashboard(c, state, selectedPeriodId, staleError, hotState, weiboState, biliState) {
  const mgtv = c.mgtv;
  const periods = state.periods || [];
  const selected = periods.find(p => Number(p.periodId) === Number(selectedPeriodId)) || periods[0];
  if (!selected) {
    renderDashboardError(c, new Error("没有找到舞台数据"));
    return;
  }
  dashboardSelectedPeriodId = Number(selected.periodId);

  const allRows = periods.flatMap(p => p.rows || []);
  const targetRows = allRows.filter(row => row.isTarget);
  const selectedTargetRows = (selected.rows || []).filter(row => row.isTarget);
  const mainTarget = selectedTargetRows[0] || (selected.rows || [])[0] || {};
  const targetTotal = sumRows(targetRows, "interactionValue");
  const screenTotal = sumRows(targetRows, "onScreenCount");
  const target = Number(selected.targetValueInt || 0);
  const progress = fmtPct(mainTarget.roundAmount, target);
  const updatedText = formatBeijingClock(state.updatedAt);
  const sourceBadge = state.source === "worker" ? "后台每分钟监控" : "MGTV 实时接口";
  const sourceLink = mgtv.sourceUrl
    ? `<a href="${esc(mgtv.sourceUrl)}" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 transition-colors">芒推推页面 ${ICON.external}</a>`
    : "";
  const staleText = staleError
    ? `<span class="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">保留上次数据</span>`
    : "";
  const collectionStatus = renderCollectionStatus(c);
  const hotVoteSection = renderHotVoteDashboardSection(c, hotState);
  const weiboStageSection = renderWeiboStageDashboardSection(c, weiboState);
  const bilibiliSection = renderBilibiliDashboardSection(c, biliState);

  const stats = [
    { label: "沛慈相关累计助力", value: fmtInt(targetTotal), note: `${targetRows.length} 个舞台作品` },
    { label: "当前舞台排名", value: mainTarget.rank ? `#${mainTarget.rank}` : "--", note: mainTarget.title || "暂无数据" },
    { label: "本轮助力进度", value: `${progress}%`, note: `${fmtInt(mainTarget.roundAmount)} / ${fmtInt(target)}` },
    { label: "累计上屏次数", value: `${fmtInt(screenTotal)} 次`, note: `当前舞台 ${fmtInt(sumRows(selectedTargetRows, "onScreenCount"))} 次` },
  ].map(s => `
    <div class="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
      <p class="text-sm text-gray-500">${esc(s.label)}</p>
      <p class="mt-1 font-display text-3xl text-brand-600">${esc(s.value)}</p>
      <p class="mt-1 truncate text-xs text-gray-500">${esc(s.note)}</p>
    </div>`).join("");

  const tabs = periods.map(p => {
    const row = (p.rows || []).find(r => r.isTarget) || (p.rows || [])[0] || {};
    const active = Number(p.periodId) === Number(selected.periodId);
    return `
      <button type="button" data-period-id="${p.periodId}"
        class="min-w-[9rem] rounded-xl border px-4 py-3 text-left transition-colors
          ${active ? "border-brand-500 bg-brand-500 text-white shadow-sm" : "border-brand-100 bg-white text-gray-700 hover:border-brand-300"}">
        <span class="block text-sm font-bold">${esc(p.periodLabel)}</span>
        <span class="mt-1 block truncate text-xs ${active ? "text-white/80" : "text-gray-400"}">
          ${row.rank ? `#${row.rank} ${row.title}` : "暂无排名"}
        </span>
      </button>`;
  }).join("");

  const progressBar = `
    <div class="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
      <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 class="font-medium text-gray-800">${esc(selected.periodLabel)} · ${esc(mainTarget.title || "榜单")}</h3>
          <p class="mt-1 text-xs text-gray-500">${esc(shortDateRange(selected))}</p>
        </div>
        <p class="font-display text-2xl text-brand-600">${progress}%</p>
      </div>
      <div class="h-4 overflow-hidden rounded-full bg-brand-100" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
        <div class="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style="width:${progress}%"></div>
      </div>
      <p class="mt-2 text-xs text-gray-500">本轮 ${fmtInt(mainTarget.roundAmount)} / 目标 ${fmtInt(target)}，距下一次上屏 ${fmtInt(Math.max(target - Number(mainTarget.roundAmount || 0), 0))}</p>
    </div>`;

  const tableRows = (selected.rows || []).map(row => {
    const left = Math.max(target - row.roundAmount, 0);
    return `
      <tr class="${row.isTarget ? "bg-brand-50/80 text-brand-800" : ""}">
        <td class="whitespace-nowrap px-3 py-2 font-bold">#${row.rank}</td>
        <td class="px-3 py-2 font-medium">${esc(row.title)}</td>
        <td class="px-3 py-2 text-right">${fmtInt(row.interactionValue)}</td>
        <td class="px-3 py-2 text-right">${fmtInt(row.roundAmount)}</td>
        <td class="px-3 py-2 text-right">${fmtInt(left)}</td>
        <td class="px-3 py-2 text-right">${fmtInt(row.onScreenCount)}</td>
        <td class="min-w-[16rem] px-3 py-2 text-gray-500">${esc(row.guest)}</td>
      </tr>`;
  }).join("");

  const chartHeight = Math.max(260, (selected.rows || []).length * 34);
  $("dashboard").innerHTML = `
    <div class="bg-gradient-to-b from-white/60 to-brand-100/40">
      <div class="max-w-6xl mx-auto px-5 py-20">
        <div class="mb-3 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
          <span class="rounded-full bg-white px-3 py-1 font-medium text-brand-600 shadow-sm">${esc(sourceBadge)}</span>
          <span>北京时间 ${esc(updatedText)}</span>
          <span>每 ${Math.round((mgtv.refreshMs || 60000) / 1000)} 秒刷新</span>
          ${staleText}
        </div>
        <h2 class="font-display text-3xl sm:text-4xl text-brand-600 mb-2 text-center">${esc(c.title)}</h2>
        <p class="text-center text-gray-500 mb-6">${esc(c.subtitle)}</p>
        <div class="mb-8 flex flex-wrap items-center justify-center gap-4 text-sm">
          ${sourceLink}
        </div>
        ${collectionStatus}

        ${bilibiliSection}
        ${hotVoteSection}
        ${weiboStageSection}

        <section>
          <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 class="font-display text-2xl text-brand-600">公演舞台统计</h3>
              <p class="mt-1 text-sm text-gray-500">各公演舞台的助力值、上屏次数与本轮进度</p>
            </div>
          </div>
          <div class="mb-6 flex gap-3 overflow-x-auto pb-2">${tabs}</div>
          <div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">${stats}</div>
          <div class="mb-8">${progressBar}</div>

          <div class="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <div class="min-w-0 rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
              <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h3 class="font-medium text-gray-800">${esc(selected.periodLabel)}助力榜</h3>
                <p class="text-xs text-gray-400">红色为${esc(mgtv.targetName || "曾沛慈")}相关作品</p>
              </div>
              <div class="relative w-full min-w-0" style="height:${chartHeight}px;">
                <canvas id="rankChart"></canvas>
              </div>
            </div>
            <div class="min-w-0 rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
              <h3 class="mb-3 font-medium text-gray-800">沛慈相关作品助力对比</h3>
              <div class="relative w-full min-w-0" style="height:300px;">
                <canvas id="stageChart"></canvas>
              </div>
            </div>
          </div>

          <div class="mt-6 overflow-hidden rounded-xl border border-brand-100 bg-white shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-brand-50 text-xs text-brand-700">
                  <tr>
                    <th class="px-3 py-2 text-left">排名</th>
                    <th class="px-3 py-2 text-left">作品</th>
                    <th class="px-3 py-2 text-right">累计助力</th>
                    <th class="px-3 py-2 text-right">本轮助力</th>
                    <th class="px-3 py-2 text-right">距目标</th>
                    <th class="px-3 py-2 text-right">上屏</th>
                    <th class="px-3 py-2 text-left">阵容</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-brand-50">${tableRows}</tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>`;

  attachMgtvDashboardHandlers(c, state);
  drawMgtvCharts(c, state, selected, hotState, weiboState, biliState);
  alignDashboardHash();
}
function alignDashboardHash() {
  if (dashboardHashAligned || window.location.hash !== "#dashboard") return;
  dashboardHashAligned = true;
  requestAnimationFrame(() => {
    const section = $("dashboard");
    if (section) section.scrollIntoView({ block: "start" });
  });
}
function attachMgtvDashboardHandlers(c, state) {
  document.querySelectorAll("[data-period-id]").forEach(btn => {
    btn.addEventListener("click", () => renderMgtvDashboard(c, state, Number(btn.dataset.periodId), null, dashboardHotState, dashboardWeiboStageState, dashboardBilibiliState));
  });
  const refresh = document.querySelector("[data-mgtv-refresh]");
  if (refresh) refresh.addEventListener("click", () => loadAndRenderMgtvDashboard(c, dashboardSelectedPeriodId));
}
function drawMgtvCharts(c, state, selected, hotState, weiboState, biliState) {
  if (dashboardBilibiliPerformerChart) dashboardBilibiliPerformerChart.destroy();
  if (dashboardWeiboStageChart) dashboardWeiboStageChart.destroy();
  if (dashboardHotVoteChart) dashboardHotVoteChart.destroy();
  if (dashboardRankChart) dashboardRankChart.destroy();
  if (dashboardStageChart) dashboardStageChart.destroy();
  if (!window.Chart) return;
  const noAnim = reducedMotion();
  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: noAnim ? false : undefined,
    plugins: { legend: { display: false } },
  };
  const hotPeriod = hotState && hotState.periods && hotState.periods[0];
  const bilibiliCanvas = $("bilibiliPerformerChart");
  const bilibiliPeriod = biliState && biliState.periods && biliState.periods[0];
  const bilibiliRows = (bilibiliPeriod && bilibiliPeriod.rows || [])
    .slice()
    .sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0));
  if (bilibiliCanvas && bilibiliRows.length) {
    const stackData = buildBilibiliPerformerStacks(bilibiliRows, c);
    dashboardBilibiliPerformerChart = new Chart(bilibiliCanvas, {
      type: "bar",
      data: {
        labels: stackData.labels,
        datasets: stackData.stageLabels.map((stage, index) => ({
          label: stage,
          data: stackData.labels.map(name => Number((stackData.byPerformer.get(name) || new Map()).get(stage) || 0)),
          backgroundColor: BILIBILI_STACK_COLORS[index % BILIBILI_STACK_COLORS.length],
          borderWidth: 0,
          borderRadius: 4,
          stack: "views",
        })),
      },
      options: Object.assign({}, baseOpts, {
        indexAxis: "y",
        interaction: { mode: "index", axis: "y", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            filter: item => Number(item.raw || 0) > 0,
            callbacks: {
              label: item => `${item.dataset.label}: ${fmtInt(item.raw)} 播放`,
              footer: items => {
                const total = items.reduce((sum, item) => sum + Number(item.raw || 0), 0);
                return `合计: ${fmtInt(total)} 播放`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            beginAtZero: true,
            grid: { color: "#fde8e8" },
            title: { display: true, text: "播放量" },
            ticks: { callback: value => fmtCompact(value) },
          },
          y: {
            stacked: true,
            grid: { display: false },
          },
        },
      }),
    });
  }

  const hotCanvas = $("hotVoteChart");
  if (hotCanvas && hotPeriod) {
    const hotRows = (hotPeriod.rows || [])
      .slice()
      .sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0))
      .slice(0, 10);
    dashboardHotVoteChart = new Chart(hotCanvas, {
      type: "bar",
      data: {
        labels: hotRows.map(row => row.title),
        datasets: [{
          data: hotRows.map(row => rowValue(row)),
          backgroundColor: hotRows.map(row => row.isTarget ? "#dc2626" : "#fecaca"),
          borderRadius: 6,
        }],
      },
      options: Object.assign({}, baseOpts, {
        indexAxis: "y",
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: "#fde8e8" },
            title: { display: true, text: "夯爆了投送值" },
            ticks: { callback: value => fmtInt(value) },
          },
          y: { grid: { display: false } },
        },
      }),
    });
  }

  const weiboCanvas = $("weiboStageChart");
  const weiboRows = flattenWeiboStageRows(weiboState)
    .slice()
    .sort((a, b) => Number(a.periodId || 0) - Number(b.periodId || 0) || Number(a.rank || 0) - Number(b.rank || 0));
  if (weiboCanvas && weiboRows.length) {
    dashboardWeiboStageChart = new Chart(weiboCanvas, {
      type: "bar",
      data: {
        labels: weiboRows.map(row => `${String(row.periodLabel || "").replace("五公", "").replace("舞台推荐", "")} · ${row.title}`),
        datasets: [{
          data: weiboRows.map(row => Number(row.interactionValue || 0) / 10000),
          backgroundColor: weiboRows.map(row => isWeiboStageHighlighted(row) ? "#dc2626" : "#fecaca"),
          borderRadius: 6,
        }],
      },
      options: Object.assign({}, baseOpts, {
        indexAxis: "y",
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: "#fde8e8" },
            title: { display: true, text: "推荐值（万）" },
            ticks: { callback: value => `${Number(value || 0).toLocaleString("zh-CN", { maximumFractionDigits: 2 })}万` },
          },
          y: { grid: { display: false } },
        },
      }),
    });
  }

  const rows = selected.rows || [];
  dashboardRankChart = new Chart($("rankChart"), {
    type: "bar",
    data: {
      labels: rows.map(row => row.title),
      datasets: [{
        data: rows.map(row => row.interactionValue),
        backgroundColor: rows.map(row => row.isTarget ? "#dc2626" : "#fecaca"),
        borderRadius: 6,
      }],
    },
    options: Object.assign({}, baseOpts, {
      indexAxis: "y",
      scales: {
        x: { beginAtZero: true, grid: { color: "#fde8e8" }, ticks: { callback: value => fmtInt(value) } },
        y: { grid: { display: false } },
      },
    }),
  });

  const stageValues = (state.periods || []).map(period =>
    sumRows((period.rows || []).filter(row => row.isTarget), "interactionValue"));
  dashboardStageChart = new Chart($("stageChart"), {
    type: "bar",
    data: {
      labels: (state.periods || []).map(period => period.periodLabel),
      datasets: [{
        data: stageValues,
        backgroundColor: "#dc2626",
        borderRadius: 8,
      }],
    },
    options: Object.assign({}, baseOpts, {
      scales: {
        y: { beginAtZero: true, grid: { color: "#fde8e8" }, ticks: { callback: value => fmtInt(value) } },
        x: { grid: { display: false } },
      },
    }),
  });
}
function scheduleMgtvRefresh(c) {
  clearInterval(dashboardRefreshTimer);
  if (new URLSearchParams(window.location.search).get("noAutoRefresh") === "1") return;
  const ms = Number(c.mgtv && c.mgtv.refreshMs || 0);
  if (ms > 0) {
    dashboardRefreshTimer = setInterval(() => {
      loadAndRenderMgtvDashboard(c, dashboardSelectedPeriodId, true);
    }, ms);
  }
}
async function loadAndRenderMgtvDashboard(c, preferredPeriodId, silent) {
  if (!silent) renderDashboardLoading(c);
  try {
    const [state, hotState, weiboStageState, bilibiliState] = await Promise.all([
      loadMgtvDashboardData(c),
      loadHotVoteDashboardData(c),
      loadWeiboStageDashboardData(c),
      loadBilibiliDashboardData(c),
    ]);
    dashboardState = state;
    dashboardHotState = hotState || dashboardHotState;
    dashboardWeiboStageState = weiboStageState || dashboardWeiboStageState;
    dashboardBilibiliState = bilibiliState || dashboardBilibiliState;
    recordMgtvMonitorSnapshot(state);
    const selected = preferredPeriodId || state.currentPeriodId || (state.periods[0] && state.periods[0].periodId);
    renderMgtvDashboard(c, state, selected, null, dashboardHotState, dashboardWeiboStageState, dashboardBilibiliState);
    scheduleMgtvRefresh(c);
  } catch (err) {
    if (dashboardState && silent) {
      renderMgtvDashboard(c, dashboardState, dashboardSelectedPeriodId, err, dashboardHotState, dashboardWeiboStageState, dashboardBilibiliState);
    } else {
      renderDashboardError(c, err);
    }
  }
}
function renderDashboard() {
  const c = SITE.campaign;
  if (c.mgtv) {
    loadAndRenderMgtvDashboard(c);
    return;
  }
}
function refreshMgtvOnForeground() {
  const c = SITE.campaign;
  if (!c || !c.mgtv) return;
  const now = Date.now();
  if (now - mgtvLastForegroundRefreshAt < 15000) return;
  mgtvLastForegroundRefreshAt = now;
  loadAndRenderMgtvDashboard(c, dashboardSelectedPeriodId, true);
}
function initMgtvForegroundRefresh() {
  if (mgtvForegroundRefreshBound) return;
  mgtvForegroundRefreshBound = true;
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshMgtvOnForeground();
  });
  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#dashboard" || window.location.hash === "#monitor") {
      refreshMgtvOnForeground();
    }
  });
}
function loadMonitorHistory() {
  try {
    const raw = localStorage.getItem(MONITOR_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(s => s && s.ts && Array.isArray(s.rows)) : [];
  } catch (e) {
    console.warn("loadMonitorHistory", e);
    return [];
  }
}
function saveMonitorHistory(history) {
  try {
    localStorage.setItem(MONITOR_STORAGE_KEY, JSON.stringify(history.slice(-MONITOR_MAX_SNAPSHOTS)));
  } catch (e) {
    console.warn("saveMonitorHistory", e);
  }
}
function hydrateMonitorSnapshot(snapshot) {
  return Object.assign({}, snapshot, {
    ts: Number(snapshot.ts || Date.parse(snapshot.iso) || 0),
    rows: (snapshot.rows || []).map(row => Object.assign({}, row, {
      periodId: Number(row.periodId),
      rank: Number(row.rank || 0),
      interactionValue: Number(row.interactionValue || 0),
      roundAmount: Number(row.roundAmount || 0),
      onScreenCount: Number(row.onScreenCount || 0),
      hotValue: Number(row.hotValue || 0),
      awkwardValue: Number(row.awkwardValue || 0),
      like: Number(row.like || row.roundAmount || 0),
      favorite: Number(row.favorite || row.onScreenCount || 0),
      coin: Number(row.coin || 0),
      share: Number(row.share || 0),
      danmaku: Number(row.danmaku || 0),
      reply: Number(row.reply || 0),
      performers: splitBilibiliNames(row.performers || row.performerNames || row.performerText),
      performerText: row.performerText || splitBilibiliNames(row.performers || row.performerNames).join("/"),
      isTarget: Boolean(row.isTarget),
    })),
  });
}
function sanitizeMonitorHistory(history) {
  const snapshots = (history || [])
    .filter(s => s && s.ts && Array.isArray(s.rows))
    .slice()
    .sort((a, b) => a.ts - b.ts)
    .map(snapshot => Object.assign({}, snapshot, {
      rows: (snapshot.rows || []).map(row => Object.assign({}, row)),
    }));
  const byKey = new Map();
  snapshots.forEach((snapshot, snapshotIndex) => {
    (snapshot.rows || []).forEach((row, rowIndex) => {
      const key = `${row.periodId || ""}:${row.key || row.coverId || row.title || rowIndex}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push({ snapshotIndex, rowIndex, value: Number(row.interactionValue || 0) });
    });
  });
  byKey.forEach(entries => {
    entries.forEach((entry, index) => {
      if (index === 0 || index === entries.length - 1) return;
      const prev = entries[index - 1].value;
      const curr = entry.value;
      const next = entries[index + 1].value;
      const looksLikeOneOffSpike = curr > prev && next < curr && next <= Math.max(prev, 0) * 1.1 + 1000;
      if (!looksLikeOneOffSpike) return;
      const row = snapshots[entry.snapshotIndex].rows[entry.rowIndex];
      row.interactionValue = Math.max(prev, next);
      row.qualityFlag = "corrected_spike";
    });
  });
  return snapshots;
}
async function loadMonitorHistoryForDisplay(c) {
  const dataset = monitorDatasetConfig();
  monitorHistoryStatus = { ok: true, source: "local", count: 0, error: "" };
  if (workerApiBase(c.mgtv) && dataset.historyPath) {
    try {
      const json = await fetchMonitorHistoryJson(dataset, c.mgtv);
      const snapshots = (json.snapshots || []).map(hydrateMonitorSnapshot).filter(s => s.ts && s.rows.length);
      monitorHistorySource = "worker";
      monitorHistoryStatus = { ok: true, source: "worker", count: snapshots.length, error: "" };
      if (snapshots.length) {
        monitorAutoRetryCount = 0;
        if (monitorRetryTimer) clearTimeout(monitorRetryTimer);
        monitorRetryTimer = null;
        return sanitizeMonitorHistory(snapshots);
      }
      if (!dataset.localConfigKey) {
        const latest = await fetchMonitorLatestSnapshot(dataset, c);
        if (latest) {
          monitorHistorySource = "worker-latest";
          monitorHistoryStatus = { ok: true, source: "worker-latest", count: 1, error: "" };
          return sanitizeMonitorHistory([latest]);
        }
        return [];
      }
    } catch (e) {
      console.warn("Worker 历史暂时不可用，改用浏览器本地历史", e);
      monitorHistoryStatus = {
        ok: false,
        source: "worker",
        count: 0,
        error: e && e.message ? e.message : String(e || "未知错误"),
      };
    }
  }
  if (dataset.localConfigKey) {
    try {
      const json = await fetchLocalMonitorHistoryJson(dataset, c);
      const snapshots = (json.snapshots || []).map(hydrateMonitorSnapshot).filter(s => s.ts && s.rows.length);
      monitorHistorySource = "local-json";
      monitorHistoryStatus = { ok: true, source: "local-json", count: snapshots.length, error: "" };
      return sanitizeMonitorHistory(snapshots);
    } catch (e) {
      console.warn("本地监控历史暂时不可用", e);
      monitorHistorySource = "local-json";
      monitorHistoryStatus = {
        ok: false,
        source: "local-json",
        count: 0,
        error: e && e.message ? e.message : String(e || "未知错误"),
      };
      return [];
    }
  }
  if (dataset.key !== "stage") {
    monitorHistorySource = "worker";
    return [];
  }
  monitorHistorySource = "local";
  const localHistory = loadMonitorHistory();
  if (monitorHistoryStatus.ok !== false) {
    monitorHistoryStatus = { ok: true, source: "local", count: localHistory.length, error: "" };
  }
  return sanitizeMonitorHistory(localHistory);
}
function snapshotFromMgtvState(state) {
  const rows = [];
  (state.periods || []).forEach(period => {
    (period.rows || []).forEach(row => {
      rows.push({
        key: row.key || `${period.periodId}:${row.coverId || row.bvid || `${row.title}:${row.rank}`}`,
        periodId: Number(period.periodId),
        periodLabel: period.periodLabel,
        title: row.title,
        guest: row.guest,
        rank: row.rank,
        interactionValue: row.interactionValue,
        roundAmount: row.roundAmount,
        onScreenCount: row.onScreenCount,
        isTarget: row.isTarget,
        coverId: row.coverId,
        coverUrl: row.coverUrl,
        hotValue: row.hotValue,
        awkwardValue: row.awkwardValue,
        status: row.status,
        bvid: row.bvid,
        url: row.url,
        biliTitle: row.biliTitle,
        owner: row.owner,
        performers: row.performers,
        performerText: row.performerText,
        like: row.like,
        favorite: row.favorite,
        coin: row.coin,
        share: row.share,
        danmaku: row.danmaku,
        reply: row.reply,
      });
    });
  });
  return {
    ts: state.updatedAt.getTime(),
    iso: state.updatedAt.toISOString(),
    currentPeriodId: state.currentPeriodId,
    rows,
  };
}
function recordMgtvMonitorSnapshot(state) {
  const snapshot = snapshotFromMgtvState(state);
  if (!snapshot.rows.length) return;
  const history = loadMonitorHistory();
  const last = history[history.length - 1];
  if (last && Math.abs(snapshot.ts - last.ts) < 10000) {
    history[history.length - 1] = snapshot;
  } else {
    history.push(snapshot);
  }
  saveMonitorHistory(history);
  if ($("monitor")) renderMonitor();
}
function median(values) {
  const arr = values.filter(v => Number.isFinite(v)).slice().sort((a, b) => a - b);
  if (!arr.length) return 0;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}
function snapshotRowsByPeriod(snapshot, periodId) {
  return (snapshot.rows || []).filter(row => Number(row.periodId) === Number(periodId));
}
function rowMap(snapshot, periodId) {
  const map = new Map();
  snapshotRowsByPeriod(snapshot, periodId).forEach(row => map.set(row.key, row));
  return map;
}
function monitorPeriodIds(history) {
  const latest = history[history.length - 1];
  if (!latest) return [];
  const seen = new Map();
  latest.rows.forEach(row => {
    if (!seen.has(row.periodId)) seen.set(row.periodId, row.periodLabel || `period ${row.periodId}`);
  });
  return Array.from(seen.entries()).map(([periodId, label]) => ({ periodId: Number(periodId), label }));
}
function formatMonitorDuration(ms) {
  if (!ms || ms < 60000) return "不足 1 分钟";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} 分钟`;
  if (mins % (24 * 60) === 0) {
    const days = mins / (24 * 60);
    return days === 7 ? "一周" : `${days} 天`;
  }
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`;
}
function startOfBeijingDay(ts) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(ts));
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), -8, 0, 0, 0);
}
function endOfBeijingDay(ts) {
  return startOfBeijingDay(ts) + 24 * 60 * 60 * 1000;
}
function beijingDateTimeInputValue(ts) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(new Date(ts));
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const hour = map.hour === "24" ? "00" : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
}
function parseBeijingDateTimeInput(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, y, m, d, h, min] = match.map(Number);
  return Date.UTC(y, m - 1, d, h - 8, min, 0, 0);
}
function monitorWindowMs(mode) {
  const raw = String(mode || "").trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value <= 0) return 24 * 60 * 60 * 1000;
  if (raw.endsWith("d")) return value * 24 * 60 * 60 * 1000;
  return value * 60 * 60 * 1000;
}
function monitorBucketMs(spanMs) {
  const hour = 60 * 60 * 1000;
  if (spanMs <= 2 * hour) return 60 * 1000;
  if (spanMs <= 6 * hour) return 5 * 60 * 1000;
  if (spanMs <= 12 * hour) return 10 * 60 * 1000;
  if (spanMs <= 24 * hour) return 15 * 60 * 1000;
  if (spanMs <= 3 * 24 * hour) return hour;
  return 6 * hour;
}
function formatMonitorRange(startTs, endTs) {
  const sameDay = beijingDateKey(startTs) === beijingDateKey(endTs - 1);
  if (sameDay && endTs - startTs >= 23 * 60 * 60 * 1000) {
    return `${formatBeijingDate(startTs)} 当天`;
  }
  const opts = sameDay
    ? { hour: "2-digit", minute: "2-digit", hour12: false }
    : { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false };
  const start = formatBeijingTime(startTs, opts);
  const end = formatBeijingTime(endTs, opts);
  return `${start} - ${end}`;
}
function monitorPresetRange(mode, history) {
  const latest = history[history.length - 1];
  const first = history[0];
  const latestTs = latest ? latest.ts : Date.now();
  const firstTs = first ? first.ts : latestTs;
  const endTs = latestTs;
  const startTs = mode === "today"
    ? Math.max(firstTs, startOfBeijingDay(latestTs))
    : Math.max(firstTs, endTs - monitorWindowMs(mode));
  return normalizeMonitorRange(startTs, endTs, history);
}
function normalizeMonitorRange(startTs, endTs, history) {
  const latest = history[history.length - 1];
  const first = history[0];
  const latestTs = latest ? latest.ts : Date.now();
  const firstTs = first ? first.ts : latestTs;
  let start = Number.isFinite(startTs) ? startTs : firstTs;
  let end = Number.isFinite(endTs) ? endTs : latestTs;
  if (start > end) [start, end] = [end, start];
  start = Math.max(firstTs, Math.min(latestTs, start));
  end = Math.max(firstTs, Math.min(latestTs, end));
  if (end - start < MONITOR_MIN_RANGE_MS) {
    if (start + MONITOR_MIN_RANGE_MS <= latestTs) {
      end = start + MONITOR_MIN_RANGE_MS;
    } else {
      start = Math.max(firstTs, end - MONITOR_MIN_RANGE_MS);
    }
  }
  if (end - start < MONITOR_MIN_RANGE_MS) {
    end = start + MONITOR_MIN_RANGE_MS;
  }
  return { startTs: start, endTs: end };
}
function resolveMonitorWindow(history) {
  if (monitorWindowMode !== "custom") {
    const preset = monitorPresetRange(monitorWindowMode, history);
    monitorRangeStartTs = preset.startTs;
    monitorRangeEndTs = preset.endTs;
  }
  if (!monitorRangeStartTs || !monitorRangeEndTs) {
    const preset = monitorPresetRange(monitorWindowMode, history);
    monitorRangeStartTs = preset.startTs;
    monitorRangeEndTs = preset.endTs;
  }
  const range = normalizeMonitorRange(monitorRangeStartTs, monitorRangeEndTs, history);
  monitorRangeStartTs = range.startTs;
  monitorRangeEndTs = range.endTs;
  const spanMs = Math.max(range.endTs - range.startTs, MONITOR_MIN_RANGE_MS);

  return {
    startTs: range.startTs,
    endTs: range.endTs,
    spanMs,
    bucketMs: monitorBucketMs(spanMs),
  };
}
function bucketLabel(ts, spanMs) {
  const opts = spanMs > 24 * 60 * 60 * 1000
    ? { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }
    : { hour: "2-digit", minute: "2-digit", hour12: false };
  return formatBeijingTime(ts, opts);
}
function monitorIntervals(history, periodId) {
  const pairs = [];
  for (let i = 1; i < history.length; i += 1) {
    const prev = history[i - 1];
    const curr = history[i];
    const prevRows = rowMap(prev, periodId);
    const currRows = rowMap(curr, periodId);
    if (!prevRows.size || !currRows.size) continue;
    const minutes = Math.max((curr.ts - prev.ts) / 60000, 0.01);
    const deltas = new Map();
    currRows.forEach((row, key) => {
      const before = prevRows.get(key);
      const delta = before ? Math.max(Number(row.interactionValue || 0) - Number(before.interactionValue || 0), 0) : 0;
      deltas.set(key, { delta, rate: delta / minutes, row });
    });
    pairs.push({ ts: curr.ts, minutes, deltas });
  }
  return pairs;
}
function sumRecentDeltas(series, latestTs, minutes) {
  const cutoff = latestTs - minutes * 60000;
  return series
    .filter(item => item.ts >= cutoff)
    .reduce((sum, item) => sum + item.delta, 0);
}
function averageRecentDeltas(series, count, offset) {
  const end = Math.max(series.length - (offset || 0), 0);
  const slice = series.slice(Math.max(0, end - count), end);
  if (!slice.length) return 0;
  return slice.reduce((sum, item) => sum + item.delta, 0) / slice.length;
}
function trendLabel(series, med, lastDelta, delta5) {
  if (series.length < 4) return "样本积累中";
  const recentAvg = averageRecentDeltas(series, 3, 0);
  const prevAvg = averageRecentDeltas(series, 3, 3);
  if (lastDelta >= 50 && med > 0 && lastDelta >= med * 3) return "短时突增";
  if (prevAvg > 0 && recentAvg >= prevAvg * 1.6 && delta5 > 0) return "持续升温";
  if (prevAvg > 0 && recentAvg <= prevAvg * 0.55) return "正在回落";
  if (delta5 === 0) return "暂无新增";
  return "相对平稳";
}
function monitorMetrics(history, periodId) {
  const latest = history[history.length - 1];
  if (!latest) return [];
  const latestRows = snapshotRowsByPeriod(latest, periodId).slice().sort((a, b) => a.rank - b.rank);
  const intervals = monitorIntervals(history, periodId);
  const lastInterval = intervals[intervals.length - 1];
  const latestTotalDelta = lastInterval
    ? Array.from(lastInterval.deltas.values()).reduce((sum, item) => sum + item.delta, 0)
    : 0;

  return latestRows.map(row => {
    const series = intervals.map(interval => {
      const item = interval.deltas.get(row.key);
      return item ? Object.assign({}, item, { ts: interval.ts, minutes: interval.minutes }) : null;
    }).filter(Boolean);
    const deltas = series.map(item => item.delta);
    const lastDelta = deltas.length ? deltas[deltas.length - 1] : 0;
    const lastRate = series.length ? series[series.length - 1].rate : 0;
    const latestTs = series.length ? series[series.length - 1].ts : 0;
    const delta5 = latestTs ? sumRecentDeltas(series, latestTs, 5) : 0;
    const delta15 = latestTs ? sumRecentDeltas(series, latestTs, 15) : 0;
    const prior = deltas.slice(0, -1);
    const med = median(prior);
    const mad = median(prior.map(v => Math.abs(v - med)));
    const robustZ = prior.length >= 3 && mad > 0 ? (lastDelta - med) / (1.4826 * mad) : null;
    const prevDelta = deltas.length >= 2 ? deltas[deltas.length - 2] : null;
    const share = latestTotalDelta ? lastDelta / latestTotalDelta : 0;
    const baselineRatio = med > 0 ? lastDelta / med : null;
    const trend = trendLabel(series, med, lastDelta, delta5);
    let score = 0;
    if (robustZ != null) score += Math.max(0, Math.min(3, robustZ));
    else if (prior.length > 0 && lastDelta >= 100 && lastDelta > Math.max(med * 3, med + 100)) score += 1.5;
    if (share >= 0.7 && lastDelta >= 20) score += 2;
    else if (share >= 0.5 && lastDelta >= 20) score += 1;
    if (lastRate >= 300) score += 1.5;
    else if (lastRate >= 100) score += 0.8;
    if (prevDelta != null && lastDelta >= 50 && lastDelta > Math.max(prevDelta * 3, prevDelta + 100)) score += 1;
    score = Math.min(5, score);

    const signals = [];
    if (deltas.length < 3) signals.push("样本不足");
    if (robustZ != null && robustZ >= 3) signals.push(`突增 Z=${robustZ.toFixed(1)}`);
    if (share >= 0.7 && lastDelta >= 20) signals.push(`区间占比 ${Math.round(share * 100)}%`);
    if (lastRate >= 100) signals.push(`${Math.round(lastRate)}/分钟`);
    if (prevDelta != null && lastDelta >= 50 && lastDelta > Math.max(prevDelta * 3, prevDelta + 100)) signals.push("加速度异常");
    if (trend !== "相对平稳" && trend !== "样本积累中") signals.push(trend);
    if (!signals.length) signals.push("平稳");

    let level = "低";
    let levelClass = "text-gray-500 bg-gray-100";
    if (deltas.length < 3) {
      level = "观察中";
      levelClass = "text-gray-600 bg-gray-100";
    } else if (score >= 3.5) {
      level = "重点观察";
      levelClass = "text-red-700 bg-red-100";
    } else if (score >= 2) {
      level = "波动偏高";
      levelClass = "text-yellow-700 bg-yellow-100";
    }

    return Object.assign({}, row, {
      lastDelta,
      delta5,
      delta15,
      lastRate,
      medianDelta: med,
      baselineRatio,
      robustZ,
      share,
      trend,
      score,
      level,
      levelClass,
      signals: signals.join(" · "),
      sampleCount: deltas.length,
    });
  }).sort((a, b) => b.score - a.score || b.lastDelta - a.lastDelta || a.rank - b.rank);
}
function aggregateMonitorBuckets(intervals, rows, windowInfo) {
  const keys = new Set(rows.map(row => row.key));
  const bucketMap = new Map();
  intervals.forEach(interval => {
    if (interval.ts < windowInfo.startTs || interval.ts > windowInfo.endTs) return;
    const bucketTs = Math.floor(interval.ts / windowInfo.bucketMs) * windowInfo.bucketMs;
    if (!bucketMap.has(bucketTs)) bucketMap.set(bucketTs, new Map());
    const bucket = bucketMap.get(bucketTs);
    keys.forEach(key => {
      const item = interval.deltas.get(key);
      bucket.set(key, (bucket.get(key) || 0) + (item ? item.delta : 0));
    });
  });
  return Array.from(bucketMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([ts, deltas]) => ({ ts, deltas }));
}
function monitorRowsForWindow(metrics, buckets) {
  const totals = new Map(metrics.map(row => [row.key, 0]));
  buckets.forEach(bucket => {
    bucket.deltas.forEach((value, key) => totals.set(key, (totals.get(key) || 0) + value));
  });
  const sorted = metrics
    .map(row => Object.assign({}, row, { windowTotal: totals.get(row.key) || 0 }))
    .sort((a, b) => b.windowTotal - a.windowTotal || a.rank - b.rank);
  const selected = sorted.slice(0, Math.min(sorted.length, 8));
  metrics.filter(row => row.isTarget && !selected.some(item => item.key === row.key)).forEach(row => selected.push(row));
  return selected;
}
function monitorSelectionContext(datasetKey, periodId) {
  return `${datasetKey}:${periodId}`;
}
function monitorSelectionKeys(context, metrics) {
  const allKeys = metrics.map(row => row.key);
  const saved = monitorSelectedRowKeys[context];
  if (!saved) return new Set(allKeys);
  const valid = saved.filter(key => allKeys.includes(key));
  return new Set(valid);
}
function monitorRowsForSelection(metrics, selectedKeys) {
  return metrics
    .filter(row => selectedKeys.has(row.key))
    .sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0));
}
function monitorWindowSummary(metrics, buckets) {
  const totals = metrics.map(row => ({
    row,
    value: buckets.reduce((sum, bucket) => sum + (bucket.deltas.get(row.key) || 0), 0),
  })).sort((a, b) => b.value - a.value);
  const total = totals.reduce((sum, item) => sum + item.value, 0);
  return {
    total,
    top: totals[0],
    activeCount: totals.filter(item => item.value > 0).length,
  };
}
function latestPeriodId(history) {
  const latest = history[history.length - 1];
  if (monitorDataKind !== "stage") {
    return Number(latest && latest.currentPeriodId || 0);
  }
  return Number((dashboardState && dashboardState.currentPeriodId) || (latest && latest.currentPeriodId) || 0);
}
function monitorDatasetTabs(c) {
  return enabledMonitorDatasets(c).map(item => {
    const active = item.key === monitorDataKind;
    const sourceUrl = monitorDatasetSourceUrl(c, item);
    const link = sourceUrl
      ? `<a href="${esc(sourceUrl)}" target="_blank" rel="noopener noreferrer"
            class="${active ? "text-white/80 hover:text-white" : "text-gray-400 hover:text-brand-600"}"
            aria-label="${esc(item.sourceLabel)}">${ICON.external}</a>`
      : "";
    return `
      <span class="inline-flex items-center overflow-hidden rounded-full border
        ${active ? "border-brand-500 bg-brand-500 text-white" : "border-brand-100 bg-white text-gray-600"}">
        <button type="button" data-monitor-kind="${esc(item.key)}"
          class="px-4 py-2 text-sm font-medium transition-colors
            ${active ? "text-white" : "hover:text-brand-700"}">
          ${esc(item.label)}
        </button>
        ${link ? `<span class="pr-3">${link}</span>` : ""}
      </span>`;
  }).join("");
}
function monitorSeriesColor(row, index) {
  const dataset = monitorDatasetConfig();
  const highlights = dataset && Array.isArray(dataset.highlightTitles) ? dataset.highlightTitles : [];
  return (dataset.key !== "bilibili" && row.isTarget) || highlights.includes(row.title)
    ? "#dc2626"
    : MONITOR_NON_TARGET_COLORS[index % MONITOR_NON_TARGET_COLORS.length];
}
function hexToRgba(hex, alpha) {
  const clean = String(hex || "").replace("#", "");
  if (clean.length !== 6) return `rgba(37,99,235,${alpha})`;
  const n = Number.parseInt(clean, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
function renderMonitorNameSelector(metrics, selectedKeys, context) {
  const dataset = monitorDatasetConfig();
  const rows = metrics.slice().sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0));
  const allSelected = rows.every(row => selectedKeys.has(row.key));
  const noneSelected = selectedKeys.size === 0;
  const items = rows.map((row, index) => {
    const selected = selectedKeys.has(row.key);
    const color = monitorSeriesColor(row, index);
    const isHighlighted = color === "#dc2626";
    const style = selected
      ? `style="border-color:${color};background:${hexToRgba(color, 0.10)};color:${isHighlighted ? "#b91c1c" : "#374151"}"`
      : "";
    return `
      <button type="button" data-monitor-name-key="${esc(row.key)}" data-monitor-select-context="${esc(context)}"
        class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
          ${selected ? "" : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600"}"
        ${style}>
        <span class="h-2 w-2 rounded-full" style="background:${selected ? color : "#d1d5db"}"></span>
        <span>${esc(row.title)}</span>
      </button>`;
  }).join("");
  return `
    <div class="mt-5 rounded-xl border border-brand-100 bg-white p-4 shadow-sm">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span>${esc(dataset.valueLabel || "名字")}选择</span>
          <span class="text-xs font-normal text-gray-400">已选择 ${selectedKeys.size}/${rows.length}</span>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" data-monitor-select-clear data-monitor-select-context="${esc(context)}"
            class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
              ${noneSelected ? "border-gray-400 bg-gray-100 text-gray-600" : "border-brand-100 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-700"}">
            清除
          </button>
          <button type="button" data-monitor-select-all data-monitor-select-context="${esc(context)}"
            class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
              ${allSelected ? "border-brand-500 bg-brand-500 text-white" : "border-brand-100 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-700"}">
            全选
          </button>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">${items}</div>
    </div>`;
}
function scheduleMonitorRetry() {
  if (monitorRetryTimer || monitorAutoRetryCount >= MONITOR_EMPTY_RETRY_LIMIT) return;
  monitorAutoRetryCount += 1;
  monitorRetryTimer = setTimeout(() => {
    monitorRetryTimer = null;
    renderMonitor();
  }, MONITOR_EMPTY_RETRY_MS);
}
function renderMonitorLoading(c) {
  const datasetTabs = monitorDatasetTabs(c);
  const collectionStatus = renderCollectionStatus(c);
  $("monitor").innerHTML = `
    <div class="bg-gradient-to-b from-brand-100/40 to-white/70">
      <div class="max-w-6xl mx-auto px-5 py-20 text-center">
        <span class="inline-block rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-600 shadow-sm">自动监控</span>
        <h2 class="mt-4 font-display text-3xl sm:text-4xl text-brand-600">数据监控</h2>
        <div class="mt-6 flex flex-wrap items-center justify-center gap-2">
          ${datasetTabs}
        </div>
        ${collectionStatus}
        <p class="mx-auto mt-5 max-w-2xl text-gray-500">正在连接后台时间序列...</p>
      </div>
    </div>`;
  attachMonitorHandlers(c, []);
}
function renderMonitorEmpty(c, history) {
  const dataset = monitorDatasetConfig();
  const samples = history.length;
  const hasWorker = Boolean(workerApiBase(c.mgtv)) && !dataset.localConfigKey;
  const hasError = monitorHistoryStatus.ok === false;
  const rangeEmpty = !hasError && monitorWindowMode === "custom";
  const message = rangeEmpty
    ? `所选时间范围内暂时没有${dataset.emptyName}快照。可以扩大时间范围，或等待后台下一次采样后页面自动重读。`
    : hasError && dataset.localConfigKey
    ? `暂时没有读到${dataset.emptyName}时间序列。先运行本地采集脚本，或部署新版 Worker 后再刷新。`
    : hasError
      ? "暂时没有连上后台时间序列。这通常是网络、Worker 冷启动、浏览器缓存或页面刚更新时的一次性请求失败；页面会自动重试，也可以手动重新连接。"
      : dataset.localConfigKey
        ? `本地采集器正在建立${dataset.emptyName}时间序列，已返回 ${samples} 个快照。跑满 2-3 分钟后就能看到增量。`
        : hasWorker
          ? `后台采集器正在建立${dataset.emptyName}时间序列，已返回 ${samples} 个快照。部署后通常等 2-3 分钟就能看到增量。`
          : `正在等待实时数据同步。页面打开后会自动记录时间序列，已记录 ${samples} 个快照。`;
  const datasetTabs = monitorDatasetTabs(c);
  const collectionStatus = renderCollectionStatus(c);
  const retryButton = monitorHistoryStatus.ok === false
    ? `<button type="button" data-monitor-retry
          class="mt-5 rounded-full border border-brand-500 bg-brand-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600">
          重新读取
        </button>`
    : "";
  const errorDetail = monitorHistoryStatus.ok === false && monitorHistoryStatus.error
    ? `<p class="mx-auto mt-2 max-w-2xl text-xs text-gray-400">错误信息：${esc(monitorHistoryStatus.error)}</p>`
    : "";
  $("monitor").innerHTML = `
    <div class="bg-gradient-to-b from-brand-100/40 to-white/70">
      <div class="max-w-6xl mx-auto px-5 py-20 text-center">
        <span class="inline-block rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-600 shadow-sm">自动监控</span>
        <h2 class="mt-4 font-display text-3xl sm:text-4xl text-brand-600">数据监控</h2>
        <div class="mt-6 flex flex-wrap items-center justify-center gap-2">
          ${datasetTabs}
        </div>
        ${collectionStatus}
        <p class="mx-auto mt-3 max-w-2xl text-gray-500">
          ${esc(message)}
        </p>
        ${errorDetail}
        ${retryButton}
      </div>
    </div>`;
  attachMonitorHandlers(c, history);
  if (monitorHistoryStatus.ok === false || (hasWorker && samples < 1)) scheduleMonitorRetry();
  scheduleMonitorRefresh(c, dataset);
  alignMonitorHash();
}
async function renderMonitor(options) {
  const opts = options || {};
  const c = SITE.campaign;
  if (!c || !c.mgtv) return;
  if (!monitorDatasetEnabled(c, monitorDatasetConfig())) {
    const first = enabledMonitorDatasets(c)[0] || MONITOR_DATASETS.hot;
    monitorDataKind = first.key;
    monitorRangeStartTs = null;
    monitorRangeEndTs = null;
    monitorWindowMode = "today";
  }
  const token = ++monitorRenderToken;
  if (opts.showLoading) renderMonitorLoading(c);
  const history = await loadMonitorHistoryForDisplay(c);
  if (token !== monitorRenderToken) return;
  if (history.length < 1) {
    renderMonitorEmpty(c, history);
    return;
  }

  const dataset = monitorDatasetConfig();
  const periods = monitorPeriodIds(history);
  const preferred = Number(monitorSelectedPeriodIds[dataset.key] || latestPeriodId(history) || (periods[0] && periods[0].periodId));
  const selected = periods.find(p => Number(p.periodId) === preferred) || periods[0];
  if (!selected) {
    renderMonitorEmpty(c, history);
    return;
  }
  monitorSelectedPeriodIds[dataset.key] = Number(selected.periodId);

  const periodHistory = history.filter(snapshot => snapshotRowsByPeriod(snapshot, selected.periodId).length);
  const metrics = monitorMetrics(history, selected.periodId);
  const intervals = monitorIntervals(history, selected.periodId);
  const windowInfo = resolveMonitorWindow(periodHistory);
  const buckets = aggregateMonitorBuckets(intervals, metrics, windowInfo);
  const selectionContext = monitorSelectionContext(dataset.key, selected.periodId);
  const selectableRows = dataset.key === "hot" || dataset.key === "weibo" || dataset.key === "bilibili";
  const selectedKeys = selectableRows
    ? monitorSelectionKeys(selectionContext, metrics)
    : null;
  const visibleRows = selectableRows
    ? monitorRowsForSelection(metrics, selectedKeys)
    : monitorRowsForWindow(metrics, buckets);
  const summary = monitorWindowSummary(visibleRows, buckets);
  const latest = periodHistory[periodHistory.length - 1];
  const first = periodHistory[0];
  const updated = latest ? formatBeijingClock(latest.ts) : "--";
  const datasetTabs = monitorDatasetTabs(c);
  const collectionStatus = renderCollectionStatus(c);

  const periodTabs = periods.length > 1 ? periods.map(p => {
    const active = Number(p.periodId) === Number(selected.periodId);
    return `
      <button type="button" data-monitor-period-id="${p.periodId}"
        class="rounded-full border px-4 py-2 text-sm font-medium transition-colors
          ${active ? "border-brand-500 bg-brand-500 text-white" : "border-brand-100 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-700"}">
        ${esc(p.label)}
      </button>`;
  }).join("") : "";

  const windowModes = MONITOR_WINDOW_OPTIONS.map(item => {
    const active = monitorWindowMode === item.mode;
    return `
      <button type="button" data-monitor-window-mode="${item.mode}"
        class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
          ${active ? "border-brand-500 bg-brand-500 text-white" : "border-brand-100 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-700"}">
        ${esc(item.label)}
      </button>`;
  }).join("");
  const rangeStartValue = beijingDateTimeInputValue(windowInfo.startTs);
  const rangeEndValue = beijingDateTimeInputValue(windowInfo.endTs);
  const timeSelector = `
    <div class="mt-5 rounded-xl border border-brand-100 bg-white p-4 shadow-sm">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-sm font-medium text-gray-700">时间选择</p>
          <p class="text-xs text-gray-400">北京时间 · 起止间隔至少 5 分钟</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">${windowModes}</div>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block text-left text-xs font-medium text-gray-500">
          起始时间
          <input type="datetime-local" data-monitor-range-start value="${esc(rangeStartValue)}" step="60"
            class="mt-1 w-full rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-brand-400">
        </label>
        <label class="block text-left text-xs font-medium text-gray-500">
          终止时间
          <input type="datetime-local" data-monitor-range-end value="${esc(rangeEndValue)}" step="60"
            class="mt-1 w-full rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-brand-400">
        </label>
      </div>
    </div>`;

  const stats = [
    { label: "采样快照", value: `${periodHistory.length}`, note: `最近 ${updated}` },
    { label: "当前时间窗", value: formatMonitorDuration(windowInfo.spanMs), note: formatMonitorRange(windowInfo.startTs, windowInfo.endTs) },
    { label: "窗口新增", value: monitorDisplayValue(dataset, summary.total), note: summary.top && summary.top.value ? `最高：${summary.top.row.title}` : "暂无新增" },
    { label: "合并粒度", value: formatMonitorDuration(windowInfo.bucketMs), note: `${buckets.length} 个时间点 · ${summary.activeCount} 个${dataset.valueLabel}有新增` },
  ].map(item => `
    <div class="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
      <p class="text-sm text-gray-500">${esc(item.label)}</p>
      <p class="mt-1 font-display text-3xl text-brand-600">${esc(item.value)}</p>
      <p class="mt-1 truncate text-xs text-gray-500">${esc(item.note)}</p>
    </div>`).join("");
  const nameSelector = selectableRows
    ? renderMonitorNameSelector(metrics, selectedKeys, selectionContext)
    : "";

  $("monitor").innerHTML = `
    <div class="bg-gradient-to-b from-brand-100/40 to-white/70">
      <div class="max-w-6xl mx-auto px-5 py-20">
        <div class="mb-3 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
          <span class="rounded-full bg-white px-3 py-1 font-medium text-brand-600 shadow-sm">${esc(monitorHistorySourceLabel())}</span>
          <span>最近采样 ${esc(updated)} 北京时间</span>
          <span>采样越多，判断越稳</span>
        </div>
        <h2 class="font-display text-3xl sm:text-4xl text-brand-600 text-center">数据监控</h2>

        <div class="mt-6 flex flex-wrap items-center justify-center gap-2">
          ${datasetTabs}
        </div>
        ${collectionStatus}

        ${periodTabs ? `<div class="mt-8 flex flex-wrap items-center justify-center gap-3">${periodTabs}</div>` : ""}

        ${timeSelector}

        <div class="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">${stats}</div>

        <div class="mt-8">
          <div class="min-w-0 rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
            <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3 class="font-medium text-gray-800">${esc(dataset.key === "stage" ? `${selected.label}增量走势` : dataset.title)}</h3>
              <p class="text-xs text-gray-400">当前按 ${esc(formatMonitorDuration(windowInfo.bucketMs))} 合并</p>
            </div>
            <div class="relative w-full min-w-0" style="height:420px;">
              <canvas id="monitorRateChart"></canvas>
            </div>
          </div>
          ${nameSelector}
        </div>
      </div>
    </div>`;

  attachMonitorHandlers(c, periodHistory);
  drawMonitorCharts(history, selected.periodId, metrics, windowInfo, buckets, visibleRows);
  scheduleMonitorRefresh(c, dataset);
  alignMonitorHash();
}
function attachMonitorHandlers(c, history) {
  document.querySelectorAll("[data-monitor-name-key]").forEach(btn => {
    btn.addEventListener("click", () => {
      const context = btn.dataset.monitorSelectContext || "";
      const allKeys = Array.from(document.querySelectorAll("[data-monitor-name-key]"))
        .filter(item => item.dataset.monitorSelectContext === context)
        .map(item => item.dataset.monitorNameKey);
      const selected = new Set(monitorSelectedRowKeys[context] || allKeys);
      const key = btn.dataset.monitorNameKey;
      if (selected.has(key)) {
        if (selected.size > 1) selected.delete(key);
      } else {
        selected.add(key);
      }
      monitorSelectedRowKeys[context] = allKeys.filter(item => selected.has(item));
      renderMonitor();
    });
  });
  document.querySelectorAll("[data-monitor-select-all]").forEach(btn => {
    btn.addEventListener("click", () => {
      const context = btn.dataset.monitorSelectContext || "";
      const allKeys = Array.from(document.querySelectorAll("[data-monitor-name-key]"))
        .filter(item => item.dataset.monitorSelectContext === context)
        .map(item => item.dataset.monitorNameKey);
      monitorSelectedRowKeys[context] = allKeys;
      renderMonitor();
    });
  });
  document.querySelectorAll("[data-monitor-select-clear]").forEach(btn => {
    btn.addEventListener("click", () => {
      const context = btn.dataset.monitorSelectContext || "";
      monitorSelectedRowKeys[context] = [];
      renderMonitor();
    });
  });
  document.querySelectorAll("[data-monitor-retry]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (monitorRetryTimer) clearTimeout(monitorRetryTimer);
      monitorRetryTimer = null;
      monitorAutoRetryCount = 0;
      btn.disabled = true;
      btn.textContent = "连接中...";
      renderMonitor({ showLoading: true }).catch(err => {
        console.error("renderMonitor retry", err);
      });
    });
  });
  document.querySelectorAll("[data-monitor-kind]").forEach(btn => {
    btn.addEventListener("click", () => {
      const next = btn.dataset.monitorKind || "hot";
      if (next === monitorDataKind) return;
      monitorDataKind = next;
      monitorRangeStartTs = null;
      monitorRangeEndTs = null;
      monitorWindowMode = "today";
      monitorAutoRetryCount = 0;
      renderMonitor();
    });
  });
  document.querySelectorAll("[data-monitor-period-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      monitorSelectedPeriodIds[monitorDataKind] = Number(btn.dataset.monitorPeriodId);
      renderMonitor();
    });
  });
  document.querySelectorAll("[data-monitor-window-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
      monitorWindowMode = btn.dataset.monitorWindowMode || "today";
      monitorRangeStartTs = null;
      monitorRangeEndTs = null;
      renderMonitor();
    });
  });
  document.querySelectorAll("[data-monitor-range-start], [data-monitor-range-end]").forEach(input => {
    input.addEventListener("change", event => {
      const startInput = document.querySelector("[data-monitor-range-start]");
      const endInput = document.querySelector("[data-monitor-range-end]");
      let startTs = parseBeijingDateTimeInput(startInput && startInput.value);
      let endTs = parseBeijingDateTimeInput(endInput && endInput.value);
      const changedStart = event.currentTarget && event.currentTarget.matches("[data-monitor-range-start]");
      if (startTs == null || endTs == null) return;
      if (endTs - startTs < MONITOR_MIN_RANGE_MS) {
        if (changedStart) endTs = startTs + MONITOR_MIN_RANGE_MS;
        else startTs = endTs - MONITOR_MIN_RANGE_MS;
      }
      monitorWindowMode = "custom";
      monitorRangeStartTs = startTs;
      monitorRangeEndTs = endTs;
      renderMonitor();
    });
  });
}
function drawMonitorCharts(history, periodId, metrics, windowInfo, buckets, visibleRows) {
  if (monitorRateChart) monitorRateChart.destroy();
  if (!window.Chart) return;
  const dataset = monitorDatasetConfig();

  const labels = buckets.length
    ? buckets.map(bucket => bucketLabel(bucket.ts, windowInfo.spanMs))
    : ["暂无数据"];
  const top = Array.isArray(visibleRows)
    ? visibleRows
    : metrics.slice().sort((a, b) => b.lastDelta - a.lastDelta || a.rank - b.rank).slice(0, 6);
  const noAnim = reducedMotion();
  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: noAnim ? false : undefined,
  };

  monitorRateChart = new Chart($("monitorRateChart"), {
    type: "line",
    data: {
      labels,
      datasets: top.map((row, index) => {
        const color = monitorSeriesColor(row, index);
        return {
          label: row.title,
          data: buckets.length ? buckets.map(bucket => monitorChartValue(dataset, bucket.deltas.get(row.key) || 0)) : [0],
          borderColor: color,
          backgroundColor: hexToRgba(color, 0.08),
          tension: 0.25,
          pointRadius: 2,
        };
      }),
    },
    options: Object.assign({}, baseOpts, {
      plugins: { legend: { position: "bottom", labels: { boxWidth: 10 } } },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#fde8e8" },
          title: { display: true, text: dataset.yAxisLabel },
          ticks: { callback: value => monitorAxisTick(dataset, value) },
        },
        x: {
          grid: { display: false },
          title: { display: true, text: `采样时间（${formatMonitorDuration(windowInfo.bucketMs)}合并）` },
        },
      },
    }),
  });

}
function alignMonitorHash() {
  if (monitorHashAligned || window.location.hash !== "#monitor") return;
  monitorHashAligned = true;
  requestAnimationFrame(() => {
    const section = $("monitor");
    if (section) section.scrollIntoView({ block: "start" });
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
  try { renderDirectory(); } catch (e) { console.error("renderDirectory", e); }
  try { renderAbout(); } catch (e) { console.error("renderAbout", e); }
  try { renderMusic(); } catch (e) { console.error("renderMusic", e); }
  try { renderVideos(); } catch (e) { console.error("renderVideos", e); }
  try { renderSchedule(); } catch (e) { console.error("renderSchedule", e); }
  try { renderDashboard(); } catch (e) { console.error("renderDashboard", e); }
  try { renderMonitor(); } catch (e) { console.error("renderMonitor", e); }
  try { initMgtvForegroundRefresh(); } catch (e) { console.error("initMgtvForegroundRefresh", e); }
  try { renderFooter(); } catch (e) { console.error("renderFooter", e); }
  try { initNavHighlight(); } catch (e) { console.error("initNavHighlight", e); }
}
document.addEventListener("DOMContentLoaded", init);
