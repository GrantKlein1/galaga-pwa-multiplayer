import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");
var post = fs.readFileSync(new URL("../docs/post-55-bosses.md", import.meta.url), "utf8");
var roster = fs.readFileSync(new URL("../docs/boss-roster.md", import.meta.url), "utf8");
var pvp = fs.readFileSync(new URL("../js/pvp.js", import.meta.url), "utf8");

assert(sw.indexOf("galaga-coop-v79") >= 0, "PWA cache bump");
assert(/var VER = 14;/.test(codec), "codec VER 13");

assert(galaga.indexOf('if (fight.dark && !(b.glintT > 0) && !inFightLight(b.x, b.y)) continue') < 0, "Lanternmoth shots are not skipped in the dark");
assert(galaga.indexOf('rgba(2, 2, 10, 0.88)') < 0, "no full blackout overlay");
assert(galaga.indexOf('fill("evenodd")') < 0, "no evenodd lantern cutout");
assert(galaga.indexOf("rgba(10, 8, 18, 0.38)") >= 0, "dim field overlay");
assert(galaga.indexOf("drawFightDark(ctx)") >= 0, "dim overlay still drawn");
assert(galaga.indexOf("Shots that stay visible") >= 0, "lanternmoth copy");
assert(post.indexOf("Enemy shots stay visible everywhere") >= 0, "docs say shots stay visible");

assert(galaga.indexOf("function startTerminusSweep") >= 0, "terminus p2 sweep helper");
assert(galaga.indexOf("function updateTerminusSweep") >= 0, "terminus p2 update");
assert(galaga.indexOf("startTerminusSweep()") >= 0, "phase 2 starts the sweep");
assert(galaga.indexOf("function fightMidY") >= 0 && galaga.indexOf("return H / 2;") >= 0, "movement midline stays H/2");
assert(galaga.indexOf("slamBox(W / 2, (fight.midY + H) * 0.5") < 0, "old invert slam trap gone");
assert(galaga.indexOf("fight.midY += fight.midDir * 22 * dt") < 0, "old sliding clamp gone");
assert(galaga.indexOf("tryHitPlayersRect((fight.scytheGapX - gap) * 0.5") >= 0, "sweep hurts outside the gap");
assert(galaga.indexOf("addZone(gx, cy, fight.scytheGapW || 38, 14, delay, FIGHT_CYAN)") >= 0, "gap is telegraphed");
assert(pvp.indexOf('name: "Sweep"') >= 0, "pvp invert ability renamed");
assert(post.indexOf("Stand in the gap") >= 0, "docs describe the gap");

assert(/\{ id: "hourglass",[\s\S]*?cd: 0\.98,/.test(galaga), "Hourglass fires more often");
assert(galaga.indexOf("cd: 2.9, kind: \"fan\", n: 6, spread: 0.88") >= 0, "hour-sand ability cd 2.9");
assert(galaga.indexOf("cd: 3.2, kind: \"curtain\", n: 4") >= 0, "hour-pile ability cd 3.2");
assert(galaga.indexOf("8.5 + boss.phaseIdx * 4.5 + Math.min(12, Math.max(0, time - boss.sandBorn) * 0.65)") >= 0, "sand rise speeds up with phase and time");
assert(galaga.indexOf("fight.sandH = 12 + idx * 12") >= 0, "sand starts a bit higher");
assert(galaga.indexOf("+ 5 + (e.phaseIdx || 0) * 2") >= 0, "pour dumps more sand");

assert(galaga.indexOf("hp: 50, alive: true, stump: false") >= 0, "Hydra debut heads 50 HP");
assert(galaga.indexOf("hp: 60, alive: true, stump: false") >= 0, "Hydra regrow heads 60 HP");
assert(post.indexOf("Head HP is 50") >= 0, "docs 50/60");
assert(roster.indexOf("10× head HP") >= 0, "roster notes stacked buff");

assert(galaga.indexOf("for (n = 5; n <= max; n += 5) out.push(n)") >= 0, "start-wave options always +5");
assert(galaga.indexOf("never 1-step in that range") >= 0, "past 100 stays on 5s");
assert(galaga.indexOf("next = cur + dir * 5") >= 0, "admin also steps by 5");
assert(galaga.indexOf("Admin: every 5 waves") >= 0, "admin picker copy");
assert(galaga.indexOf("Admin: any wave") < 0, "admin no longer 1-steps");

assert(galaga.indexOf("function axiomVolleyId") >= 0, "seal hits are grouped by volley");
assert(galaga.indexOf("function axiomFlushSealVolleys") >= 0, "wrong extras wait for the rest of the volley");
assert(galaga.indexOf("volleyId: volleyId") >= 0, "player shots carry volleyId");
assert(galaga.indexOf("if (row.ok)") >= 0, "correct seal in a volley ignores extras");
assert(post.indexOf("so spread is beatable") >= 0, "docs say spread works");

assert(galaga.indexOf("function hullIframeBonus") >= 0, "hull i-frame helper");
assert(galaga.indexOf("n += 0.36") >= 0 && galaga.indexOf("n += 0.2") >= 0 && galaga.indexOf("n += 0.24") >= 0, "hull bonuses cut ~20%");
assert(galaga.indexOf('desc: "+0.36s i-frames after a hit."') >= 0, "ablative copy");
assert(galaga.indexOf('desc: "+0.2s i-frames after a hit."') >= 0, "brace copy");
assert(galaga.indexOf('desc: "+0.24s i-frames after a hit."') >= 0, "ironclad copy");
assert(galaga.indexOf("guardianIframeBonus") >= 0 && galaga.indexOf("? 0.48 : 0") >= 0, "guardian +0.48s");
assert(galaga.indexOf("invuln: 3.28") >= 0, "Phantom hangar bonus trimmed");
assert(galaga.indexOf("invuln: 2.8") >= 0, "Eclipse hangar bonus trimmed");
assert(galaga.indexOf("Math.max(who.invuln || 0, 0.32)") >= 0, "jade 0.32s");
assert(galaga.indexOf("Math.max(owner.invuln || 0, 0.44)") >= 0, "carrion 0.44s");
assert(galaga.indexOf("var INVULN = 2") >= 0, "base hit i-frames stay 2");

console.log("boss-fight-tuning-smoke: ok");
