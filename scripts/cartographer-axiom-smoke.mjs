import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var post = fs.readFileSync(new URL("../docs/post-55-bosses.md", import.meta.url), "utf8");
var roster = fs.readFileSync(new URL("../docs/boss-roster.md", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");

assert(/\{ id: "cartographer",[\s\S]*?hp: 2600,/.test(galaga), "Cartographer HP 2600");
assert(galaga.indexOf('p2Text: "THE MAP SLIDES"') >= 0, "remap banner");
assert(galaga.indexOf('p3Text: "EDGES AGREE"') >= 0, "fold banner");
assert(galaga.indexOf('p4Text: "THE ATLAS"') >= 0, "atlas banner");
assert(galaga.indexOf("THE MAP OPENS") >= 0, "chart banner");
assert(galaga.indexOf("function scrambleCartographerLinks") >= 0, "wrap pairs scramble");
assert(galaga.indexOf("function startCartographerSlide") >= 0, "adjacent slot slides");
assert(galaga.indexOf("function wrapCartographer") >= 0, "edge wrap");
assert(galaga.indexOf("function paneEdgeStrip") >= 0, "matching-color wrap edges");
assert(galaga.indexOf("PANE_EDGE_COLS") >= 0, "four wrap colors");
assert(galaga.indexOf("k.ox = Math.sin(fight.paneT") < 0, "sine wobble gone");
assert(galaga.indexOf("linkCartEdges(h[0], \"R\", h[1], \"L\"") >= 0, "R-L wrap pairs");
assert(galaga.indexOf("linkCartEdges(v[0], \"D\", v[1], \"U\"") >= 0, "D-U wrap pairs");
assert(galaga.indexOf("if (fight.panes && fight.panes.length) return { lo: margin, hi: H - margin - sand }") >= 0, "full field while panes are up");
assert(galaga.indexOf("aimedWedge(e.x, e.y + 8, tgt.x, tgt.y, n") >= 0, "volleys aim at the live player");
assert(galaga.indexOf("fromPerk, \"pin\"") >= 0 || galaga.indexOf('fromPerk !== "pin"') >= 0 || galaga.indexOf(', b.owner, "pin")') >= 0, "gold pins still chip the body");
assert(galaga.indexOf('base: ["chart"]') >= 0 && galaga.indexOf('p4: ["atlas"]') >= 0, "four exclusive phases stay");

assert(galaga.indexOf("if (b.bounces > 0) { b.color = FIGHT_RED; b.glow = FIGHT_RED; }") >= 0, "bounced shots read as red");
assert(galaga.indexOf("if (!consumed && fight.bounce && (b.bounces || 0) > 0)") >= 0, "bounced player shots can hit ships");
assert(galaga.indexOf("else playerDie(pl);") >= 0, "PvE bounced shots kill");
assert(galaga.indexOf("function clearAxiomRules") >= 0 && galaga.indexOf("fight.bounce = false") >= 0, "bounce clears with the phase");
assert(galaga.indexOf('text: "YOUR BULLETS BOUNCE"') >= 0, "rule card stays");
assert(galaga.indexOf("a = AXIOM_RULES[1]") >= 0 && galaga.indexOf("b = AXIOM_RULES[4]") >= 0, "mix still includes bounce");

assert(/var VER = 11;/.test(codec), "codec payload unchanged");
assert(sw.indexOf("galaga-coop-v71") >= 0, "PWA cache bump");
assert(post.indexOf("sliding-puzzle of map panes") >= 0, "docs describe the puzzle");
assert(post.indexOf("After a bounce they are red and damage the player") >= 0, "docs say bounced shots hurt");
assert(roster.indexOf("colored wrap edges") >= 0, "roster notes wrap edges");

console.log("cartographer-axiom-smoke: ok");
