import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var docs = fs.readFileSync(new URL("../docs/boss-abilities.md", import.meta.url), "utf8");

assert(galaga.indexOf("function bossAbAim") >= 0, "aim helper");
assert(galaga.indexOf("function bossAbRayEnd") >= 0, "lasers extend to the field edge");
assert(galaga.indexOf("bossAbFan(who, def, who.x, y)") >= 0, "fans still fire");
assert(/id: "seraph-fan"[\s\S]{0,240}n: 5, spread: 1\.15, spd: 200, dmg: 8/.test(galaga), "Seraph fan matches the boss kit");
assert(/id: "seraph-halo"[\s\S]{0,200}n: 8, spd: 140, dmg: 8, r: 3\.2/.test(galaga), "Seraph halo matches the 8-shot ring");
assert(/id: "hydra-beam"[\s\S]{0,160}dmg: 36/.test(galaga), "siphon laser is lethal to fodder");
assert(/id: "colossus-missiles"[\s\S]{0,180}n: 3, spd: 160, dmg: 14/.test(galaga), "Colossus missiles keep a 3-count");
assert(/id: "over-decree"[\s\S]{0,140}dmg: 48/.test(galaga), "decree smash hurts bosses");
assert(/id: "helios-glare"[\s\S]{0,140}dmg: 24/.test(galaga), "glare hits every foe hard");
assert(/id: "lode-pulsar"[\s\S]{0,180}n: 5, spread: 0\.64/.test(galaga), "Lodestar pulsar keeps 5+5");
assert(/id: "prism-split"[\s\S]{0,180}n: 3[\s\S]{0,80}pierce: 2/.test(galaga), "Prism split stays 3 piercing lances");
assert(galaga.indexOf('cd: 8, kind: "fan"') < 0 || galaga.indexOf('id: "seraph-fan"') < galaga.indexOf('cd: 5.5, kind: "fan"'), "fan CDs shortened");
assert(galaga.indexOf("dmg: opt.dmg == null ? 1.2") < 0, "chip default is gone");
assert(galaga.indexOf("dmg: opt.dmg == null ? 8") >= 0, "boss-weight default");
assert(galaga.indexOf("killEnemy(e, false, dmg * dt * 2.2") >= 0, "gravity wells now damage");
assert(sw.indexOf("galaga-coop-v70") >= 0, "PWA cache bump");
assert(docs.indexOf("Damage is boss-weight") >= 0, "docs match");
assert(docs.indexOf("`seraph-fan`") >= 0 && docs.indexOf("`axiom-mix`") >= 0, "ids still listed");

console.log("boss-abilities-strong-smoke: ok");
