#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");
const readline = require("readline");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_SOURCE_URL = "https://m.weibo.cn/c/wbox?id=l331zrkexk&cid=1334";
const DEFAULT_LOGIN_URL = "https://weibo.com/?topnav=1&mod=logo";
const PROFILE_DIR = process.env.WEIBO_STAGE_PROFILE_DIR || path.join(ROOT, ".auth/weibo-stage-profile");
const HISTORY_PATH = process.env.WEIBO_STAGE_HISTORY_PATH || path.join(ROOT, "data/weibo-stage-history.json");
const DEBUG_DIR = process.env.WEIBO_STAGE_DEBUG_DIR || path.join(ROOT, "tmp/weibo-stage");
const SOURCE_URL = process.env.WEIBO_STAGE_URL || DEFAULT_SOURCE_URL;
const LOGIN_URL = process.env.WEIBO_LOGIN_URL || DEFAULT_LOGIN_URL;
const TARGET_NAME = process.env.WEIBO_STAGE_TARGET_NAME || "曾沛慈";
const PERIOD_ID = Number(process.env.WEIBO_STAGE_PERIOD_ID || 20260618);
const PERIOD_LABEL = process.env.WEIBO_STAGE_PERIOD_LABEL || "五公舞台推荐";
const MAX_SNAPSHOTS = Number(process.env.WEIBO_STAGE_MAX_SNAPSHOTS || 10080);
const INTERVAL_MS = Number(process.env.WEIBO_STAGE_INTERVAL_MS || 60000);
const PAGE_WAIT_MS = Number(process.env.WEIBO_STAGE_PAGE_WAIT_MS || 15000);

function readDefaultWorkerBase() {
  try {
    const text = require("fs").readFileSync(path.join(ROOT, "data.v2.js"), "utf8");
    const match = text.match(/workerApiBase:\s*"([^"]*)"/);
    return match ? match[1] : "";
  } catch (err) {
    return "";
  }
}

function readWeiboStageCollectionSwitch() {
  try {
    const text = require("fs").readFileSync(path.join(ROOT, "data.v2.js"), "utf8");
    const block = text.match(/weiboStage:\s*\{([\s\S]*?)\n\s*\},/);
    if (!block) return true;
    const match = block[1].match(/collectionEnabled:\s*(true|false)/);
    return match ? match[1] === "true" : true;
  } catch (err) {
    return true;
  }
}

const WORKER_API_BASE = (process.env.WEIBO_STAGE_WORKER_API_BASE || readDefaultWorkerBase()).replace(/\/$/, "");
const COLLECT_TOKEN = process.env.WEIBO_STAGE_COLLECT_TOKEN || process.env.COLLECT_TOKEN || "";
const COLLECTION_ENABLED = process.env.WEIBO_STAGE_COLLECTION_ENABLED == null
  ? readWeiboStageCollectionSwitch()
  : process.env.WEIBO_STAGE_COLLECTION_ENABLED !== "false";

function minuteIso(date = new Date()) {
  const d = new Date(date);
  d.setUTCSeconds(0, 0);
  return d.toISOString();
}

function parseNumber(value) {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const unit = /亿/.test(raw) ? 100000000 : /万|w/i.test(raw) ? 10000 : 1;
  const cleaned = raw.replace(/[,\s，]/g, "").replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n * unit) : null;
}

function stableKey(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "")
    .slice(0, 80);
}

function isLikelyUrl(value) {
  return /^https?:\/\//i.test(String(value || "")) || /^sinaweibo:\/\//i.test(String(value || ""));
}

function flattenEntries(value, prefix, out) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) return;
  Object.entries(value).forEach(([key, child]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      flattenEntries(child, nextKey, out);
    } else {
      out.push([nextKey, child]);
    }
  });
}

function pickTitle(obj) {
  const entries = [];
  flattenEntries(obj, "", entries);
  const preferred = [
    /vote_name|stage_name|work_name|item_name|team_name|group_name/i,
    /title|name|nickname|nick|display|text/i,
    /姐姐|舞台|曲目|团名|名称/,
  ];
  for (const pattern of preferred) {
    const hit = entries.find(([key, value]) => (
      pattern.test(key) &&
      typeof value === "string" &&
      value.trim().length >= 1 &&
      value.trim().length <= 48 &&
      !isLikelyUrl(value)
    ));
    if (hit) return hit[1].trim();
  }
  const fallback = entries.find(([, value]) => (
    typeof value === "string" &&
    value.trim().length >= 2 &&
    value.trim().length <= 30 &&
    !isLikelyUrl(value) &&
    !/^\d+$/.test(value.trim())
  ));
  return fallback ? fallback[1].trim() : "";
}

function pickGuest(obj) {
  const entries = [];
  flattenEntries(obj, "", entries);
  const hit = entries.find(([key, value]) => (
    /song|guest|artist|singer|member|姐姐|成员|曲目|歌曲|阵容/i.test(key) &&
    typeof value === "string" &&
    value.trim().length <= 80 &&
    !isLikelyUrl(value)
  ));
  return hit ? hit[1].trim() : "";
}

function pickRank(obj, fallback) {
  const entries = [];
  flattenEntries(obj, "", entries);
  const hit = entries.find(([key, value]) => (
    /(^|\.)(rank|ranking|index|sort|order|排名)$/.test(key) &&
    Number.isFinite(Number(value))
  ));
  return hit ? Number(hit[1]) : fallback;
}

function valueScore(key) {
  if (/id|uid|time|timestamp|rank|index|sort|order|width|height|status|state|type/i.test(key)) return -10;
  if (/推荐值|推荐数|推荐|投送|票数|投票|助力|夯|热度|support|vote|score|hot|value/i.test(key)) return 20;
  if (/count|num|number|total/i.test(key)) return 8;
  return 0;
}

function pickVoteValue(obj) {
  const entries = [];
  flattenEntries(obj, "", entries);
  const candidates = entries
    .map(([key, value]) => ({ key, value: parseNumber(value), score: valueScore(key) }))
    .filter(item => item.value != null && item.value >= 0 && item.score > 0)
    .sort((a, b) => b.score - a.score || b.value - a.value);
  return candidates.length ? candidates[0].value : null;
}

function collectObjectArrays(value, out) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    if (value.length && value.every(item => item && typeof item === "object" && !Array.isArray(item))) {
      out.push(value);
    }
    value.forEach(item => collectObjectArrays(item, out));
    return;
  }
  Object.values(value).forEach(item => collectObjectArrays(item, out));
}

function normalizeCandidateRows(items, source) {
  const rows = [];
  const seen = new Set();
  items.forEach((item, index) => {
    const title = pickTitle(item);
    const value = pickVoteValue(item);
    if (!title || value == null) return;
    const guest = pickGuest(item);
    const key = `${stableKey(title)}:${stableKey(guest)}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      key: `${PERIOD_ID}:${key || index + 1}`,
      periodId: PERIOD_ID,
      periodLabel: PERIOD_LABEL,
      title,
      guest,
      rank: pickRank(item, index + 1),
      interactionValue: value,
      roundAmount: 0,
      onScreenCount: 0,
      isTarget: `${title} ${guest}`.includes(TARGET_NAME),
      coverId: key || String(index + 1),
      source,
    });
  });
  return rows
    .sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0) || b.interactionValue - a.interactionValue)
    .map((row, index) => Object.assign({}, row, { rank: row.rank || index + 1 }));
}

function extractRowsFromJson(json, source) {
  const arrays = [];
  collectObjectArrays(json, arrays);
  const candidates = arrays
    .map(items => normalizeCandidateRows(items, source))
    .filter(rows => rows.length >= 2)
    .sort((a, b) => {
      const aSignal = a.filter(row => row.interactionValue > 0).length;
      const bSignal = b.filter(row => row.interactionValue > 0).length;
      return bSignal - aSignal || b.length - a.length;
    });
  return candidates[0] || [];
}

function previousNameLine(lines, index) {
  for (let i = index - 1; i >= Math.max(0, index - 4); i -= 1) {
    const line = lines[i];
    if (!line || /推荐|投送|规则|进入|搜索|活动|排名|分享|打开/.test(line)) continue;
    if (/^[\d#.\-\s]+$/.test(line)) continue;
    if (line.length <= 40) return line;
  }
  return "";
}

function extractRowsFromText(text) {
  const lines = String(text || "")
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean);
  const rows = [];
  const seen = new Set();
  lines.forEach((line, index) => {
    let title = "";
    let value = null;
    let match = line.match(/^(.{1,48}?)[\s:：]*(?:推荐值|推荐数|投送值|票数|助力值)[\s:：]*([0-9][0-9,，.]*\s*(?:万|w|W|亿)?)/);
    if (match) {
      title = match[1].replace(/^#?\d+[\s.、-]*/, "").trim();
      value = parseNumber(match[2]);
    } else if (/(推荐值|推荐数|投送值|票数|助力值)/.test(line)) {
      const n = line.match(/([0-9][0-9,，.]*\s*(?:万|w|W|亿)?)/);
      title = previousNameLine(lines, index);
      value = n ? parseNumber(n[1]) : null;
    }
    if (!title || value == null) return;
    const key = stableKey(title);
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      key: `${PERIOD_ID}:${key}`,
      periodId: PERIOD_ID,
      periodLabel: PERIOD_LABEL,
      title,
      guest: "",
      rank: rows.length + 1,
      interactionValue: value,
      roundAmount: 0,
      onScreenCount: 0,
      isTarget: title.includes(TARGET_NAME),
      coverId: key,
      source: "dom",
    });
  });
  return rows;
}

function buildState(rows, capturedAt) {
  const sorted = rows
    .slice()
    .sort((a, b) => b.interactionValue - a.interactionValue || a.rank - b.rank)
    .map((row, index) => Object.assign({}, row, { rank: index + 1 }));
  return {
    updatedAt: capturedAt,
    currentPeriodId: PERIOD_ID,
    sourceUrl: SOURCE_URL,
    periods: [{
      periodId: PERIOD_ID,
      periodLabel: PERIOD_LABEL,
      targetValueInt: 0,
      rows: sorted,
    }],
  };
}

function stateToSnapshot(state) {
  const rows = [];
  (state.periods || []).forEach(period => {
    (period.rows || []).forEach(row => {
      rows.push({
        key: row.key || `${period.periodId}:${row.coverId || row.title}`,
        periodId: Number(period.periodId),
        periodLabel: period.periodLabel,
        title: row.title,
        guest: row.guest || "",
        rank: Number(row.rank || 0),
        interactionValue: Number(row.interactionValue || 0),
        roundAmount: Number(row.roundAmount || 0),
        onScreenCount: Number(row.onScreenCount || 0),
        isTarget: Boolean(row.isTarget),
        coverId: row.coverId || "",
        source: row.source || "weibo",
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

async function ensureDir(fileOrDir, isDir) {
  await fs.mkdir(isDir ? fileOrDir : path.dirname(fileOrDir), { recursive: true });
}

async function loadHistory() {
  try {
    const raw = await fs.readFile(HISTORY_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Object.assign({ ok: true, source: "local-weibo-stage", snapshots: [] }, parsed);
  } catch (err) {
    return { ok: true, source: "local-weibo-stage", updatedAt: null, snapshots: [] };
  }
}

async function appendLocalHistory(snapshot) {
  await ensureDir(HISTORY_PATH, false);
  const history = await loadHistory();
  const snapshots = Array.isArray(history.snapshots) ? history.snapshots : [];
  const last = snapshots[snapshots.length - 1];
  if (last && last.iso === snapshot.iso) snapshots[snapshots.length - 1] = snapshot;
  else snapshots.push(snapshot);
  const next = {
    ok: true,
    source: "local-weibo-stage",
    updatedAt: snapshot.iso,
    snapshots: snapshots.slice(-MAX_SNAPSHOTS),
  };
  await fs.writeFile(HISTORY_PATH, `${JSON.stringify(next, null, 2)}\n`);
  return next.snapshots.length;
}

async function uploadToWorker(state) {
  if (!WORKER_API_BASE || !COLLECT_TOKEN) {
    return { skipped: true, reason: "missing_worker_or_token" };
  }
  const res = await fetch(`${WORKER_API_BASE}/admin/weibo/ingest`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${COLLECT_TOKEN}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ state }),
  });
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch (err) {
    throw new Error(`Worker returned non-JSON: ${text.slice(0, 120)}`);
  }
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || `Worker HTTP ${res.status}`);
  }
  return json;
}

async function saveDebug(page, responses, text, errorMessage) {
  await ensureDir(DEBUG_DIR, true);
  await fs.writeFile(path.join(DEBUG_DIR, "last-text.txt"), text || "");
  await fs.writeFile(path.join(DEBUG_DIR, "last-responses.json"), `${JSON.stringify(responses.map(item => ({
    url: item.url,
    status: item.status,
    contentType: item.contentType,
    sample: item.sample,
  })), null, 2)}\n`);
  await fs.writeFile(path.join(DEBUG_DIR, "last-error.txt"), `${errorMessage || ""}\n`);
  try {
    await page.screenshot({ path: path.join(DEBUG_DIR, "last-screenshot.png"), fullPage: true });
  } catch (err) {
    // Screenshot is best-effort only.
  }
}

async function launchContext(headless, mode) {
  await ensureDir(PROFILE_DIR, true);
  const desktop = mode === "desktop";
  return chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    viewport: desktop ? { width: 1360, height: 900 } : { width: 390, height: 844 },
    isMobile: !desktop,
    hasTouch: !desktop,
    deviceScaleFactor: desktop ? 1 : 3,
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
    userAgent: desktop
      ? [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        "AppleWebKit/537.36 (KHTML, like Gecko)",
        "Chrome/125.0.0.0 Safari/537.36",
      ].join(" ")
      : [
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        "AppleWebKit/605.1.15 (KHTML, like Gecko)",
        "Version/17.0 Mobile/15E148 Safari/604.1",
      ].join(" "),
  });
}

async function waitForEnter(message) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise(resolve => rl.question(message, resolve));
  rl.close();
}

async function login() {
  const context = await launchContext(false, "desktop");
  const page = await context.newPage();
  console.log(`打开微博网页版登录浏览器：${LOGIN_URL}`);
  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(err => {
    console.warn(`页面打开失败，可以在浏览器里手动输入微博地址：${err.message}`);
  });
  console.log("请在弹出的浏览器里完成微博网页版登录。登录完成后可以直接按 Enter 保存登录态。");
  await waitForEnter("完成后回到这里按 Enter 保存登录态并退出...");
  await context.close();
}

async function collectOnce() {
  if (!COLLECTION_ENABLED) {
    console.log(JSON.stringify({
      ok: true,
      skipped: true,
      reason: "weibo_stage_collection_disabled",
      hint: "Set weiboStage.collectionEnabled=true in data.v2.js or WEIBO_STAGE_COLLECTION_ENABLED=true to collect.",
    }, null, 2));
    return { ok: true, skipped: true };
  }
  const headless = process.env.WEIBO_STAGE_HEADLESS === "0" ? false : true;
  const context = await launchContext(headless, "mobile");
  const page = await context.newPage();
  const jsonCandidates = [];
  const responseDebug = [];

  page.on("response", async response => {
    const url = response.url();
    const contentType = response.headers()["content-type"] || "";
    const useful = /json|api|wbox|vote|recommend|rank|list/i.test(`${contentType} ${url}`);
    if (!useful) return;
    try {
      const text = await response.text();
      responseDebug.push({
        url,
        status: response.status(),
        contentType,
        sample: text.slice(0, 500),
      });
      if (!/^\s*[\[{]/.test(text)) return;
      const json = JSON.parse(text);
      const rows = extractRowsFromJson(json, url);
      if (rows.length >= 2) jsonCandidates.push({ rows, source: url });
    } catch (err) {
      // Some responses are streams or opaque; ignore them.
    }
  });

  let bodyText = "";
  try {
    await page.goto(SOURCE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(PAGE_WAIT_MS);
    bodyText = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
    const domRows = extractRowsFromText(bodyText);
    const candidates = jsonCandidates.concat(domRows.length >= 2 ? [{ rows: domRows, source: "dom" }] : []);
    candidates.sort((a, b) => {
      const aSignal = a.rows.filter(row => row.interactionValue > 0).length;
      const bSignal = b.rows.filter(row => row.interactionValue > 0).length;
      return bSignal - aSignal || b.rows.length - a.rows.length;
    });
    const best = candidates[0];
    if (!best || best.rows.length < 2) {
      const hint = bodyText.includes("打开微博客户端体验")
        ? "当前浏览器仍停在微博客户端打开页，没有进入真实榜单。"
        : "没有在页面 DOM 或网络 JSON 里识别到榜单行。";
      await saveDebug(page, responseDebug, bodyText, hint);
      throw new Error(`${hint} 调试文件已保存到 ${path.relative(ROOT, DEBUG_DIR)}/`);
    }

    const capturedAt = minuteIso();
    const state = buildState(best.rows, capturedAt);
    const snapshot = stateToSnapshot(state);
    const localCount = await appendLocalHistory(snapshot);
    let upload = { skipped: true };
    try {
      upload = await uploadToWorker(state);
    } catch (err) {
      upload = { ok: false, error: err.message };
    }
    console.log(JSON.stringify({
      ok: true,
      capturedAt,
      rows: snapshot.rows.length,
      source: best.source,
      localSnapshots: localCount,
      worker: upload,
    }, null, 2));
    return { ok: true, state, snapshot };
  } finally {
    await context.close();
  }
}

async function watch() {
  console.log(`微博舞台推荐监控已启动：每 ${Math.round(INTERVAL_MS / 1000)} 秒采集一次`);
  console.log(`本地历史：${path.relative(ROOT, HISTORY_PATH)}`);
  console.log(`采集开关：${COLLECTION_ENABLED ? "开" : "关"}`);
  if (WORKER_API_BASE && COLLECT_TOKEN) {
    console.log(`Worker 上传：${WORKER_API_BASE}/admin/weibo/ingest`);
  } else {
    console.log("Worker 上传未启用：设置 WEIBO_STAGE_COLLECT_TOKEN 后会自动上传。");
  }
  for (;;) {
    try {
      await collectOnce();
    } catch (err) {
      console.error(`[${new Date().toISOString()}] ${err.message}`);
    }
    await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
  }
}

async function main() {
  const command = process.argv[2] || "collect";
  if (command === "login") return login();
  if (command === "collect") return collectOnce();
  if (command === "watch") return watch();
  console.log([
    "Usage:",
    "  npm run weibo:login    # 打开浏览器，手动登录微博",
    "  npm run weibo:collect  # 采集一次并写入 data/weibo-stage-history.json",
    "  npm run weibo:watch    # 每分钟循环采集",
    "",
    "Env:",
    "  WEIBO_STAGE_COLLECT_TOKEN=<Cloudflare COLLECT_TOKEN>",
    "  WEIBO_STAGE_COLLECTION_ENABLED=true",
    "  WEIBO_LOGIN_URL=https://weibo.com/?topnav=1&mod=logo",
    "  WEIBO_STAGE_HEADLESS=0",
    "  WEIBO_STAGE_INTERVAL_MS=60000",
  ].join("\n"));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
