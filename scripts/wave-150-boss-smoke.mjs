import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");
var pvp = fs.readFileSync(new URL("../js/pvp.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var roster = fs.readFileSync(new URL("../docs/boss-roster.md", import.meta.url), "utf8");
var post = fs.readFileSync(new URL("../docs/post-55-bosses.md", import.meta.url), "utf8");
var abilities = fs.readFileSync(new URL("../docs/boss-abilities.md", import.meta.url), "utf8");

var ids = [...galaga.matchAll(/\{ id: "([a-z]+)", name: "([A-Z]+)"/g)].map(function (m) {
  return m[1];
});
assert(ids.length === 30, "30 roster bosses, got " + ids.length);
assert(ids[24] === "orrery" && ids[25] === "prism", "Prism follows Orrery");
assert(ids[26] === "maelstrom" && ids[27] === "cartographer", "Maelstrom then Cartographer");
assert(ids[28] === "mimic" && ids[29] === "axiom", "Mimic then Axiom");
assert(ids.filter(function (id) { return id === "hydra"; }).length === 1, "wave-15 hydra id stays unique");

function meta(n) {
  var cycle = Math.max(0, Math.round(n / 5) - 1);
  return { type: ids[cycle % ids.length], tier: Math.floor(cycle / ids.length) };
}
assert(meta(130).type === "prism" && meta(130).tier === 0, "wave 130 Prism");
assert(meta(135).type === "maelstrom" && meta(135).tier === 0, "wave 135 Maelstrom");
assert(meta(140).type === "cartographer" && meta(140).tier === 0, "wave 140 Cartographer");
assert(meta(145).type === "mimic" && meta(145).tier === 0, "wave 145 Mimic");
assert(meta(150).type === "axiom" && meta(150).tier === 0, "wave 150 Axiom");
assert(meta(155).type === "seraph" && meta(155).tier === 1, "+1 cycle starts at 155");
assert(meta(235).type === "loom" && meta(235).tier === 1, "Loom +1");
assert(meta(250).type === "terminus" && meta(250).tier === 1, "Terminus +1");
assert(meta(300).type === "axiom" && meta(300).tier === 1, "Axiom +1");
assert(meta(210).type === "cenotaph" && meta(210).tier === 1, "Cenotaph +1");
assert(meta(225).type === "selene" && meta(225).tier === 1, "Selene +1");
assert(meta(230).type === "pentarch" && meta(230).tier === 1, "Pentarch +1");

assert(/\{ id: "prism",[\s\S]*?hp: 2300,/.test(galaga), "Prism HP 2300");
assert(/\{ id: "maelstrom",[\s\S]*?hp: 2450,/.test(galaga), "Maelstrom HP 2450");
assert(/\{ id: "cartographer",[\s\S]*?hp: 2600,/.test(galaga), "Cartographer HP 2600");
assert(/\{ id: "mimic",[\s\S]*?hp: 2800,/.test(galaga), "Mimic HP 2800");
assert(/\{ id: "axiom",[\s\S]*?hp: 3000,/.test(galaga), "Axiom HP 3000");
assert(/\{ id: "prism",[\s\S]*?tele: 0\.28/.test(galaga), "Prism tele shorter than Terminus");
assert(galaga.indexOf("var GUEST_BOSS_POOL = 10") >= 0, "guests stay Seraph–Overlord");
assert(galaga.indexOf("function spawnPrisms") >= 0 && galaga.indexOf("function firePrismBeams") >= 0, "Prism split");
assert(galaga.indexOf("function applyMaelstromFlow") >= 0, "Maelstrom current");
assert(galaga.indexOf("function spawnCartographerPanes") >= 0 && galaga.indexOf("function wrapCartographer") >= 0, "Cartographer panes");
assert(galaga.indexOf("MIMIC_LAG = 1.6") >= 0 && galaga.indexOf("function fireMimicAbilityCopy") >= 0, "Mimic tape + ability copy");
assert(galaga.indexOf("id = currentBossAbilityId(pl)") >= 0, "Mimic uses ability API");
assert(galaga.indexOf("function currentPlayerBossAbility") < 0, "stale mimic hook gone");
assert(galaga.indexOf("function applyAxiomPhase") >= 0 && galaga.indexOf("function clearAxiomRules") >= 0, "Axiom rules revert");
assert(galaga.indexOf("WAVE 150 CLEARED") >= 0, "wave 150 victory banner");
assert(galaga.indexOf("var AXIOM_CLEAR_XP = 12000") >= 0, "Axiom Clear XP bonus");
assert(galaga.indexOf("if (n === 150) xpBonus += AXIOM_CLEAR_XP") >= 0, "skip-start credits Axiom Clear");
assert(galaga.indexOf("LIGHT SPLITS") >= 0 && galaga.indexOf("THE WATER TURNS") >= 0, "Prism/Maelstrom banners");
assert(galaga.indexOf("THE MAP OPENS") >= 0 && galaga.indexOf("IT WEARS YOUR FACE") >= 0, "Cartographer/Mimic banners");
assert(galaga.indexOf("SHOTS FALL UP") >= 0 && galaga.indexOf("YOUR BULLETS BOUNCE") >= 0, "Axiom banners");
assert(galaga.indexOf("GRAZING HEALS") >= 0 && galaga.indexOf("ORBIT") >= 0, "Axiom graze/orbit");
assert(galaga.indexOf("THE PAST CLOSES") >= 0 && galaga.indexOf("BREAK THE SEALS") >= 0, "Axiom past/seals");
assert(galaga.indexOf("THE SCREEN TURNS") < 0 && galaga.indexOf("GRAVITY PULLS DOWN") < 0, "old turn/gravity gone");
assert(galaga.indexOf("if (d.p6 && d.p6.length)") >= 0, "6-phase Axiom thresholds");
assert(galaga.indexOf("if (b.bounces > 1)") >= 0, "player shots bounce once");
assert(galaga.indexOf("function axiomSteerOnRing") >= 0 && galaga.indexOf("function axiomShieldBlocks") >= 0, "orbit ring + shields");
assert(galaga.indexOf("function startAxiomPast") >= 0 && galaga.indexOf("function startAxiomSeals") >= 0, "past and seals");
assert(galaga.indexOf("AXIOM_SEAL_KINDS") >= 0, "seal kinds");

[
  "splitbeam", "refract", "crystal", "shardfan", "lattice", "ricochet", "gapring",
  "current", "gyre", "maw",
  "chart", "remap", "foldmap", "atlas", "copycat", "shadow", "mock", "doppel",
  "fallup", "fallzip", "bounce", "bouncesweep", "grazeheal", "grazeswath",
  "orbitring", "orbitsweep", "pastclose", "pastcrush", "seals", "sealburst"
].forEach(function (atk) {
  assert(galaga.indexOf('atk === "' + atk + '"') >= 0, "attack wired: " + atk);
});

assert(galaga.indexOf("function snapPlayersToCurrentBand") >= 0, "phase end snaps back into the legal band");
assert(galaga.indexOf("fight.pastClose || fight.sealsNeed") >= 0, "past/seals free the whole field");
assert(galaga.indexOf("cardY = fight.fallUp") >= 0, "fall-up rule card leaves the top lane");
assert(galaga.indexOf("if (e.isBoss && e.type === \"axiom\" && fight.sealsNeed && !fight.axiomOpen) continue") >= 0, "sealed core does not eat bounce shots");
assert(galaga.indexOf("if ((b.bounces || 0) > 0)") >= 0, "bounced player shots draw red");

assert(codec.indexOf('"prism", "maelstrom", "cartographer", "mimic", "axiom"') >= 0, "netcodec boss ids");
assert(/var VER = 13;/.test(codec), "codec VER 13");
assert(codec.indexOf('"prism"') >= 0 && codec.indexOf('"ray"') >= 0 && codec.indexOf('"flow"') >= 0, "prism/ray/flow kinds");
assert(codec.indexOf('"pane"') >= 0 && codec.indexOf('"pin"') >= 0 && codec.indexOf('"rule"') >= 0, "pane/pin/rule kinds");
assert(codec.indexOf('"orbit"') >= 0 && codec.indexOf('"wake"') >= 0 && codec.indexOf('"seal"') >= 0, "axiom extra kinds");
assert(codec.indexOf("prism-split") >= 0 && codec.indexOf("axiom-mix") >= 0, "130–150 ability ids");

assert(pvp.indexOf("prism:") >= 0 && pvp.indexOf("axiom:") >= 0 && pvp.indexOf("mimic:") >= 0, "pvp kits");
assert(sw.indexOf("galaga-coop-v78") >= 0, "PWA cache bump");
assert(roster.indexOf("prism") >= 0 && roster.indexOf("axiom") >= 0, "roster docs");
assert(roster.indexOf("wave **155**") >= 0, "roster +1 at 155");
assert(post.indexOf("Prism — wave 130") >= 0 && post.indexOf("Axiom — wave 150") >= 0, "post-55 kits");
assert(abilities.indexOf("`prism-split`") >= 0 && abilities.indexOf("`axiom-mix`") >= 0, "ability docs");
assert(abilities.indexOf("currentBossAbilityId") >= 0, "mimic API documented");

console.log("wave-150-boss-smoke: ok");
