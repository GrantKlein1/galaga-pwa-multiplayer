import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var js = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var css = fs.readFileSync(new URL("../css/app.css", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");
var pvp = fs.readFileSync(new URL("../js/pvp.js", import.meta.url), "utf8");
var account = fs.readFileSync(new URL("../api/account.js", import.meta.url), "utf8");

function block(name) {
  var re = new RegExp("var " + name + " = \\[([\\s\\S]*?)\\n  \\];");
  var m = js.match(re);
  assert(m, "missing catalog " + name);
  return m[1];
}
function entries(name) {
  var out = [], re = /\{[\s\S]*?\}/g, m, row, id;
  while ((m = re.exec(block(name)))) {
    row = m[0];
    id = (row.match(/id: "([^"]+)"/) || [])[1];
    if (!id) continue;
    out.push({
      id: id,
      name: (row.match(/name: "([^"]+)"/) || [])[1],
      rarity: (row.match(/rarity: "([^"]+)"/) || [])[1],
      cost: Number((row.match(/cost: (\d+)/) || [])[1]),
      unlockLevel: Number((row.match(/unlockLevel: (\d+)/) || [])[1]),
      row: row
    });
  }
  return out;
}
function byId(list, id) {
  var i;
  for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
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
      return {
        canvas: n,
        measureText: function () { return { width: 0 }; },
        save: function () {}, restore: function () {}, beginPath: function () {},
        arc: function () {}, fill: function () {}, stroke: function () {},
        fillRect: function () {}, clearRect: function () {}, moveTo: function () {},
        lineTo: function () {}, closePath: function () {}, translate: function () {},
        rotate: function () {}, scale: function () {}, setTransform: function () {}
      };
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
    querySelector: function () { return domNode(); },
    querySelectorAll: function () { return []; },
    setPointerCapture: function () {},
    focus: function () {}
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
    documentElement: domNode(),
    visibilityState: "visible"
  };
  var localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
  var window = {
    document: document,
    localStorage: localStorage,
    addEventListener: function () {},
    removeEventListener: function () {},
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1,
    location: { search: "", href: "http://localhost/" },
    navigator: { userAgent: "node" },
    crypto: { getRandomValues: function (b) { var i; for (i = 0; i < b.length; i++) b[i] = (i * 17) & 255; return b; } },
    requestAnimationFrame: function () { return 0; },
    cancelAnimationFrame: function () {},
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    fetch: function () { return Promise.resolve({ ok: false, json: function () { return Promise.resolve({}); } }); }
  };
  window.window = window;
  var fn = new Function("window", "document", "localStorage", "navigator", js + "\nreturn window.__galaga;");
  var g;
  try { g = fn(window, document, localStorage, window.navigator); }
  catch (err) { g = window.__galaga; }
  assert(g && g.migrateProfile, "galaga export");
  return g;
}

assert(js.indexOf('var RARITIES = ["common", "rare", "epic", "legendary", "relic"]') >= 0, "relic last in hangar sort");
assert(js.indexOf('if (r === "relic") return "Relic"') >= 0, "relic label");
assert(js.indexOf('Opens at level \' + d.unlockLevel') >= 0, "locked relic copy");
assert(css.indexOf(".badge.b-relic") >= 0 && css.indexOf(".cat-row.r-relic") >= 0, "crimson-gold hangar styles");
assert(css.indexOf("relic-shimmer") >= 0, "slow shimmer border");
assert(pvp.indexOf("relic: 4") >= 0, "pvp rarity rank");

assert(js.indexOf("var PROFILE_VER = 10") >= 0, "profile ver 10");
assert(account.indexOf("v: 10") >= 0, "cloud profile ver 10");
assert(account.indexOf("p.v = 10") >= 0, "sanitize writes ver 10");
assert(/var VER = 14;/.test(codec), "netcodec VER 14");
assert(sw.indexOf("galaga-coop-v79") >= 0, "PWA cache bump");

var oldIds = [
  "chronoweaver", "twinstar", "eventhorizon",
  "loomthread", "requiem", "axiomlance",
  "overclock", "paradox",
  "eventide", "genesis"
];
var newIds = [
  "goldwake", "dichro", "gyre",
  "triune", "antiphon", "recurve",
  "sealbinder", "tithe",
  "umbra", "codex"
];
function codecList(name) {
  var m = codec.match(new RegExp("var " + name + " = \\[([\\s\\S]*?)\\];"));
  assert(m, "codec " + name);
  return m[1];
}
var codecLists = {
  SHIP_IDS: codecList("SHIP_IDS"),
  GUN_IDS: codecList("GUN_IDS"),
  MOD_IDS: codecList("MOD_IDS"),
  SKIN_IDS: codecList("SKIN_IDS")
};
var codecJoined = codecLists.SHIP_IDS + codecLists.GUN_IDS + codecLists.MOD_IDS + codecLists.SKIN_IDS;
oldIds.forEach(function (id) {
  assert(codecJoined.indexOf('"' + id + '"') < 0, "codec dropped " + id);
});
newIds.forEach(function (id) {
  assert(codecJoined.indexOf('"' + id + '"') >= 0, "codec lists " + id);
});
assert(codec.indexOf("twinOn") < 0 && codec.indexOf("eventideMask") < 0, "twin and eventide fields gone");
assert(codec.indexOf("grazePips") >= 0 && codec.indexOf("sealArmed") >= 0 && codec.indexOf("grazeHeal") >= 0, "relic snap fields");

["SHIPS", "GUNS", "MODS", "SKIN_TIERS"].forEach(function (name) {
  var body = block(name);
  oldIds.forEach(function (id) {
    assert(body.indexOf('id: "' + id + '"') < 0, name + " dropped " + id);
  });
});

var ships = entries("SHIPS");
var guns = entries("GUNS");
var mods = entries("MODS");
var skins = entries("SKIN_TIERS");
var expect = [
  [ships, "goldwake", "Goldwake", 100, 15000],
  [ships, "dichro", "Dichro", 115, 22000],
  [ships, "gyre", "Gyre", 135, 28000],
  [guns, "triune", "Triune", 105, 16000],
  [guns, "antiphon", "Antiphon", 120, 22000],
  [guns, "recurve", "Recurve", 140, 30000],
  [mods, "sealbinder", "Sealbinder", 110, 18000],
  [mods, "tithe", "Tithe", 130, 25000],
  [skins, "umbra", "Umbra", 125, 0],
  [skins, "codex", "Codex", 150, 0]
];
expect.forEach(function (row) {
  var it = byId(row[0], row[1]);
  assert(it, "missing " + row[1]);
  assert(it.name === row[2], row[1] + " name " + it.name);
  assert(it.rarity === "relic", row[1] + " rarity");
  assert(it.unlockLevel === row[3], row[1] + " unlock " + it.unlockLevel);
  assert(it.cost === row[4], row[1] + " cost " + it.cost);
  assert(it.cost === 0 || (it.cost >= 15000 && it.cost <= 30000), row[1] + " price band");
});

assert(js.indexOf('passive: "graze"') >= 0, "goldwake graze");
assert(js.indexOf('passive: "polar"') >= 0, "dichro polar");
assert(js.indexOf('passive: "gyre"') >= 0, "gyre current");
assert(js.indexOf("triune: 1") >= 0, "triune flag");
assert(js.indexOf("steal: 1") >= 0, "antiphon steal");
assert(js.indexOf("recurve: 1") >= 0, "recurve flag");
assert(js.indexOf('perk: "LAMP"') >= 0, "umbra perk");
assert(js.indexOf('perk: "CODEX"') >= 0, "codex perk");

assert(js.indexOf("function remapRelicIds") >= 0, "remap");
assert(js.indexOf("function tryTithe") >= 0, "tithe");
assert(js.indexOf("function fuseWarpQ") >= 0, "fuse");
assert(js.indexOf("function playerFallUp") >= 0, "fall up");
[
  "function tryChronoRewind", "function fireTwinstarVolley", "function tickLoomThreads",
  "function spawnRequiemBell", "function startParadox", "function initEventide",
  "function drawEventideShards", "HORIZON_GRAV_R", 'passive: "chrono"', 'passive: "twin"',
  "thread: 0.4", "wallBounce:", 'perk: "GENESIS"', 'hasMod("overclock"',
  "skillCd *= 0.8", "lanceBounces", "CHRONO_REWIND"
].forEach(function (needle) {
  assert(js.indexOf(needle) < 0, "old relic gone: " + needle);
});

var defIds = Array.from(block("BOSS_DEFS").matchAll(/id: "([^"]+)"/g)).map(function (x) { return x[1]; });
var codexBlock = js.match(/var BOSS_CODEX = \{([\s\S]*?)\n  \};/);
assert(codexBlock, "BOSS_CODEX");
var relicIds = {
  goldwake: 1, dichro: 1, gyre: 1,
  triune: 1, antiphon: 1, recurve: 1,
  sealbinder: 1, tithe: 1
};
defIds.forEach(function (id, i) {
  var debut = (i + 1) * 5;
  var entry = codexBlock[1].match(new RegExp(id + ": \\{([^}]+)\\}"));
  assert(entry, "codex " + id);
  var shipId = (entry[1].match(/ship: "([^"]+)"/) || [])[1];
  var gunId = (entry[1].match(/gun: "([^"]+)"/) || [])[1];
  var modId = (entry[1].match(/mod: "([^"]+)"/) || [])[1];
  [shipId, gunId, modId].forEach(function (item) {
    if (!relicIds[item]) return;
    assert(debut >= 100, id + " relic " + item + " only on wave 100+ (wave " + debut + ")");
  });
});

var codecFn = new Function("window", codec + "\nreturn window.__netcodec;");
var nc = codecFn({});
assert(nc.selfCheck(), "netcodec selfCheck");

var g = loadGalaga();
var migrated = g.migrateProfile({
  v: 9,
  totalXp: 0,
  ownedShips: ["wisp", "chronoweaver", "twinstar", "eventhorizon"],
  ownedGuns: ["pulse", "loomthread", "requiem", "axiomlance"],
  ownedMods: ["overclock", "paradox"],
  ownedSkins: { chronoweaver: ["stock", "eventide"], twinstar: ["stock", "genesis"] },
  equipped: { ship: "chronoweaver", gun: "axiomlance", mod: "overclock" },
  equippedSkins: { chronoweaver: "eventide" }
});
assert(migrated.v === 10, "remapped profile ver");
assert(migrated.ownedShips.join(",") === "wisp,goldwake,dichro,gyre", "ships " + migrated.ownedShips);
assert(migrated.ownedGuns.join(",") === "pulse,triune,antiphon,recurve", "guns " + migrated.ownedGuns);
assert(migrated.ownedMods.join(",") === "sealbinder,tithe", "mods " + migrated.ownedMods);
assert(migrated.equipped.ship === "goldwake" && migrated.equipped.gun === "recurve" && migrated.equipped.mod === "sealbinder", "equipped remap");
assert(migrated.ownedSkins.goldwake && migrated.ownedSkins.goldwake.indexOf("umbra") >= 0, "eventide skin became umbra");
assert(migrated.ownedSkins.dichro && migrated.ownedSkins.dichro.indexOf("codex") >= 0, "genesis skin became codex");
assert(migrated.equippedSkins.goldwake === "umbra", "equipped skin umbra");
oldIds.forEach(function (id) {
  assert(migrated.ownedShips.indexOf(id) < 0 && migrated.ownedGuns.indexOf(id) < 0 && migrated.ownedMods.indexOf(id) < 0, "owned dropped " + id);
});

console.log("relic-hangar-smoke: ok");
