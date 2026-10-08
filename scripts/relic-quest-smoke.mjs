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
function domNode() {
  var n = {
    addEventListener: function () {},
    removeEventListener: function () {},
    setAttribute: function () {},
    getAttribute: function () { return ""; },
    removeAttribute: function () {},
    appendChild: function () { return n; },
    getContext: function () {
      return { canvas: n, measureText: function () { return { width: 0 }; }, save: function () {}, restore: function () {}, clearRect: function () {}, fillRect: function () {} };
    },
    getBoundingClientRect: function () { return { width: 240, height: 360, left: 0, top: 0 }; },
    style: {},
    classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
    textContent: "",
    innerHTML: "",
    value: "",
    width: 240,
    height: 360,
    closest: function () { return null; },
    querySelectorAll: function () { return []; }
  };
  return n;
}
function loadGalaga() {
  var document = {
    getElementById: function () { return domNode(); },
    addEventListener: function () {},
    hidden: false,
    createElement: function () { return domNode(); },
    body: domNode(),
    documentElement: domNode()
  };
  var localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
  var window = {
    document: document,
    localStorage: localStorage,
    addEventListener: function () {},
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1,
    location: { search: "", href: "http://localhost/" },
    navigator: { userAgent: "node" },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    fetch: function () { return Promise.resolve({ ok: false, json: function () { return Promise.resolve({}); } }); }
  };
  window.window = window;
  var fn = new Function("window", "document", "localStorage", "navigator", js + "\nreturn window.__galaga;");
  var g;
  try { g = fn(window, document, localStorage, window.navigator); }
  catch (err) { g = window.__galaga; }
  assert(g && g.scaleReward && g.rewardIsRelic, "scaleReward export");
  return g;
}

var longs = catalog("LONG_DEFS");
var guns = catalog("GUNS");
var ships = catalog("SHIPS");
var mods = catalog("MODS");

assert(/id: "lt_bosses25"[\s\S]*?kind: "bossRun"[\s\S]*?gun: "antiphon"/.test(longs), "Endless Court grants Antiphon");
assert(/id: "lt_bosses25"[\s\S]{0,180}target: 25/.test(longs), "25 bosses in one run");
assert(/id: "lt_roster_all"[\s\S]*?kind: "bossRoster"[\s\S]*?ship: "gyre"/.test(longs), "Every Name grants Gyre");
assert(/id: "lt_roster_all"[\s\S]{0,220}target: BOSS_DEFS.length/.test(longs), "full roster");
assert(/id: "lt_axiom_t1"[\s\S]*?kind: "bossTier"[\s\S]*?type: "axiom"[\s\S]*?gun: "recurve"/.test(longs), "Axiom +1 grants Recurve");
assert(/id: "lt_axiom_t1"[\s\S]{0,180}tier: 1/.test(longs), "Axiom at +1");

assert(!/gun: "triune"/.test(longs), "Triune stays hangar-buy");
assert(/gun: "storm"/.test(longs), "Storm quest path stays");
assert(!/ship: "goldwake"/.test(longs), "Goldwake stays hangar-buy");
assert(!/ship: "dichro"/.test(longs), "Dichro stays hangar-buy");
assert(!/mod: "sealbinder"/.test(longs), "Sealbinder stays hangar-buy");
assert(!/mod: "tithe"/.test(longs), "Tithe stays hangar-buy");

var relicGunIds = ["triune", "antiphon", "recurve"];
var questGuns = ["antiphon", "recurve"];
relicGunIds.forEach(function (id) {
  assert(guns.indexOf('id: "' + id + '"') >= 0, id + " still in hangar");
});
assert(questGuns.length < relicGunIds.length, "not every Relic gun is a quest reward");
assert(ships.indexOf('id: "goldwake"') >= 0 && ships.indexOf('id: "dichro"') >= 0 && ships.indexOf('id: "gyre"') >= 0, "Relic ships stay");
assert(mods.indexOf('id: "sealbinder"') >= 0 && mods.indexOf('id: "tithe"') >= 0, "Relic mods stay hangar-buy");

assert(js.indexOf('id: "triune", name: "Triune"') >= 0 && js.indexOf("dmg: 2.2, cd: 140") >= 0, "Triune catalog DPS");
assert(js.indexOf('id: "antiphon", name: "Antiphon"') >= 0 && js.indexOf("dmg: 2.1, cd: 90") >= 0, "Antiphon catalog DPS");
assert(js.indexOf('id: "recurve", name: "Recurve"') >= 0 && js.indexOf("dmg: 4.24, cd: 200") >= 0, "Recurve catalog DPS");
assert(js.indexOf('id: "prism", name: "Prism", unlockLevel: 90') >= 0 && js.indexOf("dmg: 2.4, cd: 190") >= 0, "Prism DPS unchanged");

assert(js.indexOf("function rewardIsRelic") >= 0, "rewardIsRelic");
assert(js.indexOf("tier <= 2 || rewardIsRelic") >= 0, "scaleReward keeps Relic past tier 2");

var g = loadGalaga();
[0, 1, 2, 3, 5].forEach(function (tier) {
  var relic = g.scaleReward({ id: "lt_axiom_t1", reward: { gun: "recurve", consolation: 40 } }, tier);
  var storm = g.scaleReward({ id: "lt_storm", reward: { gun: "storm", consolation: 40 } }, tier);
  assert(relic.gun === "recurve", "relic gun kept at tier " + tier);
  assert(g.rewardIsRelic({ gun: "recurve" }) && !g.rewardIsRelic({ gun: "storm" }), "relic detect");
  if (tier <= 2) assert(storm.gun === "storm", "legendary kept at tier " + tier);
  else assert(!storm.gun && storm.coins > 0, "legendary becomes coins at tier " + tier);
});

assert(/var VER = 14;/.test(codec), "codec VER 14");
assert(sw.indexOf("galaga-coop-v79") >= 0, "PWA cache bump");
assert(js.indexOf("next = cur + dir * 5") >= 0, "start-wave stepper untouched");

console.log("relic-quest-smoke: ok");
