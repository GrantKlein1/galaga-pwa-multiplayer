import fs from "fs";
import {
  accountKey,
  sanitizeDisplayName,
  sanitizeUsername,
  parseAccountToken,
  blobEtagFromGet,
  isBlobMissing,
  isExistsWriteError,
  isPreconditionWriteError
} from "../api/account.js";
import { nameTakenByOther, nameKey } from "../api/leaderboard.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var js = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var account = fs.readFileSync(new URL("../api/account.js", import.meta.url), "utf8");

assert(sanitizeDisplayName("Grant") === "Grant", "keep display casing");
assert(sanitizeDisplayName("ab") === "", "display name min 3");
assert(sanitizeDisplayName("Grant Klein") === "Grant Klein", "spaces allowed");
assert(accountKey("Grant") === "grant", "old username key still matches");
assert(accountKey("GRANT") === "grant", "case-insensitive account id");
assert(accountKey("Grant Klein") === "grant_klein", "spaces become underscores");
assert(accountKey("cool_guy") === "cool_guy", "old underscore usernames");
assert(sanitizeUsername("grant") === "grant", "sanitizeUsername aliases accountKey");

var oldTok = "grant." + "ab".repeat(32);
var parsedOld = parseAccountToken(oldTok);
assert(parsedOld && parsedOld.username === "grant", "old username tokens still parse");
var dotted = "grant.k." + "cd".repeat(32);
var parsedDot = parseAccountToken(dotted);
assert(parsedDot && parsedDot.username === "grant.k", "keys with dots use lastIndexOf");
assert(!parseAccountToken("grant.not-a-token"), "reject short secrets");

assert(blobEtagFromGet(null) === null, "null get");
assert(blobEtagFromGet({ blob: { etag: '"abc"' } }) === '"abc"', "etag on blob");
assert(blobEtagFromGet({ etag: '"xyz"' }) === '"xyz"', "etag on result");
assert(blobEtagFromGet({ headers: { get: function (k) { return k === "etag" ? '"hdr"' : ""; } } }) === '"hdr"', "etag from headers");

assert(isBlobMissing({ statusCode: 404 }), "404 is missing");
assert(isBlobMissing({ message: "Blob not found" }), "not found message");
assert(!isBlobMissing({ message: "Invalid token" }), "token errors are not missing");
assert(isExistsWriteError({ message: "This blob already exists" }), "exists write");
assert(isPreconditionWriteError({ statusCode: 412 }), "412 is precondition");
assert(!isExistsWriteError({ statusCode: 412 }), "412 is not exists");

var board = {
  entries: [
    { id: "pilot-aaa", name: "Grant", score: 10 },
    { id: "pilot-bbb", name: "Sam", score: 5 }
  ]
};
assert(nameKey("Grant Klein") === "grant_klein", "leaderboard name key");
assert(nameTakenByOther(board, "grant", "other-pid"), "board name taken");
assert(!nameTakenByOther(board, "Grant", "pilot-aaa"), "same pid may keep name");
assert(!nameTakenByOther(board, "Nova", "pilot-aaa"), "unused name free");

assert(html.indexOf("Save progress") >= 0, "save progress copy");
assert(html.indexOf("Create account") < 0, "create account gone");
assert(html.indexOf("id=\"btn-account-save\"") >= 0, "save button");
assert(html.indexOf("id=\"btn-account-go\"") >= 0, "wizard continue");
assert(html.indexOf("Display name") >= 0, "display name field");
assert(js.indexOf("openAccountSave") >= 0, "save wizard");
assert(js.indexOf('accountStep === "save-pass"') >= 0, "password first");
assert(js.indexOf('accountStep === "save-name"') >= 0, "then unique name");
assert(js.indexOf('accBtn.textContent = accountSession ? "Sign out" : "Save progress"') >= 0, "hub control");
assert(js.indexOf("if (accountSession) signOutAccount()") >= 0, "hub sign out");
assert(js.indexOf('body.op = "save"') >= 0, "posts save");
assert(js.indexOf("nameIn.readOnly = signed") >= 0, "lock board name while signed in");
assert(account.indexOf("handleSave") >= 0, "save op");
assert(account.indexOf('op === "save" || op === "create"') >= 0, "create alias");
assert(account.indexOf('error: "busy"') < 0, "no user-facing busy");
assert(account.indexOf("writeAccount(username, next.acct, null, false)") >= 0, "etag fallback overwrite");
assert(account.indexOf("displayNameConflict") >= 0, "leaderboard uniqueness");
assert(account.indexOf("headAccount") >= 0, "get-miss confirmed with head");
assert(sw.indexOf("galaga-coop-v49") >= 0, "cache bump");

console.log("account-save-smoke: ok");
