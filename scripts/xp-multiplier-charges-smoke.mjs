import fs from "fs";
import { sanitizeProfile } from "../api/account.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
var css = fs.readFileSync(new URL("../css/app.css", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
var account = fs.readFileSync(new URL("../api/account.js", import.meta.url), "utf8");
var codec = fs.readFileSync(new URL("../js/netcodec.js", import.meta.url), "utf8");

function catalog(name) {
  var re = new RegExp("var " + name + " = \\[([\\s\\S]*?)\\n  \\];");
  var m = galaga.match(re);
  assert(m, "missing catalog " + name);
  return m[1];
}

assert(galaga.indexOf("var PROFILE_VER = 7") >= 0, "profile ver 7");
assert(galaga.indexOf("xpCharges: 0") >= 0, "default banked charges");
assert(galaga.indexOf("xpBoostArmed: false") >= 0, "default unarmed");
assert(galaga.indexOf("p.xpCharges = clampXpCharges(raw.xpCharges)") >= 0, "migrate charges");
assert(galaga.indexOf("p.xpBoostArmed = !!raw.xpBoostArmed") >= 0, "migrate armed");
assert(galaga.indexOf("out.xpCharges = clampXpCharges(Math.max(local.xpCharges | 0, cloud.xpCharges | 0))") >= 0, "merge max charges");
assert(galaga.indexOf("out.xpBoostArmed = !!newer.xpBoostArmed") >= 0, "merge armed from newer");
assert(!/profile\.totalXp\s*-=/.test(galaga), "do not spend totalXp");

var adminFn = galaga.match(/function grantAllUnlocks\(\) \{[\s\S]*?\n  \}/);
assert(adminFn, "admin unlock fn");
assert(adminFn[0].indexOf("xpCharges") < 0, "admin unlock does not grant charges");

assert(galaga.indexOf("grantXpCharge(boost)") >= 0, "applyReward grants charges");
assert(galaga.indexOf("function claimQuest") >= 0, "claimQuest still the take path");
assert(galaga.indexOf("function xpBoostRewardLabel") >= 0, "boost label helper");
assert(galaga.indexOf(" XP boost") >= 0, "Take-reward +N XP boost copy");
assert(galaga.indexOf("function questBonusLabel") >= 0, "skill + boost take UI");

assert(galaga.indexOf("function maybeDropXpBoost") >= 0, "boss drop helper");
assert(galaga.indexOf("maybeDropXpBoost(e)") >= 0, "boss guaranteed path rolls boost");
assert(galaga.indexOf('spawnPickup(e.x + rand(-10, 10), e.y + 18, "xpboost")') >= 0, "pickup not instant");
assert(galaga.indexOf("var BOSS_XP_BOOST_CHANCE = 0.12") >= 0, "dedicated chance modest");
assert(galaga.indexOf("var GUEST_XP_BOOST_CHANCE = 0.07") >= 0, "guest chance lower so it is not a farm");
assert(galaga.indexOf('if (bossDropsHealth(e)) spawnPickup(e.x, e.y, "heal")') >= 0, "debut heal stays");
assert(galaga.indexOf('kind === "xpboost"') >= 0, "pickup grant path");
assert(galaga.indexOf("grantXpChargeTo(who, 1)") >= 0, "picker's profile only");
assert(galaga.indexOf('netSend({ t: "xpboost"') >= 0, "host tells partner they picked it");
assert(galaga.indexOf('n.on("xpboost"') >= 0, "client receives own grant");

assert(galaga.indexOf("function armXpBoost") >= 0, "arm control");
assert(galaga.indexOf("function consumeArmedXpBoost") >= 0, "start consumes armed charge");
assert(galaga.indexOf("run.xpMul = XP_BOOST_MUL") >= 0, "one run gets 2x");
assert(galaga.indexOf("consumeArmedXpBoost(!!(opts.pvp") >= 0, "PvP does not spend the charge");
assert(galaga.indexOf("* xpMul") >= 0, "finishRun applies mul to XP only");
assert(galaga.indexOf("score += pts;") >= 0, "displayed score unchanged");
assert(html.indexOf('id="hub-boosts"') >= 0, "hub banked count");
assert(html.indexOf('id="btn-xp-boost"') >= 0, "hub arm near Play");
assert(html.indexOf('id="btn-lobby-xp-boost"') >= 0, "lobby arm for co-op");
assert(css.indexOf(".xp-boost-lab") >= 0, "hub boost style");
assert(galaga.indexOf("XP boosts:") >= 0, "banked copy");
assert(galaga.indexOf("Armed · 2× XP next run") >= 0, "armed copy");
assert(galaga.indexOf("btn.disabled = armed || n < 1") >= 0, "disabled with none or already armed");

assert(galaga.indexOf("xpBonus: run.xpBonus || 0") >= 0, "co-op over carries harder-kill bonus");
assert(galaga.indexOf("if (msg.xpBonus != null) run.xpBonus = msg.xpBonus || 0") >= 0, "client banks host xpBonus");
assert(galaga.indexOf("run.xpBonus = (run.xpBonus || 0) + (credit.xpBonus || 0);") >= 0, "skip-start still credits XP");

assert(account.indexOf("xpCharges: 0") >= 0, "cloud default");
assert(account.indexOf("p.xpCharges = asInt(raw.xpCharges, 99)") >= 0, "cloud sanitize count");
assert(account.indexOf("p.xpBoostArmed = !!raw.xpBoostArmed") >= 0, "cloud sanitize armed");
assert(account.indexOf("v: 7") >= 0, "cloud profile ver");
assert(codec.indexOf('"xpboost"') >= 0, "snap codec knows the pickup");
assert(sw.indexOf("galaga-coop-v52") >= 0, "PWA cache bump");

var empty = sanitizeProfile({});
assert(empty.xpCharges === 0 && empty.xpBoostArmed === false, "sanitize defaults");
assert(empty.v === 7, "sanitize ver");
var kept = sanitizeProfile({ xpCharges: 4, xpBoostArmed: true, totalXp: 800 });
assert(kept.xpCharges === 4 && kept.xpBoostArmed === true, "sanitize keeps count and armed");
assert(kept.totalXp === 800, "totalXp untouched");
assert(sanitizeProfile({ xpCharges: 5000 }).xpCharges === 99, "cloud cap 99");
assert(sanitizeProfile({ xpCharges: -3 }).xpCharges === 0, "no negative charges");

var dailies = catalog("DAILY_DEFS");
var longs = catalog("LONG_DEFS");
var dailyBoost = (dailies.match(/xpBoost: 1/g) || []).length;
var longBoost = (longs.match(/xpBoost: 1/g) || []).length;
var dailyCount = (dailies.match(/id: "d_/g) || []).length;
var longCount = (longs.match(/id: "lt_/g) || []).length;
assert(dailyBoost >= 3 && dailyBoost < dailyCount, "some harder dailies, not all, got " + dailyBoost + "/" + dailyCount);
assert(longBoost >= 6 && longBoost < longCount, "some long-term tiers, not all, got " + longBoost + "/" + longCount);
assert(/id: "d_grunts"[\s\S]*?reward: \{ coins: 30 \}/.test(dailies), "easy grunt daily has no boost");
assert(/id: "d_kills90"[\s\S]*?xpBoost: 1/.test(dailies), "Massacre grants a boost");
assert(/id: "d_wave10"[\s\S]*?reward: \{ coins: 30 \}/.test(dailies), "First Push has no boost");

var XP_SCORE_MUL = 0.15;
function bank(score, bonus, mul) {
  return Math.round((score + bonus) * XP_SCORE_MUL * (mul || 1));
}
assert(bank(10000, 0, 1) === 1500, "base bank");
assert(bank(10000, 0, 2) === 3000, "armed doubles XP not score");
assert(bank(450, 450, 2) === 270, "2x includes harder-kill xpBonus");
assert(bank(450, 450, 2) === 2 * bank(450, 450, 1), "exactly double");

console.log("xp-multiplier-charges-smoke: ok  dailies=" + dailyBoost + "  long=" + longBoost);
