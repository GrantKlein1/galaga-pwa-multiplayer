import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var js = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var account = fs.readFileSync(new URL("../api/account.js", import.meta.url), "utf8");

function block(name) {
  var re = new RegExp("var " + name + " = \\[([\\s\\S]*?)\\n  \\];");
  var m = js.match(re);
  assert(m, "missing catalog " + name);
  return m[1];
}

var warp = Array.from(block("SKILL_NODES").matchAll(/id: "(warp-[^"]+)"[\s\S]*?name: "([^"]+)"[\s\S]*?cost: (\d+)[\s\S]*?special: "([^"]+)"/g));
assert(warp.length === 6, "six warp specials, got " + warp.length);
assert(warp[0][1] === "warp-haunt" && warp[0][3] === "5" && warp[0][4] === "haunt", "1 Haunt 5");
assert(warp[1][1] === "warp-shackle" && warp[1][3] === "8" && warp[1][4] === "shackle", "2 Shackle 8");
assert(warp[2][1] === "warp-stasis" && warp[2][3] === "11" && warp[2][4] === "stasis", "3 Stasis 11");
assert(warp[3][1] === "warp-rampart" && warp[3][3] === "14" && warp[3][4] === "rampart", "4 Rampart 14");
assert(warp[4][1] === "warp-fold" && warp[4][3] === "18" && warp[4][4] === "fold", "5 Fold 18");
assert(warp[5][1] === "warp-horizon" && warp[5][3] === "22" && warp[5][4] === "horizon", "6 Horizon 22");

assert(js.indexOf("var STASIS_SLOW = 0.32") >= 0, "stasis slow");
assert(js.indexOf("var STASIS_DUR = 2.8") >= 0, "stasis dur");
assert(js.indexOf("var STASIS_CD = 16") >= 0, "stasis cd");
assert(js.indexOf("function applyWarpWell") < 0, "well gone");
assert(js.indexOf("special: \"pulse\"") < 0 && js.indexOf("special: \"aegis\"") < 0, "pulse/aegis not warp specials");
assert(js.indexOf("special: \"rift\"") < 0 && js.indexOf("special: \"well\"") < 0 && js.indexOf("special: \"veil\"") < 0, "rift/well/veil not warp specials");
assert(js.indexOf("warpInRampart") >= 0 && js.indexOf("kamikaze") >= 0, "rampart blocks kami");
assert(js.indexOf("function drawWarpFx") >= 0, "full-duration warp draw");
assert(js.indexOf("special: \"seeker\"") < 0, "not seeker");
assert(js.indexOf("k === \"e\" || k === \"E\"") >= 0, "E key");
assert(sw.indexOf("galaga-coop-v56") >= 0, "cache bump");

var start = account.indexOf("var SKILL_NODE_IDS");
var end = account.indexOf("function defaultCloudProfile");
assert(start >= 0 && end > start, "account skill block");
var asInt = function (n, cap) {
  n = n | 0;
  if (n < 0) return 0;
  if (n > cap) return cap;
  return n;
};
var api = new Function("asInt", account.slice(start, end) + "\nreturn { sanitizeSkills: sanitizeSkills };")(asInt);

var full = api.sanitizeSkills({
  owned: ["warp-stasis", "warp-pulse", "warp-aegis", "warp-rift", "warp-well", "warp-veil"],
  equipped: "veil",
  bonus: 3
});
["warp-haunt", "warp-shackle", "warp-stasis", "warp-rampart", "warp-fold", "warp-horizon"].forEach(function (id) {
  assert(full.owned.indexOf(id) >= 0, "convert owns " + id);
});
assert(full.owned.indexOf("warp-pulse") < 0, "drop pulse id");
assert(full.equipped === "horizon", "veil equip becomes horizon");
assert(full.bonus === 3, "keep bonus");

var onlyStasis = api.sanitizeSkills({ owned: ["warp-stasis"], equipped: "stasis", bonus: 0 });
assert(onlyStasis.owned.indexOf("warp-stasis") >= 0, "keep stasis id");
assert(onlyStasis.owned.indexOf("warp-haunt") < 0, "stasis owners skip haunt grant");
assert(onlyStasis.equipped === "stasis", "stasis still equippable");

var mid = api.sanitizeSkills({ owned: ["warp-stasis", "warp-pulse", "warp-aegis"], equipped: "aegis" });
assert(mid.owned.indexOf("warp-haunt") >= 0, "aegis grants haunt for spent 5");
assert(mid.owned.indexOf("warp-shackle") >= 0, "pulse becomes shackle");
assert(mid.equipped === "stasis", "aegis equip becomes stasis");
assert(account.indexOf("WARP_OWNED_MIGRATE") >= 0, "cloud migrate table");

console.log("warp-specials-smoke: ok");
