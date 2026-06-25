#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data.v2.js");
const DEBUG_DIR = process.env.WEIBO_SUPERLIKE_DEBUG_DIR || path.join(ROOT, "tmp/weibo-superlike");
const SCREENSHOT_PATH = process.env.WEIBO_SUPERLIKE_ANDROID_SCREENSHOT_PATH || path.join(DEBUG_DIR, "android-superlike.png");
const ADB_SERIAL = process.env.ADB_SERIAL || "emulator-5554";
const DEFAULT_PAGE_ID = "1008081a9bfa740ec7181f9ce077ab08e96746";
const DEFAULT_REFRESH_MS = 5 * 60 * 1000;
const DEFAULT_TAG_Y = 420;

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
loadEnvFile(path.join(ROOT, ".env.weibo-superlike"));

function loadSiteConfig() {
  const code = fs.readFileSync(DATA_FILE, "utf8");
  return vm.runInNewContext(`${code}\nSITE;`, { console });
}

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

function adb(args, options) {
  return run("adb", ["-s", ADB_SERIAL].concat(args), options);
}

function adbBuffer(args) {
  return runBuffer("adb", ["-s", ADB_SERIAL].concat(args));
}

function pageScheme(site) {
  const cfg = site.campaign && site.campaign.weiboSuperlike || {};
  const pageId = process.env.WEIBO_SUPERLIKE_PAGE_ID || cfg.pageId || DEFAULT_PAGE_ID;
  return process.env.WEIBO_SUPERLIKE_ANDROID_SCHEME ||
    `sinaweibo://pageinfo?containerid=${pageId}`;
}

function refreshMs(site) {
  return Number(
    process.env.WEIBO_SUPERLIKE_REFRESH_MS ||
    site.campaign && site.campaign.weiboSuperlike && site.campaign.weiboSuperlike.refreshMs ||
    DEFAULT_REFRESH_MS
  );
}

function nextDelay(ms) {
  const now = Date.now();
  const delay = ms - (now % ms);
  return delay < 1000 ? delay + ms : delay;
}

function captureScreenshot() {
  fs.mkdirSync(path.dirname(SCREENSHOT_PATH), { recursive: true });
  const png = adbBuffer(["exec-out", "screencap", "-p"]);
  fs.writeFileSync(SCREENSHOT_PATH, png);
  return SCREENSHOT_PATH;
}

function openPage(site) {
  const scheme = pageScheme(site);
  adb(["shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", scheme, "com.sina.weibo"]);
  console.log(`Opened Weibo super topic: ${scheme}`);
}

function swipeTagStrip() {
  const y = Number(process.env.WEIBO_SUPERLIKE_ANDROID_TAG_Y || DEFAULT_TAG_Y);
  adb(["shell", "input", "swipe", "900", String(y), "180", String(y), "350"]);
}

function runCollector(options) {
  const args = [path.join(__dirname, "weibo-superlike-monitor.js"), "collect"];
  if (options.dryRun) args.push("--dry-run");
  const env = Object.assign({}, process.env, {
    WEIBO_SUPERLIKE_SCREENSHOT_PATH: SCREENSHOT_PATH,
    WEIBO_SUPERLIKE_SKIP_BROWSER: "true",
  });
  return spawnSync(process.execPath, args, {
    cwd: ROOT,
    env,
    stdio: "inherit",
  }).status === 0;
}

function collectOnce(options) {
  const attempts = Math.max(1, Number(process.env.WEIBO_SUPERLIKE_ANDROID_ATTEMPTS || 4));
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    captureScreenshot();
    console.log(`[${new Date().toISOString()}] OCR attempt ${attempt}/${attempts}: ${path.relative(ROOT, SCREENSHOT_PATH)}`);
    if (runCollector(options)) return true;
    if (attempt < attempts) {
      console.log("SuperLIKE tag was not readable. Swiping the banner tag strip and retrying...");
      swipeTagStrip();
    }
  }
  return false;
}

async function watch(options) {
  const site = loadSiteConfig();
  const ms = refreshMs(site);
  if (options.open) {
    openPage(site);
    await new Promise(resolve => setTimeout(resolve, Number(process.env.WEIBO_SUPERLIKE_ANDROID_OPEN_WAIT_MS || 8000)));
  }
  console.log(`Android OCR superLIKE monitor started: every ${Math.round(ms / 60000)} minutes`);
  const loop = () => {
    try {
      const ok = collectOnce(options);
      if (!ok) console.error(`[${new Date().toISOString()}] OCR failed after all attempts.`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] ${err.message || err}`);
    }
    setTimeout(loop, nextDelay(ms));
  };
  loop();
}

async function main() {
  const mode = process.argv[2] || "collect";
  const options = {
    dryRun: process.argv.includes("--dry-run"),
    open: process.argv.includes("--open") || process.env.WEIBO_SUPERLIKE_ANDROID_OPEN === "true",
  };
  const site = loadSiteConfig();
  if (mode === "open") return openPage(site);
  if (mode === "collect") {
    if (options.open) {
      openPage(site);
      await new Promise(resolve => setTimeout(resolve, Number(process.env.WEIBO_SUPERLIKE_ANDROID_OPEN_WAIT_MS || 8000)));
    }
    const ok = collectOnce(options);
    if (!ok) process.exitCode = 1;
    return;
  }
  if (mode === "watch") return watch(options);
  console.error("Usage: node scripts/weibo-superlike-android-ocr.js open|collect|watch [--dry-run] [--open]");
  process.exit(1);
}

main().catch(err => {
  console.error(err && err.stack || err);
  process.exit(1);
});
