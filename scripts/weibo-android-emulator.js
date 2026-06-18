#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DEBUG_DIR = path.join(ROOT, "tmp/weibo-android");
const AVD_NAME = process.env.WEIBO_ANDROID_AVD || "WeiboMonitor";
const SDK_ROOT = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || "/opt/homebrew/share/android-commandlinetools";
const ADB_SERIAL = process.env.ADB_SERIAL || "emulator-5554";
const EMULATOR_LOG = path.join(DEBUG_DIR, "emulator.log");

function commandPath(cmd) {
  const result = spawnSync("bash", ["-lc", `command -v ${cmd}`], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}

function binary(name, relPath) {
  const fromSdk = path.join(SDK_ROOT, relPath || name);
  if (fs.existsSync(fromSdk)) return fromSdk;
  return commandPath(name) || name;
}

const ADB = binary("adb", "platform-tools/adb");
const EMULATOR = binary("emulator", "emulator/emulator");

function run(cmd, args, options) {
  const result = spawnSync(cmd, args, Object.assign({ encoding: "utf8" }, options || {}));
  if (result.status !== 0) {
    const message = (result.stderr || result.stdout || "").trim();
    throw new Error(`${cmd} ${args.join(" ")} failed${message ? `: ${message}` : ""}`);
  }
  return result.stdout || "";
}

function adb(args, options) {
  return run(ADB, args, options);
}

function adbSerial(args, options) {
  return adb(["-s", ADB_SERIAL].concat(args), options);
}

function readyDevices() {
  const lines = adb(["devices"]).split("\n").slice(1).map(line => line.trim()).filter(Boolean);
  return lines.filter(line => /\tdevice$/.test(line)).map(line => line.split(/\s+/)[0]);
}

function isReady() {
  return readyDevices().includes(ADB_SERIAL) || readyDevices().length > 0;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForBoot(timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const devices = readyDevices();
      const serial = devices.includes(ADB_SERIAL) ? ADB_SERIAL : devices[0];
      if (serial) {
        const booted = run(ADB, ["-s", serial, "shell", "getprop", "sys.boot_completed"], { encoding: "utf8" }).trim();
        if (booted === "1") return serial;
      }
    } catch (err) {
      // Device is still booting.
    }
    await wait(3000);
  }
  throw new Error("模拟器启动超时。可以打开 tmp/weibo-android/emulator.log 看原因。");
}

function startEmulator() {
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
  if (isReady()) {
    console.log("Android 模拟器已经在线。");
    return false;
  }
  const out = fs.openSync(EMULATOR_LOG, "a");
  const child = spawn(EMULATOR, [
    "-avd", AVD_NAME,
    "-gpu", "host",
    "-netdelay", "none",
    "-netspeed", "full",
    "-dns-server", "223.5.5.5,119.29.29.29",
    "-no-boot-anim",
  ], {
    detached: true,
    stdio: ["ignore", out, out],
  });
  child.unref();
  fs.closeSync(out);
  console.log(`正在启动 AVD：${AVD_NAME}`);
  console.log(`模拟器日志：${EMULATOR_LOG}`);
  return true;
}

function optimize(serial) {
  const target = serial || ADB_SERIAL;
  const commands = [
    ["shell", "settings", "put", "global", "window_animation_scale", "0"],
    ["shell", "settings", "put", "global", "transition_animation_scale", "0"],
    ["shell", "settings", "put", "global", "animator_duration_scale", "0"],
    ["shell", "svc", "power", "stayon", "true"],
    ["shell", "settings", "put", "system", "screen_off_timeout", "2147483647"],
    ["shell", "am", "force-stop", "com.android.vending"],
  ];
  commands.forEach(args => {
    try {
      run(ADB, ["-s", target].concat(args), { encoding: "utf8" });
    } catch (err) {
      console.warn(`调优命令跳过：adb -s ${target} ${args.join(" ")}`);
    }
  });
  console.log(`已调优模拟器：${target}`);
}

function doctor() {
  console.log(`ANDROID SDK: ${SDK_ROOT}`);
  console.log(`emulator: ${EMULATOR}`);
  console.log(`adb: ${ADB}`);
  console.log(`AVD: ${AVD_NAME}`);
  console.log(`ADB_SERIAL: ${ADB_SERIAL}`);
  try {
    console.log("\nAVD 列表:");
    console.log(run(EMULATOR, ["-list-avds"]).trim() || "(empty)");
  } catch (err) {
    console.log(`无法读取 AVD 列表：${err.message}`);
  }
  try {
    console.log("\nadb devices:");
    console.log(adb(["devices", "-l"]).trim() || "(empty)");
  } catch (err) {
    console.log(`无法读取 adb devices：${err.message}`);
  }
  try {
    console.log("\n微博包:");
    console.log(adbSerial(["shell", "pm", "list", "packages", "com.sina.weibo"]).trim() || "未安装 com.sina.weibo");
  } catch (err) {
    console.log("微博包：设备未在线，暂时无法检查");
  }
}

async function start() {
  startEmulator();
  const serial = await waitForBoot(180000);
  optimize(serial);
  console.log(`模拟器已就绪：${serial}`);
  return serial;
}

async function prepare() {
  const serial = await start();
  run(process.execPath, [path.join(__dirname, "weibo-android-monitor.js"), "open"], {
    stdio: "inherit",
    env: Object.assign({}, process.env, { ADB_SERIAL: serial }),
  });
}

async function main() {
  const command = process.argv[2] || "doctor";
  if (command === "doctor") return doctor();
  if (command === "start") return start();
  if (command === "prepare") return prepare();
  console.log([
    "Usage:",
    "  npm run weibo:android:doctor   # 检查 SDK / AVD / adb / 微博安装",
    "  npm run weibo:android:start    # 启动并调优模拟器",
    "  npm run weibo:android:prepare  # 启动模拟器并打开微博活动页",
  ].join("\n"));
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
