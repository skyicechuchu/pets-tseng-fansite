#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const INPUT = process.argv[2];
const TARGET_NAME = process.env.WEIBO_STAGE_TARGET_NAME || "曾沛慈";
const EXTRA_TERMS = (process.env.WEIBO_HAR_TERMS || "")
  .split(",")
  .map(item => item.trim())
  .filter(Boolean);

const TERMS = [
  TARGET_NAME,
  "推荐",
  "推荐值",
  "票",
  "vote",
  "rank",
  "score",
  "hot",
  "wbox",
  "l331zrkexk",
  "1334",
].concat(EXTRA_TERMS);

function usage() {
  console.log([
    "Usage:",
    "  npm run weibo:har:analyze -- /path/to/weibo.har",
    "",
    "Env:",
    "  WEIBO_STAGE_TARGET_NAME=曾沛慈",
    "  WEIBO_HAR_TERMS=张月,夯爆了",
  ].join("\n"));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function headerMap(headers) {
  const out = {};
  (headers || []).forEach(header => {
    if (header && header.name) out[header.name.toLowerCase()] = header.value || "";
  });
  return out;
}

function bodyText(entry) {
  const content = entry && entry.response && entry.response.content || {};
  if (!content.text) return "";
  if (content.encoding === "base64") {
    try {
      return Buffer.from(content.text, "base64").toString("utf8");
    } catch (err) {
      return "";
    }
  }
  return content.text;
}

function safeParseJson(text) {
  if (!text || !/^\s*[\[{]/.test(text)) return null;
  try {
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}

function flattenStrings(value, prefix, out) {
  if (value == null || out.length > 80) return;
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value);
    if (text.length && text.length < 180) out.push(`${prefix}: ${text}`);
    return;
  }
  if (Array.isArray(value)) {
    value.slice(0, 8).forEach((item, index) => flattenStrings(item, `${prefix}[${index}]`, out));
    return;
  }
  if (typeof value === "object") {
    Object.keys(value).slice(0, 20).forEach(key => flattenStrings(value[key], prefix ? `${prefix}.${key}` : key, out));
  }
}

function matchScore(entry) {
  const request = entry.request || {};
  const response = entry.response || {};
  const url = request.url || "";
  const method = request.method || "GET";
  const reqHeaders = headerMap(request.headers);
  const resHeaders = headerMap(response.headers);
  const mime = response.content && response.content.mimeType || "";
  const text = bodyText(entry);
  const haystack = [
    url,
    method,
    mime,
    request.postData && request.postData.text || "",
    text.slice(0, 200000),
  ].join("\n").toLowerCase();
  const foundTerms = TERMS.filter(term => term && haystack.includes(term.toLowerCase()));
  let score = foundTerms.length * 10;
  if (/json|javascript|text/.test(mime)) score += 5;
  if (/api|ajax|interface|container|get|rank|vote|wbox|card/.test(url)) score += 6;
  if (reqHeaders.cookie || reqHeaders.authorization || reqHeaders["x-xsrf-token"]) score += 2;
  if (resHeaders["content-type"] && /json/.test(resHeaders["content-type"])) score += 3;
  return { score, foundTerms, text, mime };
}

function summarizeEntry(entry) {
  const request = entry.request || {};
  const response = entry.response || {};
  const reqHeaders = headerMap(request.headers);
  const { score, foundTerms, text, mime } = matchScore(entry);
  const parsed = safeParseJson(text);
  const samples = [];
  if (parsed) flattenStrings(parsed, "", samples);
  return {
    score,
    method: request.method || "GET",
    status: response.status || 0,
    url: request.url || "",
    mime,
    foundTerms,
    hasCookie: Boolean(reqHeaders.cookie),
    hasAuth: Boolean(reqHeaders.authorization || reqHeaders["x-xsrf-token"]),
    requestHeaders: Object.keys(reqHeaders)
      .filter(key => /cookie|authorization|token|x-|user-agent|referer|origin|mweibo|weibo|fid|gsid|from|s/.test(key))
      .slice(0, 30),
    samples: samples.filter(line => TERMS.some(term => line.toLowerCase().includes(term.toLowerCase()))).slice(0, 20),
    textPreview: text.replace(/\s+/g, " ").slice(0, 500),
  };
}

function main() {
  if (!INPUT) {
    usage();
    process.exitCode = 1;
    return;
  }
  const file = path.resolve(INPUT);
  const raw = readJson(file);
  const entries = raw.log && Array.isArray(raw.log.entries) ? raw.log.entries : [];
  if (!entries.length) throw new Error("HAR 里没有 log.entries。请确认导出的是 HAR 文件。");

  const candidates = entries
    .map(summarizeEntry)
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);

  console.log(JSON.stringify({
    ok: true,
    file,
    entries: entries.length,
    targetName: TARGET_NAME,
    terms: TERMS,
    candidates,
  }, null, 2));
}

main();
