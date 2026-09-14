import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var js = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var css = fs.readFileSync(new URL("../css/app.css", import.meta.url), "utf8");
var account = fs.readFileSync(new URL("../api/account.js", import.meta.url), "utf8");

function block(name) {
  var re = new RegExp("var " + name + " = \\[([\\s\\S]*?)\\n  \\];");
  var m = js.match(re);
  assert(m, "missing catalog " + name);
  return m[1];
}
function ids(name) {
  return Array.from(block(name).matchAll(/id: "([^"]+)"/g)).map(function (x) { return x[1]; });
}

var skillIds = ids("SKILL_NODES");
assert(skillIds.indexOf("hull-life1") >= 0 && skillIds.indexOf("hull-life2") >= 0, "hull extra lives");
assert(skillIds.indexOf("hull-iframes") >= 0 && skillIds.indexOf("hull-laststand") >= 0, "hull iframes/last stand");
assert(skillIds.indexOf("hull-shield") >= 0, "hull shield luck");
assert(skillIds.indexOf("gun-dmg1") >= 0 && skillIds.indexOf("gun-rof1") >= 0, "gunnery first steps");
assert(skillIds.indexOf("gun-dmg2") >= 0 && skillIds.indexOf("gun-rof2") >= 0, "gunnery second steps");
assert(skillIds.indexOf("gun-chip") >= 0 && skillIds.indexOf("gun-gems") >= 0, "pierce chip + gems");
assert(skillIds.indexOf("warp-stasis") >= 0 && skillIds.indexOf("warp-pulse") >= 0 && skillIds.indexOf("warp-aegis") >= 0, "warp specials");
assert(skillIds.indexOf("storm") < 0 && skillIds.indexOf("seeker") < 0, "do not clone storm/seeker");

var costs = Array.from(block("SKILL_NODES").matchAll(/cost: (\d+)/g)).map(function (x) { return x[1] | 0; });
assert(costs.every(function (c) { return c >= 1 && c <= 3; }), "node costs 1-3");
var spentAll = costs.reduce(function (a, b) { return a + b; }, 0);

function xpForLevel(lvl) {
  var MAX_LEVEL = 100;
  var l = Math.max(1, Math.min(MAX_LEVEL, lvl | 0)) - 1;
  return Math.round(100 * Math.pow(l, 2.2) + 400 * l);
}
function xpLevel(xp) {
  xp = xp || 0;
  var lo = 1, hi = 100, mid;
  while (lo < hi) {
    mid = (lo + hi + 1) >> 1;
    if (xpForLevel(mid) <= xp) lo = mid; else hi = mid - 1;
  }
  return lo;
}

var lv = xpLevel(xpForLevel(40));
assert(lv === 40, "level from XP");
var unspent = Math.max(0, lv - spentAll);
assert(js.indexOf("skillBudget") >= 0 && js.indexOf("skillUnspent") >= 0, "SP helpers");
assert(js.indexOf("skillUnspent(who) {") >= 0 || js.indexOf("function skillUnspent") >= 0, "unspent helper");
assert(js.indexOf("xpLevel(p.totalXp)") >= 0 || js.indexOf("xpLevel(xp)") >= 0, "points from XP level");
assert(!/profile\.totalXp\s*-=/.test(js), "do not deduct totalXp");
assert(js.indexOf("skills: { owned: [], equipped: null }") >= 0, "default profile skills");
assert(js.indexOf("p.skills = cloneSkills(raw.skills)") >= 0, "migrate skills");
assert(js.indexOf("var PROFILE_VER = 5") >= 0, "profile ver bump");
assert(account.indexOf("v: 5") >= 0, "cloud profile ver");
assert(account.indexOf("function sanitizeSkills") >= 0, "cloud skills sanitize");
assert(account.indexOf("hull-life1") >= 0 && account.indexOf("warp-aegis") >= 0, "cloud skill ids");

assert(js.indexOf("grantAllSkills()") >= 0, "admin maxes tree");
assert(js.indexOf("function grantAllUnlocks") >= 0, "admin unlock path");
assert(html.indexOf("id=\"btn-skills\"") >= 0 && html.indexOf("id=\"screen-skills\"") >= 0, "hub skills screen");
assert(html.indexOf("id=\"skills-map\"") >= 0, "constellation map");
assert(css.indexOf(".skill-node.hull") >= 0 && css.indexOf(".skill-node.gun") >= 0 && css.indexOf(".skill-node.warp") >= 0, "branch colors");
assert(js.indexOf("id === \"stasis\"") >= 0 && js.indexOf("id === \"pulse\"") >= 0 && js.indexOf("id === \"aegis\"") >= 0, "specials");
assert(js.indexOf("k === \"e\" || k === \"E\"") >= 0, "E key");
assert(html.indexOf("aria-label=\"Skill\"") >= 0, "phone skill pad");
assert(js.indexOf("has-skill") >= 0, "pad shown when equipped");
assert(js.indexOf("STASIS_SLOW") >= 0 && js.indexOf("foeDt") >= 0, "stasis slows enemies/ebul");
assert(js.indexOf("skills: cloneSkills(profile.skills)") >= 0, "coop loadout snap");
assert(js.indexOf("hasSkill(\"gun-dmg1\"") >= 0 && js.indexOf("hasSkill(\"gun-rof1\"") >= 0, "loadout dmg/rof");
assert(js.indexOf("hasSkill(\"hull-life1\"") >= 0 && js.indexOf("function maxLivesFor") >= 0, "life cap raise");
assert(js.indexOf("var MAX_LIVES = 6") >= 0, "base cap still 6");
assert(js.indexOf("hull-laststand") >= 0 && js.indexOf("LAST STAND") >= 0, "last stand");
assert(js.indexOf("SKILL_REFUND_FEE") >= 0, "refund coin fee");
assert(sw.indexOf("galaga-coop-v45") >= 0, "cache bump");
assert(js.indexOf("tryCastSkill") >= 0, "manual cast");
assert(!/auto.?cast/i.test(js), "no auto-cast comments that imply it");

console.log("xp-skill-tree-smoke: ok");
