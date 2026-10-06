import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var js = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");

var FIRE_MS = 212;
function rate(cd) {
  return 1000 / (cd * FIRE_MS / 140);
}
function stDps(g) {
  var per = g.dmg * g.shots;
  if (g.bolt) per += (g.boltDmg || 2) / g.bolt;
  if (g.wallBounce) per *= 1.5;
  if (g.thread) per += Math.max(0.6, (g.dmg || 1) * 0.7);
  var dps = per * rate(g.cd);
  if (g.bell) dps += 2 / g.bell;
  return dps;
}
function parseGun(id) {
  var m = js.match(new RegExp('\\{ id: "' + id + '",[^\\n]+\\}'));
  assert(m, "gun " + id);
  var row = m[0];
  var shots = row.match(/shots: \[([\s\S]*?)\]/);
  assert(shots, id + " shots");
  var g = {
    id: id,
    dmg: Number((row.match(/dmg: ([0-9.]+)/) || [])[1]),
    cd: Number((row.match(/cd: ([0-9.]+)/) || [])[1]),
    shots: (shots[1].match(/\{/g) || []).length,
    bolt: /bolt: (\d+)/.test(row) ? Number(row.match(/bolt: (\d+)/)[1]) : 0,
    boltDmg: /boltDmg: ([0-9.]+)/.test(row) ? Number(row.match(/boltDmg: ([0-9.]+)/)[1]) : 0,
    splash: /splash: \{ r: (\d+), dmg: ([0-9.]+) \}/.test(row),
    thread: /thread: ([0-9.]+)/.test(row) ? Number(row.match(/thread: ([0-9.]+)/)[1]) : 0,
    bell: /bell: ([0-9.]+)/.test(row) ? Number(row.match(/bell: ([0-9.]+)/)[1]) : 0,
    wallBounce: /wallBounce: (\d+)/.test(row)
  };
  g.dps = stDps(g);
  return g;
}

var storm = parseGun("storm");
var nova = parseGun("novacannon");
var prism = parseGun("prism");
var loom = parseGun("loomthread");
var requiem = parseGun("requiem");
var lance = parseGun("axiomlance");

assert(storm.shots === 1 && storm.bolt === 5 && storm.boltDmg === 2 && storm.cd === 60, "Storm keeps rapid fire + every-5th bolt");
assert(nova.shots === 1 && nova.splash && nova.dmg === 6 && nova.cd === 320, "Nova Cannon keeps splash shell");
assert(prism.shots === 3 && /pierce: 2/.test(js.match(/\{ id: "prism",[^\n]+\}/)[0]), "Prism keeps triple beam");
assert(loom.shots === 2 && loom.thread === 0.4, "Loomthread keeps paired shots + thread");
assert(requiem.shots === 1 && requiem.bell === 3 && requiem.cd === 70, "Requiem Bell keeps fast shots + 3s half-ring");
assert(lance.shots === 1 && lance.wallBounce && /pierce: 3/.test(js.match(/\{ id: "axiomlance",[^\n]+\}/)[0]), "Axiom Lance keeps pierce + bounce");

assert(Math.abs(prism.dps - 25) < 0.05, "Prism 25 DPS, got " + prism.dps);
assert(storm.dps <= 25 && nova.dps <= 25, "legendaries at or below 25");
assert(storm.dps < loom.dps && storm.dps < requiem.dps && storm.dps < lance.dps, "Storm below every Relic");
assert(nova.dps < loom.dps && nova.dps < requiem.dps && nova.dps < lance.dps, "Nova below every Relic");
assert(prism.dps < loom.dps && prism.dps < requiem.dps && prism.dps < lance.dps, "Prism below every Relic");
assert(loom.dps >= 27 && loom.dps < 28, "Loomthread near 27, got " + loom.dps);
assert(requiem.dps > 29 && requiem.dps < 32, "Requiem Bell in the middle, got " + requiem.dps);
assert(lance.dps > 34.8 && lance.dps <= 35.05, "Axiom Lance near 35, got " + lance.dps);
assert(loom.dps !== requiem.dps && requiem.dps !== lance.dps && loom.dps < requiem.dps && requiem.dps < lance.dps, "Relics each different, Loom < Bell < Lance");
assert(loom.dps <= 35 && requiem.dps <= 35 && lance.dps <= 35.05, "Relics in 27-35");

assert(js.indexOf("if (g.thread) per += Math.max(0.6, (g.dmg || 1) * 0.7)") >= 0, "hangar DPS counts thread");
assert(js.indexOf("if (g.wallBounce) per *= 1.5") >= 0, "hangar DPS counts bounce bonus");
assert(js.indexOf("g.bell ? 2 / g.bell : 0") >= 0, "hangar DPS counts bell");

assert(js.indexOf("next = cur + dir * 5") >= 0, "start-wave stepper untouched");
assert(js.indexOf("Admin: every 5 waves") >= 0, "start-wave admin copy untouched");
assert(/var VER = 13;/.test(codec), "codec VER unchanged");
assert(sw.indexOf("galaga-coop-v78") >= 0, "PWA cache bump");

console.log("gun-dps-rebalance-smoke: ok  storm=" + storm.dps.toFixed(1)
  + " nova=" + nova.dps.toFixed(1)
  + " prism=" + prism.dps.toFixed(1)
  + " loom=" + loom.dps.toFixed(1)
  + " requiem=" + requiem.dps.toFixed(1)
  + " lance=" + lance.dps.toFixed(1));
