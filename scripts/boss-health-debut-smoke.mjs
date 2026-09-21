import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");

assert(/function bossDebutWave\(type\)/.test(galaga), "bossDebutWave helper");
assert(galaga.indexOf("return (i + 1) * BOSS_EVERY") >= 0, "debut = (index + 1) * BOSS_EVERY");
assert(/function bossDropsHealth\(e\)/.test(galaga), "bossDropsHealth gate");
assert(galaga.indexOf("if (!e || !e.isBoss || e.guest) return false") >= 0, "guests never drop health");
assert(galaga.indexOf("if ((e.tier || 0) !== 0) return false") >= 0, "later-cycle rematches skip health");
assert(galaga.indexOf("return wave === bossDebutWave(e.type)") >= 0, "only the debut wave");
assert(galaga.indexOf('if (bossDropsHealth(e)) spawnPickup(e.x, e.y, "heal")') >= 0, "guaranteed heal is gated");
assert(!/if \(guaranteed\) \{\s*spawnPickup\(e\.x, e\.y, "heal"\);/.test(galaga), "ungated guaranteed heal gone");
assert(galaga.indexOf("dropCoins(e, true)") >= 0, "boss coin pile stays");
assert(galaga.indexOf("maybeDrop(e, true)") >= 0, "boss finish still uses guaranteed drop path");
assert(galaga.indexOf("maybeDrop(e, false)") >= 0, "fodder still uses random drop path");
assert(galaga.indexOf('if (roll < lifeDropChance() * pc) spawnPickup(e.x, e.y, "life")') >= 0, "fodder 1UP unchanged");
assert(galaga.indexOf('else if (roll < healEnd) spawnPickup(e.x, e.y, "heal")') >= 0, "fodder heal unchanged");
assert(galaga.indexOf("function dropArchonLoot(e)") >= 0, "archon loot stays");
assert(galaga.indexOf('if (roll < lifeDropChance() * pc) spawnPickup(e.x, e.y - 8, "life")') >= 0, "archon 1UP stays");
assert(galaga.indexOf("{ isBoss: true, tier: plan.tier || 0, guest: true }") >= 0, "mixed-wave spawn still marks guest");
assert(galaga.indexOf("{ isBoss: true, tier: meta.tier }") >= 0, "dedicated every-5 spawn is not guest");
assert(galaga.indexOf("bossDebutWave: bossDebutWave") >= 0, "debug export debut wave");
assert(galaga.indexOf("bossDropsHealth: bossDropsHealth") >= 0, "debug export health gate");

var defs = galaga.match(/var BOSS_DEFS = \[([\s\S]*?)\n  \];/);
assert(defs, "BOSS_DEFS block");
var ids = [];
var m;
var idRe = /\{ id: "([a-z]+)"/g;
while ((m = idRe.exec(defs[1]))) ids.push(m[1]);
assert(ids[0] === "seraph" && ids[ids.length - 1] === "pentarch", "roster ends Seraph…Pentarch");
assert(ids.length === 16, "16 bosses");

var BOSS_EVERY = 5;
var expected = {
  seraph: 5, wraith: 10, hydra: 15, colossus: 20, chronos: 25,
  leviathan: 30, inferno: 35, nullwarden: 40, basilisk: 45, overlord: 50,
  mandala: 55, cenotaph: 60, kaleido: 65, helios: 70, selene: 75, pentarch: 80
};

function bossDebutWave(type) {
  var i;
  for (i = 0; i < ids.length; i++) {
    if (ids[i] === type) return (i + 1) * BOSS_EVERY;
  }
  return 0;
}

function bossDropsHealth(e, wave) {
  if (!e || !e.isBoss || e.guest) return false;
  if ((e.tier || 0) !== 0) return false;
  return wave === bossDebutWave(e.type);
}

var i, id, debut, rosterLoop;
for (i = 0; i < ids.length; i++) {
  id = ids[i];
  debut = expected[id];
  assert(debut === (i + 1) * BOSS_EVERY, id + " expected debut");
  assert(bossDebutWave(id) === debut, id + " helper debut " + debut);
  assert(bossDropsHealth({ isBoss: true, type: id, tier: 0 }, debut) === true, id + " drops health on debut " + debut);
  assert(bossDropsHealth({ isBoss: true, type: id, tier: 0, guest: true }, debut) === false, id + " guest on debut wave still no health");
  assert(bossDropsHealth({ isBoss: true, type: id, tier: 0 }, debut + 2) === false, id + " mixed wave after debut no health");
  rosterLoop = debut + ids.length * BOSS_EVERY;
  assert(bossDropsHealth({ isBoss: true, type: id, tier: 1 }, rosterLoop) === false, id + " +1 rematch wave " + rosterLoop + " no health");
}

assert(bossDropsHealth({ isBoss: true, type: "hydra", tier: 0 }, 15) === true, "Hydra wave 15 drops");
assert(bossDropsHealth({ isBoss: true, type: "hydra", tier: 0, guest: true }, 47) === false, "Hydra guest wave 47 no drop");
assert(bossDropsHealth({ isBoss: true, type: "hydra", tier: 0 }, 47) === false, "Hydra on 47 skipped even without guest flag");
assert(bossDropsHealth({ isBoss: true, type: "grunt", tier: 0 }, 15) === false, "fodder never uses boss health gate");
assert(bossDebutWave("not-a-boss") === 0, "unknown id has no debut");

assert(sw.indexOf("galaga-coop-v52") >= 0, "PWA cache bump");

console.log("boss-health-debut-smoke: ok  bosses=" + ids.length);
