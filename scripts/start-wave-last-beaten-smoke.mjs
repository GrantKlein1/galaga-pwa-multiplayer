import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var js = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");

function maxStartWave(lv) {
  if (lv < 10) return 1;
  return 5 + Math.floor((lv - 10) / 5) * 5;
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
assert(lastBeatenStartWave(32, 8, 33) === 1, "low XP still only shows 1");
assert(lastBeatenStartWave(32, 15, 33) === 10, "lv15 cap 10");
assert(lastBeatenStartWave(40, 50, 30) === 25, "do not land on locked 30");
assert(adjacentStep(30, 1, 50, 40) === 35, "right step size unchanged");
assert(adjacentStep(30, -1, 50, 40) === 25, "left step size unchanged");
assert(startWaveUnlocked(30, 30) === false, "unlock still maxWave > N");
assert(startWaveUnlocked(30, 31) === true, "cleared 30 unlocks start 30");

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

assert(js.indexOf("function lastBeatenStartWave") >= 0, "helper present");
assert(js.indexOf("function rememberLastBeatenStartWave") >= 0, "remember after run");
assert(js.indexOf("rememberLastBeatenStartWave()") >= 0, "finishRun calls remember");
assert(js.indexOf("clearedWave: 0") >= 0, "run tracks last clear");
assert(js.indexOf("n === wave + 1") >= 0, "spawnWave records clear");
assert(js.indexOf("sb.w === wave + 1") >= 0, "client snap records clear");
assert(js.indexOf("clearedWave: run.clearedWave || 0") >= 0, "host over includes clear");
assert(js.indexOf("startWaveUnlocked") >= 0 && js.indexOf("reachedStartWave(reached) > n") >= 0, "unlock rule unchanged");
assert(sw.indexOf("galaga-coop-v41") >= 0, "cache bump");

console.log("start-wave-last-beaten-smoke: ok");
