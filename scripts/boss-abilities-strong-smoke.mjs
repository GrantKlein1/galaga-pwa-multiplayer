import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var docs = fs.readFileSync(new URL("../docs/boss-abilities.md", import.meta.url), "utf8");

assert(galaga.indexOf("function bossAbAim") >= 0, "aim helper");
assert(galaga.indexOf("function bossAbRayEnd") >= 0, "lasers extend to the field edge");
assert(galaga.indexOf("function bossAbScaleR") >= 0, "player casts are sized up");
assert(galaga.indexOf("function bossAbScalePad") >= 0, "lasers are widened on the player path");
assert(galaga.indexOf("bossAbFan(who, def, who.x, y)") >= 0, "fans still fire");
assert(/id: "seraph-fan"[\s\S]{0,240}n: 5, spread: 1\.15, spd: 240, dmg: 28/.test(galaga), "Seraph fan keeps 5 shots at player-scale damage");
assert(/id: "seraph-halo"[\s\S]{0,200}n: 8, spd: 170, dmg: 28, r: 3\.2/.test(galaga), "Seraph halo keeps the 8-shot ring");
assert(/id: "hydra-beam"[\s\S]{0,160}dmg: 110/.test(galaga), "siphon laser chunks bosses");
assert(/id: "colossus-missiles"[\s\S]{0,180}n: 3, spd: 190, dmg: 40/.test(galaga), "Colossus missiles keep a 3-count");
assert(/id: "over-decree"[\s\S]{0,140}dmg: 140/.test(galaga), "decree smash hurts bosses");
assert(/id: "helios-glare"[\s\S]{0,140}dmg: 80/.test(galaga), "glare hits every foe hard");
assert(/id: "lode-pulsar"[\s\S]{0,180}n: 5, spread: 0\.64/.test(galaga), "Lodestar pulsar keeps 5+5");
assert(/id: "prism-split"[\s\S]{0,180}n: 3[\s\S]{0,80}pierce: 6/.test(galaga), "Prism split stays 3 piercing lances");
assert(/id: "seraph-fan"[\s\S]{0,240}cd: 3\.4/.test(galaga), "fan CDs shortened");
assert(/id: "hour-rewind"[\s\S]{0,240}cd: 5\.5/.test(galaga), "longest CD is timeslip at 5.5s");
assert(galaga.indexOf('cd: 5.5, kind: "fan"') < 0, "old 5.5s fan CDs are gone");
assert(galaga.indexOf("dmg: opt.dmg == null ? 1.2") < 0, "chip default is gone");
assert(galaga.indexOf("dmg: opt.dmg == null ? 8") < 0, "old boss-kit default is gone");
assert(galaga.indexOf("opt.dmg == null ? 28") >= 0, "player-scale default");
assert(galaga.indexOf("pierce: opt.pierce == null ? 4") >= 0, "volleys pierce a column");
assert(galaga.indexOf("splash: opt.splash || { r: 22") >= 0, "ability shots splash nearby hulls");
assert(galaga.indexOf("if (b.bossAb) return false") >= 0, "ability shots punch through boss panes");
assert(galaga.indexOf("if (b.bossAb) br += 4") >= 0, "ability shots get a wider hit pad");
assert(galaga.indexOf("if (b.bossAb) break") >= 0, "spore mines do not eat ability shots");
assert(galaga.indexOf("* 13") >= 0 && galaga.indexOf("kind: \"curtain\"") >= 0, "curtains are denser");
assert(galaga.indexOf("killEnemy(e, false, dmg, owner ? owner.slot : 0)") >= 0, "rings and wells burst on first contact");
assert(sw.indexOf("galaga-coop-v72") >= 0, "PWA cache bump");
assert(docs.indexOf("player-scale") >= 0, "docs match");
assert(docs.indexOf("3.4s") >= 0 && docs.indexOf("| 14s |") < 0, "docs list the shorter cooldowns");
assert(docs.indexOf("`seraph-fan`") >= 0 && docs.indexOf("`axiom-mix`") >= 0, "ids still listed");

console.log("boss-abilities-strong-smoke: ok");
