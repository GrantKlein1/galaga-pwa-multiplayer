import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");

assert(/function enemyXpMul\(type\)/.test(galaga), "enemyXpMul helper");
assert(/function enemyXpPts\(type, diving\)/.test(galaga), "enemyXpPts helper");
assert(galaga.indexOf("Math.round(enemyPts(type, diving) * enemyXpMul(type))") >= 0, "xp pts = pts * mul");
assert(galaga.indexOf("run.xpBonus = (run.xpBonus || 0) + Math.round(pts * (enemyXpMul(e.type) - 1))") >= 0, "kills add XP-only bonus");
assert(galaga.indexOf("score += pts;") >= 0, "displayed score still uses raw pts");
assert(galaga.indexOf("Math.round((score + (run.xpBonus || 0)) * XP_SCORE_MUL") >= 0, "finishRun banks score + xpBonus");
assert(galaga.indexOf("return { score: pts, xpBonus: xpBonus };") >= 0, "skip credit carries XP bonus");
assert(galaga.indexOf("run.xpBonus = (run.xpBonus || 0) + (credit.xpBonus || 0);") >= 0, "skip-start applies XP bonus");
assert(galaga.indexOf("coins: 0, xpBonus: 0, killsByType:") >= 0, "emptyRun tracks xpBonus");
assert(galaga.indexOf("enemyXpMul: enemyXpMul") >= 0, "debug export mul");

var mulSrc = galaga.match(/function enemyXpMul\(type\) \{[\s\S]*?\n  \}/);
assert(mulSrc, "enemyXpMul body");
var enemyXpMul = new Function("type", mulSrc[0].replace(/^function enemyXpMul\(type\) \{/, "").replace(/\n  \}$/, ""));

function pts(type) {
  var base = 50;
  if (type === "sniper") base = 80;
  else if (type === "weaver") base = 90;
  else if (type === "kami") base = 100;
  else if (type === "tank") base = 130;
  else if (type === "shield") base = 110;
  else if (type === "mortar") base = 160;
  else if (type === "hex") base = 180;
  else if (type === "harrier") base = 140;
  else if (type === "bulwark") base = 200;
  else if (type === "archon") base = 450;
  else if (type === "juggernaut") base = 500;
  else if (type === "lancer") base = 220;
  else if (type === "mirage") base = 260;
  else if (type === "tether") base = 200;
  else if (type === "sower") base = 180;
  else if (type === "seraph") base = 1500;
  return base;
}
function xpPts(type) { return Math.round(pts(type) * enemyXpMul(type)); }

assert(enemyXpMul("grunt") === 1, "grunt unchanged");
assert(enemyXpMul("sniper") === 1 && enemyXpMul("weaver") === 1, "fodder specialists unchanged");
assert(enemyXpMul("seraph") === 1 && enemyXpMul("pentarch") === 1, "bosses unchanged");
assert(enemyXpMul("kami") === 1.15, "kami bump");
assert(enemyXpMul("shield") === 1.2, "shield bump");
assert(enemyXpMul("tank") === 1.25, "tank bump");
assert(enemyXpMul("harrier") === 1.3, "harrier bump");
assert(enemyXpMul("mortar") === 1.35, "mortar bump");
assert(enemyXpMul("hex") === 1.4, "hex bump");
assert(enemyXpMul("sower") === 1.45, "sower bump");
assert(enemyXpMul("tether") === 1.5 && enemyXpMul("bulwark") === 1.5, "tether/bulwark bump");
assert(enemyXpMul("lancer") === 1.6, "lancer bump");
assert(enemyXpMul("mirage") === 1.7, "mirage bump");
assert(enemyXpMul("archon") === 2, "archon 2x");
assert(enemyXpMul("juggernaut") === 2.2, "juggernaut above archon");

assert(xpPts("grunt") === 50, "grunt XP = score");
assert(xpPts("archon") === 900, "archon 450 score -> 900 XP pts");
assert(xpPts("juggernaut") === 1100, "juggernaut 500 score -> 1100 XP pts");
assert(xpPts("lancer") === 352, "lancer 220 * 1.6");
assert(xpPts("mirage") === 442, "mirage 260 * 1.7");
assert(xpPts("tether") === 300, "tether 200 * 1.5");
assert(xpPts("sower") === 261, "sower 180 * 1.45");

var XP_SCORE_MUL = 0.15;
function bank(score, bonus) { return Math.round((score + bonus) * XP_SCORE_MUL); }
assert(bank(450, 0) === 68, "old archon XP");
assert(bank(450, 450) === 135, "new archon XP is double");
assert(bank(500, 0) === 75, "old juggernaut XP");
assert(bank(500, 600) === 165, "new juggernaut XP");
assert(bank(500, 600) > bank(450, 450), "juggernaut still out-banks archon");

assert(sw.indexOf("galaga-coop-v50") >= 0, "PWA cache bump");

console.log("harder-enemy-xp-smoke: ok");
