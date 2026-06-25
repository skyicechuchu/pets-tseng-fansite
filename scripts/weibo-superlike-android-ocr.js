#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data.v2.js");
const DEBUG_DIR = process.env.WEIBO_SUPERLIKE_DEBUG_DIR || path.join(ROOT, "tmp/weibo-superlike");
const SCREENSHOT_PATH = process.env.WEIBO_SUPERLIKE_ANDROID_SCREENSHOT_PATH || path.join(DEBUG_DIR, "android-superlike.png");
const CROP_PATH = process.env.WEIBO_SUPERLIKE_ANDROID_CROP_PATH || path.join(DEBUG_DIR, "android-superlike-crop.png");
const ADB_SERIAL = process.env.ADB_SERIAL || "emulator-5554";
const DEFAULT_PAGE_ID = "1008081a9bfa740ec7181f9ce077ab08e96746";
const DEFAULT_TAG_ID = "5294454512156724";
const DEFAULT_REFRESH_MS = 30 * 60 * 1000;
const DEFAULT_TAG_Y = 420;
const DEFAULT_TAG_Y_RATIO = 0.175;
const DEFAULT_CROP = "0.04,0.045,0.92,0.22";

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

function commandExists(command) {
  return spawnSync("bash", ["-lc", `command -v ${command}`], { encoding: "utf8" }).status === 0;
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

function screenSize() {
  try {
    const output = adb(["shell", "wm", "size"]);
    const override = output.match(/Override size:\s*(\d+)x(\d+)/);
    const physical = output.match(/Physical size:\s*(\d+)x(\d+)/);
    const match = override || physical;
    if (match) return { width: Number(match[1]), height: Number(match[2]) };
  } catch (err) {
    // Fall back to full-size emulator defaults below.
  }
  return { width: 1080, height: 2400 };
}

function imageSize(imagePath) {
  const output = run("sips", ["-g", "pixelWidth", "-g", "pixelHeight", imagePath]);
  const widthMatch = output.match(/pixelWidth:\s*(\d+)/);
  const heightMatch = output.match(/pixelHeight:\s*(\d+)/);
  return {
    width: widthMatch ? Number(widthMatch[1]) : 0,
    height: heightMatch ? Number(heightMatch[1]) : 0,
  };
}

function cropSpec(width, height) {
  const raw = process.env.WEIBO_SUPERLIKE_ANDROID_CROP || DEFAULT_CROP;
  if (!raw || /^(false|off|full)$/i.test(raw)) return null;
  const parts = raw.split(",").map(part => Number(part.trim()));
  if (parts.length !== 4 || parts.some(part => !Number.isFinite(part))) return null;
  const [xRaw, yRaw, wRaw, hRaw] = parts;
  const isRatio = parts.every(part => part >= 0 && part <= 1);
  const x = Math.max(0, Math.round(isRatio ? xRaw * width : xRaw));
  const y = Math.max(0, Math.round(isRatio ? yRaw * height : yRaw));
  const cropWidth = Math.max(80, Math.min(width - x, Math.round(isRatio ? wRaw * width : wRaw)));
  const cropHeight = Math.max(80, Math.min(height - y, Math.round(isRatio ? hRaw * height : hRaw)));
  return { x, y, width: cropWidth, height: cropHeight };
}

function cropScreenshot(imagePath) {
  if (!commandExists("sips")) return imagePath;
  const size = imageSize(imagePath);
  if (!size.width || !size.height) return imagePath;
  const crop = cropSpec(size.width, size.height);
  if (!crop) return imagePath;
  run("sips", [
    "-c", String(crop.height), String(crop.width),
    "--cropOffset", String(crop.y), String(crop.x),
    imagePath,
    "--out", CROP_PATH,
  ]);
  return CROP_PATH;
}

function pageScheme(site) {
  return pageSchemes(site)[0];
}

function pageSchemes(site) {
  const cfg = site.campaign && site.campaign.weiboSuperlike || {};
  const pageId = process.env.WEIBO_SUPERLIKE_PAGE_ID || cfg.pageId || DEFAULT_PAGE_ID;
  const tagId = process.env.WEIBO_SUPERLIKE_TAG_ID || cfg.tagId || DEFAULT_TAG_ID;
  if (process.env.WEIBO_SUPERLIKE_ANDROID_SCHEME) return [process.env.WEIBO_SUPERLIKE_ANDROID_SCHEME];
  return [
    `sinaweibo://pageinfo?containerid=${pageId}__${tagId}_-_tag_comment_sort`,
    `sinaweibo://pageinfo?containerid=${pageId}&extparam=${encodeURIComponent("曾沛慈")}`,
    `sinaweibo://pageinfo?containerid=${pageId}`,
  ];
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
  return cropScreenshot(SCREENSHOT_PATH);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function openPage(site, scheme) {
  const targetScheme = scheme || pageScheme(site);
  if (process.env.WEIBO_SUPERLIKE_ANDROID_FORCE_STOP === "true") {
    adb(["shell", "am", "force-stop", "com.sina.weibo"]);
  }
  adb(["shell", "am", "start", "-W", "-a", "android.intent.action.VIEW", "-d", targetScheme, "com.sina.weibo"]);
  console.log(`Opened Weibo super topic: ${targetScheme}`);
}

function focusedWindow() {
  try {
    const output = adb(["shell", "dumpsys", "window"]);
    const current = output.match(/^\s*mCurrentFocus=.*$/m);
    if (current) return current[0];
    const display = output.match(/^\s*Display #\d+ currentFocus=.*$/m);
    return display ? display[0] : "";
  } catch (err) {
    return "";
  }
}

async function ensurePage(site, forceOpen) {
  const shouldEnsure = process.env.WEIBO_SUPERLIKE_ANDROID_ENSURE_PAGE !== "false";
  if (!shouldEnsure && !forceOpen) return;
  const focus = focusedWindow();
  if (forceOpen || !/com\.sina\.weibo/.test(focus) || !/SGPageActivity/.test(focus)) {
    openPage(site);
    await wait(Number(process.env.WEIBO_SUPERLIKE_ANDROID_OPEN_WAIT_MS || 30000));
    if (dismissPermissionDialog()) await wait(1000);
    if (dismissAnrDialog()) {
      await wait(1000);
      openPage(site);
      await wait(Number(process.env.WEIBO_SUPERLIKE_ANDROID_OPEN_WAIT_MS || 30000));
      if (dismissPermissionDialog()) await wait(1000);
    }
  }
}

function dismissPermissionDialog() {
  const focus = focusedWindow();
  if (!/permissioncontroller|GrantPermissionsActivity/i.test(focus)) return false;
  const size = screenSize();
  const x = Math.round(size.width * 0.5);
  const y = Math.round(size.height * Number(process.env.WEIBO_SUPERLIKE_ANDROID_PERMISSION_DENY_Y_RATIO || 0.615));
  adb(["shell", "input", "tap", String(x), String(y)]);
  console.log("Dismissed Android permission dialog.");
  return true;
}

function dismissAnrDialog() {
  const focus = focusedWindow();
  if (!/Application Not Responding|aerr_close/i.test(focus)) return false;
  const size = screenSize();
  const x = Math.round(size.width * 0.5);
  const y = Math.round(size.height * Number(process.env.WEIBO_SUPERLIKE_ANDROID_ANR_CLOSE_Y_RATIO || 0.516));
  adb(["shell", "input", "tap", String(x), String(y)]);
  console.log("Closed unresponsive Weibo dialog.");
  return true;
}

function lastOcrText() {
  const textPath = path.join(DEBUG_DIR, "last-superlike-text.txt");
  try {
    return fs.readFileSync(textPath, "utf8");
  } catch (err) {
    return "";
  }
}

function isGenericSuperGroupPage(text) {
  const normalized = String(text || "").replace(/\s+/g, " ");
  return /Super Group/i.test(normalized) && !/曾沛慈|超\s*(?:LIKE|Like)|Posts/.test(normalized);
}

function isSuperLikeWrongPage(text) {
  return /钻超等级详情|钻超成长体系|本周等级/.test(String(text || ""));
}

function swipeTagStrip(attempt) {
  const size = screenSize();
  const y = Number(process.env.WEIBO_SUPERLIKE_ANDROID_TAG_Y || Math.round(size.height * DEFAULT_TAG_Y_RATIO) || DEFAULT_TAG_Y);
  // The SuperLIKE chip sits in a sensitive horizontal tag strip. Small nudges
  // reveal the full "超LIKE14018人" text without opening the profile details page.
  const fromX = Math.round(size.width * Number(process.env.WEIBO_SUPERLIKE_ANDROID_SWIPE_FROM_X_RATIO || 0.76));
  const toX = Math.round(size.width * Number(process.env.WEIBO_SUPERLIKE_ANDROID_SWIPE_TO_X_RATIO || 0.60));
  const duration = Math.round(Number(process.env.WEIBO_SUPERLIKE_ANDROID_SWIPE_MS || 180));
  adb(["shell", "input", "swipe", String(fromX), String(y), String(toX), String(y), String(duration)]);
  if (attempt) console.log(`Nudged SuperLIKE tag strip left (${attempt}).`);
}

function runCollector(options, screenshotPath) {
  const args = [path.join(__dirname, "weibo-superlike-monitor.js"), "collect"];
  if (options.dryRun) args.push("--dry-run");
  const env = Object.assign({}, process.env, {
    WEIBO_SUPERLIKE_SCREENSHOT_PATH: screenshotPath,
    WEIBO_SUPERLIKE_SKIP_BROWSER: "true",
  });
  return spawnSync(process.execPath, args, {
    cwd: ROOT,
    env,
    stdio: "inherit",
  }).status === 0;
}

async function collectOnce(site, options) {
  await ensurePage(site, options.open);
  const schemes = pageSchemes(site);
  let schemeIndex = 0;
  const attempts = Math.max(1, Number(process.env.WEIBO_SUPERLIKE_ANDROID_ATTEMPTS || 12));
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (dismissPermissionDialog()) await wait(1000);
    if (dismissAnrDialog()) {
      await wait(1000);
      openPage(site, schemes[schemeIndex]);
      await wait(Number(process.env.WEIBO_SUPERLIKE_ANDROID_OPEN_WAIT_MS || 30000));
      if (dismissPermissionDialog()) await wait(1000);
      continue;
    }
    const screenshotPath = captureScreenshot();
    console.log(`[${new Date().toISOString()}] OCR attempt ${attempt}/${attempts}: ${path.relative(ROOT, screenshotPath)}`);
    if (runCollector(options, screenshotPath)) return true;
    const text = lastOcrText();
    if (isSuperLikeWrongPage(text)) {
      console.log("Opened SuperLIKE detail page instead of topic header. Reopening super topic...");
      openPage(site, schemes[schemeIndex]);
      await wait(Number(process.env.WEIBO_SUPERLIKE_ANDROID_OPEN_WAIT_MS || 30000));
      if (dismissPermissionDialog()) await wait(1000);
      continue;
    }
    if (schemes.length > 1 && isGenericSuperGroupPage(text)) {
      schemeIndex = (schemeIndex + 1) % schemes.length;
      console.log("Opened generic Super Group page. Reopening with fallback scheme...");
      openPage(site, schemes[schemeIndex]);
      await wait(Number(process.env.WEIBO_SUPERLIKE_ANDROID_OPEN_WAIT_MS || 30000));
      if (dismissPermissionDialog()) await wait(1000);
      continue;
    }
    if (attempt < attempts) {
      console.log("SuperLIKE tag was not readable. Nudging the banner tag strip and retrying...");
      swipeTagStrip(attempt);
      await wait(Number(process.env.WEIBO_SUPERLIKE_ANDROID_AFTER_SWIPE_WAIT_MS || 700));
    }
  }
  return false;
}

async function watch(options) {
  const site = loadSiteConfig();
  const ms = refreshMs(site);
  console.log(`Android OCR superLIKE monitor started: every ${Math.round(ms / 60000)} minutes`);
  const loop = async () => {
    try {
      const ok = await collectOnce(site, options);
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
    const ok = await collectOnce(site, options);
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
