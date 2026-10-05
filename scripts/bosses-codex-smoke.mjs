import fs from "fs";
import { sanitizeProfile } from "../api/account.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var js = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
var css = fs.readFileSync(new URL("../css/app.css", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var account = fs.readFileSync(new URL("../api/account.js", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");

function block(name) {
  var re = new RegExp("var " + name + " = \\[([\\s\\S]*?)\\n  \\];");
  var m = js.match(re);
  assert(m, "missing catalog " + name);
  return m[1];
}
function ids(name) {
  return Array.from(block(name).matchAll(/id: "([^"]+)"/g)).map(function (x) { return x[1]; });
}
function catalogUnlock(name) {
  var out = {}, m, re = /id: "([^"]+)"[\s\S]*?unlockLevel: (\d+)/g, body = block(name);
  while ((m = re.exec(body))) out[m[1]] = m[2] | 0;
  return out;
}

assert(js.indexOf("var PROFILE_VER = 9") >= 0, "client profile ver 9");
assert(account.indexOf("v: 9") >= 0, "cloud profile ver 9");
assert(account.indexOf("p.v = 9") >= 0, "sanitize writes ver 9");
assert(sw.indexOf("galaga-coop-v72") >= 0, "PWA cache bump");
assert(/var VER = 12;/.test(codec), "netcodec is 12");

assert(js.indexOf("facedWave: 0") >= 0, "emptyStats facedWave");
assert(js.indexOf("facedWave: Math.max(a.facedWave | 0, b.facedWave | 0)") >= 0, "mergeStats unions facedWave");
assert(js.indexOf("function noteFacedWave") >= 0, "noteFacedWave");
assert(js.indexOf("function facedWaveOf") >= 0, "facedWaveOf");
assert(js.indexOf("function bossFaced") >= 0, "bossFaced");
assert(js.indexOf("function renderBosses") >= 0, "renderBosses");
assert(js.indexOf("function drawBossPortrait") >= 0, "drawBossPortrait");
assert(js.indexOf("drawBoss(ctx, stub, col)") >= 0, "portraits reuse drawBoss");
assert(js.indexOf("function bossBuildLine") >= 0, "build line");
assert(js.indexOf("noteFacedWave(n)") >= 0, "spawnWave notes faced");
assert(js.indexOf("noteFacedWave(startN)") >= 0, "skip-start notes faced");
assert(js.indexOf("noteFacedWave(sb.w)") >= 0, "coop client notes faced");

var grant = js.match(/function grantAllUnlocks\(\) \{[\s\S]*?\n  \}/);
assert(grant, "grantAllUnlocks");
assert(grant[0].indexOf("facedWave") >= 0, "admin unlock mentions facedWave");
assert(grant[0].indexOf("profile.stats.facedWave") < 0, "admin unlock does not set facedWave");

assert(js.indexOf("Do not copy that admin cap into the Bosses menu") >= 0, "migrate skips admin 9999");
assert(account.indexOf('Object.prototype.hasOwnProperty.call(st, "facedWave")') >= 0, "cloud copies maxWave when facedWave missing");

assert(html.indexOf('id="btn-bosses"') >= 0, "hub Bosses button");
assert(html.indexOf('id="btn-hangar-bosses"') >= 0, "hangar Bosses button");
assert(html.indexOf('id="screen-bosses"') >= 0, "bosses screen");
assert(html.indexOf('id="bosses-list"') >= 0, "bosses list");
assert(html.indexOf("Reach a boss wave to reveal it") >= 0, "kill not required copy");
assert(css.indexOf(".bosses-list") >= 0 && css.indexOf(".boss-port") >= 0, "boss row styles");
assert(js.indexOf('"bosses"') >= 0 && js.indexOf("uiScreen === \"bosses\"") >= 0, "screen wiring");

var defIds = ids("BOSS_DEFS");
assert(defIds.length === 30, "30 roster bosses, got " + defIds.length);
var codexBlock = js.match(/var BOSS_CODEX = \{([\s\S]*?)\n  \};/);
assert(codexBlock, "BOSS_CODEX");
var codexIds = Array.from(codexBlock[1].matchAll(/^\s+([a-z]+): \{/gm)).map(function (m) { return m[1]; });
assert(codexIds.length === 30, "codex has 30 entries, got " + codexIds.length);
defIds.forEach(function (id, i) {
  assert(codexIds.indexOf(id) >= 0, "codex covers " + id);
  var entry = codexBlock[1].match(new RegExp(id + ": \\{([^}]+)\\}"));
  assert(entry, "codex body " + id);
  assert(entry[1].indexOf("desc:") >= 0, id + " desc");
  assert(entry[1].indexOf("abilities:") >= 0, id + " abilities");
  assert(entry[1].indexOf("ship:") >= 0 && entry[1].indexOf("gun:") >= 0 && entry[1].indexOf("mod:") >= 0, id + " loadout");
  var debut = (i + 1) * 5;
  var shipId = (entry[1].match(/ship: "([^"]+)"/) || [])[1];
  var gunId = (entry[1].match(/gun: "([^"]+)"/) || [])[1];
  var modId = (entry[1].match(/mod: "([^"]+)"/) || [])[1];
  var ships = catalogUnlock("SHIPS");
  var guns = catalogUnlock("GUNS");
  var mods = catalogUnlock("MODS");
  assert(ships[shipId] != null && ships[shipId] <= debut, id + " ship " + shipId + " unlock " + ships[shipId] + " vs wave " + debut);
  assert(guns[gunId] != null && guns[gunId] <= debut, id + " gun " + gunId + " unlock " + guns[gunId] + " vs wave " + debut);
  assert(mods[modId] != null && mods[modId] <= debut, id + " mod " + modId + " unlock " + mods[modId] + " vs wave " + debut);
});

assert(js.indexOf("Full-width rows mix red and blue") >= 0, "lodestar codex mixed rows");
assert(js.indexOf("Each head shoots a different pattern") >= 0, "lernaean codex distinct shots");
assert(js.indexOf("bossesBackTo = \"hangar\"") >= 0, "hangar return path");
assert(js.indexOf("?????") >= 0, "locked question marks");
assert(js.indexOf("Level ' + debut") >= 0, "locked rows still show level");

var migrated = sanitizeProfile({ stats: { maxWave: 45 }, admin: false });
assert(migrated.stats.facedWave === 45, "cloud copies maxWave into facedWave, got " + migrated.stats.facedWave);
var admin = sanitizeProfile({ stats: { maxWave: 9999 }, admin: true });
assert(admin.stats.facedWave === 0, "admin 9999 does not reveal bosses");
var kept = sanitizeProfile({ stats: { maxWave: 9999, facedWave: 20 }, admin: true });
assert(kept.stats.facedWave === 20, "explicit facedWave kept for admin");
var empty = sanitizeProfile({});
assert(empty.v === 9 && empty.stats.facedWave === 0, "empty cloud profile ver 9");

console.log("bosses-codex-smoke: ok  bosses=" + defIds.length);
