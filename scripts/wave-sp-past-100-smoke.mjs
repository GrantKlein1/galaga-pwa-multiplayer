import fs from "fs";
import { sanitizeProfile, unionWaveSp } from "../api/account.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var js = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var account = fs.readFileSync(new URL("../api/account.js", import.meta.url), "utf8");

assert(js.indexOf("var PROFILE_VER = 9") >= 0, "client profile ver 9");
assert(account.indexOf("v: 9") >= 0, "cloud profile ver 9");
assert(account.indexOf("p.v = 9") >= 0, "sanitize writes ver 9");
assert(sw.indexOf("galaga-coop-v73") >= 0, "PWA cache bump");

assert(js.indexOf("waveSp: []") >= 0, "default waveSp set");
assert(js.indexOf("function cloneWaveSp") >= 0, "clone helper");
assert(js.indexOf("function unionWaveSp") >= 0, "client union");
assert(js.indexOf("function grantPost100WaveSkillPoint") >= 0, "payout helper");
assert(js.indexOf("function recordClearedWave") >= 0, "clear helper");
assert(js.indexOf("function skillWaveSpOf") >= 0, "budget counts paid waves");
assert(js.indexOf("skillBonusOf(who) + skillWaveSpOf(who)") >= 0, "budget adds wave SP");
assert(js.indexOf("if (n <= 100) return false") >= 0, "wave 100 does not pay");
assert(js.indexOf("if (wave && n === wave + 1) recordClearedWave(wave)") >= 0, "spawnWave pays the wave just cleared");
assert(js.indexOf("if (sb.w === wave + 1) recordClearedWave(wave)") >= 0, "coop client pays sequential clear");
assert(js.indexOf("waveSp: unionWaveSp(local.skills && local.skills.waveSp, cloud.skills && cloud.skills.waveSp)") >= 0, "client merge unions set");
assert(js.indexOf("profile.skills.waveSp = waveSp") >= 0, "refund keeps payout set");
assert(js.indexOf("applySkipState") >= 0 && js.indexOf("skipCredit") >= 0, "skip-start still exists");

var skipFn = js.match(/function skipCredit\(startN\) \{[\s\S]*?\n  \}/);
assert(skipFn, "skipCredit fn");
assert(skipFn[0].indexOf("grantPost100") < 0, "skip-start score credit does not grant SP");
assert(skipFn[0].indexOf("waveSp") < 0, "skipCredit does not touch payout set");

var skipState = js.match(/function applySkipState\(startN, reached(?:, admin)?\) \{[\s\S]*?\n  \}/);
assert(skipState, "applySkipState fn");
assert(skipState[0].indexOf("grantPost100") < 0, "skip-start does not grant SP");
assert(skipState[0].indexOf("recordClearedWave") < 0, "skip-start does not mark skipped waves cleared");

var adminFn = js.match(/function grantAllUnlocks\(\) \{[\s\S]*?\n  \}/);
assert(adminFn, "admin unlock fn");
assert(adminFn[0].indexOf("grantPost100") < 0, "admin unlock does not backfill wave SP");

assert(js.indexOf("skill: 1") >= 0 && js.indexOf("skill: 2") >= 0, "quest SP unchanged");
assert(js.indexOf('extra += " +" + waveSp + " wave"') >= 0, "skills UI shows wave SP");
assert(js.indexOf("first clear of each wave past 100") >= 0, "empty-detail copy mentions wave points");

assert(account.indexOf("function sanitizeWaveSp") >= 0, "cloud sanitizes set");
assert(account.indexOf("WAVE_SP_MIN = 101") >= 0, "cloud rejects 100 and below");
assert(account.indexOf("profile.skills.waveSp = unionWaveSp(") >= 0, "PUT unions stored set");
assert(account.indexOf("acct.profile.skills.waveSp") >= 0, "PUT reads existing payouts");

assert(JSON.stringify(unionWaveSp([101, 102], [102, 103])) === JSON.stringify([101, 102, 103]), "union unique waves");
assert(unionWaveSp([100, 101], [50, 101]).join(",") === "101", "drop 100 and dupes");
assert(unionWaveSp(null, [101, 250]).join(",") === "101,250", "null local");
assert(unionWaveSp([201], undefined).join(",") === "201", "null cloud");
assert(unionWaveSp(["101", 101.9], [102]).join(",") === "101,102", "coerce numeric strings");

var p = sanitizeProfile({
  pid: "abcdefgh",
  skills: { owned: [], equipped: null, bonus: 4, waveSp: [100, 101, 101, 250, "nope", 0, 999] }
});
assert(p.v === 9, "sanitize version");
assert(p.skills.bonus === 4, "quest bonus untouched");
assert(p.skills.waveSp.join(",") === "101,250,999", "sanitize keeps post-100 unique");

var old = sanitizeProfile({ pid: "abcdefgh", skills: { bonus: 2 } });
assert(Array.isArray(old.skills.waveSp) && old.skills.waveSp.length === 0, "old profiles start empty set");
assert(old.skills.bonus === 2, "existing bonus kept");

assert(js.indexOf("var MAX_LEVEL = 150") >= 0, "level cap 150");
assert(js.indexOf("max 150") >= 0, "skills UI mentions 150");
assert(sanitizeProfile({ pid: "abcdefgh", startWave: 107 }).startWave === 107, "cloud keeps 107");
assert(sanitizeProfile({ pid: "abcdefgh", startWave: 150 }).startWave === 150, "cloud keeps 150");
assert(sanitizeProfile({ pid: "abcdefgh", startWave: 1 }).startWave === 1, "cloud keeps 1");

console.log("wave-sp-past-100-smoke: ok");
