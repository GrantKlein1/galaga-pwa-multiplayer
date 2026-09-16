import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { get, put, head, BlobNotFoundError, BlobPreconditionFailedError } from "@vercel/blob";
import { nameTakenByOther, readBoard } from "./leaderboard.js";

var scrypt = promisify(scryptCb);

var ACCESS = "private";
var MAX_RETRIES = 4;
var MAX_JSON = 80 * 1024;
var MAX_OWNED = 64;
var MAX_SESSIONS = 8;
var SESSION_MS = 30 * 24 * 60 * 60 * 1000;
var FORGOT_WINDOW_MS = 15 * 60 * 1000;
var FORGOT_MAX = 3;
var LOGIN_WINDOW_MS = 15 * 60 * 1000;
var LOGIN_MAX = 10;
var IP_WINDOW_MS = 15 * 60 * 1000;
var IP_MAX = 12;
var SCRYPT_N = 16384;
var SCRYPT_R = 8;
var SCRYPT_P = 1;
var SCRYPT_KEYLEN = 32;
var SCRYPT_N_CAP = 16384;

var ipHits = {};

function jsonRes(data, status) {
  return Response.json(data, {
    status: status || 200,
    headers: { "Cache-Control": "no-store" }
  });
}

export function sanitizeDisplayName(raw) {
  var s = String(raw || "").replace(/[^\w .\-]/g, "").replace(/\s+/g, " ").trim();
  if (s.length > 16) s = s.slice(0, 16).trim();
  if (s.length < 3) return "";
  return s;
}

export function accountKey(raw) {
  var display = sanitizeDisplayName(raw);
  var key;
  if (display) {
    key = display.toLowerCase().replace(/ /g, "_");
    if (/^[a-z0-9][a-z0-9_.-]{2,15}$/.test(key)) return key;
  }
  // Old create-account blobs used username keys: 3–16 [a-z0-9_].
  key = String(raw || "").trim().toLowerCase();
  if (/^[a-z0-9_]{3,16}$/.test(key)) return key;
  return "";
}

export function sanitizeUsername(raw) {
  return accountKey(raw);
}

export function sanitizePassword(raw) {
  if (typeof raw !== "string") return "";
  if (raw.length < 4 || raw.length > 72) return "";
  return raw;
}

function sanitizeName(raw) {
  var s = String(raw || "").replace(/[^\w .\-]/g, "").replace(/\s+/g, " ").trim();
  if (s.length > 16) s = s.slice(0, 16).trim();
  return s;
}

function sanitizeId(raw) {
  var s = String(raw || "");
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(s)) return "";
  return s;
}

function asInt(n, cap) {
  if (typeof n !== "number" || !isFinite(n)) n = parseInt(n, 10);
  n = n | 0;
  if (n < 0) n = 0;
  if (cap != null && n > cap) n = cap;
  return n;
}

function asTime(n) {
  if (typeof n !== "number" || !isFinite(n)) n = parseInt(n, 10);
  if (!isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function sanitizeStrList(raw, fallback, maxLen) {
  var out = [], i, s, seen = {};
  if (!Array.isArray(raw)) return fallback ? fallback.slice() : [];
  for (i = 0; i < raw.length && out.length < (maxLen || MAX_OWNED); i++) {
    if (typeof raw[i] !== "string") continue;
    s = raw[i].slice(0, 32);
    if (!s || seen[s]) continue;
    seen[s] = 1;
    out.push(s);
  }
  return out.length || !fallback ? out : fallback.slice();
}

function sanitizeStrMap(raw, maxKeys) {
  var out = {}, k, n = 0;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (k in raw) {
    if (!Object.prototype.hasOwnProperty.call(raw, k)) continue;
    if (typeof k !== "string" || k.length > 32) continue;
    if (typeof raw[k] !== "string") continue;
    out[k.slice(0, 32)] = raw[k].slice(0, 32);
    n += 1;
    if (n >= (maxKeys || MAX_OWNED)) break;
  }
  return out;
}

function sanitizeNumMap(raw, cap, maxKeys) {
  var out = {}, k, n = 0;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (k in raw) {
    if (!Object.prototype.hasOwnProperty.call(raw, k)) continue;
    if (typeof k !== "string" || k.length > 40) continue;
    out[k.slice(0, 40)] = asInt(raw[k], cap);
    n += 1;
    if (n >= (maxKeys || 80)) break;
  }
  return out;
}

function sanitizeBoolMap(raw, maxKeys) {
  var out = {}, k, n = 0;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (k in raw) {
    if (!Object.prototype.hasOwnProperty.call(raw, k)) continue;
    if (typeof k !== "string" || k.length > 40) continue;
    if (raw[k]) out[k.slice(0, 40)] = true;
    n += 1;
    if (n >= (maxKeys || 40)) break;
  }
  return out;
}

var SKILL_NODE_IDS = [
  "hull-life1", "hull-iframes", "hull-life2", "hull-brace", "hull-keel", "hull-iron", "hull-citadel", "hull-bulk",
  "hull-plate", "hull-shield", "hull-magnet", "hull-scoop", "hull-regen", "hull-coin", "hull-ward2", "hull-laststand", "hull-speed",
  "gun-dmg1", "gun-rof1", "gun-dmg2", "gun-rof2", "gun-chip", "gun-focus", "gun-dmg3", "gun-pierce",
  "gun-cool", "gun-gems", "gun-haste", "gun-luck", "gun-caliber", "gun-rof3", "gun-rapid", "gun-wide", "gun-muzzle",
  "warp-stasis", "warp-pulse", "warp-aegis", "warp-rift", "warp-well", "warp-veil"
];
var SKILL_SPECIALS = {
  stasis: "warp-stasis",
  pulse: "warp-pulse",
  aegis: "warp-aegis",
  rift: "warp-rift",
  well: "warp-well",
  veil: "warp-veil"
};

function sanitizeSkills(raw) {
  var owned = [], i, id, seen = {}, eq, bonus, need;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { owned: [], equipped: null, bonus: 0 };
  }
  if (Array.isArray(raw.owned)) {
    for (i = 0; i < raw.owned.length && owned.length < SKILL_NODE_IDS.length; i++) {
      id = raw.owned[i];
      if (typeof id !== "string" || seen[id]) continue;
      if (SKILL_NODE_IDS.indexOf(id) < 0) continue;
      seen[id] = 1;
      owned.push(id);
    }
  }
  eq = typeof raw.equipped === "string" ? raw.equipped.slice(0, 16) : null;
  need = eq ? SKILL_SPECIALS[eq] : null;
  if (!need) eq = null;
  if (eq && owned.indexOf(need) < 0) eq = null;
  bonus = asInt(raw.bonus, 80);
  return { owned: owned, equipped: eq, bonus: bonus };
}

function defaultCloudProfile() {
  return {
    v: 6,
    coins: 0,
    totalXp: 0,
    best: 0,
    pid: "",
    name: "",
    ownedShips: ["wisp"],
    ownedGuns: ["pulse"],
    ownedMods: [],
    ownedSkins: { wisp: ["stock"] },
    equipped: { ship: "wisp", gun: "pulse", mod: null },
    equippedSkins: { wisp: "stock" },
    skills: { owned: [], equipped: null, bonus: 0 },
    startWave: 1,
    dailies: { date: "", ids: [], progress: {}, claimed: {}, tier: {}, target: {} },
    dailyTracks: {},
    longTerm: {},
    stats: {
      killsByType: {}, maxWave: 0, bosses: {}, bossBest: {}, pickups: {},
      diveKills: 0, cleanWave: 0, safeWave: 0, maxBossesRun: 0, maxRunCoins: 0, coinsEarned: 0,
      perfectBosses: 0, maxKillsRun: 0, maxCleanRunKills: 0, runs: 0
    },
    admin: false,
    updatedAt: 0
  };
}

function sanitizeSkinMap(raw) {
  var out = {}, k, n = 0, list;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { wisp: ["stock"] };
  for (k in raw) {
    if (!Object.prototype.hasOwnProperty.call(raw, k)) continue;
    if (typeof k !== "string" || k.length > 32) continue;
    list = sanitizeStrList(raw[k], ["stock"], 24);
    if (list.indexOf("stock") < 0) list.unshift("stock");
    out[k.slice(0, 32)] = list;
    n += 1;
    if (n >= MAX_OWNED) break;
  }
  if (!out.wisp) out.wisp = ["stock"];
  return out;
}

function sanitizeLongTerm(raw) {
  var out = {}, k, rec, n = 0;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (k in raw) {
    if (!Object.prototype.hasOwnProperty.call(raw, k)) continue;
    if (typeof k !== "string" || k.length > 40) continue;
    rec = raw[k];
    if (!rec || typeof rec !== "object") continue;
    out[k.slice(0, 40)] = {
      progress: asInt(rec.progress, 9999999),
      claimed: !!rec.claimed,
      tier: asInt(rec.tier, 9999),
      mark: asInt(rec.mark, 99999999)
    };
    n += 1;
    if (n >= 120) break;
  }
  return out;
}

export function sanitizeProfile(raw) {
  var p = defaultCloudProfile();
  var eq, st, d;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return p;
  p.coins = asInt(raw.coins, 99999999);
  p.totalXp = asInt(raw.totalXp, 99999999);
  p.best = asInt(raw.best, 9999999);
  p.pid = sanitizeId(raw.pid);
  p.name = sanitizeName(raw.name);
  p.ownedShips = sanitizeStrList(raw.ownedShips, ["wisp"]);
  p.ownedGuns = sanitizeStrList(raw.ownedGuns, ["pulse"]);
  p.ownedMods = sanitizeStrList(raw.ownedMods, []);
  if (p.ownedShips.indexOf("wisp") < 0) p.ownedShips.unshift("wisp");
  if (p.ownedGuns.indexOf("pulse") < 0) p.ownedGuns.unshift("pulse");
  p.ownedSkins = sanitizeSkinMap(raw.ownedSkins);
  eq = raw.equipped && typeof raw.equipped === "object" ? raw.equipped : {};
  p.equipped.ship = typeof eq.ship === "string" ? eq.ship.slice(0, 32) : "wisp";
  p.equipped.gun = typeof eq.gun === "string" ? eq.gun.slice(0, 32) : "pulse";
  p.equipped.mod = typeof eq.mod === "string" ? eq.mod.slice(0, 32) : null;
  if (p.ownedShips.indexOf(p.equipped.ship) < 0) p.equipped.ship = "wisp";
  if (p.ownedGuns.indexOf(p.equipped.gun) < 0) p.equipped.gun = "pulse";
  if (p.equipped.mod && p.ownedMods.indexOf(p.equipped.mod) < 0) p.equipped.mod = null;
  p.equippedSkins = sanitizeStrMap(raw.equippedSkins);
  if (!p.equippedSkins.wisp) p.equippedSkins.wisp = "stock";
  p.skills = sanitizeSkills(raw.skills);
  p.startWave = asInt(raw.startWave, 100);
  if (p.startWave < 1) p.startWave = 1;
  d = raw.dailies && typeof raw.dailies === "object" ? raw.dailies : {};
  p.dailies.date = typeof d.date === "string" ? d.date.slice(0, 16) : "";
  p.dailies.ids = sanitizeStrList(d.ids, [], 6);
  p.dailies.progress = sanitizeNumMap(d.progress, 999999, 16);
  p.dailies.claimed = sanitizeBoolMap(d.claimed, 16);
  p.dailies.tier = sanitizeNumMap(d.tier, 9999, 16);
  p.dailies.target = sanitizeNumMap(d.target, 9999999, 16);
  p.dailyTracks = sanitizeNumMap(raw.dailyTracks, 9999, 80);
  p.longTerm = sanitizeLongTerm(raw.longTerm);
  st = raw.stats && typeof raw.stats === "object" ? raw.stats : {};
  p.stats.killsByType = sanitizeNumMap(st.killsByType, 9999999);
  p.stats.maxWave = asInt(st.maxWave, 9999);
  p.stats.bosses = sanitizeNumMap(st.bosses, 999999);
  p.stats.bossBest = sanitizeNumMap(st.bossBest, 99);
  p.stats.pickups = sanitizeNumMap(st.pickups, 9999999);
  p.stats.diveKills = asInt(st.diveKills, 9999999);
  p.stats.cleanWave = asInt(st.cleanWave, 9999);
  p.stats.safeWave = asInt(st.safeWave, 9999);
  p.stats.maxBossesRun = asInt(st.maxBossesRun, 99);
  p.stats.maxRunCoins = asInt(st.maxRunCoins, 9999999);
  p.stats.coinsEarned = asInt(st.coinsEarned, 99999999);
  p.stats.perfectBosses = asInt(st.perfectBosses, 999999);
  p.stats.maxKillsRun = asInt(st.maxKillsRun, 9999999);
  p.stats.maxCleanRunKills = asInt(st.maxCleanRunKills, 9999999);
  p.stats.runs = asInt(st.runs, 9999999);
  p.admin = !!raw.admin;
  p.updatedAt = asTime(raw.updatedAt);
  p.v = 6;
  return p;
}

export function accountPath(username) {
  return "galaga-accounts/" + username + ".json";
}

function clientProfile(acct) {
  var profile = acct.profile || defaultCloudProfile();
  var name = sanitizeDisplayName(profile.name) || acct.username || "";
  return {
    username: acct.username,
    name: name,
    profile: profile,
    updatedAt: acct.updatedAt || 0
  };
}

function hashToken(token) {
  return createHash("sha256").update(String(token), "utf8").digest("hex");
}

function newToken(username) {
  return username + "." + randomBytes(32).toString("hex");
}

export function parseAccountToken(raw) {
  var s = String(raw || "").trim();
  var i = s.lastIndexOf(".");
  var user, rest;
  if (i < 1) return null;
  user = accountKey(s.slice(0, i));
  rest = s.slice(i + 1);
  if (!user || !/^[a-f0-9]{64}$/.test(rest)) return null;
  return { username: user, token: s };
}

function bearerToken(request) {
  var h = request.headers.get("authorization") || "";
  var m = /^Bearer\s+(\S+)/i.exec(h);
  return m ? m[1] : "";
}

function clientIp(request) {
  var h = request.headers.get("x-forwarded-for") || "";
  var ip = h.split(",")[0].trim();
  return ip || "unknown";
}

function rateIp(ip) {
  var now = Date.now();
  var arr = (ipHits[ip] || []).filter(function (t) { return now - t < IP_WINDOW_MS; });
  if (arr.length >= IP_MAX) {
    ipHits[ip] = arr;
    return false;
  }
  arr.push(now);
  ipHits[ip] = arr;
  return true;
}

function pruneTimes(list, now, windowMs) {
  var arr = Array.isArray(list) ? list : [];
  return arr.filter(function (t) { return typeof t === "number" && now - t < windowMs; });
}

function pruneSessions(list, now) {
  var arr = Array.isArray(list) ? list : [];
  arr = arr.filter(function (s) {
    return s && typeof s.hash === "string" && /^[a-f0-9]{64}$/.test(s.hash) && (s.exp | 0) > now;
  });
  if (arr.length > MAX_SESSIONS) arr = arr.slice(arr.length - MAX_SESSIONS);
  return arr;
}

function sessionMatch(acct, token) {
  var h = hashToken(token);
  var now = Date.now();
  var sessions = pruneSessions(acct && acct.sessions, now);
  var i, rec, a, b;
  for (i = 0; i < sessions.length; i++) {
    rec = sessions[i];
    try {
      a = Buffer.from(rec.hash, "hex");
      b = Buffer.from(h, "hex");
    } catch (err) {
      continue;
    }
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

async function hashPassword(password, salt, opts) {
  var N = opts.N | 0;
  var r = opts.r | 0;
  var p = opts.p | 0;
  var keylen = opts.keylen | 0;
  if (N < 1024) N = SCRYPT_N;
  if (N > SCRYPT_N_CAP) N = SCRYPT_N_CAP;
  if (r < 1) r = SCRYPT_R;
  if (r > 16) r = 16;
  if (p < 1) p = SCRYPT_P;
  if (p > 4) p = 4;
  if (keylen < 16) keylen = SCRYPT_KEYLEN;
  if (keylen > 64) keylen = 64;
  return Buffer.from(await scrypt(password, salt, keylen, { N: N, r: r, p: p }));
}

async function makePassRecord(password) {
  var salt = randomBytes(16);
  var hash = await hashPassword(password, salt, {
    N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, keylen: SCRYPT_KEYLEN
  });
  return {
    algo: "scrypt",
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    keylen: SCRYPT_KEYLEN,
    salt: salt.toString("hex"),
    hash: hash.toString("hex")
  };
}

async function checkPassword(password, rec) {
  if (!rec || rec.algo !== "scrypt" || typeof rec.salt !== "string" || typeof rec.hash !== "string") return false;
  var salt, expected, got;
  try {
    salt = Buffer.from(rec.salt, "hex");
    expected = Buffer.from(rec.hash, "hex");
    got = await hashPassword(password, salt, rec);
  } catch (err) {
    return false;
  }
  if (!got || got.length !== expected.length) return false;
  return timingSafeEqual(got, expected);
}

export function isBlobMissing(err) {
  var code, msg;
  if (!err) return false;
  if (err instanceof BlobNotFoundError) return true;
  code = err.statusCode || err.status || err.code;
  if (code === 404 || code === "404") return true;
  msg = String(err.message || "");
  if (/not found/i.test(msg) && !/token/i.test(msg)) return true;
  return false;
}

export function blobEtagFromGet(result) {
  var tag = "";
  var headers;
  if (!result) return null;
  if (result.blob && typeof result.blob.etag === "string") tag = result.blob.etag;
  else if (typeof result.etag === "string") tag = result.etag;
  if (!tag && result.headers) {
    headers = result.headers;
    if (typeof headers.get === "function") tag = headers.get("etag") || "";
    else if (typeof headers.etag === "string") tag = headers.etag;
  }
  tag = String(tag || "").trim();
  return tag || null;
}

export function isExistsWriteError(err) {
  var msg;
  if (!err) return false;
  if (err instanceof BlobPreconditionFailedError) return false;
  msg = String(err.message || err);
  if (/already exists/i.test(msg)) return true;
  if (/this blob already exists/i.test(msg)) return true;
  if (/cannot overwrite|overwrite.*exist/i.test(msg)) return true;
  return false;
}

export function isPreconditionWriteError(err) {
  var code;
  if (!err) return false;
  if (err instanceof BlobPreconditionFailedError) return true;
  code = err.statusCode || err.status || err.code;
  if (code === 412 || code === "412") return true;
  return /precondition failed/i.test(String(err.message || ""));
}

async function headAccount(username) {
  try {
    return await head(accountPath(username));
  } catch (err) {
    if (isBlobMissing(err)) return null;
    throw err;
  }
}

async function getAccountBlob(username) {
  try {
    return await get(accountPath(username), { access: ACCESS, useCache: false });
  } catch (err) {
    if (isBlobMissing(err)) return null;
    throw err;
  }
}

async function readAccount(username) {
  var result, text, acct, etag, meta;
  result = await getAccountBlob(username);
  if (!result || result.statusCode !== 200 || !result.stream) {
    meta = await headAccount(username);
    if (!meta) return { acct: null, etag: null };
    result = await getAccountBlob(username);
    etag = meta.etag || null;
    if (!result || result.statusCode !== 200 || !result.stream) {
      return { acct: null, etag: etag, unread: true };
    }
  }
  text = await new Response(result.stream).text();
  try { acct = JSON.parse(text); } catch (err) { acct = null; }
  if (!acct || typeof acct !== "object") acct = null;
  etag = blobEtagFromGet(result) || etag || null;
  return { acct: acct, etag: etag };
}

async function writeAccount(username, acct, etag, create) {
  var opts = {
    access: ACCESS,
    addRandomSuffix: false,
    allowOverwrite: !create,
    cacheControlMaxAge: 60,
    contentType: "application/json"
  };
  if (etag && !create) opts.ifMatch = etag;
  await put(accountPath(username), JSON.stringify(acct), opts);
}

async function mutateAccount(username, fn) {
  var attempt, got, next, errKind;
  for (attempt = 0; attempt < MAX_RETRIES; attempt++) {
    got = await readAccount(username);
    if (got.unread && !got.acct) return jsonRes({ error: "unavailable" }, 503);
    next = await fn(got.acct, got);
    if (next.response) return next.response;
    try {
      await writeAccount(username, next.acct, got.etag, !!next.create);
      return next.after || jsonRes({ ok: true });
    } catch (err) {
      if (next.create && (isExistsWriteError(err) || isPreconditionWriteError(err))) {
        got = await readAccount(username);
        if (got.acct) return jsonRes({ error: "exists" }, 409);
        if (isExistsWriteError(err)) return jsonRes({ error: "exists" }, 409);
        continue;
      }
      if (isPreconditionWriteError(err)) continue;
      if (isBlobMissing(err)) {
        if (next.create) continue;
        return jsonRes({ error: "unavailable" }, 503);
      }
      throw err;
    }
  }
  got = await readAccount(username);
  if (got.unread && !got.acct) return jsonRes({ error: "unavailable" }, 503);
  next = await fn(got.acct, got);
  if (next.response) return next.response;
  try {
    if (next.create) {
      if (got.acct) return jsonRes({ error: "exists" }, 409);
      await writeAccount(username, next.acct, null, true);
    } else {
      await writeAccount(username, next.acct, null, false);
    }
    return next.after || jsonRes({ ok: true });
  } catch (err) {
    errKind = err;
    if (next.create && (isExistsWriteError(errKind) || isPreconditionWriteError(errKind))) {
      got = await readAccount(username);
      if (got.acct || isExistsWriteError(errKind)) return jsonRes({ error: "exists" }, 409);
      throw errKind;
    }
    if (isBlobMissing(errKind) && !next.create) return jsonRes({ error: "unavailable" }, 503);
    throw errKind;
  }
}

function publicAuth(acct, token) {
  var view = clientProfile(acct);
  view.ok = true;
  view.token = token;
  return view;
}

function requestDisplayName(body) {
  if (!body || typeof body !== "object") return "";
  return sanitizeDisplayName(body.name || body.displayName || body.username);
}

async function displayNameConflict(name, pid) {
  var got;
  try {
    got = await readBoard();
  } catch (err) {
    return false;
  }
  return nameTakenByOther(got && got.board, name, pid);
}

async function handleSave(body) {
  var displayName = requestDisplayName(body);
  var username = accountKey(displayName) || accountKey(body && body.username);
  var password = sanitizePassword(body.password);
  var profile = sanitizeProfile(body.profile);
  var now = Date.now();
  if (!displayName || !username) return jsonRes({ error: "bad_username" }, 400);
  if (!password) return jsonRes({ error: "bad_password" }, 400);
  if (!profile.pid) return jsonRes({ error: "bad_profile" }, 400);
  if (await displayNameConflict(displayName, profile.pid)) {
    return jsonRes({ error: "exists" }, 409);
  }
  profile.name = displayName;
  profile.updatedAt = now;
  return mutateAccount(username, async function (acct) {
    var token, pass;
    if (acct) return { response: jsonRes({ error: "exists" }, 409) };
    pass = await makePassRecord(password);
    token = newToken(username);
    return {
      create: true,
      acct: {
        v: 1,
        username: username,
        pass: pass,
        sessions: [{ hash: hashToken(token), exp: now + SESSION_MS }],
        profile: profile,
        updatedAt: now,
        forgotAt: [],
        loginFails: []
      },
      after: jsonRes(publicAuth({ username: username, profile: profile, updatedAt: now }, token))
    };
  });
}

async function handleLogin(body) {
  var displayName = requestDisplayName(body);
  var username = accountKey(displayName) || accountKey(body && body.username);
  var password = sanitizePassword(body.password);
  var now = Date.now();
  if (!username || !password) return jsonRes({ error: "bad_request" }, 400);
  return mutateAccount(username, async function (acct) {
    var token, fails, ok;
    if (!acct || !acct.pass) return { response: jsonRes({ error: "bad_login" }, 401) };
    fails = pruneTimes(acct.loginFails, now, LOGIN_WINDOW_MS);
    if (fails.length >= LOGIN_MAX) return { response: jsonRes({ error: "rate_limited" }, 429) };
    ok = await checkPassword(password, acct.pass);
    if (!ok) {
      acct.loginFails = fails.concat([now]);
      acct.sessions = pruneSessions(acct.sessions, now);
      return { acct: acct, after: jsonRes({ error: "bad_login" }, 401) };
    }
    token = newToken(username);
    acct.loginFails = [];
    acct.sessions = pruneSessions(acct.sessions, now);
    acct.sessions.push({ hash: hashToken(token), exp: now + SESSION_MS });
    acct.username = username;
    if (!acct.profile) acct.profile = defaultCloudProfile();
    if (displayName) acct.profile.name = displayName;
    else if (!acct.profile.name) acct.profile.name = username;
    return {
      acct: acct,
      after: jsonRes(publicAuth(acct, token))
    };
  });
}

async function handleForgot(body, request) {
  var displayName = requestDisplayName(body);
  var username = accountKey(displayName) || accountKey(body && body.username);
  var password = sanitizePassword(body.password);
  var now = Date.now();
  var ip = clientIp(request);
  if (!rateIp(ip)) return jsonRes({ error: "rate_limited" }, 429);
  if (!username || !password) return jsonRes({ error: "bad_request" }, 400);
  return mutateAccount(username, async function (acct) {
    var recent, pass;
    if (!acct || !acct.pass) return { response: jsonRes({ error: "unknown" }, 404) };
    recent = pruneTimes(acct.forgotAt, now, FORGOT_WINDOW_MS);
    if (recent.length >= FORGOT_MAX) return { response: jsonRes({ error: "rate_limited" }, 429) };
    pass = await makePassRecord(password);
    acct.pass = pass;
    acct.forgotAt = recent.concat([now]);
    acct.sessions = [];
    acct.loginFails = [];
    acct.username = username;
    return { acct: acct, after: jsonRes({ ok: true }) };
  });
}

async function handleLogout(request) {
  var parsed = parseAccountToken(bearerToken(request));
  var now = Date.now();
  if (!parsed) return jsonRes({ ok: true });
  return mutateAccount(parsed.username, async function (acct) {
    var h, sessions, i;
    if (!acct) return { response: jsonRes({ ok: true }) };
    h = hashToken(parsed.token);
    sessions = pruneSessions(acct.sessions, now);
    acct.sessions = [];
    for (i = 0; i < sessions.length; i++) {
      if (sessions[i].hash !== h) acct.sessions.push(sessions[i]);
    }
    return { acct: acct, after: jsonRes({ ok: true }) };
  });
}

async function handleGet(request) {
  var parsed = parseAccountToken(bearerToken(request));
  var got;
  if (!parsed) return jsonRes({ error: "unauthorized" }, 401);
  got = await readAccount(parsed.username);
  if (!got.acct || !sessionMatch(got.acct, parsed.token)) {
    return jsonRes({ error: "unauthorized" }, 401);
  }
  return jsonRes(clientProfile(got.acct));
}

async function handlePut(request) {
  var parsed = parseAccountToken(bearerToken(request));
  var body, profile, now;
  if (!parsed) return jsonRes({ error: "unauthorized" }, 401);
  try { body = await request.json(); } catch (err) { body = null; }
  if (!body || typeof body !== "object") return jsonRes({ error: "bad_request" }, 400);
  profile = sanitizeProfile(body.profile);
  now = Date.now();
  if (!profile.pid) return jsonRes({ error: "bad_profile" }, 400);
  profile.updatedAt = now;
  return mutateAccount(parsed.username, async function (acct) {
    if (!acct || !sessionMatch(acct, parsed.token)) {
      return { response: jsonRes({ error: "unauthorized" }, 401) };
    }
    acct.profile = profile;
    acct.updatedAt = now;
    acct.sessions = pruneSessions(acct.sessions, now);
    acct.username = parsed.username;
    return { acct: acct, after: jsonRes(clientProfile(acct)) };
  });
}

async function readJson(request) {
  var n = parseInt(request.headers.get("content-length") || "0", 10);
  var body, text;
  if (n > MAX_JSON + 4096) return { error: jsonRes({ error: "too_large" }, 413) };
  try { text = await request.text(); } catch (err) { return { error: jsonRes({ error: "bad_request" }, 400) }; }
  if (text.length > MAX_JSON + 4096) return { error: jsonRes({ error: "too_large" }, 413) };
  try { body = JSON.parse(text); } catch (err) { body = null; }
  if (!body || typeof body !== "object") return { error: jsonRes({ error: "bad_request" }, 400) };
  return { body: body };
}

export async function GET(request) {
  try {
    return await handleGet(request);
  } catch (err) {
    console.error("account GET", err);
    return jsonRes({ error: "unavailable" }, 503);
  }
}

export async function PUT(request) {
  try {
    return await handlePut(request);
  } catch (err) {
    console.error("account PUT", err);
    return jsonRes({ error: "unavailable" }, 503);
  }
}

export async function POST(request) {
  var parsed, op;
  try {
    parsed = await readJson(request);
    if (parsed.error) return parsed.error;
    op = String(parsed.body.op || "");
    if (op === "save" || op === "create") return await handleSave(parsed.body);
    if (op === "login") return await handleLogin(parsed.body);
    if (op === "forgot") return await handleForgot(parsed.body, request);
    if (op === "logout") return await handleLogout(request);
    return jsonRes({ error: "bad_op" }, 400);
  } catch (err) {
    console.error("account POST", err);
    return jsonRes({ error: "unavailable" }, 503);
  }
}
