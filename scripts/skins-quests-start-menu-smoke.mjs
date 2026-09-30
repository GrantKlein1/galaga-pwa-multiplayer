import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
var css = fs.readFileSync(new URL("../css/app.css", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");

function catalog(name) {
  var re = new RegExp("var " + name + " = \\[([\\s\\S]*?)\\n  \\];");
  var m = galaga.match(re);
  assert(m, "missing catalog " + name);
  return m[1];
}

function entries(block) {
  var out = [], re = /\{[\s\S]*?\}/g, m, row, id, cost, rarity;
  while ((m = re.exec(block))) {
    row = m[0];
    id = (row.match(/id: "([^"]+)"/) || [])[1];
    cost = Number((row.match(/cost: (\d+)/) || [])[1]);
    rarity = (row.match(/rarity: "([^"]+)"/) || [])[1];
    if (id) out.push({ id: id, cost: cost, rarity: rarity, row: row });
  }
  return out;
}

var coinSkins = entries(catalog("SHIP_COIN_SKINS"));
var tiers = entries(catalog("SKIN_TIERS"));
var ships = entries(catalog("SHIPS"));
var guns = entries(catalog("GUNS"));
var mods = entries(catalog("MODS"));
assert(coinSkins.length === 24, "12 hulls × epic+legendary coin skins, got " + coinSkins.length);

var i, s;
for (i = 0; i < coinSkins.length; i++) {
  s = coinSkins[i];
  if (s.rarity === "epic") assert(s.cost === 10000, s.id + " epic coin skin is 10000, got " + s.cost);
  else if (s.rarity === "legendary") assert(s.cost === 20000, s.id + " legendary coin skin is 20000, got " + s.cost);
  else assert(false, s.id + " unexpected rarity " + s.rarity);
}

for (i = 0; i < tiers.length; i++) {
  assert(tiers[i].cost === 0, tiers[i].id + " level paint stays free");
}
assert(ships.filter(function (x) { return x.cost === 0; }).length >= 1, "starter ship still free");
assert(mods.some(function (x) { return x.id === "salvage" && x.cost === 2500; }), "non-skin epic mod price unchanged");
assert(guns.some(function (x) { return x.rarity === "epic" && x.cost !== 10000; }), "gun prices not flattened to skin prices");

var frost = tiers.filter(function (x) { return x.id === "frost"; })[0];
assert(frost && frost.cost === 0 && frost.rarity === "epic", "frost still free epic");
assert(galaga.indexOf('perkText: "20% of hits freeze fodder 1s; 8% freeze bosses 0.4s"') >= 0, "frost perk text");
assert(galaga.indexOf("if (Math.random() < 0.08) e.freezeT") >= 0, "boss freeze chance");
assert(galaga.indexOf("else if (Math.random() < 0.2)") >= 0, "fodder freeze chance");
assert(!/if \(id === "frost"\) e\.freezeT = Math\.max\(e\.freezeT \|\| 0, e\.isBoss \? 0\.4 : 1\)/.test(galaga), "frost no longer 100% freeze");
assert(galaga.indexOf('skinIdOf(shooter) === "frost" && Math.random() < 0.2') >= 0, "pvp frost slow is a chance");

var cyclone = coinSkins.filter(function (x) { return x.id === "tempest-cyclone"; })[0];
assert(cyclone && cyclone.cost === 10000 && cyclone.rarity === "epic", "cyclone still epic coin skin");
assert(galaga.indexOf('perk: "GUST"') >= 0, "cyclone perk id");
assert(galaga.indexOf('perkText: "Kills grant 0.6s of +20% speed"') >= 0, "cyclone perk text");
assert(galaga.indexOf("function cycloneNudge") < 0, "old shear nudge gone");
assert(galaga.indexOf("Nearby enemy bullets are nudged aside") < 0, "old shear copy gone");
assert(galaga.indexOf('sid === "tempest-cyclone"') >= 0, "gust triggers on kill");
assert(galaga.indexOf("id === \"tempest-cyclone\") spd *= 1.20") >= 0, "gust speed mul");

assert(galaga.indexOf("function claimAllSummaryQuests") >= 0, "claim all helper");
assert(galaga.indexOf('data-act="claim-all"') >= 0, "claim all button");
assert(galaga.indexOf("Claim all takes coins") >= 0, "claim all copy");
assert(galaga.indexOf('rewardNeedsChoice(item.q.reward) ? "coins"') >= 0, "claim all takes coins on choice");
assert(html.indexOf('id="summary-quests"') >= 0, "summary claim screen");
assert(css.indexOf(".summary-claim-all") >= 0, "claim all style");

assert(html.indexOf('id="btn-xp-boost"') < 0, "hub arm control removed");
assert(html.indexOf('id="btn-lobby-xp-boost"') < 0, "lobby arm control removed");
assert(html.indexOf("Arm XP boost") < 0, "arm copy gone from html");
assert(html.indexOf('id="hub-start-menu"') >= 0, "hub start menu");
assert(html.indexOf('id="btn-hub-start"') >= 0, "start no boost");
assert(html.indexOf("Start with XP boost (2× this run)") >= 0, "start with boost copy");
assert(html.indexOf('id="lobby-start-menu"') >= 0, "co-op start menu");
assert(html.indexOf('id="hub-boosts"') >= 0, "hub still shows banked charges");
assert(galaga.indexOf("function startFromHub") >= 0, "hub start spends on confirm");
assert(galaga.indexOf("function confirmCoopStart") >= 0, "co-op local start choice");
assert(galaga.indexOf("function toggleHubStartMenu") >= 0, "play opens menu");
assert(galaga.indexOf("btn.disabled = n < 1") >= 0, "boost option disabled at 0 charges");
assert(galaga.indexOf("pendingXpBoost = false") >= 0, "pvp / no-boost clears intent");
assert(galaga.indexOf("consumeArmedXpBoost(!!(opts.pvp") >= 0, "start still consumes through existing helper");
assert(galaga.indexOf("XP boosts:") >= 0, "banked copy");
assert(css.indexOf(".start-run-menu") >= 0, "start menu style");
assert(sw.indexOf("galaga-coop-v57") >= 0, "PWA cache bump");

console.log("skins-quests-start-menu-smoke: ok  coinSkins=" + coinSkins.length);
