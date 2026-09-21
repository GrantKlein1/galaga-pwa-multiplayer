import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");
var pvp = fs.readFileSync(new URL("../js/pvp.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");

var ids = [...galaga.matchAll(/\{ id: "([a-z]+)", name: "([A-Z]+)"/g)].map(function (m) {
  return m[1];
});
assert(ids.length === 16, "16 roster bosses, got " + ids.length);
assert(ids[10] === "mandala" && ids[12] === "kaleido", "Mandala 55 and Kaleido 65 stay");
assert(ids[11] === "cenotaph" && ids[13] === "helios" && ids[14] === "selene", "60/70/75 ids stay");
assert(ids[15] === "pentarch", "wave 80 is Pentarch");

function meta(n) {
  var cycle = Math.max(0, Math.round(n / 5) - 1);
  return { type: ids[cycle % ids.length], tier: Math.floor(cycle / ids.length) };
}
assert(meta(55).type === "mandala" && meta(55).tier === 0, "wave 55 Mandala");
assert(meta(60).type === "cenotaph" && meta(60).tier === 0, "wave 60 Cenotaph");
assert(meta(65).type === "kaleido" && meta(65).tier === 0, "wave 65 Kaleido");
assert(meta(70).type === "helios" && meta(70).tier === 0, "wave 70 Helios");
assert(meta(75).type === "selene" && meta(75).tier === 0, "wave 75 Selene");
assert(meta(80).type === "pentarch" && meta(80).tier === 0, "wave 80 Pentarch");
assert(meta(85).type === "seraph" && meta(85).tier === 1, "+1 cycle starts at Seraph after Pentarch");
assert(meta(155).type === "selene" && meta(155).tier === 1, "Selene +1");
assert(meta(160).type === "pentarch" && meta(160).tier === 1, "Pentarch +1");

assert(galaga.indexOf('base: ["seal", "stamp"]') >= 0, "Mandala kit unchanged");
assert(galaga.indexOf('p3: ["wheel"]') >= 0, "Mandala p3 unchanged");
assert(galaga.indexOf('base: ["shatter", "pane"]') >= 0, "Kaleido kit unchanged");
assert(galaga.indexOf('p3: ["fracture"]') >= 0, "Kaleido p3 unchanged");
assert(galaga.indexOf('base: ["glare", "sear"]') >= 0, "Helios kit unchanged");
assert(galaga.indexOf('p3: ["noon"]') >= 0, "Helios p3 unchanged");
assert(galaga.indexOf('base: ["crescent", "limb"]') >= 0, "Selene kit unchanged");
assert(galaga.indexOf('p3: ["occult"]') >= 0, "Selene p3 unchanged");
assert(galaga.indexOf('base: ["aimed", "fan", "ram"]') >= 0, "Seraph kit unchanged");
assert(galaga.indexOf('p2: ["core", "corering"]') >= 0, "Overlord kit unchanged");

assert(galaga.indexOf("exclusive: true") >= 0, "Pentarch phases are exclusive per element");
assert(galaga.indexOf('p2Thresh: 0.8, p3Thresh: 0.6, p4Thresh: 0.4, p5Thresh: 0.2') >= 0, "20% HP splits");
assert(galaga.indexOf("if (d.p5 && d.p5.length)") >= 0, "5-phase thresholds before 3-phase layout");
assert(galaga.indexOf("function freezePlayersRect") >= 0, "ice freeze lock");
assert(galaga.indexOf("function plantPyre") >= 0, "lingering fire pyre");
assert(galaga.indexOf('e.type === "pentarch"') >= 0 && galaga.indexOf("H / 2 - 72") >= 0, "vertical move toward midline");

["pyre", "cinder", "rime", "glacier", "bolt", "fork", "fault", "spire", "shear", "gale"].forEach(function (atk) {
  assert(galaga.indexOf('atk === "' + atk + '"') >= 0, "attack wired: " + atk);
});

assert(galaga.indexOf("var GUEST_BOSS_POOL = 10") >= 0, "guest pool still original 10");
assert(galaga.indexOf("guestPairOk") >= 0, "pairing helper present");
assert(/never two late-tier[\s\S]{0,80}bosses/.test(galaga), "no late+late pairing");

assert(codec.indexOf('"helios", "selene", "pentarch"') >= 0, "netcodec pentarch id");
assert(/var VER = 6;/.test(codec), "codec VER bumped for wave-40 enemy ids");
assert(codec.indexOf("p.freezeT") >= 0, "freezeT in player snap");

assert(pvp.indexOf("pentarch:") >= 0, "pvp kit");
assert(pvp.indexOf("cenotaph:") >= 0 && pvp.indexOf("helios:") >= 0 && pvp.indexOf("selene:") >= 0, "prior late pvp kits stay");

assert(sw.indexOf("galaga-coop-v50") >= 0, "PWA cache bump");

console.log("wave-80-boss-smoke: ok");
