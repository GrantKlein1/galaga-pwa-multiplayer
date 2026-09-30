import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var post = fs.readFileSync(new URL("../docs/post-55-bosses.md", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");

assert(galaga.indexOf('base: ["starred", "redrow"]') >= 0, "Lodestar p1 keeps a dodgeable fan plus a full row");
assert(galaga.indexOf('p2: ["starblue", "bluerow"]') >= 0, "Lodestar p2 blue fan plus blue row");
assert(galaga.indexOf('p3: ["pulsar", "pulsarrow"]') >= 0, "Lodestar p3 mixed fans plus red-then-blue rows");
assert(galaga.indexOf("function lodestarRow") >= 0, "full-width polarity row helper");
assert(galaga.indexOf("n = 16") >= 0 && galaga.indexOf("addEbul(x, y, 0, spd, opt)") >= 0, "row spans the field with vertical motion only");
assert(galaga.indexOf('extra.polar = polar ? 1 : 0') >= 0, "red polarity is 0, not dropped as falsy");
assert(galaga.indexOf("fight.polar = idx === 1 ? 0 : 1") >= 0, "ring starts opposite the phase color so the first volley hurts");
assert(galaga.indexOf("(b.polar | 0) === (fight.polar | 0)") >= 0, "matching polarity still passes through");
assert(galaga.indexOf("fight.on && fight.type === \"lodestar\"") >= 0, "ship tint and countdown ring during Lodestar");
assert(galaga.indexOf('addTele("hline", 6, e.y + 16, W - 6, e.y + 16, delay, FIGHT_RED)') >= 0, "red row telegraph");
assert(galaga.indexOf('queueFollow(e, 0.42, "bluerow")') >= 0, "pulsar row is red then blue");

assert(galaga.indexOf("function lernaeanCoreOpen") >= 0, "Hydra core opens when nothing is left to cut");
assert(galaga.indexOf("fromPerk !== \"stump\" && !lernaeanCoreOpen()") >= 0, "body stays invuln only while heads or stumps remain");
assert(galaga.indexOf("living = lernaeanLivingHeads()") >= 0, "regrow cap counts living heads, not dead array slots");
assert(galaga.indexOf("obj.sealed = true") >= 0, "hitting the gold stump cauterizes the neck");
assert(galaga.indexOf("k.ang += dt * (0.7") < 0, "heads no longer orbit as anonymous blobs");
assert(galaga.indexOf("function drawLernaeanNeck") >= 0 && galaga.indexOf("function drawLernaeanHeadSprite") >= 0, "necks and snouts");
assert(galaga.indexOf("obj.stumpT = 1.05") >= 0, "gold stump window stays readable");
assert(galaga.indexOf('banner = { text: "THE HEART"') >= 0, "core-open banner");
assert(galaga.indexOf("function placeLernaeanHead") >= 0, "heads stay attached to the body");

assert(/var VER = 11;/.test(codec), "codec payload unchanged");
assert(sw.indexOf("galaga-coop-v64") >= 0, "PWA cache bump");
assert(post.indexOf("full-width red row") >= 0, "Lodestar kit mentions unsidesteppable rows");
assert(post.indexOf("gold heart can be killed") >= 0, "Hydra kit mentions a finishable core");

console.log("lodestar-hydra-fix-smoke: ok");
