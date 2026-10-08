import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var js = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");

assert(js.indexOf("(who.grazePips || 0) >= GOLDWAKE_BURST_COST && (who.grazePips || 0) < GOLDWAKE_SAVE_COST") >= 0, "goldwake spends 4 before 8");
assert(js.indexOf("(who.grazePips || 0) >= GOLDWAKE_SAVE_COST") >= 0, "goldwake banks 8 for a life");
assert(js.indexOf('id === "lode-red"') >= 0 && js.indexOf('id === "lode-blue"') >= 0 && js.indexOf('id === "lode-pulsar"') >= 0, "dichro Q ids");
assert(js.indexOf("GYRE_R = 48") >= 0, "gyre radius");
["haunt", "shackle", "stasis", "rampart", "fold", "horizon"].forEach(function (id) {
  assert(js.indexOf('case "' + id + '"') >= 0, "fuse " + id);
});
assert(js.indexOf("inp.ability && inp.bossAb") >= 0, "tithe chord");
assert(js.indexOf('skinIdOf(who) !== "umbra"') >= 0, "umbra skin id");
assert(js.indexOf('id === "eclipse-umbra"') >= 0, "eclipse umbra stays a coin skin");
assert(js.indexOf('!!fight.fallUp !== !!(p && p.codexLaw === "fallUp")') >= 0, "codex fall-up XOR");
assert(js.indexOf("b.safe = 1") >= 0, "recurve safe");
assert(js.indexOf("function triuneHitDmg") >= 0, "triune per slot");

console.log("relic-laws-smoke: ok");
