const DEFAULTS = {
  apiBase: "https://hb-mangott.api.mgtv.com",
  hotVoteApi: "https://vote.api.mgtv.com/chengfeng/query_vote_list",
  hotVoteSource: "share_cf_zj_2026_cz",
  appId: 1,
  platform: "iphone",
  targetName: "曾沛慈",
  retentionDays: 30,
};

const HOT_VOTE_PERIOD_ID = 202606;
const HOT_VOTE_PERIOD_LABEL = "姐姐夯值";
const MAX_HISTORY_LIMIT = 30 * 24 * 60;
const MAX_RANGE_HISTORY_POINTS = 2880;
const HISTORY_BUCKET_MS = 60 * 1000;
const BILIBILI_PERIOD_ID = 20260623;
const BILIBILI_PERIOD_LABEL = "B站舞台数据";
const BILIBILI_DEFAULT_REFRESH_MS = 5 * 60 * 1000;
const DEFAULT_BILIBILI_VIDEOS = [
  { bvid: "BV1nuDgBREJE", title: "一个人想着一个人", owner: "曾沛慈_TsengPets", performers: ["曾沛慈"] },
  { bvid: "BV1rqQcBqEmk", title: "一半一半", owner: "曾沛慈_TsengPets", performers: ["曾沛慈", "淡淡", "黄灿灿"] },
  { bvid: "BV1SgZFBfE95", title: "言不由衷", owner: "曾沛慈_TsengPets", performers: ["曾沛慈", "张月"] },
  { bvid: "BV1aQDCBNEPz", title: "一半一半练习室", owner: "淡淡Dancey", performers: ["曾沛慈", "淡淡", "黄灿灿"] },
  { bvid: "BV1usjH6WEoz", title: "怎么说我不爱你", owner: "曾沛慈_TsengPets", performers: ["曾沛慈", "庄法"] },
  { bvid: "BV1y1GH6NEtY", title: "缘分一道桥", owner: "尚雯婕Laure", performers: ["王濛", "陈瑶", "尚雯婕", "萨顶顶"] },
  { bvid: "BV1XZGb6uEUz", title: "惊鸿一面", owner: "王濛", performers: ["王濛", "李小冉", "唐艺昕", "陈瑶", "淡淡"] },
  { bvid: "BV1WFjW6EEMQ", title: "独家记忆", owner: "王濛", performers: ["陈凯琳", "王濛"] },
  { bvid: "BV1owEu6qEqT", title: "搁浅", owner: "叶一茜", performers: ["曾沛慈", "叶一茜"] },
  { bvid: "BV1xaG76tEBt", title: "一样的月光", owner: "曾沛慈_TsengPets", performers: ["曾沛慈"] },
  { bvid: "BV1tZGe6yEnZ", title: "第一次爱的人", owner: "曾沛慈_TsengPets", performers: ["曾沛慈", "徐梦洁", "谢楠", "万千惠", "张慧雯"] },
  { bvid: "BV1hio9B2EvU", title: "篇章", owner: "王濛", performers: ["王濛", "曾沛慈", "黄灿灿"] },
  { bvid: "BV1j67y6vEWy", title: "普通disco", owner: "王濛", performers: ["王濛", "李小冉", "淡淡", "乌兰图雅", "陈凯琳"] },
  { bvid: "BV1z5GH6xExR", title: "宝莲", owner: "JIA孟佳", performers: ["曾沛慈", "徐梦洁", "孟佳", "王霏霏"] },
  { bvid: "BV1gvSSBjEEs", title: "恋爱告急", owner: "演员陈瑶", performers: ["陈瑶"] },
  { bvid: "BV1yUGx6UESo", title: "野心家", owner: "张月ZhangYue", performers: ["张月"] },
  { bvid: "BV16CoFBGEUD", title: "心愿便利贴", owner: "极锋Jeff", performers: ["李小冉", "王濛", "唐艺昕"] },
  { bvid: "BV1xDo9BTEnc", title: "我会等", owner: "京剧人侯宇", performers: ["李小冉", "徐洁儿", "阚清子", "侯宇"] },
  { bvid: "BV1tEojBeEbU", title: "bonbon girls", owner: "淡淡Dancey", performers: ["淡淡", "陈凯琳", "何宣林", "唐艺昕"] },
  { bvid: "BV1Fo9gBYEHc", title: "站在草原望北京", owner: "民族流行歌手乌兰图雅", performers: ["乌兰图雅"] },
  { bvid: "BV1tHj66MEtX", title: "那时雨", owner: "王濛", performers: ["王濛", "乌兰图雅", "叶一茜", "万千惠", "陈凯琳"] },
  { bvid: "BV1Ub7D6TEjd", title: "Susan说", owner: "曾沛慈_TsengPets", performers: ["曾沛慈", "谢楠", "叶一茜", "陈瑶", "黄灿灿"] },
  { bvid: "BV1bED1BvE3j", title: "大艺术家", owner: "维妮娜Nina", performers: ["庄法", "江语晨", "维妮娜"] },
  { bvid: "BV1uJDmBkENn", title: "彩虹的微笑", owner: "陶昕然", performers: ["萧蔷", "陶昕然", "安崎"] },
  { bvid: "BV16i7y6MECX", title: "DNA", owner: "TRANGPHAP庄法", performers: ["李心洁", "庄法", "徐梦洁", "何宣林"] },
  { bvid: "BV14SGz6xEzr", title: "月牙湾", owner: "安崎", performers: ["安崎"] },
  { bvid: "BV1P9DNBJEmz", title: "see u love me", owner: "黄灿灿acan", performers: ["黄灿灿"] },
  { bvid: "BV1Chj66wEmX", title: "心引力", owner: "曾沛慈_TsengPets", performers: ["曾沛慈", "范玮琪", "唐艺昕", "庄法", "徐梦洁"] },
  { bvid: "BV1VNojBVE6L", title: "EGO-HOLIC 恋我癖", owner: "温峥嵘", performers: ["庄法", "萧蔷", "安崎", "温峥嵘"] },
  { bvid: "BV1FVoQBREX7", title: "孤单北半球", owner: "张月ZhangYue", performers: ["张月", "者来女", "张慧雯", "陈瑶"] },
  { bvid: "BV1mUdBBbEWv", title: "Interstellar", owner: "张月ZhangYue", performers: ["张月"] },
  { bvid: "BV1KPD5ByEXK", title: "花儿为什么这样红", owner: "安崎", performers: ["安崎"] },
  { bvid: "BV1yAoQBhE9C", title: "达拉崩吧", owner: "民族流行歌手乌兰图雅", performers: ["乌兰图雅", "万千惠", "代斯", "张艺上"] },
  { bvid: "BV1iUj66SErd", title: "CAMERA READY", owner: "淡淡Dancey", performers: ["张月", "徐洁儿", "谢楠", "淡淡", "黄灿灿"] },
  { bvid: "BV1hhDyBqEwS", title: "Just Like Fire", owner: "民族流行歌手乌兰图雅", performers: ["乌兰图雅", "者来女", "万千惠"] },
  { bvid: "BV1LNL36YEhW", title: "花火", owner: "李小冉", performers: ["李小冉"] },
  { bvid: "BV1nCE36jEMh", title: "短发", owner: "谢楠", performers: ["萧蔷", "谢楠"] },
  { bvid: "BV1eWGH6JEQi", title: "另一个天堂", owner: "徐洁儿Jill", performers: ["何洁", "马吟吟", "张月", "徐洁儿"] },
  { bvid: "BV1P6oLBhEQg", title: "冷夜", owner: "陶昕然", performers: ["李心洁", "谢楠", "陶昕然", "徐梦洁"] },
  { bvid: "BV16AjH6BEbd", title: "梦一场", owner: "李小冉", performers: ["李小冉", "李心洁"] },
  { bvid: "BV1oQGb6VEAP", title: "逆战", owner: "安崎", performers: ["安崎", "李心洁", "乌兰图雅", "叶一茜", "庄法"] },
  { bvid: "BV1RaDNBYEAD", title: "爱丫爱丫", owner: "张艺上", performers: ["张艺上"] },
  { bvid: "BV1C47y65E1R", title: "胆小鬼", owner: "江语晨Jessie", performers: ["唐艺昕", "范玮琪", "江语晨", "孙怡"] },
  { bvid: "BV1FyE36mEdB", title: "左边", owner: "范玮琪", performers: ["范玮琪", "唐艺昕"] },
  { bvid: "BV1bLjB6eESg", title: "讨厌", owner: "李小冉", performers: ["李小冉", "李心洁", "江语晨", "阚清子", "安崎"] },
  { bvid: "BV13p5r6zEKU", title: "梨花颂", owner: "京剧人侯宇", performers: ["侯宇"] },
  { bvid: "BV1zad9BxEX3", title: "霍元甲", owner: "张月ZhangYue", performers: ["张月", "代斯", "徐梦洁", "陈瑶"] },
  { bvid: "BV1skGH6TEE6", title: "花蝴蝶", owner: "江语晨Jessie", performers: ["李斯丹妮", "孙怡", "宋妍霏", "江语晨"] },
];

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(collectAndStore(env));
  },
};

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const cors = corsHeaders(env);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    if (request.method === "GET" && url.pathname === "/") {
      return json({
        ok: true,
        service: "pets-mgtv-monitor",
        endpoints: [
          "/health",
          "/latest",
          "/history?limit=720",
          "/hot/latest",
          "/hot/history?limit=720",
          "/weibo/latest",
          "/weibo/history?limit=720",
          "/bilibili/latest",
          "/bilibili/live",
          "/bilibili/history?limit=720",
          "/admin/bilibili/ingest",
        ],
      }, cors);
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json(await health(env), cors);
    }

    if (request.method === "GET" && url.pathname === "/latest") {
      return json(await latest(env), cors);
    }

    if (request.method === "GET" && url.pathname === "/history") {
      const limit = clampInt(url.searchParams.get("limit"), 2, MAX_HISTORY_LIMIT, 720);
      const periodId = url.searchParams.get("periodId");
      return json(await history(env, limit, periodId, historyRange(url)), cors);
    }

    if (request.method === "GET" && url.pathname === "/hot/latest") {
      return json(await hotLatest(env), cors);
    }

    if (request.method === "GET" && url.pathname === "/hot/history") {
      const limit = clampInt(url.searchParams.get("limit"), 2, MAX_HISTORY_LIMIT, 720);
      const periodId = url.searchParams.get("periodId");
      return json(await hotHistory(env, limit, periodId, historyRange(url)), cors);
    }

    if (request.method === "GET" && url.pathname === "/weibo/latest") {
      return json(await weiboLatest(env), cors);
    }

    if (request.method === "GET" && url.pathname === "/weibo/history") {
      const limit = clampInt(url.searchParams.get("limit"), 2, MAX_HISTORY_LIMIT, 720);
      const periodId = url.searchParams.get("periodId");
      return json(await weiboHistory(env, limit, periodId, historyRange(url)), cors);
    }

    if (request.method === "GET" && url.pathname === "/bilibili/latest") {
      return json(await bilibiliLatest(env), cors);
    }

    if (request.method === "GET" && url.pathname === "/bilibili/live") {
      return json({
        ok: true,
        source: "worker-live",
        state: await loadBilibiliState(env, minuteBucket()),
      }, cors);
    }

    if (request.method === "GET" && url.pathname === "/bilibili/history") {
      const limit = clampInt(url.searchParams.get("limit"), 2, MAX_HISTORY_LIMIT, 720);
      const periodId = url.searchParams.get("periodId");
      return json(await bilibiliHistory(env, limit, periodId, historyRange(url)), cors);
    }

    if (request.method === "POST" && url.pathname === "/admin/collect") {
      requireAdmin(request, env);
      const result = await collectAndStore(env);
      return json({ ok: true, result }, cors);
    }

    if (request.method === "POST" && url.pathname === "/admin/weibo/ingest") {
      requireAdmin(request, env);
      const result = await ingestWeiboStage(request, env);
      return json({ ok: true, result }, cors);
    }

    if (request.method === "POST" && url.pathname === "/admin/bilibili/ingest") {
      requireAdmin(request, env);
      const result = await ingestBilibili(request, env);
      return json({ ok: true, result }, cors);
    }

    return json({ ok: false, error: "not_found" }, cors, 404);
  } catch (err) {
    const status = err.status || 500;
    return json({ ok: false, error: err.message || String(err) }, cors, status);
  }
}

function config(env) {
  return {
    apiBase: env.MGTV_API_BASE || DEFAULTS.apiBase,
    hotVoteApi: env.MGTV_HOT_VOTE_API || DEFAULTS.hotVoteApi,
    hotVoteSource: env.MGTV_HOT_VOTE_SOURCE || DEFAULTS.hotVoteSource,
    stageCollectionEnabled: env.STAGE_COLLECTION_ENABLED !== "false",
    hotVoteCollectionEnabled: env.HOT_VOTE_COLLECTION_ENABLED !== "false",
    weiboStageCollectionEnabled: env.WEIBO_STAGE_COLLECTION_ENABLED !== "false",
    bilibiliCollectionEnabled: env.BILIBILI_COLLECTION_ENABLED !== "false",
    bilibiliWorkerFetchEnabled: env.BILIBILI_WORKER_FETCH_ENABLED === "true",
    bilibiliRefreshMs: Number(env.BILIBILI_REFRESH_MS || BILIBILI_DEFAULT_REFRESH_MS),
    bilibiliVideos: parseBilibiliVideos(env.BILIBILI_VIDEOS),
    appId: Number(env.MGTV_APP_ID || DEFAULTS.appId),
    platform: env.MGTV_PLATFORM || DEFAULTS.platform,
    targetName: env.MGTV_TARGET_NAME || DEFAULTS.targetName,
    retentionDays: Number(env.RETENTION_DAYS || DEFAULTS.retentionDays),
  };
}

function parseBilibiliVideos(raw) {
  if (!raw) return DEFAULT_BILIBILI_VIDEOS;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const videos = parsed.map(item => {
        if (typeof item === "string") return { bvid: item.trim(), title: "" };
        return {
          bvid: String(item && (item.bvid || item.bili || "") || "").trim(),
          title: String(item && item.title || "").trim(),
          owner: String(item && item.owner || "").trim(),
          performers: normalizeBilibiliPerformers(item && item.performers),
        };
      }).filter(item => /^BV[0-9A-Za-z]{10}$/.test(item.bvid));
      return videos.length ? videos : DEFAULT_BILIBILI_VIDEOS;
    }
  } catch (err) {
    const videos = String(raw).split(/[,\s]+/)
      .map(bvid => ({ bvid: bvid.trim(), title: "" }))
      .filter(item => /^BV[0-9A-Za-z]{10}$/.test(item.bvid));
    if (videos.length) return videos;
  }
  return DEFAULT_BILIBILI_VIDEOS;
}

function normalizeBilibiliPerformers(value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map(item => String(item || "").trim()).filter(Boolean)));
  }
  if (typeof value === "string") {
    return Array.from(new Set(value.split(/[、/,，&|｜\s]+/).map(item => item.trim()).filter(Boolean)));
  }
  return [];
}

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.CORS_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
  };
}

function json(body, headers, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: Object.assign({ "Content-Type": "application/json; charset=utf-8" }, headers),
  });
}

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function requireAdmin(request, env) {
  if (!env.COLLECT_TOKEN) throw httpError("COLLECT_TOKEN is not configured", 403);
  const header = request.headers.get("Authorization") || "";
  if (header !== `Bearer ${env.COLLECT_TOKEN}`) throw httpError("unauthorized", 401);
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function historyRange(url) {
  if (!url.searchParams.has("startMs") || !url.searchParams.has("endMs")) return null;
  let startMs = Number(url.searchParams.get("startMs"));
  let endMs = Number(url.searchParams.get("endMs"));
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;
  startMs = Math.max(0, Math.floor(startMs));
  endMs = Math.max(0, Math.floor(endMs));
  if (startMs > endMs) [startMs, endMs] = [endMs, startMs];
  return { startMs, endMs };
}

async function snapshotRows(env, limit, range, marker) {
  if (range) return snapshotRowsForRange(env, limit, range, marker);
  const clauses = [];
  const binds = [];
  if (marker) {
    clauses.push("raw_json LIKE ?");
    binds.push(marker);
  }
  const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
  const rows = await env.DB.prepare(
    `SELECT id, captured_at, captured_ms, current_period_id, raw_json FROM snapshots${where} ORDER BY captured_ms DESC LIMIT ?`
  ).bind(...binds, limit).all();
  return rows.results || [];
}

async function snapshotRowsForRange(env, limit, range, marker) {
  const pointLimit = Math.max(2, Math.min(limit, MAX_RANGE_HISTORY_POINTS));
  const span = Math.max(0, range.endMs - range.startMs);
  const bucketMs = Math.max(
    HISTORY_BUCKET_MS,
    Math.ceil(span / Math.max(1, pointLimit - 1) / HISTORY_BUCKET_MS) * HISTORY_BUCKET_MS
  );
  const clauses = ["captured_ms BETWEEN ? AND ?"];
  const binds = [range.startMs, range.endMs];
  if (marker) {
    clauses.push("raw_json LIKE ?");
    binds.push(marker);
  }
  const where = clauses.join(" AND ");
  const rows = await env.DB.prepare(
    `SELECT s.id, s.captured_at, s.captured_ms, s.current_period_id, s.raw_json
       FROM snapshots s
       INNER JOIN (
         SELECT MAX(captured_ms) AS picked_ms
           FROM snapshots
          WHERE ${where}
          GROUP BY CAST(captured_ms / ? AS INTEGER)
          ORDER BY picked_ms DESC
          LIMIT ?
       ) picked ON picked.picked_ms = s.captured_ms
      ORDER BY s.captured_ms DESC`
  ).bind(...binds, bucketMs, pointLimit).all();
  return (rows.results || []).map(row => Object.assign({}, row, { bucket_ms: bucketMs }));
}

function monitorSnapshotFromRow(row, pick, periodId) {
  try {
    const state = pick(parseStoredState(row.raw_json));
    return state ? stateToMonitorSnapshot(state, periodId) : null;
  } catch (err) {
    return null;
  }
}

function minuteBucket(date = new Date()) {
  const d = new Date(date);
  d.setUTCSeconds(0, 0);
  return d.toISOString();
}

function mgtvParams(extra, cfg) {
  return Object.assign({
    appId: cfg.appId,
    platform: cfg.platform,
    abroad: 0,
    did: "",
    device: "",
    appVersion: "",
    osType: "",
    uuid: "",
    ticket: "",
  }, extra || {});
}

function mgtvUrl(path, params, cfg) {
  const query = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] != null) query.set(key, params[key]);
  });
  return `${cfg.apiBase.replace(/\/$/, "")}${path}?${query.toString()}`;
}

async function fetchMgtv(path, params, cfg) {
  const res = await fetch(mgtvUrl(path, params, cfg), {
    headers: { "Accept": "application/json, text/plain, */*" },
  });
  if (!res.ok) throw new Error(`MGTV HTTP ${res.status}`);
  const data = await res.json();
  if (data.code !== 200) throw new Error(data.msg || `MGTV API ${data.code}`);
  return data.data || {};
}

function hotVoteUrl(cfg) {
  const now = Date.now();
  const query = new URLSearchParams({
    request_time: String(now),
    os: "h5",
    did: "000-000-000",
    source: cfg.hotVoteSource,
    invoker: "mobile-zhifubao",
    appVersion: "6.9.9_vipact",
    mac: "000-000-000",
    version: "6.9.9_vipact",
    t: String(now),
  });
  return `${cfg.hotVoteApi}?${query.toString()}`;
}

async function fetchHotVote(cfg) {
  const res = await fetch(hotVoteUrl(cfg), {
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Origin": "https://lego.mgtv.com",
      "Referer": "https://lego.mgtv.com/tpl/event_voter/page/cf_zj_2026.html",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
    },
  });
  if (!res.ok) throw new Error(`MGTV hot vote HTTP ${res.status}`);
  const data = await res.json();
  if (data.errno !== 0) throw new Error(data.errmsg || `MGTV hot vote API ${data.errno}`);
  return data.data || {};
}

function optionValue(item, optionName) {
  const option = (item.option_name || []).find(row => row.option_name === optionName);
  return Number(option && option.option_vote_number || 0);
}

function normalizeHotVoteRow(item, targetName) {
  const hotValue = optionValue(item, "夯爆了");
  const awkwardValue = optionValue(item, "尬场了");
  return {
    rank: 0,
    title: item.vote_name || "",
    guest: item.song_name || "",
    interactionValue: hotValue,
    roundAmount: awkwardValue,
    onScreenCount: hotValue + awkwardValue,
    cid: "",
    coverId: String(item.vote_id || ""),
    coverUrl: item.vote_img || "",
    isTarget: String(item.vote_name || "").includes(targetName),
    hotValue,
    awkwardValue,
    status: hotValue >= awkwardValue ? "夯爆了" : "尬场了",
  };
}

function bilibiliViewUrl(bvid) {
  const query = new URLSearchParams({ bvid });
  return `https://api.bilibili.com/x/web-interface/wbi/view?${query.toString()}`;
}

function bilibiliClassicViewUrl(bvid) {
  const query = new URLSearchParams({ bvid });
  return `https://api.bilibili.com/x/web-interface/view?${query.toString()}`;
}

async function fetchBilibiliJson(url, bvid) {
  const res = await fetch(url, {
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Referer": `https://www.bilibili.com/video/${bvid}/`,
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
    },
  });
  if (!res.ok) throw new Error(`Bilibili HTTP ${res.status}`);
  const payload = await res.json();
  if (payload.code !== 0) throw new Error(payload.message || `Bilibili API ${payload.code}`);
  return payload.data || {};
}

async function fetchBilibiliVideo(video, cfg, index) {
  try {
    const data = await fetchBilibiliJson(bilibiliViewUrl(video.bvid), video.bvid);
    return normalizeBilibiliRow(data, video, index, cfg.targetName, "view");
  } catch (err) {
    const data = await fetchBilibiliJson(bilibiliClassicViewUrl(video.bvid), video.bvid);
    return normalizeBilibiliRow(data, video, index, cfg.targetName, "classic-view");
  }
}

function normalizeBilibiliRow(data, fallback, index, targetName, source) {
  const stat = data.stat || {};
  const owner = data.owner || {};
  const bvid = data.bvid || fallback.bvid;
  const title = String(fallback.title || data.title || bvid).trim();
  const biliTitle = String(data.title || title).trim();
  const ownerName = String(owner.name || "").trim();
  const performers = normalizeBilibiliPerformers(fallback.performers);
  const performerText = performers.join("/");
  const haystack = `${title} ${biliTitle} ${ownerName}`;
  return {
    rank: index + 1,
    title,
    guest: performerText || ownerName,
    interactionValue: Number(stat.view || 0),
    roundAmount: Number(stat.like || 0),
    onScreenCount: Number(stat.favorite || 0),
    cid: String(data.cid || ""),
    coverId: bvid,
    coverUrl: data.pic || "",
    isTarget: haystack.includes(targetName),
    key: `${BILIBILI_PERIOD_ID}:${bvid}`,
    periodId: BILIBILI_PERIOD_ID,
    periodLabel: BILIBILI_PERIOD_LABEL,
    bvid,
    url: `https://www.bilibili.com/video/${bvid}/`,
    biliTitle,
    owner: ownerName,
    performers,
    performerText,
    aid: Number(data.aid || stat.aid || 0),
    like: Number(stat.like || 0),
    favorite: Number(stat.favorite || 0),
    coin: Number(stat.coin || 0),
    share: Number(stat.share || 0),
    danmaku: Number(stat.danmaku || 0),
    reply: Number(stat.reply || 0),
    statSource: source || "view",
  };
}

function shouldCollectBilibili(capturedAt, cfg) {
  const interval = Math.max(Number(cfg.bilibiliRefreshMs || BILIBILI_DEFAULT_REFRESH_MS), 60 * 1000);
  return Date.parse(capturedAt) % interval === 0;
}

async function loadBilibiliState(env, capturedAt) {
  const cfg = config(env);
  const results = await Promise.allSettled(
    (cfg.bilibiliVideos || []).map((video, index) => fetchBilibiliVideo(video, cfg, index))
  );
  const rows = [];
  const errors = [];
  results.forEach((result, index) => {
    const video = cfg.bilibiliVideos[index] || {};
    if (result.status === "fulfilled") rows.push(result.value);
    else errors.push({ bvid: video.bvid || "", error: result.reason && result.reason.message || String(result.reason) });
  });
  if (!rows.length) throw new Error(`bilibili_all_failed: ${errors.map(item => `${item.bvid}:${item.error}`).join("; ")}`);
  rows.sort((a, b) => b.interactionValue - a.interactionValue || a.title.localeCompare(b.title, "zh-CN"));
  rows.forEach((row, index) => { row.rank = index + 1; });

  return {
    updatedAt: capturedAt,
    currentPeriodId: BILIBILI_PERIOD_ID,
    sourceUrl: "https://www.bilibili.com/",
    errors,
    periods: [{
      periodId: BILIBILI_PERIOD_ID,
      periodLabel: BILIBILI_PERIOD_LABEL,
      targetValueInt: 0,
      rows,
    }],
  };
}

function normalizeRow(item, targetName) {
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

function campaignPeriods(configData) {
  const byId = new Map();
  const add = period => {
    if (!period || !period.periodId) return;
    const periodId = Number(period.periodId);
    byId.set(periodId, Object.assign({}, byId.get(periodId) || {}, period, { periodId }));
  };
  add(configData.livePeriod);
  (configData.stageTags || []).forEach(add);
  add(configData.weeklyPeriod);
  return Array.from(byId.values());
}

async function loadMgtvState(env, capturedAt) {
  const cfg = config(env);
  const configData = await fetchMgtv("/online/live/campaign/config", mgtvParams({}, cfg), cfg);
  const current = configData.livePeriod || configData.weeklyPeriod || {};
  const stagePeriods = campaignPeriods(configData);
  const periods = await Promise.all(stagePeriods.map(async tag => {
    const periodId = Number(tag.periodId);
    const merged = Object.assign({}, tag, periodId === Number(current.periodId) ? current : {});
    merged.periodId = periodId;
    merged.periodLabel = stageLabel(merged);
    merged.targetValueInt = Number(merged.targetValueInt || 0);
    const listData = await fetchMgtv("/online/live/campaign/list", mgtvParams({ periodId }, cfg), cfg);
    merged.rows = (listData.list || []).map(row => normalizeRow(row, cfg.targetName));
    return merged;
  }));

  return {
    updatedAt: capturedAt,
    currentPeriodId: Number(current.periodId || (periods[0] && periods[0].periodId) || 0),
    periods,
  };
}

async function loadHotVoteState(env, capturedAt) {
  const cfg = config(env);
  const data = await fetchHotVote(cfg);
  const rows = (data.vote_list || [])
    .map(row => normalizeHotVoteRow(row, cfg.targetName))
    .sort((a, b) => b.interactionValue - a.interactionValue || a.title.localeCompare(b.title, "zh-CN"));
  rows.forEach((row, index) => { row.rank = index + 1; });

  return {
    updatedAt: capturedAt,
    currentPeriodId: Number(data.phase_id || HOT_VOTE_PERIOD_ID),
    voteState: data.vote_state || "",
    phaseId: Number(data.phase_id || 0),
    systemTime: data.system_time || "",
    beginTime: data.begin_time || "",
    endTime: data.end_time || "",
    queenList: data.queen_list || [],
    periods: [{
      periodId: Number(data.phase_id || HOT_VOTE_PERIOD_ID),
      periodLabel: HOT_VOTE_PERIOD_LABEL,
      targetValueInt: 0,
      rows,
    }],
  };
}

async function loadSnapshotBundle(env) {
  const capturedAt = minuteBucket();
  const cfg = config(env);
  const collectBilibili = cfg.bilibiliCollectionEnabled && cfg.bilibiliWorkerFetchEnabled && shouldCollectBilibili(capturedAt, cfg);
  const campaignTask = cfg.stageCollectionEnabled
    ? loadMgtvState(env, capturedAt)
    : Promise.resolve(null);
  const hotVoteTask = cfg.hotVoteCollectionEnabled
    ? loadHotVoteState(env, capturedAt)
    : Promise.resolve(null);
  const bilibiliTask = collectBilibili
    ? loadBilibiliState(env, capturedAt)
    : Promise.resolve(null);
  const [campaign, hotVote, bilibili] = await Promise.allSettled([
    campaignTask,
    hotVoteTask,
    bilibiliTask,
  ]);
  const campaignValue = campaign.status === "fulfilled" ? campaign.value : null;
  const hotVoteValue = hotVote.status === "fulfilled" ? hotVote.value : null;
  const bilibiliValue = bilibili.status === "fulfilled" ? bilibili.value : null;
  if ((cfg.stageCollectionEnabled || cfg.hotVoteCollectionEnabled || collectBilibili) && !campaignValue && !hotVoteValue && !bilibiliValue) {
    const campaignError = cfg.stageCollectionEnabled && campaign.status === "rejected"
      ? campaign.reason.message
      : "stage_collection_disabled";
    const hotVoteError = cfg.hotVoteCollectionEnabled && hotVote.status === "rejected"
      ? hotVote.reason.message
      : "hot_vote_collection_disabled";
    const bilibiliError = collectBilibili && bilibili.status === "rejected"
      ? bilibili.reason.message
      : (cfg.bilibiliCollectionEnabled
        ? (cfg.bilibiliWorkerFetchEnabled ? "bilibili_waiting_next_5m_bucket" : "bilibili_local_ingest_only")
        : "bilibili_collection_disabled");
    throw new Error(`all_sources_failed: ${campaignError}; ${hotVoteError}; ${bilibiliError}`);
  }
  const state = {
    updatedAt: capturedAt,
    campaign: campaignValue,
    hotVote: hotVoteValue,
    bilibili: bilibiliValue,
    errors: {
      campaign: cfg.stageCollectionEnabled
        ? (campaign.status === "rejected" ? campaign.reason.message : null)
        : "stage_collection_disabled",
      hotVote: cfg.hotVoteCollectionEnabled
        ? (hotVote.status === "rejected" ? hotVote.reason.message : null)
        : "hot_vote_collection_disabled",
      bilibili: cfg.bilibiliCollectionEnabled
        ? (collectBilibili
          ? (bilibili.status === "rejected" ? bilibili.reason.message : null)
          : (cfg.bilibiliWorkerFetchEnabled ? "bilibili_waiting_next_5m_bucket" : "bilibili_local_ingest_only"))
        : "bilibili_collection_disabled",
    },
    collection: {
      stage: cfg.stageCollectionEnabled,
      hotVote: cfg.hotVoteCollectionEnabled,
      weiboStage: cfg.weiboStageCollectionEnabled,
      bilibili: cfg.bilibiliCollectionEnabled,
      bilibiliDue: collectBilibili,
      bilibiliWorkerFetch: cfg.bilibiliWorkerFetchEnabled,
    },
  };
  if (state.campaign) {
    state.currentPeriodId = state.campaign.currentPeriodId;
    state.periods = state.campaign.periods;
  }
  return state;
}

function parseStoredState(rawJson) {
  const parsed = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;
  if (parsed && (parsed.campaign || parsed.hotVote || parsed.weiboStage || parsed.bilibili)) return parsed;
  return {
    updatedAt: parsed && parsed.updatedAt,
    currentPeriodId: parsed && parsed.currentPeriodId,
    periods: parsed && parsed.periods,
    campaign: parsed || null,
    hotVote: parsed && parsed.hotVote || null,
    weiboStage: parsed && parsed.weiboStage || null,
    bilibili: parsed && parsed.bilibili || null,
    errors: {},
  };
}

function campaignState(stored) {
  return stored && (stored.campaign || (stored.periods ? stored : null));
}

function hotVoteState(stored) {
  return stored && stored.hotVote || null;
}

function weiboStageState(stored) {
  return stored && stored.weiboStage || null;
}

function bilibiliState(stored) {
  return stored && stored.bilibili || null;
}

async function collectAndStore(env) {
  const state = await loadSnapshotBundle(env);
  const campaign = campaignState(state);
  const hotVote = hotVoteState(state);
  const bilibili = bilibiliState(state);
  const capturedAt = state.updatedAt;
  const capturedMs = Date.parse(capturedAt);
  const db = env.DB;

  if (!campaign && !hotVote && !bilibili) {
    return {
      capturedAt,
      skipped: true,
      reason: "all_collection_disabled",
      collection: state.collection,
      errors: state.errors,
    };
  }

  let row = await db.prepare("SELECT id, raw_json FROM snapshots WHERE captured_at = ?").bind(capturedAt).first();
  if (row && row.raw_json) {
    try {
      const existing = parseStoredState(row.raw_json);
      if (existing.weiboStage && !state.weiboStage) state.weiboStage = existing.weiboStage;
      if (existing.bilibili && !state.bilibili) state.bilibili = existing.bilibili;
    } catch (err) {
      // Existing malformed raw JSON should not block a fresh MGTV snapshot.
    }
  }
  if (row) {
    await db.prepare(
      "UPDATE snapshots SET captured_ms = ?, current_period_id = ?, raw_json = ? WHERE id = ?"
    ).bind(capturedMs, campaign ? campaign.currentPeriodId : (bilibili ? bilibili.currentPeriodId : null), JSON.stringify(state), row.id).run();
    await db.prepare("DELETE FROM snapshot_rows WHERE snapshot_id = ?").bind(row.id).run();
  } else {
    await db.prepare(
      "INSERT INTO snapshots (captured_at, captured_ms, current_period_id, raw_json) VALUES (?, ?, ?, ?)"
    ).bind(capturedAt, capturedMs, campaign ? campaign.currentPeriodId : (bilibili ? bilibili.currentPeriodId : null), JSON.stringify(state)).run();
    row = await db.prepare("SELECT id FROM snapshots WHERE captured_at = ?").bind(capturedAt).first();
  }

  const statements = [];
  for (const period of campaign && campaign.periods || []) {
    for (const item of period.rows || []) {
      statements.push(db.prepare(
        `INSERT INTO snapshot_rows
          (snapshot_id, row_key, period_id, period_label, title, guest, rank,
           interaction_value, round_amount, on_screen_count, is_target)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        row.id,
        `${period.periodId}:${item.coverId || `${item.title}:${item.rank}`}`,
        period.periodId,
        period.periodLabel,
        item.title,
        item.guest,
        item.rank,
        item.interactionValue,
        item.roundAmount,
        item.onScreenCount,
        item.isTarget ? 1 : 0
      ));
    }
  }
  if (statements.length) await db.batch(statements);
  await pruneOldSnapshots(env);

  return {
    capturedAt,
    currentPeriodId: campaign ? campaign.currentPeriodId : null,
    periodCount: campaign ? campaign.periods.length : 0,
    hotVoteCount: state.hotVote && state.hotVote.periods[0] ? state.hotVote.periods[0].rows.length : 0,
    bilibiliCount: state.bilibili && state.bilibili.periods[0] ? state.bilibili.periods[0].rows.length : 0,
    errors: state.errors,
    collection: state.collection,
    rowCount: statements.length,
    stageCollectionEnabled: config(env).stageCollectionEnabled,
    hotVoteCollectionEnabled: config(env).hotVoteCollectionEnabled,
    weiboStageCollectionEnabled: config(env).weiboStageCollectionEnabled,
    bilibiliCollectionEnabled: config(env).bilibiliCollectionEnabled,
  };
}

async function pruneOldSnapshots(env) {
  const days = config(env).retentionDays;
  if (!days || days <= 0) return;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  await env.DB.prepare(
    "DELETE FROM snapshot_rows WHERE snapshot_id IN (SELECT id FROM snapshots WHERE captured_ms < ?)"
  ).bind(cutoff).run();
  await env.DB.prepare("DELETE FROM snapshots WHERE captured_ms < ?").bind(cutoff).run();
}

async function latest(env) {
  const row = await latestRowWithState(env, campaignState);
  return {
    ok: true,
    source: "worker",
    state: campaignState(parseStoredState(row.raw_json)),
    meta: {
      latestSnapshotId: row.id,
      capturedAt: row.captured_at,
      capturedMs: row.captured_ms,
      currentPeriodId: row.current_period_id,
    },
  };
}

async function history(env, limit, periodId, range) {
  const rows = await snapshotRows(env, limit, range);
  const snapshots = rows
    .reverse()
    .map(row => monitorSnapshotFromRow(row, campaignState, periodId))
    .filter(Boolean)
  return {
    ok: true,
    source: "worker",
    snapshots,
    meta: {
      count: snapshots.length,
      limit,
      range,
      periodId: periodId ? Number(periodId) : null,
    },
  };
}

async function hotLatest(env) {
  const row = await latestRowWithState(env, hotVoteState);
  return {
    ok: true,
    source: "worker",
    state: hotVoteState(parseStoredState(row.raw_json)),
    meta: {
      latestSnapshotId: row.id,
      capturedAt: row.captured_at,
      capturedMs: row.captured_ms,
      currentPeriodId: row.current_period_id,
    },
  };
}

async function hotHistory(env, limit, periodId, range) {
  const rows = await snapshotRows(env, limit, range);
  const snapshots = rows
    .reverse()
    .map(row => monitorSnapshotFromRow(row, hotVoteState, periodId))
    .filter(Boolean);
  return {
    ok: true,
    source: "worker",
    snapshots,
    meta: {
      count: snapshots.length,
      limit,
      range,
      periodId: periodId ? Number(periodId) : null,
    },
  };
}

async function weiboLatest(env) {
  const row = await latestRowWithState(env, weiboStageState);
  return {
    ok: true,
    source: "worker",
    state: weiboStageState(parseStoredState(row.raw_json)),
    meta: {
      latestSnapshotId: row.id,
      capturedAt: row.captured_at,
      capturedMs: row.captured_ms,
      currentPeriodId: row.current_period_id,
    },
  };
}

async function weiboHistory(env, limit, periodId, range) {
  const rows = await snapshotRows(env, limit, range);
  const snapshots = rows
    .reverse()
    .map(row => monitorSnapshotFromRow(row, weiboStageState, periodId))
    .filter(Boolean);
  const cleaned = sanitizeMonitorSnapshots(snapshots);
  return {
    ok: true,
    source: "worker",
    snapshots: cleaned,
    meta: {
      count: cleaned.length,
      limit,
      range,
      periodId: periodId ? Number(periodId) : null,
    },
  };
}

async function bilibiliLatest(env) {
  const row = await latestRowWithState(env, bilibiliState, BILIBILI_STATE_MARKER);
  return {
    ok: true,
    source: "worker",
    state: bilibiliState(parseStoredState(row.raw_json)),
    meta: {
      latestSnapshotId: row.id,
      capturedAt: row.captured_at,
      capturedMs: row.captured_ms,
      currentPeriodId: row.current_period_id,
    },
  };
}

async function bilibiliHistory(env, limit, periodId, range) {
  const rows = await snapshotRows(env, limit, range, BILIBILI_STATE_MARKER);
  const snapshots = rows
    .reverse()
    .map(row => monitorSnapshotFromRow(row, bilibiliState, periodId))
    .filter(Boolean);
  return {
    ok: true,
    source: "worker",
    snapshots,
    meta: {
      count: snapshots.length,
      limit,
      range,
      periodId: periodId ? Number(periodId) : null,
    },
  };
}

function sanitizeMonitorSnapshots(snapshots) {
  const cloned = (snapshots || []).map(snapshot => Object.assign({}, snapshot, {
    rows: (snapshot.rows || []).map(row => Object.assign({}, row)),
  }));
  const byKey = new Map();
  cloned.forEach((snapshot, snapshotIndex) => {
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
      const oneOffSpike = curr > prev && next < curr && next <= Math.max(prev, 0) * 1.1 + 1000;
      if (!oneOffSpike) return;
      const row = cloned[entry.snapshotIndex].rows[entry.rowIndex];
      row.interactionValue = Math.max(prev, next);
      row.qualityFlag = "corrected_spike";
    });
  });
  return cloned;
}

function normalizeWeiboRow(row, index, periodId, periodLabel, targetName) {
  const title = String(row.title || row.name || row.voteName || "").trim();
  const guest = String(row.guest || row.song || row.members || "").trim();
  const interactionValue = Number(
    row.interactionValue != null ? row.interactionValue :
      row.recommendValue != null ? row.recommendValue :
        row.value != null ? row.value :
          row.voteCount || 0
  );
  const coverId = String(row.coverId || row.id || row.key || `${title}:${guest || index + 1}`).trim();
  return {
    rank: Number(row.rank || index + 1),
    title,
    guest,
    interactionValue: Number.isFinite(interactionValue) ? interactionValue : 0,
    roundAmount: Number(row.roundAmount || 0),
    onScreenCount: Number(row.onScreenCount || 0),
    cid: row.cid || "",
    coverId,
    coverUrl: row.coverUrl || "",
    isTarget: Boolean(row.isTarget) || `${title} ${guest}`.includes(targetName),
    key: row.key || `${periodId}:${coverId || `${title}:${index + 1}`}`,
    periodId,
    periodLabel,
  };
}

function normalizeWeiboStageState(payload, env) {
  const raw = payload && (payload.state || payload.weiboStage || payload.snapshot || payload);
  if (!raw) throw httpError("empty_payload", 400);
  const targetName = env.WEIBO_STAGE_TARGET_NAME || env.MGTV_TARGET_NAME || DEFAULTS.targetName;
  const updatedAt = minuteBucket(raw.updatedAt || raw.iso || new Date());
  const currentPeriodId = Number(raw.currentPeriodId || raw.periodId || 20260618);

  if (Array.isArray(raw.periods)) {
    const periods = raw.periods.map(period => {
      const periodId = Number(period.periodId || currentPeriodId);
      const periodLabel = period.periodLabel || period.label || "微博舞台推荐";
      return Object.assign({}, period, {
        periodId,
        periodLabel,
        targetValueInt: Number(period.targetValueInt || 0),
        rows: (period.rows || []).map((row, index) =>
          normalizeWeiboRow(row, index, periodId, periodLabel, targetName)),
      });
    });
    return {
      updatedAt,
      currentPeriodId: Number(raw.currentPeriodId || (periods[0] && periods[0].periodId) || currentPeriodId),
      sourceUrl: raw.sourceUrl || "",
      periods,
    };
  }

  const rows = Array.isArray(raw.rows) ? raw.rows : [];
  const periodLabel = raw.periodLabel || "微博舞台推荐";
  return {
    updatedAt,
    currentPeriodId,
    sourceUrl: raw.sourceUrl || "",
    periods: [{
      periodId: currentPeriodId,
      periodLabel,
      targetValueInt: 0,
      rows: rows.map((row, index) => normalizeWeiboRow(row, index, currentPeriodId, periodLabel, targetName)),
    }],
  };
}

async function ingestWeiboStage(request, env) {
  if (!config(env).weiboStageCollectionEnabled) {
    throw httpError("weibo_stage_collection_disabled", 409);
  }
  const payload = await request.json().catch(() => null);
  const state = normalizeWeiboStageState(payload, env);
  const capturedAt = state.updatedAt;
  const capturedMs = Date.parse(capturedAt);
  const db = env.DB;
  let row = await db.prepare(
    "SELECT id, current_period_id, raw_json FROM snapshots WHERE captured_at = ?"
  ).bind(capturedAt).first();

  let stored = {
    updatedAt: capturedAt,
    campaign: null,
    hotVote: null,
    errors: {},
  };
  if (row && row.raw_json) {
    try {
      stored = parseStoredState(row.raw_json);
    } catch (err) {
      stored = Object.assign(stored, { errors: { parse: err.message } });
    }
  }
  stored.updatedAt = capturedAt;
  stored.weiboStage = state;
  if (!stored.errors) stored.errors = {};
  const campaign = campaignState(stored);
  const currentPeriodId = campaign ? campaign.currentPeriodId : state.currentPeriodId;

  if (row) {
    await db.prepare(
      "UPDATE snapshots SET captured_ms = ?, current_period_id = ?, raw_json = ? WHERE id = ?"
    ).bind(capturedMs, currentPeriodId, JSON.stringify(stored), row.id).run();
  } else {
    await db.prepare(
      "INSERT INTO snapshots (captured_at, captured_ms, current_period_id, raw_json) VALUES (?, ?, ?, ?)"
    ).bind(capturedAt, capturedMs, currentPeriodId, JSON.stringify(stored)).run();
    row = await db.prepare("SELECT id FROM snapshots WHERE captured_at = ?").bind(capturedAt).first();
  }
  await pruneOldSnapshots(env);

  const rowCount = (state.periods || []).reduce((sum, period) => sum + (period.rows || []).length, 0);
  return {
    capturedAt,
    snapshotId: row && row.id,
    currentPeriodId: state.currentPeriodId,
    periodCount: (state.periods || []).length,
    rowCount,
  };
}

function normalizeBilibiliIngestRow(row, index, periodId, periodLabel, targetName) {
  const bvid = String(row.bvid || row.coverId || "").trim();
  const title = String(row.title || row.name || row.biliTitle || bvid || `视频 ${index + 1}`).trim();
  const biliTitle = String(row.biliTitle || row.rawTitle || title).trim();
  const owner = String(row.owner || row.guest || "").trim();
  const performers = normalizeBilibiliPerformers(row.performers || row.performerNames || row.performerText);
  const performerText = performers.join("/");
  const interactionValue = Number(
    row.interactionValue != null ? row.interactionValue :
      row.view != null ? row.view :
        row.play || 0
  );
  const like = Number(row.like != null ? row.like : row.roundAmount || 0);
  const favorite = Number(row.favorite != null ? row.favorite : row.onScreenCount || 0);
  const coin = Number(row.coin || 0);
  const share = Number(row.share || 0);
  const haystack = `${title} ${biliTitle} ${owner}`;
  return {
    rank: Number(row.rank || index + 1),
    title,
    guest: performerText || owner,
    interactionValue: Number.isFinite(interactionValue) ? interactionValue : 0,
    roundAmount: Number.isFinite(like) ? like : 0,
    onScreenCount: Number.isFinite(favorite) ? favorite : 0,
    cid: String(row.cid || ""),
    coverId: bvid || String(row.key || `${title}:${index + 1}`),
    coverUrl: row.coverUrl || row.pic || "",
    isTarget: Boolean(row.isTarget) || haystack.includes(targetName),
    key: row.key || `${periodId}:${bvid || `${title}:${index + 1}`}`,
    periodId,
    periodLabel,
    bvid,
    url: row.url || (bvid ? `https://www.bilibili.com/video/${bvid}/` : ""),
    biliTitle,
    owner,
    performers,
    performerText,
    aid: Number(row.aid || 0),
    like,
    favorite,
    coin,
    share,
    danmaku: Number(row.danmaku || 0),
    reply: Number(row.reply || 0),
    statSource: row.statSource || "local-ingest",
  };
}

function normalizeBilibiliState(payload, env) {
  const raw = payload && (payload.state || payload.bilibili || payload.snapshot || payload);
  if (!raw) throw httpError("empty_payload", 400);
  const targetName = env.MGTV_TARGET_NAME || DEFAULTS.targetName;
  const updatedAt = minuteBucket(raw.updatedAt || raw.iso || new Date());
  const currentPeriodId = Number(raw.currentPeriodId || raw.periodId || BILIBILI_PERIOD_ID);

  if (Array.isArray(raw.periods)) {
    const periods = raw.periods.map(period => {
      const periodId = Number(period.periodId || currentPeriodId);
      const periodLabel = period.periodLabel || period.label || BILIBILI_PERIOD_LABEL;
      const rows = (period.rows || [])
        .map((row, index) => normalizeBilibiliIngestRow(row, index, periodId, periodLabel, targetName))
        .sort((a, b) => b.interactionValue - a.interactionValue || a.title.localeCompare(b.title, "zh-CN"));
      rows.forEach((row, index) => { row.rank = index + 1; });
      return Object.assign({}, period, {
        periodId,
        periodLabel,
        targetValueInt: Number(period.targetValueInt || 0),
        rows,
      });
    });
    return {
      updatedAt,
      currentPeriodId: Number(raw.currentPeriodId || (periods[0] && periods[0].periodId) || currentPeriodId),
      sourceUrl: raw.sourceUrl || "https://www.bilibili.com/",
      periods,
    };
  }

  const rows = (raw.rows || [])
    .map((row, index) => normalizeBilibiliIngestRow(row, index, currentPeriodId, BILIBILI_PERIOD_LABEL, targetName))
    .sort((a, b) => b.interactionValue - a.interactionValue || a.title.localeCompare(b.title, "zh-CN"));
  rows.forEach((row, index) => { row.rank = index + 1; });
  return {
    updatedAt,
    currentPeriodId,
    sourceUrl: raw.sourceUrl || "https://www.bilibili.com/",
    periods: [{
      periodId: currentPeriodId,
      periodLabel: raw.periodLabel || BILIBILI_PERIOD_LABEL,
      targetValueInt: 0,
      rows,
    }],
  };
}

async function ingestBilibili(request, env) {
  if (!config(env).bilibiliCollectionEnabled) {
    throw httpError("bilibili_collection_disabled", 409);
  }
  const payload = await request.json().catch(() => null);
  const state = normalizeBilibiliState(payload, env);
  const capturedAt = state.updatedAt;
  const capturedMs = Date.parse(capturedAt);
  const db = env.DB;
  let row = await db.prepare(
    "SELECT id, current_period_id, raw_json FROM snapshots WHERE captured_at = ?"
  ).bind(capturedAt).first();

  let stored = {
    updatedAt: capturedAt,
    campaign: null,
    hotVote: null,
    errors: {},
  };
  if (row && row.raw_json) {
    try {
      stored = parseStoredState(row.raw_json);
    } catch (err) {
      stored = Object.assign(stored, { errors: { parse: err.message } });
    }
  }
  stored.updatedAt = capturedAt;
  stored.bilibili = state;
  if (!stored.errors) stored.errors = {};
  stored.errors.bilibili = null;
  const campaign = campaignState(stored);
  const currentPeriodId = campaign ? campaign.currentPeriodId : state.currentPeriodId;

  if (row) {
    await db.prepare(
      "UPDATE snapshots SET captured_ms = ?, current_period_id = ?, raw_json = ? WHERE id = ?"
    ).bind(capturedMs, currentPeriodId, JSON.stringify(stored), row.id).run();
  } else {
    try {
      await db.prepare(
        "INSERT INTO snapshots (captured_at, captured_ms, current_period_id, raw_json) VALUES (?, ?, ?, ?)"
      ).bind(capturedAt, capturedMs, currentPeriodId, JSON.stringify(stored)).run();
      row = await db.prepare("SELECT id FROM snapshots WHERE captured_at = ?").bind(capturedAt).first();
    } catch (err) {
      if (!isUniqueConstraintError(err)) throw err;
      row = await db.prepare(
        "SELECT id, current_period_id, raw_json FROM snapshots WHERE captured_at = ?"
      ).bind(capturedAt).first();
      stored = mergeStoredBilibili(row, state, capturedAt);
      const mergedCampaign = campaignState(stored);
      const mergedPeriodId = mergedCampaign ? mergedCampaign.currentPeriodId : state.currentPeriodId;
      await db.prepare(
        "UPDATE snapshots SET captured_ms = ?, current_period_id = ?, raw_json = ? WHERE id = ?"
      ).bind(capturedMs, mergedPeriodId, JSON.stringify(stored), row.id).run();
    }
  }
  await pruneOldSnapshots(env);

  const rowCount = (state.periods || []).reduce((sum, period) => sum + (period.rows || []).length, 0);
  return {
    capturedAt,
    snapshotId: row && row.id,
    currentPeriodId: state.currentPeriodId,
    periodCount: (state.periods || []).length,
    rowCount,
  };
}

const BILIBILI_STATE_MARKER = '%"bilibili":{"updatedAt"%';

async function latestRowWithState(env, pick, marker) {
  if (marker) {
    const row = await env.DB.prepare(
      "SELECT id, captured_at, captured_ms, current_period_id, raw_json FROM snapshots WHERE raw_json LIKE ? ORDER BY captured_ms DESC LIMIT 1"
    ).bind(marker).first();
    if (row && pick(parseStoredState(row.raw_json))) return row;
  }
  const rows = await env.DB.prepare(
    "SELECT id, captured_at, captured_ms, current_period_id, raw_json FROM snapshots ORDER BY captured_ms DESC LIMIT 500"
  ).all();
  const row = (rows.results || []).find(item => pick(parseStoredState(item.raw_json)));
  if (!row) throw httpError("no_snapshot_yet", 404);
  return row;
}

function isUniqueConstraintError(err) {
  return /UNIQUE constraint failed|SQLITE_CONSTRAINT/i.test(String(err && (err.message || err)));
}

function mergeStoredBilibili(row, state, capturedAt) {
  let stored = {
    updatedAt: capturedAt,
    campaign: null,
    hotVote: null,
    errors: {},
  };
  if (row && row.raw_json) {
    try {
      stored = parseStoredState(row.raw_json);
    } catch (err) {
      stored.errors = Object.assign({}, stored.errors, { parse: err.message });
    }
  }
  stored.updatedAt = capturedAt;
  stored.bilibili = state;
  if (!stored.errors) stored.errors = {};
  stored.errors.bilibili = null;
  return stored;
}

async function health(env) {
  const cfg = config(env);
  const latestRow = await env.DB.prepare(
    "SELECT captured_at, captured_ms, current_period_id FROM snapshots ORDER BY captured_ms DESC LIMIT 1"
  ).first();
  const countRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM snapshots").first();
  let latestHot = null;
  let latestWeibo = null;
  let latestBilibili = null;
  if (latestRow) {
    try {
      const row = await latestRowWithState(env, hotVoteState);
      latestHot = {
        captured_at: row.captured_at,
        captured_ms: row.captured_ms,
      };
    } catch (err) {
      latestHot = null;
    }
    try {
      const row = await latestRowWithState(env, weiboStageState);
      latestWeibo = {
        captured_at: row.captured_at,
        captured_ms: row.captured_ms,
      };
    } catch (err) {
      latestWeibo = null;
    }
    try {
      const row = await latestRowWithState(env, bilibiliState, BILIBILI_STATE_MARKER);
      latestBilibili = {
        captured_at: row.captured_at,
        captured_ms: row.captured_ms,
      };
    } catch (err) {
      latestBilibili = null;
    }
  }
  return {
    ok: true,
    source: "worker",
    snapshots: Number(countRow && countRow.count || 0),
    latest: latestRow || null,
    hotVote: latestHot,
    weiboStage: latestWeibo,
    bilibili: latestBilibili,
    collection: {
      stage: cfg.stageCollectionEnabled,
      hotVote: cfg.hotVoteCollectionEnabled,
      weiboStage: cfg.weiboStageCollectionEnabled,
      bilibili: cfg.bilibiliCollectionEnabled,
      bilibiliWorkerFetch: cfg.bilibiliWorkerFetchEnabled,
    },
  };
}

function stateToMonitorSnapshot(state, periodId) {
  const rows = [];
  (state.periods || []).forEach(period => {
    if (periodId && Number(period.periodId) !== Number(periodId)) return;
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
        hotValue: row.hotValue,
        awkwardValue: row.awkwardValue,
        status: row.status,
        coverUrl: row.coverUrl,
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
    ts: Date.parse(state.updatedAt),
    iso: state.updatedAt,
    currentPeriodId: state.currentPeriodId,
    rows,
  };
}
