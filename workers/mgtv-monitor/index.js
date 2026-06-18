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
      const limit = clampInt(url.searchParams.get("limit"), 2, 1440, 720);
      const periodId = url.searchParams.get("periodId");
      return json(await history(env, limit, periodId), cors);
    }

    if (request.method === "GET" && url.pathname === "/hot/latest") {
      return json(await hotLatest(env), cors);
    }

    if (request.method === "GET" && url.pathname === "/hot/history") {
      const limit = clampInt(url.searchParams.get("limit"), 2, 1440, 720);
      const periodId = url.searchParams.get("periodId");
      return json(await hotHistory(env, limit, periodId), cors);
    }

    if (request.method === "GET" && url.pathname === "/weibo/latest") {
      return json(await weiboLatest(env), cors);
    }

    if (request.method === "GET" && url.pathname === "/weibo/history") {
      const limit = clampInt(url.searchParams.get("limit"), 2, 1440, 720);
      const periodId = url.searchParams.get("periodId");
      return json(await weiboHistory(env, limit, periodId), cors);
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
    appId: Number(env.MGTV_APP_ID || DEFAULTS.appId),
    platform: env.MGTV_PLATFORM || DEFAULTS.platform,
    targetName: env.MGTV_TARGET_NAME || DEFAULTS.targetName,
    retentionDays: Number(env.RETENTION_DAYS || DEFAULTS.retentionDays),
  };
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

async function loadMgtvState(env, capturedAt) {
  const cfg = config(env);
  const configData = await fetchMgtv("/online/live/campaign/config", mgtvParams({}, cfg), cfg);
  const current = configData.weeklyPeriod || {};
  const stageTags = configData.stageTags || [];
  const periods = await Promise.all(stageTags.map(async tag => {
    const periodId = Number(tag.periodId);
    const merged = Object.assign({}, tag, periodId === Number(current.periodId) ? current : {});
    merged.periodId = periodId;
    merged.periodLabel = tag.stageTag || merged.periodName || `period ${periodId}`;
    merged.targetValueInt = Number(merged.targetValueInt || current.targetValueInt || 0);
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
  const campaignTask = cfg.stageCollectionEnabled
    ? loadMgtvState(env, capturedAt)
    : Promise.resolve(null);
  const hotVoteTask = cfg.hotVoteCollectionEnabled
    ? loadHotVoteState(env, capturedAt)
    : Promise.resolve(null);
  const [campaign, hotVote] = await Promise.allSettled([
    campaignTask,
    hotVoteTask,
  ]);
  const campaignValue = campaign.status === "fulfilled" ? campaign.value : null;
  const hotVoteValue = hotVote.status === "fulfilled" ? hotVote.value : null;
  if ((cfg.stageCollectionEnabled || cfg.hotVoteCollectionEnabled) && !campaignValue && !hotVoteValue) {
    const campaignError = cfg.stageCollectionEnabled && campaign.status === "rejected"
      ? campaign.reason.message
      : "stage_collection_disabled";
    const hotVoteError = cfg.hotVoteCollectionEnabled && hotVote.status === "rejected"
      ? hotVote.reason.message
      : "hot_vote_collection_disabled";
    throw new Error(`all_sources_failed: ${campaignError}; ${hotVoteError}`);
  }
  const state = {
    updatedAt: capturedAt,
    campaign: campaignValue,
    hotVote: hotVoteValue,
    errors: {
      campaign: cfg.stageCollectionEnabled
        ? (campaign.status === "rejected" ? campaign.reason.message : null)
        : "stage_collection_disabled",
      hotVote: cfg.hotVoteCollectionEnabled
        ? (hotVote.status === "rejected" ? hotVote.reason.message : null)
        : "hot_vote_collection_disabled",
    },
    collection: {
      stage: cfg.stageCollectionEnabled,
      hotVote: cfg.hotVoteCollectionEnabled,
      weiboStage: cfg.weiboStageCollectionEnabled,
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
  if (parsed && (parsed.campaign || parsed.hotVote || parsed.weiboStage)) return parsed;
  return {
    updatedAt: parsed && parsed.updatedAt,
    currentPeriodId: parsed && parsed.currentPeriodId,
    periods: parsed && parsed.periods,
    campaign: parsed || null,
    hotVote: parsed && parsed.hotVote || null,
    weiboStage: parsed && parsed.weiboStage || null,
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

async function collectAndStore(env) {
  const state = await loadSnapshotBundle(env);
  const campaign = campaignState(state);
  const hotVote = hotVoteState(state);
  const capturedAt = state.updatedAt;
  const capturedMs = Date.parse(capturedAt);
  const db = env.DB;

  if (!campaign && !hotVote) {
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
    } catch (err) {
      // Existing malformed raw JSON should not block a fresh MGTV snapshot.
    }
  }
  if (row) {
    await db.prepare(
      "UPDATE snapshots SET captured_ms = ?, current_period_id = ?, raw_json = ? WHERE id = ?"
    ).bind(capturedMs, campaign ? campaign.currentPeriodId : null, JSON.stringify(state), row.id).run();
    await db.prepare("DELETE FROM snapshot_rows WHERE snapshot_id = ?").bind(row.id).run();
  } else {
    await db.prepare(
      "INSERT INTO snapshots (captured_at, captured_ms, current_period_id, raw_json) VALUES (?, ?, ?, ?)"
    ).bind(capturedAt, capturedMs, campaign ? campaign.currentPeriodId : null, JSON.stringify(state)).run();
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
    errors: state.errors,
    collection: state.collection,
    rowCount: statements.length,
    stageCollectionEnabled: config(env).stageCollectionEnabled,
    hotVoteCollectionEnabled: config(env).hotVoteCollectionEnabled,
    weiboStageCollectionEnabled: config(env).weiboStageCollectionEnabled,
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

async function history(env, limit, periodId) {
  const rows = await env.DB.prepare(
    "SELECT id, captured_at, captured_ms, current_period_id, raw_json FROM snapshots ORDER BY captured_ms DESC LIMIT ?"
  ).bind(limit).all();
  const snapshots = (rows.results || [])
    .reverse()
    .map(row => campaignState(parseStoredState(row.raw_json)))
    .filter(Boolean)
    .map(state => stateToMonitorSnapshot(state, periodId));
  return {
    ok: true,
    source: "worker",
    snapshots,
    meta: {
      count: snapshots.length,
      limit,
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

async function hotHistory(env, limit, periodId) {
  const rows = await env.DB.prepare(
    "SELECT id, captured_at, captured_ms, current_period_id, raw_json FROM snapshots ORDER BY captured_ms DESC LIMIT ?"
  ).bind(limit).all();
  const snapshots = (rows.results || [])
    .reverse()
    .map(row => hotVoteState(parseStoredState(row.raw_json)))
    .filter(Boolean)
    .map(state => stateToMonitorSnapshot(state, periodId));
  return {
    ok: true,
    source: "worker",
    snapshots,
    meta: {
      count: snapshots.length,
      limit,
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

async function weiboHistory(env, limit, periodId) {
  const rows = await env.DB.prepare(
    "SELECT id, captured_at, captured_ms, current_period_id, raw_json FROM snapshots ORDER BY captured_ms DESC LIMIT ?"
  ).bind(limit).all();
  const snapshots = (rows.results || [])
    .reverse()
    .map(row => weiboStageState(parseStoredState(row.raw_json)))
    .filter(Boolean)
    .map(state => stateToMonitorSnapshot(state, periodId));
  return {
    ok: true,
    source: "worker",
    snapshots,
    meta: {
      count: snapshots.length,
      limit,
      periodId: periodId ? Number(periodId) : null,
    },
  };
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

async function latestRowWithState(env, pick) {
  const rows = await env.DB.prepare(
    "SELECT id, captured_at, captured_ms, current_period_id, raw_json FROM snapshots ORDER BY captured_ms DESC LIMIT 50"
  ).all();
  const row = (rows.results || []).find(item => pick(parseStoredState(item.raw_json)));
  if (!row) throw httpError("no_snapshot_yet", 404);
  return row;
}

async function health(env) {
  const cfg = config(env);
  const latestRow = await env.DB.prepare(
    "SELECT captured_at, captured_ms, current_period_id FROM snapshots ORDER BY captured_ms DESC LIMIT 1"
  ).first();
  const countRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM snapshots").first();
  let latestHot = null;
  let latestWeibo = null;
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
  }
  return {
    ok: true,
    source: "worker",
    snapshots: Number(countRow && countRow.count || 0),
    latest: latestRow || null,
    hotVote: latestHot,
    weiboStage: latestWeibo,
    collection: {
      stage: cfg.stageCollectionEnabled,
      hotVote: cfg.hotVoteCollectionEnabled,
      weiboStage: cfg.weiboStageCollectionEnabled,
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
