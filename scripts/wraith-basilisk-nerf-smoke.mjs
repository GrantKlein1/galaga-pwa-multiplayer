import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");

var basilisk = galaga.match(/\{ id: "basilisk",[\s\S]*?flavor: "[^"]+" \}/);
assert(basilisk, "Basilisk def present");
assert(basilisk[0].indexOf('p2: ["venompool", "petrify"]') >= 0, "Basilisk p2 dropped constrict");
assert(basilisk[0].indexOf("constrict") < 0, "constrict gone from Basilisk kit");
assert(basilisk[0].indexOf('base: ["venom", "gaze", "coil"]') >= 0, "venom/gaze/coil stay");
assert(basilisk[0].indexOf('t1: ["gaze2"]') >= 0 && basilisk[0].indexOf('t2: ["spitburst"]') >= 0, "gaze2/spitburst stay");
assert(/hp: 300/.test(basilisk[0]), "dedicated Basilisk HP field unchanged");

var wraith = galaga.match(/\{ id: "wraith",[\s\S]*?flavor: "[^"]+" \}/);
assert(wraith && /hp: 72/.test(wraith[0]), "dedicated Wraith HP field unchanged");
assert(wraith[0].indexOf('base: ["spiral", "mines", "sweep", "blink"]') >= 0, "Wraith kit unchanged");

assert(/\{ id: "seraph",[\s\S]*?hp: 48,/.test(galaga), "Seraph HP unchanged");
assert(/\{ id: "hydra",[\s\S]*?hp: 102,/.test(galaga), "Hydra HP unchanged");
assert(/\{ id: "overlord",[\s\S]*?hp: 384,/.test(galaga), "Overlord HP unchanged");
assert(galaga.indexOf("function guestPairOk") >= 0, "guest pairing unchanged");
assert(/never two late-tier[\s\S]{0,80}bosses/.test(galaga), "no late+late pairing");

assert(galaga.indexOf("function guestHpMul(type, n)") >= 0, "guest HP helper");
assert(galaga.indexOf("if (type === \"wraith\" || type === \"basilisk\") mul *= 0.65") >= 0, "Wraith/Basilisk extra 35% guest cut");
assert(galaga.indexOf("var mul = 0.75") >= 0, "late guests still 75%");
assert(galaga.indexOf("enemyHp(type, extra.tier || 0, wave, extra.guest)") >= 0, "makeEnemy passes guest flag");
assert(galaga.indexOf("{ isBoss: true, tier: plan.tier || 0, guest: true }") >= 0, "mixed-wave spawn marks guest");
assert(galaga.indexOf("{ isBoss: true, tier: meta.tier }") >= 0, "dedicated every-5 spawn is not guest");

var mulSrc = galaga.match(/function guestHpMul\(type, n\) \{[\s\S]*?\n  \}/);
assert(mulSrc, "guestHpMul body");
var guestHpMul = new Function("type", "n", mulSrc[0].replace(/^function guestHpMul\(type, n\) \{/, "").replace(/\n  \}$/, ""));
assert(guestHpMul("seraph", 58) === 0.75, "Seraph guest wave 58 stays 75%");
assert(guestHpMul("hydra", 58) === 0.75, "Hydra guest wave 58 stays 75%");
assert(Math.abs(guestHpMul("wraith", 58) - 0.75 * 0.65) < 1e-9, "Wraith guest stacks 75% then 35%");
assert(Math.abs(guestHpMul("basilisk", 58) - 0.75 * 0.65) < 1e-9, "Basilisk guest stacks 75% then 35%");
assert(guestHpMul("wraith", 10) === 1, "dedicated-wave Wraith mul unused at 1");
assert(guestHpMul("basilisk", 45) === 0.75 * 0.65, "n>=36 basilisk mul still stacks if marked guest");
assert(guestHpMul("wraith", 20) === 1, "pre-36 Wraith guests not extra-cut");
assert(guestHpMul("wraith", 35) === 1, "wave 35 not guest-cut");
assert(Math.abs(guestHpMul("wraith", 36) - 0.75 * 0.65) < 1e-9, "post-35 Wraith guests extra-cut");

assert(galaga.indexOf("if (atk === \"constrict\") return;") >= 0, "constrict never begins");
assert(galaga.split("if (atk === \"constrict\") return;").length - 1 >= 2, "constrict never fires");

assert(sw.indexOf("galaga-coop-v50") >= 0, "PWA cache bump");

console.log("wraith-basilisk-nerf-smoke: ok");
