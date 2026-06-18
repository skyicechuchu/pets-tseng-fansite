#!/usr/bin/env node

const fs = require("fs/promises");
const fsSync = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
function loadLocalEnv() {
  const file = path.join(ROOT, ".env.local");
  if (!fsSync.existsSync(file)) return;
  const text = fsSync.readFileSync(file, "utf8");
  text.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] != null) return;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  });
}

loadLocalEnv();

const HISTORY_PATH = process.env.WEIBO_STAGE_HISTORY_PATH || path.join(ROOT, "data/weibo-stage-history.json");
const DEBUG_DIR = process.env.WEIBO_ANDROID_DEBUG_DIR || path.join(ROOT, "tmp/weibo-android");
const SCREENSHOT_PATH = process.env.WEIBO_ANDROID_SCREENSHOT_PATH || path.join(DEBUG_DIR, "latest.png");
const WEB_STAGE_URL = process.env.WEIBO_STAGE_WEB_URL || "https://wbox.h5.weibo.cn/l331zrkexk?id=l331zrkexk&cid=1334";
const SOURCE_URL = process.env.WEIBO_STAGE_URL || `sinaweibo://browser?url=${encodeURIComponent(WEB_STAGE_URL)}`;
const TARGET_NAME = process.env.WEIBO_STAGE_TARGET_NAME || "曾沛慈";
const PERIOD_ID = Number(process.env.WEIBO_STAGE_PERIOD_ID || 20260618);
const PERIOD_LABEL = process.env.WEIBO_STAGE_PERIOD_LABEL || "五公舞台推荐";
const MAX_SNAPSHOTS = Number(process.env.WEIBO_STAGE_MAX_SNAPSHOTS || 10080);
const INTERVAL_MS = Number(process.env.WEIBO_STAGE_INTERVAL_MS || 300000);
const ADB_SERIAL = process.env.ADB_SERIAL || "";
const SCROLL_PAGES = Math.max(1, Number(process.env.WEIBO_ANDROID_SCROLL_PAGES || 3));
const SCROLL_SETTLE_MS = Math.max(300, Number(process.env.WEIBO_ANDROID_SCROLL_SETTLE_MS || 1200));
const KNOWN_TITLES = (process.env.WEIBO_STAGE_TITLES || "心引力,那时雨,CAMERA READY,讨厌,1987我不知会遇见你,怎么说我不爱你,猜不透,梦一场,独家记忆,一直很安静")
  .split(",")
  .map(value => value.trim())
  .filter(Boolean);
const DEFAULT_TAB_TITLES = {
  group: ["心引力", "那时雨", "CAMERA READY", "讨厌", "1987我不知会遇见你"],
  collab: ["怎么说我不爱你", "猜不透", "梦一场", "独家记忆", "一直很安静"],
};
const STAGE_TABS = (process.env.WEIBO_STAGE_TABS || [
  "group|团秀|2026061801|五公团秀舞台推荐|300|720",
  "collab|合作秀|2026061802|五公合作秀舞台推荐|795|720",
].join(";"))
  .split(";")
  .map(value => value.trim())
  .filter(Boolean)
  .map(value => {
    const [key, tabLabel, periodId, periodLabel, tapX, tapY, titles] = value.split("|");
    const tabKey = key || String(periodId || PERIOD_ID);
    return {
      key: tabKey,
      tabLabel: tabLabel || "",
      periodId: Number(periodId || PERIOD_ID),
      periodLabel: periodLabel || PERIOD_LABEL,
      tapX: Number(tapX || 300),
      tapY: Number(tapY || 720),
      titles: (titles ? titles.split(",") : DEFAULT_TAB_TITLES[tabKey] || [])
        .map(item => item.trim())
        .filter(Boolean),
    };
  });

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

function adbArgs(args) {
  return ADB_SERIAL ? ["-s", ADB_SERIAL].concat(args) : args;
}

function run(cmd, args, options) {
  const result = spawnSync(cmd, args, Object.assign({ encoding: "utf8" }, options || {}));
  if (result.status !== 0) {
    const stderr = result.stderr || result.stdout || "";
    throw new Error(`${cmd} ${args.join(" ")} failed: ${stderr.trim()}`);
  }
  return result.stdout || "";
}

function runBuffer(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: "buffer", maxBuffer: 25 * 1024 * 1024 });
  if (result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString("utf8") : "";
    throw new Error(`${cmd} ${args.join(" ")} failed: ${stderr.trim()}`);
  }
  return result.stdout;
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

function normalizeTitle(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "");
}

function knownTitleFromLine(line) {
  const normalized = normalizeTitle(line);
  if (!normalized) return "";
  let best = "";
  let bestScore = 0;
  KNOWN_TITLES.forEach(title => {
    const known = normalizeTitle(title);
    if (!known) return;
    if (normalized.includes(known) || known.includes(normalized)) {
      const score = Math.min(normalized.length, known.length) + 10;
      if (score > bestScore) {
        best = title;
        bestScore = score;
      }
      return;
    }
    const knownChars = Array.from(new Set(Array.from(known)));
    const overlap = knownChars.filter(ch => normalized.includes(ch)).length;
    const minOverlap = known.length <= 3 ? 2 : Math.ceil(knownChars.length * 0.55);
    if (overlap >= minOverlap && overlap > bestScore) {
      best = title;
      bestScore = overlap;
    }
  });
  return best;
}

function isNameLine(line) {
  if (!line || line.length > 50) return false;
  if (/推荐|投送|规则|进入|搜索|活动|分享|打开|微博|客户端|榜单|推荐值|推荐数|票数|助力值|剩余|次数|团秀|合作秀|五公|奥利奥|好吃|好玩|点击|任务|到底|登录|扫码|芒果|乘风/.test(line)) return false;
  if (/^\d{1,2}:\d{2}/.test(line) || /\b[345]G\b/i.test(line)) return false;
  if (/^[#\d\s.、\-:：]+$/.test(line)) return false;
  const chinese = (line.match(/[\u4e00-\u9fa5]/g) || []).length;
  const letters = (line.match(/[A-Za-z]/g) || []).length;
  const symbols = (line.match(/[^\u4e00-\u9fa5A-Za-z0-9\s]/g) || []).length;
  if (symbols > Math.max(2, Math.floor(line.length / 3))) return false;
  return chinese >= 2 || letters >= 3;
}

function previousNameLine(lines, index) {
  for (let i = index - 1; i >= Math.max(0, index - 10); i -= 1) {
    const knownTitle = knownTitleFromLine(lines[i]);
    if (knownTitle) return knownTitle;
  }
  for (let i = index - 1; i >= Math.max(0, index - 10); i -= 1) {
    if (isNameLine(lines[i])) return lines[i].replace(/^#?\d+[\s.、-]*/, "").trim();
  }
  return "";
}

function makeOcrRow(title, value, period, index) {
  const canonicalTitle = knownTitleFromLine(title) || cleanLine(title).replace(/^#?\d+[\s.、-]*/, "").trim();
  if (!canonicalTitle || value == null) return null;
  const key = stableKey(canonicalTitle);
  if (!key) return null;
  const periodId = Number(period && period.periodId || PERIOD_ID);
  const periodLabel = period && period.periodLabel || PERIOD_LABEL;
  return {
    key: `${periodId}:${key}`,
    periodId,
    periodLabel,
    title: canonicalTitle,
    guest: "",
    rank: index + 1,
    interactionValue: value,
    roundAmount: 0,
    onScreenCount: 0,
    isTarget: canonicalTitle.includes(TARGET_NAME),
    coverId: key,
    source: "android-ocr",
  };
}

function valueSeriesFromOcr(text) {
  const pages = String(text || "").split(/\n--- [^-]+ page \d+ ---\n/).filter(Boolean);
  const values = [];
  pages.forEach(page => {
    const pageValues = [];
    page.split(/\n+/).forEach(line => {
      const match = cleanLine(line).match(/(?:推荐值|推荐数|投送值|票数|助力值)\s*([0-9][0-9,，.]*\s*(?:万|w|W|亿)?)/);
      if (match) pageValues.push(parseNumber(match[1]));
    });
    pageValues.filter(value => value != null).forEach((value, index) => {
      if (index === 0 && values.length && values[values.length - 1] === value) return;
      values.push(value);
    });
  });
  return values;
}

function rowsFromKnownOrder(text, period) {
  const titles = period && period.titles || [];
  if (!titles.length) return [];
  const values = valueSeriesFromOcr(text);
  if (values.length < titles.length) return [];
  return titles.map((title, index) => makeOcrRow(title, values[index], period, index)).filter(Boolean);
}

function extractRowsFromOcr(text, period) {
  const periodId = Number(period && period.periodId || PERIOD_ID);
  const periodLabel = period && period.periodLabel || PERIOD_LABEL;
  const lines = String(text || "")
    .split(/\n+/)
    .map(cleanLine)
    .filter(Boolean);
  const rows = [];
  const seen = new Set();

  function addRow(title, value, rawIndex) {
    const row = makeOcrRow(title, value, period, rows.length);
    if (!row) return;
    const key = row.coverId;
    if (!key || seen.has(key)) return;
    seen.add(key);
    rows.push(Object.assign({}, row, { rawIndex }));
  }

  lines.forEach((line, index) => {
    let match = line.match(/^(.{1,48}?)[\s:：]*(?:推荐值|推荐数|投送值|票数|助力值)[\s:：]*([0-9][0-9,，.]*\s*(?:万|w|W|亿)?)/);
    if (match) {
      const inlineTitle = isNameLine(match[1]) ? match[1] : previousNameLine(lines, index);
      addRow(inlineTitle, parseNumber(match[2]), index);
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

    if (/^[0-9][0-9,，.]*\s*(?:万|w|W|亿)$/.test(line)) {
      const prev = previousNameLine(lines, index);
      if (prev) addRow(prev, parseNumber(line), index);
    }
  });

  return rows
    .sort((a, b) => b.interactionValue - a.interactionValue || a.rawIndex - b.rawIndex)
    .map((row, index) => Object.assign({}, row, { rank: index + 1 }));
}

function buildState(periods, capturedAt) {
  return {
    updatedAt: capturedAt,
    currentPeriodId: periods[0] ? periods[0].periodId : PERIOD_ID,
    sourceUrl: SOURCE_URL,
    periods,
  };
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
      source: row.source || "android-ocr",
    }));
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

function ensureAdb() {
  if (!commandExists("adb")) {
    throw new Error("缺少 adb。安装：brew install android-platform-tools");
  }
  const devices = run("adb", ["devices"]).split("\n").slice(1).map(line => line.trim()).filter(Boolean);
  const ready = devices.filter(line => /\tdevice$/.test(line));
  if (!ready.length) {
    throw new Error("没有可用的 Android 模拟器/设备。请先启动模拟器，并确认 adb devices 显示 device。");
  }
}

function openActivity() {
  ensureAdb();
  const candidates = [
    SOURCE_URL,
    "sinaweibo://browser?url=https%3A%2F%2Fm.weibo.cn%2Fc%2Fwbox%3Fid%3Dl331zrkexk%26cid%3D1334",
    "sinaweibo://wbox?id=l331zrkexk&cid=1334",
  ].filter((value, index, arr) => value && arr.indexOf(value) === index);
  let lastError = null;
  for (const url of candidates) {
    const result = spawnSync("adb", adbArgs(["shell", "am", "start", "-W", "-a", "android.intent.action.VIEW", "-d", url]), { encoding: "utf8" });
    if (result.status === 0 && !/unable to resolve Intent/i.test(`${result.stdout}\n${result.stderr}`)) {
      console.log(`已请求 Android 打开：${url}`);
      return;
    }
    lastError = (result.stderr || result.stdout || "").trim();
  }
  throw new Error(`Android 没有接受微博活动 deep link：${lastError || "unknown error"}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function adbShell(args) {
  ensureAdb();
  return run("adb", adbArgs(["shell"].concat(args)));
}

async function scrollToTop() {
  for (let i = 0; i < 4; i += 1) {
    adbShell(["input", "swipe", "500", "650", "500", "1700", "650"]);
    await sleep(350);
  }
  await sleep(SCROLL_SETTLE_MS);
}

async function scrollDownOnePage() {
  adbShell(["input", "swipe", "500", "1750", "500", "650", "700"]);
  await sleep(SCROLL_SETTLE_MS);
}

async function tapStageTab(tab) {
  if (!tab || !tab.tapX || !tab.tapY) return;
  await scrollToTop();
  adbShell(["input", "tap", String(tab.tapX), String(tab.tapY)]);
  await sleep(SCROLL_SETTLE_MS);
}

async function captureScreenshot() {
  await ensureDir(DEBUG_DIR, true);
  if (process.env.WEIBO_ANDROID_SCREENSHOT_PATH) {
    return process.env.WEIBO_ANDROID_SCREENSHOT_PATH;
  }
  ensureAdb();
  const png = runBuffer("adb", adbArgs(["exec-out", "screencap", "-p"]));
  await fs.writeFile(SCREENSHOT_PATH, png);
  return SCREENSHOT_PATH;
}

async function captureNamedScreenshot(name) {
  await ensureDir(DEBUG_DIR, true);
  ensureAdb();
  const imagePath = path.join(DEBUG_DIR, name);
  const png = runBuffer("adb", adbArgs(["exec-out", "screencap", "-p"]));
  await fs.writeFile(imagePath, png);
  return imagePath;
}

async function ocrImage(imagePath) {
  if (!commandExists("tesseract")) {
    throw new Error("缺少 OCR 工具 tesseract。安装：brew install tesseract tesseract-lang");
  }
  const lang = process.env.WEIBO_ANDROID_OCR_LANG || "chi_sim+eng";
  const psm = process.env.WEIBO_ANDROID_OCR_PSM || "12";
  const text = run("tesseract", [imagePath, "stdout", "-l", lang, "--psm", psm], { encoding: "utf8" });
  await fs.writeFile(path.join(DEBUG_DIR, "last-ocr.txt"), text);
  return text;
}

async function captureAndOcrList(tab) {
  if (process.env.WEIBO_ANDROID_SCREENSHOT_PATH) {
    const imagePath = await captureScreenshot();
    return {
      imagePath,
      text: await ocrImage(imagePath),
    };
  }

  await tapStageTab(tab);
  await scrollToTop();
  const chunks = [];
  let lastImagePath = "";
  for (let page = 0; page < SCROLL_PAGES; page += 1) {
    const prefix = tab && tab.key ? `${tab.key}-` : "";
    const imagePath = await captureNamedScreenshot(`latest-${prefix}page-${page + 1}.png`);
    const text = await ocrImage(imagePath);
    chunks.push(`\n--- ${tab && tab.tabLabel || "page"} page ${page + 1} ---\n${text}`);
    lastImagePath = imagePath;
    if (/到底|别扒拉/.test(text)) break;
    await scrollDownOnePage();
  }
  const combined = chunks.join("\n");
  await fs.writeFile(path.join(DEBUG_DIR, "last-ocr.txt"), combined);
  if (lastImagePath) {
    await fs.copyFile(lastImagePath, SCREENSHOT_PATH);
  }
  return {
    imagePath: SCREENSHOT_PATH,
    text: combined,
  };
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

  const periods = [];
  const captures = [];
  for (const tab of STAGE_TABS) {
    const { imagePath, text } = await captureAndOcrList(tab);
    const orderedRows = rowsFromKnownOrder(text, tab);
    const rows = orderedRows.length ? orderedRows : extractRowsFromOcr(text, tab);
    if (rows.length < 2) {
      await fs.writeFile(path.join(DEBUG_DIR, "last-error.txt"), `${tab.tabLabel || tab.key} OCR did not find enough vote rows.\n`);
      throw new Error(`${tab.tabLabel || tab.key} OCR 没有识别到足够的推荐值行。请查看 ${path.relative(ROOT, DEBUG_DIR)}/latest.png 和 last-ocr.txt。`);
    }
    periods.push({
      periodId: tab.periodId,
      periodLabel: tab.periodLabel,
      targetValueInt: 0,
      rows,
    });
    captures.push({ tab: tab.key, imagePath, rows: rows.length });
  }

  const totalRows = periods.reduce((sum, period) => sum + period.rows.length, 0);
  if (totalRows < 2) {
    await fs.writeFile(path.join(DEBUG_DIR, "last-error.txt"), "OCR did not find enough vote rows.\n");
    throw new Error(`OCR 没有识别到足够的推荐值行。请查看 ${path.relative(ROOT, DEBUG_DIR)}/latest.png 和 last-ocr.txt。`);
  }

  const capturedAt = minuteIso();
  const state = buildState(periods, capturedAt);
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
    imagePath: captures[captures.length - 1] && captures[captures.length - 1].imagePath || SCREENSHOT_PATH,
    captures,
    rows: snapshot.rows.length,
    localSnapshots: localCount,
    worker: upload,
  }, null, 2));
  return { ok: true, state, snapshot };
}

async function watch() {
  console.log(`Android 微博舞台推荐 OCR 监控已启动：每 ${Math.round(INTERVAL_MS / 1000)} 秒采集一次`);
  console.log("请保持模拟器打开，并停在微博 App 活动榜单页。");
  console.log(`采集开关：${COLLECTION_ENABLED ? "开" : "关"}`);
  for (;;) {
    const startedAt = Date.now();
    try {
      await collectOnce();
    } catch (err) {
      console.error(`[${new Date().toISOString()}] ${err.message}`);
    }
    await sleep(Math.max(1000, INTERVAL_MS - (Date.now() - startedAt)));
  }
}

async function main() {
  const command = process.argv[2] || "collect";
  if (command === "open") return openActivity();
  if (command === "collect") return collectOnce();
  if (command === "watch") return watch();
  console.log([
    "Usage:",
    "  npm run weibo:android:open     # 在 Android 微博 App 打开活动页",
    "  npm run weibo:android:collect  # 从模拟器截图 OCR 采集一次",
    "  npm run weibo:android:watch    # 每 5 分钟循环采集",
    "",
    "Setup:",
    "  brew install android-platform-tools android-commandlinetools openjdk tesseract tesseract-lang",
    "  启动 Android 模拟器，安装并登录微博 App",
    "",
    "Env:",
    "  ADB_SERIAL=emulator-5554",
    "  WEIBO_STAGE_COLLECTION_ENABLED=true",
    "  WEIBO_STAGE_COLLECT_TOKEN=<Cloudflare COLLECT_TOKEN>",
    "  WEIBO_ANDROID_SCREENSHOT_PATH=/path/to/test.png",
  ].join("\n"));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
