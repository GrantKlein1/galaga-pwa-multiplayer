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
assert(ids[11] === "cenotaph" && ids[13] === "helios" && ids[14] === "selene", "new 60/70/75 ids");
assert(ids[15] === "pentarch", "wave 80 Pentarch");
assert(ids.indexOf("myrmidon") < 0 && ids.indexOf("harrow") < 0 && ids.indexOf("nexus") < 0, "old post-55 ids gone");

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
assert(meta(140).type === "cenotaph" && meta(140).tier === 1, "Cenotaph +1");
assert(meta(155).type === "selene" && meta(155).tier === 1, "Selene +1");
assert(meta(160).type === "pentarch" && meta(160).tier === 1, "Pentarch +1");

assert(galaga.indexOf('base: ["seal", "stamp"]') >= 0, "Mandala kit unchanged");
assert(galaga.indexOf('p3: ["wheel"]') >= 0, "Mandala p3 unchanged");
assert(galaga.indexOf('base: ["shatter", "pane"]') >= 0, "Kaleido kit unchanged");
assert(galaga.indexOf('p3: ["fracture"]') >= 0, "Kaleido p3 unchanged");
assert(galaga.indexOf('base: ["aimed", "fan", "ram"]') >= 0, "Seraph kit unchanged");
assert(galaga.indexOf('id: "overlord"') >= 0 && galaga.indexOf('p2: ["core", "corering"]') >= 0, "Overlord kit unchanged");

["slab", "crypt", "knell", "burial", "vigil", "glare", "sear", "prominence", "hearth", "noon", "crescent", "limb", "tide", "waning", "occult"].forEach(function (atk) {
  assert(galaga.indexOf('atk === "' + atk + '"') >= 0, "attack wired: " + atk);
});

assert(galaga.indexOf("e.type === \"cenotaph\" && idx >= 2") >= 0, "Cenotaph still/vigil phase");
assert(galaga.indexOf("function aimedWedge") >= 0 && galaga.indexOf("function echoAimY") >= 0, "live Y helpers");
assert(galaga.indexOf("var GUEST_BOSS_POOL = 10") >= 0, "guest pool still original 10");
assert(galaga.indexOf("guestPairOk") >= 0 && galaga.indexOf("late+late") < 0, "pairing helper present");
assert(/never two late-tier[\s\S]{0,80}bosses/.test(galaga), "no late+late pairing");

assert(codec.indexOf('"cenotaph", "kaleido", "helios", "selene", "pentarch"') >= 0, "netcodec ids");
assert(codec.indexOf("myrmidon") < 0 && codec.indexOf("harrow") < 0 && codec.indexOf('"nexus"') < 0, "old codec ids gone");
assert(/var VER = 6;/.test(codec), "codec VER bumped for wave-40 enemy ids");

assert(pvp.indexOf("cenotaph:") >= 0 && pvp.indexOf("helios:") >= 0 && pvp.indexOf("selene:") >= 0 && pvp.indexOf("pentarch:") >= 0, "pvp kits");
assert(pvp.indexOf("myrmidon") < 0 && pvp.indexOf("harrow:") < 0, "old pvp kits gone");

assert(galaga.indexOf("gear") < 0 && galaga.indexOf("cog") < 0, "no gear/cog art");
assert(galaga.indexOf("flareA") >= 0 && galaga.indexOf("var shade") >= 0, "sun prominences and moon terminator");
assert(sw.indexOf("galaga-coop-v51") >= 0, "PWA cache bump");

console.log("post-55-boss-smoke: ok");
