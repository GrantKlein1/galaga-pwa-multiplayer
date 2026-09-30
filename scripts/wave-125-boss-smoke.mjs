import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");
var pvp = fs.readFileSync(new URL("../js/pvp.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var roster = fs.readFileSync(new URL("../docs/boss-roster.md", import.meta.url), "utf8");
var post = fs.readFileSync(new URL("../docs/post-55-bosses.md", import.meta.url), "utf8");

var ids = [...galaga.matchAll(/\{ id: "([a-z]+)", name: "([A-Z]+)"/g)].map(function (m) {
  return m[1];
});
assert(ids.length === 30, "30 roster bosses, got " + ids.length);
assert(ids[19] === "terminus" && ids[20] === "hourglass", "Hourglass follows Terminus");
assert(ids[21] === "lanternmoth" && ids[22] === "lodestar", "Lanternmoth then Lodestar");
assert(ids[23] === "lernaean" && ids[24] === "orrery", "Lernaean Hydra then Orrery");
assert(ids[25] === "prism" && ids[29] === "axiom", "Prism through Axiom");
assert(ids.filter(function (id) { return id === "hydra"; }).length === 1, "wave-15 hydra id stays unique");

function meta(n) {
  var cycle = Math.max(0, Math.round(n / 5) - 1);
  return { type: ids[cycle % ids.length], tier: Math.floor(cycle / ids.length) };
}
assert(meta(100).type === "terminus" && meta(100).tier === 0, "wave 100 Terminus");
assert(meta(105).type === "hourglass" && meta(105).tier === 0, "wave 105 Hourglass");
assert(meta(110).type === "lanternmoth" && meta(110).tier === 0, "wave 110 Lanternmoth");
assert(meta(115).type === "lodestar" && meta(115).tier === 0, "wave 115 Lodestar");
assert(meta(120).type === "lernaean" && meta(120).tier === 0, "wave 120 Hydra heads");
assert(meta(125).type === "orrery" && meta(125).tier === 0, "wave 125 Orrery");
assert(meta(130).type === "prism" && meta(130).tier === 0, "wave 130 Prism");
assert(meta(155).type === "seraph" && meta(155).tier === 1, "+1 cycle starts at 155");

assert(/\{ id: "hourglass",[\s\S]*?hp: 1700,/.test(galaga), "Hourglass HP 1700");
assert(/\{ id: "lanternmoth",[\s\S]*?hp: 1800,/.test(galaga), "Lanternmoth HP 1800");
assert(/\{ id: "lodestar",[\s\S]*?hp: 1900,/.test(galaga), "Lodestar HP 1900");
assert(/\{ id: "lernaean",[\s\S]*?hp: 2000,/.test(galaga), "Lernaean HP 2000");
assert(/\{ id: "orrery",[\s\S]*?hp: 2150,/.test(galaga), "Orrery HP 2150");
assert(/\{ id: "hourglass",[\s\S]*?tele: 0\.28/.test(galaga), "Hourglass tele shorter than Terminus");
assert(galaga.indexOf("var GUEST_BOSS_POOL = 10") >= 0, "guests stay Seraph–Overlord");
assert(galaga.indexOf("function beginBulletRewind") >= 0, "Hourglass rewind");
assert(galaga.indexOf("function inFightLight") >= 0 && galaga.indexOf("fight.dark") >= 0, "Lanternmoth dark cone");
assert(galaga.indexOf("function lodestarVolley") >= 0 && galaga.indexOf("(b.polar | 0) === (fight.polar | 0)") >= 0, "Lodestar polarity pass-through");
assert(galaga.indexOf("function spawnLernaeanHeads") >= 0 && galaga.indexOf('fromPerk !== "stump"') >= 0, "Hydra heads/stumps");
assert(galaga.indexOf("function applyOrreryGravity") >= 0, "Orrery gravity");
assert(galaga.indexOf("SAND FALLS") >= 0 && galaga.indexOf("THE PILE RISES") >= 0 && galaga.indexOf("TIME RUNS BACK") >= 0, "Hourglass banners");
assert(galaga.indexOf("THE LAMP GOES OUT") >= 0 && galaga.indexOf("THE SWARM") >= 0 && galaga.indexOf("LIGHT DIES") >= 0, "Lanternmoth banners");
assert(galaga.indexOf("CHOOSE A STAR") >= 0 && galaga.indexOf("BINARY") >= 0 && galaga.indexOf("PULSAR") >= 0, "Lodestar banners");
assert(galaga.indexOf("HEADS WILL GROW") >= 0 && galaga.indexOf("TWO FROM ONE") >= 0 && galaga.indexOf("THE HYDRA") >= 0, "Hydra banners");
assert(galaga.indexOf("THE WHEELS TURN") >= 0 && galaga.indexOf("ALIGNMENT") >= 0 && galaga.indexOf("THE CORE") >= 0, "Orrery banners");

["pour", "pile", "timeslip", "glint", "swarmfan", "gloom", "starred", "starblue", "pulsar", "redrow", "bluerow", "pulsarrow", "heads", "neckbeam", "hydrafan", "orbit", "sling", "align"].forEach(function (atk) {
  assert(galaga.indexOf('atk === "' + atk + '"') >= 0, "attack wired: " + atk);
});

assert(codec.indexOf('"hourglass", "lanternmoth", "lodestar", "lernaean", "orrery"') >= 0, "netcodec boss ids");
assert(/var VER = 11;/.test(codec), "codec VER 11");
assert(codec.indexOf('"sand"') >= 0 && codec.indexOf('"lantern"') >= 0 && codec.indexOf('"polar"') >= 0, "new bx kinds");
assert(codec.indexOf('"head"') >= 0 && codec.indexOf('"stump"') >= 0 && codec.indexOf('"planet"') >= 0, "head/stump/planet kinds");

assert(pvp.indexOf("hourglass:") >= 0 && pvp.indexOf("orrery:") >= 0 && pvp.indexOf("lernaean:") >= 0, "pvp kits");
assert(sw.indexOf("galaga-coop-v66") >= 0, "PWA cache bump");
assert(roster.indexOf("hourglass") >= 0 && roster.indexOf("lernaean") >= 0, "roster docs");
assert(post.indexOf("Hourglass — wave 105") >= 0 && post.indexOf("Orrery — wave 125") >= 0, "post-55 kits");

console.log("wave-125-boss-smoke: ok");
