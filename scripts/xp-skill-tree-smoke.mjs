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
assert(skillIds.length >= 36 && skillIds.length <= 42, "node count 36-42, got " + skillIds.length);
[
  "hull-life1", "hull-iframes", "hull-life2", "hull-shield", "hull-laststand",
  "gun-dmg1", "gun-rof1", "gun-dmg2", "gun-rof2", "gun-chip", "gun-gems",
  "warp-stasis", "warp-pulse", "warp-aegis"
].forEach(function (id) {
  assert(skillIds.indexOf(id) >= 0, "keep owned id " + id);
});
assert(skillIds.indexOf("warp-rift") >= 0 && skillIds.indexOf("warp-well") >= 0 && skillIds.indexOf("warp-veil") >= 0, "new warp specials");
assert(skillIds.indexOf("storm") < 0 && skillIds.indexOf("seeker") < 0, "do not clone storm/seeker");
assert(skillIds.indexOf("hull-plate") >= 0 && skillIds.indexOf("hull-brace") >= 0, "hull forks");
assert(skillIds.indexOf("gun-cool") >= 0 && skillIds.indexOf("gun-haste") >= 0, "gunnery forks");

var costPairs = Array.from(block("SKILL_NODES").matchAll(/id: "([^"]+)"[\s\S]*?cost: (\d+)/g));
var costs = costPairs.map(function (x) { return x[2] | 0; });
var spentAll = costs.reduce(function (a, b) { return a + b; }, 0);
assert(spentAll >= 115 && spentAll <= 175, "full tree SP in range, got " + spentAll);
assert(costs.every(function (c) { return c >= 2 && c <= 22; }), "node costs 2-22");

var warpCosts = {};
costPairs.forEach(function (x) {
  if (x[1].indexOf("warp-") === 0) warpCosts[x[1]] = x[2] | 0;
});
assert(warpCosts["warp-stasis"] === 5, "stasis 5 SP");
assert(warpCosts["warp-pulse"] === 8, "pulse 8 SP");
assert(warpCosts["warp-aegis"] === 11, "aegis 11 SP");
assert(warpCosts["warp-rift"] === 14, "rift 14 SP");
assert(warpCosts["warp-well"] === 18, "well 18 SP");
assert(warpCosts["warp-veil"] === 22, "veil 22 SP");

assert(js.indexOf("skillBudget") >= 0 && js.indexOf("skillUnspent") >= 0, "SP helpers");
assert(js.indexOf("skillBonusOf") >= 0 && js.indexOf("grantSkillBonus") >= 0, "quest bonus SP");
assert(js.indexOf("profile.skills.bonus") >= 0, "bonus field");
assert(js.indexOf("Math.max(") >= 0 && js.indexOf("local.skills && local.skills.bonus") >= 0, "merge bonus max");
assert(/bonus = clampSkillBonus\(raw\.bonus\)/.test(js) || js.indexOf("clampSkillBonus") >= 0, "clone bonus");
assert(js.indexOf("profile.skills.bonus = bonus") >= 0, "refund/admin keep bonus");
assert(!/profile\.totalXp\s*-=/.test(js), "do not deduct totalXp");
assert(js.indexOf("skills: { owned: [], equipped: null, bonus: 0 }") >= 0, "default profile skills");
assert(js.indexOf("p.skills = cloneSkills(raw.skills)") >= 0, "migrate skills");
assert(js.indexOf("var PROFILE_VER = 6") >= 0, "profile ver bump");
assert(account.indexOf("v: 6") >= 0, "cloud profile ver");
assert(account.indexOf("function sanitizeSkills") >= 0, "cloud skills sanitize");
assert(account.indexOf("hull-life1") >= 0 && account.indexOf("warp-veil") >= 0, "cloud skill ids");
assert(account.indexOf("bonus: asInt(raw.bonus, 80)") >= 0 || account.indexOf("raw.bonus") >= 0, "cloud bonus");

assert(js.indexOf("grantAllSkills()") >= 0, "admin maxes tree");
assert(js.indexOf("function grantAllUnlocks") >= 0, "admin unlock path");
assert(html.indexOf("id=\"btn-skills\"") >= 0 && html.indexOf("id=\"screen-skills\"") >= 0, "hub skills screen");
assert(html.indexOf("id=\"skills-map\"") >= 0, "constellation map");
assert(css.indexOf(".skill-node.hull") >= 0 && css.indexOf(".skill-node.gun") >= 0 && css.indexOf(".skill-node.warp") >= 0, "branch colors");
assert(js.indexOf("id === \"stasis\"") >= 0 && js.indexOf("id === \"pulse\"") >= 0 && js.indexOf("id === \"aegis\"") >= 0, "old specials");
assert(js.indexOf("id === \"rift\"") >= 0 && js.indexOf("id === \"well\"") >= 0 && js.indexOf("id === \"veil\"") >= 0, "new specials");
assert(js.indexOf("k === \"e\" || k === \"E\"") >= 0, "E key");
assert(html.indexOf("aria-label=\"Skill\"") >= 0, "phone skill pad");
assert(js.indexOf("has-skill") >= 0, "pad shown when equipped");
assert(js.indexOf("STASIS_SLOW") >= 0 && js.indexOf("foeDt") >= 0, "stasis slows enemies/ebul");
assert(js.indexOf("applyWarpWell") >= 0, "well pull");
assert(js.indexOf("skills: cloneSkills(profile.skills)") >= 0, "coop loadout snap");
assert(js.indexOf("hasSkill(\"gun-dmg1\"") >= 0 && js.indexOf("hasSkill(\"gun-rof1\"") >= 0, "loadout dmg/rof");
assert(js.indexOf("hasSkill(\"hull-life1\"") >= 0 && js.indexOf("function maxLivesFor") >= 0, "life cap raise");
assert(js.indexOf("var MAX_LIVES = 6") >= 0, "base cap still 6");
assert(js.indexOf("hull-laststand") >= 0 && js.indexOf("LAST STAND") >= 0, "last stand");
assert(js.indexOf("SKILL_REFUND_FEE") >= 0, "refund coin fee");
assert(sw.indexOf("galaga-coop-v47") >= 0, "cache bump");
assert(js.indexOf("tryCastSkill") >= 0, "manual cast");
assert(!/auto.?cast/i.test(js), "no auto-cast comments that imply it");
assert(js.indexOf("skill: 1") >= 0, "daily/long quest SP");
assert(js.indexOf("skill: 2") >= 0, "rare long-term +2 SP");
assert(js.indexOf("Take '") >= 0 || js.indexOf("Take ") >= 0, "Take-reward UI");
assert(js.indexOf("skillRewardLabel") >= 0, "skill point copy");

console.log("xp-skill-tree-smoke: ok  nodes=" + skillIds.length + "  sp=" + spentAll);
