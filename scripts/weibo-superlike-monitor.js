#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const childProcess = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data.v2.js");
const PROFILE_DIR = process.env.WEIBO_SUPERLIKE_PROFILE_DIR || path.join(ROOT, ".auth/weibo-stage-profile");
const HISTORY_PATH = process.env.WEIBO_SUPERLIKE_HISTORY_PATH || path.join(ROOT, "data/weibo-superlike-history.json");
const DEBUG_DIR = process.env.WEIBO_SUPERLIKE_DEBUG_DIR || path.join(ROOT, "tmp/weibo-superlike");
const PERIOD_ID = 20260626;
const PERIOD_LABEL = "曾沛慈超话";
const DEFAULT_PAGE_ID = "1008081a9bfa740ec7181f9ce077ab08e96746";
const DEFAULT_TOPIC_ID = `1022:${DEFAULT_PAGE_ID}`;
const DEFAULT_TAG_ID = "5294454512156724";
const DEFAULT_REFRESH_MS = 5 * 60 * 1000;
const MAX_SNAPSHOTS = 30 * 24 * 12;

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
loadEnvFile(path.join(ROOT, ".env.weibo-superlike"));

function loadSiteConfig() {
  const code = fs.readFileSync(DATA_FILE, "utf8");
  return vm.runInNewContext(`${code}\nSITE;`, { console });
}

function workerApiBase(site) {
  return String(
    process.env.WEIBO_SUPERLIKE_WORKER_API_BASE ||
    site.campaign && site.campaign.mgtv && site.campaign.mgtv.workerApiBase ||
    ""
  ).replace(/\/$/, "");
}

function collectToken() {
  return process.env.WEIBO_SUPERLIKE_COLLECT_TOKEN || process.env.WEIBO_STAGE_COLLECT_TOKEN || process.env.COLLECT_TOKEN || "";
}

function minuteBucket(date = new Date()) {
  const d = new Date(date);
  d.setUTCSeconds(0, 0);
  return d.toISOString();
}

function parseMetricNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value) : 0;
  const text = String(value || "").replace(/,/g, "").trim();
  const match = text.match(/([\d.]+)\s*(亿|万)?/);
  if (!match) return 0;
  const base = Number(match[1]);
  if (!Number.isFinite(base)) return 0;
  if (match[2] === "亿") return Math.round(base * 100000000);
  if (match[2] === "万") return Math.round(base * 10000);
  return Math.round(base);
}

function commandExists(command) {
  try {
    childProcess.execFileSync("which", [command], { stdio: "ignore" });
    return true;
  } catch (err) {
    return false;
  }
}

function run(command, args, options) {
  return childProcess.execFileSync(command, args, Object.assign({ encoding: "utf8" }, options || {}));
}

async function ocrImage(imagePath) {
  if (!commandExists("tesseract")) {
    throw new Error("缺少 OCR 工具 tesseract。安装：brew install tesseract tesseract-lang");
  }
  await fs.promises.mkdir(DEBUG_DIR, { recursive: true });
  const lang = process.env.WEIBO_SUPERLIKE_OCR_LANG || "chi_sim+eng";
  const psm = process.env.WEIBO_SUPERLIKE_OCR_PSM || "6";
  const text = run("tesseract", [imagePath, "stdout", "-l", lang, "--psm", psm]);
  await fs.promises.writeFile(path.join(DEBUG_DIR, "last-ocr.txt"), text);
  return text;
}

function extractSuperLikeCount(text) {
  const normalized = String(text || "")
    .replace(/[Ｌｌ]/g, "L")
    .replace(/[Ｉｉ]/g, "I")
    .replace(/[Ｋｋ]/g, "K")
    .replace(/[Ｅｅ]/g, "E")
    .replace(/[\u00a0\u2000-\u200b]/g, " ");
  const minCount = Number(process.env.WEIBO_SUPERLIKE_MIN_COUNT || 1000);
  const numberToken = "([\\d,]+(?:\\.\\d+)?\\s*(?:万|亿)?)";
  const patterns = [
    new RegExp(`(?:超\\s*)?(?:LIKE|L1KE|I[I1]KE|[A-Z]{1,4}\\s*LIKE)\\s*[:：]?\\s*${numberToken}(?:\\s*人)?`, "ig"),
    new RegExp(`${numberToken}\\s*(?:人)?\\s*(?:超\\s*)?(?:LIKE|L1KE|I[I1]KE)`, "ig"),
  ];
  const candidates = [];

  normalized.split(/\r?\n/).forEach(line => {
    const compactLine = line.replace(/\s+/g, " ").trim();
    if (!/LIKE|L1KE|I[I1]KE/i.test(compactLine)) return;
    patterns.forEach(pattern => {
      pattern.lastIndex = 0;
      let match = pattern.exec(compactLine);
      while (match) {
        const value = parseMetricNumber(match[1]);
        if (value) {
          candidates.push({
            value,
            text: match[0],
            hasPersonSuffix: /人/.test(match[0]),
            hasSuperPrefix: /超/.test(match[0]),
            index: match.index,
          });
        }
        match = pattern.exec(compactLine);
      }
    });
  });

  const usable = candidates.filter(candidate => !Number.isFinite(minCount) || candidate.value >= minCount);
  const pool = usable.length ? usable : candidates;
  pool.sort((a, b) => (
    Number(b.hasPersonSuffix) - Number(a.hasPersonSuffix) ||
    Number(b.hasSuperPrefix) - Number(a.hasSuperPrefix) ||
    b.value - a.value ||
    a.index - b.index
  ));
  return pool[0] ? { value: pool[0].value, text: pool[0].text } : { value: 0, text: "" };
}

function superLikeLabel(value) {
  return `超LIKE${Math.round(Number(value || 0))}人`;
}

function stateToSnapshot(state) {
  const period = state.periods[0];
  const row = period.rows[0];
  return {
    iso: state.updatedAt,
    ts: Date.parse(state.updatedAt),
    currentPeriodId: state.currentPeriodId,
    sourceUrl: state.sourceUrl,
    rows: [{
      key: row.key,
      periodId: period.periodId,
      periodLabel: period.periodLabel,
      title: row.title,
      guest: row.guest,
      rank: row.rank,
      interactionValue: row.interactionValue,
      isTarget: row.isTarget,
      superLikeCount: row.superLikeCount,
      labelText: row.labelText,
    }],
  };
}

async function loadHistory() {
  try {
    const raw = await fs.promises.readFile(HISTORY_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Object.assign({ ok: true, source: "local-weibo-superlike", snapshots: [] }, parsed);
  } catch (err) {
    return { ok: true, source: "local-weibo-superlike", updatedAt: null, snapshots: [] };
  }
}

async function appendLocalHistory(snapshot) {
  await fs.promises.mkdir(path.dirname(HISTORY_PATH), { recursive: true });
  const history = await loadHistory();
  const snapshots = Array.isArray(history.snapshots) ? history.snapshots : [];
  const last = snapshots[snapshots.length - 1];
  if (last && last.iso === snapshot.iso) snapshots[snapshots.length - 1] = snapshot;
  else snapshots.push(snapshot);
  const next = {
    ok: true,
    source: "local-weibo-superlike",
    updatedAt: snapshot.iso,
    snapshots: snapshots.slice(-MAX_SNAPSHOTS),
  };
  await fs.promises.writeFile(HISTORY_PATH, JSON.stringify(next, null, 2));
  return next.snapshots.length;
}

async function uploadState(site, state) {
  const base = workerApiBase(site);
  if (!base) throw new Error("Worker API base is not configured");
  const token = collectToken();
  if (!token) throw new Error("Set WEIBO_SUPERLIKE_COLLECT_TOKEN, WEIBO_STAGE_COLLECT_TOKEN, or COLLECT_TOKEN before uploading");
  const res = await fetch(`${base}/admin/weibo-superlike/ingest`, {
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

async function collectBrowserText(config, options) {
  const pageId = process.env.WEIBO_SUPERLIKE_PAGE_ID || config.pageId || DEFAULT_PAGE_ID;
  const sourceUrl = process.env.WEIBO_SUPERLIKE_SOURCE_URL || config.sourceUrl || `https://weibo.com/p/${pageId}`;
  const headless = options.headed ? false : process.env.WEIBO_SUPERLIKE_HEADLESS !== "false";
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const responseTexts = [];

  page.on("response", async response => {
    const url = response.url();
    if (!/weibo|sina|huati/.test(url)) return;
    const contentType = response.headers()["content-type"] || "";
    if (!/json|text|html/.test(contentType)) return;
    try {
      const body = await response.text();
      if (/超\s*(?:LIKE|Like|like)/.test(body)) {
        responseTexts.push(body);
      }
    } catch (err) {
      // Some responses are streams or already consumed by the browser.
    }
  });

  try {
    await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(Number(process.env.WEIBO_SUPERLIKE_WAIT_MS || 8000));
    const bodyText = await page.locator("body").innerText().catch(() => "");
    const html = await page.content().catch(() => "");
    return {
      pageUrl: page.url(),
      text: [bodyText, html, ...responseTexts].join("\n\n"),
    };
  } finally {
    await context.close();
  }
}

async function collectState(site, options) {
  const cfg = site.campaign && site.campaign.weiboSuperlike || {};
  const pageId = process.env.WEIBO_SUPERLIKE_PAGE_ID || cfg.pageId || DEFAULT_PAGE_ID;
  const topicId = process.env.WEIBO_SUPERLIKE_TOPIC_ID || cfg.topicId || DEFAULT_TOPIC_ID;
  const tagId = process.env.WEIBO_SUPERLIKE_TAG_ID || cfg.tagId || DEFAULT_TAG_ID;
  const manualCount = parseMetricNumber(process.env.WEIBO_SUPERLIKE_COUNT || "");
  const screenshotPath = process.env.WEIBO_SUPERLIKE_SCREENSHOT_PATH || "";
  const useBrowserText = process.env.WEIBO_SUPERLIKE_BROWSER_TEXT === "true" || (!screenshotPath && process.env.WEIBO_SUPERLIKE_SKIP_BROWSER !== "true");

  let pageUrl = cfg.sourceUrl || `https://weibo.com/p/${pageId}`;
  let combined = "";
  let countInfo = { value: manualCount, text: manualCount ? superLikeLabel(manualCount) : "" };
  if (!manualCount) {
    if (useBrowserText) {
      const collected = await collectBrowserText(Object.assign({}, cfg, { pageId }), options);
      pageUrl = collected.pageUrl || pageUrl;
      combined = collected.text || "";
    }
    if (screenshotPath) {
      combined += `\n\n${await ocrImage(screenshotPath)}`;
    }
    countInfo = extractSuperLikeCount(combined);
  }

  if (!countInfo.value) {
    await fs.promises.mkdir(DEBUG_DIR, { recursive: true });
    const debugPath = path.join(DEBUG_DIR, "last-superlike-text.txt");
    await fs.promises.writeFile(debugPath, combined.slice(0, 200000));
    throw new Error(`未找到形如“超LIKE13097人”的人数文本。已保存调试文本：${path.relative(ROOT, debugPath)}`);
  }

  const updatedAt = minuteBucket();
  const labelText = superLikeLabel(countInfo.value);
  const state = {
    updatedAt,
    currentPeriodId: PERIOD_ID,
    sourceUrl: cfg.sourceUrl || `https://weibo.com/p/${pageId}`,
    pageUrl,
    pageId,
    topicId,
    tagId,
    topicName: cfg.targetName || "曾沛慈",
    labelText,
    superLikeCount: countInfo.value,
    periods: [{
      periodId: PERIOD_ID,
      periodLabel: PERIOD_LABEL,
      targetValueInt: 0,
      rows: [{
        rank: 1,
        title: "超LIKE人数",
        guest: cfg.targetName || "曾沛慈",
        interactionValue: countInfo.value,
        roundAmount: 0,
        onScreenCount: 0,
        cid: topicId,
        coverId: tagId,
        coverUrl: "",
        isTarget: true,
        key: `${PERIOD_ID}:superlike`,
        periodId: PERIOD_ID,
        periodLabel: PERIOD_LABEL,
        superLikeCount: countInfo.value,
        labelText,
      }],
    }],
  };
  return state;
}

function printSummary(state, localCount, uploadResult) {
  const row = state.periods[0].rows[0];
  console.log(JSON.stringify({
    ok: true,
    updatedAt: state.updatedAt,
    superLikeCount: row.interactionValue,
    labelText: row.labelText,
    localSnapshots: localCount,
    upload: uploadResult && uploadResult.result || null,
  }, null, 2));
}

async function collectOnce(options) {
  const site = loadSiteConfig();
  const state = await collectState(site, options);
  const localCount = await appendLocalHistory(stateToSnapshot(state));
  let uploadResult = null;
  if (!options.dryRun) uploadResult = await uploadState(site, state);
  printSummary(state, localCount, uploadResult);
}

function nextDelay(ms) {
  const now = Date.now();
  const delay = ms - (now % ms);
  return delay < 1000 ? delay + ms : delay;
}

async function watch(options) {
  const site = loadSiteConfig();
  const refreshMs = Number(
    process.env.WEIBO_SUPERLIKE_REFRESH_MS ||
    site.campaign && site.campaign.weiboSuperlike && site.campaign.weiboSuperlike.refreshMs ||
    DEFAULT_REFRESH_MS
  );
  console.log(`Weibo superLIKE monitor started: every ${Math.round(refreshMs / 60000)} minutes`);
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
  const options = {
    dryRun: process.argv.includes("--dry-run"),
    headed: process.argv.includes("--headed"),
  };
  if (mode === "collect") return collectOnce(options);
  if (mode === "watch") return watch(options);
  console.error("Usage: node scripts/weibo-superlike-monitor.js collect|watch [--dry-run] [--headed]");
  process.exit(1);
}

main().catch(err => {
  console.error(err && err.stack || err);
  process.exit(1);
});
