#!/usr/bin/env node

const fs = require("fs/promises");
const fsSync = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const HISTORY_PATH = process.env.WEIBO_STAGE_HISTORY_PATH || path.join(ROOT, "data/weibo-stage-history.json");
const DEBUG_DIR = process.env.WEIBO_IOS_DEBUG_DIR || path.join(ROOT, "tmp/weibo-ios");
const SCREENSHOT_PATH = process.env.WEIBO_IOS_SCREENSHOT_PATH || path.join(DEBUG_DIR, "latest.tiff");
const SOURCE_URL = process.env.WEIBO_STAGE_URL || "sinaweibo://wbox?id=l331zrkexk&cid=1334";
const TARGET_NAME = process.env.WEIBO_STAGE_TARGET_NAME || "曾沛慈";
const PERIOD_ID = Number(process.env.WEIBO_STAGE_PERIOD_ID || 20260618);
const PERIOD_LABEL = process.env.WEIBO_STAGE_PERIOD_LABEL || "五公舞台推荐";
const MAX_SNAPSHOTS = Number(process.env.WEIBO_STAGE_MAX_SNAPSHOTS || 10080);
const INTERVAL_MS = Number(process.env.WEIBO_STAGE_INTERVAL_MS || 60000);

function readText(file) {
  try {
    return fsSync.readFileSync(file, "utf8");
  } catch (err) {
    return "";
  }
}

function readDefaultWorkerBase() {
  const text = readText(path.join(ROOT, "data.v2.js"));
  const match = text.match(/workerApiBase:\s*"([^"]*)"/);
  return match ? match[1] : "";
}

function readWeiboStageCollectionSwitch() {
  const text = readText(path.join(ROOT, "data.v2.js"));
  const block = text.match(/weiboStage:\s*\{([\s\S]*?)\n\s*\},/);
  if (!block) return true;
  const match = block[1].match(/collectionEnabled:\s*(true|false)/);
  return match ? match[1] === "true" : true;
}

const WORKER_API_BASE = (process.env.WEIBO_STAGE_WORKER_API_BASE || readDefaultWorkerBase()).replace(/\/$/, "");
const COLLECT_TOKEN = process.env.WEIBO_STAGE_COLLECT_TOKEN || process.env.COLLECT_TOKEN || "";
const COLLECTION_ENABLED = process.env.WEIBO_STAGE_COLLECTION_ENABLED == null
  ? readWeiboStageCollectionSwitch()
  : process.env.WEIBO_STAGE_COLLECTION_ENABLED !== "false";

function commandExists(cmd) {
  const result = spawnSync("bash", ["-lc", `command -v ${cmd}`], { encoding: "utf8" });
  return result.status === 0 && result.stdout.trim();
}

function run(cmd, args, options) {
  const result = spawnSync(cmd, args, Object.assign({ encoding: "utf8" }, options || {}));
  if (result.status !== 0) {
    const stderr = result.stderr || result.stdout || "";
    throw new Error(`${cmd} ${args.join(" ")} failed: ${stderr.trim()}`);
  }
  return result.stdout || "";
}

async function ensureDir(fileOrDir, isDir) {
  await fs.mkdir(isDir ? fileOrDir : path.dirname(fileOrDir), { recursive: true });
}

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

function cleanLine(line) {
  return String(line || "")
    .replace(/[|｜]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isNameLine(line) {
  if (!line || line.length > 50) return false;
  if (/推荐|投送|规则|进入|搜索|活动|分享|打开|微博|客户端|榜单|推荐值|推荐数|票数/.test(line)) return false;
  if (/^[#\d\s.、\-:：]+$/.test(line)) return false;
  return /[\u4e00-\u9fa5A-Za-z]/.test(line);
}

function previousNameLine(lines, index) {
  for (let i = index - 1; i >= Math.max(0, index - 5); i -= 1) {
    if (isNameLine(lines[i])) return lines[i].replace(/^#?\d+[\s.、-]*/, "").trim();
  }
  return "";
}

function extractRowsFromOcr(text) {
  const lines = String(text || "")
    .split(/\n+/)
    .map(cleanLine)
    .filter(Boolean);
  const rows = [];
  const seen = new Set();

  function addRow(title, value, rawIndex) {
    title = cleanLine(title).replace(/^#?\d+[\s.、-]*/, "").trim();
    if (!title || value == null) return;
    const key = stableKey(title);
    if (!key || seen.has(key)) return;
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
      source: "ios-ocr",
      rawIndex,
    });
  }

  lines.forEach((line, index) => {
    let match = line.match(/^(.{1,48}?)[\s:：]*(?:推荐值|推荐数|投送值|票数|助力值)[\s:：]*([0-9][0-9,，.]*\s*(?:万|w|W|亿)?)/);
    if (match) {
      addRow(match[1], parseNumber(match[2]), index);
      return;
    }

    match = line.match(/^(.{1,48}?)\s+([0-9][0-9,，.]*\s*(?:万|w|W|亿)?)\s*(?:推荐值|推荐数|投送值|票数)?$/);
    if (match && isNameLine(match[1])) {
      addRow(match[1], parseNumber(match[2]), index);
      return;
    }

    if (/(推荐值|推荐数|投送值|票数|助力值)/.test(line)) {
      const n = line.match(/([0-9][0-9,，.]*\s*(?:万|w|W|亿)?)/);
      addRow(previousNameLine(lines, index), n ? parseNumber(n[1]) : null, index);
      return;
    }

    if (/^[0-9][0-9,，.]*\s*(?:万|w|W|亿)?$/.test(line)) {
      const prev = previousNameLine(lines, index);
      if (prev) addRow(prev, parseNumber(line), index);
    }
  });

  return rows
    .sort((a, b) => b.interactionValue - a.interactionValue || a.rawIndex - b.rawIndex)
    .map((row, index) => Object.assign({}, row, { rank: index + 1 }));
}

function stateToSnapshot(state) {
  const rows = [];
  (state.periods || []).forEach(period => {
    (period.rows || []).forEach(row => rows.push({
      key: row.key,
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
      source: row.source || "ios-ocr",
    }));
  });
  return {
    ts: Date.parse(state.updatedAt),
    iso: state.updatedAt,
    currentPeriodId: state.currentPeriodId,
    rows,
  };
}

function buildState(rows, capturedAt) {
  return {
    updatedAt: capturedAt,
    currentPeriodId: PERIOD_ID,
    sourceUrl: SOURCE_URL,
    periods: [{
      periodId: PERIOD_ID,
      periodLabel: PERIOD_LABEL,
      targetValueInt: 0,
      rows,
    }],
  };
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

async function captureScreenshot() {
  await ensureDir(DEBUG_DIR, true);
  if (process.env.WEIBO_IOS_SCREENSHOT_PATH) {
    return process.env.WEIBO_IOS_SCREENSHOT_PATH;
  }

  if (process.env.WEIBO_IOS_CAPTURE_CMD) {
    const command = process.env.WEIBO_IOS_CAPTURE_CMD.replace(/\{output\}/g, SCREENSHOT_PATH);
    run("bash", ["-lc", command]);
    return SCREENSHOT_PATH;
  }

  if (!commandExists("idevicescreenshot")) {
    throw new Error([
      "缺少 iPhone 截屏工具 idevicescreenshot。",
      "安装：brew install libimobiledevice",
      "然后用 USB 连接 iPhone、点 Trust，并把微博 App 停在活动榜单页。",
      "也可以用 WEIBO_IOS_SCREENSHOT_PATH=/path/to/screenshot.png 指定一张测试截图。",
    ].join(" "));
  }

  run("idevicescreenshot", [SCREENSHOT_PATH]);
  return SCREENSHOT_PATH;
}

async function ocrImage(imagePath) {
  if (!commandExists("tesseract")) {
    throw new Error([
      "缺少 OCR 工具 tesseract。",
      "安装：brew install tesseract tesseract-lang",
      "安装后重跑 npm run weibo:ios:collect。",
    ].join(" "));
  }
  const lang = process.env.WEIBO_IOS_OCR_LANG || "chi_sim+eng";
  const psm = process.env.WEIBO_IOS_OCR_PSM || "6";
  const text = run("tesseract", [imagePath, "stdout", "-l", lang, "--psm", psm], { encoding: "utf8" });
  await fs.writeFile(path.join(DEBUG_DIR, "last-ocr.txt"), text);
  return text;
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

  const imagePath = await captureScreenshot();
  const text = await ocrImage(imagePath);
  const rows = extractRowsFromOcr(text);
  if (rows.length < 2) {
    await fs.writeFile(path.join(DEBUG_DIR, "last-error.txt"), "OCR did not find enough vote rows.\n");
    throw new Error(`OCR 没有识别到足够的推荐值行。请查看 ${path.relative(ROOT, DEBUG_DIR)}/last-ocr.txt 和截图。`);
  }

  const capturedAt = minuteIso();
  const state = buildState(rows, capturedAt);
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
    imagePath,
    rows: snapshot.rows.length,
    localSnapshots: localCount,
    worker: upload,
  }, null, 2));
  return { ok: true, state, snapshot };
}

async function watch() {
  console.log(`iPhone 微博舞台推荐 OCR 监控已启动：每 ${Math.round(INTERVAL_MS / 1000)} 秒采集一次`);
  console.log("请保持 iPhone 解锁，并停在微博 App 活动榜单页。");
  console.log(`采集开关：${COLLECTION_ENABLED ? "开" : "关"}`);
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
  if (command === "collect") return collectOnce();
  if (command === "watch") return watch();
  console.log([
    "Usage:",
    "  npm run weibo:ios:collect  # 从连接的 iPhone 截图 OCR 采集一次",
    "  npm run weibo:ios:watch    # 每分钟循环采集",
    "",
    "Setup:",
    "  brew install libimobiledevice tesseract tesseract-lang",
    "",
    "Env:",
    "  WEIBO_STAGE_COLLECTION_ENABLED=true",
    "  WEIBO_STAGE_COLLECT_TOKEN=<Cloudflare COLLECT_TOKEN>",
    "  WEIBO_IOS_SCREENSHOT_PATH=/path/to/test.png",
  ].join("\n"));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
