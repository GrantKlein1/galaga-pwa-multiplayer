import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var js = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");

function catalog(name) {
  var re = new RegExp("var " + name + " = \\[([\\s\\S]*?)\\n  \\];");
  var m = js.match(re);
  assert(m, "missing catalog " + name);
  return m[1];
}

var longs = catalog("LONG_DEFS");
var guns = catalog("GUNS");
var ships = catalog("SHIPS");
var mods = catalog("MODS");

assert(/id: "lt_bosses25"[\s\S]*?kind: "bossRun"[\s\S]*?gun: "requiem"/.test(longs), "Endless Court grants Requiem Bell");
assert(/id: "lt_bosses25"[\s\S]{0,180}target: 25/.test(longs), "25 bosses in one run");
assert(/id: "lt_roster_all"[\s\S]*?kind: "bossRoster"[\s\S]*?ship: "eventhorizon"/.test(longs), "Every Name grants Event Horizon");
assert(/id: "lt_roster_all"[\s\S]{0,220}target: BOSS_DEFS.length/.test(longs), "full roster");
assert(/id: "lt_axiom_t1"[\s\S]*?kind: "bossTier"[\s\S]*?type: "axiom"[\s\S]*?gun: "axiomlance"/.test(longs), "Axiom +1 grants Axiom Lance");
assert(/id: "lt_axiom_t1"[\s\S]{0,180}tier: 1/.test(longs), "Axiom at +1");

assert(!/gun: "loomthread"/.test(longs), "Loomthread stays hangar-buy, not a quest gun");
assert(/gun: "storm"/.test(longs), "Storm quest path stays");
assert(!/ship: "chronoweaver"/.test(longs), "Chronoweaver stays hangar-buy");
assert(!/ship: "twinstar"/.test(longs), "Twinstar stays hangar-buy");
assert(!/mod: "overclock"/.test(longs), "Overclock stays hangar-buy");
assert(!/mod: "paradox"/.test(longs), "Paradox stays hangar-buy");

var relicGunIds = ["loomthread", "requiem", "axiomlance"];
var questGuns = ["requiem", "axiomlance"];
relicGunIds.forEach(function (id) {
  assert(guns.indexOf('id: "' + id + '"') >= 0, id + " still in hangar");
});
assert(questGuns.length < relicGunIds.length, "not every Relic gun is a quest reward");
assert(ships.indexOf('id: "chronoweaver"') >= 0 && ships.indexOf('id: "twinstar"') >= 0, "other Relic ships stay");
assert(mods.indexOf('id: "overclock"') >= 0 && mods.indexOf('id: "paradox"') >= 0, "Relic mods stay hangar-buy");

assert(js.indexOf('id: "loomthread", name: "Loomthread"') >= 0 && js.indexOf("dmg: 2.35, cd: 155") >= 0, "Loomthread DPS unchanged");
assert(js.indexOf('id: "requiem", name: "Requiem Bell"') >= 0 && js.indexOf("dmg: 3.2, cd: 70") >= 0, "Requiem DPS unchanged");
assert(js.indexOf('id: "axiomlance", name: "Axiom Lance"') >= 0 && js.indexOf("dmg: 9.18, cd: 260") >= 0, "Axiom Lance DPS unchanged");
assert(js.indexOf('id: "prism", name: "Prism", unlockLevel: 90') >= 0 && js.indexOf("dmg: 2.4, cd: 190") >= 0, "Prism DPS unchanged");

assert(/var VER = 13;/.test(codec), "codec VER unchanged");
assert(sw.indexOf("galaga-coop-v78") >= 0, "PWA cache bump");
assert(js.indexOf("next = cur + dir * 5") >= 0, "start-wave stepper untouched");

console.log("relic-quest-smoke: ok");
