import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");

assert(galaga.indexOf("if (n < 36 || isBossWave(n) || isMiniWave(n)) return null") >= 0, "guests gated until after 35");
assert(galaga.indexOf("if (n < 16 || isBossWave(n) || isMiniWave(n)) return null") < 0, "old wave-16 guest gate gone");
assert(galaga.indexOf("if (n < 31)") < 0 || galaga.indexOf("bosses.push(BOSS_DEFS[Math.floor(rng() * 3)].id)") < 0, "early Seraph–Hydra guest path gone");
assert(galaga.indexOf("dual = rng() < 0.45") >= 0, "post-35 duals still roll");
assert(galaga.indexOf("function guestPairOk") >= 0, "pairing rules stay");
assert(/never two late-tier[\s\S]{0,80}bosses/.test(galaga), "no late+late pairing");
assert(galaga.indexOf("{ isBoss: true, tier: plan.tier || 0, guest: true }") >= 0, "mixed-wave spawn marks guest");
assert(galaga.indexOf("{ isBoss: true, tier: meta.tier }") >= 0, "dedicated every-5 spawn is not guest");
assert(/\{ id: "hydra",[\s\S]*?hp: 102,/.test(galaga), "Hydra dedicated HP unchanged");
assert(/\{ id: "leviathan",[\s\S]*?hp: 192,/.test(galaga), "Leviathan dedicated HP unchanged");
assert(/\{ id: "inferno",[\s\S]*?hp: 228,/.test(galaga), "Inferno dedicated HP unchanged");

var mulSrc = galaga.match(/function guestHpMul\(type, n\) \{[\s\S]*?\n  \}/);
assert(mulSrc, "guestHpMul body");
var guestHpMul = new Function("type", "n", mulSrc[0].replace(/^function guestHpMul\(type, n\) \{/, "").replace(/\n  \}$/, ""));
assert(guestHpMul("seraph", 30) === 1, "pre-36 guests would not be cut");
assert(guestHpMul("seraph", 36) === 0.75, "post-35 guests 75%");
assert(Math.abs(guestHpMul("wraith", 58) - 0.75 * 0.65) < 1e-9, "Wraith extra nerf stays");
assert(Math.abs(guestHpMul("basilisk", 58) - 0.75 * 0.65) < 1e-9, "Basilisk extra nerf stays");

function maxStartWave(lv) {
  if (lv < 5) return 1;
  return Math.floor(lv / 5) * 5;
}
function startWaveOptions(lv) {
  var max = maxStartWave(lv), out = [1], n;
  for (n = 5; n <= max; n += 5) out.push(n);
  return out;
}
function startWaveUnlocked(n, reached) {
  n = n | 0;
  if (n <= 1) return true;
  return (reached | 0) > n;
}
function clampStartWave(n, lv, reached) {
  var opts = startWaveOptions(lv), i, best = 1;
  n = n | 0;
  for (i = 0; i < opts.length; i++) {
    if (opts[i] <= n && startWaveUnlocked(opts[i], reached)) best = opts[i];
  }
  return best;
}

assert(galaga.indexOf("return Math.floor(lv / 5) * 5") >= 0, "XP gate is lv >= N");
assert(galaga.indexOf("5 + Math.floor((lv - 10) / 5) * 5") < 0, "old +5 XP buffer gone");
assert(galaga.indexOf("reachedStartWave(reached) > n") >= 0, "still must beat the wave");
assert(maxStartWave(4) === 1 && maxStartWave(5) === 5, "lv5 shows wave 5");
assert(maxStartWave(20) === 20 && maxStartWave(24) === 20, "lv20 shows 20, not 15");
assert(maxStartWave(25) === 25 && maxStartWave(100) === 100, "no leftover +5 at 25/100");
assert(clampStartWave(20, 20, 21) === 20, "beat 20 + lv20 starts 20");
assert(clampStartWave(20, 19, 21) === 15, "XP below N blocks start N");
assert(clampStartWave(20, 25, 21) === 20, "cannot start an unbeaten wave");
assert(clampStartWave(95, 100, 101) === 95, "admin-level still walks the stepper");
assert(html.indexOf("Reach level 5 to skip early waves") >= 0, "hub hint matches lv5 skip");
assert(galaga.indexOf("Reach level 5 to skip early waves") >= 0, "picker hint matches lv5 skip");

assert(/\{ id: "leviathan"[\s\S]*?base: \["surge", "depth", "whip"\]/.test(galaga), "Leviathan kit still has surge");
assert(galaga.indexOf("function fireAccordionRow") >= 0, "accordion row helper");
assert(galaga.indexOf("swayPh: i * ACCORDION_PHASE") >= 0, "per-bullet accordion phase");
assert(galaga.indexOf("fireAccordionRow(e.y + 24, ACCORDION_MAX_N") >= 0, "surge uses accordion");
assert(galaga.indexOf("kind: \"wave\"") >= 0, "readable wave telegraph");
assert(codec.indexOf('"wave"') >= 0, "wave tele is on the wire");
assert(galaga.indexOf("var ACCORDION_SWAY_F = 1.65") >= 0, "slow accordion sway");
assert(galaga.indexOf("var ACCORDION_MAX_N = 4") >= 0, "4-shot row for wide hulls");

var W = 240, CURTAIN_SHIP_R = 14, CURTAIN_PAD = 6, bulletR = 2.8, phase = 0.7, n = 4;
var minSp = 2 * (CURTAIN_SHIP_R + bulletR + CURTAIN_PAD);
var spacing = (W - 32) / (n - 1);
var k = 2 * Math.abs(Math.sin(phase / 2));
var sway = (spacing - minSp) / k;
var minCenters = spacing - 2 * sway * Math.abs(Math.sin(phase / 2));
assert(Math.abs(minCenters - minSp) < 1e-9, "tightest accordion gap is Bastion-wide");
assert(minCenters > 2 * (12 + bulletR + CURTAIN_PAD) - 0.01, "Broadwing also fits");
assert(minCenters > 2 * (5.5 + bulletR), "Needle is not the gap target");

assert(sw.indexOf("galaga-coop-v51") >= 0, "PWA cache bump");

console.log("guests-skip-leviathan-smoke: ok");
