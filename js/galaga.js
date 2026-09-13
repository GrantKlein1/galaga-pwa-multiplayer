(function () {
  var W = 240;
  var H = 360;
  // Base player fire interval. 212ms = Pulse 4.7/s (was 175ms / 5.7/s; base ROF down by 1).
  var FIRE_MS = 212;
  var MAX_PBUL = 26;
  var MAX_EBUL = 64;
  var PLAYER_R = 9;
  var INVULN = 2;
  var START_LIVES = 3;
  var MAX_LIVES = 6;
  var BOSS_EVERY = 5;
  var MAX_LEVEL = 100;
  var WEAPON_T = 8;
  var SPEED_T = 7;
  var SHIELD_T = 12;
  var STEER_TAP = 0.07;
  var STEER_RAMP = 0.12;
  var STEER_NUDGE = 5.5;
  var STEER_TAP_SPD = 42;
  var STEER_FOLLOW = 15;
  var LS_KEY = "galaga.profile";
  var PROFILE_VER = 3;
  var COIN_SPAWN_MUL = 0.75;
  var COOP_SPAWN_RATIO = 20 / 15;
  // Playfield is 240x360 with 16px side margins (208px of travel). Formations
  // used to span ±108 (216px), which is wider than the lane, so ships clipped
  // off the sides. Keep the swarm inside the screen with room to patrol.
  var FORM_OX_LIMIT = 92;
  var FORM_OY_MIN = -16;
  var FORM_OY_MAX = 110;
  // Run score used to convert 1:1 into XP. 0.15x (25% below the old 0.2x) makes a ~10k run ~1.5k XP.
  var XP_SCORE_MUL = 0.15;
  var PICKUP_PAD = 16;
  var PICKUP_CLAIM_R = 96;
  var POWER_WEIGHTS = [
    { kind: "spread", w: 1 },
    { kind: "double", w: 1.15 },
    { kind: "rapid", w: 2.3 },
    { kind: "shield", w: 5 },
    { kind: "speed", w: 5 }
  ];

  // Ships. Stats: speed (px/s), r (hitbox radius), invuln (s after a hit), extraLives,
  // regen (seconds to regrow 1 shield point; 0 = none), startShield, fireMul, dmgMul, coinMul,
  // pickMul (gem duration multiplier), passive (special behaviour id).
  var SHIPS = [
    { id: "wisp", name: "Wisp", unlockLevel: 1, cost: 0, rarity: "common", desc: "Balanced interceptor", speed: 250, r: 9, invuln: 2, extraLives: 0, regen: 0, startShield: 0, fireMul: 1, dmgMul: 1, coinMul: 1, pickMul: 1, passive: "", color: "#7ef9ff", accent: "#3df0ff" },
    { id: "needle", name: "Needle", unlockLevel: 4, cost: 300, rarity: "common", desc: "Fast, tiny hitbox, slightly slower guns", speed: 330, r: 5.5, invuln: 2, extraLives: 0, regen: 0, startShield: 0, fireMul: 0.92, dmgMul: 1, coinMul: 1, pickMul: 1, passive: "", color: "#ff9ad6", accent: "#ff4d9a" },
    { id: "aegis", name: "Aegis", unlockLevel: 8, cost: 600, rarity: "common", desc: "Slow. Starts shielded and regrows a shield point", speed: 190, r: 10, invuln: 2, extraLives: 0, regen: 9, startShield: 1, fireMul: 1, dmgMul: 1, coinMul: 1, pickMul: 1, passive: "", color: "#8ec8ff", accent: "#4d88ff" },
    { id: "broadwing", name: "Broadwing", unlockLevel: 12, cost: 900, rarity: "rare", desc: "+1 life and +15% coins, but a wide hull", speed: 225, r: 12, invuln: 2, extraLives: 1, regen: 0, startShield: 0, fireMul: 1, dmgMul: 1, coinMul: 1.15, pickMul: 1, passive: "", color: "#ffd23d", accent: "#ff9a3d" },
    { id: "phantom", name: "Phantom", unlockLevel: 18, cost: 1300, rarity: "rare", desc: "Long post-hit invulnerability; gems last longer", speed: 275, r: 8, invuln: 3.6, extraLives: 0, regen: 0, startShield: 0, fireMul: 1, dmgMul: 1, coinMul: 1, pickMul: 1.3, passive: "", color: "#d46bff", accent: "#b07cff" },
    { id: "vulture", name: "Vulture", unlockLevel: 26, cost: 1800, rarity: "rare", desc: "Every 18 kills grows a shield point (max 2)", speed: 245, r: 9, invuln: 2, extraLives: 0, regen: 0, startShield: 0, fireMul: 1, dmgMul: 1.05, coinMul: 1, pickMul: 1, passive: "leech", color: "#b6ff4d", accent: "#5cff8a" },
    { id: "bastion", name: "Bastion", unlockLevel: 34, cost: 2600, rarity: "epic", desc: "+2 lives, 2-hit shield. Slow, wide, -15% fire rate", speed: 170, r: 13, invuln: 2.4, extraLives: 2, regen: 0, startShield: 2, fireMul: 0.85, dmgMul: 1, coinMul: 1, pickMul: 1, passive: "", color: "#a0b8ff", accent: "#6b8cff" },
    { id: "strix", name: "Strix", unlockLevel: 44, cost: 3400, rarity: "epic", desc: "Glass cannon: +25% damage, fast, but only 2 lives", speed: 305, r: 7, invuln: 1.6, extraLives: -1, regen: 0, startShield: 0, fireMul: 1.05, dmgMul: 1.25, coinMul: 1, pickMul: 1, passive: "", color: "#ff7a5c", accent: "#ff3355" },
    { id: "nova", name: "Nova", unlockLevel: 55, cost: 4500, rarity: "epic", desc: "+1 life. Losing a life detonates a 6-damage nova", speed: 245, r: 9, invuln: 2.2, extraLives: 1, regen: 0, startShield: 0, fireMul: 1, dmgMul: 1, coinMul: 1, pickMul: 1, passive: "nova", color: "#ffe08a", accent: "#ffb060" },
    { id: "tempest", name: "Tempest", unlockLevel: 66, cost: 5800, rarity: "legendary", desc: "+15% fire rate, +5% damage, gems last 50% longer", speed: 280, r: 8, invuln: 2, extraLives: 0, regen: 0, startShield: 0, fireMul: 1.15, dmgMul: 1.05, coinMul: 1, pickMul: 1.5, passive: "", color: "#7ef9ff", accent: "#ffffff" },
    { id: "warden", name: "Warden", unlockLevel: 80, cost: 7500, rarity: "legendary", desc: "+1 life, 2-hit shield that regrows every 6s", speed: 215, r: 11, invuln: 2.4, extraLives: 1, regen: 6, startShield: 2, fireMul: 1, dmgMul: 1.05, coinMul: 1, pickMul: 1, passive: "", color: "#c8ffe8", accent: "#3dffb0" },
    { id: "eclipse", name: "Eclipse", unlockLevel: 95, cost: 10000, rarity: "legendary", desc: "+30% damage, +15% fire rate, +1 life. Boss kills restore a life", speed: 290, r: 7, invuln: 3, extraLives: 1, regen: 0, startShield: 0, fireMul: 1.15, dmgMul: 1.3, coinMul: 1, pickMul: 1.2, passive: "eclipse", color: "#e0c8ff", accent: "#ffd23d" }
  ];
  // Guns. shots: list of { dx (muzzle x offset), ang (radians, 0 = straight up), spd }.
  // dmg per bullet, cd (ms), pierce (extra targets), homing, hsp/hturn (homing speed/turn),
  // life (s, 0 = until off-screen), helix { amp, freq }, splash { r, dmg },
  // bolt (every nth shot adds a homing bolt of boltDmg).
  var GUNS = [
    { id: "pulse", name: "Pulse", unlockLevel: 1, cost: 0, rarity: "common", desc: "Reliable single shot", dmg: 1, cd: 140, shots: [{ dx: 0, ang: 0, spd: 430 }], r: 2 },
    { id: "twin", name: "Twin", unlockLevel: 3, cost: 250, rarity: "common", desc: "Two parallel shots", dmg: 1, cd: 165, shots: [{ dx: -6, ang: 0, spd: 430 }, { dx: 6, ang: 0, spd: 430 }], r: 2 },
    { id: "rapid", name: "Rapid", unlockLevel: 6, cost: 500, rarity: "common", desc: "Very fast single shot", dmg: 1, cd: 75, shots: [{ dx: 0, ang: 0, spd: 470 }], r: 2 },
    { id: "spread", name: "Spread", unlockLevel: 10, cost: 800, rarity: "common", desc: "Wide 3-way shot", dmg: 1, cd: 190, shots: [{ dx: 0, ang: -0.22, spd: 410 }, { dx: 0, ang: 0, spd: 440 }, { dx: 0, ang: 0.22, spd: 410 }], r: 2 },
    { id: "lance", name: "Lance", unlockLevel: 15, cost: 1200, rarity: "rare", desc: "Heavy bolt that pierces 2 foes", dmg: 2, cd: 210, shots: [{ dx: 0, ang: 0, spd: 480 }], pierce: 2, r: 2.4 },
    { id: "seeker", name: "Seeker", unlockLevel: 21, cost: 1600, rarity: "rare", desc: "Slow homing missile, never misses", dmg: 1.5, cd: 160, shots: [{ dx: 0, ang: 0, spd: 260 }], homing: true, homeT: 2.4, hsp: 120, hturn: 1.25, r: 3 },
    { id: "scatter", name: "Scatter", unlockLevel: 28, cost: 2100, rarity: "rare", desc: "5-pellet shotgun; short range, brutal up close", dmg: 1, cd: 300, shots: [{ dx: 0, ang: -0.5, spd: 540 }, { dx: 0, ang: -0.25, spd: 540 }, { dx: 0, ang: 0, spd: 540 }, { dx: 0, ang: 0.25, spd: 540 }, { dx: 0, ang: 0.5, spd: 540 }], life: 0.55, r: 2 },
    { id: "railgun", name: "Railgun", unlockLevel: 36, cost: 2800, rarity: "epic", desc: "Slow 4-damage slug that pierces everything", dmg: 4, cd: 400, shots: [{ dx: 0, ang: 0, spd: 760 }], pierce: 99, r: 2.6 },
    { id: "volley", name: "Volley", unlockLevel: 46, cost: 3600, rarity: "epic", desc: "Tight 3-shot fan, fast", dmg: 1, cd: 150, shots: [{ dx: 0, ang: -0.09, spd: 480 }, { dx: 0, ang: 0, spd: 500 }, { dx: 0, ang: 0.09, spd: 480 }], r: 2 },
    { id: "helix", name: "Helix", unlockLevel: 58, cost: 4600, rarity: "epic", desc: "Two weaving bolts that sweep a wide lane", dmg: 1.6, cd: 150, shots: [{ dx: 0, ang: 0, spd: 470, ph: 0 }, { dx: 0, ang: 0, spd: 470, ph: 3.1416 }], helix: { amp: 12, freq: 13 }, r: 2.4 },
    { id: "storm", name: "Storm", unlockLevel: 70, cost: 6000, rarity: "legendary", desc: "Hyper-rapid fire; every 5th shot adds a homing bolt", dmg: 1.1, cd: 60, shots: [{ dx: 0, ang: 0, spd: 520 }], bolt: 5, boltDmg: 2, r: 2 },
    { id: "novacannon", name: "Nova Cannon", unlockLevel: 80, cost: 7500, rarity: "legendary", desc: "6-damage shell with 2-damage splash", dmg: 6, cd: 320, shots: [{ dx: 0, ang: 0, spd: 520 }], pierce: 1, splash: { r: 34, dmg: 2 }, r: 4.5 },
    { id: "prism", name: "Prism", unlockLevel: 90, cost: 9500, rarity: "legendary", desc: "Three piercing beams. The final word", dmg: 2.2, cd: 190, shots: [{ dx: -4, ang: -0.08, spd: 560 }, { dx: 0, ang: 0, spd: 580 }, { dx: 4, ang: 0.08, spd: 560 }], pierce: 2, r: 2.4 }
  ];
  var MODS = [
    { id: "barrier", name: "Barrier", unlockLevel: 2, cost: 300, rarity: "common", desc: "Start every run with a 2-hit shield", tags: ["SHIELD 2"] },
    { id: "magnet", name: "Magnet", unlockLevel: 5, cost: 450, rarity: "common", desc: "Pull coins and gems toward you", tags: ["PULL 110px"] },
    { id: "fortune", name: "Fortune", unlockLevel: 9, cost: 700, rarity: "common", desc: "+50% coin drop chance and amount", tags: ["COINS +50%"] },
    { id: "overdrive", name: "Overdrive", unlockLevel: 14, cost: 900, rarity: "rare", desc: "+15% fire rate", tags: ["ROF +15%"] },
    { id: "reactor", name: "Reactor", unlockLevel: 22, cost: 1400, rarity: "rare", desc: "+20% damage, hitbox +1", tags: ["DMG +20%", "HIT +1"] },
    { id: "afterburner", name: "Afterburner", unlockLevel: 30, cost: 1800, rarity: "rare", desc: "+12% speed; gems last 50% longer", tags: ["SPD +12%", "GEMS +50%"] },
    { id: "salvage", name: "Salvage", unlockLevel: 40, cost: 2500, rarity: "epic", desc: "Bosses drop +60% coins; wave bonus +50%", tags: ["BOSS COINS +60%", "WAVE BONUS +50%"] },
    { id: "guardian", name: "Guardian", unlockLevel: 52, cost: 3200, rarity: "epic", desc: "Respawn with a 2-hit shield and +0.6s invuln", tags: ["RESPAWN SHIELD 2", "INV +0.6s"] },
    { id: "berserk", name: "Berserk", unlockLevel: 64, cost: 4200, rarity: "legendary", desc: "+10% damage per missing life", tags: ["DMG +10% per lost life"] },
    { id: "ascension", name: "Ascension", unlockLevel: 78, cost: 6000, rarity: "legendary", desc: "+25% XP and +10% fire rate", tags: ["XP +25%", "ROF +10%"] }
  ];
  // Shared paint tiers. Free at player levels 7, 12, 17, 22… Each hull keeps its own colorway of the FX.
  var SKIN_TIERS = [
    { id: "stock", name: "Stock", unlockLevel: 1, cost: 0, rarity: "common", fx: "solid", hue: 0, sat: 1, lit: 1, desc: "Factory paint" },
    { id: "ion", name: "Ion", unlockLevel: 7, cost: 0, rarity: "common", fx: "ion", hue: 22, sat: 1.12, lit: 1.06, desc: "Charged cyan arc" },
    { id: "ember", name: "Ember", unlockLevel: 12, cost: 0, rarity: "common", fx: "ember", hue: -42, sat: 1.22, lit: 1.02, desc: "Furnace glow along the hull" },
    { id: "void", name: "Void", unlockLevel: 17, cost: 0, rarity: "rare", fx: "void", hue: 78, sat: 0.82, lit: 0.62, desc: "Hollow dark-matter core, orbiting debris" },
    { id: "gilded", name: "Gilded", unlockLevel: 22, cost: 0, rarity: "rare", fx: "gilded", hue: -18, sat: 1.22, lit: 1.14, desc: "Engraved gold plates and a traveling shine" },
    { id: "prism", name: "Prism", unlockLevel: 27, cost: 0, rarity: "rare", fx: "prism", hue: 48, sat: 1.24, lit: 1.1, desc: "Chromatic split hull, rainbow edge" },
    { id: "novaflux", name: "Novaflux", unlockLevel: 32, cost: 0, rarity: "epic", fx: "novaflux", hue: 8, sat: 0.5, lit: 1.32, desc: "White-hot core with radiating spokes", perk: "BURST", perkText: "16% of volleys fire an exploding shot" },
    { id: "frost", name: "Frost", unlockLevel: 37, cost: 0, rarity: "epic", fx: "frost", hue: 28, sat: 0.62, lit: 1.24, desc: "Crystalline overgrowth and ice-shard wings", perk: "FREEZE", perkText: "Hits freeze fodder 1s, bosses 0.4s" },
    { id: "solar", name: "Solar", unlockLevel: 42, cost: 0, rarity: "epic", fx: "solar", hue: -55, sat: 1.32, lit: 1.16, desc: "Photosphere core and corona prominences", perk: "IGNITE", perkText: "Hits ignite: +1 damage after 0.65s" },
    { id: "nebula", name: "Nebula", unlockLevel: 47, cost: 0, rarity: "legendary", fx: "nebula", hue: 112, sat: 1.2, lit: 0.94, desc: "Living gas-cloud body with embedded stars", perk: "CLOUD", perkText: "Every 7.5s a 1.1s cloud deletes nearby bullets" },
    { id: "mythic", name: "Mythic", unlockLevel: 52, cost: 0, rarity: "legendary", fx: "mythic", hue: 158, sat: 1.24, lit: 1.08, desc: "Ceremonial wings and a gold-violet afterimage", perk: "ECHO", perkText: "28% of volleys ghost-fire 0.16s later at 70% damage" }
  ];
  var SHIP_COIN_SKINS = [
    { id: "wisp-aurora", ship: "wisp", name: "Aurora", cost: 2500, rarity: "epic", fx: "aurora", hull: "#3dffc8", accent: "#ff9ad6", desc: "Northern-light ribbon wings", perk: "WEAVE", perkText: "Shots weave ±7px (Helix gains extra sweep)" },
    { id: "wisp-ghostlight", ship: "wisp", name: "Ghostlight", cost: 7000, rarity: "legendary", fx: "ghostlight", hull: "#c8f8ff", accent: "#ffffff", desc: "Scanline hologram with a ghost clone", perk: "DECOY", perkText: "After a hit, a 1.6s decoy draws enemy aim" },
    { id: "needle-hotstreak", ship: "needle", name: "Hotstreak", cost: 2500, rarity: "epic", fx: "hotstreak", hull: "#ff6b4d", accent: "#ffe08a", desc: "Racing chevrons and speed lines", perk: "STREAK", perkText: "Kills within 1.8s stack +5% ROF, max 4" },
    { id: "needle-pinkvoid", ship: "needle", name: "Pinkvoid", cost: 7000, rarity: "legendary", fx: "pinkvoid", hull: "#1a0614", accent: "#ff4d9a", desc: "Ultra-thin dark blade, magenta plasma edge", perk: "RIFTSHOT", perkText: "12% of shots gain +1 pierce and +25% damage" },
    { id: "aegis-chrome", ship: "aegis", name: "Chrome", cost: 2500, rarity: "epic", fx: "chrome", hull: "#d0dcec", accent: "#ffffff", desc: "Mirror plates with a traveling specular", perk: "SHATTER", perkText: "22% chance incoming bullets shatter" },
    { id: "aegis-ward", ship: "aegis", name: "Ward", cost: 7000, rarity: "legendary", fx: "ward", hull: "#2ae8a8", accent: "#e8fff4", desc: "Hexagonal aegis wings", perk: "REFLECT", perkText: "32% chance to reflect a bullet as a 1.5-damage shot" },
    { id: "broadwing-goldwing", ship: "broadwing", name: "Goldwing", cost: 2500, rarity: "epic", fx: "goldwing", hull: "#ffd23d", accent: "#fff4c0", desc: "Extra gilt feathers on the span", perk: "RALLY", perkText: "After a hit: 2.4s of +12% ROF and +10% speed" },
    { id: "broadwing-sunburst", ship: "broadwing", name: "Sunburst", cost: 7000, rarity: "legendary", fx: "sunburst", hull: "#ff9a3d", accent: "#fff0a0", desc: "Sun-ray wing spread", perk: "FLARE", perkText: "After a hit: 3.2s +18% ROF +16% speed and a 4-ray burst" },
    { id: "phantom-spectral", ship: "phantom", name: "Spectral", cost: 2500, rarity: "epic", fx: "spectral", hull: "#c8a0ff", accent: "#f0e8ff", desc: "Translucent double-outline shimmer", perk: "PHASE", perkText: "20% chance to phase through a ram or dive" },
    { id: "phantom-rift", ship: "phantom", name: "Rift", cost: 7000, rarity: "legendary", fx: "rift", hull: "#14061e", accent: "#d46bff", desc: "Split hull with a void crack", perk: "BLINK", perkText: "On hull loss, blink toward center and freeze nearby foes 0.8s" },
    { id: "vulture-acid", ship: "vulture", name: "Acid", cost: 2500, rarity: "epic", fx: "acid", hull: "#b6ff4d", accent: "#5cff8a", desc: "Dripping venom trails", perk: "CORRODE", perkText: "Hits strip an extra shield plate" },
    { id: "vulture-carrion", ship: "vulture", name: "Carrion", cost: 7000, rarity: "legendary", fx: "carrion", hull: "#6a8a20", accent: "#ff7a5c", desc: "Bone-rib raptor silhouette", perk: "FEAST", perkText: "Dive/kami kills grant 0.55s invuln and +1 damage on the next shot" },
    { id: "bastion-fortress", ship: "bastion", name: "Fortress", cost: 2500, rarity: "epic", fx: "fortress", hull: "#8aa0d8", accent: "#e0e8ff", desc: "Siege battlements on the prow", perk: "HOLD", perkText: "The first hit each wave is ignored" },
    { id: "bastion-obsidian", ship: "bastion", name: "Obsidian", cost: 7000, rarity: "legendary", fx: "obsidian", hull: "#101018", accent: "#6b8cff", desc: "Jagged black-glass bunker", perk: "BULWARK", perkText: "The first two hits each wave are ignored" },
    { id: "strix-bloodglass", ship: "strix", name: "Bloodglass", cost: 2500, rarity: "epic", fx: "bloodglass", hull: "#ff3355", accent: "#ffd0d8", desc: "Cracked ruby canopy", perk: "VENDETTA", perkText: "After a hull hit, the next 5 shots deal double damage" },
    { id: "strix-inferno", ship: "strix", name: "Inferno", cost: 7000, rarity: "legendary", fx: "inferno", hull: "#ff7a3d", accent: "#ffe08a", desc: "Flame-winged raptor", perk: "WILDFIRE", perkText: "Hits ignite twice; a burn kill splashes nearby foes" },
    { id: "nova-supernova", ship: "nova", name: "Supernova", cost: 2500, rarity: "epic", fx: "supernova", hull: "#ffe08a", accent: "#ffffff", desc: "Expanding star core going critical", perk: "KILLBURST", perkText: "Kills explode for 2 damage in a small radius" },
    { id: "nova-starburst", ship: "nova", name: "Starburst", cost: 7000, rarity: "legendary", fx: "starburst", hull: "#ffb060", accent: "#fff4d0", desc: "Eight-point detonation hull", perk: "SPARKS", perkText: "Every 7th shot adds two 0.7-damage sparks" },
    { id: "tempest-cyclone", ship: "tempest", name: "Cyclone", cost: 2500, rarity: "epic", fx: "cyclone", hull: "#3df0ff", accent: "#ffffff", desc: "Spiral storm-cell body", perk: "SHEAR", perkText: "Nearby enemy bullets are nudged aside" },
    { id: "tempest-lightning", ship: "tempest", name: "Lightning", cost: 7000, rarity: "legendary", fx: "lightning", hull: "#7ef9ff", accent: "#ffe08a", desc: "Jagged bolt silhouette", perk: "CHAIN", perkText: "20% of hits chain 1.2 damage to the nearest other foe" },
    { id: "warden-jade", ship: "warden", name: "Jade", cost: 2500, rarity: "epic", fx: "jade", hull: "#3dffb0", accent: "#c8ffe8", desc: "Temple-green lattice plates", perk: "GEMWARD", perkText: "Collecting a non-coin gem grants 0.4s invulnerability" },
    { id: "warden-sentinel", ship: "warden", name: "Sentinel", cost: 7000, rarity: "legendary", fx: "sentinel", hull: "#a8ffe0", accent: "#ffffff", desc: "Honor-guard wings and halo", perk: "HALO", perkText: "Halo eats 1 nearby bullet every 5s" },
    { id: "eclipse-umbra", ship: "eclipse", name: "Umbra", cost: 2500, rarity: "epic", fx: "umbra", hull: "#120c1c", accent: "#ffd23d", desc: "Black disk with a gold ring", perk: "UMBRA", perkText: "While invulnerable after a hit, shots deal +25% damage" },
    { id: "eclipse-corona", ship: "eclipse", name: "Corona", cost: 7000, rarity: "legendary", fx: "corona", hull: "#e0c8ff", accent: "#ffd23d", desc: "Full eclipse with fire prominences", perk: "AURA", perkText: "While invulnerable, a 22px aura deals 1 damage every 0.55s" }
  ];

  // Boss roster. Debut wave = (index + 1) * BOSS_EVERY. Kits: base (always), p2 (added below the
  // first HP threshold), p3 (the five post-Overlord bosses, always 3 phases), t1 (tier 1+), t2
  // (tier 2+). Seraph–Overlord stay 2-phase on the first cycle; tier 1+ still get a third phase
  // and tier 2+ still chain attacks into combos.
  var BOSS_DEFS = [
    { id: "seraph", name: "SERAPH", color: "#e8f6ff", dark: "#203044", r: 18, hp: 48, spd: 42, amp: 6, freq: 1.2, cd: 1.39, tele: 0.44, pts: 1500,
      base: ["aimed", "fan", "ram"], p2: ["halo", "fan2"], t1: ["feathers"], t2: ["ramfan"], p2Text: "SERAPH ASCENDS", flavor: "Aimed volleys, fans, dive ram" },
    { id: "wraith", name: "WRAITH", color: "#d46bff", dark: "#2a1040", r: 16, hp: 72, spd: 55, amp: 16, freq: 2.4, cd: 1.39, tele: 0.44, pts: 1750,
      base: ["spiral", "mines", "sweep", "blink"], p2: ["blink2"], t1: ["clones"], t2: ["riftburst"], p2Text: "WRAITH UNBOUND", flavor: "Spirals, mines, wide sweeps, blinks" },
    { id: "hydra", name: "HYDRA", color: "#3dffb0", dark: "#143322", r: 22, hp: 102, spd: 42, amp: 6, freq: 1.2, cd: 1.45, tele: 0.46, pts: 2000,
      base: ["beam", "rain", "fan", "summon", "lunge"], p2: ["summontank", "lunge2"], t1: ["beam3"], t2: ["regrow"], p2Text: "HYDRA REGROWS", flavor: "Beams, rain, siphoning escorts, lunges" },
    { id: "colossus", name: "COLOSSUS", color: "#ffc14d", dark: "#40280a", r: 24, hp: 154, spd: 28, amp: 5, freq: 1.0, cd: 1.82, tele: 0.48, pts: 2250,
      base: ["ring", "charge", "homing", "shock"], p2: ["ring2", "meteor"], t1: ["artillery"], t2: ["charge2"], p2Text: "COLOSSUS OVERHEATS", flavor: "Rings, charges, missiles, shockwaves" },
    { id: "chronos", name: "CHRONOS", color: "#7ef9ff", dark: "#0a3040", r: 20, hp: 162, spd: 36, amp: 10, freq: 0.9, cd: 1.57, tele: 0.48, pts: 2500,
      base: ["tick", "pendulum", "rewind"], p2: ["ticksplit"], t1: ["slowfield"], t2: ["clockhands"], p2Text: "TIME FRACTURES", flavor: "Frozen bullets, pendulums, rewinds" },
    { id: "leviathan", name: "LEVIATHAN", color: "#4d88ff", dark: "#081838", r: 24, hp: 192, spd: 48, amp: 14, freq: 1.6, cd: 1.57, tele: 0.48, pts: 2750,
      base: ["surge", "depth", "whip"], p2: ["riptide"], t1: ["whirlpool"], t2: ["torpedo"], p2Text: "THE DEEP RISES", flavor: "Tidal surges, depth charges, tail whips" },
    { id: "inferno", name: "INFERNO", color: "#ff7a3d", dark: "#401008", r: 22, hp: 228, spd: 40, amp: 8, freq: 1.4, cd: 1.51, tele: 0.46, pts: 3000,
      base: ["flare", "embers", "lance2"], p2: ["emberssplit"], t1: ["novaring"], t2: ["firewheel"], p2Text: "INFERNO IGNITES", flavor: "Flares, ember rain, twin lances" },
    { id: "nullwarden", name: "NULLWARDEN", color: "#b07cff", dark: "#100418", r: 21, hp: 264, spd: 34, amp: 12, freq: 1.1, cd: 1.57, tele: 0.5, pts: 3250,
      base: ["well", "gates", "collapse"], p2: ["voidguard", "eclipse", "riftstep"], t1: ["singularity"], t2: ["gates2"], p2Text: "THE VOID ANSWERS", flavor: "Gravity wells, void gates, collapses" },
    { id: "basilisk", name: "BASILISK", color: "#c8ff3d", dark: "#203008", r: 22, hp: 300, spd: 46, amp: 10, freq: 1.5, cd: 1.51, tele: 0.48, pts: 3500,
      base: ["venom", "gaze", "coil"], p2: ["venompool", "constrict", "petrify"], t1: ["gaze2"], t2: ["spitburst"], p2Text: "BASILISK SHEDS", flavor: "Arcing venom, sweeping gaze, coils" },
    { id: "overlord", name: "OVERLORD", color: "#ffd23d", dark: "#3a1a0a", r: 26, hp: 384, spd: 32, amp: 6, freq: 1.0, cd: 1.64, tele: 0.5, pts: 4000,
      base: ["barrage", "decree", "escorts"], p2: ["core", "corering"], t1: ["crownfire"], t2: ["frenzy"], p2Thresh: 0.6, p2Text: "CORE EXPOSED", flavor: "Barrages, edicts, kami escorts" },
    { id: "mandala", name: "MANDALA", color: "#f0a070", dark: "#3a1420", r: 20, hp: 420, spd: 38, amp: 10, freq: 1.1, cd: 1.52, tele: 0.48, pts: 4300,
      base: ["seal", "stamp"], p2: ["orbit", "bloom"], p3: ["wheel"], t1: [], t2: [], p2Thresh: 2 / 3, p3Thresh: 1 / 3,
      p2Text: "SEALS ALIGN", p3Text: "SINGULARITY WHEEL", flavor: "Petal rings, glyph stamps, a spinning wheel" },
    { id: "myrmidon", name: "MYRMIDON", color: "#e8a020", dark: "#2a1a04", r: 21, hp: 468, spd: 40, amp: 8, freq: 1.3, cd: 1.55, tele: 0.48, pts: 4600,
      base: ["column", "order"], p2: ["sacrifice", "pincer"], p3: ["throne"], t1: [], t2: [], p2Thresh: 2 / 3, p3Thresh: 1 / 3,
      p2Text: "HIVE ORDERS", p3Text: "THE THRONE", flavor: "Marching columns, lane orders, hive grenades" },
    { id: "kaleido", name: "KALEIDO", color: "#a8f0ff", dark: "#102838", r: 19, hp: 516, spd: 44, amp: 12, freq: 1.4, cd: 1.5, tele: 0.46, pts: 4950,
      base: ["shatter", "pane"], p2: ["twin", "catch"], p3: ["fracture"], t1: [], t2: [], p2Thresh: 2 / 3, p3Thresh: 1 / 3,
      p2Text: "MIRROR FIELD", p3Text: "FRACTURE", flavor: "Splitting shards, glass panes, mirror strips" },
    { id: "harrow", name: "HARROW", color: "#b8b0a4", dark: "#1c1814", r: 22, hp: 564, spd: 36, amp: 8, freq: 1.0, cd: 1.58, tele: 0.5, pts: 5350,
      base: ["sweep", "sow"], p2: ["reap", "hook"], p3: ["harvest"], t1: [], t2: [], p2Thresh: 2 / 3, p3Thresh: 1 / 3,
      p2Text: "REAPING", p3Text: "HARVEST MOON", flavor: "Scythe arcs, seeds, a pulling crescent" },
    { id: "nexus", name: "NEXUS", color: "#40ffc4", dark: "#041c18", r: 21, hp: 612, spd: 34, amp: 6, freq: 0.9, cd: 1.6, tele: 0.5, pts: 5800,
      base: ["rail", "node"], p2: ["gridlock", "surge"], p3: ["blackout"], t1: [], t2: [], p2Thresh: 2 / 3, p3Thresh: 1 / 3,
      p2Text: "GRIDLOCK", p3Text: "BLACKOUT", flavor: "Lit rails, corner nodes, a plus-grid surge" }
  ];
  var GUEST_BOSS_POOL = 10;

  var DAILY_DEFS = [
    { id: "d_tanks", name: "Tank Buster", desc: "Kill 14 tanks", target: 14, kind: "kills", type: "tank", reward: { coins: 35 } },
    { id: "d_kami", name: "Kami Sweep", desc: "Kill 14 kami", target: 14, kind: "kills", type: "kami", reward: { coins: 35 } },
    { id: "d_snipers", name: "Sniper Hunt", desc: "Kill 16 snipers", target: 16, kind: "kills", type: "sniper", reward: { coins: 40 } },
    { id: "d_grunts", name: "Grunt Duty", desc: "Kill 32 grunts", target: 32, kind: "kills", type: "grunt", reward: { coins: 30 } },
    { id: "d_weavers", name: "Weave Cutter", desc: "Kill 14 weavers", target: 14, kind: "kills", type: "weaver", reward: { coins: 38 } },
    { id: "d_shields", name: "Breaker", desc: "Kill 8 shield drones", target: 8, kind: "kills", type: "shield", reward: { coins: 42 } },
    { id: "d_kills40", name: "Body Count", desc: "Destroy 50 foes in one run", target: 50, kind: "killsRun", reward: { coins: 38 } },
    { id: "d_kills90", name: "Massacre", desc: "Destroy 110 foes in one run", target: 110, kind: "killsRun", reward: { coins: 65 } },
    { id: "d_wave10", name: "First Push", desc: "Reach wave 12", target: 12, kind: "wave", reward: { coins: 30 } },
    { id: "d_wave15", name: "Deep Sortie", desc: "Reach wave 18", target: 18, kind: "wave", reward: { coins: 48 } },
    { id: "d_wave20", name: "Hold the Line", desc: "Reach wave 24", target: 24, kind: "wave", reward: { coins: 65 } },
    { id: "d_wave25", name: "Long Patrol", desc: "Reach wave 30", target: 30, kind: "wave", reward: { coins: 88 } },
    { id: "d_wave30", name: "Into the Deep", desc: "Reach wave 36", target: 36, kind: "wave", reward: { coins: 115 } },
    { id: "d_boss", name: "Boss Breaker", desc: "Defeat a boss", target: 1, kind: "bossAny", reward: { coins: 40 } },
    { id: "d_boss2", name: "Double Ace", desc: "Defeat 3 bosses in one run", target: 3, kind: "bossRun", reward: { coins: 70 } },
    { id: "d_boss3", name: "Triple Crown", desc: "Defeat 4 bosses in one run", target: 4, kind: "bossRun", reward: { coins: 105 } },
    { id: "d_flawless", name: "Flawless", desc: "Defeat 2 bosses without taking a hit", target: 2, kind: "noHitBoss", reward: { coins: 82 } },
    { id: "d_score", name: "High Score", desc: "Score 10,000 in one run", target: 10000, kind: "score", reward: { coins: 42 } },
    { id: "d_score4k", name: "Warm Guns", desc: "Score 5,000 in one run", target: 5000, kind: "score", reward: { coins: 25 } },
    { id: "d_score12k", name: "Hot Streak", desc: "Score 15,000 in one run", target: 15000, kind: "score", reward: { coins: 60 } },
    { id: "d_score25k", name: "Blazing", desc: "Score 30,000 in one run", target: 30000, kind: "score", reward: { coins: 105 } },
    { id: "d_coins", name: "Scavenger", desc: "Collect 26 coins in one run", target: 26, kind: "runCoins", reward: { coins: 30 } },
    { id: "d_coins40", name: "Payday", desc: "Collect 52 coins in one run", target: 52, kind: "runCoins", reward: { coins: 48 } },
    { id: "d_coins80", name: "Treasure Run", desc: "Collect 96 coins in one run", target: 96, kind: "runCoins", reward: { coins: 82 } },
    { id: "d_spread", name: "Fan Favorite", desc: "Collect 2 spread gems", target: 2, kind: "pickup", type: "spread", reward: { coins: 52 } },
    { id: "d_double", name: "Twin Catch", desc: "Collect 2 double gems", target: 2, kind: "pickup", type: "double", reward: { coins: 48 } },
    { id: "d_heal", name: "Field Medic", desc: "Collect 2 heal pickups", target: 2, kind: "pickup", type: "heal", reward: { coins: 38 } },
    { id: "d_shieldgem", name: "Bubble Up", desc: "Collect 3 shield gems in one run", target: 3, kind: "pickup", type: "shield", reward: { coins: 38 } },
    { id: "d_nohit8", name: "Ghost Pass", desc: "Reach wave 10 without taking a hit", target: 10, kind: "noHitWave", reward: { coins: 60 } },
    { id: "d_nohit12", name: "Ghost Patrol", desc: "Reach wave 15 without taking a hit", target: 15, kind: "noHitWave", reward: { coins: 92 } },
    { id: "d_dives", name: "Dive Intercept", desc: "Destroy 10 diving foes", target: 10, kind: "diveKills", reward: { coins: 36 } },
    { id: "d_dives20", name: "Air Superiority", desc: "Destroy 25 diving foes", target: 25, kind: "diveKills", reward: { coins: 60 } },
    { id: "d_enemy_set", name: "Full House", desc: "Destroy a tank, kami, and sniper in one run", target: 1, kind: "enemySet", types: ["tank", "kami", "sniper"], reward: { coins: 55 } },
    { id: "d_power_pair", name: "Power Pair", desc: "Collect a spread and double gem in one run", target: 1, kind: "pickupSet", types: ["spread", "double"], reward: { coins: 60 } },
    { id: "d_clean50", name: "Clean Flight", desc: "Destroy 50 foes in a run without taking a hit", target: 50, kind: "cleanKillsRun", reward: { coins: 70 } }
  ];
  var LONG_DEFS = [
    { id: "lt_wave20", name: "Wave 25", desc: "Reach wave 25", target: 25, kind: "wave", reward: { coins: 70 } },
    { id: "lt_wave30", name: "Wave 40", desc: "Reach wave 40", target: 40, kind: "wave", reward: { coins: 120, gun: "twin", consolation: 70 } },
    { id: "lt_wave40", name: "Wave 55", desc: "Reach wave 55", target: 55, kind: "wave", reward: { gun: "lance", consolation: 180 } },
    { id: "lt_wave50", name: "Wave 70", desc: "Reach wave 70", target: 70, kind: "wave", reward: { gun: "seeker", consolation: 240 } },
    { id: "lt_wave60", name: "Wave 85", desc: "Reach wave 85", target: 85, kind: "wave", reward: { ship: "phantom", consolation: 300 } },
    { id: "lt_wave80", name: "Wave 110", desc: "Reach wave 110", target: 110, kind: "wave", reward: { coins: 360, gun: "scatter", consolation: 300 } },
    { id: "lt_wave100", name: "Deep Century", desc: "Reach wave 130", target: 130, kind: "wave", reward: { coins: 700, ship: "nova", consolation: 600 } },
    { id: "lt_lv10", name: "Ensign", desc: "Reach level 15", target: 15, kind: "level", reward: { coins: 120 } },
    { id: "lt_lv25", name: "Lieutenant", desc: "Reach level 35", target: 35, kind: "level", reward: { coins: 300, mod: "magnet", consolation: 180 } },
    { id: "lt_lv50", name: "Commander", desc: "Reach level 60", target: 60, kind: "level", reward: { coins: 700, gun: "volley", consolation: 600 } },
    { id: "lt_lv75", name: "Admiral", desc: "Reach level 85", target: 85, kind: "level", reward: { coins: 1400, mod: "guardian", consolation: 950 } },
    { id: "lt_lv100", name: "Eternal", desc: "Reach level 100", target: 100, kind: "level", reward: { coins: 2500, ship: "eclipse", consolation: 2000 } },
    { id: "lt_seraph", name: "Seraph Contract", desc: "Defeat Seraph twice", target: 2, kind: "bossCount", type: "seraph", reward: { coins: 50 } },
    { id: "lt_wraith", name: "Wraith Contract", desc: "Defeat Wraith twice", target: 2, kind: "bossCount", type: "wraith", reward: { coins: 60 } },
    { id: "lt_hydra", name: "Hydra Contract", desc: "Defeat Hydra twice", target: 2, kind: "bossCount", type: "hydra", reward: { coins: 72 } },
    { id: "lt_colossus", name: "Colossus Contract", desc: "Defeat Colossus twice", target: 2, kind: "bossCount", type: "colossus", reward: { coins: 96 } },
    { id: "lt_chronos", name: "Chronos Contract", desc: "Defeat Chronos twice", target: 2, kind: "bossCount", type: "chronos", reward: { coins: 120, mod: "overdrive", consolation: 100 } },
    { id: "lt_leviathan", name: "Leviathan Contract", desc: "Defeat Leviathan twice", target: 2, kind: "bossCount", type: "leviathan", reward: { coins: 145 } },
    { id: "lt_inferno", name: "Inferno Contract", desc: "Defeat Inferno twice", target: 2, kind: "bossCount", type: "inferno", reward: { coins: 180 } },
    { id: "lt_nullwarden", name: "Nullwarden Contract", desc: "Defeat Nullwarden twice", target: 2, kind: "bossCount", type: "nullwarden", reward: { coins: 215, gun: "railgun", consolation: 180 } },
    { id: "lt_basilisk", name: "Basilisk Contract", desc: "Defeat Basilisk twice", target: 2, kind: "bossCount", type: "basilisk", reward: { coins: 265 } },
    { id: "lt_overlord", name: "Overlord Contract", desc: "Defeat Overlord twice", target: 2, kind: "bossCount", type: "overlord", reward: { coins: 480, ship: "strix", consolation: 360 } },
    { id: "lt_mandala", name: "Mandala Contract", desc: "Defeat Mandala twice", target: 2, kind: "bossCount", type: "mandala", reward: { coins: 520, consolation: 380 } },
    { id: "lt_myrmidon", name: "Myrmidon Contract", desc: "Defeat Myrmidon twice", target: 2, kind: "bossCount", type: "myrmidon", reward: { coins: 560, consolation: 400 } },
    { id: "lt_kaleido", name: "Kaleido Contract", desc: "Defeat Kaleido twice", target: 2, kind: "bossCount", type: "kaleido", reward: { coins: 600, consolation: 430 } },
    { id: "lt_harrow", name: "Harrow Contract", desc: "Defeat Harrow twice", target: 2, kind: "bossCount", type: "harrow", reward: { coins: 650, consolation: 460 } },
    { id: "lt_nexus", name: "Nexus Contract", desc: "Defeat Nexus twice", target: 2, kind: "bossCount", type: "nexus", reward: { coins: 720, consolation: 500 } },
    { id: "lt_seraph5", name: "Seraph Hunter", desc: "Defeat Seraph 8 times", target: 8, kind: "bossCount", type: "seraph", reward: { coins: 150 } },
    { id: "lt_wraith5", name: "Wraith Hunter", desc: "Defeat Wraith 8 times", target: 8, kind: "bossCount", type: "wraith", reward: { coins: 165 } },
    { id: "lt_hydra5", name: "Hydra Hunter", desc: "Defeat Hydra 8 times", target: 8, kind: "bossCount", type: "hydra", reward: { coins: 190 } },
    { id: "lt_colossus5", name: "Colossus Hunter", desc: "Defeat Colossus 8 times", target: 8, kind: "bossCount", type: "colossus", reward: { coins: 215 } },
    { id: "lt_chronos5", name: "Chronos Hunter", desc: "Defeat Chronos 8 times", target: 8, kind: "bossCount", type: "chronos", reward: { coins: 250 } },
    { id: "lt_leviathan5", name: "Leviathan Hunter", desc: "Defeat Leviathan 8 times", target: 8, kind: "bossCount", type: "leviathan", reward: { coins: 300 } },
    { id: "lt_inferno5", name: "Inferno Hunter", desc: "Defeat Inferno 8 times", target: 8, kind: "bossCount", type: "inferno", reward: { coins: 350 } },
    { id: "lt_nullwarden5", name: "Nullwarden Hunter", desc: "Defeat Nullwarden 8 times", target: 8, kind: "bossCount", type: "nullwarden", reward: { coins: 400 } },
    { id: "lt_basilisk5", name: "Basilisk Hunter", desc: "Defeat Basilisk 8 times", target: 8, kind: "bossCount", type: "basilisk", reward: { coins: 450 } },
    { id: "lt_overlord5", name: "Overlord Hunter", desc: "Defeat Overlord 8 times", target: 8, kind: "bossCount", type: "overlord", reward: { coins: 620, mod: "berserk", consolation: 500 } },
    { id: "lt_seraph_t1", name: "Seraph +1", desc: "Defeat Seraph at tier 1 or higher", target: 1, kind: "bossTier", type: "seraph", tier: 1, reward: { coins: 250 } },
    { id: "lt_colossus_t1", name: "Colossus +1", desc: "Defeat Colossus at tier 1 or higher", target: 1, kind: "bossTier", type: "colossus", tier: 1, reward: { coins: 300 } },
    { id: "lt_inferno_t1", name: "Inferno +1", desc: "Defeat Inferno at tier 1 or higher", target: 1, kind: "bossTier", type: "inferno", tier: 1, reward: { coins: 350, gun: "helix", consolation: 300 } },
    { id: "lt_overlord_t1", name: "Overlord +1", desc: "Defeat Overlord at tier 1 or higher", target: 1, kind: "bossTier", type: "overlord", tier: 1, reward: { coins: 600, mod: "salvage", consolation: 400 } },
    { id: "lt_wraith_t2", name: "Wraith +2", desc: "Defeat Wraith at tier 2 or higher", target: 1, kind: "bossTier", type: "wraith", tier: 2, reward: { coins: 700 } },
    { id: "lt_overlord_t2", name: "Overlord +2", desc: "Defeat Overlord at tier 2 or higher", target: 1, kind: "bossTier", type: "overlord", tier: 2, reward: { coins: 1500, ship: "tempest", consolation: 1000 } },
    { id: "lt_flawless1", name: "Flawless", desc: "Defeat 2 bosses without taking a hit", target: 2, kind: "perfectLife", reward: { coins: 100 } },
    { id: "lt_flawless10", name: "Untouchable", desc: "Defeat 15 bosses without taking a hit", target: 15, kind: "perfectLife", reward: { coins: 360, mod: "afterburner", consolation: 250 } },
    { id: "lt_flawless30", name: "Ghost of the Fleet", desc: "Defeat 45 bosses without taking a hit", target: 45, kind: "perfectLife", reward: { coins: 950, ship: "warden", consolation: 800 } },
    { id: "lt_tanks50", name: "Armored Graveyard", desc: "Destroy 80 tanks", target: 80, kind: "killsLife", type: "tank", reward: { gun: "rapid", consolation: 120 } },
    { id: "lt_kami80", name: "Kami Cemetery", desc: "Destroy 120 kami", target: 120, kind: "killsLife", type: "kami", reward: { coins: 140 } },
    { id: "lt_weaver60", name: "Thread Cut", desc: "Destroy 90 weavers", target: 90, kind: "killsLife", type: "weaver", reward: { coins: 140 } },
    { id: "lt_shield40", name: "Shield Breaker", desc: "Destroy 60 shield drones", target: 60, kind: "killsLife", type: "shield", reward: { coins: 165 } },
    { id: "lt_sniper80", name: "No Safe Orbit", desc: "Destroy 120 snipers", target: 120, kind: "killsLife", type: "sniper", reward: { coins: 140 } },
    { id: "lt_kills1k", name: "Two Thousand Cuts", desc: "Destroy 2,000 foes", target: 2000, kind: "killsAllLife", reward: { coins: 280 } },
    { id: "lt_kills5k", name: "Exterminator", desc: "Destroy 7,500 foes", target: 7500, kind: "killsAllLife", reward: { coins: 750, gun: "storm", consolation: 620 } },
    { id: "lt_nohit15", name: "Untouched 20", desc: "Reach wave 20 without taking a hit", target: 20, kind: "noHitWave", reward: { coins: 130 } },
    { id: "lt_nohit25", name: "Untouched 35", desc: "Reach wave 35 without taking a hit", target: 35, kind: "noHitWave", reward: { coins: 260 } },
    { id: "lt_nohit40", name: "Perfect Storm", desc: "Reach wave 50 without taking a hit", target: 50, kind: "noHitWave", reward: { coins: 500, mod: "barrier", consolation: 320 } },
    { id: "lt_lives30", name: "Iron Hull", desc: "Reach wave 40 without losing a life", target: 40, kind: "livesOkWave", reward: { coins: 230 } },
    { id: "lt_bosses8", name: "Boss Rush", desc: "Defeat 10 bosses in one run", target: 10, kind: "bossRun", reward: { coins: 310 } },
    { id: "lt_bosses12", name: "Gauntlet", desc: "Defeat 15 bosses in one run", target: 15, kind: "bossRun", reward: { coins: 620, gun: "novacannon", consolation: 540 } },
    { id: "lt_bosses20", name: "Thronebreaker", desc: "Defeat 30 bosses across all runs", target: 30, kind: "bossesLife", reward: { coins: 275 } },
    { id: "lt_bosses100", name: "Regicide", desc: "Defeat 150 bosses across all runs", target: 150, kind: "bossesLife", reward: { coins: 1100, ship: "bastion", consolation: 850 } },
    { id: "lt_score25k", name: "Ace Pilot", desc: "Reach a best score of 35,000", target: 35000, kind: "scoreLife", reward: { coins: 165 } },
    { id: "lt_score50k", name: "Legend", desc: "Reach a best score of 70,000", target: 70000, kind: "scoreLife", reward: { coins: 340 } },
    { id: "lt_score80k", name: "Mythic Sortie", desc: "Reach a best score of 110,000", target: 110000, kind: "scoreLife", reward: { coins: 550, mod: "reactor", consolation: 380 } },
    { id: "lt_score150k", name: "Starbreaker", desc: "Reach a best score of 200,000", target: 200000, kind: "scoreLife", reward: { coins: 1200, gun: "prism", consolation: 1050 } },
    { id: "lt_coins50", name: "Haul", desc: "Collect 75 coins in one run", target: 75, kind: "coinsRun", reward: { coins: 100 } },
    { id: "lt_coins100", name: "Vault Breaker", desc: "Collect 150 coins in one run", target: 150, kind: "coinsRun", reward: { coins: 200 } },
    { id: "lt_coins250", name: "Dragon Hoard", desc: "Collect 350 coins in one run", target: 350, kind: "coinsRun", reward: { coins: 500 } },
    { id: "lt_earned5k", name: "Tycoon", desc: "Earn 7,500 coins across all runs", target: 7500, kind: "coinsLife", reward: { coins: 620 } },
    { id: "lt_earned20k", name: "Magnate", desc: "Earn 30,000 coins across all runs", target: 30000, kind: "coinsLife", reward: { coins: 1800 } },
    { id: "lt_ships4", name: "Small Fleet", desc: "Own 5 ships", target: 5, kind: "ownShips", reward: { coins: 250 } },
    { id: "lt_ships8", name: "Armada", desc: "Own 9 ships", target: 9, kind: "ownShips", reward: { coins: 800 } },
    { id: "lt_guns4", name: "Arsenal", desc: "Own 5 guns", target: 5, kind: "ownGuns", reward: { coins: 250 } },
    { id: "lt_guns9", name: "Armory", desc: "Own 11 guns", target: 11, kind: "ownGuns", reward: { coins: 900 } },
    { id: "lt_spread5", name: "Spread Specialist", desc: "Collect 8 spread gems", target: 8, kind: "pickupLife", type: "spread", reward: { coins: 130, gun: "spread", consolation: 100 } },
    { id: "lt_double8", name: "Dual Collector", desc: "Collect 12 double gems", target: 12, kind: "pickupLife", type: "double", reward: { coins: 130 } },
    { id: "lt_heal15", name: "Combat Surgeon", desc: "Collect 20 heal pickups", target: 20, kind: "pickupLife", type: "heal", reward: { coins: 180 } },
    { id: "lt_dive100", name: "Dive Marshal", desc: "Destroy 150 diving foes", target: 150, kind: "diveKillsLife", reward: { coins: 150 } },
    { id: "lt_dive500", name: "Sky Warden", desc: "Destroy 750 diving foes", target: 750, kind: "diveKillsLife", reward: { coins: 500, ship: "vulture", consolation: 420 } },
    { id: "lt_clean100", name: "Silent Running", desc: "Destroy 100 foes in a run without taking a hit", target: 100, kind: "cleanKillsRun", category: "Special Operations", reward: { coins: 450 } },
    { id: "lt_boss_roster", name: "Fleet Intelligence", desc: "Defeat every boss in the roster", target: 10, kind: "bossRoster", category: "Special Operations", reward: { coins: 800 } },
    { id: "lt_armada_ready", name: "Ready Room", desc: "Own 6 ships and 10 guns", target: 1, kind: "ownCollection", ships: 6, guns: 10, category: "Special Operations", reward: { coins: 650 } }
  ];

  var canvas = document.getElementById("board");
  var wrap = document.getElementById("board-wrap");
  var overlay = document.getElementById("overlay");
  var scoreEl = document.getElementById("score");
  var bestEl = document.getElementById("best");
  var livesEl = document.getElementById("lives");
  var waveEl = document.getElementById("wave");
  var coinsEl = document.getElementById("hud-coins");
  var pwrEl = document.getElementById("pwr");
  var ctx = null;
  var viewScale = 1;
  var uiScreen = "hub";
  var hubRaf = 0;
  var profile = defaultProfile();
  var qSnap = {};
  var longSnap = {};
  var run = emptyRun();
  var runQuestClaims = [];
  var summaryRun = null;
  var runFinished = false;

  var score = 0;
  var best = 0;
  var lives = 3;
  var wave = 1;
  var started = false;
  var gameOver = false;
  var paused = true;
  var muted = false;
  var rafId = 0;
  var lastTs = 0;
  var time = 0;
  var shake = 0;
  var flash = 0;
  var diveCd = 0;
  var enterT = 0;
  var waveHold = 0;
  var banner = null;
  var actx = null;
  var masterGain = null;
  var sfxGain = null;
  var musicGain = null;
  var pulseWave = null;
  var noiseBuf = null;
  var voiceClock = {};
  var musicPlaying = false;
  var musicTimer = 0;
  var musicNext = 0;
  var musicStep = 0;
  var VOL_MASTER = 0.28;
  var VOL_SFX = 0.62;
  var VOL_MUSIC = 0.16;
  var waveKind = "line";

  var input = { left: false, right: false, fire: false, ability: false, holdL: 0, holdR: 0 };
  var pointerSteer = { id: 0, aimX: null, fire: false };
  var player = null;
  var players = [];
  var localSlot = 0;
  var netRole = null;
  var netEvents = [];
  var netReplay = false;
  var snapBuf = [];
  var snapAcc = 0;
  var snapSeq = 0;
  var snapLists = { en: [], pb: [], eb: [], pk: [], te: [], pl: [] };
  var viewPb = [];
  var lastSnapN = 0;
  var clientClock = 0;
  var hostOffset = 0;
  var hostClockReady = false;
  var interpDelay = 0.055;
  var nextEntId = 1;
  var evSeq = 0;
  var lastEvN = 0;
  var inputAcc = 0;
  var inputSeq = 0;
  var lastInputN = 0;
  var lastInputNBySlot = [0, 0];
  var lastInputKey = "";
  var pendingPickAt = {};
  var pickSeq = 0;
  var disconnectNote = "";
  var lobbyMode = "pick";
  var lobbyGuest = null;
  var lobbyErr = "";
  var coopOverSent = false;
  var lastCoopSpecs = null;
  var lastPvpSpecs = null;
  var pvpHurtQueue = [];
  var netBound = false;
  var enemies = [];
  var pbul = [];
  var ebul = [];
  var pickups = [];
  var teles = [];
  var bossFx = [];
  var particles = [];
  var rings = [];
  var stars = [];
  var skinDecoys = [];
  var form = { ox: 0, oy: 46, dir: 1, speed: 28, minOff: 0, maxOff: 0 };

  function el(id) { return document.getElementById(id); }
  function allocId() {
    var id = nextEntId;
    nextEntId += 1;
    if (nextEntId > 65535) nextEntId = 1;
    return id;
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function shuffleInPlace(arr) {
    var i, j, t;
    for (i = arr.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function dist2(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
  function bezier(t, a, b, c) { var u = 1 - t; return u * u * a + 2 * u * t * b + t * t * c; }
  function isBossWave(n) { return n > 0 && n % BOSS_EVERY === 0; }
  function bossDef(type) {
    var i;
    for (i = 0; i < BOSS_DEFS.length; i++) if (BOSS_DEFS[i].id === type) return BOSS_DEFS[i];
    return null;
  }
  function bossMeta(n) {
    var cycle = Math.max(0, Math.round(n / BOSS_EVERY) - 1);
    var count = BOSS_DEFS.length;
    return { type: BOSS_DEFS[cycle % count].id, tier: Math.floor(cycle / count) };
  }
  function bossName(type) {
    var d = bossDef(type);
    return d ? d.name : "BOSS";
  }
  function isBossType(type) { return !!bossDef(type); }
  function enemyColor(type) {
    if (type === "grunt") return "#ffd23d";
    if (type === "sniper") return "#ff4d9a";
    if (type === "tank") return "#5cff8a";
    if (type === "weaver") return "#3df0ff";
    if (type === "kami") return "#ff9a3d";
    if (type === "shield") return "#6b8cff";
    if (type === "mortar") return "#ff6b3d";
    if (type === "hex") return "#c44dff";
    if (type === "harrier") return "#e8ff6b";
    if (type === "bulwark") return "#7affc4";
    if (type === "archon") return "#ffd6a0";
    var d = bossDef(type);
    return d ? d.color : "#ffffff";
  }
  // Boss HP: base * (1 + 0.8 * tier) + 72 * tier. Base values are +20% vs the original roster
  // (Colossus +40%). The per-tier add scaled the same 20% so later cycles stay tanky.
  // Co-op multiplies the result in enemyHp() so each extra ship still has a full HP budget.
  function bossHp(type, tier) {
    var d = bossDef(type);
    if (!d) return 50;
    tier = tier || 0;
    return Math.round(d.hp * (1 + 0.8 * tier) + 72 * tier);
  }
  // Regular enemies gain a little HP deep into a run so upgraded guns stay relevant.
  // Solo also +1s everything except grunt/kami, which stay 1-shot for Pulse (dmg 1).
  function enemyHp(type, tier, n) {
    n = n || wave || 1;
    var hp;
    if (isBossType(type)) hp = bossHp(type, tier);
    else if (type === "archon") hp = 16 + 5 * Math.max(0, Math.floor((n - 8) / 5));
    else if (type === "tank") hp = 3 + Math.floor(n / 12);
    else if (type === "bulwark") hp = 3 + Math.floor(n / 15);
    else if (type === "mortar") hp = 2 + Math.floor(n / 20);
    else if (type === "hex" || type === "harrier") hp = 2;
    else hp = 1 + Math.floor(n / 25);
    if (!isCoop() && type !== "grunt" && type !== "kami") hp += 1;
    return scaleHp(hp);
  }
  function enemyR(type) {
    var d = bossDef(type);
    if (d) return d.r;
    if (type === "archon") return 15;
    if (type === "tank" || type === "bulwark") return 12;
    if (type === "shield") return 11;
    if (type === "mortar") return 10;
    if (type === "sniper") return 8;
    return 9;
  }
  function enemyPts(type, diving) {
    var base = 50, d = bossDef(type);
    if (d) return d.pts;
    if (type === "sniper") base = 80;
    else if (type === "weaver") base = 90;
    else if (type === "kami") base = 100;
    else if (type === "tank") base = 130;
    else if (type === "shield") base = 110;
    else if (type === "mortar") base = 160;
    else if (type === "hex") base = 180;
    else if (type === "harrier") base = 140;
    else if (type === "bulwark") base = 200;
    else if (type === "archon") base = 450;
    return diving ? base * 2 : base;
  }
  function pickupColor(kind) {
    if (kind === "rapid") return "#ff9a3d";
    if (kind === "double") return "#7ef9ff";
    if (kind === "spread") return "#d46bff";
    if (kind === "shield") return "#6b8cff";
    if (kind === "speed") return "#b6ff4d";
    if (kind === "life") return "#ff4d9a";
    if (kind === "heal") return "#ff3355";
    if (kind === "revive") return "#ffe08a";
    if (kind === "coin") return "#ffd23d";
    return "#fff";
  }
  function pickupLabel(kind) {
    if (kind === "rapid") return "RAPID";
    if (kind === "double") return "DOUBLE";
    if (kind === "spread") return "SPREAD";
    if (kind === "shield") return "SHIELD";
    if (kind === "speed") return "SPEED";
    if (kind === "life") return "1UP";
    if (kind === "heal") return "HEAL";
    if (kind === "revive") return "REVIVE";
    if (kind === "coin") return "COIN";
    return kind.toUpperCase();
  }

  function mixType(n, i, role) {
    if (n <= 1) return "grunt";
    if (n >= 16) return mixTypeLate(n, i, role);
    if (role === "back") {
      if (n >= 8 && i % 3 === 0) return "shield";
      if (n >= 4 && i % 2 === 0) return "tank";
      if (n >= 2) return "sniper";
      return "grunt";
    }
    if (role === "mid") {
      if (n >= 3 && i % 2 === 0) return "weaver";
      if (n >= 2 && i % 5 === 0) return "sniper";
      return "grunt";
    }
    if (n >= 6 && i % 3 === 0) return "kami";
    if (n >= 3 && i % 2 === 1) return "weaver";
    return "grunt";
  }
  // Later waves trade grunt spam for tanks, snipers, kami, and weavers so a
  // compact on-screen swarm still ramps. After the wave-30 boss, leftover
  // weavers/grunts keep promoting into tanks, snipers, and kami.
  function mixTypeLate(n, i, role) {
    var hard = n >= 31;
    var denser = n >= 41;
    var savage = n >= 51;
    if (role === "back") {
      if (i % 3 === 0) return "shield";
      if (i % 2 === 0) return "tank";
      return savage ? "tank" : "sniper";
    }
    if (role === "mid") {
      if (denser && i % 4 === 0) return "tank";
      if (i % 2 === 0) return savage ? "sniper" : "weaver";
      if (i % 3 === 0) return "sniper";
      return hard ? "tank" : "weaver";
    }
    if (i % 2 === 0) return "kami";
    if (denser && i % 5 === 0) return "kami";
    if (i % 3 === 1) return savage ? "sniper" : "weaver";
    return hard ? "tank" : "grunt";
  }
  // Some mid/late non-boss waves mix in a roster boss plus a thin escort.
  // Seed by wave so co-op skip credit, formation cap, and the live spawn agree;
  // the roll itself is among every debuted guest-pool boss, not a fixed index.
  function guestUnlockedCount(n) {
    return Math.min(GUEST_BOSS_POOL, Math.max(3, Math.floor(n / BOSS_EVERY)));
  }
  function pickGuestBossIds(rng, n, count, avoid) {
    var pool = [], i, j, id, idx, skip, out = [];
    count = count || 1;
    for (i = 0; i < guestUnlockedCount(n); i++) {
      id = BOSS_DEFS[i].id;
      skip = false;
      if (avoid) {
        for (j = 0; j < avoid.length; j++) if (avoid[j] === id) { skip = true; break; }
      }
      if (!skip) pool.push(id);
    }
    if (pool.length < count) {
      pool = [];
      for (i = 0; i < guestUnlockedCount(n); i++) pool.push(BOSS_DEFS[i].id);
    }
    count = Math.min(count, pool.length);
    for (i = 0; i < count; i++) {
      idx = Math.floor(rng() * pool.length);
      out.push(pool[idx]);
      pool.splice(idx, 1);
    }
    return out;
  }
  function guestBossPlan(n) {
    var rng, roll, late, bosses, tier, dual, last;
    if (n < 16 || isBossWave(n) || isMiniWave(n)) return null;
    rng = seededRand(0xC0FFEE ^ Math.imul(n, 2246822519));
    roll = rng();
    late = n >= 36;
    if (roll > (late ? 0.42 : 0.28)) return null;
    bosses = [];
    tier = 0;
    if (n < 31) {
      bosses.push(BOSS_DEFS[Math.floor(rng() * 3)].id);
    } else {
      // After wave 30, roll among debuted Seraph–Overlord guests. The old
      // index math collapsed to Colossus for waves 36–43. Skip the last
      // scheduled every-5 fight; duals are two different ids.
      dual = late && rng() < 0.45;
      last = Math.floor(n / BOSS_EVERY) * BOSS_EVERY;
      bosses = pickGuestBossIds(rng, n, dual ? 2 : 1, last >= BOSS_EVERY && last < n ? [bossMeta(last).type] : null);
      if (late && bosses.length > 1 && n >= 56) tier = 1;
      else if (late && bosses.length === 1 && n >= 60) tier = 1;
    }
    return { bosses: bosses, tier: tier };
  }
  function lateFormationCap(n) {
    var cap, plan, late;
    if (n <= 20) cap = 11;
    else if (n <= 30) cap = 9;
    else {
      // After the wave-30 boss, grow by 1 every 6 waves. 13 still fits the
      // ±92 / -16..110 box with patrol room; guest-boss escorts stay thin.
      late = n - 30;
      cap = 9 + Math.ceil(late / 6);
      if (cap > 13) cap = 13;
    }
    plan = guestBossPlan(n);
    if (plan) cap = Math.min(cap, plan.bosses.length > 1 ? 4 : 6);
    cap += extraPlayers() * 2;
    return cap;
  }

  function addSlot(slots, ox, oy, type) { slots.push({ ox: ox, oy: oy, type: type }); }

  function buildSlots(kind, n) {
    var slots = [], i, x, y, t, a, tn = typeWave(n);
    if (kind === "line") {
      for (i = 0; i < 5; i++) addSlot(slots, (i - 2) * 42, 0, "grunt");
    } else if (kind === "grid") {
      for (y = 0; y < 3; y++) {
        for (x = 0; x < 5; x++) {
          t = mixType(tn, x + y * 5, y === 0 ? "back" : y === 1 ? "mid" : "front");
          addSlot(slots, (x - 2) * 40, y * 34, t);
        }
      }
    } else if (kind === "chevron") {
      var chev = [[-84, 0], [-42, 20], [0, 40], [42, 20], [84, 0], [-56, 52], [56, 52], [0, 74]];
      for (i = 0; i < chev.length; i++) addSlot(slots, chev[i][0], chev[i][1], mixType(tn, i, i < 3 ? "back" : "front"));
    } else if (kind === "diamond") {
      var dia = [[0, 0], [-32, 32], [32, 32], [-64, 64], [0, 64], [64, 64], [-32, 96], [32, 96], [0, 128]];
      for (i = 0; i < dia.length; i++) addSlot(slots, dia[i][0], dia[i][1], mixType(tn, i, i < 3 ? "back" : i > 5 ? "front" : "mid"));
    } else if (kind === "wings") {
      for (y = 0; y < 3; y++) {
        for (x = 0; x < 2; x++) {
          addSlot(slots, -82 + x * 36, y * 32, mixType(tn, x + y, y === 0 ? "back" : "front"));
          addSlot(slots, 46 + x * 36, y * 32, mixType(tn, x + y + 3, y === 0 ? "back" : "front"));
        }
      }
    } else if (kind === "columns") {
      for (y = 0; y < 4; y++) {
        addSlot(slots, -48, y * 32, mixType(tn, y, y === 0 ? "back" : "front"));
        addSlot(slots, 48, y * 32, mixType(tn, y + 4, y === 0 ? "back" : "front"));
      }
    } else if (kind === "arc") {
      for (i = 0; i < 7; i++) {
        a = (i / 6) * Math.PI;
        addSlot(slots, Math.cos(a) * -96, 10 + Math.sin(a) * 64, mixType(tn, i, i === 3 ? "back" : "mid"));
      }
    } else if (kind === "escort") {
      addSlot(slots, 0, 42, tn >= 4 ? "shield" : "tank");
      for (i = 0; i < 8; i++) {
        a = (i / 8) * Math.PI * 2;
        addSlot(slots, Math.cos(a) * 64, 42 + Math.sin(a) * 42, mixType(tn, i, "front"));
      }
    } else if (kind === "stagger") {
      for (x = 0; x < 5; x++) addSlot(slots, (x - 2) * 42, 0, mixType(tn, x, "back"));
      for (x = 0; x < 4; x++) addSlot(slots, (x - 1.5) * 42, 36, mixType(tn, x, "mid"));
      for (x = 0; x < 5; x++) addSlot(slots, (x - 2) * 42, 72, mixType(tn, x, "front"));
    } else if (kind === "pincer") {
      for (i = 0; i < 5; i++) {
        addSlot(slots, -80 + i * 16, i * 30, tn >= 6 ? "kami" : mixType(tn, i, "front"));
        addSlot(slots, 80 - i * 16, i * 30, tn >= 6 ? "kami" : mixType(tn, i + 5, "front"));
      }
    } else {
      for (i = 0; i < 6; i++) addSlot(slots, (i - 2.5) * 38, (i % 2) * 32, mixType(tn, i, "mid"));
    }
    padFormation(slots, n);
    thinEarlyWave(slots, n);
    injectElites(slots, n);
    thinArchonEscorts(slots);
    relaxSlots(slots);
    fitSlotsToScreen(slots, n);
    return slots;
  }

  function isMiniWave(n) {
    // Archons punctuate a run, so only promote every other pre-boss wave.
    return n > 10 && n % (BOSS_EVERY * 2) === 3 && !isBossWave(n);
  }
  function staysInForm(type) {
    return type === "sniper" || type === "shield" || type === "mortar" || type === "hex" || type === "bulwark" || type === "archon";
  }
  function weaves(type) {
    return type === "weaver" || type === "harrier";
  }
  function pickCenteredBack(slots) {
    var i, best = 0;
    for (i = 1; i < slots.length; i++) {
      if (slots[i].oy < slots[best].oy) best = i;
      else if (slots[i].oy === slots[best].oy && Math.abs(slots[i].ox) < Math.abs(slots[best].ox)) best = i;
    }
    return best;
  }
  function nearestSlotDist2(slots, idx) {
    var i, best = 1e12, dx, dy, d;
    for (i = 0; i < slots.length; i++) {
      if (i === idx) continue;
      dx = slots[i].ox - slots[idx].ox;
      dy = slots[i].oy - slots[idx].oy;
      d = dx * dx + dy * dy;
      if (d < best) best = d;
    }
    return best;
  }
  function dropCrowdedEscorts(slots, count) {
    var i, best, bestD, escortN, d, dropped = 0;
    while (count > 0) {
      escortN = 0;
      best = -1;
      bestD = 1e12;
      for (i = 0; i < slots.length; i++) {
        if (slots[i].type === "archon" || slots[i].type === "mortar" || slots[i].type === "hex" || slots[i].type === "harrier" || slots[i].type === "bulwark") continue;
        escortN += 1;
        d = nearestSlotDist2(slots, i);
        if (d < bestD) { bestD = d; best = i; }
      }
      if (best < 0 || escortN <= 1) break;
      slots.splice(best, 1);
      count -= 1;
      dropped += 1;
    }
    return dropped;
  }
  function thinEarlyWave(slots, n) {
    if (n < 1 || n > 10 || isBossWave(n) || slots.length <= 1) return slots;
    dropCrowdedEscorts(slots, n <= 3 ? 2 : 1);
    return slots;
  }
  function thinArchonEscorts(slots) {
    var i, escorts = 0, hasArchon = false, keep, drop;
    for (i = 0; i < slots.length; i++) {
      if (slots[i].type === "archon") hasArchon = true;
      else escorts += 1;
    }
    if (!hasArchon || escorts <= 0) return slots;
    keep = Math.max(1, Math.round(escorts * 0.65));
    drop = escorts - keep;
    if (drop > 0) dropCrowdedEscorts(slots, drop);
    return slots;
  }
  function relaxSlots(slots) {
    var iter, i, j, dx, dy, dist, minDist, push, ux, uy;
    for (iter = 0; iter < 8; iter++) {
      for (i = 0; i < slots.length; i++) {
        for (j = i + 1; j < slots.length; j++) {
          dx = slots[j].ox - slots[i].ox;
          dy = slots[j].oy - slots[i].oy;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 0.01) {
            dx = 1;
            dy = 0;
            dist = 0.01;
          }
          minDist = enemyR(slots[i].type) + enemyR(slots[j].type) + 6;
          if (dist >= minDist) continue;
          push = (minDist - dist) * 0.5;
          ux = dx / dist;
          uy = dy / dist;
          slots[i].ox -= ux * push;
          slots[i].oy -= uy * push;
          slots[j].ox += ux * push;
          slots[j].oy += uy * push;
        }
      }
    }
    clampSlotX(slots);
    return slots;
  }
  function clampSlotX(slots) {
    var i;
    for (i = 0; i < slots.length; i++) {
      if (slots[i].ox > FORM_OX_LIMIT) slots[i].ox = FORM_OX_LIMIT;
      if (slots[i].ox < -FORM_OX_LIMIT) slots[i].ox = -FORM_OX_LIMIT;
    }
  }
  function clampSlotRange(slots) {
    var i;
    clampSlotX(slots);
    for (i = 0; i < slots.length; i++) {
      if (slots[i].oy > FORM_OY_MAX) slots[i].oy = FORM_OY_MAX;
      if (slots[i].oy < FORM_OY_MIN) slots[i].oy = FORM_OY_MIN;
    }
  }
  function fitSlotsToScreen(slots, n) {
    var cap, i, type;
    if (!slots.length || isBossWave(n) || n <= 10) return slots;
    cap = lateFormationCap(n);
    while (slots.length > cap) {
      if (!dropCrowdedEscorts(slots, 1)) {
        for (i = slots.length - 1; i >= 0 && slots.length > cap; i--) {
          type = slots[i].type;
          if (type === "archon" || type === "mortar" || type === "hex" || type === "harrier" || type === "bulwark") continue;
          slots.splice(i, 1);
        }
        break;
      }
    }
    clampSlotRange(slots);
    relaxSlots(slots);
    clampSlotRange(slots);
    return slots;
  }
  function injectElites(slots, n) {
    var typeCount = {}, added = 0, i, h, type, types, ti, tries, archonIdx, cap, chance, perType, minElites;
    if (n < 6 || isBossWave(n) || !slots.length) return slots;
    if (isMiniWave(n)) {
      archonIdx = pickCenteredBack(slots);
      slots[archonIdx].type = "archon";
    }
    types = ["mortar", "hex", "harrier", "bulwark"];
    cap = n >= 51 ? 6 : n >= 31 ? 5 : n >= 21 ? 4 : n >= 11 ? 3 : 2;
    chance = n >= 51 ? 36 : n >= 41 ? 32 : n >= 31 ? 28 : n >= 21 ? 22 : n >= 11 ? 14 : 9;
    perType = n >= 11 ? 2 : 1;
    minElites = n >= 41 ? 5 : n >= 31 ? 4 : n >= 21 ? 3 : n >= 11 ? 2 : 0;
    function takeElite(idx) {
      ti = (n + idx) % types.length;
      type = null;
      for (tries = 0; tries < types.length; tries++) {
        if (!(typeCount[types[ti]])) { type = types[ti]; break; }
        ti = (ti + 1) % types.length;
      }
      if (!type) {
        ti = (n + idx) % types.length;
        for (tries = 0; tries < types.length; tries++) {
          if ((typeCount[types[ti]] || 0) < perType) { type = types[ti]; break; }
          ti = (ti + 1) % types.length;
        }
      }
      if (!type) return false;
      typeCount[type] = (typeCount[type] || 0) + 1;
      slots[idx].type = type;
      added += 1;
      return true;
    }
    for (i = 0; i < slots.length && added < cap; i++) {
      if (slots[i].type === "archon") continue;
      h = (n * 17 + i * 31) % 100;
      if (h >= chance) continue;
      takeElite(i);
    }
    for (i = 0; i < slots.length && added < Math.min(cap, minElites); i++) {
      if (slots[i].type === "archon") continue;
      if (slots[i].type === "mortar" || slots[i].type === "hex" || slots[i].type === "harrier" || slots[i].type === "bulwark") continue;
      takeElite(i);
    }
    return slots;
  }

  // Co-op keeps the solo shape, then adds ships so the count is 4/3 of solo
  // (wave 2 is 15 solo → 20 co-op). Extra ranks sit behind with room to breathe.
  // Solo 1–10 pads +2. Later waves cap the swarm so it stays on-screen; extra
  // slots fill downward instead of stacking off the top. After wave 30 the cap
  // climbs slowly (still inside the formation box) instead of shrinking.
  function padFormation(slots, n) {
    var extra = extraPlayers();
    var i, add, src, row, ox, oy, base, target;
    if (extra >= 1 && slots.length) {
      base = slots.length;
      target = Math.max(base + extra, Math.round(base * (1 + extra * (COOP_SPAWN_RATIO - 1))));
      if (n > 10 && !isBossWave(n)) target = Math.min(target, lateFormationCap(n));
      add = target - base;
      for (i = 0; i < add; i++) {
        src = slots[i % slots.length];
        row = 1 + Math.floor(i / slots.length);
        ox = src.ox + ((i % 2) ? 22 : -22);
        if (ox > FORM_OX_LIMIT) ox = FORM_OX_LIMIT;
        if (ox < -FORM_OX_LIMIT) ox = -FORM_OX_LIMIT;
        oy = n > 10 ? src.oy + 34 * row : src.oy - 34 * row;
        addSlot(slots, ox, oy, mixType(n, slots.length + i, "back"));
      }
    }
    if (soloEarly(n) && slots.length) {
      add = 2;
      for (i = 0; i < add; i++) {
        src = slots[i % slots.length];
        row = 1 + Math.floor(i / slots.length);
        ox = src.ox + ((i % 2) ? 22 : -22);
        if (ox > FORM_OX_LIMIT) ox = FORM_OX_LIMIT;
        if (ox < -FORM_OX_LIMIT) ox = -FORM_OX_LIMIT;
        oy = src.oy - 34 * row;
        addSlot(slots, ox, oy, mixType(typeWave(n), slots.length + i, "back"));
      }
    } else if (!isCoop() && n > 10 && !isBossWave(n) && slots.length) {
      target = lateFormationCap(n);
      add = Math.max(0, target - slots.length);
      for (i = 0; i < add; i++) {
        src = slots[i % slots.length];
        row = 1 + Math.floor(i / slots.length);
        ox = src.ox + ((i % 2) ? 22 : -22);
        if (ox > FORM_OX_LIMIT) ox = FORM_OX_LIMIT;
        if (ox < -FORM_OX_LIMIT) ox = -FORM_OX_LIMIT;
        oy = src.oy + 34 * row;
        addSlot(slots, ox, oy, mixType(n, slots.length + i, "back"));
      }
    }
    return slots;
  }

  function formationKind(n) {
    if (soloEarly(n)) {
      if (n === 1) return "grid";
      if (n === 2) return "stagger";
      if (n === 3) return "wings";
      if (n === 4) return "escort";
      if (n === 6) return "pincer";
      if (n === 7) return "stagger";
      if (n === 8) return "grid";
      if (n === 9) return "diamond";
    }
    if (n === 1) return "line";
    if (n === 2) return "grid";
    if (n === 3) return "chevron";
    if (n === 4) return "wings";
    var list = ["grid", "chevron", "diamond", "wings", "columns", "arc", "escort", "stagger", "pincer"];
    return list[(n - 1) % list.length];
  }

  function emptyRun() {
    return {
      coins: 0, killsByType: {}, bosses: {}, maxWave: 1, kills: 0,
      hits: 0, livesLost: 0, cleanWave: 1, safeWave: 1, pickups: {}, diveKills: 0,
      bossHits: 0, perfectBosses: 0, leech: 0
    };
  }
  function emptyStats() {
    return {
      killsByType: {}, maxWave: 0, bosses: {}, bossBest: {}, pickups: {},
      diveKills: 0, cleanWave: 0, safeWave: 0, maxBossesRun: 0, maxRunCoins: 0, coinsEarned: 0,
      perfectBosses: 0, maxKillsRun: 0, maxCleanRunKills: 0, runs: 0
    };
  }
  function defaultProfile() {
    return {
      v: PROFILE_VER,
      coins: 0,
      totalXp: 0,
      best: 0,
      pid: "",
      name: "",
      muted: false,
      ownedShips: ["wisp"],
      ownedGuns: ["pulse"],
      ownedMods: [],
      ownedSkins: { wisp: ["stock"] },
      equipped: { ship: "wisp", gun: "pulse", mod: null },
      equippedSkins: { wisp: "stock" },
      startWave: 1,
      dailies: { date: "", ids: [], progress: {}, claimed: {} },
      longTerm: {},
      stats: emptyStats()
    };
  }
  function cloneArr(a, fallback) {
    if (!a || !a.length) return fallback.slice();
    var out = [], i;
    for (i = 0; i < a.length; i++) if (typeof a[i] === "string") out.push(a[i]);
    return out.length ? out : fallback.slice();
  }
  function cloneSkinMap(raw) {
    var out = {}, k, list;
    if (!raw || typeof raw !== "object") return { wisp: ["stock"] };
    for (k in raw) {
      if (!Object.prototype.hasOwnProperty.call(raw, k) || typeof k !== "string") continue;
      list = cloneArr(raw[k], ["stock"]);
      if (list.indexOf("stock") < 0) list.unshift("stock");
      out[k] = list;
    }
    if (!out.wisp) out.wisp = ["stock"];
    return out;
  }
  function cloneSkinEquip(raw) {
    var out = {}, k;
    if (!raw || typeof raw !== "object") return { wisp: "stock" };
    for (k in raw) {
      if (!Object.prototype.hasOwnProperty.call(raw, k)) continue;
      if (typeof raw[k] === "string") out[k] = raw[k];
    }
    if (!out.wisp) out.wisp = "stock";
    return out;
  }
  function migrateProfile(raw) {
    var p = defaultProfile();
    if (!raw || typeof raw !== "object") return p;
    if (typeof raw.coins === "number") p.coins = Math.max(0, raw.coins | 0);
    if (typeof raw.totalXp === "number") p.totalXp = Math.max(0, raw.totalXp | 0);
    if (typeof raw.best === "number") p.best = Math.max(0, raw.best | 0);
    if (typeof raw.pid === "string" && /^[a-zA-Z0-9_-]{8,64}$/.test(raw.pid)) p.pid = raw.pid;
    if (typeof raw.name === "string") {
      var nm = sanitizeName(raw.name);
      if (nm) p.name = nm;
    }
    if (typeof raw.muted === "boolean") p.muted = raw.muted;
    p.ownedShips = cloneArr(raw.ownedShips, ["wisp"]);
    p.ownedGuns = cloneArr(raw.ownedGuns, ["pulse"]);
    p.ownedMods = cloneArr(raw.ownedMods, []);
    if (p.ownedShips.indexOf("wisp") < 0) p.ownedShips.push("wisp");
    if (p.ownedGuns.indexOf("pulse") < 0) p.ownedGuns.push("pulse");
    if (raw.equipped && typeof raw.equipped === "object") {
      if (typeof raw.equipped.ship === "string") p.equipped.ship = raw.equipped.ship;
      if (typeof raw.equipped.gun === "string") p.equipped.gun = raw.equipped.gun;
      p.equipped.mod = typeof raw.equipped.mod === "string" ? raw.equipped.mod : null;
    }
    if (p.ownedShips.indexOf(p.equipped.ship) < 0) p.equipped.ship = "wisp";
    if (p.ownedGuns.indexOf(p.equipped.gun) < 0) p.equipped.gun = "pulse";
    if (p.equipped.mod && p.ownedMods.indexOf(p.equipped.mod) < 0) p.equipped.mod = null;
    p.ownedSkins = cloneSkinMap(raw.ownedSkins);
    p.equippedSkins = cloneSkinEquip(raw.equippedSkins);
    grantLevelSkins(p);
    if (raw.dailies && typeof raw.dailies === "object") {
      p.dailies.date = typeof raw.dailies.date === "string" ? raw.dailies.date : "";
      p.dailies.ids = cloneArr(raw.dailies.ids, []);
      p.dailies.progress = raw.dailies.progress && typeof raw.dailies.progress === "object" ? raw.dailies.progress : {};
      p.dailies.claimed = raw.dailies.claimed && typeof raw.dailies.claimed === "object" ? raw.dailies.claimed : {};
    }
    if (raw.longTerm && typeof raw.longTerm === "object") p.longTerm = raw.longTerm;
    if (raw.stats && typeof raw.stats === "object") {
      if (raw.stats.killsByType && typeof raw.stats.killsByType === "object") p.stats.killsByType = raw.stats.killsByType;
      if (typeof raw.stats.maxWave === "number") p.stats.maxWave = raw.stats.maxWave | 0;
      if (raw.stats.bosses && typeof raw.stats.bosses === "object") p.stats.bosses = raw.stats.bosses;
      if (raw.stats.pickups && typeof raw.stats.pickups === "object") p.stats.pickups = raw.stats.pickups;
      if (typeof raw.stats.diveKills === "number") p.stats.diveKills = raw.stats.diveKills | 0;
      if (typeof raw.stats.cleanWave === "number") p.stats.cleanWave = raw.stats.cleanWave | 0;
      if (typeof raw.stats.safeWave === "number") p.stats.safeWave = raw.stats.safeWave | 0;
      if (typeof raw.stats.maxBossesRun === "number") p.stats.maxBossesRun = raw.stats.maxBossesRun | 0;
      if (typeof raw.stats.maxRunCoins === "number") p.stats.maxRunCoins = raw.stats.maxRunCoins | 0;
      if (typeof raw.stats.coinsEarned === "number") p.stats.coinsEarned = raw.stats.coinsEarned | 0;
      if (raw.stats.bossBest && typeof raw.stats.bossBest === "object") p.stats.bossBest = raw.stats.bossBest;
      if (typeof raw.stats.perfectBosses === "number") p.stats.perfectBosses = raw.stats.perfectBosses | 0;
      if (typeof raw.stats.maxKillsRun === "number") p.stats.maxKillsRun = raw.stats.maxKillsRun | 0;
      if (typeof raw.stats.maxCleanRunKills === "number") p.stats.maxCleanRunKills = raw.stats.maxCleanRunKills | 0;
      if (typeof raw.stats.runs === "number") p.stats.runs = raw.stats.runs | 0;
    }
    if (typeof raw.startWave === "number") p.startWave = clampStartWave(raw.startWave, xpLevel(p.totalXp), p.stats.maxWave);
    // Profiles saved before the boss roster grew never recorded tiers: assume tier 0 kills.
    var k;
    for (k in p.stats.bosses) {
      if (Object.prototype.hasOwnProperty.call(p.stats.bosses, k) && p.stats.bosses[k] > 0 && !p.stats.bossBest[k]) p.stats.bossBest[k] = 1;
    }
    p.v = PROFILE_VER;
    return p;
  }
  // XP curve, levels 1-100. Banked XP is run score * XP_SCORE_MUL (Ascension still adds +25%).
  // A ~10k run is ~1.5k XP. Level 100 still needs ~2.5M XP total.
  function xpForLevel(lvl) {
    var l = Math.max(1, Math.min(MAX_LEVEL, lvl | 0)) - 1;
    return Math.round(100 * Math.pow(l, 2.2) + 400 * l);
  }
  function xpLevel(xp) {
    xp = xp || 0;
    var lo = 1, hi = MAX_LEVEL, mid;
    while (lo < hi) {
      mid = (lo + hi + 1) >> 1;
      if (xpForLevel(mid) <= xp) lo = mid; else hi = mid - 1;
    }
    return lo;
  }
  // Lv 10 → start wave 5, lv 15 → 10, then +5 wave every +5 levels.
  // Level only *shows* later start buttons. Starting there also requires
  // having *cleared* that wave. stats.maxWave is the highest wave entered,
  // so clearing N means the next spawn set maxWave to N+1 (maxWave > N).
  // Reaching N and dying leaves maxWave === N and keeps the button locked.
  function maxStartWave(lv) {
    lv = lv == null ? xpLevel(profile.totalXp) : (lv | 0);
    if (lv < 10) return 1;
    return 5 + Math.floor((lv - 10) / 5) * 5;
  }
  function startWaveOptions(lv) {
    var max = maxStartWave(lv), out = [1], n;
    for (n = 5; n <= max; n += 5) out.push(n);
    return out;
  }
  function reachedStartWave(reached) {
    if (reached != null) return reached | 0;
    return (profile && profile.stats && profile.stats.maxWave) || 0;
  }
  function startWaveUnlocked(n, reached) {
    n = n | 0;
    if (n <= 1) return true;
    return reachedStartWave(reached) > n;
  }
  function clampStartWave(n, lv, reached) {
    var opts = startWaveOptions(lv), i, best = 1;
    n = n | 0;
    for (i = 0; i < opts.length; i++) {
      if (opts[i] <= n && startWaveUnlocked(opts[i], reached)) best = opts[i];
    }
    return best;
  }
  function preferredStartWave() {
    return clampStartWave(profile.startWave || 1);
  }
  function setPreferredStartWave(n) {
    profile.startWave = clampStartWave(n);
    saveProfile();
  }
  function skipCredit(startN) {
    var n, slots, i, pts = 0, meta, d, plan;
    startN = Math.max(1, startN | 0);
    for (n = 1; n < startN; n++) {
      if (isBossWave(n)) {
        meta = bossMeta(n);
        d = bossDef(meta.type);
        pts += (d ? d.pts : 1500) + 800 * (meta.tier || 0);
      } else {
        slots = buildSlots(formationKind(n), n);
        for (i = 0; i < slots.length; i++) pts += enemyPts(slots[i].type, false);
        plan = guestBossPlan(n);
        if (plan) {
          for (i = 0; i < plan.bosses.length; i++) {
            d = bossDef(plan.bosses[i]);
            pts += (d ? d.pts : 1500) + 800 * (plan.tier || 0);
          }
        }
      }
    }
    return { score: pts };
  }
  function applySkipState(startN, reached) {
    var credit;
    startN = clampStartWave(startN, MAX_LEVEL, reached);
    if (startN <= 1) return 1;
    credit = skipCredit(startN);
    score += credit.score;
    run.maxWave = Math.max(run.maxWave || 1, startN);
    return startN;
  }
  function levelTitle(lv) {
    if (lv >= 100) return "Eternal";
    if (lv >= 90) return "Mythic";
    if (lv >= 80) return "Legend";
    if (lv >= 70) return "Warlord";
    if (lv >= 60) return "Admiral";
    if (lv >= 50) return "Commander";
    if (lv >= 40) return "Captain";
    if (lv >= 30) return "Veteran";
    if (lv >= 20) return "Ace";
    if (lv >= 10) return "Pilot";
    if (lv >= 5) return "Ensign";
    return "Cadet";
  }
  // Coins granted for reaching a level: small each level, bigger at 5s and 10s.
  function levelReward(lv) {
    if (lv % 10 === 0) return 150 + lv * 5;
    if (lv % 5 === 0) return 60 + lv * 2;
    return 15 + lv;
  }
  function todayStr() {
    var d = new Date();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }
  function hashDate(s) {
    var h = 2166136261, i;
    for (i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function seededRand(seed) {
    var x = seed >>> 0;
    return function () {
      x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
      return x / 4294967296;
    };
  }
  function dailiesValid(ids) {
    var i;
    if (!ids || ids.length !== 3) return false;
    for (i = 0; i < ids.length; i++) if (!findIn(DAILY_DEFS, ids[i])) return false;
    return true;
  }
  function ensureDailies() {
    var today = todayStr();
    if (profile.dailies.date === today && dailiesValid(profile.dailies.ids)) return false;
    var pool = DAILY_DEFS.slice();
    var rng = seededRand(hashDate(today));
    var i, j, tmp;
    for (i = pool.length - 1; i > 0; i--) {
      j = Math.floor(rng() * (i + 1));
      tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    profile.dailies = { date: today, ids: [pool[0].id, pool[1].id, pool[2].id], progress: {}, claimed: {} };
    return true;
  }
  function findIn(list, id) {
    var i;
    for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function findShip(id) { return findIn(SHIPS, id) || SHIPS[0]; }
  function findGun(id) { return findIn(GUNS, id) || GUNS[0]; }
  function findMod(id) { return id ? findIn(MODS, id) : null; }
  function findSkin(id) {
    var d = findIn(SKIN_TIERS, id);
    return d || findIn(SHIP_COIN_SKINS, id);
  }
  function skinsForShip(shipId) {
    var out = [], i, d;
    for (i = 0; i < SKIN_TIERS.length; i++) out.push(SKIN_TIERS[i]);
    for (i = 0; i < SHIP_COIN_SKINS.length; i++) {
      d = SHIP_COIN_SKINS[i];
      if (d.ship === shipId) out.push(d);
    }
    return out;
  }
  function skinIdOf(p) {
    if (!p) return "stock";
    if (p.loadout && p.loadout.skin) return p.loadout.skin;
    return "stock";
  }
  function skinDefOf(p) { return findSkin(skinIdOf(p)); }
  function pbulCap() { return MAX_PBUL + extraPlayers() * 22; }
  function refreshSkinMuls(p) {
    var id, fire = 1, spd = 1;
    if (!p) return;
    id = skinIdOf(p);
    if ((p.skinBoostT || 0) > 0) {
      if (id === "broadwing-goldwing") { fire *= 1.12; spd *= 1.10; }
      if (id === "broadwing-sunburst") { fire *= 1.18; spd *= 1.16; }
    }
    if (id === "needle-hotstreak" && (p.skinHotStacks || 0) > 0) fire *= 1 + 0.05 * p.skinHotStacks;
    p.skinFireMul = fire;
    p.skinSpdMul = spd;
  }
  function resetSkinWave(p) {
    var id;
    if (!p) return;
    id = skinIdOf(p);
    p.skinWard = id === "bastion-fortress" ? 1 : id === "bastion-obsidian" ? 2 : 0;
    p.skinNebulaCd = id === "nebula" ? 0.4 : (p.skinNebulaCd || 0);
    refreshSkinMuls(p);
  }
  function pushPbul(b) {
    if (pbul.length >= pbulCap()) return false;
    pbul.push(b);
    return true;
  }
  function skinSplash(x, y, r, dmg, ownerSlot, fromPerk) {
    var i, e, col = "#ffe08a";
    rings.push({ x: x, y: y, r: 4, vr: 150, life: 0.28, color: col });
    if (isPvpRun()) {
      for (i = 0; i < players.length; i++) {
        e = players[i];
        if (!e || !e.alive || e.slot === ownerSlot) continue;
        if (dist2(e.x, e.y, x, y) < (r + (e.r || PLAYER_R)) * (r + (e.r || PLAYER_R))) pvpHurt(e, dmg);
      }
      return;
    }
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (!e.alive) continue;
      if (dist2(e.x, e.y, x, y) < (r + e.r) * (r + e.r)) killEnemy(e, false, dmg, ownerSlot, fromPerk || "splash");
    }
  }
  function freezeAround(x, y, r, fodderT, bossT) {
    var i, e;
    if (isPvpRun()) {
      for (i = 0; i < players.length; i++) {
        e = players[i];
        if (!e || !e.alive) continue;
        if (dist2(e.x, e.y, x, y) < r * r) e.slowT = Math.max(e.slowT || 0, fodderT || 0.8);
      }
      rings.push({ x: x, y: y, r: 6, vr: 140, life: 0.35, color: "#b8f0ff" });
      return;
    }
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (!e.alive) continue;
      if (dist2(e.x, e.y, x, y) < (r + e.r) * (r + e.r)) {
        e.freezeT = Math.max(e.freezeT || 0, e.isBoss ? (bossT || 0.4) : (fodderT || 1));
      }
    }
    rings.push({ x: x, y: y, r: 6, vr: 140, life: 0.35, color: "#b8f0ff" });
  }
  function igniteEnemy(e, ticks, ownerSlot) {
    if (!e || !e.alive) return;
    e.burnTicks = Math.max(e.burnTicks || 0, ticks || 1);
    e.burnAcc = 0;
    e.burnDmg = 1;
    e.burnOwner = ownerSlot;
    e.burnT = 0.65 * (e.burnTicks || 1) + 0.05;
  }
  function skinChain(from, owner) {
    var i, e, best = null, bestD = 72 * 72, d;
    if (!from || !owner || isPvpRun()) return;
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (!e.alive || e === from) continue;
      d = dist2(from.x, from.y, e.x, e.y);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (!best) return;
    rings.push({ x: from.x, y: from.y, r: 3, vr: 90, life: 0.18, color: "#ffe08a" });
    rings.push({ x: best.x, y: best.y, r: 3, vr: 90, life: 0.18, color: "#7ef9ff" });
    killEnemy(best, false, 1.2, owner.slot, "chain");
  }
  function skinOnBulletHit(owner, e, b) {
    var id;
    if (!owner || !e || !e.alive || isPvpRun()) return;
    id = skinIdOf(owner);
    if (id === "vulture-acid" && e.shieldHp > 0) e.shieldHp -= 1;
    if (id === "frost") e.freezeT = Math.max(e.freezeT || 0, e.isBoss ? 0.4 : 1);
    if (id === "solar") igniteEnemy(e, 1, owner.slot);
    if (id === "strix-inferno") igniteEnemy(e, 2, owner.slot);
    if (id === "tempest-lightning" && Math.random() < 0.2) skinChain(e, owner);
  }
  function spawnSkinDecoy(who) {
    if (!who) return;
    skinDecoys.push({ x: who.x, y: who.y, t: 1.6, slot: who.slot });
    rings.push({ x: who.x, y: who.y, r: 5, vr: 90, life: 0.4, color: "#c8f8ff" });
  }
  function fireSunburstRays(who) {
    var i, ang, face, y, spd = 300;
    if (!who) return;
    face = pvpFacing(who);
    y = pvpMuzzleY(who);
    for (i = 0; i < 4; i++) {
      ang = i * Math.PI / 2;
      pushPbul({
        id: allocId(),
        x: who.x, y: y,
        vx: Math.sin(ang) * spd,
        vy: face * Math.cos(ang) * spd,
        dmg: 1, r: 2, age: 0, life: 0.45,
        pierce: 0, hit: null, homing: false, homeT: 0, splash: null,
        gun: "pulse", owner: who.slot, ghost: netRole === "client", skinRay: true
      });
    }
  }
  function fireSkinEcho(who) {
    var echo, i, src, b, y, ghost;
    if (!who || !who.skinEcho) return;
    echo = who.skinEcho;
    who.skinEcho = null;
    y = pvpMuzzleY(who);
    ghost = netRole === "client";
    for (i = 0; i < echo.items.length; i++) {
      src = echo.items[i];
      b = {
        id: allocId(),
        x: who.x + (src.dx || 0), y: y,
        vx: src.vx, vy: src.vy,
        dmg: src.dmg, r: src.r || 2, age: 0, life: src.life || 0,
        pierce: src.pierce || 0, hit: src.pierce ? [] : null,
        homing: !!src.homing, homeT: src.homeT || 0, hsp: src.hsp || 0, hturn: src.hturn || 0,
        splash: src.splash || null, gun: src.gun || "pulse", owner: who.slot, ghost: ghost, skinEcho: true
      };
      if (src.helix) {
        b.helix = true; b.bx = b.x; b.ha = src.ha; b.hf = src.hf; b.hp0 = src.hp0 || 0;
      }
      pushPbul(b);
    }
  }
  function applySkinVolley(who, startIdx, g) {
    var id, i, b, burst, echoItems;
    if (!who || who.skinEchoing) return;
    id = skinIdOf(who);
    if (id === "novaflux" && Math.random() < 0.16) {
      burst = pbul[startIdx];
      if (burst && !burst.splash) burst.splash = { r: 26, dmg: 1.5 };
    }
    if (id === "wisp-aurora") {
      for (i = startIdx; i < pbul.length; i++) {
        b = pbul[i];
        if (b.helix) b.ha = (b.ha || 12) + 4;
        else {
          b.helix = true; b.bx = b.x; b.ha = 7; b.hf = 11; b.hp0 = (i - startIdx) * 1.57;
        }
      }
    }
    if (id === "mythic" && Math.random() < 0.28) {
      echoItems = [];
      for (i = startIdx; i < pbul.length; i++) {
        b = pbul[i];
        echoItems.push({
          dx: b.x - who.x, vx: b.vx, vy: b.vy, dmg: (b.dmg || 1) * 0.7, r: b.r, life: b.life,
          pierce: b.pierce || 0, homing: b.homing, homeT: b.homeT, hsp: b.hsp, hturn: b.hturn,
          splash: b.splash, gun: b.gun, helix: b.helix, ha: b.ha, hf: b.hf, hp0: b.hp0
        });
      }
      who.skinEcho = { t: 0.16, items: echoItems };
    }
    if (id === "nova-starburst" && who.shotCount % 7 === 0) {
      var face = pvpFacing(who), y = pvpMuzzleY(who), dmg = 0.7 * loadoutDmgMul(shipDef(who), equippedMod(who), who);
      pushPbul({
        id: allocId(), x: who.x, y: y, vx: Math.sin(-0.28) * 460, vy: face * Math.cos(-0.28) * 460,
        dmg: dmg, r: 2, age: 0, life: 0.7, pierce: 0, hit: null, homing: false, splash: null,
        gun: g ? g.id : "pulse", owner: who.slot, ghost: netRole === "client", skinSpark: true
      });
      pushPbul({
        id: allocId(), x: who.x, y: y, vx: Math.sin(0.28) * 460, vy: face * Math.cos(0.28) * 460,
        dmg: dmg, r: 2, age: 0, life: 0.7, pierce: 0, hit: null, homing: false, splash: null,
        gun: g ? g.id : "pulse", owner: who.slot, ghost: netRole === "client", skinSpark: true
      });
    }
  }
  function skinAfterHit(who, kind) {
    var id, margin;
    if (!who) return;
    id = skinIdOf(who);
    if (id === "broadwing-goldwing") { who.skinBoostT = 2.4; refreshSkinMuls(who); }
    if (id === "broadwing-sunburst") {
      who.skinBoostT = 3.2;
      refreshSkinMuls(who);
      fireSunburstRays(who);
    }
    if (id === "wisp-ghostlight") spawnSkinDecoy(who);
    if (id === "strix-bloodglass" && kind === "hull") who.skinBlood = 5;
    if (id === "eclipse-umbra") {
      who.skinUmbraT = Math.max(who.skinUmbraT || 0, who.invuln || (who.invulnDur || INVULN) || 0.85);
    }
    if (id === "phantom-rift" && kind === "hull" && (who.lives || 0) > 0) {
      var ox = who.x, oy = who.y;
      margin = Math.max(10, (who.r || PLAYER_R) + 4);
      who.x = clamp(who.x + (W / 2 - who.x) * 0.55, margin, W - margin);
      who.targetX = who.x;
      who.skinKeepX = true;
      freezeAround(ox, oy, 40, 0.8, 0.8);
    }
  }
  function consumeSkinWard(who) {
    if (!who || (who.skinWard || 0) <= 0) return false;
    who.skinWard -= 1;
    run.hits = (run.hits || 0) + 1;
    if (currentBoss()) run.bossHits = (run.bossHits || 0) + 1;
    explode(who.x, who.y, "#c8d6ff", false);
    who.invuln = Math.max(who.invuln || 0, 0.35);
    sfxArmor();
    skinAfterHit(who, "ward");
    syncQuestProgress();
    updateHud();
    return true;
  }
  function cycloneNudge(pl, b, dt) {
    var dx, dy, d, nx, ny, px, py, side;
    if (!pl || !b || skinIdOf(pl) !== "tempest-cyclone") return;
    dx = b.x - pl.x; dy = b.y - pl.y;
    d = Math.sqrt(dx * dx + dy * dy);
    if (d >= 50 || d < 1) return;
    nx = -(b.vy || 0); ny = b.vx || 0;
    side = Math.sqrt(nx * nx + ny * ny) || 1;
    nx /= side; ny /= side;
    px = pl.x - b.x; py = pl.y - b.y;
    if (nx * px + ny * py > 0) { nx = -nx; ny = -ny; }
    b.x += nx * 78 * dt;
    b.y += ny * 78 * dt;
  }
  function skinDefendShot(pl, b) {
    var id, d2, hitR, pr;
    if (!pl || !pl.alive || !b) return "none";
    id = skinIdOf(pl);
    d2 = dist2(b.x, b.y, pl.x, pl.y);
    if (id === "nebula" && (pl.skinNebulaT || 0) > 0 && d2 < 42 * 42) return "eat";
    if (id === "warden-sentinel" && (pl.skinSentinelCd || 0) <= 0 && d2 < 40 * 40) {
      pl.skinSentinelCd = 5;
      rings.push({ x: b.x, y: b.y, r: 3, vr: 80, life: 0.2, color: "#a8ffe0" });
      return "eat";
    }
    if (pl.invuln > 0) return "none";
    pr = pl.r || PLAYER_R;
    hitR = pr + (b.r || 2) - 1.5;
    if (d2 >= hitR * hitR) return "none";
    if (id === "aegis-chrome" && Math.random() < 0.22) {
      rings.push({ x: b.x, y: b.y, r: 2, vr: 70, life: 0.16, color: "#ffffff" });
      return "eat";
    }
    if (id === "aegis-ward" && Math.random() < 0.32) return "reflect";
    return "hit";
  }
  function reflectAsPlayerShot(b, who) {
    var tgt, dx, dy, len, face, spd = 420;
    face = pvpFacing(who);
    tgt = isPvpRun() ? pvpOpponent(who) : null;
    if (tgt && tgt.alive) {
      dx = tgt.x - b.x; dy = tgt.y - b.y;
      len = Math.sqrt(dx * dx + dy * dy) || 1;
      pushPbul({
        id: allocId(), x: b.x, y: b.y, vx: dx / len * spd, vy: dy / len * spd,
        dmg: 1.5, r: 2.2, age: 0, life: 0, pierce: 0, hit: null, homing: false, splash: null,
        gun: "pulse", owner: who.slot, ghost: netRole === "client", skinReflect: true
      });
    } else {
      pushPbul({
        id: allocId(), x: b.x, y: b.y, vx: 0, vy: face * spd,
        dmg: 1.5, r: 2.2, age: 0, life: 0, pierce: 0, hit: null, homing: false, splash: null,
        gun: "pulse", owner: who.slot, ghost: netRole === "client", skinReflect: true
      });
    }
  }
  function tickSkinEnemy(e, dt) {
    if (!e) return;
    if ((e.freezeT || 0) > 0) e.freezeT = Math.max(0, e.freezeT - dt);
    if ((e.burnTicks || 0) > 0 && e.alive) {
      e.burnAcc = (e.burnAcc || 0) + dt;
      while (e.alive && e.burnTicks > 0 && e.burnAcc >= 0.65) {
        e.burnAcc -= 0.65;
        e.burnTicks -= 1;
        killEnemy(e, false, e.burnDmg || 1, e.burnOwner, "burn");
      }
      if (e.burnTicks <= 0) e.burnT = 0;
    }
  }
  function tickSkinAura(p, dt) {
    var i, e;
    if (!p || !p.alive || skinIdOf(p) !== "eclipse-corona" || (p.invuln || 0) <= 0) return;
    p.skinCoronaAcc = (p.skinCoronaAcc || 0) - dt;
    if (p.skinCoronaAcc > 0) return;
    p.skinCoronaAcc = 0.55;
    if (isPvpRun()) {
      e = pvpOpponent(p);
      if (e && e.alive && dist2(p.x, p.y, e.x, e.y) < (22 + (e.r || PLAYER_R)) * (22 + (e.r || PLAYER_R))) pvpHurt(e, 1);
      return;
    }
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (!e.alive) continue;
      if (dist2(p.x, p.y, e.x, e.y) < (22 + e.r) * (22 + e.r)) killEnemy(e, false, 1, p.slot, "aura");
    }
  }
  function clamp01(n) { return n < 0 ? 0 : n > 1 ? 1 : n; }
  function hexToRgbArr(hex) {
    var n, v;
    if (!hex || typeof hex !== "string") return [126, 249, 255];
    n = hex.charAt(0) === "#" ? hex.slice(1) : hex;
    if (n.length === 3) n = n.charAt(0) + n.charAt(0) + n.charAt(1) + n.charAt(1) + n.charAt(2) + n.charAt(2);
    v = parseInt(n, 16);
    if (!isFinite(v)) return [126, 249, 255];
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  function rgbArrToHex(r, g, b) {
    function h(n) {
      n = Math.max(0, Math.min(255, n | 0));
      return (n < 16 ? "0" : "") + n.toString(16);
    }
    return "#" + h(r) + h(g) + h(b);
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0, s, l = (max + min) / 2, d;
    if (max === min) s = 0;
    else {
      d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: h, s: s, l: l };
  }
  function hslToRgb(h, s, l) {
    var c, x, m, hp, r, g, b;
    s = clamp01(s); l = clamp01(l);
    h = ((h % 360) + 360) % 360;
    c = (1 - Math.abs(2 * l - 1)) * s;
    hp = h / 60;
    x = c * (1 - Math.abs(hp % 2 - 1));
    r = 0; g = 0; b = 0;
    if (hp < 1) { r = c; g = x; }
    else if (hp < 2) { r = x; g = c; }
    else if (hp < 3) { g = c; b = x; }
    else if (hp < 4) { g = x; b = c; }
    else if (hp < 5) { r = x; b = c; }
    else { r = c; b = x; }
    m = l - c / 2;
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  function shiftPaint(hex, hue, sat, lit) {
    var rgb = hexToRgbArr(hex), hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]), out;
    out = hslToRgb(hsl.h + (hue || 0), hsl.s * (sat == null ? 1 : sat), hsl.l * (lit == null ? 1 : lit));
    return rgbArrToHex(out[0], out[1], out[2]);
  }
  function skinPaint(shipId, skinId) {
    var ship = findShip(shipId);
    var def = findSkin(skinId) || SKIN_TIERS[0];
    var hull = ship.color || "#7ef9ff";
    var accent = ship.accent || "#3df0ff";
    if (def.hull) {
      return { hull: def.hull, accent: def.accent || def.hull, fx: def.fx || "solid", def: def };
    }
    return {
      hull: shiftPaint(hull, def.hue, def.sat, def.lit),
      accent: shiftPaint(accent, def.hue, def.sat, def.lit),
      fx: def.fx || "solid",
      def: def
    };
  }
  function grantLevelSkins(p) {
    var lv, i, j, ship, list, skin;
    p = p || profile;
    if (!p.ownedSkins) p.ownedSkins = {};
    if (!p.equippedSkins) p.equippedSkins = {};
    lv = xpLevel(p.totalXp);
    for (i = 0; i < (p.ownedShips || []).length; i++) {
      ship = p.ownedShips[i];
      list = p.ownedSkins[ship];
      if (!list) { list = ["stock"]; p.ownedSkins[ship] = list; }
      if (list.indexOf("stock") < 0) list.unshift("stock");
      for (j = 0; j < SKIN_TIERS.length; j++) {
        skin = SKIN_TIERS[j];
        if (skin.cost === 0 && lv >= skin.unlockLevel && list.indexOf(skin.id) < 0) list.push(skin.id);
      }
      if (!p.equippedSkins[ship] || list.indexOf(p.equippedSkins[ship]) < 0) p.equippedSkins[ship] = "stock";
    }
    return p;
  }
  function equippedSkinFor(shipId, p) {
    var spec, map;
    if (p && p.loadout && p.loadout.skin) return p.loadout.skin;
    map = profile.equippedSkins || {};
    shipId = shipId || ((profile.equipped && profile.equipped.ship) || "wisp");
    return map[shipId] || "stock";
  }
  function dailyById(id) { return findIn(DAILY_DEFS, id); }
  function longById(id) { return findIn(LONG_DEFS, id); }
  function equippedGun(p) {
    if (p && p.loadout) return p.loadout.gun || "pulse";
    return (profile.equipped && profile.equipped.gun) || "pulse";
  }
  function equippedMod(p) {
    if (p && p.loadout) return p.loadout.mod || null;
    return profile.equipped ? profile.equipped.mod : null;
  }
  function shipDef(p) {
    if (p && p.loadout) return findShip(p.loadout.ship);
    return findShip(profile.equipped.ship);
  }
  function ownedList(cat) {
    if (cat === "ship") return profile.ownedShips;
    if (cat === "gun") return profile.ownedGuns;
    if (cat === "skin") {
      var ship = hangarView().ship;
      if (!profile.ownedSkins) profile.ownedSkins = {};
      if (!profile.ownedSkins[ship]) profile.ownedSkins[ship] = ["stock"];
      return profile.ownedSkins[ship];
    }
    return profile.ownedMods;
  }
  function isOwned(cat, id) {
    if (cat === "mod" && (!id || id === "none")) return true;
    if (cat === "skin" && (!id || id === "stock")) return true;
    return ownedList(cat).indexOf(id) >= 0;
  }
  function isEquipped(cat, id) {
    var view = hangarView();
    if (cat === "ship") return profile.equipped.ship === id;
    if (cat === "gun") return profile.equipped.gun === id;
    if (cat === "skin") return equippedSkinFor(view.ship) === id && profile.equipped.ship === view.ship;
    if (!id || id === "none") return !profile.equipped.mod;
    return profile.equipped.mod === id;
  }
  function hasMod(id, p) { return equippedMod(p) === id; }
  function anyHasMod(id) {
    var i;
    if (!players.length) return hasMod(id);
    for (i = 0; i < players.length; i++) if (hasMod(id, players[i])) return true;
    return false;
  }
  function profileLoadoutSpec() {
    var ship = (profile.equipped && profile.equipped.ship) || "wisp";
    return {
      ship: ship,
      gun: (profile.equipped && profile.equipped.gun) || "pulse",
      mod: profile.equipped ? profile.equipped.mod : null,
      skin: equippedSkinFor(ship)
    };
  }
  function loadoutLabel(spec) {
    var s = findShip(spec && spec.ship);
    var g = findGun(spec && spec.gun);
    var m = spec && spec.mod ? findMod(spec.mod) : null;
    var sk = spec && spec.skin ? findSkin(spec.skin) : null;
    var bits = [s.name, g.name, m ? m.name : "No mod"];
    if (sk && sk.id && sk.id !== "stock") bits.push(sk.name);
    return bits.join("  ·  ");
  }
  function syncLocalPlayer() {
    player = players[localSlot] || players[0] || null;
    if (player) lives = player.lives;
  }
  function spawnXFor(slot, count) {
    if (isPvp()) return W / 2;
    if ((count || players.length || 1) < 2) return W / 2;
    return slot === 0 ? W / 2 - 30 : W / 2 + 30;
  }
  function pvpFacing(p) {
    if (p && p.facing) return p.facing;
    return p && p.slot === 1 ? 1 : -1;
  }
  function pvpOpponent(who) {
    var slot = who && who.slot != null ? who.slot : localSlot;
    var i;
    for (i = 0; i < players.length; i++) {
      if (players[i] && players[i].slot !== slot) return players[i];
    }
    return null;
  }
  function pvpMuzzleY(who) {
    return who.y + pvpFacing(who) * -12;
  }
  function anyPlayerAlive() {
    var i;
    for (i = 0; i < players.length; i++) if (players[i] && players[i].alive) return true;
    return false;
  }
  function alivePlayers() {
    var out = [], i;
    for (i = 0; i < players.length; i++) if (players[i] && players[i].alive) out.push(players[i]);
    return out;
  }
  function targetPlayer(ex, ey) {
    var i, pl, best = null, bestD = 1e12, d, n = 0, only = null, dec, decoyBest = null, decoyD = 1e12;
    ex = ex || 0; ey = ey || 0;
    for (i = 0; i < players.length; i++) {
      pl = players[i];
      if (!pl || !pl.alive) continue;
      n += 1;
      only = pl;
      d = dist2(ex, ey, pl.x, pl.y);
      if (d < bestD) { bestD = d; best = pl; }
    }
    for (i = 0; i < skinDecoys.length; i++) {
      dec = skinDecoys[i];
      if (!dec) continue;
      d = dist2(ex, ey, dec.x, dec.y);
      if (d < decoyD) { decoyD = d; decoyBest = dec; }
    }
    if (decoyBest && Math.random() < 0.7) return { x: decoyBest.x, y: decoyBest.y, alive: true, decoy: true };
    if (!n) return player || null;
    if (n === 1) return only;
    return best;
  }
  function netSend(msg) {
    var n = window.__net;
    if (n && n.isConnected()) n.send(msg);
  }
  function queueNet(kind, a, b, c, d) {
    if (netReplay || netRole !== "host") return;
    netEvents.push([kind, a, b, c, d]);
  }
  function pvpApi() { return window.__pvp || null; }
  function pvpS() { return pvpApi() ? pvpApi().session() : null; }
  function isPvp() { return !!(pvpApi() && pvpApi().isPvp()); }
  function isPvpMatch() { return !!(pvpApi() && pvpApi().isMatch()); }
  function isPvpRun() { return !!(isPvp() && started && !runFinished); }
  function pvpFlipped() { return isPvpRun() && localSlot === 1; }
  function pvpRoundBannerText(winnerSlot) {
    var api = pvpApi();
    if (api && api.roundBannerFor) return api.roundBannerFor(winnerSlot, localSlot);
    return winnerSlot === localSlot ? "YOU WIN THE ROUND" : "ROUND LOST";
  }
  function localizePvpSnapBanner(bn) {
    var api, text;
    if (!bn || !bn.text) return bn;
    api = pvpApi();
    if (!api || !api.localizeHostRoundBanner) return bn;
    text = api.localizeHostRoundBanner(bn.text, localSlot);
    if (text === bn.text) return bn;
    return { text: text, life: bn.life };
  }
  function isCoop() {
    if (isPvp()) return false;
    return players.length > 1 || netRole === "host" || netRole === "client";
  }
  function playerCount() { return Math.max(1, players.length); }
  function extraPlayers() { return Math.max(0, playerCount() - 1); }
  function soloEarly(n) {
    n = n == null ? wave : n;
    return !isCoop() && n <= 10;
  }
  function pressureWave(n) {
    n = n == null ? wave : n;
    return soloEarly(n) ? n + 4 : n;
  }
  function typeWave(n) {
    n = n == null ? wave : n;
    return soloEarly(n) ? n + 3 : n;
  }
  // Each extra person adds a full solo budget: 1p = 1x, 2p = 2x, 3p = 3x.
  function coopMul() { return playerCount(); }
  function scaleHp(hp) {
    var n = coopMul();
    if (n <= 1) return hp;
    return Math.max(hp + (n - 1), Math.round(hp * n));
  }
  function escortCap() { return 9 * playerCount(); }
  function ebulCap() { return MAX_EBUL + extraPlayers() * 32; }
  // Effective loadout numbers (ship stat x mod bonuses). Used by the run and by the hangar readouts.
  function loadoutFireMul(ship, mod) {
    var m = (ship || shipDef()).fireMul || 1;
    mod = mod === undefined ? equippedMod() : mod;
    if (mod === "overdrive") m *= 1.15;
    if (mod === "ascension") m *= 1.10;
    return m;
  }
  function loadoutDmgMul(ship, mod, p) {
    var s = ship || shipDef(p);
    var m = s.dmgMul || 1;
    mod = mod === undefined ? equippedMod(p) : mod;
    if (mod === "reactor") m *= 1.2;
    if (mod === "berserk" && (p || player) && started) {
      var who = p || player;
      var maxL = START_LIVES + (s.extraLives || 0);
      m *= 1 + 0.10 * Math.max(0, maxL - (who.lives != null ? who.lives : lives));
    }
    return m;
  }
  function loadoutSpeed(ship, mod) {
    mod = mod === undefined ? equippedMod() : mod;
    return (ship || shipDef()).speed * (mod === "afterburner" ? 1.12 : 1);
  }
  function loadoutPickMul(ship, mod) {
    mod = mod === undefined ? equippedMod() : mod;
    return ((ship || shipDef()).pickMul || 1) * (mod === "afterburner" ? 1.5 : 1);
  }
  function loadoutR(ship, mod) {
    mod = mod === undefined ? equippedMod() : mod;
    return (ship || shipDef()).r + (mod === "reactor" ? 1 : 0);
  }
  function loadoutLives(ship) { return Math.max(1, START_LIVES + ((ship || shipDef()).extraLives || 0)); }
  function lifeCap(who) { return Math.min(MAX_LIVES, loadoutLives(shipDef(who)) + 1); }
  function gunInterval(g) {
    return g.cd * FIRE_MS / 140;
  }
  function gunDps(g, ship, mod) {
    var per = g.dmg * g.shots.length;
    if (g.bolt) per += (g.boltDmg || 2) / g.bolt;
    return per * (1000 / gunInterval(g)) * loadoutDmgMul(ship, mod) * loadoutFireMul(ship, mod);
  }
  function sanitizeName(s) {
    s = String(s || "").replace(/[^\w .\-]/g, "").replace(/\s+/g, " ").trim();
    if (s.length > 16) s = s.slice(0, 16).trim();
    return s;
  }
  function makePid() {
    var out = "", i, n;
    try {
      var buf = new Uint8Array(16);
      (window.crypto || window.msCrypto).getRandomValues(buf);
      for (i = 0; i < buf.length; i++) {
        n = buf[i];
        out += (n < 16 ? "0" : "") + n.toString(16);
      }
      return out;
    } catch (err) {
      for (i = 0; i < 32; i++) out += "0123456789abcdef".charAt(Math.floor(Math.random() * 16));
      return out;
    }
  }
  function defaultPilotName(pid) {
    return "Pilot-" + String(pid || "0000").slice(0, 4).toUpperCase();
  }
  function ensurePilot() {
    var changed = false;
    if (!profile.pid || typeof profile.pid !== "string" || !/^[a-zA-Z0-9_-]{8,64}$/.test(profile.pid)) {
      profile.pid = makePid();
      changed = true;
    }
    if (!profile.name) {
      profile.name = defaultPilotName(profile.pid);
      changed = true;
    }
    return changed;
  }
  function fmtScore(n) {
    n = Math.max(0, n | 0);
    var s = String(n), out = "", i;
    for (i = 0; i < s.length; i++) {
      if (i && (s.length - i) % 3 === 0) out += ",";
      out += s.charAt(i);
    }
    return out;
  }
  function escHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function saveProfile() {
    profile.best = best;
    profile.muted = muted;
    grantLevelSkins();
    try { localStorage.setItem(LS_KEY, JSON.stringify(profile)); } catch (err) {}
  }
  function applyProfile(raw) {
    profile = migrateProfile(raw);
    muted = profile.muted;
    best = profile.best;
    var dirty = ensurePilot();
    if (ensureDailies()) dirty = true;
    if (dirty) saveProfile();
    updateHud();
    if (!started || gameOver) {
      if (uiScreen === "hangar") renderHangar();
      else if (uiScreen === "quests") renderQuests();
      else if (uiScreen === "ranks") refreshRanks();
      else showScreen("hub");
    }
  }
  function requestProfile() {
    var raw = null;
    try {
      var txt = localStorage.getItem(LS_KEY);
      if (txt) raw = JSON.parse(txt);
    } catch (err) {}
    applyProfile(raw);
  }
  function setResetConfirm(on) {
    var panel = el("reset-confirm");
    var btn = el("btn-reset-progress");
    var note = el("reset-note");
    if (panel) panel.classList.toggle("hidden", !on);
    if (btn) btn.classList.toggle("hidden", on);
    if (note) note.classList.toggle("hidden", on);
    if (on && panel && panel.scrollIntoView) {
      try { panel.scrollIntoView({ block: "nearest" }); } catch (err) {}
    }
  }
  function resetAllProgress() {
    var keepMuted = muted;
    var keepPid = profile.pid;
    var keepName = profile.name;
    profile = defaultProfile();
    profile.muted = keepMuted;
    profile.pid = keepPid;
    profile.name = keepName;
    ensurePilot();
    best = 0;
    muted = keepMuted;
    qSnap = {};
    longSnap = {};
    run = emptyRun();
    ensureDailies();
    saveProfile();
    if (bestEl) bestEl.textContent = "0";
    updateHud();
    setResetConfirm(false);
    showScreen("hub");
  }

  function currentLoadout(p) {
    p = p || player;
    var spec = (p && p.loadout) ? p.loadout : profileLoadoutSpec();
    return {
      ship: spec.ship || "wisp",
      gun: spec.gun || "pulse",
      mod: spec.mod || null,
      skin: spec.skin || equippedSkinFor(spec.ship || "wisp"),
      shieldHp: p ? p.shieldHp : 0,
      muzzle: p ? p.muzzle : 0
    };
  }
  function activeWeapon(p) {
    p = p || player;
    if (p && p.weaponT > 0 && p.weapon && p.weapon !== "normal") return p.weapon;
    return equippedGun(p);
  }
  function powerHud() {
    if (!player) return "None";
    var bits = [];
    if (player.weaponT > 0 && player.weapon !== "normal") bits.push(pickupLabel(player.weapon) + " " + Math.ceil(player.weaponT) + "s");
    if (player.shieldHp > 0) bits.push("SHIELD x" + player.shieldHp);
    if (player.speedT > 0) bits.push("SPD " + Math.ceil(player.speedT) + "s");
    if ((player.jamT || 0) > 0) bits.push("JAM " + Math.ceil(player.jamT) + "s");
    if ((player.skinBoostT || 0) > 0) bits.push("PERK " + Math.ceil(player.skinBoostT) + "s");
    if ((player.skinHotStacks || 0) > 0) bits.push("STREAK x" + player.skinHotStacks);
    if ((player.skinWard || 0) > 0) bits.push("HOLD x" + player.skinWard);
    if ((player.skinNebulaT || 0) > 0) bits.push("CLOUD");
    return bits.length ? bits.join("  ·  ") : "None";
  }
  function playerTag(slot) {
    if (slot === localSlot) return "You";
    return "P" + ((slot || 0) + 1);
  }
  function setText(node, value) {
    if (!node) return;
    value = String(value);
    if (node.textContent !== value) node.textContent = value;
  }
  function renderLivesHud() {
    var label = document.getElementById("lives-label");
    var i, p, slot, tag, col, html, mine, hud;
    if (!livesEl) return;
    if (!players.length || players.length === 1) {
      livesEl.classList.remove("lives-coop");
      setText(livesEl, players.length ? players[0].lives : lives);
      if (label) setText(label, "Lives");
      hud = document.getElementById("hud");
      if (hud) hud.classList.remove("coop-lives");
      return;
    }
    livesEl.classList.add("lives-coop");
    if (label) setText(label, "Lives");
    hud = document.getElementById("hud");
    if (hud) hud.classList.toggle("coop-lives", true);
    html = "";
    function addRow(pl, idx) {
      slot = pl && pl.slot != null ? pl.slot : idx;
      mine = slot === localSlot;
      tag = playerTag(slot);
      col = pl ? skinPaint((pl.loadout && pl.loadout.ship) || "wisp", (pl.loadout && pl.loadout.skin) || "stock").hull : "#7ef9ff";
      html += '<span class="life-p' + (mine ? " me" : "") + '" style="color:' + col + '">' + tag + "  " + (pl ? pl.lives : 0) + "</span>";
    }
    if (players[localSlot]) addRow(players[localSlot], localSlot);
    for (i = 0; i < players.length; i++) {
      if (i === localSlot) continue;
      addRow(players[i], i);
    }
    if (livesEl.innerHTML !== html) livesEl.innerHTML = html;
  }
  var lastHudKey = "";
  function updateHud() {
    var pwr, coins, sess, wavePart, livesPart, i, key;
    pwr = powerHud();
    coins = started && !gameOver ? run.coins : profile.coins;
    sess = pvpS();
    wavePart = isPvpRun() && sess
      ? ("R" + (sess.round || 1) + ":" + (sess.wins[0] || 0) + ":" + (sess.wins[1] || 0))
      : String(wave);
    livesPart = "";
    if (!players.length) livesPart = String(lives);
    else {
      for (i = 0; i < players.length; i++) livesPart += (players[i] ? players[i].lives : "x") + ",";
    }
    key = score + "|" + best + "|" + livesPart + "|" + wavePart + "|" + coins + "|" + pwr;
    if (key === lastHudKey) return;
    lastHudKey = key;
    setText(scoreEl, score);
    setText(bestEl, best);
    renderLivesHud();
    if (waveEl) {
      var waveLab = el("wave-label");
      if (isPvpRun() && sess) {
        if (waveLab) setText(waveLab, "Duel");
        setText(waveEl, "R" + (sess.round || 1) + "  " + (sess.wins[0] || 0) + "–" + (sess.wins[1] || 0));
      } else {
        if (waveLab) setText(waveLab, "Wave");
        setText(waveEl, wave);
      }
    }
    if (coinsEl) setText(coinsEl, coins);
    setText(pwrEl, pwr);
    if (score > best) { best = score; profile.best = best; saveProfile(); setText(bestEl, best); }
  }
  var lastPvpChrome = "";
  function syncPvpHudChrome() {
    var app = el("app");
    var hint = el("pvp-hint");
    var padAb = el("pad-ability");
    var sess = pvpS();
    var kit, localBoss, cd, key, fireEl, abEl;
    localBoss = player && player.boss;
    kit = localBoss && pvpApi() ? pvpApi().kitFor(localBoss) : null;
    cd = kit && player && player.abilityCd > 0 ? "  " + Math.ceil(player.abilityCd) + "s" : "";
    key = (isPvpRun() ? "1" : "0") + "|" + ((sess && sess.mode) || "") + "|" + (localBoss || "") + "|" + (kit ? kit.fireHint : "") + "|" + (kit ? kit.abilityHint : "") + "|" + cd;
    if (key === lastPvpChrome) return;
    lastPvpChrome = key;
    if (app) {
      app.classList.toggle("is-pvp", isPvpRun());
      app.classList.toggle("is-pvp-insane", !!(isPvpRun() && sess && sess.mode === "insane"));
    }
    if (hint) {
      hint.classList.toggle("hidden", !kit);
      hint.setAttribute("aria-hidden", kit ? "false" : "true");
      if (kit) {
        fireEl = el("pvp-hint-fire");
        abEl = el("pvp-hint-ability");
        if (fireEl) setText(fireEl, kit.fireHint);
        if (abEl) setText(abEl, kit.abilityHint + cd);
      }
    }
    if (padAb) padAb.classList.toggle("hidden", !kit);
  }

  function ensureAudio() {
    if (muted) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!actx) {
        actx = new AC();
        masterGain = actx.createGain();
        sfxGain = actx.createGain();
        musicGain = actx.createGain();
        var sfxLp = actx.createBiquadFilter();
        sfxLp.type = "lowpass";
        sfxLp.frequency.value = 4800;
        sfxLp.Q.value = 0.45;
        masterGain.gain.value = VOL_MASTER;
        sfxGain.gain.value = VOL_SFX;
        musicGain.gain.value = VOL_MUSIC;
        sfxGain.connect(sfxLp);
        sfxLp.connect(masterGain);
        musicGain.connect(masterGain);
        masterGain.connect(actx.destination);
        noiseBuf = makeNoiseBuffer();
        pulseWave = makePulseWave(0.25);
      }
      if (actx.state === "suspended") actx.resume();
      setMasterMute(false);
    } catch (err) {}
  }
  function makeNoiseBuffer() {
    var len = Math.floor(actx.sampleRate * 0.6);
    var buf = actx.createBuffer(1, len, actx.sampleRate);
    var data = buf.getChannelData(0);
    var i, acc = 0;
    for (i = 0; i < len; i++) {
      acc = acc * 0.65 + (Math.random() * 2 - 1) * 0.35;
      data[i] = acc;
    }
    return buf;
  }
  function makePulseWave(duty) {
    try {
      var n = 32, real = new Float32Array(n), imag = new Float32Array(n), i;
      for (i = 1; i < n; i++) imag[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
      return actx.createPeriodicWave(real, imag);
    } catch (err) {
      return null;
    }
  }
  function setMasterMute(off) {
    if (!masterGain || !actx) return;
    masterGain.gain.cancelScheduledValues(actx.currentTime);
    masterGain.gain.setValueAtTime(off ? 0.0001 : VOL_MASTER, actx.currentTime);
  }
  function audioReady() {
    if (muted) return false;
    ensureAudio();
    return !!(actx && sfxGain);
  }
  function takeVoice(key, gap, maxLive, liveDur) {
    if (!actx) return false;
    var now = actx.currentTime;
    var slot = voiceClock[key] || (voiceClock[key] = { last: -99, live: [] });
    var keep = [], i;
    for (i = 0; i < slot.live.length; i++) if (slot.live[i] > now) keep.push(slot.live[i]);
    slot.live = keep;
    if (now - slot.last < gap) return false;
    if (slot.live.length >= maxLive) return false;
    slot.last = now;
    slot.live.push(now + liveDur);
    return true;
  }
  function beep(opts) {
    if (!audioReady()) return;
    try {
      var delay = opts.when || 0;
      if (delay < 0) delay = 0;
      var t0 = delay + actx.currentTime;
      var dur = opts.dur || 0.06;
      var vol = opts.vol || 0.05;
      var o = actx.createOscillator();
      var g = actx.createGain();
      if (opts.pulse && pulseWave) o.setPeriodicWave(pulseWave);
      else o.type = opts.type || "square";
      o.frequency.setValueAtTime(Math.max(20, opts.freq), t0);
      if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.012, dur * 0.2));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(opts.bus || sfxGain);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch (err) {}
  }
  function noiseBurst(dur, vol, freq, slide) {
    if (!audioReady() || !noiseBuf) return;
    try {
      var t = actx.currentTime;
      var src = actx.createBufferSource();
      var f = actx.createBiquadFilter();
      var g = actx.createGain();
      src.buffer = noiseBuf;
      f.type = "bandpass";
      f.Q.value = 0.85;
      f.frequency.setValueAtTime(Math.max(80, freq || 700), t);
      if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(60, slide), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(sfxGain);
      src.start(t);
      src.stop(t + dur + 0.02);
    } catch (err) {}
  }
  function sfxShoot(who) {
    var slot = who && who.slot != null ? who.slot : localSlot;
    queueNet("sfx", "shoot", slot);
    if (!takeVoice("shoot", 0.042, 2, 0.06)) return;
    var spread = activeWeapon() === "spread";
    beep({ pulse: true, freq: spread ? 1240 : 1560, slide: spread ? 340 : 420, dur: 0.048, vol: 0.07 });
  }
  function sfxEnemyShot() {
    queueNet("sfx", "eshot");
    if (!takeVoice("eshot", 0.075, 2, 0.05)) return;
    beep({ pulse: true, freq: 640, slide: 260, dur: 0.038, vol: 0.045 });
  }
  function sfxBoom(big) {
    if (!takeVoice(big ? "boomb" : "booms", big ? 0.08 : 0.045, big ? 2 : 3, big ? 0.32 : 0.14)) return;
    if (big) {
      beep({ type: "square", freq: 210, slide: 42, dur: 0.28, vol: 0.08 });
      beep({ type: "square", freq: 140, slide: 32, dur: 0.34, vol: 0.05 });
      noiseBurst(0.22, 0.045, 900, 180);
    } else {
      beep({ type: "square", freq: 320, slide: 55, dur: 0.12, vol: 0.06 });
      noiseBurst(0.09, 0.032, 1100, 240);
    }
  }
  function sfxHit() {
    queueNet("sfx", "hit");
    if (!takeVoice("hit", 0.2, 1, 0.55)) return;
    beep({ type: "square", freq: 220, slide: 70, dur: 0.16, vol: 0.055, when: 0 });
    beep({ type: "square", freq: 148, slide: 40, dur: 0.22, vol: 0.05, when: 0.12 });
    beep({ type: "square", freq: 92, slide: 28, dur: 0.28, vol: 0.04, when: 0.28 });
  }
  function sfxDive() {
    queueNet("sfx", "dive");
    if (!takeVoice("dive", 0.16, 2, 0.4)) return;
    beep({ type: "square", freq: 360, slide: 880, dur: 0.15, vol: 0.042 });
    beep({ type: "square", freq: 880, slide: 210, dur: 0.22, vol: 0.038, when: 0.14 });
  }
  function sfxTele() {
    queueNet("sfx", "tele");
    if (!takeVoice("tele", 0.16, 1, 0.28)) return;
    beep({ type: "square", freq: 210, slide: 470, dur: 0.055, vol: 0.036, when: 0 });
    beep({ type: "square", freq: 470, slide: 190, dur: 0.055, vol: 0.034, when: 0.055 });
    beep({ type: "square", freq: 190, slide: 520, dur: 0.055, vol: 0.032, when: 0.11 });
    beep({ type: "square", freq: 520, slide: 160, dur: 0.07, vol: 0.028, when: 0.165 });
  }
  function sfxWave(boss) {
    queueNet("sfx", "wave", boss);
    if (!takeVoice("wave", 0.45, 1, 0.5)) return;
    if (boss) {
      beep({ pulse: true, freq: 262, dur: 0.09, vol: 0.05, when: 0 });
      beep({ pulse: true, freq: 392, dur: 0.07, vol: 0.048, when: 0.09 });
      beep({ pulse: true, freq: 523, dur: 0.07, vol: 0.05, when: 0.16 });
      beep({ pulse: true, freq: 659, dur: 0.08, vol: 0.052, when: 0.23 });
      beep({ pulse: true, freq: 784, dur: 0.16, vol: 0.055, when: 0.31 });
    } else {
      beep({ pulse: true, freq: 392, dur: 0.055, vol: 0.045, when: 0 });
      beep({ pulse: true, freq: 523, dur: 0.055, vol: 0.048, when: 0.06 });
      beep({ pulse: true, freq: 659, dur: 0.055, vol: 0.05, when: 0.12 });
      beep({ pulse: true, freq: 784, dur: 0.12, vol: 0.052, when: 0.18 });
    }
  }
  function sfxPickup() {
    queueNet("sfx", "pick");
    if (!takeVoice("pick", 0.08, 2, 0.14)) return;
    beep({ pulse: true, freq: 659, dur: 0.05, vol: 0.045, when: 0 });
    beep({ pulse: true, freq: 988, dur: 0.08, vol: 0.05, when: 0.05 });
  }
  function sfxLife() {
    queueNet("sfx", "life");
    if (!takeVoice("life", 0.25, 1, 0.3)) return;
    beep({ pulse: true, freq: 1046, dur: 0.07, vol: 0.05, when: 0 });
    beep({ pulse: true, freq: 1318, dur: 0.07, vol: 0.052, when: 0.07 });
    beep({ pulse: true, freq: 1568, dur: 0.12, vol: 0.055, when: 0.14 });
  }
  function sfxCoin() {
    queueNet("sfx", "coin");
    if (!takeVoice("coin", 0.05, 1, 0.06)) return;
    beep({ pulse: true, freq: 1320, slide: 1760, dur: 0.045, vol: 0.038 });
  }
  function sfxCredit() {
    if (!takeVoice("credit", 0.12, 1, 0.12)) return;
    beep({ pulse: true, freq: 988, dur: 0.05, vol: 0.04, when: 0 });
    beep({ pulse: true, freq: 1318, dur: 0.07, vol: 0.042, when: 0.05 });
  }
  function sfxArmor() {
    queueNet("sfx", "armor");
    if (!takeVoice("armor", 0.04, 2, 0.05)) return;
    beep({ type: "square", freq: 880, slide: 320, dur: 0.04, vol: 0.032 });
  }
  function sfxTick() {
    queueNet("sfx", "tick");
    if (!takeVoice("tick", 0.035, 2, 0.045)) return;
    beep({ type: "square", freq: 720, slide: 280, dur: 0.036, vol: 0.028 });
  }
  function sfxOver() {
    if (!takeVoice("over", 0.6, 1, 0.8)) return;
    beep({ pulse: true, freq: 330, dur: 0.14, vol: 0.045, when: 0 });
    beep({ pulse: true, freq: 262, dur: 0.14, vol: 0.04, when: 0.14 });
    beep({ pulse: true, freq: 196, dur: 0.18, vol: 0.038, when: 0.28 });
    beep({ pulse: true, freq: 131, dur: 0.3, vol: 0.035, when: 0.46 });
  }
  function stopMusic() {
    musicPlaying = false;
    if (musicTimer) { clearTimeout(musicTimer); musicTimer = 0; }
  }
  function startMusic() {
    if (muted) return;
    ensureAudio();
    if (!actx || !musicGain) return;
    stopMusic();
    musicPlaying = true;
    musicStep = 0;
    musicNext = actx.currentTime + 0.1;
    pumpMusic();
  }
  function pumpMusic() {
    if (!musicPlaying || !actx || muted) return;
    try {
      var t = actx.currentTime;
      var stepLen = 0.1;
      var melody = [
        784, 0, 784, 0, 988, 0, 784, 0, 659, 0, 587, 0, 523, 0, 0, 0,
        784, 0, 880, 0, 784, 0, 659, 0, 587, 0, 659, 0, 784, 0, 0, 0
      ];
      var bass = [
        130.8, 0, 0, 130.8, 98, 0, 0, 98, 110, 0, 0, 110, 98, 0, 130.8, 0,
        130.8, 0, 0, 130.8, 98, 0, 0, 98, 87.3, 0, 0, 87.3, 98, 0, 98, 0
      ];
      while (musicNext < t + 0.22) {
        var i = musicStep % 32;
        if (melody[i]) beep({ pulse: true, freq: melody[i], dur: 0.055, vol: 0.09, when: musicNext - actx.currentTime, bus: musicGain });
        if (bass[i]) beep({ type: "square", freq: bass[i], dur: 0.08, vol: 0.07, when: musicNext - actx.currentTime, bus: musicGain });
        musicStep += 1;
        musicNext += stepLen;
      }
    } catch (err) {}
    musicTimer = setTimeout(pumpMusic, 70);
  }

  function makeStars() {
    stars = [];
    for (var i = 0; i < 46; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, s: rand(0.4, 1.6), v: rand(12, 55) });
  }

  function makeEnemy(offX, offY, type, extra) {
    extra = extra || {};
    var hp = enemyHp(type, extra.tier || 0, wave);
    var e = {
      id: extra.id || allocId(),
      offX: offX, offY: offY, type: type,
      hp: hp, maxHp: hp, alive: true, state: "enter", t: 0, hitFlash: 0,
      x: W / 2 + offX * 0.2, y: -28 - Math.random() * 18,
      sx: 0, sy: 0, cx: 0, cy: 0, ex: 0, ey: 0, dur: 1,
      shotsLeft: 0, shotAt: 0, shotCd: type === "sniper" ? rand(1.45, 2.85) : (soloEarly() ? rand(0.48, 1.64) : rand(0.85, 2.42)),
      shieldHp: type === "shield" ? 2 + Math.floor(wave / 20) + extraPlayers() : 0,
      phase: Math.random() * 6.2,
      isBoss: !!extra.isBoss, tier: extra.tier || 0,
      atkCd: extra.isBoss ? rand(1.65, 2.35) : (type === "archon" ? 1.45 : 0), atk: "", lastAtk: "", tele: null,
      phaseIdx: 0, followups: [], stream: null, afterReturn: "", combo: false, aimX: 0, aimY: 0,
      r: enemyR(type), patrolDir: Math.random() < 0.5 ? -1 : 1,
      moveStyle: "patrol", moveAmp: 1, moveSpd: 1, moveFreq: 1,
      homeX: W / 2, hoverT: 0, atkQueue: [], atkQIdx: 0,
      archonTurn: 0, archonX: 0, archonY: 0,
      leech: !!extra.leech, leechHp: 0, leechAcc: 0, healFlash: 0
    };
    if (e.isBoss) rollBossFight(e);
    return e;
  }

  function setFormBounds(slots) {
    if (!slots.length) {
      form.minOff = -20; form.maxOff = 20; form.ox = W / 2; return;
    }
    var minX = slots[0].ox, maxX = slots[0].ox, i;
    for (i = 1; i < slots.length; i++) {
      if (slots[i].ox < minX) minX = slots[i].ox;
      if (slots[i].ox > maxX) maxX = slots[i].ox;
    }
    form.minOff = minX;
    form.maxOff = maxX;
    form.ox = (W - (maxX - minX)) / 2 - minX;
  }

  function spawnPickup(x, y, kind, amount) {
    var big = kind === "revive";
    pickups.push({
      id: allocId(), x: x, y: y, vy: big ? 56 : 48, kind: kind,
      bob: Math.random() * 6, amount: amount || 1
    });
  }
  function fortuneMul() {
    var i, mul = 1, p, s;
    if (!players.length) return (hasMod("fortune") ? 1.5 : 1) * (shipDef().coinMul || 1);
    for (i = 0; i < players.length; i++) {
      p = players[i];
      s = shipDef(p);
      mul = Math.max(mul, (hasMod("fortune", p) ? 1.5 : 1) * (s.coinMul || 1));
    }
    return mul;
  }
  // Coin economy. Pickup coins are scaled by COIN_SPAWN_MUL (drop chance and boss piles).
  // Roughly 2 x amount coins per regular wave plus a boss pile, so a solo run to wave 10
  // yields ~45 pickup coins, wave 20 ~128, wave 30 ~225, wave 45 ~375 (before the wave bonus).
  // Co-op multiplies chance and pile size by player count; the team pool is then granted
  // in full to every player at run end (30 team coins → 30 each).
  function dropCoins(e, boss) {
    var mul = fortuneMul();
    var pc = playerCount();
    var amount, chance;
    if (boss) {
      amount = 10 + 3 * Math.floor(wave / 5) + 8 * (e.tier || 0);
      if (amount > 80) amount = 80;
      if (anyHasMod("salvage")) amount *= 1.6;
      amount = Math.max(1, Math.round(amount * mul * COIN_SPAWN_MUL * pc));
      spawnPickup(e.x + rand(-6, 6), e.y + 10, "coin", amount);
      return;
    }
    if (e.type === "tank" || e.type === "shield" || e.type === "mortar" || e.type === "hex" || e.type === "harrier" || e.type === "bulwark") {
      chance = 0.25 * mul * COIN_SPAWN_MUL * pc;
      amount = 1 + Math.floor(wave / 6);
    } else {
      chance = 0.14 * mul * COIN_SPAWN_MUL * pc;
      amount = 1 + Math.floor(wave / 6);
    }
    if (amount > 5) amount = 5;
    amount = Math.max(1, Math.round(amount * (mul > 1 ? mul : 1) * pc));
    if (Math.random() < chance) spawnPickup(e.x + rand(-8, 8), e.y + 8, "coin", amount);
  }
  // Banked at the end of a run regardless of pickups: 2 coins per wave reached, times player count.
  function waveBonusCoins() {
    var b = Math.floor((run.maxWave || 1) * 2 * playerCount());
    if (anyHasMod("salvage")) b = Math.floor(b * 1.5);
    return b;
  }
  function pickWeightedPowerup() {
    var total = 0, i, r;
    for (i = 0; i < POWER_WEIGHTS.length; i++) total += POWER_WEIGHTS[i].w;
    r = Math.random() * total;
    for (i = 0; i < POWER_WEIGHTS.length; i++) {
      r -= POWER_WEIGHTS[i].w;
      if (r <= 0) return POWER_WEIGHTS[i].kind;
    }
    return POWER_WEIGHTS[POWER_WEIGHTS.length - 1].kind;
  }
  // HEAL gems: originally a 1.2% band after the 1% 1UP roll, then 0.72%, then 0.36%.
  // Cut another 20% to 0.288% at wave 1; still climbs with wave. 1UPs are 0.8% (was 1%).
  function lifeDropChance() { return 0.008; }
  function healDropChance(n) {
    n = n || wave || 1;
    return 0.00288 * (1 + Math.min(0.6, (n - 1) * 0.012));
  }
  function maybeDrop(e, guaranteed) {
    if (guaranteed) {
      spawnPickup(e.x, e.y, "heal");
      dropCoins(e, true);
      return;
    }
    var roll = Math.random();
    var pc = playerCount();
    var wrate = ((e.type === "tank" || e.type === "shield" || e.type === "mortar" || e.type === "hex" || e.type === "harrier" || e.type === "bulwark") ? 0.07 : 0.05) * pc;
    var healEnd = (lifeDropChance() + healDropChance()) * pc;
    if (roll < lifeDropChance() * pc) spawnPickup(e.x, e.y, "life");
    else if (roll < healEnd) spawnPickup(e.x, e.y, "heal");
    else if (roll < wrate) spawnPickup(e.x, e.y, pickWeightedPowerup());
    dropCoins(e, false);
  }
  function notePickup(kind) {
    if (!kind || kind === "coin") return;
    run.pickups[kind] = (run.pickups[kind] || 0) + 1;
    if (!profile.stats.pickups) profile.stats.pickups = {};
    profile.stats.pickups[kind] = (profile.stats.pickups[kind] || 0) + 1;
  }
  function grantPickup(kind, amount, who) {
    who = who || player;
    if (!who) return;
    if (kind === "coin") {
      run.coins += amount || 1;
      sfxCoin();
      syncQuestProgress();
      updateHud();
      return;
    }
    notePickup(kind);
    if (kind === "life") sfxLife();
    else if (kind === "revive") sfxLife();
    else sfxPickup();
    if (kind !== "coin" && kind !== "life" && kind !== "revive" && skinIdOf(who) === "warden-jade") {
      who.invuln = Math.max(who.invuln || 0, 0.4);
    }
    if (kind === "revive") {
      reviveDownedFrom(who);
    } else if (kind === "life") {
      if (who.lives < lifeCap(who)) who.lives += 1;
      banner = { text: "1UP", life: 0.8 };
    } else if (kind === "heal") {
      if (who.lives < loadoutLives(shipDef(who))) {
        who.lives += 1;
        banner = { text: "HEAL", life: 0.8 };
      } else {
        score += 200;
        who.shieldHp = Math.max(who.shieldHp, 1);
        who.shieldT = Math.max(who.shieldT, 4);
        banner = { text: "FULL +200", life: 0.7 };
      }
    } else if (kind === "shield") {
      who.shieldHp = Math.max(who.shieldHp, 2);
      who.shieldT = SHIELD_T * loadoutPickMul(shipDef(who), equippedMod(who));
    } else if (kind === "speed") {
      who.speedT = SPEED_T * loadoutPickMul(shipDef(who), equippedMod(who));
    } else {
      who.weapon = kind;
      who.weaponT = WEAPON_T * loadoutPickMul(shipDef(who), equippedMod(who));
    }
    syncLocalPlayer();
    syncQuestProgress();
    updateHud();
  }
  function pickupScale(pk) {
    return pk && pk.kind === "revive" ? 1.85 : 1;
  }
  function pickupReach(who, pk) {
    return ((who && who.r) || PLAYER_R) + PICKUP_PAD + (pk && pk.kind === "revive" ? 12 : 0);
  }
  function nearestPicker(pk) {
    var i, pl, d2, reach, best = null, bestD = 1e12;
    for (i = 0; i < players.length; i++) {
      pl = players[i];
      if (!pl || !pl.alive) continue;
      d2 = dist2(pl.x, pl.y, pk.x, pk.y);
      reach = pickupReach(pl, pk);
      if (d2 < reach * reach && d2 < bestD) {
        bestD = d2;
        best = pl;
      }
    }
    return best;
  }
  function consumePickupAt(i, who) {
    var p = pickups[i];
    if (!p || !who) return false;
    if (p.kind === "revive") waveHold = Math.max(waveHold, 0.55);
    grantPickup(p.kind, p.amount, who);
    if (p.id != null) delete pendingPickAt[p.id];
    pickups.splice(i, 1);
    return true;
  }
  function requestClientPickups() {
    var who, i, p, now, reach;
    if (netRole !== "client") return;
    who = players[localSlot];
    if (!who || !who.alive) return;
    now = time;
    for (i = 0; i < pickups.length; i++) {
      p = pickups[i];
      if (!p || p.id == null) continue;
      if (pendingPickAt[p.id] && now - pendingPickAt[p.id] < 0.4) continue;
      reach = pickupReach(who, p);
      if (dist2(who.x, who.y, p.x, p.y) >= reach * reach) continue;
      pendingPickAt[p.id] = now;
      pickSeq += 1;
      netSend({ t: "pick", n: pickSeq, id: p.id, slot: localSlot, x: who.x, y: who.y });
    }
  }
  function hideClaimedPickups() {
    var i, p, t0;
    for (i = pickups.length - 1; i >= 0; i--) {
      p = pickups[i];
      if (!p || p.id == null) continue;
      t0 = pendingPickAt[p.id];
      if (!t0) continue;
      if (time - t0 < 0.45) pickups.splice(i, 1);
      else delete pendingPickAt[p.id];
    }
  }
  function hostGrantPickup(msg) {
    var slot, who, i, p, px, py, near;
    if (netRole !== "host" || !msg) return;
    slot = msg.slot == null ? 1 : msg.slot;
    if (slot === localSlot) return;
    who = players[slot];
    if (!who || !who.alive) return;
    px = msg.x != null && isFinite(msg.x) ? msg.x : who.x;
    py = msg.y != null && isFinite(msg.y) ? msg.y : who.y;
    for (i = pickups.length - 1; i >= 0; i--) {
      p = pickups[i];
      if (p.id !== msg.id) continue;
      near = dist2(px, py, p.x, p.y) < PICKUP_CLAIM_R * PICKUP_CLAIM_R
        || dist2(who.x, who.y, p.x, p.y) < PICKUP_CLAIM_R * PICKUP_CLAIM_R;
      if (!near) return;
      consumePickupAt(i, who);
      return;
    }
  }

  function addEbul(x, y, vx, vy, opt) {
    if (ebul.length >= ebulCap()) return;
    opt = opt || {};
    if (!opt.silent) sfxEnemyShot();
    ebul.push({
      id: allocId(),
      x: x, y: y, vx: vx, vy: vy,
      r: opt.r || 2.3,
      homing: !!opt.homing,
      homeT: opt.homeT || 0,
      hsp: opt.hsp || 78,
      hturn: opt.hturn || 0.78,
      mine: !!opt.mine,
      fuse: opt.fuse || 0,
      pellets: opt.pellets || 6,
      pelletSpd: opt.pelletSpd || 110,
      age: 0,
      life: opt.life || 0,
      grav: opt.grav || 0,
      accel: opt.accel || 0,
      sway: opt.sway || 0,
      swayF: opt.swayF || 0,
      swayPh: opt.swayPh || 0,
      bx: x,
      pauseAt: opt.pauseAt || 0,
      pauseT: opt.pauseT || 0,
      paused: false,
      resumeSpd: opt.resumeSpd || 0,
      splitOnResume: !!opt.splitOnResume,
      splitAt: opt.splitAt || 0,
      splitT: opt.splitT || 0,
      seed: !!opt.seed,
      noTwin: !!opt.noTwin,
      color: opt.color || "#ffd0e0",
      glow: opt.glow || "#ff6b9a",
      owner: opt.owner == null ? -1 : opt.owner
    });
    if (!opt.noTwin && fxHas("twin")) {
      addEbul(W - x, y, -vx, vy, {
        r: opt.r, homing: opt.homing, homeT: opt.homeT, hsp: opt.hsp, hturn: opt.hturn,
        mine: opt.mine, fuse: opt.fuse, pellets: opt.pellets, pelletSpd: opt.pelletSpd,
        life: opt.life, grav: opt.grav, accel: opt.accel, sway: opt.sway, swayF: opt.swayF,
        swayPh: opt.swayPh, pauseAt: opt.pauseAt, pauseT: opt.pauseT, resumeSpd: opt.resumeSpd,
        splitOnResume: opt.splitOnResume, splitAt: opt.splitAt, splitT: opt.splitT,
        seed: opt.seed, color: opt.color, glow: opt.glow, owner: opt.owner,
        silent: true, noTwin: true
      });
    }
  }
  function addTele(kind, x, y, x2, y2, dur, color) {
    teles.push({ kind: kind, x: x, y: y, x2: x2, y2: y2, t: dur, max: dur, color: color || "#ff6b9a" });
    sfxTele();
  }
  // Rectangle telegraph helper: (x, y) is the centre, (x2, y2) half-width/half-height.
  function addZone(x, y, hw, hh, dur, color) {
    teles.push({ kind: "zone", x: x, y: y, x2: hw, y2: hh, t: dur, max: dur, color: color || "#ff6b9a" });
    sfxTele();
  }
  function armLaneBomb(x, y, color) {
    x = clamp(x, 20, W - 20);
    y = H - 40;
    teles.push({ kind: "zone", x: x, y: y, x2: 18, y2: 22, t: 0.65, max: 0.65, color: color || "#ff6b3d", blast: true });
    sfxTele();
  }
  function detonateLaneBomb(z) {
    var i, ang, pl, pr;
    explode(z.x, z.y, z.color || "#ff6b3d", false);
    for (i = 0; i < 4; i++) {
      ang = -0.85 + i * (1.7 / 3);
      addEbul(z.x, z.y, Math.sin(ang) * 115, Math.cos(ang) * 115 + 20, {
        color: "#ffb080", glow: z.color || "#ff6b3d", r: 2.4
      });
    }
    for (i = 0; i < players.length; i++) {
      pl = players[i];
      if (!pl || !pl.alive || pl.invuln > 0) continue;
      pr = pl.r || PLAYER_R;
      if (Math.abs(pl.x - z.x) < (z.x2 || 18) + pr && Math.abs(pl.y - z.y) < (z.y2 || 22) + pr) playerDie(pl);
    }
  }
  function applyHexJam() {
    var i, p;
    for (i = 0; i < players.length; i++) {
      p = players[i];
      if (p && p.alive) p.jamT = 1.1;
    }
    banner = { text: "JAMMED", life: 0.7 };
  }
  // Bulwarks pulse a random support effect across their nearby allies. A heal restores
  // one HP (without exceeding max HP); a shield adds one hit of protection.
  function bulwarkSupport(e) {
    var heal = Math.random() < 0.5;
    var i, ally, affected = 0, r2 = 72 * 72;
    var color = heal ? "#7affc4" : "#9ab8ff";
    for (i = 0; i < enemies.length; i++) {
      ally = enemies[i];
      if (!ally.alive || ally === e || dist2(e.x, e.y, ally.x, ally.y) >= r2) continue;
      if (heal && ally.hp < ally.maxHp) {
        ally.hp = Math.min(ally.maxHp, ally.hp + 1);
        ally.healFlash = 0.35;
      } else if (!heal && ally.shieldHp < 1) {
        ally.shieldHp = 1;
      } else {
        continue;
      }
      affected += 1;
      teles.push({ kind: "line", x: e.x, y: e.y, x2: ally.x, y2: ally.y, t: 0.32, max: 0.32, color: color });
      rings.push({ x: ally.x, y: ally.y, r: ally.r + 2, vr: 56, life: 0.32, color: color });
    }
    if (affected) {
      teles.push({ kind: "ring", x: e.x, y: e.y, x2: 0, y2: 0, t: 0.38, max: 0.38, color: color });
      rings.push({ x: e.x, y: e.y, r: 6, vr: 175, life: 0.38, color: color });
      if (heal) sfxPickup();
      else sfxArmor();
    }
  }
  function spawnHarrierDarts(e) {
    var tgt, tx, i, k, side;
    if (netReplay) return;
    tgt = targetPlayer(e.x, e.y);
    tx = tgt ? tgt.x : W / 2;
    for (i = 0; i < 2; i++) {
      side = i === 0 ? -1 : 1;
      k = makeEnemy((e.offX || 0) + side * 12, e.offY || 0, "kami");
      k.state = "kami";
      k.t = 0;
      k.dur = rand(0.85, 1.15);
      k.x = e.x + side * 10;
      k.y = e.y;
      k.sx = k.x;
      k.sy = k.y;
      k.cx = k.x + side * 28;
      k.cy = k.y + 40;
      k.ex = clamp(tx + side * 16, 16, W - 16);
      k.ey = H + 40;
      k.shotsLeft = 0;
      enemies.push(k);
    }
    sfxDive();
  }
  function dropArchonLoot(e) {
    var mul = fortuneMul();
    var pc = playerCount();
    var amount = 10 + 3 * Math.floor(wave / 5);
    var roll;
    if (anyHasMod("salvage")) amount *= 1.6;
    amount = Math.max(1, Math.round(amount * 0.45 * mul * COIN_SPAWN_MUL * pc));
    spawnPickup(e.x + rand(-6, 6), e.y + 10, "coin", amount);
    roll = Math.random();
    if (roll < lifeDropChance() * pc) spawnPickup(e.x, e.y - 8, "life");
    else if (roll < (lifeDropChance() + healDropChance()) * pc) spawnPickup(e.x, e.y - 8, "heal");
    else if (roll < 0.14 * pc) spawnPickup(e.x, e.y - 8, pickWeightedPowerup());
  }

  function guestBossBanner(plan) {
    var names = [], i, d;
    for (i = 0; i < plan.bosses.length; i++) {
      d = bossDef(plan.bosses[i]);
      names.push(d ? d.name : "BOSS");
    }
    return names.join(" + ") + (plan.tier ? " +" + plan.tier : "");
  }

  function spawnWave(n) {
    if (isPvpRun()) return;
    wave = n;
    waveHold = 0;
    enemies = [];
    ebul = [];
    teles = [];
    bossFx = [];
    form.oy = 46;
    form.dir = 1;
    form.speed = (24 + Math.min(22, (pressureWave(n) - 1) * 3.2)) * (1 + extraPlayers() * 0.12);
    enterT = isBossWave(n) ? 1.15 : 0.75;
    diveCd = isBossWave(n) ? 99 : 1.2;
    waveKind = isBossWave(n) ? "boss" : formationKind(n);
    var plan = isBossWave(n) ? null : guestBossPlan(n);
    sfxWave(isBossWave(n) || !!(plan && plan.bosses.length));
    if (isBossWave(n)) {
      var meta = bossMeta(n);
      var label = bossName(meta.type) + (meta.tier ? " +" + meta.tier : "");
      banner = { text: label, life: 1.4 };
      form.minOff = -20; form.maxOff = 20; form.ox = W / 2;
      run.bossHits = 0;
      enemies.push(makeEnemy(0, 0, meta.type, { isBoss: true, tier: meta.tier }));
    } else {
      banner = { text: isMiniWave(n) ? "ARCHON" : ("WAVE " + n), life: isMiniWave(n) ? 1.4 : 1.1 };
      var slots = buildSlots(waveKind, n);
      setFormBounds(slots);
      var i, guest, bx;
      for (i = 0; i < slots.length; i++) enemies.push(makeEnemy(slots[i].ox, slots[i].oy, slots[i].type));
      if (plan && plan.bosses.length) {
        run.bossHits = 0;
        for (i = 0; i < plan.bosses.length; i++) {
          bx = plan.bosses.length === 1 ? 0 : (i === 0 ? -56 : 56);
          guest = makeEnemy(bx, 10, plan.bosses[i], { isBoss: true, tier: plan.tier || 0 });
          guest.homeX = plan.bosses.length === 1 ? W / 2 : (i === 0 ? 70 : W - 70);
          enemies.push(guest);
        }
        banner = { text: guestBossBanner(plan), life: 1.4 };
      }
    }
    if (player && player.alive) player.invuln = Math.max(player.invuln, 1.15);
    var pi;
    for (pi = 0; pi < players.length; pi++) {
      if (players[pi] && players[pi].alive) players[pi].invuln = Math.max(players[pi].invuln, 1.15);
      resetSkinWave(players[pi]);
    }
    run.maxWave = Math.max(run.maxWave, n);
    if (!run.hits) run.cleanWave = Math.max(run.cleanWave || 0, n);
    if (!run.livesLost) run.safeWave = Math.max(run.safeWave || 0, n);
    profile.stats.maxWave = Math.max(profile.stats.maxWave || 0, n);
    syncQuestProgress();
    updateHud();
  }

  function makePlayer(slot, spec, count) {
    spec = spec || profileLoadoutSpec();
    var s = findShip(spec.ship);
    var x = spawnXFor(slot, count || 1);
    return {
      slot: slot,
      loadout: { ship: spec.ship || "wisp", gun: spec.gun || "pulse", mod: spec.mod || null, skin: spec.skin || equippedSkinFor(spec.ship || "wisp") },
      x: x, targetX: x, y: H - 34,
      facing: slot === 1 ? 1 : -1,
      fireCd: 0, invuln: 0, muzzle: 0, alive: true,
      weapon: "normal", weaponT: 0, speedT: 0, shieldT: 0, shieldHp: 0, slowT: 0, jamT: 0,
      r: loadoutR(s, spec.mod), speed: loadoutSpeed(s, spec.mod), invulnDur: s.invuln, regen: s.regen, regenT: 0,
      shotCount: 0,
      lives: loadoutLives(s),
      hp: 0, maxHp: 0, boss: spec.boss || null, abilityCd: 0, dash: null, rewind: null,
      leech: 0,
      skinBoostT: 0, skinFireMul: 1, skinSpdMul: 1, skinHotT: 0, skinHotStacks: 0,
      skinWard: 0, skinBlood: 0, skinEcho: null, skinNebulaCd: 0, skinNebulaT: 0,
      skinSentinelCd: 0, skinUmbraT: 0, skinCarrion: 0, skinCoronaAcc: 0, skinKeepX: false,
      input: { left: false, right: false, fire: false, ability: false, holdL: 0, holdR: 0, aimX: null },
      hostX: x
    };
  }
  function resetPlayer() {
    players = [makePlayer(0, profileLoadoutSpec())];
    localSlot = 0;
    syncLocalPlayer();
  }
  // Damage every living enemy (Nova hull passive).
  function novaBurst(x, y, dmg, skipSlot) {
    queueNet("nova", x, y, dmg, skipSlot);
    var i, e;
    if (!netReplay) {
      if (isPvpRun()) {
        for (i = 0; i < players.length; i++) {
          e = players[i];
          if (!e || !e.alive) continue;
          if (skipSlot != null && e.slot === skipSlot) continue;
          if (dist2(e.x, e.y, x, y) < 70 * 70) pvpHurt(e, dmg || 6);
        }
      } else {
        for (i = 0; i < enemies.length; i++) {
          e = enemies[i];
          if (!e.alive || e.state === "enter") continue;
          killEnemy(e, false, dmg);
        }
      }
    }
    rings.push({ x: x, y: y, r: 6, vr: 520, life: 0.6, color: "#ffe08a" });
    rings.push({ x: x, y: y, r: 2, vr: 380, life: 0.6, color: "#ffffff" });
    flash = Math.max(flash, 0.5);
  }

  function explode(x, y, color, big) {
    queueNet("ex", x, y, color, big);
    shake = Math.min(12, shake + (big ? 6.2 : 2.8));
    flash = Math.max(flash, big ? 0.38 : 0.16);
    var n = big ? 32 : 16;
    var i, a, sp;
    for (i = 0; i < n; i++) {
      a = Math.random() * Math.PI * 2;
      sp = rand(50, big ? 240 : 140);
      particles.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(0.28, 0.6), color: i % 3 === 0 ? "#ffffff" : color,
        size: rand(1.1, big ? 3.4 : 2.4)
      });
    }
    rings.push({ x: x, y: y, r: 3, vr: big ? 180 : 110, life: big ? 0.5 : 0.34, color: color });
    sfxBoom(big);
  }

  function killEnemy(e, diving, dmg, ownerSlot, fromPerk) {
    if (!e.alive) return;
    dmg = dmg || 1;
    var owner = ownerSlot != null ? players[ownerSlot] : null;
    var burning = (e.burnTicks || 0) > 0 || (e.burnT || 0) > 0;
    if (e.shieldHp > 0) {
      e.shieldHp -= 1;
      e.hitFlash = 0.1;
      shake = Math.min(10, shake + 1);
      sfxArmor();
      return;
    }
    e.hp -= dmg;
    e.hitFlash = 0.08;
    if (e.hp > 0) {
      shake = Math.min(10, shake + (e.isBoss ? 1.8 : 1.2));
      sfxTick();
      if (e.isBoss) checkBossPhase(e);
      if (e.type === "archon" && e.phaseIdx < 1 && e.hp <= e.maxHp * 0.5) {
        e.phaseIdx = 1;
        banner = { text: "ARCHON ENRAGES", life: 1.05 };
      }
      return;
    }
    e.alive = false;
    if (e.leech) stripLeechHeal(e);
    var pts = enemyPts(e.type, diving);
    if (e.isBoss) pts += 800 * e.tier;
    score += pts;
    run.kills = (run.kills || 0) + 1;
    run.killsByType[e.type] = (run.killsByType[e.type] || 0) + 1;
    profile.stats.killsByType[e.type] = (profile.stats.killsByType[e.type] || 0) + 1;
    if (owner && owner.alive) {
      var sid = skinIdOf(owner);
      if (sid === "needle-hotstreak") {
        if ((owner.skinHotT || 0) > 0) owner.skinHotStacks = Math.min(4, (owner.skinHotStacks || 0) + 1);
        else owner.skinHotStacks = 1;
        owner.skinHotT = 1.8;
        refreshSkinMuls(owner);
      }
      if (sid === "vulture-carrion" && (diving || e.type === "kami" || e.state === "kami" || e.state === "dive")) {
        owner.invuln = Math.max(owner.invuln || 0, 0.55);
        owner.skinCarrion = 1;
      }
      if (sid === "nova-supernova" && fromPerk !== "splash") skinSplash(e.x, e.y, 30, 2, owner.slot, "splash");
      if (sid === "strix-inferno" && burning && fromPerk !== "splash") skinSplash(e.x, e.y, 22, 1.5, owner.slot, "splash");
    }
    if (e.isBoss) {
      run.bosses[e.type] = (run.bosses[e.type] || 0) + 1;
      profile.stats.bosses[e.type] = (profile.stats.bosses[e.type] || 0) + 1;
      if (!profile.stats.bossBest) profile.stats.bossBest = {};
      profile.stats.bossBest[e.type] = Math.max(profile.stats.bossBest[e.type] || 0, (e.tier || 0) + 1);
      if (!run.bossHits) {
        run.perfectBosses = (run.perfectBosses || 0) + 1;
        profile.stats.perfectBosses = (profile.stats.perfectBosses || 0) + 1;
        score += 1000;
      }
      var pi, pl;
      for (pi = 0; pi < players.length; pi++) {
        pl = players[pi];
        if (pl && pl.alive && shipDef(pl).passive === "eclipse" && pl.lives < lifeCap(pl)) {
          pl.lives += 1;
          sfxLife();
        }
      }
      syncLocalPlayer();
    }
    explode(e.x, e.y, enemyColor(e.type), e.isBoss || e.type === "tank" || e.type === "archon");
    if (diving) {
      run.diveKills = (run.diveKills || 0) + 1;
      profile.stats.diveKills = (profile.stats.diveKills || 0) + 1;
    }
    if (!e.isBoss) {
      var li, lp;
      for (li = 0; li < players.length; li++) {
        lp = players[li];
        if (!lp || !lp.alive || shipDef(lp).passive !== "leech") continue;
        lp.leech = (lp.leech || 0) + 1;
        if (lp.leech >= 18) {
          lp.leech = 0;
          if (lp.shieldHp < 2) { lp.shieldHp += 1; sfxArmor(); banner = banner || { text: "LEECH +1", life: 0.6 }; }
        }
      }
    }
    if (e.type === "harrier") spawnHarrierDarts(e);
    if (e.isBoss) {
      explode(e.x - 12, e.y + 6, "#ffffff", true);
      explode(e.x + 10, e.y - 8, enemyColor(e.type), true);
      maybeDrop(e, true);
      banner = { text: bossName(e.type) + (run.bossHits ? " DOWN" : " FLAWLESS"), life: 1.2 };
      ebul.length = 0;
      teles.length = 0;
      spawnReviveAfterBoss(e);
    } else if (e.type === "archon") {
      explode(e.x - 8, e.y + 4, "#ff5c7a", true);
      dropArchonLoot(e);
      banner = { text: "ARCHON DOWN", life: 1.15 };
    } else {
      maybeDrop(e, false);
    }
    syncQuestProgress();
    updateHud();
  }

  function applyPvpLayout(p) {
    if (!p) return;
    p.facing = p.slot === 1 ? 1 : -1;
    p.y = p.slot === 1 ? 34 : H - 34;
    p.x = W / 2;
    p.targetX = p.x;
    p.hostX = p.x;
    if (p.boss) {
      var d = bossDef(p.boss) || BOSS_DEFS[0];
      var api = pvpApi();
      p.hp = api ? api.PVP_HP : 7;
      p.maxHp = p.hp;
      p.lives = 1;
      p.shieldHp = 0;
      p.shieldT = 0;
      p.r = d.r || 18;
      p.speed = Math.max(150, (d.spd || 40) * 3.2);
      p.invulnDur = (api && api.PVP_HIT_INVULN) || 0.16;
      p.abilityCd = 0.6;
    }
  }

  function pvpHurt(who, dmg) {
    who = who || player;
    if (!who || !who.alive) return;
    if (who.invuln > 0) return;
    if (pvpS() && pvpS().roundLock) return;
    if (consumeSkinWard(who)) return;
    dmg = dmg || 1;
    run.hits = (run.hits || 0) + 1;
    if (who.shieldHp > 0) {
      who.shieldHp -= 1;
      if (who.shieldHp <= 0) who.shieldT = 0;
      explode(who.x, who.y, "#6b8cff", false);
      who.invuln = 0.7;
      sfxArmor();
      skinAfterHit(who, "shield");
      updateHud();
      return;
    }
    if (who.boss && who.maxHp) {
      who.hp = Math.max(0, (who.hp || 0) - dmg);
      explode(who.x, who.y, "#ff7a5c", who.hp <= 0);
      sfxHit();
      who.invuln = (pvpApi() && pvpApi().PVP_HIT_INVULN) || 0.16;
      skinAfterHit(who, "hull");
      updateHud();
      if (who.hp <= 0) {
        who.alive = false;
        who.lives = 0;
        if (netRole !== "client") pvpRoundOver(who.slot);
      }
      return;
    }
    playerDie(who);
  }

  function pvpRoundOver(loserSlot) {
    var api = pvpApi();
    var sess = pvpS();
    var winner, hold;
    if (!api || !sess || !isPvpRun() || sess.roundLock || sess.matchOver) return;
    sess.roundLock = true;
    winner = loserSlot === 0 ? 1 : 0;
    api.addWin(winner);
    banner = {
      text: pvpRoundBannerText(winner),
      life: 1.7
    };
    hold = api.ROUND_HOLD || 1.85;
    sess.roundHold = hold;
    if (netRole === "host") {
      netSend({ t: "round", loser: loserSlot, wins: sess.wins.slice(), round: sess.round, hold: hold });
    }
    if (api.matchWinner() >= 0) {
      sess.roundHold = Math.max(sess.roundHold, 1.1);
    }
    updateHud();
  }

  function pvpBeginRound() {
    var sess = pvpS();
    var api = pvpApi();
    var i, p;
    if (!sess || !api) return;
    if (sess.matchOver || api.matchWinner() >= 0) {
      if (netRole !== "client") pvpFinishMatch(api.matchWinner());
      return;
    }
    if (netRole !== "client") sess.round = (sess.round || 1) + 1;
    sess.roundLock = false;
    sess.roundHold = 0;
    pbul = [];
    ebul = [];
    teles = [];
    particles = [];
    rings = [];
    for (i = 0; i < players.length; i++) {
      p = players[i];
      if (!p) continue;
      p.alive = true;
      applyPvpLayout(p);
      applyShipPassives(p);
      if (p.boss) {
        p.shieldHp = 0;
        p.shieldT = 0;
        p.lives = 1;
      } else {
        p.lives = loadoutLives(shipDef(p));
      }
      p.invuln = 1.15;
      p.fireCd = 0.25;
      p.weapon = "normal";
      p.weaponT = 0;
      p.speedT = 0;
      p.slowT = 0;
      p.jamT = 0;
      p.abilityCd = 0.4;
      p.dash = null;
      p.rewind = null;
      resetSkinWave(p);
    }
    syncLocalPlayer();
    banner = { text: "ROUND " + sess.round, life: 1.1 };
    if (netRole === "host") {
      netSend({ t: "pvpnext", round: sess.round, wins: sess.wins.slice() });
    }
    updateHud();
  }

  function pvpFinishMatch(winnerSlot) {
    var api = pvpApi();
    var sess = pvpS();
    var pay;
    if (!api || !sess || runFinished) return;
    sess.matchOver = true;
    sess.started = true;
    pay = api.payout(winnerSlot);
    if (netRole === "host") {
      netSend({
        t: "matchover",
        winner: winnerSlot,
        wins: sess.wins.slice(),
        forfeit: sess.forfeit,
        pay: pay
      });
    }
    finishPvpRun(winnerSlot, pay, true);
  }

  function playerDie(who) {
    who = who || player;
    if (!who || !who.alive) return;
    if (who.invuln > 0) return;
    if (consumeSkinWard(who)) return;
    run.hits = (run.hits || 0) + 1;
    if (currentBoss()) run.bossHits = (run.bossHits || 0) + 1;
    if (who.shieldHp > 0) {
      who.shieldHp -= 1;
      if (who.shieldHp <= 0) who.shieldT = 0;
      explode(who.x, who.y, "#6b8cff", false);
      who.invuln = 0.85;
      ebul.length = 0;
      skinAfterHit(who, "shield");
      syncQuestProgress();
      updateHud();
      return;
    }
    explode(who.x, who.y, "#7ef9ff", true);
    sfxHit();
    who.lives -= 1;
    run.livesLost = (run.livesLost || 0) + 1;
    if (!isPvpRun()) ebul.length = 0;
    else {
      var bi;
      for (bi = pbul.length - 1; bi >= 0; bi--) {
        if (pbul[bi].owner === who.slot) pbul.splice(bi, 1);
      }
    }
    who.weapon = "normal"; who.weaponT = 0; who.speedT = 0; who.slowT = 0; who.jamT = 0;
    if (shipDef(who).passive === "nova") novaBurst(who.x, who.y, 6, who.slot);
    who.skinKeepX = false;
    skinAfterHit(who, "hull");
    syncLocalPlayer();
    syncQuestProgress();
    updateHud();
    if (who.lives <= 0) {
      who.alive = false;
      if (isPvpRun()) {
        if (netRole !== "client") pvpRoundOver(who.slot);
        return;
      }
      if (!anyPlayerAlive()) endGame();
      return;
    }
    if (isPvpRun()) {
      applyPvpLayout(who);
      who.dash = null;
      who.rewind = null;
    } else if (!who.skinKeepX) {
      who.x = spawnXFor(who.slot, players.length);
      who.targetX = who.x;
    }
    who.skinKeepX = false;
    who.invuln = (who.invulnDur || INVULN) + (hasMod("guardian", who) ? 0.6 : 0);
    if (skinIdOf(who) === "eclipse-umbra") who.skinUmbraT = Math.max(who.skinUmbraT || 0, who.invuln);
    if (hasMod("guardian", who)) { who.shieldHp = Math.max(who.shieldHp, 2); who.shieldT = 0; }
    who.muzzle = 0;
    who.fireCd = 0.2;
  }

  function downedPlayer() {
    var i, p;
    for (i = 0; i < players.length; i++) {
      p = players[i];
      if (p && !p.alive) return p;
    }
    return null;
  }
  function hasRevivePickup() {
    var i;
    for (i = 0; i < pickups.length; i++) if (pickups[i] && pickups[i].kind === "revive") return true;
    return false;
  }
  function spawnReviveAfterBoss(e) {
    var x, y;
    if (!isCoop() || extraPlayers() < 1) return;
    if (!downedPlayer() || hasRevivePickup()) return;
    x = e && e.x != null ? clamp(e.x, 24, W - 24) : W / 2;
    y = e && e.y != null ? e.y : 40;
    if (y < 20) y = 20;
    if (y > H - 90) y = H - 90;
    spawnPickup(x, y, "revive");
    banner = { text: "REVIVE", life: 1.2 };
  }
  function reviveDownedFrom(collector) {
    var target = downedPlayer();
    if (!target) {
      if (collector && collector.lives < lifeCap(collector)) collector.lives += 1;
      banner = { text: "1UP", life: 0.8 };
      return;
    }
    target.alive = true;
    target.lives = Math.max(1, target.lives);
    target.x = spawnXFor(target.slot, players.length);
    target.targetX = target.x;
    target.invuln = (target.invulnDur || INVULN) + (hasMod("guardian", target) ? 0.6 : 0);
    target.weapon = "normal";
    target.weaponT = 0;
    target.speedT = 0;
    target.slowT = 0;
    target.jamT = 0;
    target.muzzle = 0;
    target.fireCd = 0.2;
    if (hasMod("guardian", target)) { target.shieldHp = Math.max(target.shieldHp, 2); target.shieldT = 0; }
    rings.push({ x: target.x, y: target.y, r: 6, vr: 220, life: 0.5, color: "#ffe08a" });
    banner = { text: "REVIVE P" + (target.slot + 1), life: 1.15 };
    syncLocalPlayer();
  }

  // Build the list of shots for the equipped gun, with in-run gems layered on top:
  // "double" mirrors every shot, "spread" adds two angled shots, "rapid" shortens the cooldown.
  function gunShots(g, gem) {
    var out = [], i, s;
    for (i = 0; i < g.shots.length; i++) {
      s = g.shots[i];
      if (gem === "double") {
        out.push({ dx: s.dx - 5, ang: s.ang, spd: s.spd, ph: s.ph });
        out.push({ dx: s.dx + 5, ang: s.ang, spd: s.spd, ph: s.ph });
      } else {
        out.push(s);
      }
    }
    if (gem === "spread") {
      s = g.shots[0];
      out.push({ dx: 0, ang: -0.32, spd: s.spd * 0.95, ph: 0 });
      out.push({ dx: 0, ang: 0.32, spd: s.spd * 0.95, ph: 0 });
    }
    return out;
  }
  function shootPlayer(who) {
    who = who || player;
    if (!who || !who.alive || who.fireCd > 0) return;
    if ((who.jamT || 0) > 0) return;
    var ghost = netRole === "client";
    var g = findGun(equippedGun(who));
    var gem = (who.weaponT > 0 && who.weapon !== "normal") ? who.weapon : "";
    var shots = gunShots(g, gem);
    var dmg = g.dmg * loadoutDmgMul(shipDef(who), equippedMod(who), who);
    var i, s, b, face = pvpFacing(who), y = pvpMuzzleY(who);
    if (who.boss) {
      pvpBossPrimary(who);
      return;
    }
    who.shotCount = (who.shotCount || 0) + 1;
    var bolt = g.bolt && who.shotCount % g.bolt === 0;
    var cap = pbulCap();
    if (pbul.length + shots.length + (bolt ? 1 : 0) > cap) return;
    var startIdx = pbul.length;
    var sid = skinIdOf(who);
    var umbra = sid === "eclipse-umbra" && (who.skinUmbraT || 0) > 0;
    for (i = 0; i < shots.length; i++) {
      s = shots[i];
      b = {
        id: allocId(),
        x: who.x + s.dx, y: y, vx: Math.sin(s.ang) * s.spd, vy: face * Math.cos(s.ang) * s.spd,
        dmg: dmg, r: g.r || 2, age: 0, life: g.life || 0,
        pierce: g.pierce || 0, hit: g.pierce ? [] : null,
        homing: !!g.homing, homeT: g.homeT || 0,
        hsp: g.hsp || 0, hturn: g.hturn || 0,
        splash: g.splash || null, gun: g.id, owner: who.slot, ghost: ghost
      };
      if (umbra) b.dmg *= 1.25;
      if ((who.skinBlood || 0) > 0) { b.dmg *= 2; who.skinBlood -= 1; }
      if ((who.skinCarrion || 0) > 0) { b.dmg += 1; who.skinCarrion -= 1; }
      if (sid === "needle-pinkvoid" && Math.random() < 0.12) {
        b.pierce = (b.pierce || 0) + 1;
        if (!b.hit) b.hit = [];
        b.dmg *= 1.25;
      }
      if (g.helix) {
        b.helix = true; b.bx = b.x; b.ha = g.helix.amp; b.hf = g.helix.freq; b.hp0 = s.ph || 0;
      }
      pbul.push(b);
    }
    if (bolt) {
      pbul.push({
        id: allocId(),
        x: who.x, y: y, vx: 0, vy: face * 300, dmg: (g.boltDmg || 2) * loadoutDmgMul(shipDef(who), equippedMod(who), who) * (umbra ? 1.25 : 1), r: 3, age: 0, life: 0,
        pierce: 0, hit: null, homing: true, homeT: 2.2, splash: null, gun: g.id, bolt: true, owner: who.slot, ghost: ghost
      });
    }
    applySkinVolley(who, startIdx, g);
    var cd = gunInterval(g);
    if (gem === "rapid") cd *= 0.6;
    cd /= loadoutFireMul(shipDef(who), equippedMod(who)) * (who.skinFireMul || 1);
    who.fireCd = Math.max(0.035, cd / 1000);
    who.muzzle = 1;
    sfxShoot(who);
  }

  function pvpEbul(x, y, vx, vy, who, opt) {
    opt = opt || {};
    opt.owner = who ? who.slot : -1;
    if (!opt.color && who && who.boss) {
      opt.color = enemyColor(who.boss);
      opt.glow = opt.color;
    }
    addEbul(x, y, vx, vy, opt);
  }
  function pvpAimed(who, spread, spd, extra) {
    var tgt = pvpOpponent(who);
    var dx, dy, len, mx, my;
    if (!tgt) return;
    mx = who.x;
    my = pvpMuzzleY(who);
    dx = tgt.x - mx;
    dy = tgt.y - my;
    len = Math.sqrt(dx * dx + dy * dy) || 1;
    spd = spd || 220;
    extra = extra || 0;
    pvpEbul(mx + extra, my, dx / len * spd * (spread || 0.75), dy / len * spd, who);
  }
  function pvpFanToward(who, count, spread, spd) {
    var face = pvpFacing(who), i, ang, mx = who.x, my = pvpMuzzleY(who);
    spd = spd || 200;
    for (i = 0; i < count; i++) {
      ang = -spread / 2 + (count === 1 ? 0 : i * (spread / (count - 1)));
      pvpEbul(mx, my, Math.sin(ang) * spd, face * Math.cos(ang) * spd, who);
    }
  }
  function pvpRing(who, count, spd) {
    var i, a;
    for (i = 0; i < count; i++) {
      a = (i / count) * Math.PI * 2 + time;
      pvpEbul(who.x, who.y, Math.cos(a) * spd, Math.sin(a) * spd, who);
    }
  }
  function pvpBossPrimary(who) {
    var kit = pvpApi() ? pvpApi().kitFor(who.boss) : null;
    var atk = kit ? kit.fire : "aimed";
    var col = enemyColor(who.boss);
    if (who.fireCd > 0) return;
    if (atk === "spiral" || atk === "seal") pvpRing(who, 8, 110);
    else if (atk === "fan" || atk === "flare" || atk === "sweep") pvpFanToward(who, 5, 0.9, 230);
    else if (atk === "ring") pvpRing(who, 7, 95);
    else if (atk === "tick" || atk === "shatter") {
      pvpAimed(who, 0.9, 160, -8);
      pvpAimed(who, 0.9, 160, 8);
    } else if (atk === "surge" || atk === "column") pvpFanToward(who, 4, 0.55, 210);
    else if (atk === "well" || atk === "node") {
      pvpAimed(who, 0.7, 140, 0);
      pvpEbul(who.x, pvpMuzzleY(who), 0, pvpFacing(who) * 70, who, { r: 5, life: 1.4, color: col });
    } else if (atk === "venom") {
      pvpAimed(who, 0.55, 190, -10);
      pvpAimed(who, 0.55, 190, 10);
    } else if (atk === "barrage") {
      pvpFanToward(who, 3, 0.42, 250);
      pvpAimed(who, 0.9, 260, 0);
    } else {
      pvpAimed(who, 0.85, 240, -8);
      pvpAimed(who, 0.85, 240, 0);
      pvpAimed(who, 0.85, 240, 8);
    }
    who.fireCd = (pvpApi() && pvpApi().PVP_FIRE_CD) || 2.4;
    who.muzzle = 1;
    sfxShoot(who);
  }
  function pvpBossAbility(who) {
    var kit = pvpApi() ? pvpApi().kitFor(who.boss) : null;
    var atk = kit ? kit.ability : "ram";
    var tgt = pvpOpponent(who);
    var face = pvpFacing(who);
    var i, x, col = enemyColor(who.boss);
    if (!who.boss || (who.abilityCd || 0) > 0) return;
    who.abilityCd = (pvpApi() && pvpApi().ABILITY_CD) || 4;
    if (atk === "ram" || atk === "charge" || atk === "whip") {
      who.dash = {
        t: 0, dur: 0.55,
        sx: who.x, sy: who.y,
        ex: tgt ? tgt.x : who.x,
        ey: clamp(who.y + face * 150, 28, H - 28),
        back: true
      };
      who.invuln = Math.max(who.invuln, 0.35);
    } else if (atk === "blink") {
      who.x = clamp(tgt ? tgt.x + (Math.random() < 0.5 ? -28 : 28) : who.x, 20, W - 20);
      who.targetX = who.x;
      pvpAimed(who, 0.95, 280, 0);
      explode(who.x, who.y, col, false);
    } else if (atk === "beam" || atk === "gaze") {
      x = clamp(tgt ? tgt.x : who.x, 16, W - 16);
      for (i = 0; i < 8; i++) pvpEbul(x, who.y + face * (14 + i * 18), 0, face * 260, who, { r: 3.2, color: col });
    } else if (atk === "rewind") {
      who.rewind = { x: who.x, y: who.y, t: 0.55 };
      who.invuln = Math.max(who.invuln, 0.7);
      pvpRing(who, 8, 120);
    } else if (atk === "lance2") {
      x = clamp(tgt ? tgt.x : who.x, 24, W - 24);
      for (i = 0; i < 7; i++) {
        pvpEbul(x - 18, who.y + face * (12 + i * 16), 0, face * 280, who, { r: 2.6, color: col });
        pvpEbul(x + 18, who.y + face * (12 + i * 16), 0, face * 280, who, { r: 2.6, color: col });
      }
    } else if (atk === "collapse") {
      pvpAimed(who, 1, 90, 0);
      pvpRing(who, 12, 70);
      if (tgt) {
        tgt.slowT = Math.max(tgt.slowT || 0, 1.1);
      }
    } else if (atk === "decree" || atk === "pane") {
      for (i = 0; i < 5; i++) {
        x = 28 + i * ((W - 56) / 4);
        if (tgt && Math.abs(x - tgt.x) < 18) continue;
        pvpEbul(x, who.y + face * 10, 0, face * 240, who, { r: 2.4, color: col });
      }
    } else if (atk === "stamp") {
      pvpRing(who, 10, 95);
    } else if (atk === "order" || atk === "surge") {
      x = clamp(tgt ? tgt.x : who.x, 16, W - 16);
      for (i = 0; i < 8; i++) pvpEbul(x, who.y + face * (14 + i * 18), 0, face * 260, who, { r: 3.4, color: col });
    } else if (atk === "hook") {
      pvpFanToward(who, 6, 1.05, 210);
      if (tgt) {
        tgt.x = clamp(tgt.x + (who.x - tgt.x) * 0.32, 16, W - 16);
        tgt.targetX = tgt.x;
      }
    } else {
      pvpFanToward(who, 7, 1.15, 240);
    }
    sfxTele();
  }

  // Player homing. Seeker uses gun hsp/hturn (a bit above Colossus 153/1.92).
  // Storm bolts keep the old snap (300 / 3.2) when those fields are unset.
  function steerPlayerHoming(b, dt) {
    var bestE, bestD, j, e, dd, pdx, pdy, plen, psp, turn;
    if (!b.homing || b.homeT <= 0) return;
    b.homeT -= dt;
    bestE = null;
    bestD = 1e12;
    if (isPvpRun()) {
      for (j = 0; j < players.length; j++) {
        e = players[j];
        if (!e || !e.alive || e.slot === b.owner) continue;
        dd = dist2(b.x, b.y, e.x, e.y);
        if (dd < bestD) { bestD = dd; bestE = e; }
      }
    } else {
      for (j = 0; j < enemies.length; j++) {
        e = enemies[j];
        if (!e.alive) continue;
        dd = dist2(b.x, b.y, e.x, e.y);
        if (dd < bestD) { bestD = dd; bestE = e; }
      }
    }
    if (!bestE) return;
    pdx = bestE.x - b.x;
    pdy = bestE.y - b.y;
    plen = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
    psp = b.hsp || (b.bolt ? 300 : 220);
    turn = b.hturn || 3.2;
    b.vx += (pdx / plen * psp - (b.vx || 0)) * Math.min(1, turn * dt);
    b.vy += (pdy / plen * psp - b.vy) * Math.min(1, turn * dt);
  }

  function aimedShot(e, spread, spd, opt) {
    var tgt = targetPlayer(e.x, e.y);
    if (!tgt) return;
    var dx = tgt.x - e.x;
    var dy = Math.max(30, tgt.y - e.y);
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    spd = spd || 140;
    addEbul(e.x, e.y + 8, dx / len * spd * (spread || 0.7), dy / len * spd, opt);
  }
  function fanShot(x, y, count, spread, spd, base, opt) {
    var i, ang;
    for (i = 0; i < count; i++) {
      ang = -spread / 2 + (count === 1 ? 0 : i * (spread / (count - 1)));
      addEbul(x, y, Math.sin(ang) * spd, Math.cos(ang) * spd + (base || 0), opt);
    }
  }
  function ringShot(x, y, count, spd, opt) {
    var i, a;
    for (i = 0; i < count; i++) {
      a = (i / count) * Math.PI * 2 + time;
      addEbul(x, y, Math.cos(a) * spd, Math.sin(a) * spd, opt);
    }
  }

  function startDive(e) {
    e.state = e.type === "kami" ? "kami" : "dive";
    e.t = 0;
    e.dur = e.type === "kami" ? rand(0.95, 1.35) : e.type === "tank" ? rand(1.8, 2.4) : rand(1.45, 2.15);
    if (soloEarly()) e.dur *= 0.88;
    e.sx = e.x; e.sy = e.y;
    e.cx = e.x + (Math.random() < 0.5 ? -1 : 1) * rand(30, 78);
    e.cy = e.y + rand(30, 70);
    var tgt = targetPlayer(e.x, e.y);
    e.ex = clamp((tgt ? tgt.x : W / 2) + rand(-24, 24), 16, W - 16);
    e.ey = H + 40;
    e.shotsLeft = e.type === "kami" ? 0 : ((e.type === "tank" ? 2 : (1 + ((wave > 2 || soloEarly()) && Math.random() < (soloEarly() ? 0.65 : 0.5) ? 1 : 0))) + extraPlayers());
    e.shotAt = rand(0.28, 0.5);
    sfxDive();
  }

  function updateEliteForm(e, dt) {
    var tgt;
    if ((e.jamTele || 0) > 0) {
      e.jamTele -= dt;
      if (e.jamTele <= 0) applyHexJam();
    }
    e.shotCd -= dt;
    if (e.shotCd > 0) return;
    if (e.type === "mortar") {
      tgt = targetPlayer(e.x, e.y);
      armLaneBomb(tgt ? tgt.x : W / 2, H - 40, "#ff6b3d");
      e.shotCd = 2.9 / (1 + extraPlayers() * 0.2);
    } else if (e.type === "hex") {
      e.jamTele = 0.4;
      addTele("glow", e.x, e.y, 0, 0, 0.4, "#c44dff");
      e.shotCd = 4.35;
    } else if (e.type === "bulwark") {
      bulwarkSupport(e);
      e.shotCd = 3.87;
    }
  }
  function startArchonCharge(e) {
    var tgt = targetPlayer(e.x, e.y), margin = e.r + 18;
    e.aimX = clamp((tgt ? tgt.x : W / 2) + rand(-34, 34), margin, W - margin);
    e.state = "charge";
    e.t = 0;
    e.dur = rand(0.72, 1.02);
    e.sx = e.x;
    e.sy = e.y;
    e.ex = e.aimX;
    e.ey = H - 50;
    e.cx = clamp(e.x + (e.ex - e.x) * 0.5 + rand(-74, 74), margin, W - margin);
    e.cy = e.y + rand(48, 108);
  }
  function steerArchon(e, fx, fy, dt) {
    var margin = e.r + 18, minX = margin, maxX = W - margin;
    e.archonTurn -= dt;
    if (e.archonTurn <= 0) {
      e.archonTurn = rand(0.18, 0.48);
      e.archonX = clamp(fx + rand(-46, 46), minX, maxX);
      e.archonY = clamp(fy + rand(-24, 28), 38, H * 0.52);
    }
    e.x += (e.archonX - e.x) * Math.min(1, 6 * dt);
    e.y += (e.archonY - e.y) * Math.min(1, 6 * dt);
    e.x = clamp(e.x, minX, maxX);
    e.y = clamp(e.y, 38, H - margin);
  }
  function startArchonReturn(e) {
    var margin = e.r + 18;
    e.state = "archon-return";
    e.t = 0;
    e.dur = rand(0.56, 0.82);
    e.sx = e.x;
    e.sy = e.y;
    e.cx = clamp(e.x + rand(-64, 64), margin, W - margin);
    e.cy = Math.max(42, e.y - rand(58, 118));
  }
  function updateArchon(e, dt) {
    var enraged, tgt, count, spread;
    if (e.hp <= e.maxHp * 0.5 && e.phaseIdx < 1) {
      e.phaseIdx = 1;
      banner = { text: "ARCHON ENRAGES", life: 1.05 };
    }
    if (e.tele && e.tele.atk === "charge") {
      e.tele.t -= dt;
      if (e.tele.t <= 0) {
        startArchonCharge(e);
        e.tele = null;
        e.atkCd = e.phaseIdx >= 1 ? 1.27 : 1.69;
      }
      return;
    }
    e.atkCd -= dt;
    if (e.atkCd > 0) return;
    enraged = e.phaseIdx >= 1;
    tgt = targetPlayer(e.x, e.y);
    e.aimX = tgt ? tgt.x : W / 2;
    if (Math.random() < (enraged ? 0.22 : 0.28)) {
      addTele("line", e.x, e.y, e.aimX, H - 50, 0.38, "#ff5c7a");
      e.tele = { atk: "charge", t: 0.38 };
      return;
    }
    count = enraged ? 5 : 3;
    spread = enraged ? 0.7 : 0.48;
    fanShot(e.x, e.y + 8, count, spread, 150 + wave * 2, 20, { color: "#ffd6a0", glow: "#ff5c7a" });
    if (enraged) armLaneBomb(e.aimX, H - 40, "#ff5c7a");
    e.atkCd = enraged ? 1.27 : 1.69;
  }
  function currentArchon() {
    var i;
    for (i = 0; i < enemies.length; i++) {
      if (enemies[i].alive && enemies[i].type === "archon") return enemies[i];
    }
    return null;
  }

  // ---- Boss kits -------------------------------------------------------------------------
  // Kit entries that are phase hooks (fire once on a phase change) rather than pickable attacks.
  var BOSS_HOOKS = { regrow: true, voidguard: true, core: true };
  var BOSS_MOVE_STYLES = ["patrol", "sine", "figure8", "hover", "zigzag", "orbit", "drift"];
  function bossKit(e) {
    var d = bossDef(e.type) || BOSS_DEFS[0];
    var kit = d.base.slice(), i;
    if (e.phaseIdx >= 1) for (i = 0; i < d.p2.length; i++) kit.push(d.p2[i]);
    if (e.phaseIdx >= 2 && d.p3) for (i = 0; i < d.p3.length; i++) kit.push(d.p3[i]);
    if (e.tier >= 1) for (i = 0; i < d.t1.length; i++) kit.push(d.t1[i]);
    if (e.tier >= 2) for (i = 0; i < d.t2.length; i++) kit.push(d.t2[i]);
    return kit;
  }
  function bossPool(e) {
    var kit = bossKit(e), pool = [], i;
    for (i = 0; i < kit.length; i++) {
      if (BOSS_HOOKS[kit[i]]) continue;
      pool.push(kit[i]);
      // Phase/tier moves are the interesting ones: weight them double.
      if (i >= (bossDef(e.type) || BOSS_DEFS[0]).base.length) pool.push(kit[i]);
    }
    return pool;
  }
  function kitHas(e, id) { return bossKit(e).indexOf(id) >= 0; }
  function uniqueBossPool(e) {
    var kit = bossPool(e), out = [], seen = {}, i;
    for (i = 0; i < kit.length; i++) {
      if (seen[kit[i]]) continue;
      seen[kit[i]] = true;
      out.push(kit[i]);
    }
    return out;
  }
  function rebuildBossQueue(e, avoid) {
    var pool = uniqueBossPool(e), first;
    shuffleInPlace(pool);
    if (avoid && pool.length > 1 && pool[0] === avoid) {
      first = pool.shift();
      pool.push(first);
    }
    e.atkQueue = pool;
    e.atkQIdx = 0;
  }
  function rollBossFight(e) {
    e.patrolDir = Math.random() < 0.5 ? -1 : 1;
    e.moveStyle = BOSS_MOVE_STYLES[Math.floor(Math.random() * BOSS_MOVE_STYLES.length)];
    e.moveAmp = 0.72 + Math.random() * 0.7;
    e.moveSpd = 0.78 + Math.random() * 0.55;
    e.moveFreq = 0.72 + Math.random() * 0.7;
    e.homeX = 56 + Math.random() * (W - 112);
    e.hoverT = rand(0.8, 2.2);
    e.phase = Math.random() * 6.2;
    rebuildBossQueue(e);
  }
  function pickBossAttack(e) {
    var atk;
    if (!e.atkQueue || !e.atkQueue.length) rebuildBossQueue(e, e.lastAtk);
    atk = e.atkQueue[e.atkQIdx] || uniqueBossPool(e)[0] || "aimed";
    e.atkQIdx += 1;
    if (e.atkQIdx >= e.atkQueue.length) rebuildBossQueue(e, atk);
    return atk;
  }
  function bossTeleDelay(e) {
    var d = bossDef(e.type) || BOSS_DEFS[0];
    var t = d.tele - Math.min(0.08, e.tier * 0.03) - (e.phaseIdx >= 2 ? 0.04 : 0);
    return Math.max(0.34, t);
  }
  function bossCooldown(e) {
    var d = bossDef(e.type) || BOSS_DEFS[0];
    var cd = d.cd - Math.min(0.4, e.tier * 0.12) - e.phaseIdx * 0.1;
    return Math.max(0.4, cd / (1 + extraPlayers() * 0.28));
  }
  function bossShotSpd(e) { return 115 + Math.min(45, wave * 0.9) + e.tier * 12 + extraPlayers() * 12; }
  function summonEscorts(e, type, n, offY) {
    var i, k, x;
    n = (n || 1) + extraPlayers();
    if (aliveCount() >= escortCap()) return;
    for (i = 0; i < n; i++) {
      x = n === 1 ? 0 : (i - (n - 1) / 2) * 100;
      k = makeEnemy(x, offY, type, e.type === "hydra" ? { leech: true } : {});
      k.state = "form";
      k.x = e.x + x * 0.5; k.y = e.y + 18;
      enemies.push(k);
    }
    explode(e.x - 30, e.y + 14, "#5cff8a", false);
    explode(e.x + 30, e.y + 14, "#5cff8a", false);
  }
  // Hydra escorts siphon a slice of max HP per second while alive. Tanks drain faster.
  // Rate is a fraction of maxHp so later tiers (and the HP buff) keep the same relative pressure.
  function hydraLeechRate(minion, boss) {
    var frac = minion.type === "tank" ? 0.018 : 0.012;
    return boss.maxHp * frac;
  }
  function hydraLeechTotal() {
    var n = 0, i, e;
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (e.alive && e.leech) n += e.leechHp || 0;
    }
    return n;
  }
  // Killing a siphon escort yanks back the HP it already gave. Floor at 1 so the minion
  // cannot finish the boss — the player still has to land the last hit.
  function stripLeechHeal(e) {
    var given = e.leechHp || 0;
    var boss;
    e.leechHp = 0;
    e.leech = false;
    if (given <= 0) return;
    boss = currentBoss();
    if (!boss || !boss.alive || boss.type !== "hydra") return;
    boss.hp = Math.max(1, boss.hp - given);
    boss.healFlash = 0.28;
    explode(boss.x, boss.y, "#3dffb0", false);
    checkBossPhase(boss);
  }
  function updateHydraLeech(dt) {
    var boss = currentBoss();
    var i, e, amt;
    if (!boss || boss.type !== "hydra" || !boss.alive) return;
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (!e.alive || !e.leech) continue;
      if (boss.hp < boss.maxHp) {
        amt = hydraLeechRate(e, boss) * dt;
        if (boss.hp + amt > boss.maxHp) amt = boss.maxHp - boss.hp;
        if (amt > 0) {
          boss.hp += amt;
          e.leechHp = (e.leechHp || 0) + amt;
          boss.healFlash = 0.14;
          e.healFlash = 0.14;
        }
      }
      e.leechAcc = (e.leechAcc || 0) + dt;
      if (e.leechAcc > 0.055) {
        e.leechAcc = 0;
        particles.push({
          x: e.x + rand(-4, 4), y: e.y + rand(-3, 3),
          vx: 0, vy: 0, life: 0.5, color: "#7affc4", size: rand(1.5, 2.6),
          siphon: true, tx: boss.x, ty: boss.y
        });
      }
    }
  }
  function summonKami(e, n) {
    var i, k;
    n = (n || 1) + extraPlayers();
    if (aliveCount() >= escortCap()) return;
    for (i = 0; i < n; i++) {
      k = makeEnemy((i - (n - 1) / 2) * 80, 40, "kami");
      k.x = e.x + (i - (n - 1) / 2) * 40; k.y = e.y + 10;
      enemies.push(k);
      startDive(k);
    }
  }
  function onBossPhase(e, idx) {
    var d = bossDef(e.type) || BOSS_DEFS[0];
    banner = { text: idx === 1 ? (d.p2Text || "ENRAGED") : (d.p3Text || (d.name + " FRENZY")), life: 1.3 };
    explode(e.x, e.y, d.color, true);
    rings.push({ x: e.x, y: e.y, r: 4, vr: 400, life: 0.7, color: d.color });
    ebul.length = 0;
    teles.length = 0;
    bossFx.length = 0;
    e.tele = null;
    e.followups = [];
    e.stream = null;
    e.afterReturn = "";
    e.atkCd = 0.9;
    e.hitFlash = 0.3;
    if (kitHas(e, "regrow")) { e.shieldHp = Math.max(e.shieldHp, 2 + e.tier); }
    if (kitHas(e, "voidguard") && idx === 1) summonEscorts(e, "shield", 2, 64);
    if (kitHas(e, "core") && idx === 1) summonEscorts(e, "shield", 2, 56);
    if (e.type === "myrmidon" && idx >= 2) e.throne = true;
    if (idx >= 2) sfxWave(true);
    rebuildBossQueue(e, e.lastAtk);
  }
  function checkBossPhase(e) {
    var d = bossDef(e.type) || BOSS_DEFS[0];
    var th;
    if (d.p3 && d.p3.length) th = [d.p2Thresh || 2 / 3, d.p3Thresh || 1 / 3];
    else th = e.tier >= 1 ? [Math.max(0.6, d.p2Thresh || 0.5), 0.25] : [d.p2Thresh || 0.5];
    while (e.phaseIdx < th.length && e.hp <= e.maxHp * th[e.phaseIdx]) {
      e.phaseIdx += 1;
      onBossPhase(e, e.phaseIdx);
    }
  }
  function queueFollow(e, t, atk) { e.followups.push({ t: t, atk: atk }); }

  function beginBossAttack(e, forced) {
    var atk = forced || pickBossAttack(e);
    var col = enemyColor(e.type);
    var delay = bossTeleDelay(e);
    var px, i, gx;
    e.atk = atk;
    e.lastAtk = atk;
    var aim = targetPlayer(e.x, e.y);
    e.aimX = aim ? aim.x : W / 2;
    e.aimY = aim ? aim.y : H - 34;
    if (atk === "aimed" || atk === "feathers" || atk === "homing" || atk === "torpedo" || atk === "venom" || atk === "venompool" || atk === "spitburst") {
      addTele("line", e.x, e.y + 10, e.aimX, e.aimY, delay + 0.08, atk === "homing" || atk === "torpedo" ? "#ffc14d" : "#7ef9ff");
    } else if (atk === "clones" || atk === "riftburst") {
      addTele("glow", clamp(e.x - 60, 20, W - 20), e.y, 0, 0, delay + 0.1, col);
      addTele("glow", clamp(e.x + 60, 20, W - 20), e.y, 0, 0, delay + 0.1, col);
    } else if (atk === "fan" || atk === "fan2" || atk === "flare" || atk === "barrage" || atk === "frenzy" || atk === "mines" || atk === "summon" || atk === "summontank" || atk === "depth" || atk === "escorts" || atk === "tick" || atk === "ticksplit" || atk === "singularity" || atk === "firewheel") {
      addTele("glow", e.x, e.y + (atk === "mines" || atk === "depth" ? 12 : 0), 0, 0, delay, atk === "mines" || atk === "depth" ? "#ff9a3d" : col);
    } else if (atk === "ram" || atk === "ramfan" || atk === "charge" || atk === "charge2" || atk === "lunge" || atk === "lunge2") {
      addTele("flash", e.x, e.y, e.aimX, e.aimY, delay + 0.1, atk === "lunge" || atk === "lunge2" ? "#3dffb0" : "#ff4d4d");
      addTele("line", e.x, e.y, e.aimX, e.aimY, delay + 0.1, atk === "lunge" || atk === "lunge2" ? "#3dffb0" : "#ff4d4d");
    } else if (atk === "blink" || atk === "blink2" || atk === "rewind" || atk === "riftstep") {
      addTele("flash", e.x, e.y, 0, 0, Math.max(0.26, delay - 0.12), col);
      if (atk === "riftstep") addTele("ring", e.x, e.y, 0, 0, Math.max(0.26, delay - 0.12), col);
      delay = Math.max(0.26, delay - 0.12);
    } else if (atk === "spiral" || atk === "ring" || atk === "ring2" || atk === "halo" || atk === "novaring" || atk === "whirlpool" || atk === "coil" || atk === "corering" || atk === "well" || atk === "clockhands" || atk === "crownfire") {
      addTele("ring", e.x, e.y, 0, 0, delay, col);
    } else if (atk === "sweep" || atk === "rain" || atk === "shock" || atk === "artillery" || atk === "pendulum" || atk === "surge" || atk === "whip" || atk === "riptide") {
      addTele("hline", 12, e.y + (atk === "whip" ? 33 : atk === "shock" ? 28 : 18), W - 12, e.y + (atk === "whip" ? 33 : atk === "shock" ? 28 : 18), delay + (atk === "whip" ? 0.12 : 0), col);
      if (atk === "whip") { e.sweepDir = e.aimX > W / 2 ? 1 : -1; delay += 0.12; }
      if (atk === "riptide") e.sweepDir = Math.random() < 0.5 ? 1 : -1;
    } else if (atk === "embers" || atk === "emberssplit") {
      addTele("hline", 16, 30, W - 16, 30, delay, col);
    } else if (atk === "beam") {
      addTele("vline", e.aimX, e.y + 8, e.aimX, H - 20, delay + 0.12, col);
      delay += 0.12;
    } else if (atk === "beam3") {
      px = clamp(e.aimX, 20, W - 20);
      addTele("vline", px, e.y + 8, px, H - 20, delay + 0.14, col);
      addTele("vline", clamp(px - 64, 12, W - 12), e.y + 8, clamp(px - 64, 12, W - 12), H - 20, delay + 0.14, col);
      addTele("vline", clamp(px + 64, 12, W - 12), e.y + 8, clamp(px + 64, 12, W - 12), H - 20, delay + 0.14, col);
      delay += 0.14;
    } else if (atk === "lance2") {
      px = clamp(e.aimX, 40, W - 40);
      e.aimX = px;
      addTele("vline", px - 36, e.y + 8, px - 36, H - 10, delay + 0.2, col);
      addTele("vline", px + 36, e.y + 8, px + 36, H - 10, delay + 0.2, col);
      delay += 0.2;
    } else if (atk === "meteor") {
      e.mets = pickSpreadXs(3, 78, 30);
      for (i = 0; i < e.mets.length; i++) addZone(e.mets[i], H - 42, 20, 18, delay + 0.18, col);
      delay += 0.18;
    } else if (atk === "decree" || atk === "decree2" || atk === "decree3") {
      addZone(e.aimX, H - 40, 20, 20, delay + 0.14, col);
      delay += 0.14;
    } else if (atk === "grid") {
      px = clamp(e.aimX, 44, W - 44);
      e.aimX = px;
      addTele("vline", px - 40, e.y + 8, px - 40, H - 10, delay + 0.2, col);
      addTele("vline", px + 40, e.y + 8, px + 40, H - 10, delay + 0.2, col);
      addTele("hline", 12, e.y + 60, W - 12, e.y + 60, delay + 0.2, col);
      delay += 0.2;
    } else if (atk === "orbital") {
      e.gapIdx = Math.floor(Math.random() * 5);
      for (i = 0; i < 5; i++) {
        if (i === e.gapIdx) continue;
        gx = 24 + i * 48;
        addTele("vline", gx, e.y + 8, gx, H - 10, delay + 0.26, col);
      }
      delay += 0.26;
    } else if (atk === "gaze" || atk === "gaze2") {
      gx = e.aimX > W / 2 ? 18 : W - 18;
      e.sweepDir = e.aimX > W / 2 ? 1 : -1;
      addTele("vline", gx, e.y + 8, gx, H - 10, delay + 0.16, col);
      if (atk === "gaze2") addTele("vline", W - gx, e.y + 8, W - gx, H - 10, delay + 0.16, col);
      delay += 0.16;
    } else if (atk === "constrict") {
      addTele("vline", 22, e.y + 8, 22, H - 10, delay + 0.18, col);
      addTele("vline", W - 22, e.y + 8, W - 22, H - 10, delay + 0.18, col);
      delay += 0.18;
    } else if (atk === "petrify") {
      gx = clamp(e.aimX, 16, W - 16);
      addTele("vline", gx, e.y + 8, gx, H - 10, delay + 0.2, "#ff4d9a");
      addZone(gx, e.aimY, 26, 32, delay + 0.2, "#ff4d9a");
      delay += 0.2;
    } else if (atk === "slowfield") {
      addZone(e.aimX, e.aimY - 10, 44, 34, delay + 0.16, col);
      delay += 0.16;
    } else if (atk === "gates" || atk === "gates2") {
      addZone(44, e.y + 34, 14, 10, delay + 0.16, col);
      addZone(W - 44, e.y + 34, 14, 10, delay + 0.16, col);
      if (atk === "gates2") addZone(W / 2, e.y + 34, 14, 10, delay + 0.16, col);
      delay += 0.16;
    } else if (atk === "collapse" || atk === "eclipse") {
      addTele("ring", e.aimX, e.aimY, 0, 0, delay + 0.22, col);
      addTele("flash", e.aimX, e.aimY, 0, 0, delay + 0.22, col);
      delay += 0.22;
    } else if (atk === "seal" || atk === "orbit" || atk === "wheel") {
      addTele("ring", e.x, e.y, 0, 0, delay, col);
    } else if (atk === "stamp") {
      e.stampX = clamp(e.aimX + rand(-36, 36), 28, W - 28);
      e.stampY = clamp(e.aimY - 48, 88, H - 70);
      addZone(e.stampX, e.stampY, 16, 16, delay + 0.1, col);
      delay += 0.1;
    } else if (atk === "bloom") {
      addTele("vline", e.aimX, e.y + 8, e.aimX, H - 10, delay + 0.16, col);
      delay += 0.16;
    } else if (atk === "column" || atk === "pincer" || atk === "throne") {
      addTele("hline", 12, e.y + 22, W - 12, e.y + 22, delay, col);
    } else if (atk === "order") {
      addZone(e.aimX, H - 40, 18, 22, delay + 0.14, col);
      delay += 0.14;
    } else if (atk === "sacrifice" || atk === "shatter") {
      addTele("line", e.x, e.y + 10, e.aimX, e.aimY, delay + 0.08, col);
    } else if (atk === "pane") {
      e.paneLeft = e.aimX < W / 2;
      addZone(e.paneLeft ? W * 0.25 : W * 0.75, H / 2, W * 0.25, H / 2 - 8, delay + 0.12, col);
      delay += 0.12;
    } else if (atk === "twin") {
      addTele("vline", W / 2, 8, W / 2, H - 8, delay + 0.1, col);
      delay += 0.1;
    } else if (atk === "fracture") {
      addTele("vline", 50, 8, 50, H - 8, delay + 0.12, col);
      addTele("vline", W / 2, 8, W / 2, H - 8, delay + 0.12, col);
      addTele("vline", W - 50, 8, W - 50, H - 8, delay + 0.12, col);
      delay += 0.12;
    } else if (atk === "sweep") {
      addTele("hline", 12, 72, W - 12, 72, delay + 0.1, col);
    } else if (atk === "sow") {
      e.seedXs = pickSpreadXs(3, 56, 28);
      for (i = 0; i < e.seedXs.length; i++) addZone(e.seedXs[i], 118, 10, 10, delay + 0.12, col);
      delay += 0.12;
    } else if (atk === "hook" || atk === "harvest") {
      addTele("ring", e.aimX, e.aimY, 0, 0, delay + 0.16, col);
      delay += 0.16;
    } else if (atk === "rail") {
      e.railH = Math.random() < 0.5;
      if (e.railH) {
        e.railPos = clamp(e.aimY, 90, H - 50);
        addTele("hline", 16, e.railPos, W - 16, e.railPos, delay + 0.12, col);
      } else {
        e.railPos = clamp(e.aimX, 24, W - 24);
        addTele("vline", e.railPos, 40, e.railPos, H - 20, delay + 0.12, col);
      }
      delay += 0.12;
    } else if (atk === "node") {
      addZone(28, 48, 10, 10, delay, col);
      addZone(W - 28, 48, 10, 10, delay, col);
      addZone(28, H - 48, 10, 10, delay, col);
      addZone(W - 28, H - 48, 10, 10, delay, col);
    } else if (atk === "gridlock" || atk === "blackout") {
      addTele("vline", W / 2, 20, W / 2, H - 16, delay + 0.14, col);
      addTele("hline", 12, H * 0.55, W - 12, H * 0.55, delay + 0.14, col);
      delay += 0.14;
    } else if (atk === "surge") {
      addTele("vline", clamp(e.aimX, 20, W - 20), e.y + 8, clamp(e.aimX, 20, W - 20), H - 10, delay + 0.16, col);
      delay += 0.16;
    } else {
      addTele("glow", e.x, e.y, 0, 0, delay, col);
    }
    e.tele = { t: delay, atk: atk };
  }

  // Bastion (r=13) plus Reactor (+1). Curtain gaps must clear that hull plus bullet
  // radius plus a few pixels of steering room, otherwise wide ships cannot slip through.
  var CURTAIN_SHIP_R = 14;
  var CURTAIN_PAD = 6;
  function curtainMinSpacing(bulletR) {
    return 2 * (CURTAIN_SHIP_R + (bulletR || 2.8) + CURTAIN_PAD);
  }
  function curtainCount(maxN, bulletR) {
    var minSp = curtainMinSpacing(bulletR);
    var n = maxN < 2 ? 2 : maxN;
    while (n > 3 && (W - 32) / (n - 1) < minSp) n -= 1;
    return n;
  }
  function pickSpreadXs(n, minDist, pad) {
    var xs = [], i, j, x, tries, ok;
    pad = pad || 28;
    minDist = minDist || 70;
    for (i = 0; i < n; i++) {
      ok = false;
      for (tries = 0; tries < 28; tries++) {
        x = pad + Math.random() * (W - pad * 2);
        ok = true;
        for (j = 0; j < xs.length; j++) {
          if (Math.abs(xs[j] - x) < minDist) { ok = false; break; }
        }
        if (ok) break;
      }
      xs.push(ok ? x : pad + i * Math.max(minDist, (W - pad * 2) / Math.max(1, n - 1)));
    }
    xs.sort(function (a, b) { return a - b; });
    return xs;
  }
  function fireColumn(x, y0, n, spd, opt) {
    var i;
    x = clamp(x, 8, W - 8);
    for (i = 0; i < n; i++) addEbul(x, y0 + i * 18, 0, spd, opt);
  }
  function fireRow(y, n, spd, skipA, skipB, opt) {
    var i, x;
    if (n < 2) {
      addEbul(W / 2, y, 0, spd, opt);
      return;
    }
    for (i = 0; i < n; i++) {
      if (i === skipA || i === skipB) continue;
      x = 16 + i * ((W - 32) / (n - 1));
      addEbul(x, y, 0, spd, opt);
    }
  }
  function fireCurtain(y, maxN, spd, opt) {
    fireRow(y, curtainCount(maxN, (opt && opt.r) || 2.8), spd, -1, -1, opt);
  }
  function blinkTo(e) {
    var blinkTgt = targetPlayer(e.x, e.y);
    e.x = clamp((blinkTgt ? blinkTgt.x : W / 2) + rand(-40, 40), 28, W - 28);
    e.y = rand(48, 92);
    explode(e.x, e.y, enemyColor(e.type), false);
  }
  function venomShot(e, k, pool, opt) {
    var T = 1.4, g = 160;
    var venomTgt = targetPlayer(e.x, e.y);
    var tx = (venomTgt ? venomTgt.x : W / 2) + k * 30;
    var ty = venomTgt ? venomTgt.y : H - 34;
    var dx = tx - e.x, dy = ty - e.y;
    var o = { color: opt.color, glow: opt.glow, r: pool ? 4 : 3.2, grav: g };
    if (pool) { o.pauseAt = ty + 2; o.pauseT = 2.2; }
    addEbul(e.x, e.y + 6, dx / T, dy / T - 0.5 * g * T, o);
  }
  // Frozen ring around the lock-on that hangs, then every shard lunges inward.
  function eclipseRing(e, rad, hang, spd, opt) {
    var i, a, x0, y0, n = 8;
    for (i = 0; i < n; i++) {
      a = (i / n) * Math.PI * 2 + time;
      x0 = clamp(e.aimX + Math.cos(a) * rad, 10, W - 10);
      y0 = clamp(e.aimY + Math.sin(a) * (rad * 0.7), 28, H - 18);
      addEbul(x0, y0 - 5, 0, 36, {
        color: opt.color, glow: opt.glow, r: 3.2, life: 5.5,
        pauseAt: y0, pauseT: hang, resumeSpd: spd
      });
    }
    rings.push({ x: e.aimX, y: e.aimY, r: 6, vr: rad * 3.4, life: 0.48, color: opt.glow || opt.color });
  }
  function fxHas(kind) {
    var i;
    for (i = 0; i < bossFx.length; i++) {
      if (bossFx[i].kind === kind && (bossFx[i].life == null || bossFx[i].life > 0)) return bossFx[i];
    }
    return null;
  }
  function fireGappedRing(x, y, count, spd, skip, skipN, opt) {
    var i, a;
    skip = ((skip % count) + count) % count;
    skipN = skipN || 2;
    for (i = 0; i < count; i++) {
      if ((i - skip + count) % count < skipN) continue;
      a = (i / count) * Math.PI * 2;
      addEbul(x, y, Math.cos(a) * spd, Math.sin(a) * spd, opt);
    }
  }
  function fireSpoke(x, y, ang, n, spd, opt) {
    var i, px, py;
    for (i = 1; i <= n; i++) {
      px = x + Math.cos(ang) * i * 18;
      py = y + Math.sin(ang) * i * 18;
      addEbul(px, py, Math.cos(ang) * spd, Math.sin(ang) * spd, opt);
    }
  }
  function tryHitPlayersAt(x, y, r) {
    var i, pl, pr;
    for (i = 0; i < players.length; i++) {
      pl = players[i];
      if (!pl || !pl.alive || pl.invuln > 0) continue;
      pr = pl.r || PLAYER_R;
      if (dist2(pl.x, pl.y, x, y) < (pr + r) * (pr + r)) {
        if (isPvpRun()) pvpHurt(pl, 8);
        else playerDie(pl);
      }
    }
  }
  function tryHitPlayersRect(cx, cy, hw, hh) {
    var i, pl, pr;
    for (i = 0; i < players.length; i++) {
      pl = players[i];
      if (!pl || !pl.alive || pl.invuln > 0) continue;
      pr = pl.r || PLAYER_R;
      if (Math.abs(pl.x - cx) < hw + pr && Math.abs(pl.y - cy) < hh + pr) {
        if (isPvpRun()) pvpHurt(pl, 8);
        else playerDie(pl);
      }
    }
  }
  function yankPlayers(tx, amt) {
    var i, pl;
    for (i = 0; i < players.length; i++) {
      pl = players[i];
      if (!pl || !pl.alive) continue;
      pl.x = clamp(pl.x + (tx - pl.x) * amt, 16, W - 16);
      pl.targetX = pl.x;
    }
  }
  function playerOnRail(pl, f) {
    if (!pl || !pl.alive) return false;
    if (f.axis === "h") return Math.abs(pl.y - f.pos) < 12 && pl.x >= f.a - 8 && pl.x <= f.b + 8;
    return Math.abs(pl.x - f.pos) < 12 && pl.y >= f.a - 8 && pl.y <= f.b + 8;
  }
  function sparkRail(f, col) {
    if (f.axis === "h") addEbul(f.a + 8, f.pos, 160, 0, { color: col, glow: col, r: 3.2, life: 2.2 });
    else addEbul(f.pos, f.a + 8, 0, 160, { color: col, glow: col, r: 3.2, life: 2.2 });
  }
  function myrmidonGrunts() {
    var out = [], i, e;
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (e.alive && !e.isBoss && e.type === "grunt") out.push(e);
    }
    return out;
  }
  function seedEbulList() {
    var out = [], i, b;
    for (i = 0; i < ebul.length; i++) {
      b = ebul[i];
      if (b.seed && b.paused) out.push(b);
    }
    return out;
  }
  function plantSeed(x, y, col, sprout) {
    addEbul(x, y - 4, 0, 28, {
      color: col, glow: col, r: 5.2, seed: true, life: sprout ? sprout + 4 : 7.5,
      pauseAt: y, pauseT: sprout ? sprout + 4 : 6.5
    });
  }
  function addRailFx(axis, pos, a, b, life, col, lit) {
    var f = {
      kind: "rail", axis: axis, pos: pos, a: a, b: b, life: life || 2.6,
      lit: lit !== false, sparkCd: 0.35, color: col, sit: false
    };
    bossFx.push(f);
    if (lit !== false) {
      if (axis === "h") addTele("hline", a, pos, b, pos, f.life, col);
      else addTele("vline", pos, a, pos, b, f.life, col);
    }
    return f;
  }
  function applyBossHazardsToPbul(b, i) {
    var pane = fxHas("pane"), catcher = fxHas("catch"), ei, eb, boss;
    if (pane && Math.abs(b.x - pane.x) < pane.hw) {
      addEbul(b.x, b.y, pane.left ? -95 : 95, 18, { color: "#c8f0ff", glow: "#a8f0ff", r: 1.8, silent: true, life: 1.6, noTwin: true });
      addEbul(b.x, b.y, pane.left ? -46 : 46, 72, { color: "#e8ffff", glow: "#a8f0ff", r: 1.6, silent: true, life: 1.4, noTwin: true });
      pbul.splice(i, 1);
      return true;
    }
    if (catcher && !catcher.fired) {
      boss = currentBoss();
      if (boss && dist2(b.x, b.y, boss.x, boss.y) < 52 * 52) {
        catcher.shots.push({ x: boss.x, y: boss.y + 10, vx: rand(-48, 48), vy: 128 });
        if (catcher.shots.length > 6) catcher.shots.shift();
        pbul.splice(i, 1);
        return true;
      }
    }
    for (ei = ebul.length - 1; ei >= 0; ei--) {
      eb = ebul[ei];
      if (!eb.seed) continue;
      if (dist2(b.x, b.y, eb.x, eb.y) < ((eb.r || 5) + 3) * ((eb.r || 5) + 3)) {
        explode(eb.x, eb.y, eb.glow || "#c8c4bc", false);
        ebul.splice(ei, 1);
        pbul.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  function updateBossFx(dt) {
    var i, f, pi, pl, moving, j, b, ang, col, nx, litHit;
    for (i = bossFx.length - 1; i >= 0; i--) {
      f = bossFx[i];
      f.life -= dt;
      col = f.color || "#f0a070";
      if (f.kind === "glyph") {
        if (f.life <= 0) {
          ringShot(f.x, f.y, 8, 108, { color: col, glow: col, r: 3 });
          explode(f.x, f.y, col, false);
          bossFx.splice(i, 1);
        }
      } else if (f.kind === "pane") {
        if (f.life <= 0) bossFx.splice(i, 1);
      } else if (f.kind === "twin") {
        if (f.life <= 0) bossFx.splice(i, 1);
      } else if (f.kind === "catch") {
        f.hold -= dt;
        if (f.hold <= 0 && !f.fired) {
          f.fired = true;
          for (j = 0; j < (f.shots || []).length; j++) {
            b = f.shots[j];
            addEbul(b.x, b.y, b.vx, b.vy, { color: "#a8f0ff", glow: "#7ef9ff", r: 2.8, silent: j > 0 });
          }
        }
        if (f.life <= 0) bossFx.splice(i, 1);
      } else if (f.kind === "fracture") {
        f.x += f.vx * dt;
        if (f.x < 22 || f.x > W - 22) f.vx *= -1;
        f.x = clamp(f.x, 22, W - 22);
        for (pi = 0; pi < players.length; pi++) {
          pl = players[pi];
          if (!pl || !pl.alive) continue;
          moving = !!(pl.input && (pl.input.left || pl.input.right));
          if (Math.abs(pl.x - f.x) < 10) {
            if (!moving && pl.invuln <= 0) {
              if (isPvpRun()) pvpHurt(pl, 8);
              else playerDie(pl);
            } else if (!f.crossed) {
              f.crossed = true;
              for (j = 0; j < ebul.length; j++) {
                b = ebul[j];
                if (Math.abs(b.x - f.x) < 36) {
                  ang = Math.atan2(pl.y - b.y, pl.x - b.x);
                  b.vx = Math.cos(ang) * 140;
                  b.vy = Math.sin(ang) * 140;
                }
              }
            }
          } else {
            f.crossed = false;
          }
        }
        if (f.life <= 0) bossFx.splice(i, 1);
      } else if (f.kind === "rail") {
        if (f.lit) {
          f.sparkCd -= dt;
          for (pi = 0; pi < players.length; pi++) {
            pl = players[pi];
            if (playerOnRail(pl, f)) {
              if (f.sparkCd <= 0) {
                sparkRail(f, col);
                f.sparkCd = 0.55;
              }
            }
          }
        }
        if (f.kind === "rail" && f.relight && f.life < f.relight && !f.didLight) {
          f.didLight = true;
          f.lit = true;
          addTele(f.axis === "h" ? "hline" : "vline", f.axis === "h" ? f.a : f.pos, f.axis === "h" ? f.pos : f.a, f.axis === "h" ? f.b : f.pos, f.axis === "h" ? f.pos : f.b, 1.2, col);
          litHit = false;
          for (pi = 0; pi < players.length; pi++) {
            pl = players[pi];
            if (playerOnRail(pl, f) && pl.invuln <= 0) {
              litHit = true;
              if (isPvpRun()) pvpHurt(pl, 8);
              else playerDie(pl);
            }
          }
          if (litHit) banner = { text: "SHOCK", life: 0.55 };
        }
        if (f.life <= 0) bossFx.splice(i, 1);
      } else if (f.life <= 0) {
        bossFx.splice(i, 1);
      }
    }
  }

  function fireBossAttack(e, atk) {
    var i, spd, opt, px, x0, base, fuse, k, a, ox, oy, aim, drones, f, nx;
    var col = enemyColor(e.type);
    opt = { color: col, glow: col };
    spd = bossShotSpd(e);
    if (atk === "aimed") {
      aimedShot(e, 0.85, spd + 20, opt);
      aimedShot({ x: e.x - 8, y: e.y }, 0.85, spd, opt);
      aimedShot({ x: e.x + 8, y: e.y }, 0.85, spd, opt);
    } else if (atk === "fan") {
      fanShot(e.x, e.y + 10, 5 + (e.tier > 0 ? 2 : 0), 1.15, spd, 40, opt);
    } else if (atk === "fan2") {
      fanShot(e.x, e.y + 10, 5, 1.15, spd, 40, opt);
      queueFollow(e, 0.28, "fanoff");
    } else if (atk === "fanoff") {
      fanShot(e.x, e.y + 10, 4, 0.86, spd, 40, opt);
    } else if (atk === "fan9b") {
      fanShot(e.x, e.y + 10, 8, 1.5, spd + 10, 30, opt);
    } else if (atk === "ram" || atk === "ramfan") {
      startDive(e);
      e.state = "dive";
      if (atk === "ramfan") e.afterReturn = "fan";
    } else if (atk === "halo") {
      ringShot(e.x, e.y, 8 + e.tier, 52, { color: col, glow: col, r: 3.2 });
    } else if (atk === "feathers") {
      aimedShot({ x: e.x - 10, y: e.y }, 0.6, spd + 30, opt);
      aimedShot({ x: e.x + 10, y: e.y }, 0.6, spd + 30, opt);
      queueFollow(e, 0.2, "feather");
      queueFollow(e, 0.4, "feather");
    } else if (atk === "feather") {
      aimedShot({ x: e.x - 10, y: e.y }, 0.6, spd + 30, opt);
      aimedShot({ x: e.x + 10, y: e.y }, 0.6, spd + 30, opt);
    } else if (atk === "spiral") {
      ringShot(e.x, e.y, 10 + e.tier * 2, 90 + e.tier * 12, opt);
    } else if (atk === "mines") {
      fuse = e.phaseIdx >= 1 ? 1.3 : 1.7;
      for (i = -1; i <= 1; i++) addEbul(e.x + i * 18, e.y + 12, i * 12, 28, { mine: true, fuse: fuse, r: 4.5, color: "#ffb060", glow: "#ff9a3d" });
    } else if (atk === "sweep") {
      fireCurtain(e.y + 16, 5, spd * 0.85, opt);
    } else if (atk === "sweepgap") {
      fireCurtain(e.y + 16, 4, spd * 0.85, opt);
      queueFollow(e, 0.42, "sweepodd");
    } else if (atk === "sweepodd") {
      fireCurtain(e.y + 16, 4, spd * 0.85, opt);
    } else if (atk === "riftburst") {
      x0 = 36;
      explode(x0, e.y + 6, col, false);
      fanShot(x0, e.y + 8, 3, 0.62, spd, 18, opt);
      x0 = W - 36;
      explode(x0, e.y + 6, col, false);
      fanShot(x0, e.y + 8, 3, 0.62, spd, 18, opt);
      queueFollow(e, 0.38, "aimed");
    } else if (atk === "blink" || atk === "blink2") {
      blinkTo(e);
      aimedShot(e, 0.9, spd + 10, opt);
      if (atk === "blink2") queueFollow(e, 0.45, "blink");
    } else if (atk === "clones") {
      x0 = clamp(e.x - 60, 20, W - 20);
      explode(x0, e.y, col, false);
      aimedShot({ x: x0, y: e.y }, 0.9, spd, opt);
      aimedShot({ x: x0 - 6, y: e.y + 4 }, 0.9, spd - 20, opt);
      x0 = clamp(e.x + 60, 20, W - 20);
      explode(x0, e.y, col, false);
      aimedShot({ x: x0, y: e.y }, 0.9, spd, opt);
      aimedShot({ x: x0 + 6, y: e.y + 4 }, 0.9, spd - 20, opt);
    } else if (atk === "beam") {
      px = clamp(e.aimX, 20, W - 20);
      fireColumn(px, e.y + 14, 8, spd + 40, { r: 3, color: "#b8ffe0", glow: col });
    } else if (atk === "beam3") {
      px = clamp(e.aimX, 20, W - 20);
      fireColumn(px, e.y + 14, 6, spd + 40, { r: 3, color: "#b8ffe0", glow: col });
      fireColumn(clamp(px - 64, 12, W - 12), e.y + 14, 6, spd + 40, { r: 3, color: "#b8ffe0", glow: col });
      fireColumn(clamp(px + 64, 12, W - 12), e.y + 14, 6, spd + 40, { r: 3, color: "#b8ffe0", glow: col });
    } else if (atk === "rain") {
      fireCurtain(58, 5, 96, opt);
    } else if (atk === "summon") {
      summonEscorts(e, "grunt", 2, 70);
    } else if (atk === "summontank") {
      summonEscorts(e, "tank", 2, 70);
    } else if (atk === "ring") {
      ringShot(e.x, e.y, 12 + e.tier * 2, 100, opt);
    } else if (atk === "ring2") {
      ringShot(e.x, e.y, 10, 100, opt);
      queueFollow(e, 0.3, "ringslow");
    } else if (atk === "ringslow") {
      ringShot(e.x, e.y, 10, 68, { color: col, glow: col, r: 3 });
    } else if (atk === "charge" || atk === "charge2") {
      e.state = "charge";
      e.t = 0; e.dur = 0.95;
      e.sx = e.x; e.sy = e.y;
      e.ex = e.aimX != null ? e.aimX : ((targetPlayer(e.x, e.y) || player || {}).x || W / 2); e.ey = H - 50;
      if (atk === "charge2") e.afterReturn = "charge";
    } else if (atk === "lunge" || atk === "lunge2") {
      e.state = "lunge";
      e.t = 0; e.dur = 0.68;
      e.sx = e.x; e.sy = e.y;
      e.ex = clamp(e.aimX != null ? e.aimX : ((targetPlayer(e.x, e.y) || player || {}).x || W / 2), 28, W - 28);
      e.ey = H - 78;
      e.cx = (e.sx + e.ex) * 0.5 + (e.ex >= e.sx ? 38 : -38);
      e.cy = (e.sy + e.ey) * 0.5 - 8;
      if (atk === "lunge2") e.afterReturn = "lunge";
    } else if (atk === "homing") {
      addEbul(e.x - 10, e.y + 8, -18, 80, { homing: true, homeT: 2.05, hsp: 153, hturn: 1.92, r: 3.2, color: "#ffe0a0", glow: "#ffc14d" });
      addEbul(e.x + 10, e.y + 8, 18, 80, { homing: true, homeT: 2.05, hsp: 153, hturn: 1.92, r: 3.2, color: "#ffe0a0", glow: "#ffc14d" });
    } else if (atk === "shock") {
      fireCurtain(e.y + 24, 5, 70, { r: 2.8, color: "#ffe08a", glow: col });
    } else if (atk === "meteor") {
      if (!e.mets || !e.mets.length) e.mets = pickSpreadXs(3, 78, 30);
      for (i = 0; i < e.mets.length; i++) {
        addEbul(e.mets[i], e.y + 18, 0, 58, { mine: true, fuse: 1.15, r: 5, pellets: 5, pelletSpd: 96, color: "#ffe08a", glow: col });
      }
    } else if (atk === "shockgap") {
      fireCurtain(e.y + 24, 5, 78, { r: 2.8, color: "#ffe08a", glow: col });
    } else if (atk === "shockgap2") {
      fireCurtain(e.y + 24, 5, 78, { r: 2.8, color: "#ffe08a", glow: col });
    } else if (atk === "artillery") {
      for (i = 0; i < 4; i++) addEbul(40 + i * 53, e.y + 20, 0, 60, { mine: true, fuse: 0.9 + i * 0.25, r: 4.5, pellets: 6, pelletSpd: 105, color: "#ffe08a", glow: col });
    } else if (atk === "tick" || atk === "ticksplit") {
      fanShot(e.x, e.y + 10, atk === "ticksplit" ? 3 : 5, 1.4, 150, 30, { color: col, glow: col, r: 3, pauseAt: 170, pauseT: 0.7, resumeSpd: spd + 30, splitOnResume: atk === "ticksplit" });
    } else if (atk === "pendulum" || atk === "pendulum2") {
      fireRow(e.y + 20, curtainCount(4, 2.8), 85, -1, -1, { color: col, glow: col, sway: 28, swayF: 2.4, swayPh: 0 });
      if (atk === "pendulum2") queueFollow(e, 0.35, "pendulumB");
    } else if (atk === "pendulumB") {
      fireRow(e.y + 20, curtainCount(4, 2.8), 85, -1, -1, { color: col, glow: col, sway: 28, swayF: 2.4, swayPh: Math.PI });
    } else if (atk === "clockhands") {
      e.stream = { n: 14, dt: 0.1, acc: 0, kind: "hands", ang: rand(-0.55, 0.15), dAng: (Math.random() < 0.5 ? 1 : -1) * 0.16, spd: spd + 18 };
    } else if (atk === "rewind") {
      explode(e.x, e.y, col, false);
      e.x = W / 2; e.y = 72;
      explode(e.x, e.y, col, false);
      ringShot(e.x, e.y, 8 + e.tier, 95, opt);
    } else if (atk === "slowfield") {
      var si, sp;
      for (si = 0; si < players.length; si++) {
        sp = players[si];
        if (sp && sp.alive && Math.abs(sp.x - e.aimX) < 50 && Math.abs(sp.y - (e.aimY - 10)) < 40) {
          sp.slowT = 3;
          banner = { text: "SLOWED", life: 0.7 };
        }
      }
      aimedShot(e, 0.7, spd + 10, opt);
      aimedShot({ x: e.x - 12, y: e.y }, 0.7, spd, opt);
    } else if (atk === "surge" || atk === "surge2") {
      fireRow(e.y + 24, curtainCount(5, 2.8), 90, -1, -1, { color: col, glow: col, sway: 18, swayF: 3.2, swayPh: 0 });
      if (atk === "surge2") queueFollow(e, 0.32, "surgeB");
    } else if (atk === "surgeB") {
      fireRow(e.y + 24, curtainCount(5, 2.8), 90, -1, -1, { color: col, glow: col, sway: 18, swayF: 3.2, swayPh: Math.PI });
    } else if (atk === "riptide") {
      for (i = 0; i < 4; i++) {
        addEbul(e.sweepDir > 0 ? 8 : W - 8, 52 + i * 36, (e.sweepDir > 0 ? 1 : -1) * (78 + i * 8), 62 + i * 10, { color: col, glow: col, sway: 16, swayF: 2.6, swayPh: i * 0.9 });
      }
      queueFollow(e, 0.42, "riptideB");
    } else if (atk === "riptideB") {
      k = e.sweepDir > 0 ? -1 : 1;
      for (i = 0; i < 4; i++) {
        addEbul(k > 0 ? 8 : W - 8, 64 + i * 36, k * (78 + i * 8), 62 + i * 10, { color: col, glow: col, sway: 16, swayF: 2.6, swayPh: i * 0.9 + 1.2 });
      }
    } else if (atk === "depth") {
      for (i = -1; i <= 1; i++) addEbul(e.x + i * 34, e.y + 14, i * 6, 30, { mine: true, fuse: 2.2, pellets: 8, pelletSpd: 120, r: 5, color: "#a0c8ff", glow: col });
    } else if (atk === "whip") {
      e.state = "whip";
      e.t = 0; e.dur = 0.85;
      e.sx = e.x; e.sy = e.y;
      e.ex = e.sweepDir > 0 ? W - 30 : 30;
      e.whipCd = 0;
    } else if (atk === "whirlpool") {
      e.stream = { n: 14, dt: 0.07, acc: 0, kind: "spiral", ang: Math.random() * 6.28, dAng: 0.5, spd: 120 };
    } else if (atk === "torpedo") {
      addEbul(e.x - 12, e.y + 8, -30, 70, { homing: true, homeT: 2.6, hsp: 125, hturn: 1.5, r: 3.6, color: "#c8e0ff", glow: col });
      addEbul(e.x + 12, e.y + 8, 30, 70, { homing: true, homeT: 2.6, hsp: 125, hturn: 1.5, r: 3.6, color: "#c8e0ff", glow: col });
    } else if (atk === "flare") {
      fanShot(e.x, e.y + 10, 7, 1.3, spd + 60, 30, opt);
    } else if (atk === "embers" || atk === "emberssplit") {
      for (i = 0; i < 8; i++) addEbul(rand(14, W - 14), 30 + rand(-6, 6), rand(-8, 8), 45 + rand(0, 25), { color: "#ffb060", glow: col, r: 2.8, life: 6, splitAt: atk === "emberssplit" ? 190 : 0 });
    } else if (atk === "lance2") {
      px = e.aimX;
      fireColumn(px - 36, e.y + 14, 7, spd + 40, { r: 3, color: "#ffd0a0", glow: col });
      fireColumn(px + 36, e.y + 14, 7, spd + 40, { r: 3, color: "#ffd0a0", glow: col });
    } else if (atk === "novaring") {
      ringShot(e.x, e.y, 12, 90, opt);
      ringShot(e.x, e.y, 12, 140, { color: "#ffd0a0", glow: col, r: 2.6 });
    } else if (atk === "firewheel") {
      ringShot(e.x, e.y, 7, 96, opt);
      queueFollow(e, 0.3, "firewheel2");
    } else if (atk === "firewheel2") {
      ringShot(e.x, e.y, 7, 128, { color: "#ffd0a0", glow: col, r: 2.6 });
    } else if (atk === "lancesweep") {
      e.stream = { n: 5, dt: 0.16, acc: 0, kind: "col", x: e.sweepDir > 0 ? 24 : W - 24, dx: 48 * e.sweepDir, spd: spd + 40, count: 5 };
    } else if (atk === "well") {
      for (i = 0; i < 4; i++) {
        a = -0.9 + i * 0.6;
        addEbul(e.x, e.y + 8, Math.sin(a) * 40, Math.cos(a) * 40, { homing: true, homeT: 3.5, hsp: 60, hturn: 0.9, accel: 0.25, r: 3.5, life: 6.5, color: "#e0c8ff", glow: col });
      }
    } else if (atk === "gates" || atk === "gates2") {
      for (i = 0; i < 4; i++) {
        a = 0.35 + i * 0.2;
        addEbul(44, e.y + 34, Math.sin(a) * spd, Math.cos(a) * spd, opt);
        addEbul(W - 44, e.y + 34, -Math.sin(a) * spd, Math.cos(a) * spd, opt);
      }
      if (atk === "gates2") fanShot(W / 2, e.y + 34, 3, 0.7, spd, 0, opt);
    } else if (atk === "collapse") {
      for (i = 0; i < 10; i++) {
        a = (i / 10) * Math.PI * 2 + 0.3;
        x0 = clamp(e.aimX + Math.cos(a) * 118, -14, W + 14);
        base = clamp(e.aimY + Math.sin(a) * 118, -18, H + 12);
        k = Math.atan2(e.aimY - base, e.aimX - x0);
        addEbul(x0, base, Math.cos(k) * 120, Math.sin(k) * 120, { color: "#e0c8ff", glow: col, r: 2.8, life: 4 });
      }
    } else if (atk === "singularity") {
      addEbul(e.x, e.y + 10, 0, 50, { mine: true, fuse: 2.6, pellets: 10, pelletSpd: 120, homing: true, homeT: 2.4, hsp: 70, hturn: 0.8, r: 5.5, color: "#c8a0ff", glow: col });
    } else if (atk === "eclipse") {
      eclipseRing(e, 92, 0.62, 148, opt);
      queueFollow(e, 0.58, "eclipse2");
    } else if (atk === "eclipse2") {
      aim = targetPlayer(e.x, e.y);
      e.aimX = aim ? aim.x : W / 2;
      e.aimY = aim ? aim.y : H - 34;
      eclipseRing(e, 58, 0.48, 168, { color: "#e0c8ff", glow: col });
    } else if (atk === "riftstep") {
      ox = e.x;
      oy = e.y;
      explode(ox, oy, col, true);
      rings.push({ x: ox, y: oy, r: 5, vr: 260, life: 0.55, color: col });
      for (i = 0; i < 8; i++) {
        a = (i / 8) * Math.PI * 2;
        x0 = clamp(ox + Math.cos(a) * 72, -12, W + 12);
        base = clamp(oy + Math.sin(a) * 72, -12, H + 10);
        k = Math.atan2(oy - base, ox - x0);
        addEbul(x0, base, Math.cos(k) * 105, Math.sin(k) * 105, { color: "#c8a0ff", glow: col, r: 2.6, life: 3.6 });
      }
      blinkTo(e);
      for (i = 0; i < 4; i++) {
        a = -0.9 + i * 0.6;
        addEbul(e.x, e.y + 8, Math.sin(a) * 40, Math.cos(a) * 40, { homing: true, homeT: 3.2, hsp: 58, hturn: 0.85, accel: 0.22, r: 3.5, life: 6, color: "#e0c8ff", glow: col });
      }
    } else if (atk === "venom") {
      for (i = -1; i <= 1; i++) venomShot(e, i, false, opt);
    } else if (atk === "venompool") {
      for (i = -1; i <= 1; i++) venomShot(e, i, true, opt);
    } else if (atk === "spitburst") {
      for (i = -1; i <= 1; i++) venomShot(e, i, false, opt);
      queueFollow(e, 0.3, "venom");
      queueFollow(e, 0.6, "venom");
    } else if (atk === "gaze" || atk === "gaze2") {
      x0 = e.sweepDir > 0 ? 18 : W - 18;
      e.stream = { n: atk === "gaze2" ? 4 : 6, dt: 0.14, acc: 0, kind: atk === "gaze2" ? "col2" : "col", x: x0, dx: 44 * e.sweepDir, spd: spd + 30, count: 4 };
    } else if (atk === "coil") {
      e.state = "coil";
      e.t = 0; e.dur = 1.8;
      e.sx = e.x; e.sy = e.y;
      e.coilCd = 0.1;
    } else if (atk === "constrict") {
      e.stream = { n: 5, dt: 0.15, acc: 0, kind: "squeeze", x: 22, x2: W - 22, dx: 16, spd: spd + 24, count: 3 };
    } else if (atk === "petrify") {
      e.stream = { n: 6, dt: 0.15, acc: 0, kind: "trackcol", x: clamp(e.aimX, 16, W - 16), spd: spd + 26, count: 4 };
    } else if (atk === "barrage") {
      fanShot(e.x, e.y + 10, 5, 1.1, spd, 40, opt);
      aimedShot({ x: e.x - 14, y: e.y }, 0.8, spd + 30, opt);
      aimedShot({ x: e.x + 14, y: e.y }, 0.8, spd + 30, opt);
    } else if (atk === "grid") {
      px = e.aimX;
      fireColumn(px - 48, e.y + 14, 6, spd + 30, { r: 3, color: "#fff0c0", glow: col });
      fireColumn(px + 48, e.y + 14, 6, spd + 30, { r: 3, color: "#fff0c0", glow: col });
      fireCurtain(e.y + 60, 5, 70, { r: 2.8, color: "#fff0c0", glow: col });
    } else if (atk === "decree") {
      armLaneBomb(e.aimX, H - 40, col);
      queueFollow(e, 0.4, "decree2");
    } else if (atk === "decree2") {
      px = e.aimX >= W / 2 ? clamp(e.aimX - 86, 28, W - 28) : clamp(e.aimX + 86, 28, W - 28);
      e.aimX = px;
      armLaneBomb(px, H - 40, col);
      queueFollow(e, 0.4, "decree3");
    } else if (atk === "decree3") {
      px = e.aimX >= W / 2 ? clamp(e.aimX - 86, 28, W - 28) : clamp(e.aimX + 86, 28, W - 28);
      armLaneBomb(px, H - 40, col);
    } else if (atk === "escorts") {
      summonKami(e, 2 + (e.tier > 0 ? 1 : 0));
    } else if (atk === "corering") {
      ringShot(e.x, e.y, 14, 105, opt);
      addEbul(e.x - 10, e.y + 8, -18, 80, { homing: true, homeT: 2.15, hsp: 102, hturn: 1.28, r: 3.2, color: "#ffe0a0", glow: col });
      addEbul(e.x + 10, e.y + 8, 18, 80, { homing: true, homeT: 2.15, hsp: 102, hturn: 1.28, r: 3.2, color: "#ffe0a0", glow: col });
    } else if (atk === "crownfire") {
      e.stream = { n: 10, dt: 0.11, acc: 0, kind: "crown", ang: Math.random() * 6.28, dAng: (Math.random() < 0.5 ? 1 : -1) * 0.48, spd: spd };
    } else if (atk === "orbital") {
      for (i = 0; i < 4; i++) {
        if (i === (e.gapIdx || 0) % 4) continue;
        fireColumn(32 + i * 58, e.y + 14, 6, spd + 50, { r: 3, color: "#fff0c0", glow: col });
      }
    } else if (atk === "frenzy") {
      fanShot(e.x, e.y + 10, 9, 1.5, spd + 10, 30, opt);
      queueFollow(e, 0.3, "fan9b");
      queueFollow(e, 0.6, "aimed");
    } else if (atk === "seal") {
      fireGappedRing(e.x, e.y, 12, 92, Math.floor(Math.random() * 12), 2, opt);
      e.stream = { n: 6, dt: 0.16, acc: 0, kind: "petal", ang: Math.random() * 6.28, dAng: 0.42, spd: 88, count: 12, skipN: 2 };
    } else if (atk === "stamp") {
      bossFx.push({ kind: "glyph", x: e.stampX || e.aimX, y: e.stampY || e.aimY - 40, life: 0.72, color: col });
      addZone(e.stampX || e.aimX, e.stampY || e.aimY - 40, 14, 14, 0.7, col);
    } else if (atk === "orbit") {
      fireGappedRing(e.x, e.y, 12, 78, 0, 2, opt);
      fireGappedRing(e.x, e.y, 10, 118, 5, 2, { color: "#ffd0b0", glow: col, r: 2.6 });
      e.stream = { n: 5, dt: 0.22, acc: 0, kind: "orbit", ang: 0.4, dAng: 0.55, spd: 78 };
    } else if (atk === "bloom") {
      ringShot(e.x, e.y, 8, 54, { color: col, glow: col, r: 2.6 });
      queueFollow(e, 0.42, "bloomshut");
    } else if (atk === "bloomshut") {
      fireColumn(e.aimX, e.y + 12, 8, spd + 36, { r: 3.2, color: "#ffd0b0", glow: col });
      fanShot(e.x, e.y + 8, 4, 0.7, spd + 10, 20, opt);
    } else if (atk === "wheel") {
      e.stream = { n: 8, dt: 0.14, acc: 0, kind: "spoke", ang: Math.random() * 6.28, dAng: Math.PI / 2, spd: spd, gap: Math.random() * 6.28 };
    } else if (atk === "column") {
      e.colX = 40 + Math.floor(Math.random() * 3) * 80;
      fireColumn(e.colX, e.y + 12, 6, 78, { r: 2.8, color: "#ffe08a", glow: col });
      if (aliveCount() < escortCap()) {
        summonEscorts(e, "grunt", 2, 64);
      }
    } else if (atk === "order") {
      px = clamp(e.aimX, 24, W - 24);
      fireColumn(px, e.y + 12, 7, spd + 20, { r: 3, color: "#ffe08a", glow: col });
      var drones = myrmidonGrunts();
      for (i = 0; i < drones.length; i++) {
        if (Math.abs(drones[i].x - px) < 48 && drones[i].state === "form") startDive(drones[i]);
      }
    } else if (atk === "sacrifice") {
      drones = myrmidonGrunts();
      if (drones.length) {
        killEnemy(drones[0], false, 99);
        explode(e.x, e.y, col, false);
      }
      aimedShot(e, 0.95, spd + 70, { color: "#fff0c0", glow: col, r: 4.6 });
      aimedShot({ x: e.x - 6, y: e.y }, 0.95, spd + 50, { color: "#ffe08a", glow: col, r: 3.4 });
    } else if (atk === "pincer") {
      e.stream = { n: 5, dt: 0.15, acc: 0, kind: "squeeze", x: 22, x2: W - 22, dx: 16, spd: spd + 18, count: 3 };
    } else if (atk === "throne") {
      fireColumn(W * 0.28, e.y + 10, 5, 86, { r: 2.8, color: "#ffe08a", glow: col });
      fireColumn(W * 0.72, e.y + 10, 5, 86, { r: 2.8, color: "#ffe08a", glow: col });
      for (i = -1; i <= 1; i++) {
        a = 0.55 + i * 0.28;
        addEbul(e.x, e.y + 8, Math.sin(a) * 70 + i * 28, 40, { color: col, glow: col, r: 3.4, grav: 150, life: 5 });
      }
    } else if (atk === "shatter") {
      aimedShot(e, 0.8, spd + 8, { color: col, glow: col, r: 3.6, splitT: 0.38 });
      aimedShot({ x: e.x - 10, y: e.y }, 0.7, spd, { color: col, glow: col, r: 3.2, splitT: 0.46 });
    } else if (atk === "pane") {
      bossFx.push({
        kind: "pane", life: 2.4, color: col,
        left: e.paneLeft !== false,
        x: (e.paneLeft !== false) ? W * 0.25 : W * 0.75,
        hw: W * 0.25
      });
      addZone((e.paneLeft !== false) ? W * 0.25 : W * 0.75, H / 2, W * 0.25, H / 2 - 10, 2.35, col);
    } else if (atk === "twin") {
      bossFx.push({ kind: "twin", life: 2.8, color: col });
      addTele("vline", W / 2, 8, W / 2, H - 8, 2.7, col);
      fanShot(e.x, e.y + 8, 4, 0.9, spd, 24, opt);
    } else if (atk === "catch") {
      bossFx.push({ kind: "catch", life: 1.6, hold: 0.85, shots: [], color: col, x: e.x, y: e.y });
      addTele("glow", e.x, e.y, 0, 0, 0.85, col);
    } else if (atk === "fracture") {
      for (i = 0; i < 3; i++) {
        bossFx.push({
          kind: "fracture", x: 46 + i * 74, vx: (i === 1 ? -1 : 1) * (38 + i * 6),
          life: 3.2, color: col, crossed: false
        });
        addTele("vline", 46 + i * 74, 8, 46 + i * 74, H - 8, 1.1, col);
      }
    } else if (atk === "sweep") {
      e.stream = { n: 7, dt: 0.07, acc: 0, kind: "scythe", x: 16, dx: 34, y: 68, spd: spd + 8 };
    } else if (atk === "sow") {
      if (!e.seedXs || !e.seedXs.length) e.seedXs = pickSpreadXs(3, 56, 28);
      for (i = 0; i < e.seedXs.length; i++) plantSeed(e.seedXs[i], 118 + i * 8, col, 1.25);
      queueFollow(e, 1.35, "sowcut");
    } else if (atk === "sowcut") {
      drones = seedEbulList();
      for (i = 0; i < drones.length; i++) fireColumn(drones[i].x, drones[i].y, 5, 62, { r: 2.6, color: "#d8d0c4", glow: col });
    } else if (atk === "reap") {
      drones = seedEbulList();
      if (!drones.length && e.seedXs) {
        for (i = 0; i < e.seedXs.length; i++) fireColumn(e.seedXs[i], 20, 10, spd + 20, { r: 3, color: "#d8d0c4", glow: col });
      } else {
        for (i = 0; i < drones.length; i++) fireColumn(drones[i].x, 16, 11, spd + 24, { r: 3.1, color: "#e8e0d4", glow: col });
      }
    } else if (atk === "hook") {
      for (i = 0; i < 7; i++) {
        a = -0.9 + i * 0.3;
        addEbul(e.x, e.y + 8, Math.sin(a) * 90, Math.cos(a) * 90 + 20, { color: col, glow: col, r: 2.8, life: 3.2 });
      }
      yankPlayers(e.aimX, 0.34);
      banner = { text: "HOOKED", life: 0.55 };
    } else if (atk === "harvest") {
      fireSpoke(16, 24, 0.85, 6, 110, opt);
      fireSpoke(W - 16, 24, Math.PI - 0.85, 6, 110, opt);
      queueFollow(e, 0.45, "harvestring");
    } else if (atk === "harvestring") {
      aim = targetPlayer(e.x, e.y);
      px = aim ? aim.x : W / 2;
      base = aim ? aim.y : H - 40;
      for (i = 0; i < 8; i++) {
        a = (i / 8) * Math.PI * 2;
        plantSeed(clamp(px + Math.cos(a) * 42, 18, W - 18), clamp(base + Math.sin(a) * 28, 70, H - 24), col, 3.4);
      }
    } else if (atk === "rail") {
      if (e.railH) addRailFx("h", e.railPos || clamp(e.aimY, 90, H - 50), 16, W - 16, 2.6, col, true);
      else addRailFx("v", e.railPos || clamp(e.aimX, 24, W - 24), 40, H - 18, 2.6, col, true);
    } else if (atk === "node") {
      addEbul(28, 48, 70, 0, { color: col, glow: col, r: 3, life: 5 });
      addEbul(W - 28, 48, -70, 0, { color: col, glow: col, r: 3, life: 5, silent: true });
      addEbul(28, H - 48, 0, -70, { color: col, glow: col, r: 3, life: 5, silent: true });
      addEbul(W - 28, H - 48, 0, -70, { color: col, glow: col, r: 3, life: 5, silent: true });
    } else if (atk === "gridlock") {
      addRailFx("v", W / 2, 28, H - 16, 2.8, col, true);
      addRailFx("h", H * 0.55, 12, W - 12, 2.8, col, true);
    } else if (atk === "surge") {
      px = clamp(e.aimX, 20, W - 20);
      fireColumn(px, e.y + 10, 9, spd + 50, { r: 4.2, color: "#b8ffe8", glow: col });
    } else if (atk === "blackout") {
      nx = 50 + Math.random() * (W - 100);
      base = 90 + Math.random() * 80;
      f = addRailFx("v", nx, 24, H - 16, 2.5, col, false);
      f.relight = 1.45;
      f = addRailFx("h", base, 12, W - 12, 2.5, col, false);
      f.relight = 1.45;
    }
  }

  function fireStream(e, s) {
    var i, col = enemyColor(e.type), x, a, vx, vy, tgt;
    if (s.kind === "spiral") {
      addEbul(e.x, e.y, Math.cos(s.ang) * s.spd, Math.sin(s.ang) * s.spd, { color: col, glow: col, silent: true });
      addEbul(e.x, e.y, Math.cos(s.ang + Math.PI) * s.spd, Math.sin(s.ang + Math.PI) * s.spd, { color: col, glow: col, silent: true });
      s.ang += s.dAng;
    } else if (s.kind === "col" || s.kind === "col2") {
      for (i = 0; i < s.count; i++) addEbul(clamp(s.x, 8, W - 8), e.y + 14 + i * 20, 0, s.spd, { r: 3, color: "#f0ffd0", glow: col, silent: i > 0 });
      if (s.kind === "col2") {
        x = W - s.x;
        for (i = 0; i < s.count; i++) addEbul(clamp(x, 8, W - 8), e.y + 14 + i * 20, 0, s.spd, { r: 3, color: "#f0ffd0", glow: col, silent: true });
      }
      s.x += s.dx;
    } else if (s.kind === "hands") {
      addEbul(e.x, e.y + 8, Math.sin(s.ang) * s.spd, Math.cos(s.ang) * s.spd, { color: col, glow: col, silent: true, r: 3 });
      addEbul(e.x, e.y + 8, Math.sin(s.ang + 1.15) * s.spd, Math.cos(s.ang + 1.15) * s.spd, { color: col, glow: col, silent: true, r: 3 });
      s.ang += s.dAng;
    } else if (s.kind === "crown") {
      for (i = 0; i < 4; i++) {
        a = s.ang + i * Math.PI / 2;
        vx = Math.cos(a) * s.spd * 0.42;
        vy = Math.sin(a) * s.spd * 0.42 + s.spd * 0.58;
        addEbul(e.x + Math.cos(a) * 14, e.y + Math.sin(a) * 10, vx, vy, { color: col, glow: col, silent: i > 0, r: 2.8 });
      }
      s.ang += s.dAng;
    } else if (s.kind === "squeeze") {
      fireColumn(s.x, e.y + 14, s.count, s.spd, { r: 3, color: "#d8ff70", glow: col, silent: true });
      fireColumn(s.x2, e.y + 14, s.count, s.spd, { r: 3, color: "#d8ff70", glow: col, silent: true });
      s.x += s.dx;
      s.x2 -= s.dx;
    } else if (s.kind === "trackcol") {
      tgt = targetPlayer(e.x, e.y);
      if (tgt) s.x += (tgt.x - s.x) * 0.2;
      fireColumn(s.x, e.y + 14, s.count, s.spd, { r: 3.2, color: "#ff4d9a", glow: col, silent: true });
      if (tgt && tgt.alive && Math.abs(tgt.x - s.x) < 32) {
        if ((tgt.slowT || 0) < 0.35) banner = { text: "PETRIFIED", life: 0.65 };
        tgt.slowT = Math.max(tgt.slowT || 0, 1.2);
      }
    } else if (s.kind === "petal") {
      fireGappedRing(e.x, e.y, s.count || 12, s.spd, Math.round(s.ang), s.skipN || 2, { color: col, glow: col, silent: true, r: 2.6 });
      s.ang += s.dAng;
    } else if (s.kind === "orbit") {
      fireGappedRing(e.x, e.y, 12, s.spd, Math.round(s.ang), 2, { color: col, glow: col, silent: true, r: 2.5 });
      fireGappedRing(e.x, e.y, 10, s.spd + 36, Math.round(s.ang + 5), 2, { color: "#ffd0b0", glow: col, silent: true, r: 2.4 });
      s.ang += s.dAng;
    } else if (s.kind === "spoke") {
      a = s.ang;
      if (Math.abs(Math.sin((a - (s.gap || 0)) * 0.5)) > 0.28) fireSpoke(e.x, e.y, a, 5, s.spd * 0.55, { color: col, glow: col, silent: true, r: 2.8 });
      s.ang += s.dAng;
    } else if (s.kind === "scythe") {
      addEbul(s.x, s.y, 8, s.spd * 0.35, { color: col, glow: col, silent: true, r: 3.4, grav: 40 });
      addEbul(s.x, s.y + 10, -6, s.spd * 0.28, { color: col, glow: col, silent: true, r: 2.6, grav: 50 });
      s.x += s.dx;
    } else {
      s.n = 0;
    }
  }

  function updateBossFormMove(e, dt, d) {
    var spd = (d.spd + e.tier * 8) * (1 + e.phaseIdx * 0.15) * (e.moveSpd || 1);
    var amp = d.amp * (1 + e.phaseIdx * 0.2) * (e.moveAmp || 1);
    var freq = d.freq * (e.moveFreq || 1);
    var style = e.moveStyle || "patrol";
    var t = time + (e.phase || 0);
    var fy, hx, ang;
    if (e.throne) {
      e.x += (W / 2 - e.x) * Math.min(1, 3.2 * dt);
      fy = 64 + Math.sin(t * 1.4) * 3;
      e.x = clamp(e.x, 34, W - 34);
      e.y += (fy - e.y) * Math.min(1, 4 * dt);
      return;
    }
    if (style === "sine") {
      e.x = W / 2 + Math.sin(t * freq * 0.55) * (68 + amp * 2.4);
      fy = 68 + Math.sin(t * freq * 1.35) * (amp + 8);
    } else if (style === "figure8") {
      ang = t * freq * 0.68;
      e.x = W / 2 + Math.sin(ang) * 70;
      fy = 72 + Math.sin(ang * 2) * (16 + amp);
    } else if (style === "hover") {
      hx = e.homeX || W / 2;
      e.x += ((hx + Math.sin(t * 0.85) * 26) - e.x) * Math.min(1, 1.8 * dt);
      fy = 66 + Math.sin(t * freq) * (amp + 6);
      e.hoverT = (e.hoverT || 0) - dt;
      if (e.hoverT <= 0) {
        e.homeX = 50 + Math.random() * (W - 100);
        e.hoverT = 1.3 + Math.random() * 1.8;
      }
    } else if (style === "zigzag") {
      e.x += e.patrolDir * spd * 1.32 * dt;
      if (e.x < 34) { e.x = 34; e.patrolDir = 1; }
      if (e.x > W - 34) { e.x = W - 34; e.patrolDir = -1; }
      fy = 60 + Math.abs(Math.sin(t * freq * 2.1)) * (amp + 16);
    } else if (style === "orbit") {
      ang = t * freq * 0.82;
      e.x = W / 2 + Math.cos(ang) * (46 + amp);
      fy = 76 + Math.sin(ang) * (14 + amp * 0.55);
    } else if (style === "drift") {
      e.x += e.patrolDir * spd * 0.58 * dt;
      if (e.x < 40) e.patrolDir = 1;
      if (e.x > W - 40) e.patrolDir = -1;
      if (Math.random() < 0.45 * dt) e.patrolDir *= -1;
      fy = 70 + Math.sin(t * freq * 0.55) * amp + Math.sin(t * 2.05) * 5;
    } else {
      e.x += e.patrolDir * spd * dt;
      if (e.x < 34) { e.x = 34; e.patrolDir = 1; }
      if (e.x > W - 34) { e.x = W - 34; e.patrolDir = -1; }
      fy = 70 + Math.sin(t * freq) * amp;
    }
    e.x = clamp(e.x, 34, W - 34);
    e.y += (fy - e.y) * Math.min(1, 4 * dt);
  }

  function updateBoss(e, dt) {
    var t, fy, spd, i, f, d, ang, cx, cy, amp;
    d = bossDef(e.type) || BOSS_DEFS[0];
    e.shotCd = Math.max(0, e.shotCd - dt);
    for (i = e.followups.length - 1; i >= 0; i--) {
      f = e.followups[i];
      f.t -= dt;
      if (f.t <= 0) {
        e.followups.splice(i, 1);
        fireBossAttack(e, f.atk);
      }
    }
    if (e.stream) {
      e.stream.acc += dt;
      while (e.stream && e.stream.acc >= e.stream.dt && e.stream.n > 0) {
        e.stream.acc -= e.stream.dt;
        e.stream.n -= 1;
        fireStream(e, e.stream);
      }
      if (e.stream && e.stream.n <= 0) e.stream = null;
    }
    if (e.state === "enter") {
      e.t += dt / 1.15;
      t = e.t > 1 ? 1 : e.t;
      t = t * t * (3 - 2 * t);
      e.x = W / 2;
      e.y = lerp(-36, 72, t);
      if (e.t >= 1) { e.state = "form"; e.x = W / 2; e.y = 72; e.atkCd = 0.8; }
      return;
    }
    if (e.state === "dive" || e.state === "kami") {
      e.t += dt / e.dur;
      t = e.t > 1 ? 1 : e.t;
      e.x = bezier(t, e.sx, e.cx, e.ex);
      e.y = bezier(t, e.sy, e.cy, e.ey);
      if (e.t >= 1) {
        e.state = "return"; e.t = 0; e.dur = 0.9;
        e.sx = rand(30, W - 30); e.sy = -24; e.x = e.sx; e.y = e.sy;
      }
      return;
    }
    if (e.state === "charge") {
      var chAim = targetPlayer(e.x, e.y);
      if (e.type === "colossus" && chAim && chAim.alive) e.ex += (chAim.x - e.ex) * Math.min(1, 0.96 * dt);
      e.t += dt / e.dur;
      t = e.t > 1 ? 1 : e.t;
      e.x = lerp(e.sx, e.ex, t);
      e.y = lerp(e.sy, e.ey, t * t);
      if (e.t >= 1) {
        e.state = "return"; e.t = 0; e.dur = 0.85;
        e.sx = e.x; e.sy = -20;
      }
      return;
    }
    if (e.state === "lunge") {
      e.t += dt / e.dur;
      t = e.t > 1 ? 1 : e.t;
      e.x = bezier(t, e.sx, e.cx, e.ex);
      e.y = bezier(t, e.sy, e.cy, e.ey);
      if (e.t >= 1) {
        fanShot(e.x, e.y + 8, 3, 0.62, 132 + e.tier * 8, 0, { color: "#b8ffe0", glow: enemyColor(e.type) });
        e.state = "return"; e.t = 0; e.dur = 0.72;
        e.sx = e.x; e.sy = e.y;
      }
      return;
    }
    if (e.state === "whip") {
      e.t += dt / e.dur;
      t = e.t > 1 ? 1 : e.t;
      e.x = lerp(e.sx, e.ex, t);
      e.y = lerp(e.sy, 105, Math.sin(Math.PI * t));
      e.whipCd -= dt;
      if (e.whipCd <= 0) {
        e.whipCd = 0.08;
        addEbul(e.x, e.y + 12, 0, 130 + e.tier * 10, { color: enemyColor(e.type), glow: enemyColor(e.type), silent: true });
      }
      if (e.t >= 1) { e.state = "form"; e.atkCd = bossCooldown(e); e.patrolDir = e.ex > W / 2 ? -1 : 1; }
      return;
    }
    if (e.state === "coil") {
      e.t += dt / e.dur;
      t = e.t > 1 ? 1 : e.t;
      ang = t * Math.PI * 2 * 1.2 - Math.PI / 2;
      cx = e.sx; cy = e.sy + 40;
      e.x = clamp(cx + Math.cos(ang) * 40, 24, W - 24);
      e.y = cy + Math.sin(ang) * 40;
      e.coilCd -= dt;
      if (e.coilCd <= 0) {
        e.coilCd = 0.28;
        ringShot(e.x, e.y, 4 + e.tier, 110, { color: enemyColor(e.type), glow: enemyColor(e.type) });
      }
      if (e.t >= 1) { e.state = "return"; e.t = 0; e.dur = 0.5; e.sx = e.x; e.sy = e.y; }
      return;
    }
    if (e.state === "return") {
      e.t += dt / e.dur;
      t = e.t > 1 ? 1 : e.t;
      t = t * t * (3 - 2 * t);
      e.x = lerp(e.sx, W / 2, t);
      e.y = lerp(e.sy, 72, t);
      if (e.t >= 1) {
        e.state = "form"; e.atkCd = 0.7;
        if (e.afterReturn) { beginBossAttack(e, e.afterReturn); e.afterReturn = ""; }
      }
      return;
    }
    updateBossFormMove(e, dt, d);
    if (e.tele) {
      if (e.type === "colossus" && (e.tele.atk === "charge" || e.tele.atk === "charge2" || e.tele.atk === "homing")) {
        var liveAim = targetPlayer(e.x, e.y);
        if (liveAim) {
          e.aimX += (liveAim.x - e.aimX) * Math.min(1, 0.96 * dt);
          e.aimY += (liveAim.y - e.aimY) * Math.min(1, 0.96 * dt);
          for (i = 0; i < teles.length; i++) {
            if (teles[i].kind === "line" || teles[i].kind === "flash") {
              teles[i].x2 = e.aimX;
              teles[i].y2 = e.aimY;
            }
          }
        }
      }
      e.tele.t -= dt;
      if (e.tele.t <= 0) {
        fireBossAttack(e, e.tele.atk);
        e.tele = null;
        e.atkCd = bossCooldown(e);
        if ((e.tier >= 2 || e.phaseIdx >= 2) && e.state === "form" && Math.random() < 0.4) e.atkCd = 0.22;
      }
      return;
    }
    e.atkCd -= dt;
    if (e.atkCd <= 0 && enterT <= 0) beginBossAttack(e);
  }

  function aliveCount() {
    var n = 0, i;
    for (i = 0; i < enemies.length; i++) if (enemies[i].alive) n += 1;
    return n;
  }
  function divingCount() {
    var n = 0, i, s;
    for (i = 0; i < enemies.length; i++) {
      s = enemies[i].state;
      if (enemies[i].alive && (s === "dive" || s === "return" || s === "kami" || s === "charge" || s === "lunge")) n += 1;
    }
    return n;
  }
  function pickDiver() {
    var pool = [], i, e, w;
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (!e.alive || e.state !== "form" || e.isBoss) continue;
      if (staysInForm(e.type)) continue;
      w = e.type === "kami" ? 5 : e.type === "grunt" ? 3 : weaves(e.type) ? 3 : 1;
      while (w--) pool.push(e);
    }
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function currentBoss() {
    var i;
    for (i = 0; i < enemies.length; i++) if (enemies[i].alive && enemies[i].isBoss) return enemies[i];
    return null;
  }

  function bossKills(map) {
    var n = 0, k;
    map = map || {};
    for (k in map) if (Object.prototype.hasOwnProperty.call(map, k)) n += map[k] || 0;
    return n;
  }
  function snapshotDailies() {
    qSnap = {};
    longSnap = {};
    var ids = profile.dailies.ids || [], i, q;
    for (i = 0; i < ids.length; i++) qSnap[ids[i]] = profile.dailies.progress[ids[i]] || 0;
    for (i = 0; i < LONG_DEFS.length; i++) {
      q = LONG_DEFS[i];
      longSnap[q.id] = (profile.longTerm[q.id] && profile.longTerm[q.id].progress) || 0;
    }
  }
  function questLive(q) {
    var base = qSnap[q.id] || 0;
    var cw, sw;
    if (q.kind === "kills") return base + (run.killsByType[q.type] || 0);
    if (q.kind === "wave") return Math.max(base, run.maxWave);
    if (q.kind === "score") return Math.max(base, score);
    if (q.kind === "runCoins") return Math.max(base, run.coins);
    if (q.kind === "bossAny") return base + bossKills(run.bosses);
    if (q.kind === "bossRun") return Math.max(base, bossKills(run.bosses));
    if (q.kind === "noHitWave") {
      cw = run.hits ? (run.cleanWave || 0) : run.maxWave;
      return Math.max(base, cw);
    }
    if (q.kind === "livesOkWave") {
      sw = run.livesLost ? (run.safeWave || 0) : run.maxWave;
      return Math.max(base, sw);
    }
    if (q.kind === "pickup") return base + (run.pickups[q.type] || 0);
    if (q.kind === "diveKills") return base + (run.diveKills || 0);
    if (q.kind === "killsRun") return Math.max(base, run.kills || 0);
    if (q.kind === "noHitBoss") return base + (run.perfectBosses || 0);
    if (q.kind === "enemySet") return q.types.every(function (type) { return (run.killsByType[type] || 0) > 0; }) ? 1 : base;
    if (q.kind === "pickupSet") return q.types.every(function (type) { return (run.pickups[type] || 0) > 0; }) ? 1 : base;
    if (q.kind === "cleanKillsRun") return Math.max(base, profile.dailies.progress[q.id] || 0, run.hits ? 0 : (run.kills || 0));
    return base;
  }
  function longProgressValue(q) {
    var st = profile.stats;
    if (q.kind === "wave") return st.maxWave || 0;
    if (q.kind === "boss") return st.bosses[q.type] ? 1 : 0;
    if (q.kind === "bossCount") return st.bosses[q.type] || 0;
    if (q.kind === "bossTier") return ((st.bossBest && st.bossBest[q.type]) || 0) >= (q.tier || 0) + 1 ? 1 : 0;
    if (q.kind === "level") return xpLevel(profile.totalXp);
    if (q.kind === "killsLife") return st.killsByType[q.type] || 0;
    if (q.kind === "killsAllLife") return bossKills(st.killsByType);
    if (q.kind === "noHitWave") return st.cleanWave || 0;
    if (q.kind === "livesOkWave") return st.safeWave || 0;
    if (q.kind === "pickupLife") return (st.pickups && st.pickups[q.type]) || 0;
    if (q.kind === "diveKillsLife") return st.diveKills || 0;
    if (q.kind === "scoreLife") return profile.best || 0;
    if (q.kind === "bossRun") return st.maxBossesRun || 0;
    if (q.kind === "coinsRun") return st.maxRunCoins || 0;
    if (q.kind === "coinsLife") return st.coinsEarned || 0;
    if (q.kind === "bossesLife") return bossKills(st.bosses);
    if (q.kind === "perfectLife") return st.perfectBosses || 0;
    if (q.kind === "ownShips") return profile.ownedShips.length;
    if (q.kind === "ownGuns") return profile.ownedGuns.length;
    if (q.kind === "cleanKillsRun") return st.maxCleanRunKills || 0;
    if (q.kind === "bossRoster") {
      var bossCount = 0, bi;
      for (bi = 0; bi < BOSS_DEFS.length; bi++) if (st.bosses[BOSS_DEFS[bi].id]) bossCount += 1;
      return bossCount;
    }
    if (q.kind === "ownCollection") return profile.ownedShips.length >= q.ships && profile.ownedGuns.length >= q.guns ? 1 : 0;
    return 0;
  }
  function syncQuestProgress() {
    ensureDailies();
    var i, q, ids = profile.dailies.ids || [];
    var clean = run.hits ? (run.cleanWave || 0) : (run.maxWave || 0);
    var safe = run.livesLost ? (run.safeWave || 0) : (run.maxWave || 0);
    profile.stats.cleanWave = Math.max(profile.stats.cleanWave || 0, clean);
    profile.stats.safeWave = Math.max(profile.stats.safeWave || 0, safe);
    profile.stats.maxBossesRun = Math.max(profile.stats.maxBossesRun || 0, bossKills(run.bosses));
    profile.stats.maxRunCoins = Math.max(profile.stats.maxRunCoins || 0, run.coins || 0);
    profile.stats.maxKillsRun = Math.max(profile.stats.maxKillsRun || 0, run.kills || 0);
    if (!run.hits) profile.stats.maxCleanRunKills = Math.max(profile.stats.maxCleanRunKills || 0, run.kills || 0);
    for (i = 0; i < ids.length; i++) {
      q = dailyById(ids[i]);
      if (q) profile.dailies.progress[q.id] = questLive(q);
    }
    for (i = 0; i < LONG_DEFS.length; i++) {
      q = LONG_DEFS[i];
      if (!profile.longTerm[q.id]) profile.longTerm[q.id] = { progress: 0, claimed: false };
      var prog = longProgressValue(q);
      if (profile.longTerm[q.id].progress < prog) profile.longTerm[q.id].progress = prog;
    }
  }
  function completedRunQuests() {
    var out = [], i, q, ids = profile.dailies.ids || [];
    for (i = 0; i < ids.length; i++) {
      q = dailyById(ids[i]);
      if (!q || profile.dailies.claimed[q.id]) continue;
      if ((qSnap[q.id] || 0) < q.target && (profile.dailies.progress[q.id] || 0) >= q.target) out.push({ q: q, scope: "daily" });
    }
    for (i = 0; i < LONG_DEFS.length; i++) {
      q = LONG_DEFS[i];
      var lt = profile.longTerm[q.id];
      if (!lt || lt.claimed) continue;
      if ((longSnap[q.id] || 0) < q.target && lt.progress >= q.target) out.push({ q: q, scope: "long" });
    }
    return out;
  }
  function ownOrConsole(cat, id, consolation) {
    if (isOwned(cat, id)) {
      profile.coins += consolation || 40;
      return consolation || 40;
    }
    ownedList(cat).push(id);
    if (cat === "ship") grantLevelSkins();
    return 0;
  }
  function applyReward(rew) {
    if (rew == null) return;
    if (typeof rew === "number") {
      profile.coins += rew;
      return;
    }
    if (rew.coins) profile.coins += rew.coins;
    if (rew.gun) ownOrConsole("gun", rew.gun, rew.consolation);
    if (rew.ship) ownOrConsole("ship", rew.ship, rew.consolation);
    if (rew.mod) ownOrConsole("mod", rew.mod, rew.consolation);
  }
  function catalogStatus(cat, def) {
    if (cat === "mod" && (!def.id || def.id === "none")) return isEquipped("mod", null) ? "equipped" : "owned";
    if (cat === "skin" && def.ship && !isOwned("ship", def.ship) && def.cost > 0) return "locked";
    if (isOwned(cat, def.id)) return isEquipped(cat, def.id) ? "equipped" : "owned";
    if (xpLevel(profile.totalXp) < (def.unlockLevel || 1)) return "locked";
    return "buy";
  }
  function catalogDef(cat, id) {
    if (cat === "ship") return findIn(SHIPS, id);
    if (cat === "gun") return findIn(GUNS, id);
    if (cat === "skin") return findSkin(id);
    if (cat === "mod" && (!id || id === "none")) return { id: "none", name: "None", unlockLevel: 1, cost: 0, rarity: "common", desc: "No module" };
    return findIn(MODS, id);
  }
  function buyItem(cat, id) {
    var def = catalogDef(cat, id);
    if (!def || def.cost <= 0) return;
    if (isOwned(cat, id)) return;
    if (xpLevel(profile.totalXp) < (def.unlockLevel || 1)) return;
    if (cat === "skin" && def.ship && !isOwned("ship", def.ship)) return;
    if (profile.coins < def.cost) return;
    profile.coins -= def.cost;
    ownedList(cat).push(id);
    if (cat === "ship") grantLevelSkins();
    syncQuestProgress();
    ensureAudio();
    sfxCredit();
    saveProfile();
    equipItem(cat, id);
  }
  function equipItem(cat, id) {
    if (cat === "mod" && (!id || id === "none")) {
      profile.equipped.mod = null;
    } else if (cat === "skin") {
      var ship = hangarView().ship;
      if (!isOwned("ship", ship) || !isOwned("skin", id)) {
        hangarPick = { cat: "skin", id: id };
        renderHangar();
        drawHangarPreview();
        return;
      }
      if (!profile.equippedSkins) profile.equippedSkins = {};
      profile.equippedSkins[ship] = id;
    } else {
      if (!isOwned(cat, id)) return;
      if (cat === "ship") {
        profile.equipped.ship = id;
        grantLevelSkins();
      } else if (cat === "gun") profile.equipped.gun = id;
      else profile.equipped.mod = id;
    }
    hangarPick = null;
    saveProfile();
    renderHangar();
    renderHub();
    drawHubPreview();
    drawHangarPreview();
  }
  function claimQuest(scope, id) {
    var q;
    if (scope === "daily") {
      q = dailyById(id);
      if (!q || profile.dailies.claimed[id]) return;
      if ((profile.dailies.progress[id] || 0) < q.target) return;
      profile.dailies.claimed[id] = true;
      applyReward(q.reward);
    } else {
      q = longById(id);
      if (!q) return;
      if (!profile.longTerm[id]) profile.longTerm[id] = { progress: 0, claimed: false };
      var lt = profile.longTerm[id];
      if (lt.claimed || (lt.progress || 0) < q.target) return;
      lt.claimed = true;
      applyReward(q.reward);
    }
    syncQuestProgress();
    ensureAudio();
    sfxCredit();
    saveProfile();
    renderQuests();
    renderHub();
    if (uiScreen === "summary") renderRunSummary();
  }

  function renderHub() {
    var ship = findShip(profile.equipped.ship);
    var gun = findGun(profile.equipped.gun);
    var mod = findMod(profile.equipped.mod);
    var hubEquip = el("hub-equip");
    var hubCoins = el("hub-coins");
    var hubLv = el("hub-lv");
    var hubTitle = el("hub-title");
    var fill = el("hub-xp-fill");
    var lab = el("hub-xp-label");
    var skin = findSkin(equippedSkinFor(ship.id));
    if (hubEquip) hubEquip.textContent = ship.name + "  ·  " + gun.name + "  ·  " + (mod ? mod.name : "No mod") + (skin && skin.id !== "stock" ? "  ·  " + skin.name : "");
    if (hubCoins) hubCoins.textContent = profile.coins + "c";
    var lv = xpLevel(profile.totalXp);
    if (hubLv) hubLv.textContent = "Lv " + lv;
    if (hubTitle) hubTitle.textContent = levelTitle(lv);
    var lo = xpForLevel(lv);
    var hi = lv >= MAX_LEVEL ? lo : xpForLevel(lv + 1);
    var pct = hi <= lo ? 1 : (profile.totalXp - lo) / (hi - lo);
    if (fill) fill.style.width = Math.round(Math.max(0, Math.min(1, pct)) * 100) + "%";
    if (lab) lab.textContent = lv >= MAX_LEVEL ? "MAX LEVEL  ·  " + profile.totalXp + " XP" : (profile.totalXp - lo) + " / " + (hi - lo) + " XP to Lv " + (lv + 1);
    renderStartWavePicker("start-wave-opts");
    drawHubPreview();
  }
  function renderStartWavePicker(id, readOnly) {
    var box = el(id);
    var hint = el(id === "start-wave-opts" ? "start-wave-hint" : "lobby-start-wave-hint");
    var lv = xpLevel(profile.totalXp);
    var opts = startWaveOptions(lv);
    var chosen = preferredStartWave();
    var html = "", i, n, label, locked, hasLocked = false;
    if (!box) return;
    if (readOnly) {
      box.innerHTML = "";
      if (hint) hint.textContent = "Host chooses the starting wave";
      return;
    }
    for (i = 0; i < opts.length; i++) {
      n = opts[i];
      locked = !startWaveUnlocked(n);
      if (locked) hasLocked = true;
      label = n === 1 ? "Wave 1" : ("Wave " + n);
      html += '<button type="button" class="start-wave-opt' + (n === chosen ? " active" : "") + (locked ? " locked" : "") + '" data-wave="' + n + '"' + (locked ? ' disabled title="Beat this wave first to unlock starting at it."' : "") + ">" + label + "</button>";
    }
    box.innerHTML = html;
    if (!readOnly) {
      box.onclick = function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest(".start-wave-opt") : null;
        var w;
        if (!btn || btn.disabled) return;
        w = btn.getAttribute("data-wave") | 0;
        if (!startWaveUnlocked(w)) return;
        setPreferredStartWave(w);
        // Already-selected Wave 1 would otherwise be a no-op; start on any tap.
        if (id === "start-wave-opts") {
          leaveNet();
          startNewGame({ startWave: w });
          return;
        }
        if (id === "lobby-start-wave-opts" && netRole === "host" && lobbyGuest) {
          lobbyStart();
          return;
        }
        renderStartWavePicker("start-wave-opts");
        renderStartWavePicker("lobby-start-wave-opts");
      };
    }
    if (hint) {
      if (lv < 10) hint.textContent = "Reach level 10 to skip early waves";
      else if (hasLocked) hint.textContent = "Beat this wave first to unlock starting at it.";
      else hint.textContent = "Unlocked through wave " + maxStartWave(lv);
    }
  }

  var boardFetch = 0;
  function paintBoard(data) {
    var list = el("board-list");
    var status = el("board-status");
    var youLine = el("board-you");
    var entries = (data && data.entries) || [];
    var you = data && data.you;
    var i, h = "", row, rankCls, isYou;
    if (youLine) {
      youLine.textContent = you
        ? "Your best  " + fmtScore(best) + "  ·  Rank #" + you.rank
        : "Your best  " + fmtScore(best);
    }
    if (!entries.length) {
      if (status) status.textContent = best > 0 ? "You're first. Finish a run on the live site to post it." : "No scores yet. Finish a run to post yours.";
      if (list) list.innerHTML = "";
      return;
    }
    if (status) status.textContent = (data.total || entries.length) + " pilot" + ((data.total || entries.length) === 1 ? "" : "s");
    for (i = 0; i < entries.length; i++) {
      row = entries[i];
      isYou = !!(you && you.rank === i + 1);
      rankCls = i === 0 ? " gold" : i === 1 ? " silver" : i === 2 ? " bronze" : "";
      h += '<div class="board-row' + (isYou ? " you" : "") + '">';
      h += '<div class="board-rank' + rankCls + '">' + (i + 1) + "</div>";
      h += '<div class="board-pilot">' + escHtml(row.name) + (isYou ? "  (you)" : "") + "</div>";
      h += '<div class="board-score">' + fmtScore(row.score) + "</div></div>";
    }
    if (you && you.rank > entries.length) {
      h += '<div class="board-out">Your rank  #' + you.rank + "  ·  " + fmtScore(you.score) + "</div>";
    }
    if (list) list.innerHTML = h;
  }
  function refreshRanks() {
    ensurePilot();
    var nameIn = el("board-name");
    if (nameIn && document.activeElement !== nameIn) nameIn.value = profile.name || "";
    var youLine = el("board-you");
    if (youLine) youLine.textContent = "Your best  " + fmtScore(best);
    var status = el("board-status");
    if (status) status.textContent = "Loading…";
    var ticket = ++boardFetch;
    var req;
    if (profile.best > 0) {
      req = fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: profile.pid, name: profile.name, score: profile.best | 0 })
      });
    } else {
      req = fetch("/api/leaderboard?id=" + encodeURIComponent(profile.pid), { cache: "no-store" });
    }
    req.then(function (res) {
      if (!res.ok) throw new Error("bad");
      return res.json();
    }).then(function (data) {
      if (ticket !== boardFetch || uiScreen !== "ranks") return;
      paintBoard(data);
    }).catch(function () {
      if (ticket !== boardFetch || uiScreen !== "ranks") return;
      if (status) status.textContent = "Can't reach the board. Open the live game URL (needs internet).";
      var list = el("board-list");
      if (list) list.innerHTML = "";
    });
  }
  function submitLeaderboard() {
    if (isPvp()) return;
    ensurePilot();
    if (!profile.pid || !(profile.best > 0)) return;
    fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: profile.pid, name: profile.name, score: profile.best | 0 })
    }).then(function (res) {
      if (res.ok && uiScreen === "ranks") return res.json().then(paintBoard);
    }).catch(function () {});
  }
  function commitPilotName() {
    var nameIn = el("board-name");
    if (!nameIn) return;
    var next = sanitizeName(nameIn.value);
    if (!next) next = defaultPilotName(profile.pid);
    nameIn.value = next;
    if (next !== profile.name) {
      profile.name = next;
      saveProfile();
    }
    if (uiScreen === "ranks") refreshRanks();
    else submitLeaderboard();
  }

  // ---- Hangar ----------------------------------------------------------------------------
  var hangarTab = "ship";
  var hangarPick = null;
  var hangarHover = null;
  var hangarMuzzle = 0;
  var hangarFireT = 0;
  var hangarDrag = null;
  var hangarGhost = null;
  var hangarDidDrag = false;
  var RARITIES = ["common", "rare", "epic", "legendary"];
  function rarityLabel(r) { return r === "legendary" ? "Legendary" : r === "epic" ? "Epic" : r === "rare" ? "Rare" : "Common"; }
  function fmtPct(m) {
    var p = Math.round((m - 1) * 100);
    return (p > 0 ? "+" : "") + p + "%";
  }
  function fmtNum(v, dec) {
    var f = Math.pow(10, dec || 0);
    return String(Math.round(v * f) / f);
  }
  // A stat chip. cmp: 1 = better than equipped, -1 = worse, 0 = same/no comparison.
  function chip(label, val, cmp, extraCls) {
    var cls = "chip" + (cmp > 0 ? " up" : cmp < 0 ? " down" : "") + (extraCls ? " " + extraCls : "");
    return '<span class="' + cls + '"><b>' + label + "</b> " + val + (cmp > 0 ? " ▲" : cmp < 0 ? " ▼" : "") + "</span>";
  }
  function cmpHigh(a, b) { return Math.abs(a - b) < 1e-6 ? 0 : a > b ? 1 : -1; }
  function shipChips(s, eq) {
    var h = "", same = s.id === eq.id;
    var mod = equippedMod();
    h += chip("SPD", fmtNum(loadoutSpeed(s, mod)), same ? 0 : cmpHigh(s.speed, eq.speed));
    h += chip("HIT", fmtNum(loadoutR(s, mod), 1), same ? 0 : -cmpHigh(s.r, eq.r));
    h += chip("LIVES", String(loadoutLives(s)), same ? 0 : cmpHigh(loadoutLives(s), loadoutLives(eq)));
    h += chip("INV", fmtNum(s.invuln, 1) + "s", same ? 0 : cmpHigh(s.invuln, eq.invuln));
    if (s.startShield || eq.startShield) h += chip("SHIELD", String(s.startShield || 0), same ? 0 : cmpHigh(s.startShield || 0, eq.startShield || 0));
    if (s.regen || eq.regen) h += chip("REGEN", s.regen ? s.regen + "s" : "–", same ? 0 : cmpHigh(s.regen ? 1 / s.regen : 0, eq.regen ? 1 / eq.regen : 0));
    if (s.fireMul !== 1 || eq.fireMul !== 1) h += chip("ROF", fmtPct(s.fireMul), same ? 0 : cmpHigh(s.fireMul, eq.fireMul));
    if (s.dmgMul !== 1 || eq.dmgMul !== 1) h += chip("DMG", fmtPct(s.dmgMul), same ? 0 : cmpHigh(s.dmgMul, eq.dmgMul));
    if (s.coinMul !== 1) h += chip("COINS", fmtPct(s.coinMul), same ? 0 : 1);
    if (s.pickMul !== 1) h += chip("GEMS", fmtPct(s.pickMul), same ? 0 : 1);
    if (s.passive === "leech") h += chip("PASSIVE", "Leech", 0, "special");
    if (s.passive === "nova") h += chip("PASSIVE", "Nova", 0, "special");
    if (s.passive === "eclipse") h += chip("PASSIVE", "Eclipse", 0, "special");
    return h;
  }
  function gunChips(g, eq) {
    var h = "", same = g.id === eq.id;
    var ship = shipDef(), mod = equippedMod();
    var dps = gunDps(g, ship, mod), eqDps = gunDps(eq, ship, mod);
    h += chip("DPS", fmtNum(dps, 1), same ? 0 : cmpHigh(dps, eqDps));
    h += chip("DMG", fmtNum(g.dmg * loadoutDmgMul(ship, mod), 1) + (g.shots.length > 1 ? "×" + g.shots.length : ""), same ? 0 : cmpHigh(g.dmg, eq.dmg));
    h += chip("ROF", fmtNum(1000 / gunInterval(g) * loadoutFireMul(ship, mod), 1) + "/s", same ? 0 : cmpHigh(1 / gunInterval(g), 1 / gunInterval(eq)));
    if (g.pierce) h += chip("PIERCE", g.pierce >= 99 ? "all" : String(g.pierce), 0, "special");
    if (g.homing) h += chip("HOMING", "yes", 0, "special");
    if (g.life) h += chip("RANGE", "short", 0, "warn");
    if (g.splash) h += chip("SPLASH", g.splash.dmg + " dmg", 0, "special");
    if (g.bolt) h += chip("BOLT", "every " + g.bolt + "th", 0, "special");
    if (g.helix) h += chip("WEAVE", "±" + g.helix.amp + "px", 0, "special");
    return h;
  }
  function modChips(m) {
    var h = "", i, parts;
    if (!m || m.id === "none" || !m.tags) return chip("EFFECT", "none", 0);
    for (i = 0; i < m.tags.length; i++) {
      parts = m.tags[i].split(" ");
      h += chip(parts[0], parts.slice(1).join(" "), 0, "special");
    }
    return h;
  }
  function skinChips(d) {
    var h = "";
    h += chip("FX", (d.fx || "solid").toUpperCase(), 0, "special");
    if (d.perk) h += chip("PERK", d.perk, 0, "special");
    if (d.cost > 0) h += chip("PRICE", d.cost + "c", 0);
    else if (d.unlockLevel > 1) h += chip("LV", String(d.unlockLevel), 0);
    return h;
  }
  function hangarView() {
    var ship = (profile.equipped && profile.equipped.ship) || "wisp";
    var gun = (profile.equipped && profile.equipped.gun) || "pulse";
    var mod = profile.equipped ? profile.equipped.mod : null;
    var skin = null;
    if (hangarPick) {
      if (hangarPick.cat === "ship") ship = hangarPick.id;
      else if (hangarPick.cat === "gun") gun = hangarPick.id;
      else if (hangarPick.cat === "mod") mod = hangarPick.id === "none" ? null : hangarPick.id;
      else if (hangarPick.cat === "skin") skin = hangarPick.id;
    }
    if (!skin) skin = equippedSkinFor(ship);
    return { ship: ship, gun: gun, mod: mod, skin: skin, preview: !!hangarPick };
  }
  function hangarSwatch(cat, d) {
    var ship, paint;
    if (cat === "ship") return d.color || "#7ef9ff";
    if (cat === "skin") {
      ship = hangarView().ship;
      paint = skinPaint(ship, d.id);
      return paint.hull;
    }
    if (cat === "gun") return "#9ab8ff";
    if (!d || d.id === "none") return "#4a5a80";
    return "#ffd23d";
  }
  function lockReason(def) {
    var lv = xpLevel(profile.totalXp);
    if (def.ship && def.cost > 0 && !isOwned("ship", def.ship)) return "Own this ship first";
    if (!def.unlockLevel || def.unlockLevel <= 1) return "Locked";
    var need = xpForLevel(def.unlockLevel) - profile.totalXp;
    return "Lv " + def.unlockLevel + " · " + (def.unlockLevel - lv) + " to go (" + need + " XP)";
  }
  function itemRow(cat, d, eq) {
    var st = catalogStatus(cat, d);
    var canAfford = profile.coins >= d.cost;
    var view = hangarView();
    var preview = hangarPick && hangarPick.cat === cat && hangarPick.id === d.id;
    var chips = cat === "ship" ? shipChips(d, eq) : cat === "gun" ? gunChips(d, eq) : cat === "skin" ? skinChips(d) : modChips(d);
    var h = '<div class="cat-row ' + st + (preview ? " preview" : "") + " r-" + (d.rarity || "common") + '" data-cat="' + cat + '" data-id="' + d.id + '">';
    h += '<div class="cat-swatch" data-drag="1" data-cat="' + cat + '" data-id="' + d.id + '" style="background:' + hangarSwatch(cat, d) + ";color:" + hangarSwatch(cat, d) + '"></div>';
    h += '<div class="cat-info"><div class="cat-name">' + d.name + ' <span class="badge b-' + (d.rarity || "common") + '">' + rarityLabel(d.rarity) + "</span></div>";
    h += '<div class="cat-desc">' + d.desc + (d.perkText ? " · " + d.perkText : "") + "</div>";
    h += '<div class="chips">' + chips + "</div>";
    if (st === "locked") h += '<div class="lock-reason">Locked · ' + lockReason(d) + "</div>";
    else if (st === "buy" && !canAfford) h += '<div class="lock-reason">Need ' + (d.cost - profile.coins) + "c more</div>";
    h += "</div>";
    h += '<div class="cat-act">';
    if (st === "locked") h += '<span class="tag">' + (d.cost > 0 && d.ship && !isOwned("ship", d.ship) ? "Ship" : ("Lv " + d.unlockLevel)) + "</span>";
    else if (st === "buy") h += '<button type="button" class="btn btn-mini' + (canAfford ? "" : " btn-off") + '" data-act="buy" data-cat="' + cat + '" data-id="' + d.id + '"' + (canAfford ? "" : " disabled") + ">" + d.cost + "c</button>";
    else if (st === "owned") h += '<button type="button" class="btn btn-mini" data-act="equip" data-cat="' + cat + '" data-id="' + d.id + '">Equip</button>';
    else h += '<span class="tag on">Equipped</span>';
    h += "</div></div>";
    return h;
  }
  function sectionHtml(items, cat) {
    var h = "", i, r, d, eq, any;
    eq = cat === "ship" ? findShip(hangarView().ship) : cat === "gun" ? findGun(hangarView().gun) : null;
    for (r = 0; r < RARITIES.length; r++) {
      any = false;
      for (i = 0; i < items.length; i++) {
        d = items[i];
        if ((d.rarity || "common") !== RARITIES[r]) continue;
        if (!any) { h += '<div class="cat-title">' + rarityLabel(RARITIES[r]) + "</div>"; any = true; }
        h += itemRow(cat, d, eq);
      }
    }
    return h;
  }
  function renderHangar() {
    var coins = el("hangar-coins");
    var lists = el("hangar-lists");
    var tabs = el("hangar-tabs");
    var lv = xpLevel(profile.totalXp);
    var view, ship, gun, mod, skin, eqLine, mods;
    grantLevelSkins();
    if (coins) coins.textContent = profile.coins + " coins  ·  Lv " + lv + " " + levelTitle(lv);
    if (tabs) {
      var btns = tabs.querySelectorAll("[data-tab]"), i;
      for (i = 0; i < btns.length; i++) btns[i].classList.toggle("active", btns[i].getAttribute("data-tab") === hangarTab);
    }
    if (!lists) return;
    view = hangarView();
    ship = findShip(view.ship);
    gun = findGun(view.gun);
    mod = findMod(view.mod);
    skin = findSkin(view.skin);
    eqLine = el("hangar-equip");
    if (eqLine) {
      eqLine.classList.toggle("preview", !!view.preview);
      eqLine.innerHTML = '<span class="eq-lab">' + (view.preview ? "Preview" : "Loadout") + "</span> " +
        ship.name + " · " + gun.name + " · " + (mod ? mod.name : "No mod") + " · " + (skin && skin.id !== "stock" ? skin.name : "Stock") +
        '<span class="eq-dps">' + fmtNum(gunDps(gun, ship, view.mod), 1) + " DPS · " + loadoutLives(ship) + " lives</span>";
    }
    if (hangarTab === "ship") lists.innerHTML = sectionHtml(SHIPS, "ship");
    else if (hangarTab === "gun") lists.innerHTML = sectionHtml(GUNS, "gun");
    else if (hangarTab === "skin") lists.innerHTML = sectionHtml(skinsForShip(view.ship), "skin");
    else {
      mods = [{ id: "none", name: "None", unlockLevel: 1, cost: 0, rarity: "common", desc: "No module" }].concat(MODS);
      lists.innerHTML = sectionHtml(mods, "mod");
    }
  }
  function selectHangarItem(cat, id) {
    var def = catalogDef(cat, id);
    var st;
    if (!def) return;
    st = catalogStatus(cat, def);
    if (st === "owned" || st === "equipped") {
      equipItem(cat, id);
      return;
    }
    hangarPick = { cat: cat, id: id };
    if (cat === "ship") hangarTab = "ship";
    else if (cat === "gun") hangarTab = "gun";
    else if (cat === "mod") hangarTab = "mod";
    else hangarTab = "skin";
    renderHangar();
    drawHangarPreview();
  }
  function applyHangarItem(cat, id) {
    var def = catalogDef(cat, id);
    var st;
    if (!def) return false;
    st = catalogStatus(cat, def);
    if (st === "locked") return false;
    if (st === "buy") {
      if (profile.coins < def.cost) return false;
      buyItem(cat, id);
      return isOwned(cat, id);
    }
    equipItem(cat, id);
    return true;
  }
  function rewardText(rew) {
    if (rew == null) return "";
    if (typeof rew === "number") return rew + "c";
    var parts = [], name, extra;
    if (rew.coins) parts.push(rew.coins + "c");
    if (rew.gun) {
      name = (findGun(rew.gun) || {}).name || rew.gun;
      extra = rew.consolation ? " or " + rew.consolation + "c" : "";
      parts.push(name + extra);
    }
    if (rew.ship) {
      name = (findShip(rew.ship) || {}).name || rew.ship;
      extra = rew.consolation ? " or " + rew.consolation + "c" : "";
      parts.push(name + extra);
    }
    if (rew.mod) {
      name = (findMod(rew.mod) || {}).name || rew.mod;
      extra = rew.consolation ? " or " + rew.consolation + "c" : "";
      parts.push(name + extra);
    }
    if (!parts.length && rew.consolation) parts.push(rew.consolation + "c");
    return parts.join(" · ");
  }
  function questRow(q, prog, claimed, scope) {
    var done = prog >= q.target;
    var rew = rewardText(q.reward);
    var pct = Math.round(Math.max(0, Math.min(1, prog / q.target)) * 100);
    var h = '<div class="cat-row' + (claimed ? " equipped claimed" : done ? " ready" : "") + '">';
    h += '<div class="cat-info"><div class="cat-name">' + q.name + '</div><div class="cat-desc">' + q.desc + "</div>";
    if (rew) h += '<div class="q-reward">' + rew + "</div>";
    h += '<div class="q-track"><div class="q-fill" style="width:' + pct + '%"></div></div>';
    h += '<div class="q-prog">' + Math.min(prog, q.target) + " / " + q.target + "</div></div><div class=\"cat-act\">";
    if (claimed) h += '<span class="tag on">Claimed</span>';
    else if (done) h += '<button type="button" class="btn btn-mini" data-act="claim" data-scope="' + scope + '" data-id="' + q.id + '">Claim</button>';
    else h += '<span class="tag">' + pct + "%</span>";
    h += "</div></div>";
    return h;
  }
  function questGroup(q) {
    if (q.category) return q.category;
    if (q.kind === "wave" || q.kind === "level") return "Campaign";
    if (q.kind === "boss" || q.kind === "bossCount" || q.kind === "bossTier" || q.kind === "bossRun" || q.kind === "bossesLife" || q.kind === "perfectLife") return "Boss Contracts";
    if (q.kind === "pickupLife" || q.kind === "coinsRun" || q.kind === "coinsLife" || q.kind === "ownShips" || q.kind === "ownGuns") return "Salvage & Collection";
    return "Combat Mastery";
  }
  function renderQuests() {
    ensureDailies();
    syncQuestProgress();
    var lists = el("quest-lists");
    if (!lists) return;
    var h = '<div class="cat-title">Daily Orders · resets at midnight</div>';
    var i, q, g, ids = profile.dailies.ids || [];
    var groups = ["Campaign", "Boss Contracts", "Combat Mastery", "Salvage & Collection", "Special Operations"], gi;
    for (i = 0; i < ids.length; i++) {
      q = dailyById(ids[i]);
      if (q) h += questRow(q, profile.dailies.progress[q.id] || 0, !!profile.dailies.claimed[q.id], "daily");
    }
    for (gi = 0; gi < groups.length; gi++) {
      g = groups[gi];
      h += '<div class="cat-title">' + g + "</div>";
      for (i = 0; i < LONG_DEFS.length; i++) {
        q = LONG_DEFS[i];
        if (questGroup(q) !== g) continue;
        if (!profile.longTerm[q.id]) profile.longTerm[q.id] = { progress: 0, claimed: false };
        h += questRow(q, profile.longTerm[q.id].progress || 0, !!profile.longTerm[q.id].claimed, "long");
      }
    }
    lists.innerHTML = h;
  }
  function renderSummaryQuests() {
    var list = el("summary-quests");
    var i, item, q, claimed, h = "";
    if (!list) return;
    if (!runQuestClaims.length) {
      list.innerHTML = '<div class="summary-quests-empty">No new quest rewards this run. Keep flying to complete the next one.</div>';
      return;
    }
    h += '<div class="summary-quest-title">Quest rewards ready</div><div class="summary-quest-hint">Claim the rewards you completed this run</div>';
    for (i = 0; i < runQuestClaims.length; i++) {
      item = runQuestClaims[i];
      q = item.q;
      claimed = item.scope === "daily" ? !!profile.dailies.claimed[q.id] : !!(profile.longTerm[q.id] && profile.longTerm[q.id].claimed);
      h += '<div class="summary-quest"><div class="summary-quest-info"><div class="cat-name">' + q.name + '</div><div class="cat-desc">' + q.desc + '</div><div class="q-reward">' + rewardText(q.reward) + '</div></div>';
      if (claimed) h += '<span class="summary-claimed">Claimed</span>';
      else h += '<button type="button" class="btn summary-claim" data-act="claim" data-scope="' + item.scope + '" data-id="' + q.id + '">Claim ' + rewardText(q.reward) + '</button>';
      h += "</div>";
    }
    list.innerHTML = h;
  }
  function renderRunSummary() {
    var body = el("summary-body");
    var data = summaryRun;
    var parts;
    if (!body || !data) return;
    if (data.pvp) {
      parts = [
        '<div class="summary-stats"><div><b>Result</b>' + (data.won ? "WIN" : "LOSS") + '</div><div><b>Rounds</b>' + data.scoreline + '</div><div><b>Mode</b>' + data.mode + '</div></div>'
      ];
      if (data.wager) {
        parts.push(data.won
          ? ("Pot +" + data.coinsGain + "c  ·  " + profile.coins + "c total")
          : ("Wager lost  ·  " + profile.coins + "c total"));
      } else {
        parts.push("+" + data.xpGain + " XP  ·  +" + data.coinsGain + "c  ·  Lv " + data.newLv + " " + levelTitle(data.newLv));
        parts.push(profile.coins + "c total");
      }
      if (disconnectNote) parts.unshift(disconnectNote);
      if (data.newLv > data.oldLv) parts.push('<span class="lvlup">LEVEL UP! ' + data.oldLv + " → " + data.newLv + "  ·  +" + data.lvCoins + "c</span>");
      body.innerHTML = parts.map(function (p) { return "<div>" + p + "</div>"; }).join("");
      var questBox = el("summary-quests");
      if (questBox) questBox.innerHTML = "";
      var again = el("btn-again");
      if (again) again.classList.add("hidden");
      var title = document.querySelector("#screen-summary .screen-title");
      if (title) title.textContent = data.won ? "Duel Won" : "Duel Lost";
      return;
    }
    var againBtn = el("btn-again");
    if (againBtn) againBtn.classList.remove("hidden");
    var sumTitle = document.querySelector("#screen-summary .screen-title");
    if (sumTitle) sumTitle.textContent = "Run Over";
    parts = [
      '<div class="summary-stats"><div><b>Score</b>' + score + '</div><div><b>Wave</b>' + run.maxWave + '</div><div><b>Enemies</b>' + (run.kills || 0) + '</div><div><b>Hits taken</b>' + (run.hits || 0) + '</div><div><b>Hull losses</b>' + (run.livesLost || 0) + '</div></div>',
      "+" + data.xpGain + " XP  ·  Lv " + data.newLv + " " + levelTitle(data.newLv),
      (playerCount() > 1 ? "Team coins " : "Coins ") + run.coins + " + " + data.bonus + " wave bonus  ·  " + profile.coins + "c total"
    ];
    if (disconnectNote) parts.unshift(disconnectNote);
    if (data.newLv > data.oldLv) parts.push('<span class="lvlup">LEVEL UP! ' + data.oldLv + " → " + data.newLv + "  ·  +" + data.lvCoins + "c</span>");
    if (playerCount() > 1) parts.push("Each player banks the full team coins and XP");
    if (run.perfectBosses) parts.push("Flawless bosses: " + run.perfectBosses);
    body.innerHTML = parts.map(function (p) { return "<div>" + p + "</div>"; }).join("");
    renderSummaryQuests();
  }
  function stopHubAnim() {
    if (hubRaf) { cancelAnimationFrame(hubRaf); hubRaf = 0; }
  }
  function startHubAnim() {
    stopHubAnim();
    var last = 0;
    function loop(ts) {
      if (uiScreen !== "hub" && uiScreen !== "hangar") { hubRaf = 0; return; }
      if (!last) last = ts;
      var dt = (ts - last) / 1000;
      if (dt > 0.05) dt = 0.05;
      last = ts;
      time += dt;
      var i;
      for (i = 0; i < stars.length; i++) {
        stars[i].y += stars[i].v * dt * 0.35;
        if (stars[i].y > H) { stars[i].y = 0; stars[i].x = Math.random() * W; }
      }
      if (uiScreen === "hangar") {
        hangarFireT -= dt;
        hangarMuzzle = Math.max(0, hangarMuzzle - dt * 4);
        if (hangarFireT <= 0) {
          hangarMuzzle = 1;
          hangarFireT = 0.9;
        }
        drawHangarPreview();
      } else {
        drawHubPreview();
      }
      hubRaf = requestAnimationFrame(loop);
    }
    hubRaf = requestAnimationFrame(loop);
  }
  function hangarStageSize() {
    var c = el("hangar-preview");
    var stage = el("hangar-stage");
    var cssW = 320, cssH = 160;
    if (stage && stage.clientWidth) cssW = stage.clientWidth;
    return { c: c, cssW: cssW, cssH: cssH };
  }
  function drawHangarStars(pctx, pw, ph) {
    var i, p;
    for (i = 0; i < stars.length; i++) {
      p = stars[i];
      pctx.globalAlpha = 0.35 + p.s * 0.35;
      pctx.fillStyle = "#c8e8ff";
      pctx.fillRect((p.x / W) * pw, (p.y / H) * ph, p.s, p.s);
    }
    pctx.globalAlpha = 1;
  }
  function hangarLoadout() {
    var view = hangarView();
    var shield = 0;
    if (view.mod === "barrier" || view.mod === "guardian") shield = 2;
    else if (view.mod === "reactor") shield = 0;
    return {
      ship: view.ship,
      gun: view.gun,
      mod: view.mod,
      skin: view.skin,
      shieldHp: shield,
      muzzle: hangarMuzzle,
      scale: 2
    };
  }
  function drawHangarPreview() {
    var size = hangarStageSize();
    var c = size.c;
    var pw = size.cssW, ph = size.cssH;
    var dpr, w, h, pctx, view, bob, cx, cy;
    if (!c) return;
    dpr = window.devicePixelRatio || 1;
    w = Math.max(1, Math.round(pw * dpr));
    h = Math.max(1, Math.round(ph * dpr));
    if (c.width !== w || c.height !== h) {
      c.width = w; c.height = h;
      c.style.width = pw + "px";
      c.style.height = ph + "px";
    }
    pctx = c.getContext("2d");
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pctx.fillStyle = "#050510";
    pctx.fillRect(0, 0, pw, ph);
    drawHangarStars(pctx, pw, ph);
    view = hangarView();
    bob = Math.sin(time * 2.2) * 3;
    cx = pw / 2;
    cy = ph / 2 + 8 + bob;
    drawHangarHotspots(pctx, pw, ph, cx, cy - bob);
    drawShip(pctx, cx, cy, false, hangarLoadout());
    drawHangarPaintPip(pctx, pw, hangarHover === "skin" || hangarTab === "skin");
    if (view.preview) {
      pctx.fillStyle = "#ffd23d";
      pctx.font = "700 9px ui-sans-serif, system-ui, sans-serif";
      pctx.textAlign = "left";
      pctx.fillText("PREVIEW", 8, ph - 8);
    }
  }
  function drawHangarPaintPip(pctx, pw, on) {
    var x = pw - 22, y = 22;
    pctx.save();
    pctx.globalAlpha = on ? 1 : 0.7;
    pctx.fillStyle = on ? "#7ef9ff" : "#1a2a50";
    pctx.beginPath();
    pctx.arc(x, y, 12, 0, Math.PI * 2);
    pctx.fill();
    pctx.strokeStyle = "#7ef9ff";
    pctx.lineWidth = 1.4;
    pctx.stroke();
    pctx.fillStyle = on ? "#041018" : "#7ef9ff";
    pctx.beginPath();
    pctx.arc(x - 3, y + 2, 5, 0, Math.PI * 2);
    pctx.fill();
    pctx.fillStyle = "#ffd23d";
    pctx.beginPath();
    pctx.arc(x + 4, y - 3, 3.2, 0, Math.PI * 2);
    pctx.fill();
    pctx.restore();
  }
  function drawHangarHotspots(pctx, pw, ph, cx, cy) {
    var marks = [
      { id: "gun", x: cx, y: cy - 36, lab: "GUN" },
      { id: "ship", x: cx, y: cy + 2, lab: "SHIP" },
      { id: "mod", x: cx, y: cy + 40, lab: "MOD" }
    ];
    var i, m, on;
    pctx.save();
    pctx.font = "700 8px ui-sans-serif, system-ui, sans-serif";
    pctx.textAlign = "center";
    for (i = 0; i < marks.length; i++) {
      m = marks[i];
      on = hangarHover === m.id || hangarTab === m.id;
      pctx.globalAlpha = on ? 0.9 : 0.35;
      pctx.strokeStyle = on ? "#7ef9ff" : "#3a4a80";
      pctx.lineWidth = on ? 1.6 : 1;
      pctx.beginPath();
      pctx.ellipse(m.x, m.y, m.id === "ship" ? 36 : 22, m.id === "ship" ? 16 : 10, 0, 0, Math.PI * 2);
      pctx.stroke();
      pctx.fillStyle = on ? "#7ef9ff" : "#9ab8ff";
      pctx.fillText(m.lab, m.x, m.y + (m.id === "gun" ? -16 : m.id === "mod" ? 18 : 28));
    }
    pctx.restore();
  }
  function hangarHotspotAt(cssX, cssY) {
    var size = hangarStageSize();
    var pw = size.cssW, ph = size.cssH;
    var dx = cssX - (pw - 22), dy = cssY - 22;
    var cx = pw / 2, cy = ph / 2 + 8;
    var lx, ly;
    if (dx * dx + dy * dy <= 16 * 16) return "skin";
    lx = cssX - cx;
    ly = cssY - cy;
    if (Math.abs(lx) > 56 || Math.abs(ly) > 58) return null;
    if (ly < -14) return "gun";
    if (ly > 22) return "mod";
    return "ship";
  }
  function hangarCanvasLocal(e, canvas) {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) * (canvas.clientWidth / rect.width),
      y: (e.clientY - rect.top) * (canvas.clientHeight / rect.height)
    };
  }
  function drawHubPreview() {
    var c = el("hub-preview");
    if (!c) return;
    var pw = 160, ph = 88;
    var dpr = window.devicePixelRatio || 1;
    var w = Math.max(1, Math.round(pw * dpr));
    var h = Math.max(1, Math.round(ph * dpr));
    var spec = profileLoadoutSpec();
    if (c.width !== w || c.height !== h) {
      c.width = w; c.height = h;
      c.style.width = pw + "px";
      c.style.height = ph + "px";
    }
    var pctx = c.getContext("2d");
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pctx.fillStyle = "#050510";
    pctx.fillRect(0, 0, pw, ph);
    drawHangarStars(pctx, pw, ph);
    drawShip(pctx, pw / 2, ph / 2 + 10, false, {
      ship: spec.ship,
      gun: spec.gun,
      mod: spec.mod,
      skin: spec.skin,
      shieldHp: spec.mod === "barrier" || spec.mod === "guardian" ? 2 : 0,
      muzzle: 0
    });
  }
  function showScreen(name) {
    uiScreen = name;
    if (name === "play") {
      overlay.classList.add("hidden");
      stopHubAnim();
      return;
    }
    overlay.classList.remove("hidden");
    var ids = ["hub", "hangar", "quests", "ranks", "lobby", "pause", "summary"];
    var i;
    for (i = 0; i < ids.length; i++) {
      var node = el("screen-" + ids[i]);
      if (node) node.classList.toggle("hidden", ids[i] !== name);
    }
    if (name === "hub") { renderHub(); startHubAnim(); }
    else if (name === "hangar") { renderHangar(); startHubAnim(); }
    else {
      stopHubAnim();
      if (name === "quests") { setResetConfirm(false); renderQuests(); }
      if (name === "ranks") refreshRanks();
      if (name === "lobby") renderLobby();
    }
  }
  function overlayVisible() { return !overlay.classList.contains("hidden"); }

  function finishPvpRun(winnerSlot, pay, showSummary) {
    var sess = pvpS();
    var api = pvpApi();
    var won, coinsGain, xpGain, oldLv, newLv, lvCoins, l;
    if (runFinished) return;
    runFinished = true;
    gameOver = true;
    paused = true;
    started = false;
    if (sess) {
      sess.matchOver = true;
      sess.started = false;
    }
    stopMusic();
    sfxOver();
    stopLoop();
    pay = pay || (api ? api.payout(winnerSlot) : {});
    won = winnerSlot === localSlot;
    coinsGain = won ? (pay.winnerCoins || 0) : (pay.loserCoins || 0);
    xpGain = won ? (pay.winnerXp || 0) : (pay.loserXp || 0);
    oldLv = xpLevel(profile.totalXp);
    profile.totalXp += xpGain;
    newLv = xpLevel(profile.totalXp);
    lvCoins = 0;
    for (l = oldLv + 1; l <= newLv; l++) lvCoins += levelReward(l);
    profile.coins += coinsGain + lvCoins;
    profile.stats.coinsEarned = (profile.stats.coinsEarned || 0) + coinsGain + lvCoins;
    profile.stats.runs = (profile.stats.runs || 0) + 1;
    summaryRun = {
      pvp: true,
      won: won,
      wager: !!(pay.wager),
      scoreline: (sess ? (sess.wins[0] || 0) + "–" + (sess.wins[1] || 0) : "0–0"),
      mode: sess ? sess.mode : "normal",
      xpGain: xpGain,
      coinsGain: coinsGain,
      oldLv: oldLv,
      newLv: newLv,
      lvCoins: lvCoins
    };
    saveProfile();
    updateHud();
    syncPvpHudChrome();
    if (showSummary) {
      renderRunSummary();
      showScreen("summary");
    } else {
      showScreen("hub");
    }
    disconnectNote = "";
    draw();
  }
  function finishRun(showSummary) {
    if (isPvpMatch() || (pvpS() && pvpS().matchOver && !runFinished && isPvp())) {
      var api = pvpApi();
      var winner = api ? api.matchWinner() : -1;
      if (winner < 0) winner = localSlot === 0 ? 1 : 0;
      finishPvpRun(winner, api ? api.payout(winner) : null, showSummary);
      return;
    }
    if (runFinished) return;
    runFinished = true;
    gameOver = true;
    paused = true;
    started = false;
    stopMusic();
    sfxOver();
    stopLoop();
    if (netRole === "host" && !coopOverSent) {
      coopOverSent = true;
      netSend({
        t: "over",
        score: score,
        maxWave: run.maxWave,
        coins: run.coins,
        hits: run.hits,
        kills: run.kills,
        perfectBosses: run.perfectBosses,
        livesLost: run.livesLost,
        pickups: run.pickups
      });
    }
    var xpGain = Math.round(score * XP_SCORE_MUL * (hasMod("ascension") ? 1.25 : 1));
    var oldLv = xpLevel(profile.totalXp);
    profile.totalXp += xpGain;
    var newLv = xpLevel(profile.totalXp);
    var lvCoins = 0, l;
    for (l = oldLv + 1; l <= newLv; l++) lvCoins += levelReward(l);
    var bonus = waveBonusCoins();
    // Team coins and score/XP are duplicated, not split: 30 collected → 30 banked on every device.
    profile.coins += run.coins + bonus + lvCoins;
    profile.stats.coinsEarned = (profile.stats.coinsEarned || 0) + (run.coins || 0) + bonus + lvCoins;
    profile.stats.runs = (profile.stats.runs || 0) + 1;
    if (score > profile.best) profile.best = score;
    best = profile.best;
    syncQuestProgress();
    runQuestClaims = completedRunQuests();
    summaryRun = { xpGain: xpGain, oldLv: oldLv, newLv: newLv, lvCoins: lvCoins, bonus: bonus };
    saveProfile();
    updateHud();
    submitLeaderboard();
    if (showSummary) {
      renderRunSummary();
      showScreen("summary");
    } else {
      showScreen("hub");
    }
    disconnectNote = "";
    draw();
  }
  function endGame() { finishRun(true); }
  function stopLoop() { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }
  function startLoop() { stopLoop(); lastTs = 0; rafId = requestAnimationFrame(tick); }
  function resetInput() {
    input.left = false; input.right = false; input.fire = false; input.ability = false; input.holdL = 0; input.holdR = 0;
    pointerSteer.id = 0; pointerSteer.aimX = null; pointerSteer.fire = false;
    var i;
    for (i = 0; i < players.length; i++) {
      if (!players[i] || players[i].slot !== localSlot) continue;
      players[i].input.left = false; players[i].input.right = false; players[i].input.fire = false; players[i].input.ability = false;
      players[i].input.holdL = 0; players[i].input.holdR = 0; players[i].input.aimX = null;
    }
  }

  function applyShipPassives(p) {
    var s = shipDef(p);
    if (s.startShield) {
      p.shieldHp = s.startShield;
      p.shieldT = 0;
    }
    if (hasMod("barrier", p)) {
      p.shieldHp = Math.max(p.shieldHp, 2);
      p.shieldT = 0;
    }
    resetSkinWave(p);
  }

  function startNewGame(opts) {
    opts = opts || {};
    if (netRole === "client" && !opts.fromNet) return;
    ensureAudio();
    score = 0;
    coopOverSent = false;
    disconnectNote = "";
    snapBuf = [];
    netEvents = [];
    snapAcc = 0;
    snapSeq = 0;
    lastSnapN = 0;
    clientClock = 0;
    hostOffset = 0;
    hostClockReady = false;
    interpDelay = 0.055;
    nextEntId = 1;
    evSeq = 0;
    lastEvN = 0;
    inputAcc = 0;
    inputSeq = 0;
    lastInputN = 0;
    lastInputNBySlot = [0, 0];
    lastInputKey = "";
    pendingPickAt = {};
    pickSeq = 0;
    var specs = opts.coopPlayers;
    if (!specs) specs = [profileLoadoutSpec()];
    lastCoopSpecs = (!opts.pvp && specs.length > 1) ? specs : null;
    lastPvpSpecs = opts.pvp ? specs : lastPvpSpecs;
    players = [];
    var i, p, s;
    var pvpMode = !!(opts.pvp || (isPvp() && opts.pvp !== false && netRole));
    if (opts.pvp && pvpApi()) pvpApi().markStarted();
    for (i = 0; i < specs.length; i++) {
      p = makePlayer(i, specs[i], specs.length);
      p.x = spawnXFor(i, specs.length);
      p.targetX = p.x;
      if (pvpMode || isPvpMatch()) applyPvpLayout(p);
      applyShipPassives(p);
      if (p.boss) { p.shieldHp = 0; p.shieldT = 0; p.lives = 1; }
      players.push(p);
    }
    if (opts.localSlot != null) localSlot = opts.localSlot;
    if (netRole === "client") localSlot = 1;
    else if (netRole === "host") localSlot = 0;
    else localSlot = 0;
    syncLocalPlayer();
    s = shipDef(player);
    lives = player ? player.lives : loadoutLives(s);
    wave = 1;
    gameOver = false; started = true; paused = false; runFinished = false;
    pbul = []; ebul = []; particles = []; rings = []; pickups = []; teles = [];
    enemies = [];
    skinDecoys = [];
    shake = 0; flash = 0; time = 0;
    waveHold = 0;
    run = emptyRun();
    runQuestClaims = [];
    summaryRun = null;
    ensureDailies();
    snapshotDailies();
    resetInput();
    makeStars();
    syncPvpHudChrome();
    if (pvpApi() && pvpApi().isMatch() && pvpApi().session().wager && !pvpApi().session().deducted) {
      profile.coins = Math.max(0, profile.coins - (pvpApi().session().stake || 0));
      pvpApi().markDeducted();
      saveProfile();
    }
    var skipReached = opts.fromNet ? 9999 : undefined;
    var startN = opts.startWave != null ? clampStartWave(opts.startWave, MAX_LEVEL, skipReached) : preferredStartWave();
    if (opts.pvp || (pvpApi() && pvpApi().isMatch())) {
      if (netRole === "host" && specs.length > 1) {
        netSend({
          t: "pvpstart",
          players: specs,
          mode: pvpS().mode,
          round: pvpS().round,
          wins: pvpS().wins.slice(),
          bosses: pvpS().bosses.slice(),
          wager: !!pvpS().wager,
          stake: pvpS().stake || 0
        });
      }
    } else {
      startN = applySkipState(startN, skipReached);
      if (netRole === "host" && specs.length > 1) netSend({ t: "start", players: specs, startWave: startN });
      if (netRole !== "client") spawnWave(startN);
    }
    startMusic();
    showScreen("play");
    startLoop();
    updateHud();
    focusGame();
  }
  function resumeGame(fromNet) {
    if (netRole === "client" && !fromNet) {
      netSend({ t: "resume" });
      return;
    }
    if (gameOver || !started) { startNewGame(); return; }
    paused = false; lastTs = 0;
    resetInput();
    startMusic();
    showScreen("play");
    startLoop();
    focusGame();
    if (netRole === "host" && !fromNet) netSend({ t: "resume" });
  }
  function pauseGame(fromNet) {
    if (!started || gameOver || paused) return;
    paused = true;
    stopMusic();
    stopLoop();
    resetInput();
    var sub = el("pause-sub");
    if (sub) sub.textContent = "Score " + score;
    showScreen("pause");
    if (netRole && !fromNet) netSend({ t: "pause" });
  }
  function quitToHub() {
    if (started && !runFinished) finishRun(false);
    leaveNet();
    if (pvpApi()) pvpApi().reset("coop");
    syncPvpHudChrome();
    showScreen("hub");
  }

  function leaveNet() {
    netRole = null;
    lobbyGuest = null;
    localSlot = 0;
    snapBuf = [];
    hostClockReady = false;
    if (window.__net) window.__net.close();
  }

  function setLobbyErr(msg) {
    lobbyErr = msg || "";
    var nodes = [el("lobby-err-host"), el("lobby-err-join")];
    var i, node;
    for (i = 0; i < nodes.length; i++) {
      node = nodes[i];
      if (!node) continue;
      node.textContent = lobbyErr;
      node.classList.toggle("hidden", !lobbyErr);
    }
  }

  function showLobbyPanel(name) {
    var ids = ["pick", "host", "join", "ready"];
    var i, node;
    lobbyMode = name;
    for (i = 0; i < ids.length; i++) {
      node = el("lobby-" + ids[i]);
      if (node) node.classList.toggle("hidden", ids[i] !== name);
    }
    if (name === "join") {
      var wait = el("lobby-join-wait");
      if (wait) wait.classList.add("hidden");
      var inp = el("lobby-code-in");
      if (inp) {
        setTimeout(function () {
          try { inp.focus(); inp.select(); } catch (err) {}
        }, 0);
      }
    }
  }

  function renderLobbyPlayers(list) {
    var box = el("lobby-players");
    if (!box) return;
    var html = "", i, spec, who, paint;
    list = list || [];
    for (i = 0; i < list.length; i++) {
      spec = list[i].loadout || list[i];
      paint = skinPaint(spec.ship || "wisp", spec.skin || "stock");
      who = i === 0 ? "P1  ·  Host" : "P2  ·  Guest";
      html += '<div class="lobby-row"><span class="lobby-swatch" style="background:' + paint.hull + ";color:" + paint.hull + '"></span><div><div class="lobby-row-name">' + who + '</div><div class="lobby-row-load">' + loadoutLabel(spec) + "</div></div></div>";
    }
    box.innerHTML = html;
  }

  function pvpCatalogs() {
    return { ships: SHIPS, mods: MODS, skins: SKIN_TIERS, guns: GUNS };
  }
  function pvpFindItem(cat, id) {
    if (cat === "ship") return findShip(id);
    if (cat === "gun") return findGun(id);
    if (cat === "mod") return findMod(id);
    if (cat === "skin") return findSkin(id);
    return null;
  }
  function pvpBroadcast() {
    var api = pvpApi();
    if (!api || netRole !== "host") return;
    netSend({ t: "pvp", state: api.snapshot() });
  }
  function pvpEnsurePacks() {
    var api = pvpApi();
    var sess;
    if (!api) return;
    sess = api.session();
    if (!sess.packs) sess.packs = api.makeDraftPacks(pvpCatalogs(), sess.seed);
  }
  function pvpLoadoutFor(slot) {
    var sess = pvpS();
    var picks, spec;
    if (!sess) return profileLoadoutSpec();
    if (sess.mode === "draft") {
      picks = sess.picks[slot] || {};
      return {
        ship: picks.ship || "wisp",
        gun: picks.gun || "pulse",
        mod: picks.mod || null,
        skin: picks.skin || "stock"
      };
    }
    if (sess.mode === "insane") {
      spec = profileLoadoutSpec();
      spec.boss = sess.bosses[slot];
      return spec;
    }
    if (slot === 0) return profileLoadoutSpec();
    return (lobbyGuest && lobbyGuest.loadout) || profileLoadoutSpec();
  }
  function renderPvpDraft() {
    var api = pvpApi();
    var sess = pvpS();
    var box = el("lobby-pvp-draft");
    var cards = el("lobby-pvp-draft-cards");
    var lab = el("lobby-pvp-draft-lab");
    var cat, ids, i, def, html, mine;
    if (!box || !api || !sess || sess.mode !== "draft") {
      if (box) box.classList.add("hidden");
      return;
    }
    pvpEnsurePacks();
    mine = localSlot;
    if (api.draftDone(mine)) {
      box.classList.add("hidden");
      return;
    }
    cat = api.draftCat(mine);
    ids = (sess.packs && sess.packs[cat]) || [];
    box.classList.remove("hidden");
    if (lab) lab.textContent = "Pick a " + cat;
    html = "";
    for (i = 0; i < ids.length; i++) {
      def = pvpFindItem(cat, ids[i]) || { name: ids[i], desc: "" };
      html += '<button type="button" class="pvp-card" data-pvp-draft="' + cat + '" data-id="' + ids[i] + '"><div><div class="pvp-card-name">' + def.name + '</div><div class="pvp-card-desc">' + (def.desc || rarityLabel(def.rarity || "common")) + "</div></div></button>";
    }
    if (cards) cards.innerHTML = html;
  }
  function renderPvpBosses() {
    var api = pvpApi();
    var sess = pvpS();
    var box = el("lobby-pvp-boss");
    var cards = el("lobby-pvp-boss-cards");
    var tut = el("lobby-pvp-tutorial");
    var html = "", i, id, d, picked, kit;
    if (!box) return;
    if (!api || !sess || sess.mode !== "insane") {
      box.classList.add("hidden");
      if (tut) tut.classList.add("hidden");
      return;
    }
    picked = sess.bosses[localSlot];
    if (picked && !sess.tutorials[localSlot]) {
      box.classList.add("hidden");
      if (tut) {
        kit = api.kitFor(picked);
        d = bossDef(picked);
        tut.classList.remove("hidden");
        if (el("pvp-tutorial-name")) el("pvp-tutorial-name").textContent = d ? d.name : picked;
        if (el("pvp-tutorial-fire")) el("pvp-tutorial-fire").textContent = kit.fireHint;
        if (el("pvp-tutorial-ability")) el("pvp-tutorial-ability").textContent = kit.abilityHint;
      }
      return;
    }
    if (tut) tut.classList.add("hidden");
    if (picked && sess.tutorials[localSlot]) {
      box.classList.add("hidden");
      return;
    }
    box.classList.remove("hidden");
    html = "";
    for (i = 0; i < api.BOSS_IDS.length; i++) {
      id = api.BOSS_IDS[i];
      d = bossDef(id);
      html += '<button type="button" class="pvp-card' + (picked === id ? " picked" : "") + '" data-pvp-boss="' + id + '"><span class="lobby-swatch" style="background:' + (d ? d.color : "#fff") + '"></span><div><div class="pvp-card-name">' + (d ? d.name : id) + '</div><div class="pvp-card-desc">' + (d && d.flavor ? d.flavor : "") + "</div></div></button>";
    }
    if (cards) cards.innerHTML = html;
  }
  function pvpStatusText() {
    var api = pvpApi();
    var sess = pvpS();
    if (!api || !sess) return "";
    if (sess.wager && !api.bothBidsLocked()) {
      if (sess.bids[localSlot] == null) return "Lock your wager bid.";
      return "Waiting for their bid…";
    }
    if (sess.mode === "draft" && !api.bothDraftDone()) {
      if (!api.draftDone(localSlot)) return "Draft your loadout.";
      return "Waiting for their draft…";
    }
    if (sess.mode === "insane") {
      if (!sess.bosses[localSlot]) return "Pick your boss.";
      if (!sess.tutorials[localSlot]) return "Read the ability tips.";
      if (!api.bothBossesPicked() || !api.bothTutorialsDone()) return "Waiting for them to pick…";
    }
    if (netRole !== "host") return "Waiting for host to start…";
    return "Best of 3. Host starts when ready.";
  }
  function syncPvpLobbyUi() {
    var api = pvpApi();
    var sess = pvpS();
    var pvpBox = el("lobby-pvp-box");
    var waveBox = el("lobby-start-wave-box");
    var host = netRole === "host";
    var modes = el("lobby-pvp-modes");
    var hint = el("lobby-pvp-mode-hint");
    var wagerLab = el("lobby-pvp-wager-lab");
    var wagerBox = el("lobby-pvp-wager-box");
    var wagerChk = el("lobby-pvp-wager");
    var bidIn = el("lobby-pvp-bid");
    var stakeEl = el("lobby-pvp-stake");
    var status = el("lobby-pvp-status");
    var startBtn = el("btn-lobby-start");
    var i, btn;
    if (!pvpBox || !api) return;
    pvpBox.classList.toggle("hidden", !isPvp());
    if (waveBox) waveBox.classList.toggle("hidden", isPvp());
    if (!isPvp() || !sess) return;
    if (modes) {
      for (i = 0; i < modes.children.length; i++) {
        btn = modes.children[i];
        btn.classList.toggle("active", btn.getAttribute("data-pvp-mode") === sess.mode);
        btn.disabled = !host;
      }
    }
    if (hint) {
      hint.textContent = sess.mode === "draft"
        ? "Same 3 options each. Pick ship, mod, paint, gun."
        : sess.mode === "insane"
          ? "Fight as a boss. Same roster, duplicate picks allowed."
          : "Bring your hangar ship, gun, mod, and paint.";
    }
    if (wagerLab) wagerLab.classList.toggle("hidden", !host && !sess.wager);
    if (wagerChk) {
      wagerChk.checked = !!sess.wager;
      wagerChk.disabled = !host;
    }
    if (wagerBox) wagerBox.classList.toggle("hidden", !sess.wager);
    if (sess.wager && bidIn && document.activeElement !== bidIn) {
      if (sess.bids[localSlot] != null) bidIn.value = String(sess.bids[localSlot]);
      bidIn.max = String(profile.coins || 0);
    }
    if (stakeEl) {
      if (!sess.wager) stakeEl.textContent = "";
      else if (!api.bothBidsLocked()) stakeEl.textContent = "You have " + (profile.coins || 0) + "c. Stake is the lower bid.";
      else stakeEl.textContent = "Wager: " + sess.stake + "c each  ·  pot " + (sess.stake * 2) + "c";
    }
    renderPvpDraft();
    renderPvpBosses();
    if (status) status.textContent = pvpStatusText();
    if (startBtn && isPvp()) {
      startBtn.classList.toggle("hidden", !host);
      startBtn.disabled = !host || !lobbyGuest || !api.canStart();
    }
  }

  function renderLobby() {
    var codeEl = el("lobby-code");
    var startBtn = el("btn-lobby-start");
    var waitEl = el("lobby-wait-start");
    var title = el("lobby-pick-title");
    var help = el("lobby-pick-help");
    if (title) title.textContent = isPvp() ? "PvP" : "Co-op";
    if (help) {
      help.textContent = isPvp()
        ? "Mirrored 1v1, best of 3. One of you hosts. The other joins with a code. Same connection as co-op."
        : "Two ships, same waves. One of you hosts. The other joins with a code. Both devices need internet — they do not have to see each other on the LAN.";
    }
    if (codeEl) codeEl.textContent = (window.__net && window.__net.code()) || "----";
    if (startBtn) startBtn.classList.toggle("hidden", netRole !== "host");
    if (waitEl) waitEl.classList.toggle("hidden", netRole === "host" || lobbyMode !== "ready");
    if (!isPvp()) renderStartWavePicker("lobby-start-wave-opts", netRole !== "host");
    syncPvpLobbyUi();
    setLobbyErr(lobbyErr);
  }

  function updateLobbyLink(info) {
    var t = (info && info.transport) || netTransport();
    var text = t === "mqtt" ? "Slow relay — still trying a faster link…" : "";
    var node = el("lobby-link");
    if (node) {
      node.textContent = text;
      node.classList.toggle("hidden", !text);
    }
    var hostWait = el("lobby-host-wait");
    if (hostWait && lobbyMode === "host") {
      hostWait.textContent = text || "Waiting for them to join… keep this screen open.";
    }
    var joinWait = el("lobby-join-wait");
    if (joinWait && lobbyMode === "join" && text) {
      joinWait.textContent = text;
      joinWait.classList.remove("hidden");
    }
  }

  function openLobby(kind) {
    bindNet();
    leaveNet();
    setLobbyErr("");
    if (pvpApi()) pvpApi().reset(kind === "pvp" ? "pvp" : "coop");
    showLobbyPanel("pick");
    renderLobby();
    showScreen("lobby");
  }

  function lobbyHost() {
    bindNet();
    setLobbyErr("");
    netRole = "host";
    localSlot = 0;
    lobbyGuest = null;
    if (isPvp() && pvpApi()) pvpApi().newSeed();
    showLobbyPanel("host");
    renderLobby();
    window.__net.host(function (code) {
      var node = el("lobby-code");
      if (node) node.textContent = code;
    });
  }

  function lobbyJoinGo() {
    var inp = el("lobby-code-in");
    var code = inp ? inp.value : "";
    var wait = el("lobby-join-wait");
    bindNet();
    setLobbyErr("");
    netRole = "client";
    localSlot = 1;
    if (wait) wait.classList.remove("hidden");
    window.__net.join(code);
  }

  function lobbyStart() {
    if (netRole !== "host" || !lobbyGuest) return;
    if (isPvp()) {
      if (!pvpApi() || !pvpApi().canStart()) return;
      startNewGame({ pvp: true, coopPlayers: [pvpLoadoutFor(0), pvpLoadoutFor(1)] });
      return;
    }
    startNewGame({ coopPlayers: [profileLoadoutSpec(), lobbyGuest.loadout] });
  }

  function snapEn(e) {
    return {
      id: e.id, x: e.x, y: e.y, type: e.type, alive: e.alive ? 1 : 0, state: e.state || "",
      hitFlash: e.hitFlash || 0, healFlash: e.healFlash || 0, isBoss: e.isBoss ? 1 : 0,
      hp: e.hp, maxHp: e.maxHp, tier: e.tier || 0, phaseIdx: e.phaseIdx || 0,
      shieldHp: e.shieldHp || 0, r: e.r || 8, leech: e.leech ? 1 : 0, leechHp: e.leechHp || 0,
      phase: e.phase || 0
    };
  }
  function snapPb(b) {
    return {
      id: b.id, x: b.x, y: b.y, vx: b.vx || 0, vy: b.vy || 0, r: b.r || 2,
      gun: b.gun || "pulse", pierce: b.pierce || 0, homing: b.homing ? 1 : 0,
      bolt: b.bolt ? 1 : 0, splash: b.splash ? 1 : 0, helix: b.helix ? 1 : 0,
      owner: b.owner || 0
    };
  }
  function snapEb(b) {
    return {
      id: b.id, x: b.x, y: b.y, vx: b.vx || 0, vy: b.vy || 0, r: b.r || 2.3,
      color: b.color || "#ffd0e0", glow: b.glow || "#ff6b9a", mine: b.mine ? 1 : 0,
      owner: b.owner == null ? 255 : b.owner
    };
  }
  function snapPk(p) {
    return { id: p.id, x: p.x, y: p.y, kind: p.kind, amount: p.amount || 1, bob: p.bob || 0 };
  }
  function snapTe(t) {
    return { kind: t.kind, x: t.x, y: t.y, x2: t.x2, y2: t.y2, t: t.t || 0, max: t.max, color: t.color };
  }
  function snapPl(p) {
    var lo = p.loadout || {};
    return {
      slot: p.slot, x: p.x, y: p.y, alive: p.alive ? 1 : 0, invuln: p.invuln || 0,
      muzzle: p.muzzle || 0, shieldHp: p.shieldHp || 0, weapon: p.weapon || "normal",
      weaponT: p.weaponT || 0, speedT: p.speedT || 0, lives: p.lives, r: p.r,
      slowT: p.slowT || 0, jamT: p.jamT || 0, ship: lo.ship || "wisp", gun: lo.gun || "pulse",
      mod: lo.mod || null, skin: lo.skin || "stock", targetX: p.targetX != null ? p.targetX : p.x,
      hp: p.hp || 0, maxHp: p.maxHp || 0, facing: p.facing || -1, boss: p.boss || ""
    };
  }
  function applyPlayerSnap(row) {
    var slot = row.slot;
    var p = players[slot];
    var spec = { ship: row.ship, gun: row.gun, mod: row.mod, skin: row.skin || "stock" };
    if (!p) {
      p = makePlayer(slot, spec);
      players[slot] = p;
    }
    p.loadout = spec;
    p.hostX = row.x;
    if (slot !== localSlot && !p.netPlaced) {
      p.x = row.x;
      p.targetX = row.targetX != null ? row.targetX : row.x;
      p.netPlaced = true;
    }
    p.y = row.y;
    p.alive = !!row.alive;
    p.invuln = row.invuln;
    p.muzzle = row.muzzle;
    p.shieldHp = row.shieldHp;
    p.weapon = row.weapon;
    p.weaponT = row.weaponT;
    p.speedT = row.speedT;
    p.lives = row.lives;
    p.r = row.r;
    p.slowT = row.slowT;
    p.jamT = row.jamT || 0;
    if (row.hp != null) p.hp = row.hp;
    if (row.maxHp != null) p.maxHp = row.maxHp;
    if (row.facing) p.facing = row.facing;
    if (row.boss) {
      p.boss = row.boss;
      p.loadout.boss = row.boss;
    }
  }
  function fillLive(dest, src, keep) {
    var i, n = 0;
    src = src || [];
    for (i = 0; i < src.length; i++) {
      if (keep && !keep(src[i])) continue;
      dest[n] = src[i];
      n += 1;
    }
    dest.length = n;
    return dest;
  }
  function adoptList(dest, src) {
    var i;
    dest = dest || [];
    src = src || [];
    for (i = 0; i < src.length; i++) dest[i] = src[i];
    dest.length = src.length;
    return dest;
  }
  function buildSnap() {
    return {
      sc: score, rc: run.coins, w: wave, sh: shake, fl: flash, tm: time,
      bn: banner,
      en: fillLive(snapLists.en, enemies, function (e) { return e.alive; }),
      pb: fillLive(snapLists.pb, pbul, function (b) { return !b.ghost; }),
      eb: fillLive(snapLists.eb, ebul, null),
      pk: fillLive(snapLists.pk, pickups, null),
      te: fillLive(snapLists.te, teles, null),
      pl: fillLive(snapLists.pl, players, null)
    };
  }
  function indexById(list) {
    var m = {}, i, it;
    list = list || [];
    for (i = 0; i < list.length; i++) {
      it = list[i];
      if (it && it.id != null) m[it.id] = it;
    }
    return m;
  }
  function copyEntInto(o, src) {
    var k;
    for (k in o) {
      if (!Object.prototype.hasOwnProperty.call(src, k)) delete o[k];
    }
    for (k in src) o[k] = src[k];
    return o;
  }
  function interpKeyed(dest, aList, bList, t, extra, skipOwner, isPb) {
    var am = indexById(aList || []);
    var i, b, a, o, n = 0;
    dest = dest || [];
    bList = bList || [];
    for (i = 0; i < bList.length; i++) {
      b = bList[i];
      if (isPb && skipOwner >= 0 && b.owner === skipOwner) continue;
      a = b.id != null ? am[b.id] : null;
      o = dest[n] || {};
      copyEntInto(o, b);
      if (a) {
        o.x = a.x + (b.x - a.x) * t;
        o.y = a.y + (b.y - a.y) * t;
      }
      if (extra && (b.vx || b.vy)) {
        o.x += (b.vx || 0) * extra;
        o.y += (b.vy || 0) * extra;
      }
      if (o.splash && typeof o.splash !== "object") o.splash = { r: 34, dmg: 2 };
      dest[n] = o;
      n += 1;
    }
    dest.length = n;
    return dest;
  }
  function snapHz() {
    return netTransport() === "mqtt" ? 12 : 30;
  }
  function onSnapMsg(msg) {
    var s = msg && msg.s;
    var now, est, targetDelay;
    if (!s) return;
    if (msg.n && msg.n < lastSnapN) return;
    if (msg.n) lastSnapN = msg.n;
    now = clientClock;
    snapBuf.push({ n: msg.n || 0, tm: s.tm, s: s, recv: now });
    while (snapBuf.length > 4) snapBuf.shift();
    est = s.tm - now;
    if (!hostClockReady) {
      hostOffset = est;
      hostClockReady = true;
    } else {
      hostOffset += (est - hostOffset) * 0.2;
    }
    targetDelay = 1.5 / snapHz();
    if (targetDelay < 0.045) targetDelay = 0.045;
    if (targetDelay > 0.12) targetDelay = 0.12;
    interpDelay += (targetDelay - interpDelay) * 0.15;
  }
  function applyInterp(rt) {
    var a = null, b = null, i, t, extra = 0, sa, sb;
    if (!snapBuf.length) return;
    if (rt <= snapBuf[0].tm) {
      b = snapBuf[0];
      t = 1;
    } else if (rt >= snapBuf[snapBuf.length - 1].tm) {
      a = snapBuf.length > 1 ? snapBuf[snapBuf.length - 2] : null;
      b = snapBuf[snapBuf.length - 1];
      t = 1;
      extra = rt - b.tm;
      if (extra > 0.12) extra = 0.12;
    } else {
      for (i = 1; i < snapBuf.length; i++) {
        if (snapBuf[i].tm >= rt) {
          a = snapBuf[i - 1];
          b = snapBuf[i];
          break;
        }
      }
      t = (rt - a.tm) / Math.max(0.0001, b.tm - a.tm);
      if (t < 0) t = 0;
      if (t > 1) t = 1;
    }
    sa = a ? a.s : null;
    sb = b.s;
    score = sb.sc;
    if (sb.rc != null) run.coins = sb.rc;
    wave = sb.w;
    shake = sa ? lerp(sa.sh, sb.sh, t) : sb.sh;
    flash = sa ? lerp(sa.fl, sb.fl, t) : sb.fl;
    time = sa ? lerp(sa.tm, sb.tm, t) : sb.tm;
    banner = localizePvpSnapBanner(sb.bn);
    enemies = interpKeyed(enemies, sa && sa.en, sb.en, t, 0, -1, false);
    pbul = interpKeyed(viewPb, sa && sa.pb, sb.pb, t, extra, localSlot, true);
    ebul = interpKeyed(ebul, sa && sa.eb, sb.eb, t, extra, -1, false);
    pickups = interpKeyed(pickups, sa && sa.pk, sb.pk, t, 0, -1, false);
    teles = adoptList(teles, sb.te || []);
    for (i = 0; i < (sb.pl || []).length; i++) applyPlayerSnap(sb.pl[i]);
    syncLocalPlayer();
    if (netRole === "client") hideClaimedPickups();
    updateHud();
  }
  function advanceNetWorld(dt) {
    var ghosts = [], i;
    clientClock += dt;
    for (i = 0; i < pbul.length; i++) {
      if (pbul[i] && pbul[i].ghost) ghosts.push(pbul[i]);
    }
    if (snapBuf.length) applyInterp(clientClock + hostOffset - interpDelay);
    if (ghosts.length) pbul = ghosts.concat(pbul);
    updateClientFx(dt);
  }
  function sparkHit(x, y) {
    var i, a, sp;
    for (i = 0; i < 6; i++) {
      a = Math.random() * Math.PI * 2;
      sp = rand(40, 110);
      particles.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(0.15, 0.32), color: i % 2 ? "#ffffff" : "#7ef9ff", size: rand(1, 2.2)
      });
    }
  }
  function applyNetEvents(evs) {
    var i, ev, name;
    if (!evs || !evs.length) return;
    netReplay = true;
    for (i = 0; i < evs.length; i++) {
      ev = evs[i];
      if (!ev) continue;
      if (ev[0] === "ex") explode(ev[1], ev[2], ev[3], ev[4]);
      else if (ev[0] === "nova") novaBurst(ev[1], ev[2], ev[3] || 6, ev[4]);
      else if (ev[0] === "sfx") {
        name = ev[1];
        if (name === "shoot") {
          if (ev[2] != null && ev[2] === localSlot) continue;
          sfxShoot();
        } else if (name === "eshot") sfxEnemyShot();
        else if (name === "hit") sfxHit();
        else if (name === "dive") sfxDive();
        else if (name === "tele") sfxTele();
        else if (name === "wave") sfxWave(ev[2]);
        else if (name === "pick") sfxPickup();
        else if (name === "life") sfxLife();
        else if (name === "coin") sfxCoin();
        else if (name === "armor") sfxArmor();
        else if (name === "tick") sfxTick();
      }
    }
    netReplay = false;
  }
  function netTransport() {
    return window.__net && window.__net.transport ? window.__net.transport() : null;
  }
  function sendSnap(dt) {
    var hz, n;
    if (netRole !== "host") return;
    n = window.__net;
    if (!n || !n.isConnected()) return;
    hz = snapHz();
    snapAcc += dt;
    if (snapAcc < 1 / hz) return;
    snapAcc = 0;
    snapSeq += 1;
    netSend({ t: "snap", n: snapSeq, s: buildSnap() });
  }
  function flushNetEvents() {
    if (netRole !== "host" || !netEvents.length) return;
    evSeq += 1;
    netSend({ t: "ev", n: evSeq, ev: netEvents.slice() });
    netEvents = [];
  }
  function sendLocalInput(dt) {
    var key, hz, p;
    if (!netRole) return;
    copyLocalInput();
    p = players[localSlot];
    inputAcc += dt;
    hz = netTransport() === "mqtt" ? 12 : 60;
    key = String(localSlot) + (input.left ? "1" : "0") + (input.right ? "1" : "0") + ((input.fire || pointerSteer.fire) ? "1" : "0") + (input.ability ? "1" : "0") + (pointerSteer.aimX == null ? "" : Math.round(pointerSteer.aimX));
    if (key !== lastInputKey || inputAcc >= 1 / hz) {
      lastInputKey = key;
      inputAcc = 0;
      inputSeq += 1;
      netSend({
        t: "input", n: inputSeq, slot: localSlot,
        l: !!(p && p.input.left), r: !!(p && p.input.right),
        f: !!(p && p.input.fire), a: !!(p && p.input.ability), aimX: p ? p.input.aimX : null,
        x: p ? p.x : null, targetX: p ? p.targetX : null
      });
    }
  }
  function updateClientFx(dt) {
    var i, p, b, e, j, consumed, br, hid, dx;
    shake *= Math.exp(-dt * 7);
    if (shake < 0.05) shake = 0;
    flash *= Math.exp(-dt * 8);
    if (banner) { banner.life -= dt; if (banner.life <= 0) banner = null; }
    for (i = 0; i < stars.length; i++) {
      stars[i].y += stars[i].v * dt;
      if (stars[i].y > H) { stars[i].y = 0; stars[i].x = Math.random() * W; }
    }
    p = players[localSlot];
    if (p && p.hostX != null) {
      dx = p.hostX - p.x;
      if (Math.abs(dx) > 48) {
        p.x = p.hostX;
        p.targetX = p.hostX;
      } else {
        p.x += dx * (1 - Math.exp(-dt * 6));
      }
    }
    for (i = 0; i < players.length; i++) {
      if (i === localSlot) continue;
      p = players[i];
      if (p && p.hostX != null) {
        dx = p.hostX - p.x;
        if (Math.abs(dx) > 48) p.x = p.hostX;
        else p.x += dx * (1 - Math.exp(-dt * 8));
      }
    }
    for (i = pbul.length - 1; i >= 0; i--) {
      b = pbul[i];
      if (!b.ghost) continue;
      steerPlayerHoming(b, dt);
      b.age = (b.age || 0) + dt;
      if (b.life && b.age > b.life) { pbul.splice(i, 1); continue; }
      if (b.helix) {
        b.bx += (b.vx || 0) * dt;
        b.x = b.bx + Math.sin(b.age * b.hf + b.hp0) * b.ha;
      } else {
        b.x += (b.vx || 0) * dt;
      }
      b.y += b.vy * dt;
      if (b.y < -14 || b.y > H + 14 || b.x < -12 || b.x > W + 12) { pbul.splice(i, 1); continue; }
      consumed = false;
      br = (b.r || 2) + 1;
      for (j = 0; j < enemies.length; j++) {
        e = enemies[j];
        if (!e.alive) continue;
        hid = e.id;
        if (b.hit && b.hit.indexOf(hid) >= 0) continue;
        if (dist2(b.x, b.y, e.x, e.y) < (e.r + br) * (e.r + br)) {
          e.hitFlash = 0.1;
          sparkHit(b.x, b.y);
          if (b.pierce && b.pierce > 0) {
            b.pierce -= 1;
            if (!b.hit) b.hit = [];
            b.hit.push(hid);
          } else {
            pbul.splice(i, 1);
            consumed = true;
            break;
          }
        }
      }
      if (consumed) continue;
    }
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].r += rings[i].vr * dt;
      rings[i].life -= dt;
      if (rings[i].life <= 0) rings.splice(i, 1);
    }
  }
  function applyOverMsg(msg) {
    score = msg.score || 0;
    run.maxWave = msg.maxWave || run.maxWave;
    run.coins = msg.coins || 0;
    run.hits = msg.hits || 0;
    run.kills = msg.kills || 0;
    run.perfectBosses = msg.perfectBosses || 0;
    run.livesLost = msg.livesLost || 0;
    if (msg.pickups) run.pickups = msg.pickups;
    finishRun(true);
  }
  function onPartnerGone() {
    if (netRole && started && !runFinished) {
      disconnectNote = "Partner disconnected";
      if (isPvpRun() && pvpApi()) {
        pvpApi().setForfeit(localSlot === 0 ? 1 : 0);
      }
      netRole = null;
      finishRun(true);
      if (window.__net) window.__net.close();
      return;
    }
    if (uiScreen === "lobby") {
      if (!lobbyErr) setLobbyErr("Partner left");
      var stayJoin = lobbyMode === "join";
      leaveNet();
      if (!stayJoin) showLobbyPanel("pick");
      else showLobbyPanel("join");
      renderLobby();
    } else {
      leaveNet();
    }
  }
  function bindNet() {
    var n = window.__net;
    if (!n || netBound) return;
    netBound = true;
    n.on("ready", function (info) {
      var node = el("lobby-code");
      if (node && info && info.code) node.textContent = info.code;
    });
    n.on("connected", function (info) {
      setLobbyErr("");
      updateLobbyLink(info);
      if (netRole === "client") {
        n.send({ t: "hello", loadout: profileLoadoutSpec(), pvp: isPvp() ? 1 : 0 });
      }
    });
    n.on("transport", function (info) {
      updateLobbyLink(info);
    });
    n.on("hello", function (msg) {
      if (netRole !== "host") return;
      if (!!msg.pvp !== isPvp()) {
        n.send({ t: "reject", reason: isPvp() ? "This room is PvP" : "This room is Co-op" });
        return;
      }
      lobbyGuest = { loadout: msg.loadout || profileLoadoutSpec() };
      n.send({ t: "lobby", players: [profileLoadoutSpec(), lobbyGuest.loadout] });
      if (isPvp()) {
        if (pvpApi() && !pvpApi().session().seed) pvpApi().newSeed();
        pvpBroadcast();
      }
      showLobbyPanel("ready");
      renderLobbyPlayers([{ loadout: profileLoadoutSpec() }, lobbyGuest]);
      renderLobby();
    });
    n.on("reject", function (msg) {
      setLobbyErr((msg && msg.reason) || "Wrong game mode");
      leaveNet();
      showLobbyPanel("pick");
      renderLobby();
    });
    n.on("lobby", function (msg) {
      showLobbyPanel("ready");
      renderLobbyPlayers(msg.players || []);
      renderLobby();
    });
    n.on("pvp", function (msg) {
      if (netRole === "host") return;
      if (pvpApi() && msg && msg.state) pvpApi().applySnapshot(msg.state);
      renderLobby();
    });
    n.on("bid", function (msg) {
      var api = pvpApi();
      if (!api || netRole !== "host") return;
      api.setBid(msg.slot == null ? 1 : msg.slot, msg.amount, 1e9);
      pvpBroadcast();
      renderLobby();
    });
    n.on("draftpick", function (msg) {
      var api = pvpApi();
      if (!api || netRole !== "host") return;
      api.applyPick(msg.slot == null ? 1 : msg.slot, msg.cat, msg.id);
      api.advanceDraft(msg.slot == null ? 1 : msg.slot);
      pvpBroadcast();
      renderLobby();
    });
    n.on("bosspick", function (msg) {
      var api = pvpApi();
      if (!api || netRole !== "host") return;
      api.setBoss(msg.slot == null ? 1 : msg.slot, msg.id);
      pvpBroadcast();
      renderLobby();
    });
    n.on("tutorial", function (msg) {
      var api = pvpApi();
      if (!api || netRole !== "host") return;
      api.setTutorialDone(msg.slot == null ? 1 : msg.slot, true);
      pvpBroadcast();
      renderLobby();
    });
    n.on("start", function (msg) {
      if (netRole === "host") return;
      startNewGame({ coopPlayers: msg.players, fromNet: true, localSlot: 1, startWave: msg.startWave || 1 });
    });
    n.on("pvpstart", function (msg) {
      if (netRole === "host") return;
      if (pvpApi()) {
        pvpApi().setKind("pvp");
        if (msg.mode) pvpApi().setMode(msg.mode);
        pvpApi().markStarted();
        if (msg.wins) pvpApi().session().wins = [msg.wins[0] | 0, msg.wins[1] | 0];
        if (msg.round) pvpApi().session().round = msg.round | 0;
        if (msg.bosses) pvpApi().session().bosses = [msg.bosses[0] || null, msg.bosses[1] || null];
        if (msg.wager != null) pvpApi().session().wager = !!msg.wager;
        if (msg.stake != null) pvpApi().session().stake = msg.stake | 0;
      }
      startNewGame({ pvp: true, coopPlayers: msg.players, fromNet: true, localSlot: 1 });
    });
    n.on("round", function (msg) {
      var api = pvpApi();
      var sess = pvpS();
      if (netRole === "host" || !sess || !api) return;
      sess.wins = msg.wins ? [msg.wins[0] | 0, msg.wins[1] | 0] : sess.wins;
      sess.round = msg.round || sess.round;
      sess.roundLock = true;
      sess.roundHold = msg.hold || api.ROUND_HOLD;
      banner = { text: pvpRoundBannerText(msg.loser === 0 ? 1 : 0), life: 1.7 };
      updateHud();
    });
    n.on("pvpnext", function (msg) {
      if (netRole === "host") return;
      if (pvpS()) {
        pvpS().round = msg.round || pvpS().round;
        if (msg.wins) pvpS().wins = [msg.wins[0] | 0, msg.wins[1] | 0];
      }
      pvpBeginRound();
    });
    n.on("matchover", function (msg) {
      if (runFinished) return;
      if (pvpApi() && msg.wins) pvpApi().session().wins = [msg.wins[0] | 0, msg.wins[1] | 0];
      finishPvpRun(msg.winner, msg.pay, true);
    });
    n.on("input", function (msg) {
      var slot = msg.slot;
      var p;
      if (slot == null) slot = netRole === "host" ? 1 : 0;
      if (slot === localSlot) return;
      p = players[slot];
      if (!p) return;
      if (msg.n && msg.n < (lastInputNBySlot[slot] || 0)) return;
      if (msg.n) lastInputNBySlot[slot] = msg.n;
      p.input.left = !!msg.l;
      p.input.right = !!msg.r;
      p.input.fire = !!msg.f;
      p.input.ability = !!msg.a;
      p.input.aimX = msg.aimX == null ? null : msg.aimX;
      if (msg.x != null && isFinite(msg.x)) {
        p.x = msg.x;
        p.netPlaced = true;
      }
      if (msg.targetX != null && isFinite(msg.targetX)) p.targetX = msg.targetX;
      else if (msg.x != null && isFinite(msg.x)) p.targetX = msg.x;
    });
    n.on("pick", function (msg) {
      if (netRole !== "host") return;
      hostGrantPickup(msg);
    });
    n.on("snap", function (msg) {
      if (netRole !== "client") return;
      onSnapMsg(msg);
    });
    n.on("ev", function (msg) {
      if (netRole !== "client") return;
      if (msg.n && msg.n <= lastEvN) return;
      if (msg.n) lastEvN = msg.n;
      applyNetEvents(msg.ev);
    });
    n.on("pause", function () { pauseGame(true); });
    n.on("resume", function () {
      if (netRole === "host") resumeGame(false);
      else resumeGame(true);
    });
    n.on("over", function (msg) {
      if (netRole === "client" && !runFinished) applyOverMsg(msg);
    });
    n.on("bye", function () { onPartnerGone(); });
    n.on("error", function (info) {
      var wait = el("lobby-join-wait");
      if (info && info.retrying) {
        if (wait) {
          wait.textContent = info.message || "Connecting…";
          wait.classList.remove("hidden");
        }
        setLobbyErr("");
        return;
      }
      if (wait) wait.classList.add("hidden");
      setLobbyErr((info && info.message) || "Connection failed");
      if (uiScreen === "lobby") renderLobby();
    });
    n.on("close", function () {
      if (netRole === "host" && uiScreen === "lobby" && !lobbyGuest) return;
      onPartnerGone();
    });
  }

  function tick(ts) {
    if (paused || gameOver) return;
    if (!lastTs) lastTs = ts;
    var dt = (ts - lastTs) / 1000;
    if (dt > 0.05) dt = 0.05;
    lastTs = ts;
    time += dt;
    if (netRole === "client") {
      advanceNetWorld(dt);
      copyLocalInput();
      updateOneShip(players[localSlot], dt, true);
      var ri;
      for (ri = 0; ri < players.length; ri++) {
        if (ri !== localSlot) updateOneShip(players[ri], dt, false);
      }
      sendLocalInput(dt);
      requestClientPickups();
      hideClaimedPickups();
    } else {
      update(dt);
      if (netRole === "host") {
        sendLocalInput(dt);
        sendSnap(dt);
        flushNetEvents();
      }
    }
    draw();
    rafId = requestAnimationFrame(tick);
  }

  function formPosX(e) { return form.ox + e.offX + (weaves(e.type) ? Math.sin(time * 3.2 + e.phase) * 7 : 0); }
  function formPosY(e) { return form.oy + e.offY; }

  function steerDelta(inp, held, holdKey, dir, cruise, dt) {
    var t, u, mul, already, extra;
    if (held) {
      inp[holdKey] += dt;
      t = inp[holdKey];
      if (t <= STEER_TAP) mul = STEER_TAP_SPD / cruise;
      else if (t >= STEER_RAMP) mul = 1;
      else {
        u = (t - STEER_TAP) / (STEER_RAMP - STEER_TAP);
        u = u * u * (3 - 2 * u);
        mul = STEER_TAP_SPD / cruise + (1 - STEER_TAP_SPD / cruise) * u;
      }
      return dir * cruise * mul * dt;
    }
    if (inp[holdKey] > 0 && inp[holdKey] < STEER_TAP) {
      already = STEER_TAP_SPD * inp[holdKey];
      extra = Math.max(0, STEER_NUDGE - already);
      inp[holdKey] = 0;
      return dir * extra;
    }
    inp[holdKey] = 0;
    return 0;
  }

  function copyLocalInput() {
    var p = players[localSlot];
    var aim;
    if (!p) return;
    if (pvpFlipped()) {
      p.input.left = input.right;
      p.input.right = input.left;
      aim = pointerSteer.aimX;
      p.input.aimX = aim == null ? null : (W - aim);
    } else {
      p.input.left = input.left;
      p.input.right = input.right;
      p.input.aimX = pointerSteer.aimX;
    }
    p.input.fire = input.fire || pointerSteer.fire;
    p.input.ability = !!input.ability;
  }

  function updateOneShip(p, dt, fire) {
    var spd, margin, inp, aimX;
    if (!p || !p.alive) {
      if (p) {
        p.fireCd = Math.max(0, (p.fireCd || 0) - dt);
        p.invuln = Math.max(0, (p.invuln || 0) - dt);
        p.muzzle = Math.max(0, (p.muzzle || 0) - dt * 6);
      }
      return;
    }
    inp = p.input || input;
    if (p.slowT > 0) p.slowT = Math.max(0, p.slowT - dt);
    if (p.jamT > 0) p.jamT = Math.max(0, p.jamT - dt);
    spd = (p.speed || 250) * (p.speedT > 0 ? 1.45 : 1) * (p.slowT > 0 ? 0.62 : 1) * (p.skinSpdMul || 1);
    margin = Math.max(10, (p.r || PLAYER_R) + 4);
    if (p.slot === localSlot && pointerSteer.aimX != null) {
      aimX = pvpFlipped() ? (W - pointerSteer.aimX) : pointerSteer.aimX;
    } else {
      aimX = inp.aimX;
    }
    if (aimX != null) {
      p.targetX = aimX;
    } else if (!(netRole === "host" && p.slot !== localSlot)) {
      p.targetX += steerDelta(inp, inp.left, "holdL", -1, spd, dt);
      p.targetX += steerDelta(inp, inp.right, "holdR", 1, spd, dt);
    }
    p.targetX = clamp(p.targetX, margin, W - margin);
    p.x += (p.targetX - p.x) * (1 - Math.exp(-STEER_FOLLOW * dt));
    p.fireCd = Math.max(0, p.fireCd - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.muzzle = Math.max(0, p.muzzle - dt * 6);
    if (p.weaponT > 0) { p.weaponT -= dt; if (p.weaponT <= 0) p.weapon = "normal"; }
    if (p.speedT > 0) p.speedT = Math.max(0, p.speedT - dt);
    if ((p.skinBoostT || 0) > 0) {
      p.skinBoostT = Math.max(0, p.skinBoostT - dt);
      if (p.skinBoostT <= 0) refreshSkinMuls(p);
    }
    if ((p.skinHotT || 0) > 0) {
      p.skinHotT = Math.max(0, p.skinHotT - dt);
      if (p.skinHotT <= 0) { p.skinHotStacks = 0; refreshSkinMuls(p); }
    }
    if ((p.skinUmbraT || 0) > 0) p.skinUmbraT = Math.max(0, p.skinUmbraT - dt);
    if ((p.skinSentinelCd || 0) > 0) p.skinSentinelCd = Math.max(0, p.skinSentinelCd - dt);
    if (p.skinEcho) {
      p.skinEcho.t -= dt;
      if (p.skinEcho.t <= 0) fireSkinEcho(p);
    }
    if (skinIdOf(p) === "nebula") {
      if ((p.skinNebulaT || 0) > 0) p.skinNebulaT = Math.max(0, p.skinNebulaT - dt);
      else {
        p.skinNebulaCd = (p.skinNebulaCd || 0) - dt;
        if (p.skinNebulaCd <= 0) {
          p.skinNebulaT = 1.1;
          p.skinNebulaCd = 7.5;
          rings.push({ x: p.x, y: p.y, r: 8, vr: 80, life: 0.4, color: "#d46bff" });
        }
      }
    }
    tickSkinAura(p, dt);
    if (p.shieldT > 0) {
      p.shieldT -= dt;
      if (p.shieldT <= 0) { p.shieldT = 0; p.shieldHp = 0; }
    }
    if (p.regen > 0 && p.shieldHp < 1) {
      p.regenT += dt;
      if (p.regenT >= p.regen) {
        p.regenT = 0;
        p.shieldHp = 1;
      }
    } else if (p.shieldHp >= 1) {
      p.regenT = 0;
    }
    p.abilityCd = Math.max(0, (p.abilityCd || 0) - dt);
    if (p.rewind) {
      p.rewind.t -= dt;
      if (p.rewind.t <= 0) {
        p.x = p.rewind.x;
        p.targetX = p.x;
        p.y = p.rewind.y;
        p.invuln = Math.max(p.invuln, 0.45);
        p.rewind = null;
      }
    }
    if (p.dash) {
      p.dash.t += dt;
      var u = p.dash.t / p.dash.dur;
      if (u >= 1) {
        if (p.dash.back) {
          p.dash = {
            t: 0, dur: 0.4,
            sx: p.x, sy: p.y,
            ex: p.slot === 1 ? W / 2 : W / 2,
            ey: p.slot === 1 ? 34 : H - 34,
            back: false
          };
        } else {
          p.dash = null;
          applyPvpLayout(p);
          p.invuln = Math.max(p.invuln, 0.2);
        }
      } else {
        p.x = lerp(p.dash.sx, p.dash.ex, u);
        p.y = lerp(p.dash.sy, p.dash.ey, u);
        p.targetX = p.x;
      }
    }
    if (fire && inp.fire && !(pvpS() && pvpS().roundLock)) shootPlayer(p);
    if (fire && inp.ability && p.boss && !(pvpS() && pvpS().roundLock)) pvpBossAbility(p);
  }

  function update(dt) {
    var i, e, b, p, t, fx, fy, maxD, d, spd, j, pellets, ang, pr, dx, dy, len, pi, pl;

    shake *= Math.exp(-dt * 7);
    if (shake < 0.05) shake = 0;
    flash *= Math.exp(-dt * 8);
    if (banner) { banner.life -= dt; if (banner.life <= 0) banner = null; }
    for (i = skinDecoys.length - 1; i >= 0; i--) {
      skinDecoys[i].t -= dt;
      if (skinDecoys[i].t <= 0) skinDecoys.splice(i, 1);
    }

    for (i = teles.length - 1; i >= 0; i--) {
      teles[i].t -= dt;
      if (teles[i].t <= 0) {
        if (teles[i].blast) detonateLaneBomb(teles[i]);
        teles.splice(i, 1);
      }
    }
    updateBossFx(dt);

    for (i = 0; i < stars.length; i++) {
      stars[i].y += stars[i].v * dt;
      if (stars[i].y > H) { stars[i].y = 0; stars[i].x = Math.random() * W; }
    }

    copyLocalInput();
    var pi;
    for (pi = 0; pi < players.length; pi++) updateOneShip(players[pi], dt, !(pvpS() && pvpS().roundLock));
    if (player) setText(pwrEl, powerHud());
    if (isPvpRun()) {
      var sess = pvpS();
      if (sess && sess.roundHold > 0) {
        sess.roundHold -= dt;
        if (sess.roundHold <= 0) {
          sess.roundHold = 0;
          if (netRole !== "client") {
            if (sess.matchOver || (pvpApi() && pvpApi().matchWinner() >= 0)) pvpFinishMatch(pvpApi().matchWinner());
            else pvpBeginRound();
          }
        }
      }
      syncPvpHudChrome();
    }

    if (enterT > 0 && !isPvpRun()) enterT -= dt;

    if (!isPvpRun() && !isBossWave(wave)) {
      form.ox += form.dir * form.speed * dt;
      if (form.ox + form.minOff < 16) { form.ox = 16 - form.minOff; form.dir = 1; }
      if (form.ox + form.maxOff > W - 16) { form.ox = W - 16 - form.maxOff; form.dir = -1; }
      form.oy = 46 + Math.sin(time * 1.3) * 3;
    }

    maxD = 1 + Math.min(2, Math.floor((pressureWave() - 1) / 3)) + extraPlayers();
    d = (2.5 - Math.min(1.5, (pressureWave() - 1) * 0.18)) / (1 + extraPlayers() * 0.5);
    if (!isBossWave(wave) && enterT <= 0 && divingCount() < maxD) {
      diveCd -= dt;
      if (diveCd <= 0) {
        e = pickDiver();
        if (e) startDive(e);
        diveCd = rand(d * 0.55, d);
      }
    }

    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (!e.alive) continue;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.healFlash = Math.max(0, (e.healFlash || 0) - dt);
      tickSkinEnemy(e, dt);
      if (!e.alive) continue;
      if (!(e.freezeT > 0)) {
      if (e.isBoss) {
        updateBoss(e, dt);
      } else {
        fx = formPosX(e);
        fy = formPosY(e);
        if (e.state === "enter") {
          e.t += dt / 0.7;
          t = e.t > 1 ? 1 : e.t;
          t = t * t * (3 - 2 * t);
          e.x = lerp(e.x, fx, 0.14 + t * 0.22);
          e.y = lerp(-22 - Math.abs(e.offY) * 0.2, fy, t);
          if (e.t >= 1) { e.state = "form"; e.x = fx; e.y = fy; }
        } else if (e.state === "form") {
          e.x = fx;
          e.y = fy;
          if (enterT <= 0) {
            if (e.type === "archon") {
              steerArchon(e, fx, fy, dt);
              updateArchon(e, dt);
            }
            else if (e.type === "mortar" || e.type === "hex" || e.type === "bulwark") updateEliteForm(e, dt);
            else if (e.type === "sniper") {
              e.shotCd -= dt;
              if (e.shotCd <= 0) {
                aimedShot(e, 0.92, 150 + pressureWave() * 6, { color: "#ffd0e8", glow: "#ff4d9a" });
                e.shotCd = Math.max(1.65, (3.4 - pressureWave() * 0.04) / (1 + extraPlayers() * 0.25));
              }
            }
          }
        } else if (e.state === "dive" || e.state === "kami") {
          e.t += dt / e.dur;
          t = e.t > 1 ? 1 : e.t;
          e.x = bezier(t, e.sx, e.cx + (weaves(e.type) ? Math.sin(t * 12) * 22 : 0), e.ex);
          e.y = bezier(t, e.sy, e.cy, e.ey);
          if (e.shotsLeft > 0 && t >= e.shotAt) {
            aimedShot(e, e.type === "tank" ? 0.35 : 0.55, 130 + pressureWave() * 6);
            e.shotsLeft -= 1;
            e.shotAt += 0.22;
          }
          if (e.t >= 1) {
            e.state = "return"; e.t = 0; e.dur = 0.95;
            e.sx = rand(20, W - 20); e.sy = -22; e.x = e.sx; e.y = e.sy;
          }
        } else if (e.state === "return") {
          e.t += dt / e.dur;
          t = e.t > 1 ? 1 : e.t;
          t = t * t * (3 - 2 * t);
          e.x = lerp(e.sx, fx, t);
          e.y = lerp(e.sy, fy, t);
          if (e.t >= 1) {
            e.state = "form"; e.x = fx; e.y = fy;
            // Boss waves never pick divers, so Overlord kami would freeze in form.
            if (e.type === "kami" && isBossWave(wave)) startDive(e);
          }
        } else if (e.state === "archon-return") {
          e.t += dt / e.dur;
          t = e.t > 1 ? 1 : e.t;
          e.x = clamp(bezier(t, e.sx, e.cx, fx), e.r + 18, W - e.r - 18);
          e.y = bezier(t, e.sy, e.cy, fy);
          if (e.t >= 1) { e.state = "form"; e.x = fx; e.y = fy; }
        } else if (e.state === "charge") {
          e.t += dt / e.dur;
          t = e.t > 1 ? 1 : e.t;
          e.x = clamp(bezier(t, e.sx, e.cx, e.ex), e.r + 18, W - e.r - 18);
          e.y = lerp(e.sy, e.ey, t);
          if (e.t >= 1) startArchonReturn(e);
        }
      }
      }

      for (pi = 0; pi < players.length; pi++) {
        pl = players[pi];
        if (!pl || !pl.alive || pl.invuln > 0) continue;
        if (e.state === "form" || e.state === "enter") continue;
        pr = pl.r || PLAYER_R;
        if (dist2(pl.x, pl.y, e.x, e.y) < (pr + e.r * 0.65) * (pr + e.r * 0.65)) {
          if (skinIdOf(pl) === "phantom-spectral" && Math.random() < 0.2) {
            pl.invuln = Math.max(pl.invuln || 0, 0.22);
            continue;
          }
          if (e.type === "kami") { killEnemy(e, true, 1, pl.slot); }
          if (consumeSkinWard(pl)) break;
          playerDie(pl);
          break;
        }
      }
    }

    updateHydraLeech(dt);

    for (i = pickups.length - 1; i >= 0; i--) {
      p = pickups[i];
      var magP = null, magD = 1e12, magLen;
      for (pi = 0; pi < players.length; pi++) {
        pl = players[pi];
        if (!pl || !pl.alive || !hasMod("magnet", pl)) continue;
        dx = pl.x - p.x; dy = pl.y - p.y;
        magLen = Math.sqrt(dx * dx + dy * dy) || 1;
        if (magLen < 110 && magLen < magD) { magD = magLen; magP = pl; }
      }
      if (magP) {
        dx = magP.x - p.x; dy = magP.y - p.y;
        len = Math.sqrt(dx * dx + dy * dy) || 1;
        p.x += dx / len * 100 * dt;
        p.y += dy / len * 100 * dt;
      }
      p.y += p.vy * dt;
      p.bob += dt * 6;
      if (p.y > H + 12) {
        if (p.kind === "revive") waveHold = Math.max(waveHold, 0.25);
        pickups.splice(i, 1);
        continue;
      }
      pl = nearestPicker(p);
      if (pl) consumePickupAt(i, pl);
    }

    if (!isPvpRun() && aliveCount() === 0 && started && !gameOver) {
      if (hasRevivePickup()) {
        /* hold the next wave until the revive gem reaches the ships or is gone */
      } else if (waveHold > 0) {
        waveHold -= dt;
      } else {
        spawnWave(wave + 1);
      }
    }

    for (i = pbul.length - 1; i >= 0; i--) {
      b = pbul[i];
      steerPlayerHoming(b, dt);
      b.age = (b.age || 0) + dt;
      if (b.life && b.age > b.life) { pbul.splice(i, 1); continue; }
      if (b.helix) {
        b.bx += (b.vx || 0) * dt;
        b.x = b.bx + Math.sin(b.age * b.hf + b.hp0) * b.ha;
      } else {
        b.x += (b.vx || 0) * dt;
      }
      b.y += b.vy * dt;
      if (b.y < -14 || b.y > H + 14 || b.x < -12 || b.x > W + 12) { pbul.splice(i, 1); continue; }
      if (applyBossHazardsToPbul(b, i)) continue;
      var consumed = false, br = (b.r || 2) + 1;
      for (j = 0; j < enemies.length; j++) {
        e = enemies[j];
        if (!e.alive) continue;
        if (b.hit && b.hit.indexOf(e) >= 0) continue;
        if (dist2(b.x, b.y, e.x, e.y) < (e.r + br) * (e.r + br)) {
          var own = players[b.owner] || player;
          skinOnBulletHit(own, e, b);
          killEnemy(e, e.state === "dive" || e.state === "kami" || e.state === "charge" || e.state === "lunge", b.dmg || 1, b.owner);
          if (b.splash) {
            var sj, se;
            for (sj = 0; sj < enemies.length; sj++) {
              se = enemies[sj];
              if (!se.alive || se === e) continue;
              if (dist2(b.x, b.y, se.x, se.y) < (b.splash.r + se.r) * (b.splash.r + se.r)) {
                killEnemy(se, false, b.splash.dmg * loadoutDmgMul(shipDef(own), equippedMod(own), own), b.owner, "splash");
              }
            }
            rings.push({ x: b.x, y: b.y, r: 4, vr: 160, life: 0.3, color: "#ffe08a" });
          }
          if (b.pierce && b.pierce > 0) {
            b.pierce -= 1;
            if (!b.hit) b.hit = [];
            b.hit.push(e);
          } else {
            pbul.splice(i, 1);
            consumed = true;
            break;
          }
        }
      }
      if (!consumed && isPvpRun() && !(pvpS() && pvpS().roundLock)) {
        for (pi = 0; pi < players.length; pi++) {
          pl = players[pi];
          if (!pl || !pl.alive || pl.slot === b.owner) continue;
          cycloneNudge(pl, b, dt);
          var def = skinDefendShot(pl, b);
          if (def === "eat") {
            pbul.splice(i, 1);
            consumed = true;
            break;
          }
          if (def === "reflect") {
            reflectAsPlayerShot(b, pl);
            pbul.splice(i, 1);
            consumed = true;
            break;
          }
          if (pl.invuln > 0) continue;
          pr = pl.r || PLAYER_R;
          if (dist2(b.x, b.y, pl.x, pl.y) < (pr + br) * (pr + br)) {
            var shooter = players[b.owner];
            if (shooter && skinIdOf(shooter) === "frost") pl.slowT = Math.max(pl.slowT || 0, 0.7);
            if (b.splash) pvpHurt(pl, (b.dmg || 1) + (b.splash.dmg || 0));
            else pvpHurt(pl, b.dmg || 1);
            if (b.pierce && b.pierce > 0) {
              b.pierce -= 1;
            } else {
              pbul.splice(i, 1);
              consumed = true;
            }
            break;
          }
        }
      }
      if (consumed) continue;
    }

    for (i = ebul.length - 1; i >= 0; i--) {
      b = ebul[i];
      b.age += dt;
      if (b.life && b.age > b.life) { ebul.splice(i, 1); continue; }
      if (b.paused) {
        b.pauseT -= dt;
        if (b.pauseT <= 0) {
          if (!b.resumeSpd) { ebul.splice(i, 1); continue; }
          b.paused = false;
          var resumeTgt = targetPlayer(b.x, b.y);
          var rdx = (resumeTgt ? resumeTgt.x : b.x) - b.x, rdy = (resumeTgt ? resumeTgt.y : H) - b.y;
          var rlen = Math.sqrt(rdx * rdx + rdy * rdy) || 1;
          b.vx = rdx / rlen * b.resumeSpd; b.vy = rdy / rlen * b.resumeSpd;
          b.bx = b.x;
          if (b.splitOnResume) {
            var ra = Math.atan2(rdy, rdx);
            addEbul(b.x, b.y, Math.cos(ra - 0.42) * b.resumeSpd, Math.sin(ra - 0.42) * b.resumeSpd, { color: b.color, glow: b.glow, r: b.r, silent: true });
            addEbul(b.x, b.y, Math.cos(ra + 0.42) * b.resumeSpd, Math.sin(ra + 0.42) * b.resumeSpd, { color: b.color, glow: b.glow, r: b.r, silent: true });
          }
        }
      }
      var homeTgt = targetPlayer(b.x, b.y);
      if (!b.paused && b.homing && homeTgt && homeTgt.alive && b.homeT > 0) {
        b.homeT -= dt;
        var hdx = homeTgt.x - b.x, hdy = homeTgt.y - b.y;
        if (hdy > 36 || b.hturn > 1) {
          var hlen = Math.sqrt(hdx * hdx + hdy * hdy) || 1;
          var hsp = b.hsp || 78;
          b.vx += (hdx / hlen * hsp - b.vx) * Math.min(1, (b.hturn || 0.78) * dt);
          b.vy += (hdy / hlen * hsp - b.vy) * Math.min(1, (b.hturn || 0.78) * dt);
        }
      }
      if (!b.paused) {
        if (b.grav) b.vy += b.grav * dt;
        if (b.accel) { b.vx *= 1 + b.accel * dt; b.vy *= 1 + b.accel * dt; }
        if (b.sway) {
          b.bx += b.vx * dt;
          b.x = b.bx + Math.sin(b.age * b.swayF + b.swayPh) * b.sway;
        } else {
          b.x += b.vx * dt;
        }
        b.y += b.vy * dt;
        if (b.pauseAt && b.vy > 0 && b.y >= b.pauseAt) {
          b.paused = true; b.vx = 0; b.vy = 0; b.y = b.pauseAt;
          b.pauseAt = 0;
        }
      }
      if (b.splitAt && b.y >= b.splitAt) {
        b.splitAt = 0;
        addEbul(b.x, b.y, -60, 95, { color: b.color, glow: b.glow, r: 2.4, silent: true, life: 4 });
        addEbul(b.x, b.y, 60, 95, { color: b.color, glow: b.glow, r: 2.4, silent: true, life: 4 });
        explode(b.x, b.y, b.glow, false);
        ebul.splice(i, 1);
        continue;
      }
      if (b.splitT && b.age >= b.splitT) {
        b.splitT = 0;
        ang = Math.atan2(b.vy, b.vx);
        addEbul(b.x, b.y, Math.cos(ang - 0.46) * 150, Math.sin(ang - 0.46) * 150, { color: b.color, glow: b.glow, r: 2.6, silent: true, life: 4, noTwin: true });
        addEbul(b.x, b.y, Math.cos(ang + 0.46) * 150, Math.sin(ang + 0.46) * 150, { color: b.color, glow: b.glow, r: 2.6, silent: true, life: 4, noTwin: true });
        explode(b.x, b.y, b.glow, false);
        ebul.splice(i, 1);
        continue;
      }
      if (b.mine) {
        b.fuse -= dt;
        if (b.fuse <= 0) {
          pellets = b.pellets || 6;
          for (j = 0; j < pellets; j++) {
            ang = (j / pellets) * Math.PI * 2 + b.age;
            addEbul(b.x, b.y, Math.cos(ang) * (b.pelletSpd || 110), Math.sin(ang) * (b.pelletSpd || 110), { color: "#ffd0a0", glow: b.glow || "#ff9a3d", silent: true });
          }
          explode(b.x, b.y, b.glow || "#ff9a3d", false);
          ebul.splice(i, 1);
          continue;
        }
      }
      if (b.y > H + 14 || b.x < -16 || b.x > W + 16 || b.y < -20) { ebul.splice(i, 1); continue; }
      var hit = false, gone = false;
      for (pi = 0; pi < players.length; pi++) {
        pl = players[pi];
        if (!pl || !pl.alive) continue;
        if (b.owner != null && b.owner >= 0 && b.owner === pl.slot) continue;
        cycloneNudge(pl, b, dt);
        var edef = skinDefendShot(pl, b);
        if (edef === "eat") {
          ebul.splice(i, 1);
          gone = true;
          break;
        }
        if (edef === "reflect") {
          reflectAsPlayerShot(b, pl);
          ebul.splice(i, 1);
          gone = true;
          break;
        }
        if (pl.invuln > 0) continue;
        pr = pl.r || PLAYER_R;
        if (dist2(b.x, b.y, pl.x, pl.y) < (pr + (b.r || 2) - 1.5) * (pr + (b.r || 2) - 1.5)) {
          ebul.splice(i, 1);
          if (isPvpRun()) pvpHurt(pl, 8);
          else playerDie(pl);
          hit = true;
          break;
        }
      }
      if (gone) continue;
      if (hit) break;
    }

    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      if (p.siphon) {
        b = currentBoss();
        if (b) { p.tx = b.x; p.ty = b.y; }
        p.x += (p.tx - p.x) * Math.min(1, 8 * dt);
        p.y += (p.ty - p.y) * Math.min(1, 8 * dt);
        p.life -= dt;
      } else {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; p.life -= dt;
      }
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].r += rings[i].vr * dt;
      rings[i].life -= dt;
      if (rings[i].life <= 0) rings.splice(i, 1);
    }
  }

  function setupCanvas(c, cssW, cssH) {
    var dpr = window.devicePixelRatio || 1;
    c.style.width = cssW + "px";
    c.style.height = cssH + "px";
    c.width = Math.max(1, Math.round(cssW * dpr));
    c.height = Math.max(1, Math.round(cssH * dpr));
    var context = c.getContext("2d");
    context.setTransform(dpr * (cssW / W), 0, 0, dpr * (cssH / H), 0, 0);
    return context;
  }
  function glow(context, color, blur) { context.shadowColor = color; context.shadowBlur = blur; }
  function noGlow(context) { context.shadowBlur = 0; }

  function drawBossFx(context) {
    var i, f, alpha;
    for (i = 0; i < bossFx.length; i++) {
      f = bossFx[i];
      alpha = Math.max(0.18, Math.min(0.7, (f.life || 1) * 0.35));
      context.save();
      context.globalAlpha = alpha;
      context.strokeStyle = f.color || "#a8f0ff";
      context.fillStyle = f.color || "#a8f0ff";
      context.lineWidth = 1.6;
      if (f.kind === "fracture") {
        context.globalAlpha = 0.35 + 0.2 * Math.sin(time * 14);
        context.beginPath(); context.moveTo(f.x, 8); context.lineTo(f.x, H - 8); context.stroke();
      } else if (f.kind === "pane") {
        context.globalAlpha = 0.12 + 0.08 * Math.sin(time * 9);
        context.fillRect(f.x - f.hw, 8, f.hw * 2, H - 16);
        context.globalAlpha = 0.4;
        context.strokeRect(f.x - f.hw, 8, f.hw * 2, H - 16);
      } else if (f.kind === "twin") {
        context.beginPath(); context.moveTo(W / 2, 8); context.lineTo(W / 2, H - 8); context.stroke();
      } else if (f.kind === "catch") {
        context.beginPath(); context.arc(f.x || W / 2, f.y || 72, 22 + Math.sin(time * 10) * 3, 0, Math.PI * 2); context.stroke();
      } else if (f.kind === "rail") {
        context.globalAlpha = f.lit ? 0.55 : 0.16;
        context.lineWidth = f.lit ? 2.2 : 1.2;
        context.beginPath();
        if (f.axis === "h") { context.moveTo(f.a, f.pos); context.lineTo(f.b, f.pos); }
        else { context.moveTo(f.pos, f.a); context.lineTo(f.pos, f.b); }
        context.stroke();
      } else if (f.kind === "glyph") {
        context.beginPath(); context.arc(f.x, f.y, 10, 0, Math.PI * 2); context.stroke();
      }
      context.restore();
    }
  }
  function drawHydraLeech(context) {
    var boss = currentBoss();
    var i, e, pulse, midX, midY;
    if (!boss || boss.type !== "hydra" || !boss.alive) return;
    pulse = 0.28 + 0.22 * Math.sin(time * 11);
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (!e.alive || !e.leech) continue;
      context.save();
      context.strokeStyle = "#3dffb0";
      context.globalAlpha = pulse * 0.45;
      context.lineWidth = 5;
      context.beginPath(); context.moveTo(e.x, e.y); context.lineTo(boss.x, boss.y); context.stroke();
      context.globalAlpha = 0.55 + 0.35 * Math.sin(time * 14 + e.phase);
      context.lineWidth = 1.6;
      context.beginPath(); context.moveTo(e.x, e.y); context.lineTo(boss.x, boss.y); context.stroke();
      midX = (e.x + boss.x) * 0.5;
      midY = (e.y + boss.y) * 0.5;
      context.globalAlpha = 0.7;
      context.fillStyle = "#b8ffe0";
      context.beginPath(); context.arc(midX, midY, 1.8 + Math.sin(time * 16 + e.phase) * 0.6, 0, Math.PI * 2); context.fill();
      context.restore();
    }
  }

  function tracePoly(context, pts) {
    var i;
    context.beginPath();
    context.moveTo(pts[0][0], pts[0][1]);
    for (i = 1; i < pts.length; i++) context.lineTo(pts[i][0], pts[i][1]);
    context.closePath();
  }
  function fillPoly(context, pts) {
    tracePoly(context, pts);
    context.fill();
  }
  function strokePoly(context, pts) {
    tracePoly(context, pts);
    context.stroke();
  }
  function scalePoly(pts, sx, sy) {
    var out = [], i;
    sy = sy == null ? sx : sy;
    for (i = 0; i < pts.length; i++) out.push([pts[i][0] * sx, pts[i][1] * sy]);
    return out;
  }
  function offsetPoly(pts, dx, dy) {
    var out = [], i;
    for (i = 0; i < pts.length; i++) out.push([pts[i][0] + dx, pts[i][1] + dy]);
    return out;
  }
  function hullSpan(pts) {
    var i, p, minX = 0, maxX = 0, minY = 0, maxY = 0, left, right, nose, tail;
    left = right = nose = tail = pts[0];
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      if (p[0] < minX) { minX = p[0]; left = p; }
      if (p[0] > maxX) { maxX = p[0]; right = p; }
      if (p[1] < minY) { minY = p[1]; nose = p; }
      if (p[1] > maxY) { maxY = p[1]; tail = p; }
    }
    return {
      minX: minX, maxX: maxX, minY: minY, maxY: maxY,
      left: left, right: right, nose: nose, tail: tail,
      w: Math.max(8, maxX - minX), h: Math.max(10, maxY - minY)
    };
  }
  // Hull silhouettes, one per ship. Drawn with the ship colour; the accent canopy sits on top.
  var SHIP_HULLS = {
    wisp: [[0, -12], [8, 8], [3, 5], [0, 9], [-3, 5], [-8, 8]],
    needle: [[0, -16], [3.4, 7], [0, 3], [-3.4, 7]],
    aegis: [[0, -10], [9, -2], [8, 8], [0, 6], [-8, 8], [-9, -2]],
    broadwing: [[0, -10], [14, 8], [5, 4], [0, 9], [-5, 4], [-14, 8]],
    phantom: [[0, -13], [6, -1], [0, 11], [-6, -1]],
    vulture: [[0, -11], [4, -4], [12, -8], [10, 6], [3, 4], [0, 8], [-3, 4], [-10, 6], [-12, -8], [-4, -4]],
    bastion: [[0, -9], [7, -9], [13, 0], [12, 10], [4, 8], [0, 11], [-4, 8], [-12, 10], [-13, 0], [-7, -9]],
    strix: [[0, -15], [3, -6], [9, 4], [4, 6], [0, 10], [-4, 6], [-9, 4], [-3, -6]],
    nova: [[0, -12], [5, -5], [10, 6], [5, 10], [0, 7], [-5, 10], [-10, 6], [-5, -5]],
    tempest: [[0, -14], [4, -8], [11, -2], [7, 3], [9, 9], [2, 6], [0, 9], [-2, 6], [-9, 9], [-7, 3], [-11, -2], [-4, -8]],
    warden: [[0, -11], [8, -8], [12, 0], [12, 8], [6, 6], [0, 10], [-6, 6], [-12, 8], [-12, 0], [-8, -8]],
    eclipse: [[0, -15], [3, -9], [10, -4], [12, 4], [6, 4], [4, 10], [0, 7], [-4, 10], [-6, 4], [-12, 4], [-10, -4], [-3, -9]]
  };
  // Legendary coin skins (and a few shared forms) may replace the visual hull only.
  // Collision still uses SHIPS[].r — never these polygons.
  var SKIN_HULLS = {
    "wisp-ghostlight": [[0, -14], [6, 2], [9, 10], [2, 6], [0, 11], [-2, 6], [-9, 10], [-6, 2]],
    "needle-pinkvoid": [[0, -20], [1.5, 3], [2.2, 11], [0, 6], [-2.2, 11], [-1.5, 3]],
    "aegis-ward": [[0, -11], [6, -8], [14, -1], [12, 8], [4, 7], [0, 9], [-4, 7], [-12, 8], [-14, -1], [-6, -8]],
    "broadwing-sunburst": [[0, -11], [8, -2], [18, 1], [16, 10], [6, 5], [0, 10], [-6, 5], [-16, 10], [-18, 1], [-8, -2]],
    "phantom-rift": [[0, -14], [1.5, -1], [0, 12], [-1.5, -1]],
    "vulture-carrion": [[0, -13], [3, -6], [14, -12], [13, 2], [8, 8], [3, 5], [0, 10], [-3, 5], [-8, 8], [-13, 2], [-14, -12], [-3, -6]],
    "bastion-obsidian": [[0, -11], [5, -12], [9, -6], [16, -2], [14, 6], [16, 12], [6, 9], [0, 13], [-6, 9], [-16, 12], [-14, 6], [-16, -2], [-9, -6], [-5, -12]],
    "strix-inferno": [[0, -17], [4, -8], [12, 0], [10, 8], [4, 7], [0, 12], [-4, 7], [-10, 8], [-12, 0], [-4, -8]],
    "nova-starburst": [[0, -16], [3, -5], [12, -8], [5, 0], [12, 8], [3, 5], [0, 14], [-3, 5], [-12, 8], [-5, 0], [-12, -8], [-3, -5]],
    "tempest-lightning": [[0, -16], [5, -10], [2, -6], [11, 0], [4, 2], [8, 10], [1, 6], [0, 12], [-2, 6], [-6, 4], [-3, 0], [-9, -4], [-2, -8]],
    "warden-sentinel": [[0, -13], [7, -10], [16, -2], [14, 8], [7, 6], [0, 11], [-7, 6], [-14, 8], [-16, -2], [-7, -10]],
    "eclipse-corona": [[0, -16], [5, -10], [13, -6], [15, 2], [10, 6], [6, 12], [0, 8], [-6, 12], [-10, 6], [-15, 2], [-13, -6], [-5, -10]]
  };
  var DARK_SKIN_FX = {
    void: 1, umbra: 1, pinkvoid: 1, obsidian: 1, rift: 1, hologram: 1, ghostlight: 1, spectral: 1
  };
  function visualHull(shipId, skinDef) {
    var base = SHIP_HULLS[shipId] || SHIP_HULLS.wisp;
    var fx = (skinDef && skinDef.fx) || "solid";
    if (skinDef && SKIN_HULLS[skinDef.id]) return SKIN_HULLS[skinDef.id];
    if (fx === "nebula") return scalePoly(base, 1.14, 1.1);
    if (fx === "frost") return scalePoly(base, 1.08, 1.05);
    if (fx === "mythic") return scalePoly(base, 1.1, 1.06);
    if (fx === "solar") return scalePoly(base, 1.05, 1.04);
    if (fx === "novaflux") return scalePoly(base, 1.05, 1.05);
    if (fx === "void") return scalePoly(base, 1.03, 1.03);
    return base;
  }
  function skinGlowAmt(fx) {
    if (fx === "novaflux" || fx === "supernova" || fx === "starburst" || fx === "solar" || fx === "corona" || fx === "inferno") return 18;
    if (fx === "ghostlight" || fx === "hologram" || fx === "spectral" || fx === "prism" || fx === "lightning") return 16;
    if (fx === "mythic" || fx === "nebula" || fx === "aurora" || fx === "ward") return 15;
    return 12;
  }
  function skinGlowColor(fx, hull, accent) {
    if (DARK_SKIN_FX[fx]) return accent;
    if (fx === "novaflux" || fx === "supernova" || fx === "starburst") return "#ffffff";
    return hull;
  }
  function applySkinFill(context, fx, hull, accent) {
    var fill, g;
    if (fx === "nebula" || fx === "aurora" || fx === "cyclone") {
      fill = context.createLinearGradient(0, -18, 0, 14);
      fill.addColorStop(0, hull);
      fill.addColorStop(0.4 + 0.12 * Math.sin(time * 3), accent);
      fill.addColorStop(1, hull);
      context.fillStyle = fill;
    } else if (fx === "prism") {
      context.fillStyle = shiftPaint(hull, time * 70, 1.1, 1);
    } else if (fx === "void" || fx === "umbra" || fx === "pinkvoid" || fx === "obsidian" || fx === "rift") {
      context.fillStyle = "#0a0814";
    } else if (fx === "novaflux" || fx === "supernova" || fx === "starburst") {
      g = context.createRadialGradient(0, 0, 1.2, 0, 0, 14);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.38, accent);
      g.addColorStop(1, hull);
      context.fillStyle = g;
    } else if (fx === "solar" || fx === "corona" || fx === "sunburst" || fx === "inferno") {
      g = context.createRadialGradient(0, 1, 1, 0, 1, 13);
      g.addColorStop(0, "#fff4c8");
      g.addColorStop(0.45, accent);
      g.addColorStop(1, hull);
      context.fillStyle = g;
    } else if (fx === "ghostlight" || fx === "spectral" || fx === "hologram") {
      context.fillStyle = hull;
      context.globalAlpha = 0.52 + 0.32 * Math.sin(time * 8);
    } else if (fx === "chrome") {
      fill = context.createLinearGradient(-10, -12, 10, 12);
      fill.addColorStop(0, "#ffffff");
      fill.addColorStop(0.35, hull);
      fill.addColorStop(0.7, accent);
      fill.addColorStop(1, hull);
      context.fillStyle = fill;
    } else {
      context.fillStyle = hull;
    }
  }
  function drawCanopy(context, fx, accent) {
    var a = 1;
    if (fx === "void" || fx === "umbra" || fx === "obsidian" || fx === "pinkvoid" || fx === "rift") a = 0.9;
    if (fx === "ghostlight" || fx === "spectral" || fx === "hologram") a = 0.5 + 0.28 * Math.sin(time * 9);
    context.globalAlpha = a;
    context.fillStyle = accent;
    context.beginPath();
    context.moveTo(0, -6);
    context.lineTo(2.6, 2);
    context.lineTo(-2.6, 2);
    context.closePath();
    context.fill();
    context.globalAlpha = 1;
  }
  function drawShipDetail(context, shipId, hull, accent, flash) {
    if (shipId === "vulture") {
      context.strokeStyle = accent; context.lineWidth = 1.2;
      context.beginPath(); context.moveTo(-9, -2); context.lineTo(-4, 3); context.moveTo(9, -2); context.lineTo(4, 3); context.stroke();
    } else if (shipId === "bastion") {
      context.fillStyle = accent;
      context.fillRect(-9, -3, 3, 8); context.fillRect(6, -3, 3, 8);
    } else if (shipId === "strix") {
      context.fillStyle = accent;
      context.fillRect(-1, -9, 2, 12);
    } else if (shipId === "nova") {
      context.strokeStyle = accent; context.lineWidth = 1;
      context.globalAlpha = 0.6 + 0.3 * Math.sin(flash * 6);
      context.beginPath(); context.arc(0, 1, 5, 0, Math.PI * 2); context.stroke();
      context.globalAlpha = 1;
    } else if (shipId === "tempest") {
      context.fillStyle = accent;
      context.fillRect(-8, 1, 2, 6); context.fillRect(6, 1, 2, 6);
    } else if (shipId === "warden") {
      context.strokeStyle = accent; context.lineWidth = 1.4;
      context.beginPath(); context.arc(0, 0, 9, Math.PI * 1.15, Math.PI * 1.85); context.stroke();
    } else if (shipId === "eclipse") {
      context.fillStyle = "#050510";
      context.beginPath(); context.arc(0, 0, 3.6, 0, Math.PI * 2); context.fill();
      context.strokeStyle = accent; context.lineWidth = 1;
      context.beginPath(); context.arc(0, 0, 4.2, 0, Math.PI * 2); context.stroke();
    }
  }
  // Gun barrels drawn on top of the hull, and the muzzle-flash anchor points.
  function drawGunBarrels(context, gunId, hull) {
    context.fillStyle = hull;
    if (gunId === "twin") {
      context.fillRect(-7, -8, 2.2, 7);
      context.fillRect(4.8, -8, 2.2, 7);
    } else if (gunId === "spread") {
      context.fillRect(-6, -9, 1.6, 6);
      context.fillRect(-0.8, -12, 1.6, 8);
      context.fillRect(4.4, -9, 1.6, 6);
    } else if (gunId === "lance") {
      context.fillRect(-1.1, -18, 2.2, 10);
    } else if (gunId === "seeker") {
      context.beginPath(); context.arc(-5, -6, 2.1, 0, Math.PI * 2); context.arc(5, -6, 2.1, 0, Math.PI * 2); context.fill();
    } else if (gunId === "rapid") {
      context.fillRect(-1.4, -13, 2.8, 5);
    } else if (gunId === "scatter") {
      context.fillRect(-3.5, -12, 7, 4);
      context.fillRect(-2, -14, 4, 2);
    } else if (gunId === "railgun") {
      context.fillRect(-2.6, -16, 1.4, 12);
      context.fillRect(1.2, -16, 1.4, 12);
      context.fillRect(-2.6, -17, 5.2, 1.4);
    } else if (gunId === "volley") {
      context.fillRect(-4.2, -11, 1.6, 6);
      context.fillRect(-0.8, -13, 1.6, 8);
      context.fillRect(2.6, -11, 1.6, 6);
    } else if (gunId === "helix") {
      context.beginPath(); context.arc(-3, -10, 1.8, 0, Math.PI * 2); context.arc(3, -12, 1.8, 0, Math.PI * 2); context.arc(-3, -14, 1.2, 0, Math.PI * 2); context.fill();
    } else if (gunId === "storm") {
      context.fillRect(-4, -12, 1.4, 7); context.fillRect(-1.5, -14, 1.4, 9); context.fillRect(1, -12, 1.4, 7); context.fillRect(3.4, -10, 1.4, 5);
    } else if (gunId === "novacannon") {
      context.fillRect(-3, -15, 6, 8);
      context.fillStyle = "#ffe08a";
      context.fillRect(-1.5, -14, 3, 3);
    } else if (gunId === "prism") {
      context.beginPath(); context.moveTo(0, -18); context.lineTo(4, -9); context.lineTo(-4, -9); context.closePath(); context.fill();
      context.fillStyle = "#ffffff";
      context.beginPath(); context.moveTo(0, -15); context.lineTo(1.6, -11); context.lineTo(-1.6, -11); context.closePath(); context.fill();
    } else {
      context.fillRect(-1.1, -12, 2.2, 5);
    }
  }
  function drawMuzzle(context, gunId, muzzle) {
    context.globalAlpha = muzzle;
    context.fillStyle = "#fffbe6";
    context.beginPath();
    if (gunId === "twin") {
      context.arc(-6, -13, 2.4 + muzzle * 1.6, 0, Math.PI * 2);
      context.arc(6, -13, 2.4 + muzzle * 1.6, 0, Math.PI * 2);
    } else if (gunId === "spread" || gunId === "volley" || gunId === "prism") {
      context.arc(-5, -12, 2 + muzzle, 0, Math.PI * 2);
      context.arc(0, -15, 2.6 + muzzle * 1.4, 0, Math.PI * 2);
      context.arc(5, -12, 2 + muzzle, 0, Math.PI * 2);
    } else if (gunId === "scatter") {
      context.arc(0, -16, 4 + muzzle * 3, 0, Math.PI * 2);
    } else if (gunId === "helix") {
      context.arc(-3, -16, 2 + muzzle, 0, Math.PI * 2);
      context.arc(3, -16, 2 + muzzle, 0, Math.PI * 2);
    } else {
      context.arc(0, gunId === "lance" || gunId === "railgun" || gunId === "prism" ? -19 : -13, 3.2 + muzzle * 2, 0, Math.PI * 2);
    }
    context.fill();
    context.globalAlpha = 1;
  }

  function drawShip(context, x, y, blink, loadout) {
    loadout = loadout || currentLoadout();
    if (blink && Math.floor(time * 12) % 2 === 0) return;
    var shipId = loadout.ship || "wisp";
    var gunId = loadout.gun || "pulse";
    var modId = loadout.mod || null;
    var skinId = loadout.skin || "stock";
    var shieldHp = loadout.shieldHp != null ? loadout.shieldHp : 0;
    var muzzle = loadout.muzzle != null ? loadout.muzzle : 0;
    var scale = loadout.scale || 1;
    var def = findShip(shipId);
    var paint = skinPaint(shipId, skinId);
    var hull = paint.hull;
    var accent = paint.accent;
    var fx = paint.fx || "solid";
    var skinDef = paint.def;
    var pts = visualHull(shipId, skinDef);
    var altHull = !!(skinDef && SKIN_HULLS[skinDef.id]);
    context.save();
    context.translate(x, y);
    if (scale !== 1) context.scale(scale, scale);
    drawModFxBack(context, modId, hull, def);
    if (shieldHp > 0) {
      context.globalAlpha = 0.35 + 0.15 * Math.sin(time * 8);
      glow(context, "#6b8cff", 12);
      context.strokeStyle = shieldHp >= 2 ? "#c8d8ff" : "#9ab8ff";
      context.lineWidth = 1.2 + shieldHp * 0.5;
      context.beginPath();
      context.arc(0, 0, 12 + (def.r || 9) * 0.25, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = 1;
      noGlow(context);
    }
    glow(context, skinGlowColor(fx, hull, accent), skinGlowAmt(fx));
    drawSkinBack(context, fx, hull, accent, pts);
    applySkinFill(context, fx, hull, accent);
    tracePoly(context, pts);
    context.fill();
    context.globalAlpha = 1;
    drawSkinExtras(context, fx, hull, accent, pts);
    drawCanopy(context, fx, accent);
    if (!altHull) drawShipDetail(context, shipId, hull, accent, time);
    drawSkinFx(context, fx, hull, accent, pts);
    drawGunBarrels(context, gunId, hull);
    if (muzzle > 0.15) drawMuzzle(context, gunId, muzzle);
    drawModFxFront(context, modId, hull, def);
    noGlow(context);
    context.restore();
  }
  function drawSkinBack(context, fx, hull, accent, pts) {
    var span, i, a, r, ox, oy, clone;
    span = hullSpan(pts);
    context.save();
    if (fx === "prism") {
      context.globalAlpha = 0.38;
      context.fillStyle = "#ff3355";
      fillPoly(context, offsetPoly(pts, -2.2, 0.6));
      context.fillStyle = "#3df0ff";
      fillPoly(context, offsetPoly(pts, 2.2, -0.6));
    } else if (fx === "mythic") {
      context.globalAlpha = 0.28 + 0.1 * Math.sin(time * 5);
      context.fillStyle = accent;
      fillPoly(context, offsetPoly(scalePoly(pts, 1.16, 1.1), Math.sin(time * 3) * 1.6, -1.2));
    } else if (fx === "ghostlight" || fx === "hologram" || fx === "spectral") {
      context.globalAlpha = 0.22 + 0.1 * Math.sin(time * 7);
      context.fillStyle = accent;
      clone = offsetPoly(pts, Math.sin(time * 6) * 3.5, -1.5);
      fillPoly(context, clone);
    } else if (fx === "nebula") {
      context.globalAlpha = 0.22 + 0.1 * Math.sin(time * 2.2);
      context.fillStyle = accent;
      for (i = 0; i < 5; i++) {
        a = time * 0.7 + i * 1.256;
        context.beginPath();
        context.arc(Math.cos(a) * span.w * 0.28, Math.sin(a * 1.3) * span.h * 0.2, 3.2 + (i % 3), 0, Math.PI * 2);
        context.fill();
      }
    } else if (fx === "solar" || fx === "corona" || fx === "sunburst") {
      context.globalAlpha = 0.22 + 0.12 * Math.sin(time * 4);
      context.strokeStyle = accent;
      context.lineWidth = 2.4;
      context.beginPath();
      context.arc(0, 1, span.w * 0.55 + Math.sin(time * 3) * 1.4, 0, Math.PI * 2);
      context.stroke();
    } else if (fx === "cyclone") {
      context.strokeStyle = accent;
      context.lineWidth = 1.3;
      context.globalAlpha = 0.35;
      context.beginPath();
      for (i = 0; i < 18; i++) {
        a = time * 3 + i * 0.45;
        r = 2 + i * 0.7;
        ox = Math.cos(a) * r;
        oy = Math.sin(a) * r * 0.72 + i * 0.15;
        if (i === 0) context.moveTo(ox, oy);
        else context.lineTo(ox, oy);
      }
      context.stroke();
    } else if (fx === "ward") {
      context.globalAlpha = 0.2 + 0.1 * Math.sin(time * 4);
      context.strokeStyle = accent;
      context.lineWidth = 1.4;
      for (i = 0; i < 2; i++) {
        r = 9 + i * 4 + Math.sin(time * 5 + i) * 0.8;
        context.beginPath();
        context.arc(0, 0, r, 0, Math.PI * 2);
        context.stroke();
      }
    }
    context.restore();
  }
  function drawSkinExtras(context, fx, hull, accent, pts) {
    var span, flap, i, a, lx, ly, rx, ry;
    span = hullSpan(pts);
    lx = span.left[0];
    ly = span.left[1];
    rx = span.right[0];
    ry = span.right[1];
    context.save();
    if (fx === "frost") {
      flap = 1 + 0.12 * Math.sin(time * 5);
      context.fillStyle = "#e8f6ff";
      context.globalAlpha = 0.78;
      context.beginPath();
      context.moveTo(lx, ly);
      context.lineTo(lx - 6.5 * flap, ly - 5);
      context.lineTo(lx - 1.5, ly + 6);
      context.closePath();
      context.fill();
      context.beginPath();
      context.moveTo(rx, ry);
      context.lineTo(rx + 6.5 * flap, ry - 5);
      context.lineTo(rx + 1.5, ry + 6);
      context.closePath();
      context.fill();
      context.beginPath();
      context.moveTo(0, span.minY);
      context.lineTo(2.4, span.minY - 5 * flap);
      context.lineTo(-2.4, span.minY - 5 * flap);
      context.closePath();
      context.fill();
    } else if (fx === "gilded" || fx === "goldwing") {
      flap = Math.sin(time * 4) * 1.2;
      context.fillStyle = "#fff4c0";
      context.globalAlpha = 0.75;
      for (i = 0; i < 3; i++) {
        context.beginPath();
        context.moveTo(lx + 2, ly + i * 3);
        context.lineTo(lx - 5 - i, ly + 2 + i * 3 + flap);
        context.lineTo(lx + 1, ly + 5 + i * 3);
        context.closePath();
        context.fill();
        context.beginPath();
        context.moveTo(rx - 2, ry + i * 3);
        context.lineTo(rx + 5 + i, ry + 2 + i * 3 + flap);
        context.lineTo(rx - 1, ry + 5 + i * 3);
        context.closePath();
        context.fill();
      }
    } else if (fx === "mythic" || fx === "sentinel") {
      flap = Math.sin(time * 3.5) * 2;
      context.globalAlpha = 0.55;
      context.fillStyle = accent;
      context.beginPath();
      context.moveTo(span.minX * 0.35, -3);
      context.lineTo(span.minX - 7, flap - 6);
      context.lineTo(span.minX * 0.55, 9);
      context.closePath();
      context.fill();
      context.beginPath();
      context.moveTo(span.maxX * 0.35, -3);
      context.lineTo(span.maxX + 7, flap - 6);
      context.lineTo(span.maxX * 0.55, 9);
      context.closePath();
      context.fill();
    } else if (fx === "aurora") {
      context.lineWidth = 2.2;
      context.globalAlpha = 0.55 + 0.2 * Math.sin(time * 3);
      context.strokeStyle = accent;
      context.beginPath();
      context.moveTo(lx - 2, 6 + Math.sin(time * 4) * 2);
      context.quadraticCurveTo(-4, -16, 0, -6);
      context.stroke();
      context.strokeStyle = hull;
      context.beginPath();
      context.moveTo(rx + 2, 6 + Math.cos(time * 4) * 2);
      context.quadraticCurveTo(4, -16, 0, -6);
      context.stroke();
    } else if (fx === "ward") {
      context.fillStyle = accent;
      context.globalAlpha = 0.45;
      context.beginPath();
      context.moveTo(-8, -1);
      context.lineTo(-15, -4);
      context.lineTo(-13, 6);
      context.lineTo(-6, 5);
      context.closePath();
      context.fill();
      context.beginPath();
      context.moveTo(8, -1);
      context.lineTo(15, -4);
      context.lineTo(13, 6);
      context.lineTo(6, 5);
      context.closePath();
      context.fill();
    } else if (fx === "sunburst") {
      context.strokeStyle = accent;
      context.lineWidth = 1.3;
      context.globalAlpha = 0.55 + 0.2 * Math.sin(time * 6);
      for (i = 0; i < 8; i++) {
        a = -Math.PI / 2 + i * 0.4 - 1.4;
        context.beginPath();
        context.moveTo(Math.cos(a) * 4, Math.sin(a) * 3);
        context.lineTo(Math.cos(a) * 18, Math.sin(a) * 8 + 2);
        context.stroke();
      }
    } else if (fx === "rift") {
      context.fillStyle = hull;
      context.globalAlpha = 0.95;
      fillPoly(context, [[-1.2, -13], [-7.5, -1], [-1.2, 11], [-2.8, -1]]);
      fillPoly(context, [[1.2, -13], [2.8, -1], [1.2, 11], [7.5, -1]]);
    } else if (fx === "fortress") {
      context.fillStyle = accent;
      context.globalAlpha = 0.85;
      context.fillRect(-10, -12, 3, 5);
      context.fillRect(-4, -13, 3, 6);
      context.fillRect(1, -13, 3, 6);
      context.fillRect(7, -12, 3, 5);
    } else if (fx === "obsidian") {
      context.fillStyle = accent;
      context.globalAlpha = 0.35;
      fillPoly(context, [[-14, -4], [-18, 2], [-12, 8], [-10, 2]]);
      fillPoly(context, [[14, -4], [18, 2], [12, 8], [10, 2]]);
    } else if (fx === "inferno") {
      flap = 2 + Math.sin(time * 14) * 2;
      context.fillStyle = "#ff4d2a";
      context.globalAlpha = 0.7;
      context.beginPath();
      context.moveTo(-5, 2);
      context.lineTo(-14, 1);
      context.lineTo(-8, 10 + flap);
      context.closePath();
      context.fill();
      context.beginPath();
      context.moveTo(5, 2);
      context.lineTo(14, 1);
      context.lineTo(8, 10 + flap);
      context.closePath();
      context.fill();
    } else if (fx === "carrion") {
      context.strokeStyle = accent;
      context.lineWidth = 1.3;
      context.globalAlpha = 0.8;
      context.beginPath();
      context.moveTo(-8, -6);
      context.lineTo(-3, 2);
      context.lineTo(-7, 8);
      context.moveTo(8, -6);
      context.lineTo(3, 2);
      context.lineTo(7, 8);
      context.moveTo(-11, -2);
      context.lineTo(-5, 1);
      context.moveTo(11, -2);
      context.lineTo(5, 1);
      context.stroke();
    }
    context.restore();
  }
  function drawSkinFx(context, fx, hull, accent, pts) {
    var i, y, a, r, span, shine, n;
    if (fx === "solid") return;
    span = hullSpan(pts);
    context.save();
    if (fx === "ion") {
      context.strokeStyle = accent;
      context.globalAlpha = 0.45 + 0.3 * Math.sin(time * 10);
      context.lineWidth = 1.2;
      context.beginPath();
      context.arc(0, 0, 11 + Math.sin(time * 6) * 1.5, 0.2, Math.PI - 0.2);
      context.stroke();
    } else if (fx === "ember") {
      context.globalAlpha = 0.35 + 0.25 * Math.sin(time * 12);
      context.fillStyle = "#ff7a3d";
      context.beginPath();
      context.moveTo(-4, 7);
      context.lineTo(0, 13 + Math.sin(time * 18) * 2);
      context.lineTo(4, 7);
      context.closePath();
      context.fill();
    } else if (fx === "void" || fx === "umbra") {
      context.strokeStyle = accent;
      context.globalAlpha = 0.7;
      context.lineWidth = 1.6;
      strokePoly(context, pts);
      context.fillStyle = "#050510";
      context.globalAlpha = 0.55;
      context.beginPath();
      context.arc(0, 1, 3.6 + (fx === "umbra" ? 1.2 : 0), 0, Math.PI * 2);
      context.fill();
      context.fillStyle = accent;
      for (i = 0; i < 5; i++) {
        a = time * 1.4 + i * 1.256;
        r = 4.5 + (i % 2) * 2.2;
        context.globalAlpha = 0.45 + 0.4 * Math.sin(time * 6 + i);
        context.beginPath();
        context.arc(Math.cos(a) * r, Math.sin(a) * r * 0.65, 0.9, 0, Math.PI * 2);
        context.fill();
      }
      if (fx === "umbra") {
        context.strokeStyle = accent;
        context.globalAlpha = 0.7 + 0.2 * Math.sin(time * 4);
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(0, 0, 8.5, 0, Math.PI * 2);
        context.stroke();
      }
    } else if (fx === "gilded") {
      context.strokeStyle = "#ffe08a";
      context.globalAlpha = 0.7;
      context.lineWidth = 1.1;
      strokePoly(context, pts);
      context.save();
      tracePoly(context, pts);
      context.clip();
      shine = ((time * 26) % 40) - 20;
      context.globalAlpha = 0.38 + 0.12 * Math.sin(time * 5);
      context.fillStyle = "#ffffff";
      context.fillRect(shine, span.minY - 2, 3.5, span.h + 6);
      context.restore();
    } else if (fx === "prism") {
      context.strokeStyle = shiftPaint(accent, time * 90, 1.2, 1.1);
      context.globalAlpha = 0.85;
      context.lineWidth = 1.4;
      strokePoly(context, pts);
    } else if (fx === "novaflux" || fx === "supernova") {
      context.strokeStyle = "#ffffff";
      context.globalAlpha = 0.5 + 0.35 * Math.sin(time * 7);
      context.lineWidth = 1.2;
      n = fx === "supernova" ? 10 : 8;
      for (i = 0; i < n; i++) {
        a = time * 0.8 + i * (Math.PI * 2 / n);
        context.beginPath();
        context.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
        context.lineTo(Math.cos(a) * (9 + Math.sin(time * 8 + i)), Math.sin(a) * (8 + Math.sin(time * 8 + i)));
        context.stroke();
      }
      context.beginPath();
      context.arc(0, 1, 4.5 + Math.sin(time * 8), 0, Math.PI * 2);
      context.stroke();
      if (fx === "supernova") {
        context.globalAlpha = 0.28 + 0.18 * Math.sin(time * 5);
        context.beginPath();
        context.arc(0, 0, 11 + (time * 7 % 6), 0, Math.PI * 2);
        context.stroke();
      }
    } else if (fx === "frost") {
      context.strokeStyle = "#e8f6ff";
      context.globalAlpha = 0.55;
      context.lineWidth = 1;
      for (i = 0; i < 6; i++) {
        a = i * Math.PI / 3;
        context.beginPath();
        context.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
        context.lineTo(Math.cos(a) * 7, Math.sin(a) * 7);
        context.stroke();
      }
      context.globalAlpha = 0.28;
      context.beginPath();
      context.ellipse(0, 8, 5, 2.4 + Math.sin(time * 4), 0, 0, Math.PI * 2);
      context.fillStyle = "#c8e8ff";
      context.fill();
    } else if (fx === "solar" || fx === "corona") {
      context.globalAlpha = 0.45 + 0.25 * Math.sin(time * 8);
      context.fillStyle = "#ffe08a";
      context.beginPath();
      context.moveTo(-3.5, 7);
      context.lineTo(0, 15 + Math.sin(time * 14) * 2.5);
      context.lineTo(3.5, 7);
      context.closePath();
      context.fill();
      context.strokeStyle = accent;
      context.lineWidth = 1.3;
      context.globalAlpha = 0.55;
      for (i = 0; i < 4; i++) {
        a = Math.sin(time * 3 + i) * 2.2;
        context.beginPath();
        context.moveTo(span.left[0] * 0.4, 0);
        context.quadraticCurveTo(span.left[0] - 4 + a, -8 + i * 3, span.left[0] - 2, -2 + Math.sin(time * 6 + i) * 3);
        context.stroke();
        context.beginPath();
        context.moveTo(span.right[0] * 0.4, 0);
        context.quadraticCurveTo(span.right[0] + 4 - a, -8 + i * 3, span.right[0] + 2, -2 + Math.cos(time * 6 + i) * 3);
        context.stroke();
      }
      if (fx === "corona") {
        context.strokeStyle = "#ffd23d";
        context.globalAlpha = 0.7;
        context.lineWidth = 1.6;
        context.beginPath();
        context.arc(0, 0, 9 + Math.sin(time * 5) * 1.2, 0, Math.PI * 2);
        context.stroke();
        context.fillStyle = "#050510";
        context.globalAlpha = 0.85;
        context.beginPath();
        context.arc(0, 0, 4.2, 0, Math.PI * 2);
        context.fill();
      }
    } else if (fx === "hologram" || fx === "ghostlight" || fx === "spectral") {
      context.strokeStyle = "#ffffff";
      context.lineWidth = 0.8;
      for (i = 0; i < 7; i++) {
        y = span.minY + ((time * 22 + i * 4) % (span.h + 6));
        context.globalAlpha = 0.16 + (fx === "spectral" ? 0.08 : 0);
        context.beginPath();
        context.moveTo(span.minX - 2, y);
        context.lineTo(span.maxX + 2, y);
        context.stroke();
      }
      context.globalAlpha = 0.55;
      context.lineWidth = 1.1;
      context.strokeStyle = accent;
      strokePoly(context, pts);
      if (fx === "spectral") {
        context.globalAlpha = 0.35;
        strokePoly(context, scalePoly(pts, 1.18, 1.14));
      }
    } else if (fx === "aurora") {
      context.globalAlpha = 0.3 + 0.14 * Math.sin(time * 3);
      context.strokeStyle = accent;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(-10, 4 + Math.sin(time * 4) * 2);
      context.quadraticCurveTo(0, -14, 10, 4 + Math.cos(time * 4) * 2);
      context.stroke();
    } else if (fx === "chrome") {
      context.save();
      tracePoly(context, pts);
      context.clip();
      shine = ((time * 22) % 36) - 18;
      context.globalAlpha = 0.45;
      context.fillStyle = "#ffffff";
      context.fillRect(shine, span.minY - 2, 4, span.h + 8);
      context.restore();
      context.strokeStyle = "#ffffff";
      context.globalAlpha = 0.45;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(-6, -6);
      context.lineTo(7, 5);
      context.stroke();
    } else if (fx === "nebula") {
      context.fillStyle = "#ffffff";
      for (i = 0; i < 7; i++) {
        a = i * 0.9 + time * 0.4;
        context.globalAlpha = 0.35 + 0.4 * Math.sin(time * 3 + i);
        context.beginPath();
        context.arc(Math.cos(a) * span.w * 0.22, Math.sin(a * 1.4) * span.h * 0.18, 0.8, 0, Math.PI * 2);
        context.fill();
      }
      context.strokeStyle = accent;
      context.globalAlpha = 0.35 + 0.15 * Math.sin(time * 2.5);
      context.lineWidth = 1.6;
      context.beginPath();
      context.moveTo(-2, span.maxY - 1);
      context.quadraticCurveTo(-8, span.maxY + 8 + Math.sin(time * 3) * 2, -4, span.maxY + 12);
      context.moveTo(2, span.maxY - 1);
      context.quadraticCurveTo(7, span.maxY + 7 + Math.cos(time * 3) * 2, 3, span.maxY + 11);
      context.stroke();
    } else if (fx === "mythic") {
      context.strokeStyle = accent;
      context.globalAlpha = 0.5 + 0.25 * Math.sin(time * 6);
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(0, 0, span.w * 0.55 + Math.sin(time * 5), 0, Math.PI * 2);
      context.stroke();
      context.strokeStyle = hull;
      context.globalAlpha = 0.4;
      strokePoly(context, pts);
    } else if (fx === "hotstreak") {
      context.strokeStyle = accent;
      context.lineWidth = 1.4;
      context.globalAlpha = 0.8;
      for (i = 0; i < 3; i++) {
        y = -8 + i * 5;
        context.beginPath();
        context.moveTo(-3.2 + i * 0.4, y);
        context.lineTo(0, y - 3);
        context.lineTo(3.2 - i * 0.4, y);
        context.stroke();
      }
      context.strokeStyle = hull;
      context.globalAlpha = 0.35 + 0.2 * Math.sin(time * 16);
      context.lineWidth = 1;
      for (i = 0; i < 4; i++) {
        context.beginPath();
        context.moveTo(-2 - i, 8 + i * 2.2);
        context.lineTo(-5 - i, 14 + i * 2.2 + Math.sin(time * 20 + i) * 1.5);
        context.stroke();
        context.beginPath();
        context.moveTo(2 + i, 8 + i * 2.2);
        context.lineTo(5 + i, 14 + i * 2.2 + Math.cos(time * 20 + i) * 1.5);
        context.stroke();
      }
    } else if (fx === "pinkvoid") {
      context.strokeStyle = accent;
      context.globalAlpha = 0.85;
      context.lineWidth = 1.7;
      strokePoly(context, pts);
      context.globalAlpha = 0.45 + 0.25 * Math.sin(time * 10);
      context.strokeStyle = "#ff9ad6";
      context.lineWidth = 2.4;
      strokePoly(context, scalePoly(pts, 1.12, 1.04));
      context.fillStyle = accent;
      context.globalAlpha = 0.55;
      for (i = 0; i < 3; i++) {
        context.beginPath();
        context.arc((i - 1) * 1.4, 8 + i * 2 + Math.sin(time * 8 + i), 1.1, 0, Math.PI * 2);
        context.fill();
      }
    } else if (fx === "acid") {
      context.fillStyle = accent;
      for (i = 0; i < 4; i++) {
        y = 6 + ((time * 10 + i * 5) % 12);
        context.globalAlpha = 0.7 - y * 0.04;
        context.beginPath();
        context.arc(span.left[0] + 2, y + 2, 1.3, 0, Math.PI * 2);
        context.arc(span.right[0] - 2, y + 1, 1.1, 0, Math.PI * 2);
        context.fill();
      }
      context.strokeStyle = hull;
      context.globalAlpha = 0.5;
      context.lineWidth = 1.2;
      context.beginPath();
      context.moveTo(span.left[0], span.left[1]);
      context.lineTo(span.left[0] - 1, span.maxY + 6 + Math.sin(time * 6) * 2);
      context.moveTo(span.right[0], span.right[1]);
      context.lineTo(span.right[0] + 1, span.maxY + 6 + Math.cos(time * 6) * 2);
      context.stroke();
    } else if (fx === "bloodglass") {
      context.strokeStyle = "#ffe0e8";
      context.globalAlpha = 0.75;
      context.lineWidth = 0.9;
      context.beginPath();
      context.moveTo(-2, -6);
      context.lineTo(1, 1);
      context.lineTo(-1.5, 4);
      context.moveTo(2, -4);
      context.lineTo(0.5, 2);
      context.stroke();
      context.save();
      tracePoly(context, pts);
      context.clip();
      shine = ((time * 18) % 30) - 15;
      context.globalAlpha = 0.28;
      context.fillStyle = "#ffffff";
      context.fillRect(shine, span.minY, 2.4, span.h);
      context.restore();
    } else if (fx === "starburst") {
      context.strokeStyle = "#ffffff";
      context.globalAlpha = 0.55 + 0.3 * Math.sin(time * 7);
      context.lineWidth = 1.1;
      for (i = 0; i < 8; i++) {
        a = i * Math.PI / 4 + time * 0.4;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(Math.cos(a) * 13, Math.sin(a) * 13);
        context.stroke();
      }
      context.fillStyle = "#ffffff";
      context.globalAlpha = 0.7;
      context.beginPath();
      context.arc(0, 0, 2.2 + Math.sin(time * 9) * 0.6, 0, Math.PI * 2);
      context.fill();
    } else if (fx === "cyclone") {
      context.strokeStyle = "#ffffff";
      context.globalAlpha = 0.4 + 0.2 * Math.sin(time * 8);
      context.lineWidth = 1.2;
      context.beginPath();
      context.arc(0, 0, 8 + Math.sin(time * 5), time, time + 4);
      context.stroke();
    } else if (fx === "lightning") {
      context.strokeStyle = accent;
      context.globalAlpha = 0.55 + 0.4 * Math.max(0, Math.sin(time * 18));
      context.lineWidth = 1.4;
      context.beginPath();
      context.moveTo(-2, -14);
      context.lineTo(3, -6);
      context.lineTo(-3, -1);
      context.lineTo(4, 6);
      context.lineTo(-1, 12);
      context.stroke();
      context.strokeStyle = "#ffffff";
      context.globalAlpha = 0.35;
      strokePoly(context, pts);
    } else if (fx === "jade") {
      context.strokeStyle = accent;
      context.globalAlpha = 0.7;
      context.lineWidth = 1.1;
      context.strokeRect(-5, -5, 10, 10);
      context.beginPath();
      context.moveTo(0, -5);
      context.lineTo(5, 0);
      context.lineTo(0, 5);
      context.lineTo(-5, 0);
      context.closePath();
      context.stroke();
    } else if (fx === "sentinel") {
      context.strokeStyle = "#ffffff";
      context.globalAlpha = 0.6 + 0.25 * Math.sin(time * 4);
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(0, -2, 11, Math.PI * 1.15, Math.PI * 1.85);
      context.stroke();
      context.strokeStyle = accent;
      context.globalAlpha = 0.5;
      strokePoly(context, pts);
    } else if (fx === "inferno") {
      context.fillStyle = "#ffe08a";
      context.globalAlpha = 0.45 + 0.3 * Math.sin(time * 16);
      for (i = 0; i < 5; i++) {
        context.beginPath();
        context.arc((i - 2) * 3.2, 8 + Math.sin(time * 14 + i) * 2, 1.2, 0, Math.PI * 2);
        context.fill();
      }
    } else if (fx === "sunburst") {
      context.fillStyle = "#fff4c0";
      context.globalAlpha = 0.5 + 0.3 * Math.sin(time * 8);
      context.beginPath();
      context.arc(0, 0, 2.8, 0, Math.PI * 2);
      context.fill();
    } else if (fx === "obsidian") {
      context.strokeStyle = accent;
      context.globalAlpha = 0.55;
      context.lineWidth = 1.2;
      strokePoly(context, pts);
      context.strokeStyle = "#ffffff";
      context.globalAlpha = 0.25;
      context.beginPath();
      context.moveTo(-6, -8);
      context.lineTo(2, 2);
      context.stroke();
    } else if (fx === "carrion") {
      context.fillStyle = "#ffe08a";
      context.globalAlpha = 0.4;
      context.beginPath();
      context.arc(-6, -8, 1.4, 0, Math.PI * 2);
      context.arc(6, -8, 1.4, 0, Math.PI * 2);
      context.fill();
    } else if (fx === "fortress") {
      context.strokeStyle = "#ffffff";
      context.globalAlpha = 0.4;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(-8, -4);
      context.lineTo(8, 6);
      context.stroke();
    } else if (fx === "goldwing") {
      context.strokeStyle = "#fff4c0";
      context.globalAlpha = 0.55 + 0.2 * Math.sin(time * 4);
      context.lineWidth = 1.1;
      strokePoly(context, pts);
    } else if (fx === "ward") {
      context.strokeStyle = accent;
      context.globalAlpha = 0.6;
      context.lineWidth = 1.1;
      context.beginPath();
      context.moveTo(-6, -4);
      context.lineTo(0, -9);
      context.lineTo(6, -4);
      context.lineTo(6, 4);
      context.lineTo(0, 8);
      context.lineTo(-6, 4);
      context.closePath();
      context.stroke();
    } else if (fx === "rift") {
      context.strokeStyle = accent;
      context.globalAlpha = 0.85;
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(0, span.minY - 1);
      context.lineTo(-1.2, 0);
      context.lineTo(1.2, 4);
      context.lineTo(0, span.maxY + 1);
      context.stroke();
      context.fillStyle = "#050510";
      context.globalAlpha = 0.7;
      context.beginPath();
      context.arc(0, 1, 2.2, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
  function drawModFxBack(context, modId, hull, def) {
    if (!modId) return;
    context.save();
    if (modId === "magnet") {
      context.strokeStyle = hull;
      context.globalAlpha = 0.22 + 0.1 * Math.sin(time * 3);
      context.lineWidth = 1;
      context.setLineDash([3, 4]);
      context.beginPath();
      context.arc(0, 0, 20 + Math.sin(time * 2) * 2, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
    } else if (modId === "afterburner") {
      context.globalAlpha = 0.4 + 0.25 * Math.sin(time * 14);
      context.fillStyle = "#ff9a3d";
      context.beginPath();
      context.moveTo(-3.5, 8);
      context.lineTo(0, 18 + Math.sin(time * 20) * 3);
      context.lineTo(3.5, 8);
      context.closePath();
      context.fill();
    } else if (modId === "fortune" || modId === "salvage") {
      context.fillStyle = "#ffd23d";
      context.globalAlpha = 0.45 + 0.25 * Math.sin(time * 5);
      context.beginPath();
      context.arc(-10, -4, 1.4, 0, Math.PI * 2);
      context.arc(11, 3, 1.2, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
  function drawModFxFront(context, modId, hull, def) {
    if (!modId) return;
    context.save();
    if (modId === "reactor") {
      context.strokeStyle = "#ffe08a";
      context.globalAlpha = 0.5 + 0.3 * Math.sin(time * 6);
      context.lineWidth = 1.3;
      context.beginPath();
      context.arc(0, 1, 4.5, 0, Math.PI * 2);
      context.stroke();
    } else if (modId === "overdrive") {
      context.fillStyle = "#7ef9ff";
      context.globalAlpha = 0.4 + 0.3 * Math.sin(time * 16);
      context.fillRect(-1, 6, 2, 5);
    } else if (modId === "berserk") {
      context.strokeStyle = "#ff4d4d";
      context.globalAlpha = 0.4 + 0.3 * Math.sin(time * 8);
      context.lineWidth = 1.4;
      context.beginPath();
      context.arc(0, 0, 11 + (def && def.r ? def.r * 0.1 : 1), 0, Math.PI * 2);
      context.stroke();
    } else if (modId === "ascension") {
      context.strokeStyle = "#ffd23d";
      context.globalAlpha = 0.4 + 0.2 * Math.sin(time * 4);
      context.lineWidth = 1.1;
      context.beginPath();
      context.moveTo(0, -14);
      context.lineTo(3, -9);
      context.lineTo(-3, -9);
      context.closePath();
      context.stroke();
    }
    context.restore();
  }

  function drawBoss(context, e, col) {
    var d = bossDef(e.type) || BOSS_DEFS[0];
    var dark = e.hitFlash > 0 ? "#fff" : d.dark;
    var t = time, i, a;
    if (e.phaseIdx >= 1) {
      context.globalAlpha = 0.25 + 0.15 * Math.sin(t * 9);
      context.strokeStyle = e.phaseIdx >= 2 ? "#ff4d4d" : col;
      context.lineWidth = 1.5;
      context.beginPath(); context.arc(0, 0, e.r + 6 + Math.sin(t * 9) * 2, 0, Math.PI * 2); context.stroke();
      context.globalAlpha = 1;
    }
    if (e.shieldHp > 0) {
      context.globalAlpha = 0.7;
      context.strokeStyle = "#c8d6ff";
      context.lineWidth = 1.5 + e.shieldHp;
      context.beginPath(); context.arc(0, 0, e.r + 3, 0, Math.PI * 2); context.stroke();
      context.globalAlpha = 1;
    }
    if ((e.healFlash || 0) > 0) {
      context.globalAlpha = 0.3 + 0.35 * Math.sin(t * 14);
      context.strokeStyle = "#7affc4";
      context.lineWidth = 2;
      context.beginPath(); context.arc(0, 0, e.r + 8 + Math.sin(t * 12) * 2, 0, Math.PI * 2); context.stroke();
      context.globalAlpha = 1;
    }
    context.fillStyle = col;
    if (e.type === "seraph") {
      context.beginPath();
      context.moveTo(0, -14); context.quadraticCurveTo(20, -4, 18, 8); context.lineTo(0, 4); context.lineTo(-18, 8); context.quadraticCurveTo(-20, -4, 0, -14);
      context.fill();
      if (e.phaseIdx >= 1) {
        context.globalAlpha = 0.55;
        context.beginPath(); context.moveTo(0, -6); context.quadraticCurveTo(30, -14, 26, 2); context.lineTo(4, -2); context.closePath(); context.fill();
        context.beginPath(); context.moveTo(0, -6); context.quadraticCurveTo(-30, -14, -26, 2); context.lineTo(-4, -2); context.closePath(); context.fill();
        context.globalAlpha = 1;
      }
      context.fillStyle = dark;
      context.beginPath(); context.arc(-5, -2, 2.4, 0, Math.PI * 2); context.arc(5, -2, 2.4, 0, Math.PI * 2); context.fill();
    } else if (e.type === "wraith") {
      context.beginPath();
      context.moveTo(0, -16); context.lineTo(5, -4); context.lineTo(16, 0); context.lineTo(5, 4);
      context.lineTo(0, 16); context.lineTo(-5, 4); context.lineTo(-16, 0); context.lineTo(-5, -4);
      context.closePath(); context.fill();
      context.fillStyle = dark;
      context.beginPath(); context.arc(0, 0, 3.5, 0, Math.PI * 2); context.fill();
    } else if (e.type === "hydra") {
      context.beginPath(); context.ellipse(0, 4, 16, 8, 0, 0, Math.PI * 2); context.fill();
      context.beginPath(); context.ellipse(-12, -6, 8, 7, -0.3, 0, Math.PI * 2); context.fill();
      context.beginPath(); context.ellipse(12, -6, 8, 7, 0.3, 0, Math.PI * 2); context.fill();
      context.beginPath(); context.ellipse(0, -10, 7, 6, 0, 0, Math.PI * 2); context.fill();
      context.fillStyle = dark;
      context.beginPath(); context.arc(-12, -7, 2, 0, Math.PI * 2); context.arc(12, -7, 2, 0, Math.PI * 2); context.arc(0, -11, 2, 0, Math.PI * 2); context.fill();
    } else if (e.type === "colossus") {
      context.beginPath();
      context.moveTo(-18, 2); context.lineTo(-12, -12); context.lineTo(12, -12); context.lineTo(18, 2); context.lineTo(10, 14); context.lineTo(-10, 14);
      context.closePath(); context.fill();
      context.fillRect(-22, -4, 8, 6); context.fillRect(14, -4, 8, 6);
      context.fillStyle = dark;
      context.fillRect(-6, -4, 12, 6);
      if (e.phaseIdx >= 1) { context.fillStyle = "#ff4d4d"; context.fillRect(-4, -2, 8, 2); }
    } else if (e.type === "chronos") {
      context.beginPath(); context.arc(0, 0, 18, 0, Math.PI * 2); context.fill();
      context.fillStyle = dark;
      context.beginPath(); context.arc(0, 0, 13, 0, Math.PI * 2); context.fill();
      context.strokeStyle = col; context.lineWidth = 1.2;
      for (i = 0; i < 12; i++) {
        a = (i / 12) * Math.PI * 2;
        context.beginPath(); context.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); context.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); context.stroke();
      }
      context.lineWidth = 2;
      a = t * (e.phaseIdx >= 1 ? -3 : 1.6);
      context.beginPath(); context.moveTo(0, 0); context.lineTo(Math.cos(a) * 9, Math.sin(a) * 9); context.stroke();
      context.lineWidth = 1.2;
      context.beginPath(); context.moveTo(0, 0); context.lineTo(Math.cos(a * 0.3) * 6, Math.sin(a * 0.3) * 6); context.stroke();
      context.fillStyle = col;
      context.fillRect(-4, -22, 8, 5); context.fillRect(-22, -3, 5, 6); context.fillRect(17, -3, 5, 6);
    } else if (e.type === "leviathan") {
      context.beginPath();
      context.moveTo(-24, 4); context.quadraticCurveTo(-14, -14, 0, -10); context.quadraticCurveTo(14, -14, 24, 4);
      context.quadraticCurveTo(14, 12, 0, 8); context.quadraticCurveTo(-14, 12, -24, 4);
      context.fill();
      for (i = -2; i <= 2; i++) {
        context.beginPath(); context.moveTo(i * 9, -9 + Math.abs(i)); context.lineTo(i * 9 - 3, -18 + Math.abs(i) * 2 + Math.sin(t * 5 + i) * 1.5); context.lineTo(i * 9 + 3, -18 + Math.abs(i) * 2 + Math.sin(t * 5 + i) * 1.5); context.closePath(); context.fill();
      }
      context.fillStyle = dark;
      context.beginPath(); context.ellipse(-9, 0, 3.2, 2.2, 0, 0, Math.PI * 2); context.ellipse(9, 0, 3.2, 2.2, 0, 0, Math.PI * 2); context.fill();
      context.fillStyle = e.hitFlash > 0 ? "#fff" : "#7ef9ff";
      context.beginPath(); context.arc(-9, 0, 1.2, 0, Math.PI * 2); context.arc(9, 0, 1.2, 0, Math.PI * 2); context.fill();
    } else if (e.type === "inferno") {
      for (i = 0; i < 8; i++) {
        a = (i / 8) * Math.PI * 2 + t * 0.8;
        context.beginPath();
        context.moveTo(Math.cos(a) * 12, Math.sin(a) * 12);
        context.lineTo(Math.cos(a + 0.3) * (20 + Math.sin(t * 6 + i) * 3), Math.sin(a + 0.3) * (20 + Math.sin(t * 6 + i) * 3));
        context.lineTo(Math.cos(a + 0.6) * 12, Math.sin(a + 0.6) * 12);
        context.closePath(); context.fill();
      }
      context.beginPath(); context.arc(0, 0, 13, 0, Math.PI * 2); context.fill();
      context.fillStyle = e.hitFlash > 0 ? "#fff" : (e.phaseIdx >= 1 ? "#fff0c0" : "#ffd23d");
      context.beginPath(); context.arc(0, 0, 8, 0, Math.PI * 2); context.fill();
      context.fillStyle = dark;
      context.beginPath(); context.arc(-3, -1, 1.6, 0, Math.PI * 2); context.arc(3, -1, 1.6, 0, Math.PI * 2); context.fill();
    } else if (e.type === "nullwarden") {
      context.beginPath();
      context.moveTo(0, -20); context.lineTo(12, -10); context.lineTo(18, 6); context.lineTo(8, 16); context.lineTo(-8, 16); context.lineTo(-18, 6); context.lineTo(-12, -10);
      context.closePath(); context.fill();
      context.fillStyle = dark;
      context.beginPath(); context.arc(0, 0, 9 + Math.sin(t * 4) * 1.5, 0, Math.PI * 2); context.fill();
      context.strokeStyle = col; context.lineWidth = 1;
      context.globalAlpha = 0.7;
      context.beginPath(); context.ellipse(0, 0, 14, 5, t * 1.3, 0, Math.PI * 2); context.stroke();
      context.beginPath(); context.ellipse(0, 0, 14, 5, t * 1.3 + 1.05, 0, Math.PI * 2); context.stroke();
      context.beginPath(); context.ellipse(0, 0, 14, 5, t * 1.3 + 2.1, 0, Math.PI * 2); context.stroke();
      context.globalAlpha = 1;
      context.fillStyle = e.hitFlash > 0 ? "#fff" : "#ffffff";
      context.beginPath(); context.arc(0, 0, 1.6, 0, Math.PI * 2); context.fill();
    } else if (e.type === "basilisk") {
      context.beginPath();
      context.moveTo(0, -16); context.lineTo(14, -8); context.lineTo(20, 4); context.lineTo(12, 6); context.lineTo(6, 14); context.lineTo(-6, 14); context.lineTo(-12, 6); context.lineTo(-20, 4); context.lineTo(-14, -8);
      context.closePath(); context.fill();
      context.fillStyle = dark;
      for (i = 0; i < 3; i++) context.fillRect(-9 + i * 8, -6, 2.4, 8);
      context.fillStyle = e.hitFlash > 0 ? "#fff" : "#ff4d9a";
      context.beginPath(); context.ellipse(-7, -8, 3, 1.6, 0.3, 0, Math.PI * 2); context.ellipse(7, -8, 3, 1.6, -0.3, 0, Math.PI * 2); context.fill();
      context.fillStyle = col;
      context.beginPath(); context.moveTo(-2, 14); context.lineTo(2, 14); context.lineTo(Math.sin(t * 6) * 4, 22); context.closePath(); context.fill();
    } else if (e.type === "overlord") {
      context.beginPath();
      context.moveTo(-26, 0); context.lineTo(-16, -14); context.lineTo(16, -14); context.lineTo(26, 0); context.lineTo(18, 16); context.lineTo(-18, 16);
      context.closePath(); context.fill();
      context.fillStyle = "#ff7a3d";
      context.fillRect(-30, -6, 8, 10); context.fillRect(22, -6, 8, 10);
      context.fillStyle = dark;
      context.beginPath(); context.arc(0, 1, 9, 0, Math.PI * 2); context.fill();
      context.fillStyle = e.hitFlash > 0 ? "#fff" : (e.phaseIdx >= 1 ? "#ff4d4d" : "#ffd23d");
      context.beginPath(); context.arc(0, 1, 4.5 + (e.phaseIdx >= 1 ? Math.sin(t * 10) * 1.2 : 0), 0, Math.PI * 2); context.fill();
      context.fillStyle = col;
      context.fillRect(-12, -18, 6, 5); context.fillRect(6, -18, 6, 5);
    } else if (e.type === "mandala") {
      for (i = 0; i < 6; i++) {
        a = (i / 6) * Math.PI * 2 + t * 0.6;
        context.beginPath();
        context.ellipse(Math.cos(a) * 8, Math.sin(a) * 8, 7, 3.4, a, 0, Math.PI * 2);
        context.fill();
      }
      context.fillStyle = dark;
      context.beginPath(); context.arc(0, 0, 6, 0, Math.PI * 2); context.fill();
      context.fillStyle = e.hitFlash > 0 ? "#fff" : "#ffd23d";
      context.beginPath(); context.arc(0, 0, 2.4 + (e.phaseIdx >= 2 ? Math.sin(t * 12) * 0.8 : 0), 0, Math.PI * 2); context.fill();
    } else if (e.type === "myrmidon") {
      context.beginPath();
      for (i = 0; i < 6; i++) {
        a = i * Math.PI / 3 - Math.PI / 6;
        if (i === 0) context.moveTo(Math.cos(a) * 16, Math.sin(a) * 16);
        else context.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
      }
      context.closePath(); context.fill();
      context.fillStyle = dark;
      context.fillRect(-4, -6, 8, 7);
      context.fillStyle = col;
      context.fillRect(-2, -14, 1.6, 8); context.fillRect(0.4, -14, 1.6, 8);
      context.fillStyle = e.hitFlash > 0 ? "#fff" : "#fff0c0";
      context.beginPath(); context.arc(-4, -2, 1.6, 0, Math.PI * 2); context.arc(4, -2, 1.6, 0, Math.PI * 2); context.fill();
    } else if (e.type === "kaleido") {
      context.beginPath();
      context.moveTo(0, -16); context.lineTo(12, 0); context.lineTo(0, 16); context.lineTo(-12, 0);
      context.closePath(); context.fill();
      context.fillStyle = dark;
      context.beginPath();
      context.moveTo(0, -8); context.lineTo(6, 0); context.lineTo(0, 8); context.lineTo(-6, 0);
      context.closePath(); context.fill();
      context.strokeStyle = e.hitFlash > 0 ? "#fff" : "#e8ffff";
      context.lineWidth = 1.2;
      context.beginPath(); context.moveTo(-10, -4); context.lineTo(10, 4); context.moveTo(-8, 8); context.lineTo(8, -8); context.stroke();
    } else if (e.type === "harrow") {
      context.beginPath();
      context.moveTo(-4, -6); context.quadraticCurveTo(18, -16, 20, 2); context.quadraticCurveTo(10, 8, -2, 6);
      context.closePath(); context.fill();
      context.beginPath();
      context.moveTo(4, -6); context.quadraticCurveTo(-18, -16, -20, 2); context.quadraticCurveTo(-10, 8, 2, 6);
      context.closePath(); context.fill();
      context.fillStyle = dark;
      context.fillRect(-3, -2, 6, 16);
      context.fillStyle = e.hitFlash > 0 ? "#fff" : "#e8e0d0";
      context.fillRect(-5, 12, 10, 3);
    } else if (e.type === "nexus") {
      context.fillRect(-14, -14, 28, 28);
      context.fillStyle = dark;
      context.fillRect(-9, -9, 18, 18);
      context.strokeStyle = col; context.lineWidth = 1.4;
      context.beginPath(); context.moveTo(-14, 0); context.lineTo(14, 0); context.moveTo(0, -14); context.lineTo(0, 14); context.stroke();
      context.fillStyle = e.hitFlash > 0 ? "#fff" : (e.phaseIdx >= 2 ? "#ff4d4d" : "#7effd0");
      context.beginPath(); context.arc(-12, -12, 2.2, 0, Math.PI * 2); context.arc(12, -12, 2.2, 0, Math.PI * 2);
      context.arc(-12, 12, 2.2, 0, Math.PI * 2); context.arc(12, 12, 2.2, 0, Math.PI * 2); context.fill();
    } else {
      context.beginPath(); context.arc(0, 0, e.r, 0, Math.PI * 2); context.fill();
    }
  }

  function drawEnemy(context, e) {
    var col = e.hitFlash > 0 ? "#ffffff" : enemyColor(e.type);
    context.save();
    context.translate(e.x, e.y);
    if (e.state === "dive" || e.state === "kami" || e.state === "charge" || e.state === "lunge") context.rotate(Math.sin(time * 10 + e.phase) * 0.2);
    glow(context, col, e.isBoss ? 14 : 8);
    context.fillStyle = col;
    if (e.isBoss) {
      drawBoss(context, e, col);
    } else if (e.type === "grunt") {
      context.beginPath(); context.ellipse(0, 0, 7, 5.5, 0, 0, Math.PI * 2); context.fill();
      context.globalAlpha = 0.7;
      context.beginPath(); context.ellipse(-7, 0, 4, 2.5, -0.4, 0, Math.PI * 2); context.ellipse(7, 0, 4, 2.5, 0.4, 0, Math.PI * 2); context.fill();
      context.globalAlpha = 1;
    } else if (e.type === "sniper") {
      context.beginPath();
      context.moveTo(0, 9); context.lineTo(4, -7); context.lineTo(-4, -7); context.closePath(); context.fill();
      context.fillRect(-1.2, 6, 2.4, 8);
    } else if (e.type === "tank") {
      context.beginPath();
      context.moveTo(-10, 0); context.lineTo(-6, -8); context.lineTo(6, -8); context.lineTo(10, 0); context.lineTo(5, 8); context.lineTo(-5, 8);
      context.closePath(); context.fill();
      context.fillStyle = e.hitFlash > 0 ? "#fff" : "#143322";
      context.fillRect(-4, -3, 8, 5);
    } else if (e.type === "weaver") {
      context.beginPath();
      context.moveTo(0, -8); context.lineTo(8, 0); context.lineTo(0, 8); context.lineTo(-8, 0);
      context.closePath(); context.fill();
    } else if (e.type === "kami") {
      context.beginPath();
      context.moveTo(0, 10); context.lineTo(6, -8); context.lineTo(0, -4); context.lineTo(-6, -8);
      context.closePath(); context.fill();
    } else if (e.type === "shield") {
      context.beginPath(); context.arc(0, 0, 8, 0, Math.PI * 2); context.fill();
      if (e.shieldHp > 0) {
        context.strokeStyle = "#c8d6ff";
        context.lineWidth = 2 + e.shieldHp;
        context.beginPath(); context.arc(0, 3, 11, 0.15, Math.PI - 0.15); context.stroke();
      }
    } else if (e.type === "mortar") {
      context.beginPath();
      context.moveTo(-8, 4); context.lineTo(-5, -7); context.lineTo(5, -7); context.lineTo(8, 4);
      context.lineTo(3, 8); context.lineTo(-3, 8);
      context.closePath(); context.fill();
      context.fillStyle = e.hitFlash > 0 ? "#fff" : "#401408";
      context.fillRect(-2, -2, 4, 9);
    } else if (e.type === "hex") {
      context.beginPath();
      for (var hx = 0; hx < 6; hx++) {
        var ha = hx * Math.PI / 3 - Math.PI / 6;
        if (hx === 0) context.moveTo(Math.cos(ha) * 8, Math.sin(ha) * 8);
        else context.lineTo(Math.cos(ha) * 8, Math.sin(ha) * 8);
      }
      context.closePath(); context.fill();
      context.fillStyle = e.hitFlash > 0 ? "#fff" : "#2a1040";
      context.beginPath(); context.arc(0, 0, 2.4, 0, Math.PI * 2); context.fill();
    } else if (e.type === "harrier") {
      context.beginPath();
      context.moveTo(0, 9); context.lineTo(9, -2); context.lineTo(3, -7); context.lineTo(0, -3);
      context.lineTo(-3, -7); context.lineTo(-9, -2);
      context.closePath(); context.fill();
    } else if (e.type === "bulwark") {
      context.beginPath();
      context.moveTo(-10, 2); context.lineTo(-7, -8); context.lineTo(7, -8); context.lineTo(10, 2);
      context.lineTo(6, 8); context.lineTo(-6, 8);
      context.closePath(); context.fill();
      context.fillStyle = e.hitFlash > 0 ? "#fff" : "#103328";
      context.fillRect(-1.5, -5, 3, 10);
      context.fillRect(-5, -1.5, 10, 3);
    } else if (e.type === "archon") {
      context.beginPath();
      context.moveTo(0, 12); context.lineTo(12, -2); context.lineTo(7, -10); context.lineTo(0, -6);
      context.lineTo(-7, -10); context.lineTo(-12, -2);
      context.closePath(); context.fill();
      context.fillStyle = e.hitFlash > 0 ? "#fff" : (e.phaseIdx >= 1 ? "#ff5c7a" : "#ff8a5c");
      context.beginPath(); context.arc(0, -1, 3.2, 0, Math.PI * 2); context.fill();
    }
    if (!e.isBoss && e.type !== "shield" && e.shieldHp > 0) {
      context.globalAlpha = 0.55 + 0.2 * Math.sin(time * 8 + e.phase);
      context.strokeStyle = "#c8d6ff";
      context.lineWidth = 2;
      context.beginPath(); context.arc(0, 0, e.r + 4, 0, Math.PI * 2); context.stroke();
      context.globalAlpha = 1;
    }
    if (!e.isBoss && (e.healFlash || 0) > 0) {
      context.globalAlpha = 0.35 + 0.3 * Math.sin(time * 14);
      context.strokeStyle = "#7affc4";
      context.lineWidth = 2;
      context.beginPath(); context.arc(0, 0, e.r + 7, 0, Math.PI * 2); context.stroke();
      context.globalAlpha = 1;
    }
    noGlow(context);
    if (e.leech) {
      context.globalAlpha = 0.45 + 0.35 * Math.sin(time * 12 + e.phase);
      context.strokeStyle = "#3dffb0";
      context.lineWidth = 1.5;
      context.beginPath(); context.arc(0, 0, e.r + 4 + Math.sin(time * 10) * 1.2, 0, Math.PI * 2); context.stroke();
      context.globalAlpha = 1;
    }
    if ((e.freezeT || 0) > 0) {
      context.globalAlpha = 0.42;
      context.fillStyle = "#c8f4ff";
      context.beginPath(); context.arc(0, 0, e.r + 1, 0, Math.PI * 2); context.fill();
      context.globalAlpha = 1;
    }
    if ((e.burnTicks || 0) > 0) {
      context.globalAlpha = 0.32 + 0.12 * Math.sin(time * 14);
      context.fillStyle = "#ff7a3d";
      context.beginPath(); context.arc(0, 0, e.r * 0.78, 0, Math.PI * 2); context.fill();
      context.globalAlpha = 1;
    }
    context.restore();
  }

  function draw() {
    if (!ctx) return;
    var i, p, b, sx = 0, sy = 0, alpha, boss, pct;
    if (shake > 0) { sx = (Math.random() - 0.5) * shake; sy = (Math.random() - 0.5) * shake; }
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = "#050510";
    ctx.fillRect(-8, -8, W + 16, H + 16);
    ctx.save();
    if (pvpFlipped()) {
      ctx.translate(W, H);
      ctx.rotate(Math.PI);
    }

    for (i = 0; i < stars.length; i++) {
      p = stars[i];
      ctx.globalAlpha = 0.35 + p.s * 0.35;
      ctx.fillStyle = "#c8e8ff";
      ctx.fillRect(p.x, p.y, p.s, p.s);
    }
    ctx.globalAlpha = 1;

    for (i = 0; i < teles.length; i++) {
      p = teles[i];
      alpha = 0.25 + 0.45 * (p.t / p.max) * (0.5 + 0.5 * Math.sin(time * 18));
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = p.color;
      ctx.fillStyle = p.color;
      ctx.lineWidth = 1.5;
      if (p.kind === "line" || p.kind === "vline" || p.kind === "hline") {
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x2, p.y2); ctx.stroke();
      } else if (p.kind === "ring") {
        ctx.beginPath(); ctx.arc(p.x, p.y, 16 + (1 - p.t / p.max) * 10, 0, Math.PI * 2); ctx.stroke();
      } else if (p.kind === "glow" || p.kind === "flash") {
        ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
      } else if (p.kind === "zone") {
        ctx.globalAlpha = alpha * 0.45;
        ctx.fillRect(p.x - p.x2, p.y - p.y2, p.x2 * 2, p.y2 * 2);
        ctx.globalAlpha = alpha;
        ctx.strokeRect(p.x - p.x2, p.y - p.y2, p.x2 * 2, p.y2 * 2);
      }
      ctx.globalAlpha = 1;
    }

    drawBossFx(ctx);
    drawHydraLeech(ctx);
    for (i = 0; i < enemies.length; i++) if (enemies[i].alive) drawEnemy(ctx, enemies[i]);

    for (i = 0; i < pickups.length; i++) {
      p = pickups[i];
      var pkScale = pickupScale(p);
      ctx.save();
      ctx.translate(p.x, p.y + Math.sin(p.bob) * 2);
      glow(ctx, pickupColor(p.kind), p.kind === "revive" ? 18 : 10);
      ctx.fillStyle = pickupColor(p.kind);
      if (p.kind === "coin") {
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        noGlow(ctx);
        ctx.fillStyle = "#40280a";
        ctx.font = "bold 7px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.amount > 1 ? String(p.amount) : "C", 0, 0.5);
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -7 * pkScale); ctx.lineTo(6 * pkScale, 0); ctx.lineTo(0, 7 * pkScale); ctx.lineTo(-6 * pkScale, 0);
        ctx.closePath(); ctx.fill();
        noGlow(ctx);
        ctx.fillStyle = "#fff8f8";
        if (p.kind === "heal") {
          ctx.fillRect(-1.4, -5.2, 2.8, 10.4);
          ctx.fillRect(-5.2, -1.4, 10.4, 2.8);
        } else if (p.kind === "revive") {
          ctx.fillRect(-2.2, -8, 4.4, 16);
          ctx.fillRect(-8, -2.2, 16, 4.4);
        } else {
          ctx.fillStyle = "#041018";
          ctx.font = "bold 6px ui-sans-serif, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.kind === "life" ? "1" : p.kind.charAt(0).toUpperCase(), 0, 0);
        }
      }
      ctx.restore();
    }

    ctx.save();
    for (i = 0; i < pbul.length; i++) {
      b = pbul[i];
      if (b.homing) {
        glow(ctx, b.bolt ? "#ffd23d" : "#d46bff", 10);
        ctx.fillStyle = b.bolt ? "#fff0c0" : "#f0c8ff";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r || 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.splash) {
        glow(ctx, "#ffb060", 14);
        ctx.fillStyle = "#fff0c0";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r || 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffb060";
        ctx.beginPath();
        ctx.arc(b.x, b.y + 5, (b.r || 4) * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.gun === "scatter") {
        glow(ctx, "#ff9a3d", 8);
        ctx.fillStyle = "#ffe0c0";
        ctx.beginPath();
        ctx.arc(b.x, b.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        var pierceCol = b.gun === "prism" ? "#e0c8ff" : b.gun === "railgun" ? "#c8f0ff" : "#ffe08a";
        glow(ctx, b.pierce ? pierceCol : b.helix ? "#b6ff4d" : "#7ef9ff", 10);
        ctx.strokeStyle = b.pierce ? (b.gun === "prism" ? "#f8f0ff" : "#fff4c8") : b.helix ? "#eaffd0" : "#e8ffff";
        ctx.lineWidth = b.pierce ? (b.gun === "railgun" ? 3.2 : 2.6) : 2;
        ctx.beginPath();
        ctx.moveTo(b.x - (b.vx || 0) * 0.012, b.y + (b.pierce ? (b.gun === "railgun" ? 18 : 12) : 8));
        ctx.lineTo(b.x, b.y - 3);
        ctx.stroke();
      }
    }
    noGlow(ctx);
    ctx.restore();

    for (i = 0; i < ebul.length; i++) {
      b = ebul[i];
      glow(ctx, b.glow || "#ff6b9a", b.mine ? 12 : 8);
      ctx.fillStyle = b.color || "#ffd0e0";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r || 2.3, 0, Math.PI * 2);
      ctx.fill();
      noGlow(ctx);
    }

    for (i = 0; i < rings.length; i++) {
      p = rings[i];
      alpha = Math.max(0, p.life / 0.45);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      ctx.globalAlpha = Math.max(0, p.life / 0.45);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    for (i = 0; i < skinDecoys.length; i++) {
      p = skinDecoys[i];
      ctx.save();
      ctx.globalAlpha = 0.28 + 0.12 * Math.sin(time * 8);
      glow(ctx, "#c8f8ff", 14);
      ctx.strokeStyle = "#e8ffff";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 8);
      ctx.lineTo(p.x + 6, p.y + 6);
      ctx.lineTo(p.x - 6, p.y + 6);
      ctx.closePath();
      ctx.stroke();
      noGlow(ctx);
      ctx.restore();
    }

    for (i = 0; i < players.length; i++) {
      p = players[i];
      if (!p || !p.alive) continue;
      if ((p.skinNebulaT || 0) > 0) {
        ctx.save();
        ctx.globalAlpha = 0.18 + 0.08 * Math.sin(time * 6);
        ctx.strokeStyle = "#d46bff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      if (p.facing > 0) {
        ctx.translate(p.x, p.y);
        ctx.scale(1, -1);
        ctx.translate(-p.x, -p.y);
      }
      if (p.boss) {
        drawEnemy(ctx, {
          x: p.x, y: p.y, type: p.boss, r: p.r || 18, isBoss: true,
          hitFlash: p.invuln > 0 ? 0.08 : 0, phaseIdx: 0, healFlash: 0, state: "form", phase: time
        });
      } else {
        drawShip(ctx, p.x, p.y, p.invuln > 0, currentLoadout(p));
      }
      ctx.restore();
      if (p.maxHp) {
        pct = Math.max(0, p.hp / p.maxHp);
        ctx.fillStyle = "rgba(8,10,24,0.7)";
        ctx.fillRect(p.x - 16, p.y + (p.facing > 0 ? 16 : -22), 32, 4);
        ctx.fillStyle = enemyColor(p.boss);
        ctx.fillRect(p.x - 16, p.y + (p.facing > 0 ? 16 : -22), 32 * pct, 4);
      } else if (players.length > 1) {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = shipDef(p).color || "#e8f6ff";
        ctx.font = "bold 6px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(playerTag(p.slot) + "  " + p.lives, p.x, p.y + (p.facing > 0 ? -16 : 10));
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();

    boss = currentBoss();
    if (!boss) {
      var arch = currentArchon();
      if (arch) {
        pct = Math.max(0, arch.hp / arch.maxHp);
        ctx.fillStyle = "rgba(8,10,24,0.7)";
        ctx.fillRect(28, 8, W - 56, 8);
        ctx.fillStyle = arch.phaseIdx >= 1 ? "#ff5c7a" : "#ffd6a0";
        ctx.fillRect(28, 8, (W - 56) * pct, 8);
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.strokeRect(28, 8, W - 56, 8);
        ctx.fillStyle = "#e8f6ff";
        ctx.font = "bold 7px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(arch.phaseIdx >= 1 ? "ARCHON  ·  ENRAGED" : "ARCHON", W / 2, 15);
      }
    }
    if (boss) {
      var bd = bossDef(boss.type) || BOSS_DEFS[0];
      var th = boss.tier >= 1 ? [Math.max(0.6, bd.p2Thresh || 0.5), 0.25] : [bd.p2Thresh || 0.5];
      pct = Math.max(0, boss.hp / boss.maxHp);
      var leechAmt = hydraLeechTotal();
      var leechPct = boss.maxHp > 0 ? Math.min(pct, leechAmt / boss.maxHp) : 0;
      var basePct = Math.max(0, pct - leechPct);
      ctx.fillStyle = "rgba(8,10,24,0.7)";
      ctx.fillRect(16, 8, W - 32, 10);
      ctx.fillStyle = boss.phaseIdx >= 2 ? "#ff4d4d" : enemyColor(boss.type);
      ctx.fillRect(16, 8, (W - 32) * basePct, 10);
      if (leechPct > 0) {
        ctx.fillStyle = (boss.healFlash || 0) > 0 ? "#b8ffe0" : "#3dffb0";
        ctx.fillRect(16 + (W - 32) * basePct, 8, (W - 32) * leechPct, 10);
      }
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.strokeRect(16, 8, W - 32, 10);
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      for (i = 0; i < th.length; i++) {
        ctx.beginPath(); ctx.moveTo(16 + (W - 32) * th[i], 8); ctx.lineTo(16 + (W - 32) * th[i], 18); ctx.stroke();
      }
      ctx.fillStyle = "#e8f6ff";
      ctx.font = "bold 8px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(bossName(boss.type) + (boss.tier ? " +" + boss.tier : "") + (boss.phaseIdx ? "  ·  PHASE " + (boss.phaseIdx + 1) : ""), W / 2, 16);
      if (run.bossHits === 0 && started) {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "7px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("FLAWLESS", 17, 25);
      }
    }

    if (flash > 0.02) {
      ctx.globalAlpha = flash * 0.45;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    if (banner) {
      ctx.globalAlpha = Math.min(1, banner.life * 2);
      ctx.fillStyle = "#7ef9ff";
      ctx.font = "bold 15px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(banner.text, W / 2, H * 0.42);
      ctx.globalAlpha = 1;
    }

    if (muted) {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "9px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("MUTED", W - 8, 14);
    }

    if (netRole) drawNetBadge(ctx);

    ctx.restore();
  }

  function drawNetBadge(context) {
    var st = window.__net && window.__net.stats ? window.__net.stats() : null;
    var path, label, rtt, fill;
    if (!st) return;
    path = st.path || "";
    rtt = st.rtt | 0;
    if (path === "mqtt") {
      label = "MQTT";
      fill = "#ff9a3d";
    } else if (path === "relay") {
      label = "RELAY";
      fill = "#ffd23d";
    } else {
      label = "P2P";
      fill = "#7ef9ff";
    }
    if (rtt > 0) label += " " + rtt + "ms";
    context.save();
    context.globalAlpha = 0.72;
    context.font = "bold 7px ui-sans-serif, system-ui, sans-serif";
    context.textAlign = "left";
    context.textBaseline = "top";
    var w = context.measureText(label).width + 8;
    context.fillStyle = "rgba(4,6,18,0.55)";
    context.fillRect(4, H - 14, w, 11);
    context.fillStyle = fill;
    context.fillText(label, 8, H - 12);
    context.restore();
  }

  function applyDesktopHints() {
    var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    var hint = document.getElementById("hint");
    var help = document.getElementById("hub-help");
    if (!coarse) {
      if (hint) hint.textContent = "A/D move · Space fire · Hangar between runs · P pause · M mute";
      if (help) help.innerHTML = "&larr; &rarr; / A D &mdash; move &nbsp;&middot;&nbsp; Space / click &mdash; fire<br>P / Esc &mdash; pause &nbsp;&middot;&nbsp; M &mdash; mute";
    }
  }

  function layout() {
    var rect = wrap.getBoundingClientRect();
    var availW = rect.width - 6;
    var availH = rect.height - 6;
    var scale = Math.min(availW / W, availH / H);
    if (!isFinite(scale) || scale < 0.45) scale = 0.45;
    viewScale = scale;
    ctx = setupCanvas(canvas, W * scale, H * scale);
    draw();
  }
  function focusGame() { canvas.focus(); }

  function isTypingTarget(t) {
    if (!t) return false;
    var tag = t.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    return !!t.isContentEditable;
  }
  function isGameKey(k) {
    return k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown" ||
      k === " " || k === "Enter" || k === "Escape" ||
      k === "a" || k === "A" || k === "d" || k === "D" ||
      k === "p" || k === "P" || k === "m" || k === "M" ||
      k === "e" || k === "E" || k === "Shift";
  }
  function toggleMute() {
    muted = !muted;
    profile.muted = muted;
    saveProfile();
    if (muted) {
      stopMusic();
      setMasterMute(true);
    } else {
      ensureAudio();
      if (started && !paused && !gameOver) startMusic();
    }
    draw();
  }
  function onKeyDown(e) {
    var k = e.key;
    if (isTypingTarget(e.target)) return;
    if (isGameKey(k)) e.preventDefault();
    if (e.repeat) {
      if (k === "ArrowLeft" || k === "a" || k === "A") input.left = true;
      if (k === "ArrowRight" || k === "d" || k === "D") input.right = true;
      if (k === " ") input.fire = true;
      return;
    }
    if (k === "m" || k === "M") { toggleMute(); return; }
    if (overlayVisible()) {
      if (uiScreen === "hub") {
        if (k === "Enter" || k === " ") startNewGame();
      } else if (uiScreen === "lobby") {
        if (k === "Escape") { leaveNet(); showScreen("hub"); }
        else if (lobbyMode === "join" && (k === "Enter" || k === " ")) lobbyJoinGo();
        else if (lobbyMode === "ready" && netRole === "host" && (k === "Enter" || k === " ")) lobbyStart();
      } else if (uiScreen === "hangar" || uiScreen === "quests" || uiScreen === "ranks") {
        if (k === "Escape" || k === "Backspace") showScreen("hub");
      } else if (uiScreen === "pause") {
        if (k === "Enter" || k === " " || k === "p" || k === "P" || k === "Escape") resumeGame();
      } else if (uiScreen === "summary") {
        if (k === "Enter" || k === " ") startNewGame();
        else if (k === "Escape") showScreen("hub");
      }
      return;
    }
    if (k === "ArrowLeft" || k === "a" || k === "A") input.left = true;
    else if (k === "ArrowRight" || k === "d" || k === "D") input.right = true;
    else if (k === " ") { input.fire = true; ensureAudio(); shootPlayer(); }
    else if (k === "e" || k === "E" || k === "Shift") {
      input.ability = true;
      if (player && player.boss) pvpBossAbility(player);
    }
    else if (k === "p" || k === "P" || k === "Escape") pauseGame();
  }
  function onKeyUp(e) {
    if (isTypingTarget(e.target)) return;
    var k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") input.left = false;
    else if (k === "ArrowRight" || k === "d" || k === "D") input.right = false;
    else if (k === " ") input.fire = false;
    else if (k === "e" || k === "E" || k === "Shift") input.ability = false;
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", function () {
    resetInput();
    if (started && !paused && !gameOver) pauseGame();
  });
  function playAgain() {
    if (isPvp()) {
      showScreen("hub");
      return;
    }
    if (netRole === "client") return;
    if (netRole === "host" && lastCoopSpecs) startNewGame({ coopPlayers: lastCoopSpecs });
    else startNewGame();
  }

  el("btn-play").addEventListener("click", function (e) { e.preventDefault(); leaveNet(); if (pvpApi()) pvpApi().reset("coop"); startNewGame(); });
  el("btn-coop").addEventListener("click", function (e) { e.preventDefault(); openLobby("coop"); });
  el("btn-pvp").addEventListener("click", function (e) { e.preventDefault(); openLobby("pvp"); });
  el("btn-hangar").addEventListener("click", function (e) { e.preventDefault(); showScreen("hangar"); });
  el("btn-quests").addEventListener("click", function (e) { e.preventDefault(); showScreen("quests"); });
  el("btn-board").addEventListener("click", function (e) { e.preventDefault(); showScreen("ranks"); });
  el("btn-hangar-back").addEventListener("click", function (e) { e.preventDefault(); showScreen("hub"); });
  el("btn-quests-back").addEventListener("click", function (e) { e.preventDefault(); showScreen("hub"); });
  el("btn-board-back").addEventListener("click", function (e) { e.preventDefault(); showScreen("hub"); });
  var boardName = el("board-name");
  if (boardName) {
    boardName.addEventListener("blur", commitPilotName);
    boardName.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); boardName.blur(); }
    });
  }
  el("btn-reset-progress").addEventListener("click", function (e) { e.preventDefault(); setResetConfirm(true); });
  el("btn-reset-confirm").addEventListener("click", function (e) { e.preventDefault(); resetAllProgress(); });
  el("btn-reset-cancel").addEventListener("click", function (e) { e.preventDefault(); setResetConfirm(false); });
  el("btn-resume").addEventListener("click", function (e) { e.preventDefault(); resumeGame(); });
  el("btn-quit").addEventListener("click", function (e) { e.preventDefault(); quitToHub(); });
  el("btn-again").addEventListener("click", function (e) { e.preventDefault(); playAgain(); });
  el("btn-summary-hub").addEventListener("click", function (e) { e.preventDefault(); leaveNet(); showScreen("hub"); });
  el("summary-quests").addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    if (t.getAttribute("data-act") === "claim") claimQuest(t.getAttribute("data-scope"), t.getAttribute("data-id"));
  });
  function bindLobbyUi() {
    function tap(id, fn) {
      var node = el(id);
      if (!node) return;
      node.addEventListener("click", function (e) { e.preventDefault(); fn(); });
    }
    tap("btn-lobby-host", lobbyHost);
    tap("btn-lobby-join", function () {
      bindNet();
      setLobbyErr("");
      showLobbyPanel("join");
      var inp = el("lobby-code-in");
      if (inp) { inp.value = ""; }
    });
    tap("btn-lobby-back", function () {
      leaveNet();
      if (pvpApi()) pvpApi().reset("coop");
      showScreen("hub");
    });
    tap("btn-lobby-host-leave", function () { leaveNet(); showLobbyPanel("pick"); renderLobby(); });
    tap("btn-lobby-join-back", function () { leaveNet(); showLobbyPanel("pick"); renderLobby(); });
    tap("btn-lobby-join-go", lobbyJoinGo);
    tap("btn-lobby-start", lobbyStart);
    tap("btn-lobby-leave", function () {
      leaveNet();
      showLobbyPanel("pick");
      renderLobby();
    });
    tap("btn-pvp-bid-lock", function () {
      var api = pvpApi();
      var bidIn = el("lobby-pvp-bid");
      if (!api || !isPvp()) return;
      api.setBid(localSlot, bidIn ? bidIn.value : 0, profile.coins);
      if (netRole === "host") pvpBroadcast();
      else netSend({ t: "bid", slot: localSlot, amount: api.session().bids[localSlot] });
      renderLobby();
    });
    tap("btn-pvp-tutorial-ok", function () {
      var api = pvpApi();
      if (!api) return;
      api.setTutorialDone(localSlot, true);
      if (netRole === "host") pvpBroadcast();
      else netSend({ t: "tutorial", slot: localSlot });
      renderLobby();
    });
    var modes = el("lobby-pvp-modes");
    if (modes) {
      modes.addEventListener("click", function (e) {
        var btn = e.target && e.target.closest ? e.target.closest("[data-pvp-mode]") : null;
        var api = pvpApi();
        if (!btn || netRole !== "host" || !api) return;
        api.setMode(btn.getAttribute("data-pvp-mode"));
        if (api.session().mode === "draft") {
          if (!api.session().seed) api.newSeed();
          api.setPacks(api.makeDraftPacks(pvpCatalogs(), api.session().seed));
          api.session().picks = [{}, {}];
          api.session().draftStep = [0, 0];
        }
        if (api.session().mode === "insane") {
          api.session().bosses = [null, null];
          api.session().tutorials = [false, false];
        }
        pvpBroadcast();
        renderLobby();
      });
    }
    var wagerChk = el("lobby-pvp-wager");
    if (wagerChk) {
      wagerChk.addEventListener("change", function () {
        var api = pvpApi();
        if (!api || netRole !== "host") return;
        api.setWager(wagerChk.checked);
        pvpBroadcast();
        renderLobby();
      });
    }
    var draftCards = el("lobby-pvp-draft-cards");
    if (draftCards) {
      draftCards.addEventListener("click", function (e) {
        var btn = e.target && e.target.closest ? e.target.closest("[data-pvp-draft]") : null;
        var api = pvpApi();
        var cat, id;
        if (!btn || !api) return;
        cat = btn.getAttribute("data-pvp-draft");
        id = btn.getAttribute("data-id");
        api.applyPick(localSlot, cat, id);
        api.advanceDraft(localSlot);
        if (netRole === "host") pvpBroadcast();
        else netSend({ t: "draftpick", slot: localSlot, cat: cat, id: id });
        renderLobby();
      });
    }
    var bossCards = el("lobby-pvp-boss-cards");
    if (bossCards) {
      bossCards.addEventListener("click", function (e) {
        var btn = e.target && e.target.closest ? e.target.closest("[data-pvp-boss]") : null;
        var api = pvpApi();
        if (!btn || !api) return;
        api.setBoss(localSlot, btn.getAttribute("data-pvp-boss"));
        if (netRole === "host") pvpBroadcast();
        else netSend({ t: "bosspick", slot: localSlot, id: btn.getAttribute("data-pvp-boss") });
        renderLobby();
      });
    }
    var codeIn = el("lobby-code-in");
    if (codeIn) {
      codeIn.addEventListener("input", function () {
        codeIn.value = codeIn.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
      });
      codeIn.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); lobbyJoinGo(); }
      });
    }
  }
  bindLobbyUi();
  function hangarRowFrom(t) {
    if (!t || !t.closest) return null;
    return t.closest(".cat-row");
  }
  function hangarItemFrom(t) {
    var row, cat, id;
    if (!t || !t.getAttribute) return null;
    cat = t.getAttribute("data-cat");
    id = t.getAttribute("data-id");
    if (cat && id) return { cat: cat, id: id };
    row = hangarRowFrom(t);
    if (!row) return null;
    cat = row.getAttribute("data-cat");
    id = row.getAttribute("data-id");
    if (!cat || !id) return null;
    return { cat: cat, id: id };
  }
  function ensureHangarGhost() {
    if (hangarGhost && hangarGhost.parentNode) return hangarGhost;
    hangarGhost = document.createElement("div");
    hangarGhost.className = "hangar-ghost hidden";
    document.body.appendChild(hangarGhost);
    return hangarGhost;
  }
  function clearHangarDrag() {
    var row, stage;
    if (hangarDrag && hangarDrag.row) hangarDrag.row.classList.remove("dragging");
    hangarDrag = null;
    if (hangarGhost) hangarGhost.classList.add("hidden");
    stage = el("hangar-stage");
    if (stage) {
      stage.classList.remove("drop-ok");
      stage.classList.remove("drop-bad");
    }
  }
  function hangarOverStage(clientX, clientY) {
    var stage = el("hangar-stage");
    var rect;
    if (!stage) return false;
    rect = stage.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }
  el("hangar-lists").addEventListener("click", function (e) {
    var t = e.target;
    var act, item;
    if (hangarDidDrag) {
      hangarDidDrag = false;
      e.preventDefault();
      return;
    }
    if (!t || !t.getAttribute) return;
    act = t.getAttribute("data-act");
    if (act === "buy") {
      e.preventDefault();
      buyItem(t.getAttribute("data-cat"), t.getAttribute("data-id"));
      return;
    }
    if (act === "equip") {
      e.preventDefault();
      equipItem(t.getAttribute("data-cat"), t.getAttribute("data-id"));
      return;
    }
    item = hangarItemFrom(t);
    if (item) {
      e.preventDefault();
      selectHangarItem(item.cat, item.id);
    }
  });
  el("hangar-lists").addEventListener("pointerdown", function (e) {
    var t = e.target;
    var item, handle, row;
    if (!t || e.button) return;
    handle = t.closest ? t.closest("[data-drag]") : null;
    if (!handle && e.pointerType === "mouse") {
      row = hangarRowFrom(t);
      if (row && !t.getAttribute("data-act")) handle = row;
    }
    if (!handle) return;
    item = hangarItemFrom(handle);
    if (!item) return;
    hangarDrag = {
      cat: item.cat,
      id: item.id,
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      moved: false,
      row: hangarRowFrom(handle)
    };
    try { handle.setPointerCapture(e.pointerId); } catch (err) {}
  });
  function onHangarPointerMove(e) {
    var ghost, dx, dy, over, def, st, stage;
    if (!hangarDrag || e.pointerId !== hangarDrag.pointerId) return;
    dx = e.clientX - hangarDrag.x;
    dy = e.clientY - hangarDrag.y;
    if (!hangarDrag.moved && dx * dx + dy * dy < 64) return;
    hangarDrag.moved = true;
    if (hangarDrag.row) hangarDrag.row.classList.add("dragging");
    ghost = ensureHangarGhost();
    def = catalogDef(hangarDrag.cat, hangarDrag.id);
    ghost.style.background = def ? hangarSwatch(hangarDrag.cat, def) : "#7ef9ff";
    ghost.classList.remove("hidden");
    ghost.style.left = e.clientX + "px";
    ghost.style.top = e.clientY + "px";
    over = hangarOverStage(e.clientX, e.clientY);
    stage = el("hangar-stage");
    if (stage) {
      st = def ? catalogStatus(hangarDrag.cat, def) : "locked";
      stage.classList.toggle("drop-ok", over && st !== "locked" && (st !== "buy" || profile.coins >= (def.cost || 0)));
      stage.classList.toggle("drop-bad", over && (st === "locked" || (st === "buy" && profile.coins < (def.cost || 0))));
    }
    if (over) {
      hangarHover = hangarDrag.cat === "skin" ? "skin" : hangarDrag.cat;
      drawHangarPreview();
    }
  }
  function onHangarPointerUp(e) {
    var applied;
    if (!hangarDrag || e.pointerId !== hangarDrag.pointerId) return;
    if (hangarDrag.moved && hangarOverStage(e.clientX, e.clientY)) {
      hangarDidDrag = true;
      applied = applyHangarItem(hangarDrag.cat, hangarDrag.id);
      if (!applied) selectHangarItem(hangarDrag.cat, hangarDrag.id);
    } else if (hangarDrag.moved) {
      hangarDidDrag = true;
    }
    clearHangarDrag();
    hangarHover = null;
    drawHangarPreview();
  }
  document.addEventListener("pointermove", onHangarPointerMove);
  document.addEventListener("pointerup", onHangarPointerUp);
  document.addEventListener("pointercancel", onHangarPointerUp);
  el("hangar-preview").addEventListener("pointermove", function (e) {
    var loc, spot;
    if (hangarDrag) return;
    loc = hangarCanvasLocal(e, el("hangar-preview"));
    spot = hangarHotspotAt(loc.x, loc.y);
    if (spot !== hangarHover) {
      hangarHover = spot;
      drawHangarPreview();
    }
  });
  el("hangar-preview").addEventListener("pointerleave", function () {
    if (hangarHover && !hangarDrag) {
      hangarHover = null;
      drawHangarPreview();
    }
  });
  el("hangar-preview").addEventListener("click", function (e) {
    var loc = hangarCanvasLocal(e, el("hangar-preview"));
    var spot = hangarHotspotAt(loc.x, loc.y);
    if (!spot) return;
    if (hangarPick && spot) {
      applyHangarItem(hangarPick.cat, hangarPick.id);
      return;
    }
    hangarTab = spot;
    renderHangar();
    drawHangarPreview();
  });
  el("hangar-tabs").addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    var tab = t.getAttribute("data-tab");
    if (tab) { hangarTab = tab; renderHangar(); drawHangarPreview(); }
  });
  el("quest-lists").addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    if (t.getAttribute("data-act") === "claim") claimQuest(t.getAttribute("data-scope"), t.getAttribute("data-id"));
  });
  function pointerToGameX(e) {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return W / 2;
    return clamp((e.clientX - rect.left) / rect.width * W, 0, W);
  }
  function applyPointerSteer(e) {
    if (!player) return;
    var margin = Math.max(10, (player.r || PLAYER_R) + 4);
    pointerSteer.aimX = clamp(pointerToGameX(e), margin, W - margin);
  }
  function endPointerSteer(e) {
    if (!pointerSteer.id) return;
    if (e && e.pointerId !== pointerSteer.id) return;
    pointerSteer.id = 0;
    pointerSteer.aimX = null;
    pointerSteer.fire = false;
  }
  wrap.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    focusGame();
    if (overlayVisible()) return;
    if (!started || paused || gameOver) return;
    if (pointerSteer.id && pointerSteer.id !== e.pointerId) return;
    pointerSteer.id = e.pointerId;
    pointerSteer.fire = true;
    applyPointerSteer(e);
    try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
    ensureAudio();
    shootPlayer();
  });
  wrap.addEventListener("pointermove", function (e) {
    if (!pointerSteer.id || e.pointerId !== pointerSteer.id) return;
    if (!started || paused || gameOver) return;
    applyPointerSteer(e);
  });
  wrap.addEventListener("pointerup", endPointerSteer);
  wrap.addEventListener("pointercancel", endPointerSteer);
  wrap.addEventListener("lostpointercapture", endPointerSteer);
  canvas.addEventListener("touchstart", function (e) { e.preventDefault(); }, { passive: false });
  canvas.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });
  wrap.addEventListener("touchstart", function (e) { e.preventDefault(); }, { passive: false });
  wrap.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });
  canvas.addEventListener("click", function () {
    if (!overlayVisible()) focusGame();
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) return;
    if (started && !paused && !gameOver) pauseGame();
    else if (!started || gameOver) { stopLoop(); paused = true; }
  });
  if (typeof ResizeObserver === "function") {
    new ResizeObserver(function () { layout(); }).observe(wrap);
  }
  window.addEventListener("resize", layout);

  try {
    window.__galaga = {
      spawnWave: spawnWave,
      startNewGame: startNewGame,
      playerCount: playerCount,
      extraPlayers: extraPlayers,
      scaleHp: scaleHp,
      grantPickup: grantPickup,
      spawnPickup: spawnPickup,
      maybeDrop: maybeDrop,
      getWave: function () { return wave; },
      getPickups: function () {
        var out = [], i;
        for (i = 0; i < pickups.length; i++) out.push({ id: pickups[i].id, kind: pickups[i].kind, x: Math.round(pickups[i].x), y: Math.round(pickups[i].y), amount: pickups[i].amount || 1 });
        return out;
      },
      getLives: function () { return lives; },
      getPlayers: function () {
        var out = [], i, p;
        for (i = 0; i < players.length; i++) {
          p = players[i];
          if (!p) continue;
          out.push({
            slot: p.slot, x: +p.x.toFixed(1), y: +p.y.toFixed(1),
            lives: p.lives, alive: p.alive, facing: p.facing || -1,
            hp: p.hp || 0, maxHp: p.maxHp || 0, boss: p.boss || null,
            weapon: p.weapon, weaponT: p.weaponT, jamT: +(p.jamT || 0).toFixed(2)
          });
        }
        return out;
      },
      COOP_SPAWN_RATIO: COOP_SPAWN_RATIO,
      getAudio: function () {
        return {
          muted: muted,
          ctx: actx ? actx.state : "none",
          master: masterGain ? +masterGain.gain.value.toFixed(3) : 0,
          sfx: sfxGain ? +sfxGain.gain.value.toFixed(3) : 0,
          music: musicGain ? +musicGain.gain.value.toFixed(3) : 0,
          musicOn: musicPlaying,
          pulse: !!pulseWave,
          noise: !!noiseBuf
        };
      },
      clearEnemies: function () { enemies = []; },
      getKind: function () { return waveKind; },
      getTypes: function () {
        var out = [], i;
        for (i = 0; i < enemies.length; i++) if (enemies[i].alive) out.push(enemies[i].type);
        return out;
      },
      getProfile: function () { return profile; },
      resetAllProgress: resetAllProgress,
      COIN_SPAWN_MUL: COIN_SPAWN_MUL,
      setXp: function (xp) { profile.totalXp = Math.max(0, xp | 0); profile.startWave = clampStartWave(profile.startWave || 1); saveProfile(); if (uiScreen === "hub") renderHub(); else if (uiScreen === "hangar") renderHangar(); else if (uiScreen === "quests") renderQuests(); return xpLevel(profile.totalXp); },
      setCoins: function (c) { profile.coins = Math.max(0, c | 0); saveProfile(); if (uiScreen === "hangar") renderHangar(); else renderHub(); },
      equip: function (cat, id) {
        if (cat === "skin") {
          var ship = hangarView().ship;
          if (!profile.ownedSkins[ship]) profile.ownedSkins[ship] = ["stock"];
          if (profile.ownedSkins[ship].indexOf(id) < 0) profile.ownedSkins[ship].push(id);
          equipItem(cat, id);
          return;
        }
        if (!isOwned(cat, id)) ownedList(cat).push(id);
        if (cat === "ship") grantLevelSkins();
        equipItem(cat, id);
      },
      spawnBoss: function (type, tier) {
        enemies = []; ebul = []; teles = []; bossFx = []; pickups = [];
        var idx = 0, i;
        for (i = 0; i < BOSS_DEFS.length; i++) if (BOSS_DEFS[i].id === type) idx = i;
        wave = (idx + 1) * BOSS_EVERY + (tier || 0) * BOSS_DEFS.length * BOSS_EVERY;
        waveKind = "boss";
        enterT = 0.2; diveCd = 99;
        run.bossHits = 0;
        var b = makeEnemy(0, 0, type, { isBoss: true, tier: tier || 0 });
        enemies.push(b);
        updateHud();
        return b;
      },
      getBoss: function () {
        var b = currentBoss();
        if (!b) return null;
        return { type: b.type, tier: b.tier, hp: b.hp, maxHp: b.maxHp, state: b.state, atk: b.atk, phaseIdx: b.phaseIdx, x: Math.round(b.x), y: Math.round(b.y), tele: !!b.tele, kit: bossKit(b), healFlash: b.healFlash || 0, leech: hydraLeechTotal(), moveStyle: b.moveStyle || "patrol", atkQueue: (b.atkQueue || []).slice(), patrolDir: b.patrolDir };
      },
      damageBoss: function (d) { var b = currentBoss(); if (b) killEnemy(b, false, d || 1); return b ? b.hp : 0; },
      bossAtk: function (atk) { var b = currentBoss(); if (b) fireBossAttack(b, atk); return b ? b.atk : ""; },
      getEnemies: function () {
        var out = [], i, e;
        for (i = 0; i < enemies.length; i++) {
          e = enemies[i];
          if (e.alive) out.push({ type: e.type, leech: !!e.leech, leechHp: +(e.leechHp || 0).toFixed(2), hp: e.hp, x: Math.round(e.x), y: Math.round(e.y) });
        }
        return out;
      },
      killType: function (type, dmg) {
        var i, e;
        for (i = 0; i < enemies.length; i++) {
          e = enemies[i];
          if (e.alive && e.type === type) {
            killEnemy(e, false, dmg || 99);
            return { type: e.type, hp: e.hp, alive: e.alive, phaseIdx: e.phaseIdx || 0 };
          }
        }
        return null;
      },
      killLeech: function () {
        var i, e, given;
        for (i = 0; i < enemies.length; i++) {
          e = enemies[i];
          if (e.alive && e.leech) {
            given = e.leechHp || 0;
            killEnemy(e, false, 99);
            return { type: e.type, given: +given.toFixed(2), boss: window.__galaga.getBoss() };
          }
        }
        return null;
      },
      godMode: function (on) { var i; for (i = 0; i < players.length; i++) if (players[i]) players[i].invuln = on ? 1e9 : 0; },
      downSlot: function (slot) {
        var p = players[slot];
        if (!p) return null;
        p.shieldHp = 0;
        p.invuln = 0;
        p.lives = 1;
        playerDie(p);
        return { slot: p.slot, alive: p.alive, lives: p.lives };
      },
      setLives: function (n) {
        var i;
        lives = n;
        if (player) player.lives = n;
        for (i = 0; i < players.length; i++) if (players[i] && players.length === 1) players[i].lives = n;
        updateHud();
      },
      step: function (dt, n) { var i; for (i = 0; i < (n || 1); i++) update(dt || 1 / 60); draw(); return { ebul: ebul.length, pbul: pbul.length, enemies: aliveCount(), wave: wave, lives: lives, score: score }; },
      setInput: function (l, r, f, a) {
        if (l != null) input.left = !!l;
        if (r != null) input.right = !!r;
        if (f != null) input.fire = !!f;
        if (a != null) input.ability = !!a;
      },
      pauseGame: pauseGame,
      resumeGame: resumeGame,
      toggleMute: toggleMute,
      ensureAudio: ensureAudio,
      isMuted: function () { return muted; },
      getEbul: function () { return ebul.length; },
      getPbul: function () { return pbul.length; },
      isPaused: function () { return paused; },
      isOver: function () { return gameOver; },
      bossMeta: bossMeta,
      bossHp: bossHp,
      enemyHp: enemyHp,
      FIRE_MS: FIRE_MS,
      maxStartWave: maxStartWave,
      startWaveOptions: startWaveOptions,
      startWaveUnlocked: startWaveUnlocked,
      skipCredit: skipCredit,
      preferredStartWave: preferredStartWave,
      setPreferredStartWave: setPreferredStartWave,
      guestBossPlan: guestBossPlan,
      buildSlots: buildSlots,
      XP_SCORE_MUL: XP_SCORE_MUL,
      soloEarly: soloEarly,
      pressureWave: pressureWave,
      typeWave: typeWave,
      formationKind: formationKind,
      lifeDropChance: lifeDropChance,
      healDropChance: healDropChance,
      lifeCap: lifeCap,
      xpLevel: xpLevel,
      xpForLevel: xpForLevel,
      levelTitle: levelTitle,
      gunDps: gunDps,
      finishRun: function () { finishRun(true); },
      showScreen: showScreen,
      setHangarTab: function (t) { hangarTab = t; renderHangar(); drawHangarPreview(); },
      hangarView: hangarView,
      applyHangarItem: applyHangarItem,
      selectHangarItem: selectHangarItem,
      skinPaint: skinPaint,
      SHIPS: SHIPS,
      GUNS: GUNS,
      MODS: MODS,
      SKIN_TIERS: SKIN_TIERS,
      SHIP_COIN_SKINS: SHIP_COIN_SKINS,
      BOSS_DEFS: BOSS_DEFS,
      DAILY_DEFS: DAILY_DEFS,
      LONG_DEFS: LONG_DEFS,
      POWER_WEIGHTS: POWER_WEIGHTS,
      isPvp: isPvp,
      isPvpMatch: isPvpMatch,
      isPvpRun: isPvpRun,
      pvpFlipped: pvpFlipped,
      pvpSession: function () { return pvpApi() ? pvpApi().snapshot() : null; },
      pvpPayout: function (winner) { return pvpApi() ? pvpApi().payout(winner) : null; },
      debugPvpReady: function (role) {
        if (pvpApi()) pvpApi().reset("pvp");
        netRole = role === "client" ? "client" : "host";
        localSlot = netRole === "client" ? 1 : 0;
        lobbyGuest = { loadout: profileLoadoutSpec() };
        showLobbyPanel("ready");
        renderLobbyPlayers([{ loadout: profileLoadoutSpec() }, lobbyGuest]);
        renderLobby();
        showScreen("lobby");
        return { role: netRole, slot: localSlot, mode: pvpS() && pvpS().mode };
      },
      debugPvpDuel: function (opts) {
        opts = opts || {};
        var api = pvpApi();
        var asGuest = opts.slot === 1;
        if (api) {
          api.reset("pvp");
          api.setMode(opts.mode || "normal");
          if (opts.boss0) api.setBoss(0, opts.boss0);
          if (opts.boss1) api.setBoss(1, opts.boss1);
        }
        if (asGuest) {
          netRole = "client";
          startNewGame({ pvp: true, coopPlayers: [pvpLoadoutFor(0), pvpLoadoutFor(1)], fromNet: true, localSlot: 1 });
        } else {
          netRole = null;
          startNewGame({ pvp: true, coopPlayers: [pvpLoadoutFor(0), pvpLoadoutFor(1)], localSlot: 0 });
        }
        return {
          players: window.__galaga.getPlayers(),
          flipped: pvpFlipped(),
          roundHud: el("wave") && el("wave").textContent,
          waveLabel: el("wave-label") && el("wave-label").textContent
        };
      },
      debugPvpKill: function (slot) {
        var who = players[slot == null ? 1 : slot];
        if (!who) return null;
        who.invuln = 0;
        who.shieldHp = 0;
        who.hp = 0;
        who.lives = 1;
        playerDie(who);
        return {
          banner: banner ? banner.text : null,
          wave: wave,
          enemies: enemies.length,
          match: !!(pvpApi() && pvpApi().isMatch()),
          run: isPvpRun(),
          flipped: pvpFlipped(),
          hud: el("wave") && el("wave").textContent,
          waveLabel: el("wave-label") && el("wave-label").textContent,
          wins: pvpS() ? pvpS().wins.slice() : null,
          matchOver: !!(pvpS() && pvpS().matchOver),
          players: window.__galaga.getPlayers()
        };
      }
    };
  } catch (err) {}

  makeStars();
  resetPlayer();
  bindNet();
  bestEl.textContent = String(best);
  updateHud();
  applyDesktopHints();
  layout();
  showScreen("hub");
  requestProfile();
})();
