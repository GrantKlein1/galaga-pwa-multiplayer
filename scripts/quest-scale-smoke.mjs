import { sanitizeProfile } from "../api/account.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var raw = {
  v: 3,
  coins: 1200,
  totalXp: 8000,
  ownedShips: ["wisp"],
  ownedGuns: ["pulse"],
  dailies: {
    date: "2026-09-13",
    ids: ["d_tanks", "d_boss", "d_score"],
    progress: { d_tanks: 10 },
    claimed: { d_boss: true },
    tier: { d_tanks: 2 },
    target: { d_tanks: 22 }
  },
  dailyTracks: { d_tanks: 4 },
  longTerm: {
    lt_wave20: { progress: 0, claimed: false, tier: 3, mark: 55 }
  },
  stats: { maxWave: 55, killsByType: {}, bosses: {} }
};

var p = sanitizeProfile(raw);
assert(p.v === 6, "profile version 6");
assert(p.admin === false, "guest admin off");
assert(p.coins === 1200, "coins kept");
assert(p.dailies.tier.d_tanks === 2, "frozen daily tier kept");
assert(p.dailies.target.d_tanks === 22, "frozen daily target kept");
assert(p.dailyTracks.d_tanks === 4, "daily track kept");
assert(p.longTerm.lt_wave20.tier === 3, "long tier kept");
assert(p.longTerm.lt_wave20.mark === 55, "long mark kept");
assert(p.longTerm.lt_wave20.claimed === false, "claimed flag kept");
raw.admin = true;
assert(sanitizeProfile(raw).admin === true, "admin flag kept");
console.log("quest-scale-smoke: ok");
