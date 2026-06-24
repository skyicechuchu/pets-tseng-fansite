#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data.v2.js");
const PERIOD_ID = 20260623;
const PERIOD_LABEL = "B站舞台数据";

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] != null) return;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  });
}

loadEnvFile(path.join(ROOT, ".env"));
loadEnvFile(path.join(ROOT, ".env.local"));
loadEnvFile(path.join(ROOT, ".env.bilibili"));

function loadSiteConfig() {
  const code = fs.readFileSync(DATA_FILE, "utf8");
  return vm.runInNewContext(`${code}\nSITE;`, { console });
}

function workerApiBase(site) {
  return String(
    process.env.BILIBILI_WORKER_API_BASE ||
    site.campaign && site.campaign.mgtv && site.campaign.mgtv.workerApiBase ||
    ""
  ).replace(/\/$/, "");
}

function collectToken() {
  return process.env.BILIBILI_COLLECT_TOKEN || process.env.WEIBO_STAGE_COLLECT_TOKEN || process.env.COLLECT_TOKEN || "";
}

function minuteBucket(date = new Date()) {
  const d = new Date(date);
  d.setUTCSeconds(0, 0);
  return d.toISOString();
}

function videoUrl(bvid) {
  const query = new URLSearchParams({ bvid });
  return `https://api.bilibili.com/x/web-interface/view?${query.toString()}`;
}

function normalizePerformerList(value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map(item => String(item || "").trim()).filter(Boolean)));
  }
  if (typeof value === "string") {
    return Array.from(new Set(value.split(/[、/,，&|｜\s]+/).map(item => item.trim()).filter(Boolean)));
  }
  return [];
}

async function fetchVideo(video) {
  const res = await fetch(videoUrl(video.bvid), {
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Referer": `https://www.bilibili.com/video/${video.bvid}/`,
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const payload = await res.json();
  if (payload.code !== 0) throw new Error(payload.message || `API ${payload.code}`);
  const data = payload.data || {};
  const stat = data.stat || {};
  const owner = data.owner || {};
  const performers = normalizePerformerList(video.performers);
  return {
    title: video.title || data.title || video.bvid,
    biliTitle: data.title || video.title || video.bvid,
    owner: owner.name || video.owner || "",
    performers,
    performerText: performers.join("/"),
    bvid: data.bvid || video.bvid,
    url: `https://www.bilibili.com/video/${data.bvid || video.bvid}/`,
    aid: Number(data.aid || stat.aid || 0),
    cid: String(data.cid || ""),
    coverUrl: data.pic || "",
    interactionValue: Number(stat.view || 0),
    view: Number(stat.view || 0),
    like: Number(stat.like || 0),
    favorite: Number(stat.favorite || 0),
    coin: Number(stat.coin || 0),
    share: Number(stat.share || 0),
    danmaku: Number(stat.danmaku || 0),
    reply: Number(stat.reply || 0),
    statSource: "local-view",
  };
}

async function settleInBatches(items, limit, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const settled = await Promise.allSettled(batch.map(fn));
    results.push(...settled);
  }
  return results;
}

async function collectState(site) {
  const biliConfig = site.campaign && site.campaign.bilibili || {};
  const videos = biliConfig.videos || [];
  const minViewCount = Number(biliConfig.minViewCount || 0);
  if (!videos.length) throw new Error("campaign.bilibili.videos is empty");
  const results = await settleInBatches(videos, 6, fetchVideo);
  const rows = [];
  const errors = [];
  results.forEach((result, index) => {
    const video = videos[index] || {};
    if (result.status === "fulfilled") rows.push(result.value);
    else errors.push({ bvid: video.bvid || "", error: result.reason && result.reason.message || String(result.reason) });
  });
  const excluded = minViewCount > 0
    ? rows.filter(row => Number(row.interactionValue || 0) <= minViewCount)
    : [];
  const includedRows = minViewCount > 0
    ? rows.filter(row => Number(row.interactionValue || 0) > minViewCount)
    : rows;
  if (!rows.length) {
    throw new Error(`all_bilibili_requests_failed: ${errors.map(item => `${item.bvid}:${item.error}`).join("; ")}`);
  }
  if (!includedRows.length) {
    throw new Error(`all_bilibili_requests_below_min_view_count:${minViewCount}`);
  }
  includedRows.sort((a, b) => b.interactionValue - a.interactionValue || a.title.localeCompare(b.title, "zh-CN"));
  includedRows.forEach((row, index) => {
    row.rank = index + 1;
    row.periodId = PERIOD_ID;
    row.periodLabel = PERIOD_LABEL;
    row.key = `${PERIOD_ID}:${row.bvid}`;
  });
  return {
    updatedAt: minuteBucket(),
    currentPeriodId: PERIOD_ID,
    sourceUrl: "https://www.bilibili.com/",
    errors,
    excluded,
    periods: [{
      periodId: PERIOD_ID,
      periodLabel: PERIOD_LABEL,
      targetValueInt: 0,
      rows: includedRows,
    }],
  };
}

async function uploadState(site, state) {
  const base = workerApiBase(site);
  if (!base) throw new Error("Worker API base is not configured");
  const token = collectToken();
  if (!token) throw new Error("Set BILIBILI_COLLECT_TOKEN, WEIBO_STAGE_COLLECT_TOKEN, or COLLECT_TOKEN before uploading");
  const res = await fetch(`${base}/admin/bilibili/ingest`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ state }),
  });
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(`Worker returned non-JSON: ${text.slice(0, 120) || err.message}`);
  }
  if (!res.ok || json.ok === false) throw new Error(json.error || `Worker HTTP ${res.status}`);
  return json;
}

function printSummary(state, uploadResult) {
  const rows = state.periods[0].rows || [];
  const top = rows[0] || {};
  console.log(JSON.stringify({
    ok: true,
    updatedAt: state.updatedAt,
    rowCount: rows.length,
    top: top.bvid ? {
      rank: top.rank,
      title: top.title,
      bvid: top.bvid,
      view: top.interactionValue,
      like: top.like,
    } : null,
    errors: state.errors,
    excludedCount: Array.isArray(state.excluded) ? state.excluded.length : 0,
    upload: uploadResult && uploadResult.result || null,
  }, null, 2));
}

async function collectOnce(options) {
  const site = loadSiteConfig();
  const state = await collectState(site);
  let uploadResult = null;
  if (!options.dryRun) uploadResult = await uploadState(site, state);
  printSummary(state, uploadResult);
}

function nextDelay(ms) {
  const now = Date.now();
  const delay = ms - (now % ms);
  return delay < 1000 ? delay + ms : delay;
}

async function watch(options) {
  const site = loadSiteConfig();
  const refreshMs = Number(
    process.env.BILIBILI_REFRESH_MS ||
    site.campaign && site.campaign.bilibili && site.campaign.bilibili.refreshMs ||
    300000
  );
  console.log(`Bilibili monitor started: every ${Math.round(refreshMs / 60000)} minutes`);
  const loop = async () => {
    try {
      await collectOnce(options);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] ${err.message || err}`);
    }
    setTimeout(loop, nextDelay(refreshMs));
  };
  await loop();
}

async function main() {
  const mode = process.argv[2] || "collect";
  const dryRun = process.argv.includes("--dry-run");
  if (mode === "collect") return collectOnce({ dryRun });
  if (mode === "watch") return watch({ dryRun });
  console.error("Usage: node scripts/bilibili-monitor.js collect|watch [--dry-run]");
  process.exit(1);
}

main().catch(err => {
  console.error(err && err.stack || err);
  process.exit(1);
});
