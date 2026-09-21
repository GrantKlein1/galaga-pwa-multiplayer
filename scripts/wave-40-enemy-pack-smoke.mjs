import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");

// Roster + staggered debuts (regulars only, never bosses).
assert(/function lateDebutWave\(type\)/.test(galaga), "lateDebutWave helper");
assert(/function isLateElite\(type\)/.test(galaga), "isLateElite helper");
assert(galaga.indexOf('if (type === "lancer") return 40;') >= 0, "lancer debut 40");
assert(galaga.indexOf('if (type === "juggernaut") return 41;') >= 0, "juggernaut debut 41");
assert(galaga.indexOf('if (type === "mirage") return 44;') >= 0, "mirage debut 44");
assert(galaga.indexOf('if (type === "tether") return 47;') >= 0, "tether debut 47");
assert(galaga.indexOf('if (type === "sower") return 50;') >= 0, "sower debut 50");

function lateDebutWave(type) {
  if (type === "lancer") return 40;
  if (type === "juggernaut") return 41;
  if (type === "mirage") return 44;
  if (type === "tether") return 47;
  if (type === "sower") return 50;
  return 0;
}

var ids = ["juggernaut", "lancer", "mirage", "tether", "sower"];
var debuts = { lancer: 40, juggernaut: 41, mirage: 44, tether: 47, sower: 50 };
var i, id;
for (i = 0; i < ids.length; i++) {
  id = ids[i];
  assert(lateDebutWave(id) === debuts[id], id + " debut " + debuts[id]);
  assert(lateDebutWave(id) >= 40, id + " never before 40");
}
assert(lateDebutWave("archon") === 0, "archon is not a late elite");
assert(lateDebutWave("seraph") === 0, "bosses have no late debut");

// Stats: colors, HP bands, radii, points.
for (i = 0; i < ids.length; i++) {
  assert(galaga.indexOf('"' + ids[i] + '"') >= 0, id + " referenced");
}
assert(galaga.indexOf('if (type === "juggernaut") return "#ff3d6e";') >= 0, "juggernaut color");
assert(galaga.indexOf('if (type === "lancer") return "#f2f5ff";') >= 0, "lancer color");
assert(galaga.indexOf('if (type === "mirage") return "#c4a0ff";') >= 0, "mirage color");
assert(galaga.indexOf('if (type === "tether") return "#ffb84d";') >= 0, "tether color");
assert(galaga.indexOf('if (type === "sower") return "#8ad86b";') >= 0, "sower color");

function archonHp(n) { return 16 + 5 * Math.max(0, Math.floor((n - 8) / 5)); }
function jugHp(n) { return Math.round(archonHp(n) * 1.3); }

assert(galaga.indexOf("Math.round((16 + 5 * Math.max(0, Math.floor((n - 8) / 5))) * 1.3)") >= 0, "juggernaut ~1.3x archon curve");
assert(jugHp(41) === 60 && archonHp(41) === 46, "wave-41 juggernaut 60 vs archon 46");
assert(jugHp(60) > archonHp(60), "juggernaut stays above archon");
assert(galaga.indexOf('else if (type === "tank" || type === "lancer") hp = 3 + Math.floor(n / 12);') >= 0, "lancer tank band");
assert(galaga.indexOf('else if (type === "mortar" || type === "tether") hp = 2 + Math.floor(n / 20);') >= 0, "tether mortar band");
assert(galaga.indexOf('else if (type === "mirage") hp = 2 + Math.floor(n / 18);') >= 0, "mirage low band");
assert(galaga.indexOf('else if (type === "hex" || type === "harrier" || type === "sower") hp = 2;') >= 0, "sower hex band");
assert(galaga.indexOf('if (type === "juggernaut") return 14;') >= 0, "juggernaut radius");
assert(galaga.indexOf('else if (type === "juggernaut") base = 500;') >= 0, "juggernaut 500 pts");
assert(galaga.indexOf('else if (type === "lancer") base = 220;') >= 0, "lancer 220 pts");
assert(galaga.indexOf('else if (type === "mirage") base = 260;') >= 0, "mirage 260 pts");
assert(galaga.indexOf('else if (type === "tether") base = 200;') >= 0, "tether 200 pts");
assert(galaga.indexOf('else if (type === "sower") base = 180;') >= 0, "sower 180 pts");
assert(galaga.indexOf("var pts = e.decoy ? 0 : enemyPts(e.type, diving);") >= 0, "decoys worth 0");
assert(galaga.indexOf("} else if (e.decoy) {") >= 0, "decoys drop no loot");

// Spawn: late mixer gates, elite-budget injection, defensive caps.
assert(galaga.indexOf('if (n >= 47 && i % 4 === 1) return "tether";') >= 0, "mixer tether gate");
assert(galaga.indexOf('if (n >= 40 && i % 5 === 4) return "lancer";') >= 0, "mixer lancer gate");
assert(galaga.indexOf('if (n >= 44 && i % 6 === 5) return "mirage";') >= 0, "mixer mirage gate");
assert(galaga.indexOf('if (n >= 50 && i % 4 === 3) return "sower";') >= 0, "mixer sower gate");
assert(galaga.indexOf('if (n >= 40) types.push("lancer");') >= 0, "inject lancer gate");
assert(galaga.indexOf('if (n >= 44) types.push("mirage");') >= 0, "inject mirage gate");
assert(galaga.indexOf('if (n >= 47) types.push("tether");') >= 0, "inject tether gate");
assert(galaga.indexOf('if (n >= 50) types.push("sower");') >= 0, "inject sower gate");
assert(galaga.indexOf("if (n >= 41 && !typeCount.juggernaut && added < cap) {") >= 0, "juggernaut inside elite cap");
assert(galaga.indexOf('slots[bi].type !== "archon"') >= 0, "juggernaut never takes archon slot");
assert(galaga.indexOf("function capLateElites(slots, n)") >= 0, "cap pass");
assert(galaga.indexOf("capLateElites(slots, n);") >= 0, "cap pass wired into buildSlots");
assert(galaga.indexOf('kept = t === "juggernaut" ? 1 : 2;') >= 0, "juggernaut max 1, others max 2");
assert(galaga.indexOf("if (isBossWave(n) || n < lateDebutWave(t)) {") >= 0, "caps strip early/boss-wave elites");

// Behavior: formation flags, dive weight, per-type updates, shield, mines.
assert(galaga.indexOf('|| type === "juggernaut" || type === "mirage" || type === "tether" || type === "sower"') >= 0, "new holders stay in form");
assert(galaga.indexOf('e.type === "lancer" ? 4 :') >= 0, "lancers dive often");
assert(galaga.indexOf("function updateJuggernaut(e, dt)") >= 0, "juggernaut aimed 2-shot");
assert(galaga.indexOf("function updateLancerForm(e, dt)") >= 0, "lancer form fire");
assert(galaga.indexOf("function updateMirage(e, dt)") >= 0, "mirage blink");
assert(galaga.indexOf("function spawnMirageDecoy(e)") >= 0, "mirage decoy spawner");
assert(galaga.indexOf("function updateTether(e, dt)") >= 0, "tether link aura");
assert(galaga.indexOf("function updateSower(e, dt)") >= 0, "sower mines");
assert(galaga.indexOf('addTele("line", e.sx, e.sy, e.ex, e.ey, 0.45, "#d0ff4d");') >= 0, "lancer lane telegraph");
assert(galaga.indexOf('if (e.type === "juggernaut" && !e.decoy && (b.vy || 0) < 0 && b.y > e.y) {') >= 0, "prow shield blocks shots from below");
assert(galaga.indexOf("// Spore mines pop harmlessly when shot") >= 0, "mines pop on shot");
assert(galaga.indexOf("mine: true, fuse: 2.0, r: 4.5, pellets: 5") >= 0, "short-life spore mine");

// Art: distinct silhouettes + tether link.
assert(galaga.indexOf('} else if (e.type === "juggernaut") {') >= 0, "juggernaut art");
assert(galaga.indexOf('} else if (e.type === "lancer") {') >= 0, "lancer art");
assert(galaga.indexOf('} else if (e.type === "mirage") {') >= 0, "mirage art");
assert(galaga.indexOf('} else if (e.type === "tether") {') >= 0, "tether art");
assert(galaga.indexOf('} else if (e.type === "sower") {') >= 0, "sower art");
assert(galaga.indexOf('e.type === "tether" && e.tetherX != null') >= 0, "tether link line");

// Co-op codec + PWA cache.
assert(codec.indexOf('"juggernaut", "lancer", "mirage", "tether", "sower"') >= 0, "codec enemy ids");
assert(/var VER = 6;/.test(codec), "codec VER bumped for new ids");
assert(sw.indexOf("galaga-coop-v50") >= 0, "PWA cache bump");

console.log("wave-40-enemy-pack-smoke: ok  elites=" + ids.length);
