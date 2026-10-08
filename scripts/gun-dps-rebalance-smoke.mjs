import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var js = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");

var FIRE_MS = 212;
var TRIUNE_I = 2.2, TRIUNE_II = 2.2, TRIUNE_III = 12.8;
var RECURVE_BACK = 6.36;
function rate(cd) {
  return 1000 / (cd * FIRE_MS / 140);
}
function stDps(g) {
  var per = g.dmg * g.shots;
  if (g.bolt) per += (g.boltDmg || 2) / g.bolt;
  if (g.triune) per = (TRIUNE_I + TRIUNE_II + TRIUNE_III) / 3;
  if (g.steal) per += g.dmg;
  if (g.recurve) per += RECURVE_BACK;
  return per * rate(g.cd);
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
    triune: /triune: 1/.test(row),
    steal: /steal: 1/.test(row),
    recurve: /recurve: 1/.test(row)
  };
  g.dps = stDps(g);
  return g;
}

var storm = parseGun("storm");
var nova = parseGun("novacannon");
var prism = parseGun("prism");
var triune = parseGun("triune");
var antiphon = parseGun("antiphon");
var recurve = parseGun("recurve");

assert(storm.shots === 1 && storm.bolt === 5 && storm.boltDmg === 2 && storm.cd === 60, "Storm keeps rapid fire + every-5th bolt");
assert(nova.shots === 1 && nova.splash && nova.dmg === 6 && nova.cd === 320, "Nova Cannon keeps splash shell");
assert(prism.shots === 3 && /pierce: 2/.test(js.match(/\{ id: "prism",[^\n]+\}/)[0]), "Prism keeps triple beam");
assert(triune.shots === 1 && triune.triune && triune.dmg === 2.2 && triune.cd === 140, "Triune keeps the three-count");
assert(antiphon.shots === 1 && antiphon.steal && antiphon.dmg === 2.1 && antiphon.cd === 90, "Antiphon keeps the steal");
assert(recurve.shots === 1 && recurve.recurve && /pierce: 2/.test(js.match(/\{ id: "recurve",[^\n]+\}/)[0]), "Recurve keeps pierce");

assert(Math.abs(prism.dps - 25) < 0.05, "Prism 25 DPS, got " + prism.dps);
assert(storm.dps <= 25 && nova.dps <= 25, "legendaries at or below 25");
assert(storm.dps < triune.dps && storm.dps < antiphon.dps && storm.dps < recurve.dps, "Storm below every Relic");
assert(nova.dps < triune.dps && nova.dps < antiphon.dps && nova.dps < recurve.dps, "Nova below every Relic");
assert(Math.abs(triune.dps - 27) < 0.1, "Triune near 27, got " + triune.dps);
assert(Math.abs(antiphon.dps - 30.8) < 0.1, "Antiphon near 30.8, got " + antiphon.dps);
assert(Math.abs(recurve.dps - 35) < 0.05, "Recurve near 35, got " + recurve.dps);
assert(triune.dps < antiphon.dps && antiphon.dps < recurve.dps, "Relics strictly increasing");

assert(js.indexOf("if (g.triune) per = (TRIUNE_I + TRIUNE_II + TRIUNE_III) / 3") >= 0, "hangar DPS counts triune");
assert(js.indexOf("if (g.steal) per += g.dmg") >= 0, "hangar DPS counts steal");
assert(js.indexOf("if (g.recurve) per += RECURVE_BACK") >= 0, "hangar DPS counts return");
assert(js.indexOf("if (g.thread)") < 0 && js.indexOf("if (g.wallBounce)") < 0 && js.indexOf("g.bell") < 0, "old relic DPS terms gone");

assert(js.indexOf("next = cur + dir * 5") >= 0, "start-wave stepper untouched");
assert(js.indexOf("Admin: every 5 waves") >= 0, "start-wave admin copy untouched");
assert(/var VER = 14;/.test(codec), "codec VER 14");
assert(sw.indexOf("galaga-coop-v79") >= 0, "PWA cache bump");

console.log("gun-dps-rebalance-smoke: ok  storm=" + storm.dps.toFixed(1)
  + " nova=" + nova.dps.toFixed(1)
  + " prism=" + prism.dps.toFixed(1)
  + " triune=" + triune.dps.toFixed(1)
  + " antiphon=" + antiphon.dps.toFixed(1)
  + " recurve=" + recurve.dps.toFixed(1));
