import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var post = fs.readFileSync(new URL("../docs/post-55-bosses.md", import.meta.url), "utf8");
var roster = fs.readFileSync(new URL("../docs/boss-roster.md", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");

assert(galaga.indexOf('base: ["warp"]') >= 0, "Warp threads stay p1");
assert(galaga.indexOf('p2: ["weft"]') >= 0, "Weft threads stay p2");
assert(galaga.indexOf('p3: ["cocoon"]') >= 0, "Cocoon threads stay p3");
assert(galaga.indexOf("function spawnLoomWarp") >= 0, "warp spawn stays");
assert(galaga.indexOf("function spawnLoomWeft") >= 0, "weft spawn stays");
assert(galaga.indexOf("function spawnLoomCocoon") >= 0, "cocoon spawn stays");
assert(galaga.indexOf("function armLoomShuttle") >= 0, "periodic shuttle arm");
assert(galaga.indexOf("function fireLoomShuttle") >= 0, "shuttle fire");
assert(galaga.indexOf('e.type === "loom" && enterT <= 0') >= 0, "shuttle ticks while Loom is in form");
assert(galaga.indexOf("e.loomShotT = 1.22") >= 0, "shuttle cadence is periodic");
assert(galaga.indexOf("aimedWedge(e.x, e.y + 8, tx, ty, 1, 0, Math.max((spd || 160) + 100, 260)") >= 0, "one dart aimed at live x,y, fast enough to reach the bottom");
assert(galaga.indexOf('addTele("flash", e.x, e.y, e.aimX, e.aimY, delay, FIGHT_WHITE)') >= 0, "white flash telegraph");
assert(galaga.indexOf('addTele("line", e.x, e.y + 8, e.aimX, e.aimY, delay, FIGHT_WHITE)') >= 0, "white line to the live player");
assert(galaga.indexOf("tel.follow = true") >= 0, "telegraph tracks the live player");
assert(galaga.indexOf("fallbackAimY()") >= 0 && galaga.indexOf("function fallbackAimY") >= 0, "bottom of the field is a valid aim");
assert(galaga.indexOf("function addKnot") >= 0 && galaga.indexOf("function addThread") >= 0, "knots and threads stay");

assert(/var VER = 11;/.test(codec), "codec payload unchanged");
assert(sw.indexOf("galaga-coop-v68") >= 0, "PWA cache bump");
assert(post.indexOf("Periodically fires a red shuttle dart") >= 0, "docs mention the shuttle");
assert(post.indexOf("Sitting at the bottom is not safe") >= 0, "docs say bottom camping is unsafe");
assert(roster.indexOf("periodic aimed shuttle") >= 0, "roster notes the shuttle");

console.log("loom-shuttle-smoke: ok");
