#!/usr/bin/env node

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DEBUG_DIR = process.env.WEIBO_HEAT_DEBUG_DIR || path.join(ROOT, "tmp/weibo-heat-android");
const HISTORY_PATH = process.env.WEIBO_HEAT_HISTORY_PATH || path.join(ROOT, "data/weibo-heat-history.json");
const SCREENSHOT_PATH = process.env.WEIBO_HEAT_SCREENSHOT_PATH || path.join(DEBUG_DIR, "latest.png");
const WEB_URL = process.env.WEIBO_HEAT_WEB_URL || "https://wbox.h5.weibo.cn/l331zrkexk?cid=1336&id=l331zrkexk&luicode=40000385&source=wbox&s_channel=4";
const SOURCE_URL = process.env.WEIBO_HEAT_URL || `sinaweibo://browser?url=${encodeURIComponent(WEB_URL)}`;
const TARGET_NAME = process.env.WEIBO_HEAT_TARGET_NAME || "曾沛慈";
const PERIOD_ID = Number(process.env.WEIBO_HEAT_PERIOD_ID || 2026062603);
const PERIOD_LABEL = process.env.WEIBO_HEAT_PERIOD_LABEL || "微博姐姐热度";
const INTERVAL_MS = Number(process.env.WEIBO_HEAT_INTERVAL_MS || 300000);
const MAX_SNAPSHOTS = Number(process.env.WEIBO_HEAT_MAX_SNAPSHOTS || 30 * 24 * 12);
const TOP_N = Math.max(1, Number(process.env.WEIBO_HEAT_TOP_N || 10));
const SCROLL_PAGES = Math.max(2, Number(process.env.WEIBO_HEAT_SCROLL_PAGES || 3));
const OPEN_WAIT_MS = Number(process.env.WEIBO_HEAT_OPEN_WAIT_MS || 22000);
const TAB_WAIT_MS = Number(process.env.WEIBO_HEAT_TAB_WAIT_MS || 14000);
const SCROLL_SETTLE_MS = Number(process.env.WEIBO_HEAT_SCROLL_SETTLE_MS || 1600);
const ADB_SERIAL = process.env.ADB_SERIAL || "emulator-5554";
const DEFAULT_NAMES = "曾沛慈,李小冉,张月,王濛,乌兰图雅,徐梦洁,陈瑶,安崎,萧蔷,范玮琪";
const HEAT_NAMES = (process.env.WEIBO_HEAT_NAMES || DEFAULT_NAMES)
  .split(",")
  .map(item => item.trim())
  .filter(Boolean);

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, "utf8").split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] != null) return;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  });
}

loadEnvFile(path.join(ROOT, ".env"));
loadEnvFile(path.join(ROOT, ".env.local"));
loadEnvFile(path.join(ROOT, ".env.weibo-heat"));

function readText(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch (err) {
    return "";
  }
}

function readDefaultWorkerBase() {
  const text = readText(path.join(ROOT, "data.v2.js"));
  const match = text.match(/workerApiBase:\s*"([^"]*)"/);
  return match ? match[1] : "";
}

function readCollectionSwitch() {
  const text = readText(path.join(ROOT, "data.v2.js"));
  const block = text.match(/weiboHeat:\s*\{([\s\S]*?)\n\s*\},/);
  if (!block) return true;
  const match = block[1].match(/collectionEnabled:\s*(true|false)/);
  return match ? match[1] === "true" : true;
}

const WORKER_API_BASE = (process.env.WEIBO_HEAT_WORKER_API_BASE || readDefaultWorkerBase()).replace(/\/$/, "");
const COLLECT_TOKEN = process.env.WEIBO_HEAT_COLLECT_TOKEN || process.env.WEIBO_STAGE_COLLECT_TOKEN || process.env.COLLECT_TOKEN || "";
const COLLECTION_ENABLED = process.env.WEIBO_HEAT_COLLECTION_ENABLED == null
  ? readCollectionSwitch()
  : process.env.WEIBO_HEAT_COLLECTION_ENABLED !== "false";

function run(command, args, options) {
  const result = spawnSync(command, args, Object.assign({ encoding: "utf8" }, options || {}));
  if (result.status !== 0) {
    const message = (result.stderr || result.stdout || "").trim();
    throw new Error(`${command} ${args.join(" ")} failed${message ? `: ${message}` : ""}`);
  }
  return result.stdout || "";
}

function runBuffer(command, args) {
  const result = spawnSync(command, args, { encoding: "buffer", maxBuffer: 30 * 1024 * 1024 });
  if (result.status !== 0) {
    const message = result.stderr ? result.stderr.toString("utf8").trim() : "";
    throw new Error(`${command} ${args.join(" ")} failed${message ? `: ${message}` : ""}`);
  }
  return result.stdout;
}

function commandExists(command) {
  return spawnSync("bash", ["-lc", `command -v ${command}`], { encoding: "utf8" }).status === 0;
}

function adb(args, options) {
  return run("adb", ["-s", ADB_SERIAL].concat(args), options);
}

function adbBuffer(args) {
  return runBuffer("adb", ["-s", ADB_SERIAL].concat(args));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function minuteIso(date = new Date()) {
  const d = new Date(date);
  d.setUTCSeconds(0, 0);
  return d.toISOString();
}

function parseNumber(value) {
  const raw = String(value || "").replace(/,/g, "").trim();
  const match = raw.match(/(\d+(?:\.\d+)?)\s*(w|W|万|亿)?/);
  if (!match) return 0;
  const base = Number(match[1]);
  if (!Number.isFinite(base)) return 0;
  if (match[2] === "亿") return Math.round(base * 100000000);
  if (match[2]) return Math.round(base * 10000);
  return Math.round(base);
}

function stableKey(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "")
    .slice(0, 80);
}

async function ensureDir(fileOrDir, isDir) {
  await fsp.mkdir(isDir ? fileOrDir : path.dirname(fileOrDir), { recursive: true });
}

function screenSize() {
  try {
    const output = adb(["shell", "wm", "size"]);
    const override = output.match(/Override size:\s*(\d+)x(\d+)/);
    const physical = output.match(/Physical size:\s*(\d+)x(\d+)/);
    const match = override || physical;
    if (match) return { width: Number(match[1]), height: Number(match[2]) };
  } catch (err) {
    // Default to the emulator size used during setup.
  }
  return { width: 1080, height: 2400 };
}

function openActivity() {
  adb(["shell", "am", "start", "-W", "-a", "android.intent.action.VIEW", "-d", SOURCE_URL, "com.sina.weibo"]);
  console.log(`已请求 Android 打开微博姐姐热度页：${SOURCE_URL}`);
}

async function tapSisterTab() {
  const size = screenSize();
  const x = Number(process.env.WEIBO_HEAT_SISTER_TAB_X || Math.round(size.width * 0.16));
  const y = Number(process.env.WEIBO_HEAT_SISTER_TAB_Y || Math.round(size.height * 0.30));
  adb(["shell", "input", "tap", String(x), String(y)]);
  await sleep(1800);
  adb(["shell", "input", "tap", String(x), String(y)]);
  await sleep(TAB_WAIT_MS);
}

async function scrollToTop() {
  for (let i = 0; i < 3; i += 1) {
    adb(["shell", "input", "swipe", "520", "820", "520", "1850", "650"]);
    await sleep(350);
  }
  await sleep(SCROLL_SETTLE_MS);
}

async function scrollDown() {
  adb(["shell", "input", "swipe", "520", "1850", "520", "760", "900"]);
  await sleep(SCROLL_SETTLE_MS);
}

async function captureScreenshot(name) {
  await ensureDir(DEBUG_DIR, true);
  const imagePath = name ? path.join(DEBUG_DIR, name) : SCREENSHOT_PATH;
  const png = adbBuffer(["exec-out", "screencap", "-p"]);
  await fsp.writeFile(imagePath, png);
  await fsp.copyFile(imagePath, SCREENSHOT_PATH).catch(() => {});
  return imagePath;
}

async function ocrImage(imagePath) {
  if (!commandExists("tesseract")) {
    throw new Error("缺少 OCR 工具 tesseract。安装：brew install tesseract tesseract-lang");
  }
  const lang = process.env.WEIBO_HEAT_OCR_LANG || "chi_sim+eng";
  const psm = process.env.WEIBO_HEAT_OCR_PSM || "6";
  return run("tesseract", [imagePath, "stdout", "-l", lang, "--psm", psm], { encoding: "utf8" });
}

function extractHeatValues(text) {
  const values = [];
  const matches = String(text || "").matchAll(/(\d+(?:\.\d+)?)\s*(?:w|W|万|亿)\b/g);
  for (const match of matches) {
    const value = parseNumber(match[0]);
    if (value < 100000) continue;
    const prev = values[values.length - 1];
    if (prev === value) continue;
    values.push(value);
  }
  return values;
}

function rowsFromValues(values) {
  return values.slice(0, TOP_N).map((value, index) => {
    const title = HEAT_NAMES[index] || `姐姐 ${index + 1}`;
    return {
      key: `${PERIOD_ID}:${stableKey(title) || index + 1}`,
      periodId: PERIOD_ID,
      periodLabel: PERIOD_LABEL,
      title,
      guest: "",
      rank: index + 1,
      interactionValue: value,
      roundAmount: 0,
      onScreenCount: 0,
      isTarget: title.includes(TARGET_NAME),
      coverId: stableKey(title) || String(index + 1),
      source: "android-ocr",
    };
  });
}

function buildState(rows, capturedAt) {
  return {
    updatedAt: capturedAt,
    currentPeriodId: PERIOD_ID,
    sourceUrl: WEB_URL,
    periods: [{
      periodId: PERIOD_ID,
      periodLabel: PERIOD_LABEL,
      targetValueInt: 0,
      rows,
    }],
  };
}

function stateToSnapshot(state) {
  const rows = [];
  (state.periods || []).forEach(period => {
    (period.rows || []).forEach(row => rows.push(Object.assign({}, row, {
      periodId: Number(period.periodId),
      periodLabel: period.periodLabel,
      rank: Number(row.rank || 0),
      interactionValue: Number(row.interactionValue || 0),
    })));
  });
  return {
    ts: Date.parse(state.updatedAt),
    iso: state.updatedAt,
    currentPeriodId: state.currentPeriodId,
    rows,
  };
}

async function loadHistory() {
  try {
    const raw = await fsp.readFile(HISTORY_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Object.assign({ ok: true, source: "local-weibo-heat", snapshots: [] }, parsed);
  } catch (err) {
    return { ok: true, source: "local-weibo-heat", updatedAt: null, snapshots: [] };
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
    source: "local-weibo-heat",
    updatedAt: snapshot.iso,
    snapshots: snapshots.slice(-MAX_SNAPSHOTS),
  };
  await fsp.writeFile(HISTORY_PATH, `${JSON.stringify(next, null, 2)}\n`);
  return next.snapshots.length;
}

async function uploadToWorker(state) {
  if (!WORKER_API_BASE || !COLLECT_TOKEN) return { skipped: true, reason: "missing_worker_or_token" };
  const res = await fetch(`${WORKER_API_BASE}/admin/weibo-heat/ingest`, {
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
  if (!res.ok || json.ok === false) throw new Error(json.error || `Worker HTTP ${res.status}`);
  return json;
}

async function collectOnce(options) {
  if (!COLLECTION_ENABLED) {
    console.log(JSON.stringify({ ok: true, skipped: true, reason: "weibo_heat_collection_disabled" }, null, 2));
    return { ok: true, skipped: true };
  }
  if (options.open) {
    openActivity();
    await sleep(OPEN_WAIT_MS);
  }

  let texts = [];
  let values = [];
  let lastCombined = "";
  const attempts = Math.max(1, Number(process.env.WEIBO_HEAT_ATTEMPTS || 3));
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    await tapSisterTab();
    await scrollToTop();

    texts = [];
    for (let page = 0; page < SCROLL_PAGES; page += 1) {
      const imagePath = await captureScreenshot(`heat-page-${page + 1}.png`);
      const text = await ocrImage(imagePath);
      texts.push(`\n--- page ${page + 1} ---\n${text}`);
      if (page < SCROLL_PAGES - 1) await scrollDown();
    }
    lastCombined = texts.join("\n");
    await fsp.writeFile(path.join(DEBUG_DIR, "last-ocr.txt"), lastCombined);
    values = [];
    texts.forEach(text => {
      extractHeatValues(text).forEach(value => {
        if (!values.includes(value)) values.push(value);
      });
    });
    const likelySisterTab = values[0] && values[0] >= 1000000;
    if (likelySisterTab && values.length >= TOP_N) break;
    if (attempt < attempts) {
      console.log(`姐姐热度 tab 暂未识别稳定，重试 ${attempt + 1}/${attempts}...`);
      if (options.open) {
        openActivity();
        await sleep(Math.max(8000, Math.floor(OPEN_WAIT_MS / 2)));
      }
    }
  }
  const rows = rowsFromValues(values);
  if (rows.length < TOP_N) {
    await fsp.writeFile(path.join(DEBUG_DIR, "last-error.txt"), `识别到 ${rows.length} 行：${values.join(", ")}\n\n${lastCombined}`);
    throw new Error(`微博姐姐热度 OCR 只识别到 ${rows.length} 行。请查看 ${path.relative(ROOT, DEBUG_DIR)}/heat-page-1.png、heat-page-2.png 和 last-ocr.txt。`);
  }

  const capturedAt = minuteIso();
  const state = buildState(rows, capturedAt);
  const snapshot = stateToSnapshot(state);
  const localSnapshots = await appendLocalHistory(snapshot);
  let worker = { skipped: true };
  if (!options.dryRun) worker = await uploadToWorker(state);
  console.log(JSON.stringify({
    ok: true,
    capturedAt,
    rows: rows.length,
    top: rows[0] && { title: rows[0].title, value: rows[0].interactionValue },
    localSnapshots,
    worker,
  }, null, 2));
  return { ok: true, state, snapshot };
}

async function watch(options) {
  console.log(`微博姐姐热度 Top ${TOP_N} OCR 监控已启动：每 ${Math.round(INTERVAL_MS / 60000)} 分钟采集一次`);
  for (;;) {
    const started = Date.now();
    try {
      await collectOnce(options);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] ${err.message || err}`);
    }
    await sleep(Math.max(1000, INTERVAL_MS - (Date.now() - started)));
  }
}

async function main() {
  const command = process.argv[2] || "collect";
  const options = {
    dryRun: process.argv.includes("--dry-run"),
    open: process.argv.includes("--open") || process.env.WEIBO_HEAT_OPEN === "true",
  };
  if (command === "open") return openActivity();
  if (command === "collect") return collectOnce(options);
  if (command === "watch") return watch(options);
  console.log([
    "Usage:",
    "  npm run weibo:heat:android:open",
    "  npm run weibo:heat:android:collect -- --dry-run --open",
    "  npm run weibo:heat:android:watch -- --open",
  ].join("\n"));
}

main().catch(err => {
  console.error(err && err.stack || err);
  process.exitCode = 1;
});
