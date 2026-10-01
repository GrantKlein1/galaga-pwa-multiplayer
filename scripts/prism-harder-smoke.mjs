import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var post = fs.readFileSync(new URL("../docs/post-55-bosses.md", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");

assert(galaga.indexOf('base: ["splitbeam", "shardfan", "lattice"]') >= 0, "Prism p1 keeps split beams plus fan and lattice");
assert(galaga.indexOf('p2: ["refract", "shardfan", "lattice", "ricochet"]') >= 0, "Prism p2 adds ricochet");
assert(galaga.indexOf('p3: ["crystal", "shardfan", "lattice", "ricochet", "gapring"]') >= 0, "Prism p3 adds gap ring");
assert(galaga.indexOf("function firePrismBeams") >= 0, "beam-split stays");
assert(galaga.indexOf("function prismShardFan") >= 0, "shard fan from each prism");
assert(galaga.indexOf("function prismLattice") >= 0, "cross lattice with cyan gaps");
assert(galaga.indexOf("function prismRicochet") >= 0, "wall-bounce ricochet");
assert(galaga.indexOf("function prismGapRing") >= 0, "gapped ring toward the player");
assert(galaga.indexOf("aimedWedge(list[i].x, list[i].y, tgt.x, tgt.y, 7, 0.62") >= 0, "fan is a dense 7-shot wedge at the live player");
assert(galaga.indexOf("bounce: true, bounceMax: 3") >= 0, "ricochet bounces on walls");
assert(galaga.indexOf("addZone(e.gapX, e.slamY, 14, 10, delay, FIGHT_CYAN)") >= 0, "lattice telegraphs cyan gaps");
assert(galaga.indexOf("obj.ang += Math.PI / 4;\n        explode(obj.x, obj.y, FIGHT_GOLD, false);") >= 0, "shooting a prism still rotates it");
assert(galaga.indexOf("obj.ang += Math.PI / 4;\n        obj.hp -= dmg") < 0, "prisms are not worn down by shots");
assert(galaga.indexOf("obj.alive = false;\n          boss = currentBoss();\n          if (boss) killEnemy(boss, false, Math.max(6, Math.round((boss.maxHp || 2300) * 0.02)), b.owner, \"prism\")") < 0, "shooting a prism no longer despawns it");
assert(galaga.indexOf("fight.prisms = [];") >= 0 && galaga.indexOf("function spawnPrisms") >= 0, "next phase still replaces the set");

assert(/var VER = 11;/.test(codec), "codec payload unchanged");
assert(sw.indexOf("galaga-coop-v71") >= 0, "PWA cache bump");
assert(post.indexOf("Prisms stay on the field until the next set spawns") >= 0, "docs say prisms persist");
assert(post.indexOf("shard fan") >= 0 && post.indexOf("red lattice") >= 0, "docs name the new p1 patterns");
assert(post.indexOf("bouncing ricochets") >= 0 && post.indexOf("gapped ring") >= 0, "docs name ricochet and gap ring");

console.log("prism-harder-smoke: ok");
