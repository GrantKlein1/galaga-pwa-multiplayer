import {
  applyDenied,
  applyHide,
  applyScore,
  isDeniedName,
  needsPersist,
  publicView
} from "../api/leaderboard.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var banned = "6216aaaa";
var otherPilot = "6217bbbb";
var neighbor = "pilotccc";
var board = {
  v: 1,
  entries: [
    { id: banned, name: "Pilot-6216", score: 8800, at: 1 },
    { id: otherPilot, name: "Pilot-6217", score: 5000, at: 2 },
    { id: neighbor, name: "Nova", score: 3000, at: 3 }
  ]
};

assert(isDeniedName({}, "Pilot-6216"), "seed denies Pilot-6216");
assert(isDeniedName({}, " pilot-6216 "), "trim and case-insensitive");
assert(!isDeniedName({}, "Pilot-6217"), "other Pilot-* names stay visible");
assert(!isDeniedName({}, "Pilot-62160"), "prefix-only lookalikes stay visible");
assert(!isDeniedName({}, "Pilot-621"), "shorter Pilot-* stays visible");

var listed = publicView(board, banned);
assert(listed.entries.every(function (e) { return e.name !== "Pilot-6216"; }), "GET omits Pilot-6216");
assert(listed.entries.some(function (e) { return e.name === "Pilot-6217"; }), "GET keeps Pilot-6217");
assert(listed.you === null, "no you rank for denied name");
assert(listed.total === 2, "total excludes denied name");

var scrubbed = applyDenied(board);
assert(scrubbed.entries.every(function (e) { return e.id !== banned; }), "row dropped from blob");
assert(scrubbed.hidden.indexOf(banned) >= 0, "pid recorded in hidden");
assert(scrubbed.deniedNames.indexOf("Pilot-6216") >= 0, "name denylist persisted");
assert(scrubbed.entries.some(function (e) { return e.id === otherPilot; }), "other Pilot-* row kept");
assert(needsPersist(board, scrubbed), "GET persist writes drop + denylist");

var leftover = {
  v: 1,
  entries: [
    { id: banned, name: "Pilot-6216", score: 8800, at: 1 },
    { id: otherPilot, name: "Pilot-6217", score: 5000, at: 2 }
  ],
  hidden: [banned],
  deniedNames: ["Pilot-6216"]
};
var filtered = publicView(leftover, banned);
assert(filtered.you === null, "GET hides leftover denied row");
assert(filtered.entries.length === 1 && filtered.entries[0].name === "Pilot-6217", "GET does not return leftover");
assert(needsPersist(leftover, applyDenied(leftover)), "leftover denied row is deleted from blob");
var clean = applyDenied(leftover);
assert(!needsPersist(clean, applyDenied(clean)), "already scrubbed board stays put");

var scored = applyScore(board, banned, "Pilot-6216", 99000, 9);
assert(scored.skipped, "score post skipped for denied name");
assert(scored.board.entries.every(function (e) { return e.id !== banned; }), "score post cannot re-add");
assert(scored.board.hidden.indexOf(banned) >= 0, "denied-name post hides pid");

var renamed = applyScore(scrubbed, banned, "Ghost", 99000, 9);
assert(renamed.skipped, "hidden pid cannot return under a new name");
assert(renamed.board.entries.every(function (e) { return e.id !== banned; }), "rename post cannot re-add");

var otherUp = applyScore(scrubbed, otherPilot, "Pilot-6217", 6000, 9);
assert(!otherUp.skipped, "other Pilot-* still post");
assert(otherUp.board.entries[0].score === 6000, "other Pilot-* score updated");

var nova = applyScore(scrubbed, neighbor, "Nova", 4000, 9);
assert(!nova.skipped, "unrelated pilots still post");
assert(nova.board.deniedNames.indexOf("Pilot-6216") >= 0, "score post keeps denylist");

var admin = applyHide(scrubbed, neighbor);
assert(admin.hidden.indexOf(neighbor) >= 0, "admin hide still records pid");
assert(admin.deniedNames.indexOf("Pilot-6216") >= 0, "admin hide keeps denylist");
assert(admin.entries.every(function (e) { return e.id !== neighbor; }), "admin hide still drops row");

console.log("hide-pilot-6216-smoke: ok");
