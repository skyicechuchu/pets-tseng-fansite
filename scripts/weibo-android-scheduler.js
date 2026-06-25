#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data.v2.js");
const LOCK_PATH = process.env.WEIBO_ANDROID_SCHEDULER_LOCK || path.join(ROOT, "tmp/weibo-android-scheduler.lock");
const ADB_SERIAL = process.env.ADB_SERIAL || "emulator-5554";
const DEFAULT_INTERVAL_MS = 30 * 60 * 1000;
const DEFAULT_COOLDOWN_MS = 30000;

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
loadEnvFile(path.join(ROOT, ".env.weibo-heat"));

function loadSiteConfig() {
  const code = fs.readFileSync(DATA_FILE, "utf8");
  return vm.runInNewContext(`${code}\nSITE;`, { console });
}

function envInt(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function parseJobFilter(argv) {
  const arg = argv.find(item => item.startsWith("--jobs="));
  const raw = process.env.WEIBO_ANDROID_SCHEDULER_JOBS || (arg ? arg.slice("--jobs=".length) : "");
  if (!raw) return null;
  return new Set(raw.split(",").map(item => item.trim()).filter(Boolean));
}

function jobDefinitions(site, filter) {
  const campaign = site.campaign || {};
  const heatCfg = campaign.weiboHeat || {};
  const superlikeCfg = campaign.weiboSuperlike || {};
  const jobs = [
    {
      key: "heat",
      label: "微博姐姐热度",
      enabled: heatCfg.collectionEnabled === true,
      intervalMs: envInt("WEIBO_HEAT_INTERVAL_MS", Number(heatCfg.refreshMs || DEFAULT_INTERVAL_MS)),
      script: "weibo-heat-android-monitor.js",
    },
    {
      key: "superlike",
      label: "微博超LIKE人数",
      enabled: superlikeCfg.collectionEnabled === true,
      intervalMs: envInt("WEIBO_SUPERLIKE_REFRESH_MS", Number(superlikeCfg.refreshMs || DEFAULT_INTERVAL_MS)),
      script: "weibo-superlike-android-ocr.js",
      env: {
        WEIBO_SUPERLIKE_ANDROID_FORCE_STOP: process.env.WEIBO_SUPERLIKE_ANDROID_FORCE_STOP || "true",
      },
    },
  ];
  return jobs.filter(job => job.enabled && (!filter || filter.has(job.key)));
}

function acquireLock() {
  fs.mkdirSync(path.dirname(LOCK_PATH), { recursive: true });
  try {
    const fd = fs.openSync(LOCK_PATH, "wx");
    fs.writeFileSync(fd, `${process.pid}\n`);
    fs.closeSync(fd);
  } catch (err) {
    const existing = fs.existsSync(LOCK_PATH) ? fs.readFileSync(LOCK_PATH, "utf8").trim() : "";
    const pid = Number(existing);
    if (Number.isFinite(pid) && pid > 0) {
      try {
        process.kill(pid, 0);
        throw new Error(`调度器已经在运行，pid=${pid}。如果确认已退出，可以删除 ${path.relative(ROOT, LOCK_PATH)}`);
      } catch (killErr) {
        if (killErr.code !== "ESRCH") throw killErr;
      }
    }
    fs.writeFileSync(LOCK_PATH, `${process.pid}\n`);
  }

  const release = () => {
    try {
      if (fs.existsSync(LOCK_PATH) && fs.readFileSync(LOCK_PATH, "utf8").trim() === String(process.pid)) {
        fs.unlinkSync(LOCK_PATH);
      }
    } catch (err) {
      // Best effort cleanup only.
    }
  };
  process.on("exit", release);
  process.on("SIGINT", () => {
    release();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    release();
    process.exit(143);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function adb(args) {
  return spawnSync("adb", ["-s", ADB_SERIAL].concat(args), {
    cwd: ROOT,
    encoding: "utf8",
  });
}

function forceStopWeibo(reason) {
  const result = adb(["shell", "am", "force-stop", "com.sina.weibo"]);
  if (result.status === 0) console.log(`[${new Date().toISOString()}] 已清理微博进程：${reason}`);
}

function runJob(job, options) {
  const args = [path.join(__dirname, job.script), "collect"];
  if (options.open) args.push("--open");
  if (options.dryRun) args.push("--dry-run");
  const started = new Date();
  console.log(`\n[${started.toISOString()}] 开始采样：${job.label}`);
  const result = spawnSync(process.execPath, args, {
    cwd: ROOT,
    env: Object.assign({}, process.env, job.env || {}),
    stdio: "inherit",
  });
  const elapsed = Math.round((Date.now() - started.getTime()) / 1000);
  if (result.status === 0) {
    console.log(`[${new Date().toISOString()}] 完成采样：${job.label}，耗时 ${elapsed}s`);
    return true;
  }
  console.error(`[${new Date().toISOString()}] 采样失败：${job.label}，exit=${result.status}，耗时 ${elapsed}s。已跳过本轮，不会上传脏数据。`);
  if (options.forceStopAfterFailure) forceStopWeibo(`${job.label} 失败`);
  return false;
}

async function runOnce(jobs, options) {
  if (!jobs.length) {
    console.log("没有可运行的微博 OCR 任务。请检查 data.v2.js collectionEnabled 或 --jobs 参数。");
    return;
  }
  console.log(`串行采样任务：${jobs.map(job => `${job.label}/${Math.round(job.intervalMs / 60000)}min`).join(" -> ")}`);
  for (let index = 0; index < jobs.length; index += 1) {
    runJob(jobs[index], options);
    if (index < jobs.length - 1 && options.cooldownMs > 0) await sleep(options.cooldownMs);
  }
}

async function watch(jobs, options) {
  if (!jobs.length) {
    console.log("没有可运行的微博 OCR 任务。请检查 data.v2.js collectionEnabled 或 WEIBO_ANDROID_SCHEDULER_JOBS。");
    return;
  }
  jobs.forEach((job, index) => {
    job.nextDue = Date.now() + (options.immediate ? index * options.cooldownMs : job.intervalMs);
  });
  console.log(`微博 OCR 串行调度器已启动：${jobs.map(job => `${job.key}/${Math.round(job.intervalMs / 60000)}min`).join(", ")}`);
  for (;;) {
    const now = Date.now();
    const due = jobs
      .filter(job => now >= job.nextDue)
      .sort((a, b) => a.nextDue - b.nextDue);
    if (!due.length) {
      const nextDue = Math.min(...jobs.map(job => job.nextDue));
      await sleep(Math.min(30000, Math.max(1000, nextDue - now)));
      continue;
    }
    for (const job of due) {
      runJob(job, options);
      job.nextDue = Date.now() + job.intervalMs;
      if (options.cooldownMs > 0) await sleep(options.cooldownMs);
    }
  }
}

async function main() {
  const mode = process.argv[2] || "watch";
  const filter = parseJobFilter(process.argv);
  const site = loadSiteConfig();
  const jobs = jobDefinitions(site, filter);
  const options = {
    dryRun: process.argv.includes("--dry-run"),
    open: !process.argv.includes("--no-open"),
    immediate: !process.argv.includes("--no-immediate"),
    forceStopAfterFailure: process.env.WEIBO_ANDROID_SCHEDULER_FORCE_STOP_AFTER_FAILURE !== "false",
    cooldownMs: envInt("WEIBO_ANDROID_SCHEDULER_COOLDOWN_MS", DEFAULT_COOLDOWN_MS),
  };
  acquireLock();
  if (mode === "once") return runOnce(jobs, options);
  if (mode === "watch") return watch(jobs, options);
  console.log([
    "Usage:",
    "  npm run weibo:android:scheduler",
    "  npm run weibo:android:scheduler:once -- --dry-run",
    "  npm run weibo:android:scheduler -- --jobs=heat,superlike",
    "  WEIBO_ANDROID_SCHEDULER_JOBS=heat,superlike npm run weibo:android:scheduler",
  ].join("\n"));
}

main().catch(err => {
  console.error(err && err.stack || err);
  process.exitCode = 1;
});
