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
assert(ids.length === 30, "30 roster bosses, got " + ids.length);
assert(ids[15] === "pentarch" && ids[16] === "loom" && ids[17] === "tessera", "85/90 ids");
assert(ids[18] === "requiem" && ids[19] === "terminus", "95/100 ids");
assert(ids[20] === "hourglass" && ids[24] === "orrery", "105-125 ids");

function meta(n) {
  var cycle = Math.max(0, Math.round(n / 5) - 1);
  return { type: ids[cycle % ids.length], tier: Math.floor(cycle / ids.length) };
}
assert(meta(80).type === "pentarch" && meta(80).tier === 0, "wave 80 Pentarch");
assert(meta(85).type === "loom" && meta(85).tier === 0, "wave 85 Loom, not Seraph+1");
assert(meta(90).type === "tessera" && meta(90).tier === 0, "wave 90 Tessera");
assert(meta(95).type === "requiem" && meta(95).tier === 0, "wave 95 Requiem");
assert(meta(100).type === "terminus" && meta(100).tier === 0, "wave 100 Terminus");
assert(meta(105).type === "hourglass" && meta(105).tier === 0, "wave 105 Hourglass");
assert(meta(125).type === "orrery" && meta(125).tier === 0, "wave 125 Orrery");
assert(meta(130).type === "prism" && meta(130).tier === 0, "wave 130 Prism");
assert(meta(155).type === "seraph" && meta(155).tier === 1, "+1 cycle starts at Seraph after Axiom");
assert(meta(235).type === "loom" && meta(235).tier === 1, "Loom +1");
assert(meta(250).type === "terminus" && meta(250).tier === 1, "Terminus +1");

assert(/\{ id: "loom",[\s\S]*?hp: 740,/.test(galaga), "Loom base HP 740");
assert(/\{ id: "tessera",[\s\S]*?hp: 790,/.test(galaga), "Tessera base HP 790");
assert(/\{ id: "requiem",[\s\S]*?hp: 850,/.test(galaga), "Requiem base HP 850");
assert(/\{ id: "terminus",[\s\S]*?hp: 1550,/.test(galaga), "Terminus base HP 1550");
assert(galaga.indexOf("p2Thresh: 2 / 3, p3Thresh: 1 / 3") >= 0, "3-phase 66/33 ticks");
assert(galaga.indexOf('p2Text: "IT REMEMBERS YOU"') < 0, "Echo banner is phase-enter, not p2Text");
assert(galaga.indexOf("IT REMEMBERS YOU") >= 0, "Echo banner");
assert(galaga.indexOf('p2Text: "THE LINE MOVES"') >= 0, "Inversion banner");
assert(galaga.indexOf('p3Text: "BREAK THEM IN ORDER"') >= 0, "Keystones banner");
assert(galaga.indexOf('p4Text: "THE WALLS CLOSE"') >= 0, "Collapse banner");
assert(galaga.indexOf('p5Text: "EVERYTHING ENDS"') >= 0, "Terminus banner");
assert(galaga.indexOf("WAVE 100 CLEARED") >= 0, "wave 100 victory banner");
assert(galaga.indexOf("var CENTURY_CLEAR_XP = 8000") >= 0, "Century Clear XP bonus");
assert(galaga.indexOf("run.xpBonus = (run.xpBonus || 0) + CENTURY_CLEAR_XP") >= 0, "bonus uses xpBonus path");
assert(galaga.indexOf("if (n === 100) xpBonus += CENTURY_CLEAR_XP") >= 0, "skip-start credits Century Clear");

["warp", "weft", "cocoon", "rook", "bishop", "knight", "cross", "mate", "hymn", "canon", "crescendo", "echo", "invert", "keystones", "collapse", "medley"].forEach(function (atk) {
  assert(galaga.indexOf('atk === "' + atk + '"') >= 0, "attack wired: " + atk);
});

assert(galaga.indexOf("function setupFightPhase") >= 0, "phase-scoped fight setup");
assert(galaga.indexOf("function resetFight") >= 0, "fight teardown");
assert(galaga.indexOf("fight.invert") >= 0 && galaga.indexOf("function fightMidY") >= 0, "phase-scoped midline");
assert(galaga.indexOf("ECHO_LAG = 3") >= 0, "echo ghost is 3s late");
assert(galaga.indexOf("fight.keysNeed") >= 0, "keystone core lock");
assert(galaga.indexOf("spawnPylons") >= 0, "collapse pylons");
assert(galaga.indexOf("fight.despair") >= 0, "5% desperation beam");
assert(galaga.indexOf("var GUEST_BOSS_POOL = 10") >= 0, "guests stay Seraph–Overlord");
assert(galaga.indexOf('fromPerk !== "choir"') >= 0, "Requiem body ignores shots until Crescendo");

assert(/hp: 740, spd:[\s\S]*?tele: 0\.36/.test(galaga), "Loom tele shorter than Pentarch");
assert(galaga.indexOf("tele: 0.5") >= 0, "Pentarch tele stays 0.5");
assert(galaga.indexOf("function tesseraBoardLive") >= 0, "Tessera board from phase 1");
assert(galaga.indexOf("function drawTesseraBoard") >= 0, "full chessboard draw");
assert(galaga.indexOf("function tesseraTileTele") >= 0 && galaga.indexOf("return 1.05") >= 0, "phase 1 tiles stay readable");
assert(galaga.indexOf('e.type === "tessera" && (e.phaseIdx || 0) <= 0) t = 0.8') >= 0, "phase 1 telegraph is slower");
assert(galaga.indexOf("function armTesseraVolley") >= 0, "phase 1 lights tiles during telegraph");
assert(galaga.indexOf("function fireTesseraVolley") >= 0, "later phases still spawn at fire");
assert(galaga.indexOf("t: st === 1 ? tesseraTileTele() : 0.28") >= 0, "later-phase fuse stays 0.28");
assert(galaga.indexOf("pickSafeTile") >= 0 && galaga.indexOf('fight.piece = "mate"') >= 0, "p2 safe tile and p3 mate stay");

assert(galaga.indexOf("function requiemGapTarget") >= 0, "Requiem gaps aim into the player band");
assert(galaga.indexOf("function requiemRingSpeed") >= 0, "Requiem ring speed by phase");
assert(galaga.indexOf("return 58") >= 0 && galaga.indexOf("return 72") >= 0, "p2/p3 rings slower than p1");
assert(galaga.indexOf("return 92") >= 0, "p1 ring speed stays 92");
assert(galaga.indexOf("spawnSoundRing(e, 0.55)") >= 0 && galaga.indexOf("spawnSoundRing(e, 1.1)") >= 0, "canon cadence is slower");
assert(galaga.indexOf("spawnSoundRing(e, 0.48)") >= 0, "crescendo cadence is slower");
assert(galaga.indexOf("spawnSoundRing(e, 0.28)") < 0 && galaga.indexOf("spawnSoundRing(e, 0.22)") < 0, "old stacked delays gone");
assert(galaga.indexOf("fight.reqOrigin") >= 0 && galaga.indexOf("fight.reqSafe") >= 0, "overlapping rings share one pocket");
assert(galaga.indexOf('e.type !== "requiem"') >= 0, "Requiem skipped the 0.22 turbo cadence");
assert(Math.round(1000 * 1.55) === 1550, "wave 100 HP is 1.55x prior 1000");

assert(codec.indexOf('"loom", "tessera", "requiem", "terminus"') >= 0, "netcodec boss ids");
assert(/var VER = 11;/.test(codec), "codec VER 11");
assert(codec.indexOf("BX_KINDS") >= 0 && codec.indexOf("writeBx") >= 0, "fight extras on the wire");
assert(codec.indexOf('"thread"') >= 0 && codec.indexOf('"midline"') >= 0, "thread and midline kinds");
assert(codec.indexOf('"keystone"') >= 0 && codec.indexOf('"pylon"') >= 0 && codec.indexOf('"ghost"') >= 0, "keystone/pylon/ghost kinds");

assert(pvp.indexOf("loom:") >= 0 && pvp.indexOf("terminus:") >= 0, "pvp kits");
assert(sw.indexOf("galaga-coop-v63") >= 0, "PWA cache bump");

console.log("wave-100-boss-smoke: ok");
