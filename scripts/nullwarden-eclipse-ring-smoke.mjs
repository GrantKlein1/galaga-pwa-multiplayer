import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");

var nw = galaga.match(/\{ id: "nullwarden",[\s\S]*?flavor: "[^"]+" \}/);
assert(nw, "Nullwarden def present");
assert(nw[0].indexOf('base: ["well", "gates", "collapse"]') >= 0, "base kit stays wells/gates/collapse");
assert(nw[0].indexOf('p2: ["voidguard", "eclipse", "riftstep"]') >= 0, "p2 kit stays eclipse/riftstep");
assert(nw[0].indexOf('t1: ["singularity"]') >= 0 && nw[0].indexOf('t2: ["gates2"]') >= 0, "tier extras stay");

assert(galaga.indexOf("eclipseRing(e, 160, 0.62, 148, opt)") >= 0, "eclipse ring radius 160");
assert(galaga.indexOf("eclipseRing(e, 128, 0.48, 168, { color: \"#e0c8ff\", glow: col })") >= 0, "eclipse2 ring radius 128");
assert(galaga.indexOf("eclipseRing(e, 92,") < 0, "old eclipse radius 92 gone");
assert(galaga.indexOf("eclipseRing(e, 58,") < 0, "old eclipse2 radius 58 gone");

var ring = galaga.match(/function eclipseRing\(e, rad, hang, spd, opt\) \{[\s\S]*?\n  \}/);
assert(ring, "eclipseRing helper");
assert(ring[0].indexOf("clamp(e.aimX + Math.cos(a) * rad, -14, W + 14)") >= 0, "x spawn can sit off-screen");
assert(ring[0].indexOf("clamp(e.aimY + Math.sin(a) * (rad * 0.7), -18, H + 12)") >= 0, "y spawn can sit off-screen");
assert(ring[0].indexOf("clamp(e.aimX + Math.cos(a) * rad, 10, W - 10)") < 0, "old on-screen x clamp gone");
assert(ring[0].indexOf("pauseT: hang, resumeSpd: spd") >= 0, "hang then lunge inward stays");

assert(galaga.indexOf('} else if (atk === "collapse" || atk === "eclipse") {\n      addTele("ring", e.aimX, e.aimY, 0, 0, delay + 0.22, col)') >= 0, "eclipse telegraph stays");
assert(galaga.indexOf("Math.cos(a) * 118") >= 0 && galaga.indexOf("Math.sin(a) * 118") >= 0, "collapse circle unchanged");
assert(galaga.indexOf("{ isBoss: true, tier: plan.tier || 0, guest: true }") >= 0, "guests still spawn through shared boss fire");
assert(galaga.split("function eclipseRing").length - 1 === 1, "one shared eclipse ring helper");

assert(sw.indexOf("galaga-coop-v70") >= 0, "PWA cache bump");

console.log("nullwarden-eclipse-ring-smoke: ok");
