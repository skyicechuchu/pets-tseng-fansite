const DEFAULTS = {
  apiBase: "https://hb-mangott.api.mgtv.com",
  appId: 1,
  platform: "iphone",
  targetName: "曾沛慈",
  retentionDays: 14,
};

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
        endpoints: ["/health", "/latest", "/history?limit=720"],
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

    if (request.method === "POST" && url.pathname === "/admin/collect") {
      requireAdmin(request, env);
      const result = await collectAndStore(env);
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

async function loadMgtvState(env) {
  const cfg = config(env);
  const capturedAt = minuteBucket();
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

async function collectAndStore(env) {
  const state = await loadMgtvState(env);
  const capturedAt = state.updatedAt;
  const capturedMs = Date.parse(capturedAt);
  const db = env.DB;

  let row = await db.prepare("SELECT id FROM snapshots WHERE captured_at = ?").bind(capturedAt).first();
  if (row) {
    await db.prepare(
      "UPDATE snapshots SET captured_ms = ?, current_period_id = ?, raw_json = ? WHERE id = ?"
    ).bind(capturedMs, state.currentPeriodId, JSON.stringify(state), row.id).run();
    await db.prepare("DELETE FROM snapshot_rows WHERE snapshot_id = ?").bind(row.id).run();
  } else {
    await db.prepare(
      "INSERT INTO snapshots (captured_at, captured_ms, current_period_id, raw_json) VALUES (?, ?, ?, ?)"
    ).bind(capturedAt, capturedMs, state.currentPeriodId, JSON.stringify(state)).run();
    row = await db.prepare("SELECT id FROM snapshots WHERE captured_at = ?").bind(capturedAt).first();
  }

  const statements = [];
  for (const period of state.periods || []) {
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
    currentPeriodId: state.currentPeriodId,
    periodCount: state.periods.length,
    rowCount: statements.length,
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
  const row = await env.DB.prepare(
    "SELECT id, captured_at, captured_ms, current_period_id, raw_json FROM snapshots ORDER BY captured_ms DESC LIMIT 1"
  ).first();
  if (!row) throw httpError("no_snapshot_yet", 404);
  return {
    ok: true,
    source: "worker",
    state: JSON.parse(row.raw_json),
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
  const snapshots = (rows.results || []).reverse().map(row => stateToMonitorSnapshot(JSON.parse(row.raw_json), periodId));
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

async function health(env) {
  const latestRow = await env.DB.prepare(
    "SELECT captured_at, captured_ms, current_period_id FROM snapshots ORDER BY captured_ms DESC LIMIT 1"
  ).first();
  const countRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM snapshots").first();
  return {
    ok: true,
    source: "worker",
    snapshots: Number(countRow && countRow.count || 0),
    latest: latestRow || null,
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
