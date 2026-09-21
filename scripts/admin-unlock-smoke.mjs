import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var js = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var readme = fs.readFileSync(new URL("../README.md", import.meta.url), "utf8");
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
function catalogIdUnion(owned, catalog) {
  var out = [], seen = {}, i, id, src = owned || [];
  for (i = 0; i < src.length; i++) {
    id = src[i];
    if (typeof id !== "string" || seen[id]) continue;
    seen[id] = 1;
    out.push(id);
  }
  for (i = 0; i < catalog.length; i++) {
    id = catalog[i];
    if (typeof id !== "string" || seen[id]) continue;
    seen[id] = 1;
    out.push(id);
  }
  return out;
}
function xpForLevel(lvl) {
  var MAX_LEVEL = 100;
  var l = Math.max(1, Math.min(MAX_LEVEL, lvl | 0)) - 1;
  return Math.round(100 * Math.pow(l, 2.2) + 400 * l);
}
function maxStartWave(lv) {
  if (lv < 5) return 1;
  return Math.floor(lv / 5) * 5;
}

var ships = ids("SHIPS");
var guns = ids("GUNS");
var mods = ids("MODS");
assert(ships[0] === "wisp" && ships.indexOf("eclipse") >= 0, "ship catalog");
assert(guns[0] === "pulse" && guns.indexOf("prism") >= 0, "gun catalog");
assert(mods[0] === "barrier" && mods.indexOf("ascension") >= 0, "mod catalog");

var guest = js.match(/function defaultProfile\(\) \{[\s\S]*?ownedShips: \[([^\]]+)\],\s*ownedGuns: \[([^\]]+)\],\s*ownedMods: \[([^\]]*)\],/);
assert(guest && guest[1].indexOf("wisp") >= 0 && guest[1].indexOf("eclipse") < 0, "guest ships still starter-only");
assert(guest[2].indexOf("pulse") >= 0 && guest[2].indexOf("prism") < 0, "guest guns still starter-only");
assert(guest[3].trim() === "", "guest mods still empty");

assert(account.indexOf('ownedShips: ["wisp"]') >= 0, "cloud guest ships");
assert(account.indexOf('ownedGuns: ["pulse"]') >= 0, "cloud guest guns");

var p = {
  coins: 12,
  totalXp: 80,
  ownedShips: ["wisp", "needle"],
  ownedGuns: ["pulse"],
  ownedMods: [],
  equipped: { ship: "needle", gun: "pulse", mod: null },
  stats: { maxWave: 4 },
  startWave: 1
};
p.ownedShips = catalogIdUnion(p.ownedShips, ships);
p.ownedGuns = catalogIdUnion(p.ownedGuns, guns);
p.ownedMods = catalogIdUnion(p.ownedMods, mods);
p.totalXp = Math.max(p.totalXp, xpForLevel(100));
p.stats.maxWave = Math.max(p.stats.maxWave, maxStartWave(100) + 1);
assert(p.ownedShips.length === ships.length, "all ships owned");
assert(p.ownedGuns.length === guns.length, "all guns owned");
assert(p.ownedMods.length === mods.length, "all mods owned");
assert(p.ownedShips.indexOf("needle") === 1, "kept existing ship order");
assert(p.equipped.ship === "needle", "kept equipped ship");
assert(p.totalXp >= xpForLevel(100), "max XP");
assert(p.stats.maxWave > 100, "start-wave gate cleared for late options");
assert(maxStartWave(100) === 100, "lv100 start options include post-50");

assert(js.indexOf('var ADMIN_CODE = "1234"') >= 0, "passcode");
assert(js.indexOf("resetTapN >= 3") >= 0, "triple tap");
assert(js.indexOf("onResetProgressTap") >= 0, "reset tap handler");
assert(js.indexOf("grantAllUnlocks") >= 0, "unlock grant");
assert(js.indexOf("grantAllSkills()") >= 0, "admin maxes skill tree");
assert(js.indexOf("flushAccountPush") >= 0, "account sync");
assert(html.indexOf("id=\"admin-passcode\"") >= 0, "passcode sheet");
assert(html.indexOf("Enter passcode") >= 0, "passcode copy");
assert(sw.indexOf("galaga-coop-v50") >= 0, "cache bump");
assert(readme.toLowerCase().indexOf("passcode") < 0, "readme has no passcode");
assert(readme.indexOf("1234") < 0, "readme has no code");
assert(readme.toLowerCase().indexOf("admin unlock") < 0, "readme has no admin unlock");

console.log("admin-unlock-smoke: ok");
