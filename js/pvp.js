(function (root) {
  var RARITIES = ["common", "rare", "epic", "legendary"];
  var RARITY_RANK = { common: 0, rare: 1, epic: 2, legendary: 3 };
  var BOSS_IDS = [
    "seraph", "wraith", "hydra", "colossus", "chronos",
    "leviathan", "inferno", "nullwarden", "basilisk", "overlord",
    "mandala", "cenotaph", "kaleido", "helios", "selene", "pentarch"
  ];
  var DRAFT_STEPS = ["ship", "mod", "skin", "gun"];
  // Insane duel only (not co-op / PvE bosses).
  var PVP_HP = 7;
  var PVP_HIT_INVULN = 0.16;
  var PVP_FIRE_CD = 1.92; // 2.4s / 1.25 — +25% fire rate vs prior Insane kits
  var ABILITY_CD = 4;
  var ABILITY_GCD = 0.45;
  var ABILITY_KEYS = ["1", "2", "3", "4", "5", "6"];
  var ROUND_HOLD = 1.85;
  var ROUND_WIN_TEXT = "YOU WIN THE ROUND";
  var ROUND_LOST_TEXT = "ROUND LOST";
  var WIN_COINS = 80;
  var WIN_XP = 400;
  var LOSE_COINS = 30;
  var LOSE_XP = 150;

  // First-cycle PvE kit (base + p2 + p3). Phase hooks (regrow / voidguard / core) stay PvE-only.
  // FIRE is the repeating primary. Number keys 1–6 are the rest, each with its own cooldown.
  var BOSS_KITS = {
    seraph: {
      fire: "aimed", ability: "fan",
      fireHint: "SPACE / FIRE — aimed volley",
      abilityHint: "1 — feather fan",
      abilities: [
        { id: "fan", key: "1", name: "Fan", cd: 4.4 },
        { id: "ram", key: "2", name: "Dive ram", cd: 6.4 },
        { id: "halo", key: "3", name: "Halo", cd: 5.6 },
        { id: "fan2", key: "4", name: "Staggered fans", cd: 6.8 }
      ]
    },
    wraith: {
      fire: "spiral", ability: "blink",
      fireHint: "SPACE / FIRE — spiral burst",
      abilityHint: "1 — blink shot",
      abilities: [
        { id: "blink", key: "1", name: "Blink shot", cd: 6.2 },
        { id: "mines", key: "2", name: "Void mines", cd: 5.4 },
        { id: "sweep", key: "3", name: "Wide sweep", cd: 6.8 },
        { id: "blink2", key: "4", name: "Double blink", cd: 8.2 }
      ]
    },
    hydra: {
      fire: "fan", ability: "beam",
      fireHint: "SPACE / FIRE — fang fan",
      abilityHint: "1 — beam column",
      abilities: [
        { id: "beam", key: "1", name: "Beam", cd: 5.4 },
        { id: "rain", key: "2", name: "Fang rain", cd: 6.6 },
        { id: "summon", key: "3", name: "Siphon volley", cd: 7.2 },
        { id: "lunge", key: "4", name: "Lunge", cd: 6.6 },
        { id: "summontank", key: "5", name: "Tank volley", cd: 8.4 },
        { id: "lunge2", key: "6", name: "Double lunge", cd: 8.8 }
      ]
    },
    colossus: {
      fire: "ring", ability: "charge",
      fireHint: "SPACE / FIRE — cannon ring",
      abilityHint: "1 — lane charge",
      abilities: [
        { id: "charge", key: "1", name: "Lane charge", cd: 6.6 },
        { id: "homing", key: "2", name: "Missiles", cd: 6.2 },
        { id: "shock", key: "3", name: "Shockwave", cd: 7.0 },
        { id: "ring2", key: "4", name: "Double rings", cd: 7.4 },
        { id: "meteor", key: "5", name: "Meteor row", cd: 8.2 }
      ]
    },
    chronos: {
      fire: "tick", ability: "rewind",
      fireHint: "SPACE / FIRE — frozen ticks",
      abilityHint: "1 — rewind dash",
      abilities: [
        { id: "rewind", key: "1", name: "Rewind", cd: 6.8 },
        { id: "pendulum", key: "2", name: "Pendulum", cd: 6.6 },
        { id: "ticksplit", key: "3", name: "Split ticks", cd: 7.4 }
      ]
    },
    leviathan: {
      fire: "surge", ability: "whip",
      fireHint: "SPACE / FIRE — tidal surge",
      abilityHint: "1 — tail whip",
      abilities: [
        { id: "whip", key: "1", name: "Tail whip", cd: 6.4 },
        { id: "depth", key: "2", name: "Depth charges", cd: 6.2 },
        { id: "riptide", key: "3", name: "Riptide", cd: 8.0 }
      ]
    },
    inferno: {
      fire: "flare", ability: "lance2",
      fireHint: "SPACE / FIRE — flare fan",
      abilityHint: "1 — twin lances",
      abilities: [
        { id: "lance2", key: "1", name: "Twin lances", cd: 5.8 },
        { id: "embers", key: "2", name: "Ember rain", cd: 6.0 },
        { id: "emberssplit", key: "3", name: "Splitting embers", cd: 7.6 }
      ]
    },
    nullwarden: {
      fire: "well", ability: "collapse",
      fireHint: "SPACE / FIRE — gravity well",
      abilityHint: "1 — void collapse",
      abilities: [
        { id: "collapse", key: "1", name: "Collapse", cd: 7.4 },
        { id: "gates", key: "2", name: "Void gates", cd: 6.4 },
        { id: "eclipse", key: "3", name: "Eclipse", cd: 8.8 },
        { id: "riftstep", key: "4", name: "Riftstep", cd: 7.6 }
      ]
    },
    basilisk: {
      fire: "venom", ability: "gaze",
      fireHint: "SPACE / FIRE — venom arc",
      abilityHint: "1 — gaze column",
      abilities: [
        { id: "gaze", key: "1", name: "Gaze", cd: 5.6 },
        { id: "coil", key: "2", name: "Coil rings", cd: 5.8 },
        { id: "venompool", key: "3", name: "Venom pool", cd: 6.8 },
        { id: "constrict", key: "4", name: "Constrict", cd: 7.6 },
        { id: "petrify", key: "5", name: "Petrify", cd: 8.2 }
      ]
    },
    overlord: {
      fire: "barrage", ability: "decree",
      fireHint: "SPACE / FIRE — edict barrage",
      abilityHint: "1 — laser grid",
      abilities: [
        { id: "decree", key: "1", name: "Laser grid", cd: 6.8 },
        { id: "escorts", key: "2", name: "Kami escorts", cd: 7.0 },
        { id: "corering", key: "3", name: "Core ring", cd: 6.4 }
      ]
    },
    mandala: {
      fire: "seal", ability: "stamp",
      fireHint: "SPACE / FIRE — petal ring",
      abilityHint: "1 — glyph stamp",
      abilities: [
        { id: "stamp", key: "1", name: "Glyph stamp", cd: 5.2 },
        { id: "orbit", key: "2", name: "Orbit seals", cd: 7.2 },
        { id: "bloom", key: "3", name: "Bloom slam", cd: 7.8 },
        { id: "wheel", key: "4", name: "Singularity wheel", cd: 8.6 }
      ]
    },
    cenotaph: {
      fire: "slab", ability: "crypt",
      fireHint: "SPACE / FIRE — grave slab",
      abilityHint: "1 — crypt box",
      abilities: [
        { id: "crypt", key: "1", name: "Crypt", cd: 5.6 },
        { id: "knell", key: "2", name: "Knell", cd: 6.6 },
        { id: "burial", key: "3", name: "Burial bars", cd: 7.6 },
        { id: "vigil", key: "4", name: "Vigil", cd: 8.8 }
      ]
    },
    kaleido: {
      fire: "shatter", ability: "pane",
      fireHint: "SPACE / FIRE — splitting shards",
      abilityHint: "1 — glass pane",
      abilities: [
        { id: "pane", key: "1", name: "Glass pane", cd: 6.6 },
        { id: "twin", key: "2", name: "Twin field", cd: 7.0 },
        { id: "catch", key: "3", name: "Catch volley", cd: 7.6 },
        { id: "fracture", key: "4", name: "Fracture", cd: 8.6 }
      ]
    },
    helios: {
      fire: "glare", ability: "sear",
      fireHint: "SPACE / FIRE — solar glare",
      abilityHint: "1 — heat plates",
      abilities: [
        { id: "sear", key: "1", name: "Sear", cd: 4.1 },
        { id: "prominence", key: "2", name: "Prominence", cd: 5.3 },
        { id: "hearth", key: "3", name: "Hearth", cd: 5.6 },
        { id: "noon", key: "4", name: "High noon", cd: 6.5 }
      ]
    },
    selene: {
      fire: "crescent", ability: "limb",
      fireHint: "SPACE / FIRE — crescent volley",
      abilityHint: "1 — shadow limb",
      abilities: [
        { id: "limb", key: "1", name: "Shadow limb", cd: 6.4 },
        { id: "tide", key: "2", name: "Dark tide", cd: 7.2 },
        { id: "waning", key: "3", name: "Waning veil", cd: 7.8 },
        { id: "occult", key: "4", name: "Occultation", cd: 8.8 }
      ]
    },
    pentarch: {
      fire: "pyre", ability: "rime",
      fireHint: "SPACE / FIRE — pyre burst",
      abilityHint: "1 — rime lock",
      abilities: [
        { id: "rime", key: "1", name: "Rime lock", cd: 6.2 },
        { id: "bolt", key: "2", name: "Storm bolt", cd: 6.8 },
        { id: "fault", key: "3", name: "Fault", cd: 7.4 },
        { id: "shear", key: "4", name: "Wind shear", cd: 7.6 },
        { id: "gale", key: "5", name: "Gale", cd: 8.4 },
        { id: "glacier", key: "6", name: "Glacier", cd: 8.2 }
      ]
    }
  };

  var session = emptySession();

  function emptySession() {
    return {
      kind: "coop",
      mode: "normal",
      seed: 1,
      wager: false,
      bids: [null, null],
      stake: 0,
      deducted: false,
      round: 1,
      wins: [0, 0],
      packs: null,
      picks: [{}, {}],
      draftStep: [0, 0],
      bosses: [null, null],
      tutorials: [false, false],
      roundHold: 0,
      roundLock: false,
      started: false,
      matchOver: false,
      forfeit: null
    };
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function seededRand(seed) {
    var x = seed >>> 0;
    if (!x) x = 1;
    return function () {
      x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
      return x / 4294967296;
    };
  }

  function shuffleIn(list, rng) {
    var i, j, tmp;
    for (i = list.length - 1; i > 0; i--) {
      j = Math.floor(rng() * (i + 1));
      tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  function rarityOf(it) {
    return (it && it.rarity) || "common";
  }

  function costOf(it) {
    if (!it) return 0;
    if (it.cost != null) return it.cost;
    if (it.unlockLevel != null) return it.unlockLevel * 40;
    return 0;
  }

  function pickCaliber(list, rng, n) {
    n = n || 3;
    var rarities = RARITIES.slice();
    shuffleIn(rarities, rng);
    var band = rarities[0];
    var i, r, pool, extra, byDist, out, it;
    pool = list.filter(function (item) { return rarityOf(item) === band; });
    if (pool.length < n) {
      byDist = list.slice().sort(function (a, b) {
        var da = Math.abs((RARITY_RANK[rarityOf(a)] || 0) - (RARITY_RANK[band] || 0));
        var db = Math.abs((RARITY_RANK[rarityOf(b)] || 0) - (RARITY_RANK[band] || 0));
        if (da !== db) return da - db;
        return Math.abs(costOf(a) - costOf(pool[0] || a)) - Math.abs(costOf(b) - costOf(pool[0] || b));
      });
      extra = [];
      for (i = 0; i < byDist.length; i++) {
        it = byDist[i];
        if (pool.indexOf(it) >= 0) continue;
        extra.push(it);
        if (pool.length + extra.length >= n) break;
      }
      pool = pool.concat(extra);
    }
    pool = shuffleIn(pool.slice(), rng);
    out = [];
    for (i = 0; i < pool.length && out.length < n; i++) out.push(pool[i].id);
    if (out.length < n) {
      r = shuffleIn(list.slice(), rng);
      for (i = 0; i < r.length && out.length < n; i++) {
        if (out.indexOf(r[i].id) < 0) out.push(r[i].id);
      }
    }
    return out;
  }

  function makeDraftPacks(catalogs, seed) {
    var rng = seededRand(seed == null ? session.seed : seed);
    catalogs = catalogs || {};
    return {
      ship: pickCaliber(catalogs.ships || [], rng, 3),
      mod: pickCaliber(catalogs.mods || [], rng, 3),
      skin: pickCaliber(catalogs.skins || [], rng, 3),
      gun: pickCaliber(catalogs.guns || [], rng, 3)
    };
  }

  function reset(kind) {
    session = emptySession();
    session.kind = kind || "coop";
    return session;
  }

  function setKind(kind) {
    session.kind = kind || "coop";
    if (session.kind !== "pvp") session.started = false;
  }

  function newSeed() {
    session.seed = ((Date.now() & 0xfffffff) ^ (Math.floor(Math.random() * 0xfffffff))) >>> 0 || 1;
    return session.seed;
  }

  function setSeed(seed) {
    session.seed = (seed >>> 0) || 1;
  }

  function setMode(mode) {
    if (mode === "normal" || mode === "draft" || mode === "insane") session.mode = mode;
  }

  function setWager(on) {
    session.wager = !!on;
    if (!session.wager) {
      session.bids = [null, null];
      session.stake = 0;
    }
  }

  function clampBid(amount, maxCoins) {
    amount = Math.floor(Number(amount) || 0);
    if (amount < 0) amount = 0;
    maxCoins = Math.max(0, Math.floor(Number(maxCoins) || 0));
    if (amount > maxCoins) amount = maxCoins;
    return amount;
  }

  function setBid(slot, amount, maxCoins) {
    slot = slot | 0;
    session.bids[slot] = clampBid(amount, maxCoins);
    refreshStake();
    return session.bids[slot];
  }

  function refreshStake() {
    if (session.bids[0] == null || session.bids[1] == null) {
      session.stake = 0;
      return 0;
    }
    session.stake = Math.min(session.bids[0], session.bids[1]);
    return session.stake;
  }

  function bothBidsLocked() {
    return session.bids[0] != null && session.bids[1] != null;
  }

  function applyPick(slot, cat, id) {
    slot = slot | 0;
    if (DRAFT_STEPS.indexOf(cat) < 0) return session.picks[slot];
    session.picks[slot][cat] = id;
    return session.picks[slot];
  }

  function advanceDraft(slot) {
    slot = slot | 0;
    var step = session.draftStep[slot] || 0;
    if (step < DRAFT_STEPS.length) session.draftStep[slot] = step + 1;
    return session.draftStep[slot];
  }

  function draftCat(slot) {
    var step = session.draftStep[slot | 0] || 0;
    return DRAFT_STEPS[step] || null;
  }

  function draftDone(slot) {
    return (session.draftStep[slot | 0] || 0) >= DRAFT_STEPS.length;
  }

  function bothDraftDone() {
    return draftDone(0) && draftDone(1);
  }

  function setBoss(slot, id) {
    if (BOSS_IDS.indexOf(id) < 0) return;
    session.bosses[slot | 0] = id;
  }

  function bothBossesPicked() {
    return !!(session.bosses[0] && session.bosses[1]);
  }

  function setTutorialDone(slot, on) {
    session.tutorials[slot | 0] = on !== false;
  }

  function bothTutorialsDone() {
    return !!(session.tutorials[0] && session.tutorials[1]);
  }

  function canStart() {
    if (session.kind !== "pvp") return false;
    if (session.wager && !bothBidsLocked()) return false;
    if (session.mode === "draft" && !bothDraftDone()) return false;
    if (session.mode === "insane") {
      if (!bothBossesPicked()) return false;
      if (!bothTutorialsDone()) return false;
    }
    return true;
  }

  function payout(winnerSlot) {
    var wager = !!session.wager;
    var stake = wager ? (session.stake || 0) : 0;
    if (wager) {
      return {
        wager: true,
        stake: stake,
        pot: stake * 2,
        winnerCoins: stake * 2,
        loserCoins: 0,
        winnerXp: 0,
        loserXp: 0,
        winnerSlot: winnerSlot
      };
    }
    return {
      wager: false,
      stake: 0,
      pot: 0,
      winnerCoins: WIN_COINS,
      loserCoins: LOSE_COINS,
      winnerXp: WIN_XP,
      loserXp: LOSE_XP,
      winnerSlot: winnerSlot
    };
  }

  function addWin(slot) {
    slot = slot | 0;
    session.wins[slot] = (session.wins[slot] || 0) + 1;
    return session.wins[slot];
  }

  function roundBannerFor(winnerSlot, viewerSlot) {
    return (winnerSlot | 0) === (viewerSlot | 0) ? ROUND_WIN_TEXT : ROUND_LOST_TEXT;
  }

  // Host snapshots author round banners from slot 0's point of view.
  function localizeHostRoundBanner(text, viewerSlot) {
    if (text === ROUND_WIN_TEXT) return roundBannerFor(0, viewerSlot);
    if (text === ROUND_LOST_TEXT) return roundBannerFor(1, viewerSlot);
    return text;
  }

  function matchWinner() {
    if (session.forfeit != null) return session.forfeit === 0 ? 1 : 0;
    if ((session.wins[0] || 0) >= 2) return 0;
    if ((session.wins[1] || 0) >= 2) return 1;
    return -1;
  }

  function kitFor(id) {
    return BOSS_KITS[id] || BOSS_KITS.seraph;
  }

  function kitAbilities(id) {
    var kit = kitFor(id);
    if (kit.abilities && kit.abilities.length) return kit.abilities;
    return [{ id: kit.ability || "ram", key: "1", name: "Ability", cd: ABILITY_CD }];
  }

  function abilityAt(id, slot) {
    var list = kitAbilities(id);
    slot = (slot | 0) - 1;
    if (slot < 0 || slot >= list.length) return null;
    return list[slot];
  }

  function abilityKeyIndex(key) {
    var i;
    if (key === "e" || key === "E" || key === "Shift") return 1;
    i = ABILITY_KEYS.indexOf(String(key));
    return i < 0 ? 0 : i + 1;
  }

  function snapshot() {
    return {
      kind: session.kind,
      mode: session.mode,
      seed: session.seed,
      wager: session.wager,
      bids: session.bids.slice(),
      stake: session.stake,
      round: session.round,
      wins: session.wins.slice(),
      packs: session.packs ? clone(session.packs) : null,
      picks: [clone(session.picks[0] || {}), clone(session.picks[1] || {})],
      draftStep: session.draftStep.slice(),
      bosses: session.bosses.slice(),
      tutorials: session.tutorials.slice(),
      started: session.started
    };
  }

  function applySnapshot(msg) {
    if (!msg) return;
    session.kind = "pvp";
    if (msg.mode) setMode(msg.mode);
    if (msg.seed != null) setSeed(msg.seed);
    if (msg.wager != null) session.wager = !!msg.wager;
    if (msg.bids) session.bids = [msg.bids[0], msg.bids[1]];
    if (msg.stake != null) session.stake = msg.stake | 0;
    if (msg.packs) session.packs = clone(msg.packs);
    if (msg.picks) session.picks = [clone(msg.picks[0] || {}), clone(msg.picks[1] || {})];
    if (msg.draftStep) session.draftStep = [msg.draftStep[0] | 0, msg.draftStep[1] | 0];
    if (msg.bosses) session.bosses = [msg.bosses[0] || null, msg.bosses[1] || null];
    if (msg.tutorials) session.tutorials = [!!msg.tutorials[0], !!msg.tutorials[1]];
    if (msg.round) session.round = msg.round | 0;
    if (msg.wins) session.wins = [msg.wins[0] | 0, msg.wins[1] | 0];
    refreshStake();
  }

  root.__pvp = {
    BOSS_IDS: BOSS_IDS,
    BOSS_KITS: BOSS_KITS,
    DRAFT_STEPS: DRAFT_STEPS,
    PVP_HP: PVP_HP,
    PVP_HIT_INVULN: PVP_HIT_INVULN,
    PVP_FIRE_CD: PVP_FIRE_CD,
    ABILITY_CD: ABILITY_CD,
    ABILITY_GCD: ABILITY_GCD,
    ABILITY_KEYS: ABILITY_KEYS,
    ROUND_HOLD: ROUND_HOLD,
    ROUND_WIN_TEXT: ROUND_WIN_TEXT,
    ROUND_LOST_TEXT: ROUND_LOST_TEXT,
    roundBannerFor: roundBannerFor,
    localizeHostRoundBanner: localizeHostRoundBanner,
    WIN_COINS: WIN_COINS,
    WIN_XP: WIN_XP,
    LOSE_COINS: LOSE_COINS,
    LOSE_XP: LOSE_XP,
    reset: reset,
    session: function () { return session; },
    snapshot: snapshot,
    applySnapshot: applySnapshot,
    isPvp: function () { return session.kind === "pvp"; },
    isMatch: function () { return session.kind === "pvp" && session.started && !session.matchOver; },
    setKind: setKind,
    setMode: setMode,
    setWager: setWager,
    setSeed: setSeed,
    newSeed: newSeed,
    makeDraftPacks: makeDraftPacks,
    setPacks: function (packs) { session.packs = packs; },
    applyPick: applyPick,
    advanceDraft: advanceDraft,
    draftCat: draftCat,
    draftDone: draftDone,
    bothDraftDone: bothDraftDone,
    setBoss: setBoss,
    bothBossesPicked: bothBossesPicked,
    setTutorialDone: setTutorialDone,
    bothTutorialsDone: bothTutorialsDone,
    setBid: setBid,
    bothBidsLocked: bothBidsLocked,
    refreshStake: refreshStake,
    canStart: canStart,
    payout: payout,
    markDeducted: function () { session.deducted = true; },
    markStarted: function () {
      session.started = true;
      session.matchOver = false;
      session.round = 1;
      session.wins = [0, 0];
      session.roundHold = 0;
      session.roundLock = false;
      session.forfeit = null;
    },
    addWin: addWin,
    matchWinner: matchWinner,
    setForfeit: function (loserSlot) { session.forfeit = loserSlot | 0; },
    kitFor: kitFor,
    kitAbilities: kitAbilities,
    abilityAt: abilityAt,
    abilityKeyIndex: abilityKeyIndex,
    facingFor: function (slot) { return (slot | 0) === 0 ? -1 : 1; },
    spawnY: function (slot) { return (slot | 0) === 0 ? 326 : 34; },
    clone: clone
  };
})(window);
