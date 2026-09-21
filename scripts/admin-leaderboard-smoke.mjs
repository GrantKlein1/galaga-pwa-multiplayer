import fs from "fs";
import { applyHide, applyScore, publicView, nameTakenByOther } from "../api/leaderboard.js";
import { sanitizeProfile } from "../api/account.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var js = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var readme = fs.readFileSync(new URL("../README.md", import.meta.url), "utf8");
var account = fs.readFileSync(new URL("../api/account.js", import.meta.url), "utf8");

var admin = "admin-aaaa";
var other = "pilot-bbb";
var board = {
  v: 1,
  entries: [
    { id: admin, name: "Grant", score: 9000, at: 1 },
    { id: other, name: "Sam", score: 1200, at: 2 }
  ]
};

var listed = publicView(board, admin);
assert(listed.you && listed.you.rank === 1, "admin listed before hide");
assert(listed.entries.length === 2, "both rows public before hide");
assert(listed.total === 2, "total 2 before hide");

var hidden = applyHide(board, admin);
assert(hidden.entries.length === 1 && hidden.entries[0].id === other, "blob drops admin row");
assert(hidden.hidden.indexOf(admin) >= 0, "pid recorded hidden");

var view = publicView(hidden, admin);
assert(view.you === null, "no you rank while hidden");
assert(view.entries.length === 1 && view.entries[0].name === "Sam", "other pilots unchanged");
assert(view.total === 1, "total excludes hidden");

var leftover = {
  v: 1,
  entries: [
    { id: admin, name: "Grant", score: 9000, at: 1 },
    { id: other, name: "Sam", score: 1200, at: 2 }
  ],
  hidden: [admin]
};
var filtered = publicView(leftover, admin);
assert(filtered.you === null, "GET hides leftover admin row");
assert(filtered.entries.length === 1, "GET does not return leftover admin");

var scored = applyScore(hidden, admin, "Grant", 99000, 9);
assert(scored.skipped, "score post skipped after hide");
assert(scored.board.entries.length === 1 && scored.board.entries[0].id === other, "score post cannot re-add");

var otherUp = applyScore(hidden, other, "Sam", 2000, 9);
assert(!otherUp.skipped, "other pilots still post");
assert(otherUp.board.entries[0].score === 2000, "other score updated");

assert(nameTakenByOther(hidden, "Sam", admin), "other name still unique-blocked");
assert(!nameTakenByOther(hidden, "Sam", other), "same pid may keep name");
assert(!nameTakenByOther(hidden, "Nova", other), "unused name is free");

var guest = sanitizeProfile({});
assert(guest.admin === false, "cloud guest admin off");
assert(sanitizeProfile({ admin: true, pid: "abcdefgh" }).admin === true, "cloud keeps admin");

assert(account.indexOf("admin: false") >= 0, "cloud default admin false");
assert(js.indexOf("profile.admin = true") >= 0, "unlock sets admin flag");
assert(js.indexOf("keepAdmin") >= 0, "reset keeps admin");
assert(js.indexOf("function hideLeaderboard") >= 0, "hide helper");
assert(js.indexOf("hide: true") >= 0, "client posts hide");
assert(js.indexOf("function submitLeaderboard") >= 0, "submit still exists");
assert(js.indexOf("if (profileAdmin())") >= 0, "admin gates submit and ranks");
assert(js.indexOf('profileAdmin() ? null : (data && data.you)') >= 0, "paint drops you while admin");
assert(js.indexOf("grantAllUnlocks") >= 0, "hangar grant unchanged");
assert(sw.indexOf("galaga-coop-v50") >= 0, "cache bump");
assert(readme.toLowerCase().indexOf("passcode") < 0, "readme has no passcode");
assert(readme.indexOf("1234") < 0, "readme has no code");
assert(readme.toLowerCase().indexOf("admin") < 0, "readme has no admin");

console.log("admin-leaderboard-smoke: ok");
