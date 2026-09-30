import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var js = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");

function maxStartWave(lv) {
  if (lv < 5) return 1;
  return Math.floor(lv / 5) * 5;
}
function startWaveOptions(lv) {
  var max = maxStartWave(lv), out = [1], n;
  for (n = 5; n <= max; n += 5) out.push(n);
  return out;
}
function startWaveUnlocked(n, reached) {
  n = n | 0;
  if (n <= 1) return true;
  return (reached | 0) > n;
}
function clampStartWave(n, lv, reached) {
  var opts = startWaveOptions(lv), i, best = 1;
  n = n | 0;
  for (i = 0; i < opts.length; i++) {
    if (opts[i] <= n && startWaveUnlocked(opts[i], reached)) best = opts[i];
  }
  return best;
}
function lastBeatenStartWave(cleared, lv, reached) {
  cleared = cleared | 0;
  if (cleared < 1) return 1;
  return clampStartWave(cleared, lv, reached);
}

assert(lastBeatenStartWave(0, 50, 0) === 1, "never cleared stays 1");
assert(lastBeatenStartWave(32, 50, 33) === 30, "beat 32 die on 33 -> Wave 30");
assert(lastBeatenStartWave(4, 50, 5) === 1, "beat 4 snaps to 1");
assert(lastBeatenStartWave(5, 50, 6) === 5, "beat 5 stays 5");
assert(lastBeatenStartWave(34, 50, 35) === 30, "beat 34 -> 30");
assert(lastBeatenStartWave(35, 50, 36) === 35, "beat 35 unlocks 35");
assert(lastBeatenStartWave(32, 4, 33) === 1, "lv4 still only shows 1");
assert(lastBeatenStartWave(32, 8, 33) === 5, "lv8 cap 5");
assert(lastBeatenStartWave(32, 15, 33) === 15, "lv15 cap 15");
assert(lastBeatenStartWave(20, 20, 21) === 20, "beat 20 and lv20 start 20");
assert(lastBeatenStartWave(20, 19, 21) === 15, "lv19 cannot start 20");
assert(lastBeatenStartWave(20, 25, 21) === 20, "lv25 still needs to beat 25");
assert(lastBeatenStartWave(40, 50, 30) === 25, "do not land on locked 30");
assert(adjacentStep(30, 1, 50, 40) === 35, "right step size unchanged");
assert(adjacentStep(30, -1, 50, 40) === 25, "left step size unchanged");
assert(startWaveUnlocked(30, 30) === false, "unlock still maxWave > N");
assert(startWaveUnlocked(30, 31) === true, "cleared 30 unlocks start 30");
assert(lastBeatenStartWave(102, 150, 200) === 100, "non-admin last beaten 102 -> 100");
assert(lastBeatenStartWave(107, 150, 200) === 105, "non-admin last beaten 107 -> 105");
assert(lastBeatenStartWave(145, 150, 151) === 145, "non-admin 145 stays on the 5-step");
assert(lastBeatenStartWave(150, 150, 151) === 150, "non-admin can start 150");
assert(adjacentStep(100, 1, 150, 151) === 105, "right step past 100 is still 5");
assert(adjacentStep(145, 1, 150, 151) === 150, "step to 150");
assert(adjacentStep(150, 1, 150, 151) === 150, "150 is the non-admin cap at lv150");
assert(clampStartWaveAdmin(107) === 107, "admin keeps 107");
assert(clampStartWaveAdmin(101) === 101, "admin can start 101");
assert(clampStartWaveAdmin(150) === 150, "admin can start 150");
assert(clampStartWaveAdmin(151) === 151, "admin not capped at 150");
assert(clampStartWaveAdmin(0) === 1, "admin min 1");
assert(clampStartWaveAdmin(10000) === 9999, "admin cloud-aligned cap");
assert(adjacentAdmin(107, 1) === 108, "admin steps by 1");
assert(adjacentAdmin(107, -1) === 106, "admin steps back by 1");
assert(adjacentAdmin(1, -1) === 1, "admin does not go below 1");

function adjacentStep(from, dir, lv, reached) {
  var list = [], opts = startWaveOptions(lv), i, cur = clampStartWave(from, lv, reached);
  for (i = 0; i < opts.length; i++) {
    if (startWaveUnlocked(opts[i], reached)) list.push(opts[i]);
  }
  for (i = 0; i < list.length; i++) {
    if (list[i] === cur) {
      if (list[i + dir] != null) return list[i + dir];
      return cur;
    }
  }
  return cur;
}
function clampStartWaveAdmin(n) {
  n = n | 0;
  if (n < 1) return 1;
  if (n > 9999) return 9999;
  return n;
}
function adjacentAdmin(from, dir) {
  return clampStartWaveAdmin((from | 0) + (dir < 0 ? -1 : 1));
}

assert(js.indexOf("function lastBeatenStartWave") >= 0, "helper present");
assert(js.indexOf("function rememberLastBeatenStartWave") >= 0, "remember after run");
assert(js.indexOf("rememberLastBeatenStartWave()") >= 0, "finishRun calls remember");
assert(js.indexOf("clearedWave: 0") >= 0, "run tracks last clear");
assert(js.indexOf("n === wave + 1") >= 0, "spawnWave records clear");
assert(js.indexOf("sb.w === wave + 1") >= 0, "client snap records clear");
assert(js.indexOf("clearedWave: run.clearedWave || 0") >= 0, "host over includes clear");
assert(js.indexOf("startWaveUnlocked") >= 0 && js.indexOf("reachedStartWave(reached) > n") >= 0, "unlock rule unchanged");
assert(js.indexOf("var MAX_LEVEL = 150") >= 0, "level cap 150");
assert(js.indexOf("var ADMIN_MAX_START_WAVE = 9999") >= 0, "admin any-wave cap");
assert(js.indexOf("Admin: any wave") >= 0, "admin picker copy");
assert(js.indexOf("opts.fromNet || (profile && profile.admin)") >= 0, "coop honors host non-5 start");
assert(sw.indexOf("galaga-coop-v69") >= 0, "cache bump");

console.log("start-wave-last-beaten-smoke: ok");
