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
function renderAbout() {
  const a = SITE.about;
  const bio = a.bio.map(p => `<p class="mb-4 leading-relaxed">${esc(p)}</p>`).join("");
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

  $("about").innerHTML = `
    <div class="max-w-6xl mx-auto px-5 py-20">
      <h2 class="font-display text-3xl sm:text-4xl text-brand-600 mb-10 text-center">关于 曾沛慈</h2>
      <div class="grid md:grid-cols-5 gap-10 items-start">
        <div class="md:col-span-3 text-gray-700">${bio}
          <p class="text-xs text-gray-400 mt-6">${esc(a.source)}</p>
        </div>
        <div class="md:col-span-2 bg-white rounded-2xl shadow-sm border border-brand-100 p-6">
          <h3 class="font-display text-brand-500 mb-3">个人资料</h3>
          <dl>${info}</dl>${socialBlock}
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
let dashboardRefreshTimer = null;
let dashboardState = null;
let dashboardSelectedPeriodId = null;
let dashboardHashAligned = false;
let monitorRateChart = null;
let monitorShareChart = null;
let monitorSelectedPeriodId = null;
let monitorHashAligned = false;
let monitorHistorySource = "local";
const MONITOR_STORAGE_KEY = "pets_mgtv_monitor_v1";
const MONITOR_MAX_SNAPSHOTS = 720;
const MONITOR_WORKER_HISTORY_LIMIT = 720;

function fmtInt(n) {
  return Number(n || 0).toLocaleString("zh-CN");
}
function fmtPct(value, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((Number(value || 0) / Number(total)) * 100));
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
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok || json.ok === false) throw new Error(json.error || `Worker HTTP ${res.status}`);
  return json;
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
async function loadLiveMgtvDashboardData(campaign) {
  const mgtv = campaign.mgtv;
  const targetName = mgtv.targetName || "曾沛慈";
  const config = await fetchMgtv("/online/live/campaign/config", mgtvParams({}, mgtv), mgtv);
  const current = config.weeklyPeriod || {};
  const stageTags = config.stageTags || [];
  const periods = await Promise.all(stageTags.map(async tag => {
    const periodId = Number(tag.periodId);
    const merged = Object.assign({}, tag, periodId === Number(current.periodId) ? current : {});
    merged.periodId = periodId;
    merged.periodLabel = tag.stageTag || merged.periodName || `period ${periodId}`;
    merged.targetValueInt = Number(merged.targetValueInt || current.targetValueInt || 0);
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
function sumRows(rows, key) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}
function renderDashboardLoading(c) {
  $("dashboard").innerHTML = `
    <div class="bg-gradient-to-b from-white/60 to-brand-100/40">
      <div class="max-w-6xl mx-auto px-5 py-20 text-center">
        <h2 class="font-display text-3xl sm:text-4xl text-brand-600 mb-2">${esc(c.title)}</h2>
        <p class="text-gray-500 mb-8">${esc(c.subtitle)}</p>
        <div class="inline-flex items-center gap-3 rounded-full border border-brand-100 bg-white px-5 py-3 text-sm text-brand-600 shadow-sm">
          <span class="inline-block h-2.5 w-2.5 rounded-full bg-brand-500 animate-pulse"></span>
          正在同步芒推推数据
        </div>
      </div>
    </div>`;
  alignDashboardHash();
}
function renderDashboardError(c, err) {
  $("dashboard").innerHTML = `
    <div class="bg-gradient-to-b from-white/60 to-brand-100/40">
      <div class="max-w-6xl mx-auto px-5 py-20 text-center">
        <h2 class="font-display text-3xl sm:text-4xl text-brand-600 mb-2">${esc(c.title)}</h2>
        <p class="text-gray-500 mb-8">${esc(c.subtitle)}</p>
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
function renderMgtvDashboard(c, state, selectedPeriodId, staleError) {
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
  const updatedText = state.updatedAt.toLocaleTimeString("zh-CN", { hour12: false });
  const sourceBadge = state.source === "worker" ? "后台每分钟监控" : "MGTV 实时接口";
  const sourceLink = mgtv.sourceUrl
    ? `<a href="${esc(mgtv.sourceUrl)}" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 transition-colors">芒推推页面 ${ICON.external}</a>`
    : "";
  const staleText = staleError
    ? `<span class="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">保留上次数据</span>`
    : "";

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
          <span>更新于 ${esc(updatedText)}</span>
          <span>每 ${Math.round((mgtv.refreshMs || 60000) / 1000)} 秒刷新</span>
          ${staleText}
        </div>
        <h2 class="font-display text-3xl sm:text-4xl text-brand-600 mb-2 text-center">${esc(c.title)}</h2>
        <p class="text-center text-gray-500 mb-6">${esc(c.subtitle)}</p>
        <div class="mb-8 flex flex-wrap items-center justify-center gap-4 text-sm">
          ${sourceLink}
          <button type="button" data-mgtv-refresh
            class="rounded-full border border-brand-200 bg-white px-4 py-2 font-medium text-brand-600 hover:border-brand-500 hover:text-brand-700 transition-colors">
            立即刷新
          </button>
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
      </div>
    </div>`;

  attachMgtvDashboardHandlers(c, state);
  drawMgtvCharts(state, selected);
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
    btn.addEventListener("click", () => renderMgtvDashboard(c, state, Number(btn.dataset.periodId)));
  });
  const refresh = document.querySelector("[data-mgtv-refresh]");
  if (refresh) refresh.addEventListener("click", () => loadAndRenderMgtvDashboard(c, dashboardSelectedPeriodId));
}
function drawMgtvCharts(state, selected) {
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
    const state = await loadMgtvDashboardData(c);
    dashboardState = state;
    recordMgtvMonitorSnapshot(state);
    const selected = preferredPeriodId || state.currentPeriodId || (state.periods[0] && state.periods[0].periodId);
    renderMgtvDashboard(c, state, selected);
    scheduleMgtvRefresh(c);
  } catch (err) {
    if (dashboardState && silent) {
      renderMgtvDashboard(c, dashboardState, dashboardSelectedPeriodId, err);
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
      isTarget: Boolean(row.isTarget),
    })),
  });
}
async function loadMonitorHistoryForDisplay(c) {
  if (workerApiBase(c.mgtv)) {
    try {
      const json = await fetchWorkerJson("/history", { limit: MONITOR_WORKER_HISTORY_LIMIT }, c.mgtv);
      const snapshots = (json.snapshots || []).map(hydrateMonitorSnapshot).filter(s => s.ts && s.rows.length);
      monitorHistorySource = "worker";
      return snapshots;
    } catch (e) {
      console.warn("Worker 历史暂时不可用，改用浏览器本地历史", e);
    }
  }
  monitorHistorySource = "local";
  return loadMonitorHistory();
}
function snapshotFromMgtvState(state) {
  const rows = [];
  (state.periods || []).forEach(period => {
    (period.rows || []).forEach(row => {
      rows.push({
        key: `${period.periodId}:${row.coverId || `${row.title}:${row.rank}`}`,
        periodId: Number(period.periodId),
        periodLabel: period.periodLabel,
        title: row.title,
        guest: row.guest,
        rank: row.rank,
        interactionValue: row.interactionValue,
        roundAmount: row.roundAmount,
        onScreenCount: row.onScreenCount,
        isTarget: row.isTarget,
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
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`;
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
    const series = intervals.map(interval => interval.deltas.get(row.key)).filter(Boolean);
    const deltas = series.map(item => item.delta);
    const lastDelta = deltas.length ? deltas[deltas.length - 1] : 0;
    const lastRate = series.length ? series[series.length - 1].rate : 0;
    const prior = deltas.slice(0, -1);
    const med = median(prior);
    const mad = median(prior.map(v => Math.abs(v - med)));
    const robustZ = prior.length >= 3 && mad > 0 ? (lastDelta - med) / (1.4826 * mad) : null;
    const prevDelta = deltas.length >= 2 ? deltas[deltas.length - 2] : null;
    const share = latestTotalDelta ? lastDelta / latestTotalDelta : 0;
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
      lastRate,
      medianDelta: med,
      robustZ,
      share,
      score,
      level,
      levelClass,
      signals: signals.join(" · "),
      sampleCount: deltas.length,
    });
  }).sort((a, b) => b.score - a.score || b.lastDelta - a.lastDelta || a.rank - b.rank);
}
function latestPeriodId(history) {
  const latest = history[history.length - 1];
  return Number((dashboardState && dashboardState.currentPeriodId) || (latest && latest.currentPeriodId) || 0);
}
function renderMonitorEmpty(c, history) {
  const samples = history.length;
  const hasWorker = Boolean(workerApiBase(c.mgtv));
  const message = hasWorker
    ? `后台采集器正在建立时间序列，已记录 ${samples} 个快照。部署后通常等 2-3 分钟就能看到增量。`
    : `正在等待实时数据同步。页面打开后会自动记录时间序列，已记录 ${samples} 个快照。`;
  $("monitor").innerHTML = `
    <div class="bg-gradient-to-b from-brand-100/40 to-white/70">
      <div class="max-w-6xl mx-auto px-5 py-20 text-center">
        <span class="inline-block rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-600 shadow-sm">自动监控</span>
        <h2 class="mt-4 font-display text-3xl sm:text-4xl text-brand-600">数据监控</h2>
        <p class="mx-auto mt-3 max-w-2xl text-gray-500">
          ${esc(message)}
        </p>
      </div>
    </div>`;
  attachMonitorHandlers(c);
  alignMonitorHash();
}
async function renderMonitor() {
  const c = SITE.campaign;
  if (!c || !c.mgtv) return;
  const history = await loadMonitorHistoryForDisplay(c);
  if (history.length < 1) {
    renderMonitorEmpty(c, history);
    return;
  }

  const periods = monitorPeriodIds(history);
  const preferred = Number(monitorSelectedPeriodId || latestPeriodId(history) || (periods[0] && periods[0].periodId));
  const selected = periods.find(p => Number(p.periodId) === preferred) || periods[0];
  if (!selected) {
    renderMonitorEmpty(c, history);
    return;
  }
  monitorSelectedPeriodId = Number(selected.periodId);

  const periodHistory = history.filter(snapshot => snapshotRowsByPeriod(snapshot, selected.periodId).length);
  const metrics = monitorMetrics(history, selected.periodId);
  const intervals = monitorIntervals(history, selected.periodId);
  const latest = periodHistory[periodHistory.length - 1];
  const first = periodHistory[0];
  const lastInterval = intervals[intervals.length - 1];
  const latestTotalDelta = metrics.reduce((sum, row) => sum + row.lastDelta, 0);
  const topDelta = metrics.slice().sort((a, b) => b.lastDelta - a.lastDelta)[0];
  const flagged = metrics.filter(row => row.sampleCount >= 3 && row.score >= 2).length;
  const updated = latest ? new Date(latest.ts).toLocaleTimeString("zh-CN", { hour12: false }) : "--";

  const periodTabs = periods.map(p => {
    const active = Number(p.periodId) === Number(selected.periodId);
    return `
      <button type="button" data-monitor-period-id="${p.periodId}"
        class="rounded-full border px-4 py-2 text-sm font-medium transition-colors
          ${active ? "border-brand-500 bg-brand-500 text-white" : "border-brand-100 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-700"}">
        ${esc(p.label)}
      </button>`;
  }).join("");

  const stats = [
    { label: "采样快照", value: `${periodHistory.length}`, note: `最近 ${updated}` },
    { label: "监控时长", value: formatMonitorDuration(latest && first ? latest.ts - first.ts : 0), note: monitorHistorySource === "worker" ? "后台每分钟采集" : "打开页面后自动累计" },
    { label: "最近区间新增", value: fmtInt(latestTotalDelta), note: lastInterval ? `${Math.round(lastInterval.minutes * 10) / 10} 分钟内` : "等待下一次采样" },
    { label: "异常信号", value: `${flagged}`, note: topDelta ? `最大新增：${topDelta.title}` : "暂无增量" },
  ].map(item => `
    <div class="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
      <p class="text-sm text-gray-500">${esc(item.label)}</p>
      <p class="mt-1 font-display text-3xl text-brand-600">${esc(item.value)}</p>
      <p class="mt-1 truncate text-xs text-gray-500">${esc(item.note)}</p>
    </div>`).join("");

  const tableRows = metrics.map(row => `
    <tr class="${row.isTarget ? "bg-brand-50/80 text-brand-800" : ""}">
      <td class="whitespace-nowrap px-3 py-2 font-bold">#${row.rank}</td>
      <td class="min-w-[9rem] px-3 py-2 font-medium">${esc(row.title)}</td>
      <td class="px-3 py-2 text-right">${fmtInt(row.lastDelta)}</td>
      <td class="px-3 py-2 text-right">${fmtInt(Math.round(row.lastRate))}</td>
      <td class="px-3 py-2 text-right">${fmtInt(Math.round(row.medianDelta))}</td>
      <td class="px-3 py-2 text-right">${row.robustZ == null ? "--" : row.robustZ.toFixed(1)}</td>
      <td class="px-3 py-2 text-right">${Math.round(row.share * 100)}%</td>
      <td class="px-3 py-2">
        <span class="inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${row.levelClass}">${esc(row.level)}</span>
      </td>
      <td class="min-w-[12rem] px-3 py-2 text-gray-500">${esc(row.signals)}</td>
    </tr>`).join("");

  const metricGuide = [
    {
      label: "最近新增",
      text: "最近两次采样之间增加的助力数。这个数字突然变大，说明这一分钟或这一段时间内有集中增长。",
    },
    {
      label: "速度/分钟",
      text: "把最近新增除以采样间隔，换算成每分钟增长速度。它适合比较不同采样间隔下的增长强度。",
    },
    {
      label: "历史中位",
      text: "同一作品过去每个采样区间新增数的中位数，比平均数更不容易被单次极端增长带偏。",
    },
    {
      label: "Z 分",
      text: "表示最近新增偏离历史正常波动的程度。数值越高越异常，通常超过 3 就值得重点观察。",
    },
    {
      label: "占比",
      text: "最近区间里某个作品新增数占全部作品新增数的比例。单个作品长期占比过高，需要结合速度和 Z 分一起看。",
    },
  ].map(item => `
    <div class="rounded-xl border border-brand-100 bg-white p-4 shadow-sm">
      <p class="font-bold text-brand-700">${esc(item.label)}</p>
      <p class="mt-1 text-sm leading-relaxed text-gray-500">${esc(item.text)}</p>
    </div>`).join("");

  $("monitor").innerHTML = `
    <div class="bg-gradient-to-b from-brand-100/40 to-white/70">
      <div class="max-w-6xl mx-auto px-5 py-20">
        <div class="mb-3 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
          <span class="rounded-full bg-white px-3 py-1 font-medium text-brand-600 shadow-sm">${monitorHistorySource === "worker" ? "后台时间序列" : "自动监控"}</span>
          <span>最近采样 ${esc(updated)}</span>
          <span>采样越多，判断越稳</span>
        </div>
        <h2 class="font-display text-3xl sm:text-4xl text-brand-600 mb-2 text-center">数据监控</h2>
        <p class="mx-auto max-w-2xl text-center text-gray-500">
          用每次采样的增量、速度、占比和历史中位数对比观察异常波动，只提示可疑信号，不直接判定作假。
        </p>

        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          ${periodTabs}
        </div>

        <div class="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">${stats}</div>

        <div class="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div class="min-w-0 rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
            <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3 class="font-medium text-gray-800">${esc(selected.label)}增量走势</h3>
              <p class="text-xs text-gray-400">显示最近采样区间新增助力</p>
            </div>
            <div class="relative w-full min-w-0" style="height:320px;">
              <canvas id="monitorRateChart"></canvas>
            </div>
          </div>
          <div class="min-w-0 rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
            <h3 class="mb-3 font-medium text-gray-800">最近区间增量占比</h3>
            <div class="relative w-full min-w-0" style="height:320px;">
              <canvas id="monitorShareChart"></canvas>
            </div>
          </div>
        </div>

        <div class="mt-6 rounded-xl border border-brand-100 bg-brand-50/80 p-5 shadow-sm">
          <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 class="font-medium text-gray-800">指标说明</h3>
            <p class="text-xs text-gray-500">用于理解下方表格和增量走势，不直接判定作假</p>
          </div>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">${metricGuide}</div>
          <p class="mt-4 text-sm leading-relaxed text-gray-500">
            建议重点看「最近新增 + 速度/分钟 + Z 分 + 占比」是否同时偏高。单个指标异常只能说明波动值得留意，
            不能直接证明作假；连续多轮采样都出现突增、占比过高或加速度异常时，才更适合列入重点观察。
          </p>
        </div>

        <div class="mt-6 overflow-hidden rounded-xl border border-brand-100 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-brand-50 text-xs text-brand-700">
                <tr>
                  <th class="px-3 py-2 text-left">排名</th>
                  <th class="px-3 py-2 text-left">作品</th>
                  <th class="px-3 py-2 text-right">最近新增</th>
                  <th class="px-3 py-2 text-right">速度/分钟</th>
                  <th class="px-3 py-2 text-right">历史中位</th>
                  <th class="px-3 py-2 text-right">Z 分</th>
                  <th class="px-3 py-2 text-right">占比</th>
                  <th class="px-3 py-2 text-left">等级</th>
                  <th class="px-3 py-2 text-left">信号</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-brand-50">${tableRows}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;

  attachMonitorHandlers(c);
  drawMonitorCharts(history, selected.periodId, metrics);
  alignMonitorHash();
}
function attachMonitorHandlers(c) {
  document.querySelectorAll("[data-monitor-period-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      monitorSelectedPeriodId = Number(btn.dataset.monitorPeriodId);
      renderMonitor();
    });
  });
}
function drawMonitorCharts(history, periodId, metrics) {
  if (monitorRateChart) monitorRateChart.destroy();
  if (monitorShareChart) monitorShareChart.destroy();
  if (!window.Chart) return;

  const intervals = monitorIntervals(history, periodId);
  const labels = intervals.map(interval =>
    new Date(interval.ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }));
  const top = metrics
    .slice()
    .sort((a, b) => b.lastDelta - a.lastDelta || b.interactionValue - a.interactionValue)
    .slice(0, 6);
  const colors = ["#dc2626", "#f97316", "#eab308", "#22c55e", "#0ea5e9", "#8b5cf6"];
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
      datasets: top.map((row, index) => ({
        label: row.title,
        data: intervals.map(interval => {
          const item = interval.deltas.get(row.key);
          return item ? item.delta : 0;
        }),
        borderColor: row.isTarget ? "#dc2626" : colors[index % colors.length],
        backgroundColor: "rgba(220,38,38,0.08)",
        tension: 0.25,
        pointRadius: 2,
      })),
    },
    options: Object.assign({}, baseOpts, {
      plugins: { legend: { position: "bottom", labels: { boxWidth: 10 } } },
      scales: {
        y: { beginAtZero: true, grid: { color: "#fde8e8" }, ticks: { callback: value => fmtInt(value) } },
        x: { grid: { display: false } },
      },
    }),
  });

  const shareRows = metrics.filter(row => row.lastDelta > 0).sort((a, b) => b.lastDelta - a.lastDelta).slice(0, 8);
  monitorShareChart = new Chart($("monitorShareChart"), {
    type: "doughnut",
    data: {
      labels: shareRows.length ? shareRows.map(row => row.title) : ["暂无新增"],
      datasets: [{
        data: shareRows.length ? shareRows.map(row => row.lastDelta) : [1],
        backgroundColor: shareRows.length ? shareRows.map((row, index) => row.isTarget ? "#dc2626" : colors[(index + 1) % colors.length]) : ["#fee2e2"],
        borderWidth: 0,
      }],
    },
    options: Object.assign({}, baseOpts, {
      plugins: { legend: { position: "bottom", labels: { boxWidth: 10 } } },
      cutout: "62%",
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
  try { renderAbout(); } catch (e) { console.error("renderAbout", e); }
  try { renderMusic(); } catch (e) { console.error("renderMusic", e); }
  try { renderVideos(); } catch (e) { console.error("renderVideos", e); }
  try { renderSchedule(); } catch (e) { console.error("renderSchedule", e); }
  try { renderDashboard(); } catch (e) { console.error("renderDashboard", e); }
  try { renderMonitor(); } catch (e) { console.error("renderMonitor", e); }
  try { renderFooter(); } catch (e) { console.error("renderFooter", e); }
  try { initNavHighlight(); } catch (e) { console.error("initNavHighlight", e); }
}
document.addEventListener("DOMContentLoaded", init);
