import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");

assert(galaga.indexOf('type === "juggernaut" ? 3 + Math.floor(wave / 20) + extraPlayers()') >= 0, "juggernaut spawns with shieldHp");
assert(galaga.indexOf("Prow shield: shots arriving from below spark off") < 0, "infinite prow absorb gone");
assert(galaga.indexOf('if (e.type === "juggernaut" && !e.decoy && (b.vy || 0) < 0 && b.y > e.y)') < 0, "no undamageable front block");
assert(galaga.indexOf('fromPerk === "pierce" && e.type === "juggernaut"') >= 0, "pierce skips juggernaut plate");
assert(galaga.indexOf("var pierceJug = e.type === \"juggernaut\" && b.pierce > 0;") >= 0, "pierce flag on hit");
assert(galaga.indexOf('pierceJug ? "pierce" : undefined') >= 0, "killEnemy gets pierce perk");
assert(galaga.indexOf("if (e.shieldHp > 0)") >= 0, "other shields still chip first");

assert(galaga.indexOf("function blinkMirage(e)") >= 0, "blink helper");
assert(galaga.indexOf("e.offX = next;") >= 0, "hop writes offX so formation snap keeps it");
assert(galaga.indexOf("e.x = clamp(e.x + (e.x < W / 2 ? 34 : -34)") < 0, "old one-frame e.x hop gone");
assert(galaga.indexOf("function mirageThreatened(e)") >= 0, "threat from shots or lined-up player");
assert(galaga.indexOf("k.sourceId = e.id;") >= 0, "one decoy per mirage");
assert(galaga.indexOf("e.mirageHop") >= 0, "idle hop timer so it blinks without being shot");
assert(galaga.indexOf('addTele("line", fromX, fromY, e.x, e.y, 0.28, "#e8d0ff")') >= 0, "readable blink telegraph");

assert(sw.indexOf("galaga-coop-v51") >= 0, "PWA cache bump");

console.log("juggernaut-mirage-fix-smoke: ok");
