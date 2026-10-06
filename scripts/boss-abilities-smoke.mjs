import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");
var html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
var css = fs.readFileSync(new URL("../css/app.css", import.meta.url), "utf8");
var pad = fs.readFileSync(new URL("../js/touchpad.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var docs = fs.readFileSync(new URL("../docs/boss-abilities.md", import.meta.url), "utf8");

var defBlock = galaga.match(/var BOSS_ABILITY_DEFS = \[([\s\S]*?)\n  \];/);
assert(defBlock, "BOSS_ABILITY_DEFS catalog");
var ids = [...defBlock[1].matchAll(/id: "([^"]+)"/g)].map(function (m) { return m[1]; });
var bosses = [...defBlock[1].matchAll(/boss: "([^"]+)"/g)].map(function (m) { return m[1]; });
assert(ids.length >= 40, "at least 40 abilities, got " + ids.length);
assert(ids.length === bosses.length, "id/boss pairs");

var byBoss = {};
bosses.forEach(function (b) { byBoss[b] = (byBoss[b] || 0) + 1; });
[
  "seraph", "wraith", "hydra", "colossus", "chronos", "leviathan", "inferno",
  "nullwarden", "basilisk", "overlord", "mandala", "cenotaph", "kaleido",
  "helios", "selene", "pentarch", "loom", "tessera", "requiem", "terminus",
  "hourglass", "lanternmoth", "lodestar", "lernaean", "orrery",
  "prism", "maelstrom", "cartographer", "mimic", "axiom"
].forEach(function (b) {
  assert((byBoss[b] || 0) >= 2 && (byBoss[b] || 0) <= 3, b + " has 2–3 abilities, got " + (byBoss[b] || 0));
});
assert(ids.indexOf("seraph-fan") >= 0, "seraph fan");
assert(ids.indexOf("levi-surge") >= 0, "leviathan accordion");
assert(ids.indexOf("loom-warp") >= 0, "loom cut thread");
assert(ids.indexOf("tess-rook") >= 0, "tessera rook");
assert(ids.indexOf("req-gap") >= 0, "requiem gap ring");
assert(ids.indexOf("hour-rewind") >= 0, "hourglass trail rewind");
assert(galaga.indexOf('case "timeslip"') >= 0 && galaga.indexOf("beginBulletRewind()") >= 0, "timeslip uses Hourglass rewind");
assert(ids.indexOf("moth-glint") >= 0 && ids.indexOf("lode-pulsar") >= 0, "moth and lodestar");
assert(ids.indexOf("lern-heads") >= 0 && ids.indexOf("orr-core") >= 0, "lernaean and orrery");
assert(ids.indexOf("hydra-beam") >= 0, "wave-15 hydra stays");
assert(ids.indexOf("prism-split") >= 0 && ids.indexOf("axiom-mix") >= 0, "prism through axiom");
assert(galaga.indexOf("function fireMimicAbilityCopy") >= 0, "mimic red ebul copy");
assert(galaga.indexOf("id = currentBossAbilityId(pl)") >= 0, "mimic reads ability API");
assert(galaga.indexOf("function currentPlayerBossAbility") < 0, "stale mimic hook gone");

assert(galaga.indexOf("if (wave < 100) return 0") >= 0, "no pick before 100");
assert(galaga.indexOf("Math.floor((wave - 100) / 5) + 1") >= 0, "pick every 5 waves from 100");
function unlockCount(wave, roster) {
  if (wave < 100) return 0;
  var picks = Math.floor((wave - 100) / 5) + 1;
  return Math.min(roster, picks * 3);
}
assert(unlockCount(99, 20) === 0, "99 locked");
assert(unlockCount(100, 20) === 3, "100 unlocks 3");
assert(unlockCount(105, 20) === 6, "105 unlocks 6");
assert(unlockCount(145, 20) === 20, "145 unlocks all 20 on main");
assert(unlockCount(145, 30) === 30, "145 unlocks all 30 when roster grows");
assert(unlockCount(150, 30) === 30, "cap at roster size");
assert(galaga.indexOf("function shouldOfferBossAbility") >= 0, "pick after 100/105/…");
assert(galaga.indexOf("startN >= 105") >= 0, "skip-start pick");
assert(galaga.indexOf("function tryCastBossAbility") >= 0, "cast");
assert(galaga.indexOf("function currentBossAbilityId") >= 0, "mimic API id");
assert(galaga.indexOf("castBossAbility: tryCastBossAbility") >= 0, "mimic API cast");
assert(galaga.indexOf('k === "q" || k === "Q"') >= 0, "Q key");
assert(galaga.indexOf("pad-bossab") >= 0, "phone button wiring");
assert(galaga.indexOf("input.bossAb") >= 0, "boss ability input");
assert(galaga.indexOf('t: "abpick"') >= 0 && galaga.indexOf('t: "abopen"') >= 0 && galaga.indexOf('t: "abgo"') >= 0, "coop pick messages");
assert(galaga.indexOf("abilityRoll") >= 0, "per-run roll");
assert(galaga.indexOf("screen-bossab") >= 0 || html.indexOf("screen-bossab") >= 0, "pick screen");
assert(galaga.indexOf("PROFILE") < 0 || galaga.indexOf("bossAbilityId") >= 0, "run-scoped pick");
assert(galaga.indexOf("profile.bossAbility") < 0, "not saved to profile");

assert(html.indexOf("pad-bossab") >= 0, "html second button");
assert(html.indexOf("screen-bossab") >= 0, "html pick screen");
assert(css.indexOf("has-boss-ab") >= 0, "pad layout class");
assert(css.indexOf("pad-cd-ring") >= 0, "cooldown ring");
assert(pad.indexOf('key: "q"') >= 0, "touchpad Q");

assert(/var VER = 13;/.test(codec), "codec VER 13");
assert(codec.indexOf("BOSS_ABILITY_IDS") >= 0, "ability ids on wire");
assert(codec.indexOf("seraph-fan") >= 0 && codec.indexOf("term-key") >= 0, "library ids in codec");
assert(codec.indexOf("hour-rewind") >= 0 && codec.indexOf("orr-core") >= 0, "105–125 ids in codec");
assert(codec.indexOf("prism-split") >= 0 && codec.indexOf("axiom-mix") >= 0, "130–150 ids in codec");
assert(codec.indexOf("msg.q") >= 0, "Q input bit");
assert(codec.indexOf("b.bossAb") >= 0, "ability shot color flag");
assert(codec.indexOf("p.bossAbilityId") >= 0, "player ability id");

ids.forEach(function (id) {
  assert(codec.indexOf('"' + id + '"') >= 0, "codec has " + id);
  assert(docs.indexOf("`" + id + "`") >= 0, "docs list " + id);
});

assert(sw.indexOf("galaga-coop-v78") >= 0, "PWA cache bump");
assert(docs.indexOf("Mimic") >= 0, "mimic API documented");
assert(galaga.indexOf("function bossAbAim") >= 0, "casts aim at the nearest enemy");
assert(galaga.indexOf('id: "seraph-fan"') >= 0 && /id: "seraph-fan"[\s\S]{0,220}dmg: 28/.test(galaga), "Seraph fan is player-scale damage");
assert(galaga.indexOf('id: "seraph-fan"') >= 0 && /id: "seraph-fan"[\s\S]{0,180}n: 5, spread: 1\.15/.test(galaga), "Seraph fan matches the boss 5-shot spread");
assert(galaga.indexOf('id: "over-decree"') >= 0 && /id: "over-decree"[\s\S]{0,160}dmg: 140/.test(galaga), "Overlord smash is player-scale");
assert(galaga.indexOf('cd: 14, kind: "pull"') < 0, "long unused pull CD is gone");
assert(galaga.indexOf("opt.dmg == null ? 28") >= 0, "ability shots default to player-scale damage");
assert(docs.indexOf("player-scale") >= 0, "docs describe the stronger casts");
assert(docs.indexOf("3.4s") >= 0 && docs.indexOf("| 14s |") < 0, "docs list the shorter cooldowns");

var codecFn = new Function("window", codec + "\nreturn window.__netcodec;");
var nc = codecFn({});
assert(nc.selfCheck(), "netcodec selfCheck");
assert(nc.BOSS_ABILITY_IDS.indexOf("seraph-fan") === 1, "empty slot then seraph-fan");

console.log("boss-abilities-smoke: ok (" + ids.length + " abilities)");
