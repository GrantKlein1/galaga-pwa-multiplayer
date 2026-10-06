import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var js = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var css = fs.readFileSync(new URL("../css/app.css", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");
var pvp = fs.readFileSync(new URL("../js/pvp.js", import.meta.url), "utf8");
var account = fs.readFileSync(new URL("../api/account.js", import.meta.url), "utf8");

function block(name) {
  var re = new RegExp("var " + name + " = \\[([\\s\\S]*?)\\n  \\];");
  var m = js.match(re);
  assert(m, "missing catalog " + name);
  return m[1];
}
function entries(name) {
  var out = [], re = /\{[\s\S]*?\}/g, m, row, id;
  while ((m = re.exec(block(name)))) {
    row = m[0];
    id = (row.match(/id: "([^"]+)"/) || [])[1];
    if (!id) continue;
    out.push({
      id: id,
      name: (row.match(/name: "([^"]+)"/) || [])[1],
      rarity: (row.match(/rarity: "([^"]+)"/) || [])[1],
      cost: Number((row.match(/cost: (\d+)/) || [])[1]),
      unlockLevel: Number((row.match(/unlockLevel: (\d+)/) || [])[1]),
      row: row
    });
  }
  return out;
}
function byId(list, id) {
  var i;
  for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

assert(js.indexOf('var RARITIES = ["common", "rare", "epic", "legendary", "relic"]') >= 0, "relic last in hangar sort");
assert(js.indexOf('if (r === "relic") return "Relic"') >= 0, "relic label");
assert(js.indexOf('Opens at level \' + d.unlockLevel') >= 0, "locked relic copy");
assert(css.indexOf(".badge.b-relic") >= 0 && css.indexOf(".cat-row.r-relic") >= 0, "crimson-gold hangar styles");
assert(css.indexOf("relic-shimmer") >= 0, "slow shimmer border");
assert(pvp.indexOf("relic: 4") >= 0, "pvp rarity rank");

assert(js.indexOf("var PROFILE_VER = 9") >= 0, "profile shape unchanged");
assert(account.indexOf("v: 9") >= 0, "cloud profile ver 9");
assert(/var VER = 13;/.test(codec), "netcodec VER 13");
assert(sw.indexOf("galaga-coop-v78") >= 0, "PWA cache bump");

[
  "chronoweaver", "twinstar", "eventhorizon",
  "loomthread", "requiem", "axiomlance",
  "overclock", "paradox",
  "eventide", "genesis"
].forEach(function (id) {
  assert(codec.indexOf('"' + id + '"') >= 0, "codec lists " + id);
});
assert(codec.indexOf("twinOn") >= 0 && codec.indexOf("eventideMask") >= 0, "coop sends twin and shards");

var ships = entries("SHIPS");
var guns = entries("GUNS");
var mods = entries("MODS");
var skins = entries("SKIN_TIERS");
var expect = [
  [ships, "chronoweaver", "Chronoweaver", 100, 15000],
  [ships, "twinstar", "Twinstar", 115, 22000],
  [ships, "eventhorizon", "Event Horizon", 135, 28000],
  [guns, "loomthread", "Loomthread", 105, 16000],
  [guns, "requiem", "Requiem Bell", 120, 22000],
  [guns, "axiomlance", "Axiom Lance", 140, 30000],
  [mods, "overclock", "Overclock Core", 110, 18000],
  [mods, "paradox", "Paradox", 130, 25000],
  [skins, "eventide", "Eventide", 125, 0],
  [skins, "genesis", "Genesis", 150, 0]
];
expect.forEach(function (row) {
  var it = byId(row[0], row[1]);
  assert(it, "missing " + row[1]);
  assert(it.name === row[2], row[1] + " name " + it.name);
  assert(it.rarity === "relic", row[1] + " rarity");
  assert(it.unlockLevel === row[3], row[1] + " unlock " + it.unlockLevel);
  assert(it.cost === row[4], row[1] + " cost " + it.cost);
  assert(it.cost === 0 || (it.cost >= 15000 && it.cost <= 30000), row[1] + " price band");
});

assert(js.indexOf('passive: "chrono"') >= 0, "hourglass rewind ship");
assert(js.indexOf('passive: "twin"') >= 0, "twinstar partner");
assert(js.indexOf("extraLives: -1") >= 0, "event horizon life tradeoff");
assert(js.indexOf("thread: 0.4") >= 0, "loomthread duration");
assert(js.indexOf("bell: 3") >= 0, "requiem cadence");
assert(js.indexOf("wallBounce: 1") >= 0, "lance bounce");
assert(js.indexOf('perk: "LANTERN"') >= 0, "eventide perk");
assert(js.indexOf('perk: "GENESIS"') >= 0, "genesis perk");

assert(js.indexOf("xpLevel(profile.totalXp) < (def.unlockLevel || 1)") >= 0, "buy gated by level");
assert(js.indexOf("lv >= skin.unlockLevel") >= 0, "level skins gated by level");
assert(js.indexOf("function tryChronoRewind") >= 0, "chrono rewind");
assert(js.indexOf("function fireTwinstarVolley") >= 0, "twin fire");
assert(js.indexOf("horizonSlowAt") >= 0 && js.indexOf("HORIZON_GRAV_R") >= 0, "gravity well");
assert(js.indexOf("function tickLoomThreads") >= 0, "loom threads");
assert(js.indexOf("function spawnRequiemBell") >= 0, "requiem bell");
assert(js.indexOf("lanceBounces") >= 0, "axiom lance bounce");
assert(js.indexOf('hasMod("overclock", who) ? 0.7 : 1') >= 0, "overclock Q cd");
assert(js.indexOf("who.skillCd *= 0.8") >= 0, "overclock warp shave");
assert(js.indexOf("function startParadox") >= 0 && js.indexOf("paradoxCd = 20") >= 0, "paradox window");
assert(js.indexOf("function initEventide") >= 0 && js.indexOf("shard.t = 10") >= 0, "eventide shards");
assert(js.indexOf('["BURST", "FREEZE", "IGNITE", "ECHO"]') >= 0, "genesis borrowed perks");
assert(js.indexOf("drawEventideShards") >= 0, "eventide drawn");
assert(js.indexOf("isHorizon(p)") >= 0 && js.indexOf("HORIZON_GRAV_R") >= 0, "gravity ring");
assert(js.indexOf("p.paradoxPending") >= 0, "paradox ring");
assert(js.indexOf("CHRONO_REWIND") >= 0, "rewind trail");

var defIds = Array.from(block("BOSS_DEFS").matchAll(/id: "([^"]+)"/g)).map(function (x) { return x[1]; });
var codexBlock = js.match(/var BOSS_CODEX = \{([\s\S]*?)\n  \};/);
assert(codexBlock, "BOSS_CODEX");
var relicIds = {
  chronoweaver: 1, twinstar: 1, eventhorizon: 1,
  loomthread: 1, requiem: 1, axiomlance: 1,
  overclock: 1, paradox: 1
};
defIds.forEach(function (id, i) {
  var debut = (i + 1) * 5;
  var entry = codexBlock[1].match(new RegExp(id + ": \\{([^}]+)\\}"));
  assert(entry, "codex " + id);
  var shipId = (entry[1].match(/ship: "([^"]+)"/) || [])[1];
  var gunId = (entry[1].match(/gun: "([^"]+)"/) || [])[1];
  var modId = (entry[1].match(/mod: "([^"]+)"/) || [])[1];
  [shipId, gunId, modId].forEach(function (item) {
    if (!relicIds[item]) return;
    assert(debut >= 100, id + " relic " + item + " only on wave 100+ (wave " + debut + ")");
  });
});

var codecFn = new Function("window", codec + "\nreturn window.__netcodec;");
var nc = codecFn({});
assert(nc.selfCheck(), "netcodec selfCheck");

console.log("relic-hangar-smoke: ok");
