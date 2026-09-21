(function () {
  var MAGIC = 0x47;
  var VER = 6;
  var TYPE_SNAP = 1;
  var TYPE_INPUT = 2;
  var textEnc = new TextEncoder();
  var textDec = new TextDecoder();
  var hexCache = {};
  var snapWriter = null;

  var ENEMY_TYPES = [
    "grunt", "sniper", "tank", "weaver", "kami", "shield",
    "mortar", "hex", "harrier", "bulwark", "archon",
    "juggernaut", "lancer", "mirage", "tether", "sower",
    "seraph", "wraith", "hydra", "colossus", "chronos",
    "leviathan", "inferno", "nullwarden", "basilisk", "overlord",
    "mandala", "cenotaph", "kaleido", "helios", "selene", "pentarch"
  ];
  var ENEMY_STATES = ["", "enter", "form", "dive", "kami", "return", "charge"];
  var GUN_IDS = [
    "pulse", "twin", "rapid", "spread", "lance", "seeker", "scatter",
    "railgun", "volley", "helix", "storm", "novacannon", "prism"
  ];
  var SHIP_IDS = [
    "wisp", "needle", "aegis", "broadwing", "phantom", "vulture",
    "bastion", "strix", "nova", "tempest", "warden", "eclipse"
  ];
  var MOD_IDS = [
    "", "barrier", "magnet", "fortune", "overdrive", "reactor",
    "afterburner", "salvage", "guardian", "berserk", "ascension"
  ];
  var SKIN_IDS = [
    "stock", "ion", "ember", "void", "gilded", "prism", "novaflux", "frost", "solar", "nebula", "mythic",
    "wisp-aurora", "wisp-ghostlight",
    "needle-hotstreak", "needle-pinkvoid",
    "aegis-chrome", "aegis-ward",
    "broadwing-goldwing", "broadwing-sunburst",
    "phantom-spectral", "phantom-rift",
    "vulture-acid", "vulture-carrion",
    "bastion-fortress", "bastion-obsidian",
    "strix-bloodglass", "strix-inferno",
    "nova-supernova", "nova-starburst",
    "tempest-cyclone", "tempest-lightning",
    "warden-jade", "warden-sentinel",
    "eclipse-umbra", "eclipse-corona"
  ];
  var PICKUP_KINDS = ["spread", "double", "rapid", "shield", "speed", "life", "heal", "coin", "revive"];
  var TELE_KINDS = ["line", "vline", "hline", "ring", "glow", "flash", "zone", "wave"];
  var WEAPONS = ["normal", "spread", "double", "rapid", "shield", "speed"];

  function idxOf(list, val) {
    var i = list.indexOf(val == null ? "" : val);
    return i < 0 ? 0 : i;
  }

  function hexToRgb(hex) {
    var n, v, out;
    if (!hex || typeof hex !== "string") return [255, 255, 255];
    out = hexCache[hex];
    if (out) return out;
    n = hex.charAt(0) === "#" ? hex.slice(1) : hex;
    if (n.length === 3) n = n.charAt(0) + n.charAt(0) + n.charAt(1) + n.charAt(1) + n.charAt(2) + n.charAt(2);
    v = parseInt(n, 16);
    if (!isFinite(v)) {
      out = [255, 255, 255];
    } else {
      out = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    }
    hexCache[hex] = out;
    return out;
  }

  function rgbToHex(r, g, b) {
    function h(n) {
      n = n & 255;
      return (n < 16 ? "0" : "") + n.toString(16);
    }
    return "#" + h(r) + h(g) + h(b);
  }

  function Writer(cap) {
    this.u8 = new Uint8Array(cap || 2048);
    this.dv = new DataView(this.u8.buffer);
    this.o = 0;
  }
  Writer.prototype.need = function (n) {
    var next, size;
    if (this.o + n <= this.u8.length) return;
    size = this.u8.length;
    while (size < this.o + n) size *= 2;
    next = new Uint8Array(size);
    next.set(this.u8.subarray(0, this.o));
    this.u8 = next;
    this.dv = new DataView(next.buffer);
  };
  Writer.prototype.u8w = function (x) {
    this.need(1);
    this.u8[this.o] = x & 255;
    this.o += 1;
  };
  Writer.prototype.u16 = function (x) {
    this.need(2);
    this.dv.setUint16(this.o, x < 0 ? 0 : x, true);
    this.o += 2;
  };
  Writer.prototype.i16 = function (x) {
    var v = x | 0;
    if (v > 32767) v = 32767;
    if (v < -32768) v = -32768;
    this.need(2);
    this.dv.setInt16(this.o, v, true);
    this.o += 2;
  };
  Writer.prototype.u32 = function (x) {
    this.need(4);
    this.dv.setUint32(this.o, x >>> 0, true);
    this.o += 4;
  };
  Writer.prototype.f32 = function (x) {
    this.need(4);
    this.dv.setFloat32(this.o, x, true);
    this.o += 4;
  };
  Writer.prototype.bytes = function (arr) {
    this.need(arr.length);
    this.u8.set(arr, this.o);
    this.o += arr.length;
  };
  Writer.prototype.coord = function (x) {
    this.i16(Math.round((x || 0) * 10));
  };
  Writer.prototype.u8frac = function (x, mul) {
    var v = Math.round((x || 0) * mul);
    if (v < 0) v = 0;
    if (v > 255) v = 255;
    this.u8w(v);
  };
  Writer.prototype.rgb = function (hex) {
    var c = hexToRgb(hex);
    this.u8w(c[0]);
    this.u8w(c[1]);
    this.u8w(c[2]);
  };
  Writer.prototype.reset = function () {
    this.o = 0;
  };
  Writer.prototype.out = function () {
    return this.u8.subarray(0, this.o);
  };

  function Reader(u8) {
    this.u8 = u8;
    this.dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    this.o = 0;
  }
  Reader.prototype.u8r = function () {
    var v = this.u8[this.o];
    this.o += 1;
    return v;
  };
  Reader.prototype.u16 = function () {
    var v = this.dv.getUint16(this.o, true);
    this.o += 2;
    return v;
  };
  Reader.prototype.i16 = function () {
    var v = this.dv.getInt16(this.o, true);
    this.o += 2;
    return v;
  };
  Reader.prototype.u32 = function () {
    var v = this.dv.getUint32(this.o, true);
    this.o += 4;
    return v;
  };
  Reader.prototype.f32 = function () {
    var v = this.dv.getFloat32(this.o, true);
    this.o += 4;
    return v;
  };
  Reader.prototype.bytes = function (n) {
    var s = this.u8.subarray(this.o, this.o + n);
    this.o += n;
    return s;
  };
  Reader.prototype.coord = function () {
    return this.i16() / 10;
  };
  Reader.prototype.u8frac = function (mul) {
    return this.u8r() / mul;
  };
  Reader.prototype.rgb = function () {
    return rgbToHex(this.u8r(), this.u8r(), this.u8r());
  };

  function writeStr(w, text) {
    var b = textEnc.encode(String(text || "").slice(0, 40));
    w.u8w(b.length);
    w.bytes(b);
  }

  function readStr(r) {
    var n = r.u8r();
    return textDec.decode(r.bytes(n));
  }

  function writeEn(w, e) {
    var flags = (e.alive ? 1 : 0) | (e.isBoss ? 2 : 0) | (e.leech ? 4 : 0);
    w.u16(e.id || 0);
    w.coord(e.x);
    w.coord(e.y);
    w.u8w(idxOf(ENEMY_TYPES, e.type));
    w.u8w(idxOf(ENEMY_STATES, e.state || ""));
    w.u8w(flags);
    w.u8frac(e.hitFlash, 100);
    w.u8frac(e.healFlash, 100);
    w.u16(e.hp || 0);
    w.u16(e.maxHp || 0);
    w.u8w(e.tier || 0);
    w.u8w(e.phaseIdx || 0);
    w.u8w(e.shieldHp || 0);
    w.u8w(Math.round(e.r || 8));
    w.u8frac(e.leechHp, 10);
    w.u8frac(e.phase, 10);
  }

  function readEn(r) {
    var flags, e;
    e = { id: r.u16(), x: r.coord(), y: r.coord() };
    e.type = ENEMY_TYPES[r.u8r()] || "grunt";
    e.state = ENEMY_STATES[r.u8r()] || "form";
    flags = r.u8r();
    e.alive = !!(flags & 1);
    e.isBoss = !!(flags & 2);
    e.leech = !!(flags & 4);
    e.hitFlash = r.u8frac(100);
    e.healFlash = r.u8frac(100);
    e.hp = r.u16();
    e.maxHp = r.u16();
    e.tier = r.u8r();
    e.phaseIdx = r.u8r();
    e.shieldHp = r.u8r();
    e.r = r.u8r();
    e.leechHp = r.u8frac(10);
    e.phase = r.u8frac(10);
    return e;
  }

  function writePb(w, b) {
    var flags = (b.homing ? 1 : 0) | (b.bolt ? 2 : 0) | (b.splash ? 4 : 0) | (b.helix ? 8 : 0);
    w.u16(b.id || 0);
    w.coord(b.x);
    w.coord(b.y);
    w.coord(b.vx);
    w.coord(b.vy);
    w.u8frac(b.r || 2, 10);
    w.u8w(idxOf(GUN_IDS, b.gun || "pulse"));
    w.u8w(b.pierce || 0);
    w.u8w(flags);
    w.u8w(b.owner || 0);
  }

  function readPb(r) {
    var flags, b;
    b = { id: r.u16(), x: r.coord(), y: r.coord(), vx: r.coord(), vy: r.coord() };
    b.r = r.u8frac(10);
    b.gun = GUN_IDS[r.u8r()] || "pulse";
    b.pierce = r.u8r();
    flags = r.u8r();
    b.homing = !!(flags & 1);
    b.bolt = !!(flags & 2);
    b.splash = (flags & 4) ? { r: 34, dmg: 2 } : null;
    b.helix = !!(flags & 8);
    b.owner = r.u8r();
    return b;
  }

  function writeEb(w, b) {
    w.u16(b.id || 0);
    w.coord(b.x);
    w.coord(b.y);
    w.coord(b.vx);
    w.coord(b.vy);
    w.u8frac(b.r || 2.3, 10);
    w.u8w(b.mine ? 1 : 0);
    w.rgb(b.color || "#ffd0e0");
    w.rgb(b.glow || "#ff6b9a");
    w.u8w(b.owner == null || b.owner < 0 ? 255 : b.owner);
  }

  function readEb(r) {
    var b = { id: r.u16(), x: r.coord(), y: r.coord(), vx: r.coord(), vy: r.coord() };
    b.r = r.u8frac(10);
    b.mine = !!r.u8r();
    b.color = r.rgb();
    b.glow = r.rgb();
    b.owner = r.u8r();
    if (b.owner === 255) b.owner = -1;
    return b;
  }

  function writePk(w, p) {
    w.u16(p.id || 0);
    w.coord(p.x);
    w.coord(p.y);
    w.u8w(idxOf(PICKUP_KINDS, p.kind));
    w.u8w(p.amount || 1);
    w.u8frac(p.bob, 10);
  }

  function readPk(r) {
    return {
      id: r.u16(),
      x: r.coord(),
      y: r.coord(),
      kind: PICKUP_KINDS[r.u8r()] || "coin",
      amount: r.u8r() || 1,
      bob: r.u8frac(10)
    };
  }

  function writeTe(w, t) {
    w.u8w(idxOf(TELE_KINDS, t.kind));
    w.coord(t.x);
    w.coord(t.y);
    w.coord(t.x2);
    w.coord(t.y2);
    w.u8frac(t.t, 100);
    w.u8frac(t.max, 100);
    w.rgb(t.color || "#ff6b9a");
  }

  function readTe(r) {
    return {
      kind: TELE_KINDS[r.u8r()] || "line",
      x: r.coord(),
      y: r.coord(),
      x2: r.coord(),
      y2: r.coord(),
      t: r.u8frac(100),
      max: r.u8frac(100) || 0.01,
      color: r.rgb()
    };
  }

  function writePl(w, p) {
    var lo = p.loadout || {};
    w.u8w(p.slot || 0);
    w.coord(p.x);
    w.coord(p.y);
    w.u8w(p.alive ? 1 : 0);
    w.u8frac(p.invuln, 20);
    w.u8frac(p.muzzle, 50);
    w.u8w(p.shieldHp || 0);
    w.u8w(idxOf(WEAPONS, p.weapon || "normal"));
    w.u8frac(p.weaponT, 10);
    w.u8frac(p.speedT, 10);
    w.u8w(p.lives || 0);
    w.u8w(Math.round(p.r || 9));
    w.u8frac(p.slowT, 10);
    w.u8w(idxOf(SHIP_IDS, p.ship || lo.ship || "wisp"));
    w.u8w(idxOf(GUN_IDS, p.gun || lo.gun || "pulse"));
    w.u8w(idxOf(MOD_IDS, p.mod || lo.mod || ""));
    w.u8w(idxOf(SKIN_IDS, p.skin || lo.skin || "stock"));
    w.coord(p.targetX != null ? p.targetX : p.x);
    w.coord(p.targetY != null ? p.targetY : p.y);
    w.u8frac(p.jamT, 10);
    w.u8w(Math.max(0, Math.min(255, Math.round(p.hp || 0))));
    w.u8w(Math.max(0, Math.min(255, Math.round(p.maxHp || 0))));
    w.u8w(p.facing && p.facing > 0 ? 1 : 0);
    w.u8w((p.boss || lo.boss) ? idxOf(ENEMY_TYPES, p.boss || lo.boss) : 255);
    w.u8frac(p.freezeT, 10);
  }

  function readPl(r) {
    var bi;
    var p = {
      slot: r.u8r(),
      x: r.coord(),
      y: r.coord(),
      alive: !!r.u8r(),
      invuln: r.u8frac(20),
      muzzle: r.u8frac(50),
      shieldHp: r.u8r(),
      weapon: WEAPONS[r.u8r()] || "normal",
      weaponT: r.u8frac(10),
      speedT: r.u8frac(10),
      lives: r.u8r(),
      r: r.u8r(),
      slowT: r.u8frac(10),
      ship: SHIP_IDS[r.u8r()] || "wisp",
      gun: GUN_IDS[r.u8r()] || "pulse",
      mod: MOD_IDS[r.u8r()] || null,
      skin: SKIN_IDS[r.u8r()] || "stock"
    };
    p.targetX = r.coord();
    p.targetY = r.coord();
    p.jamT = r.u8frac(10);
    p.hp = r.u8r();
    p.maxHp = r.u8r();
    p.facing = r.u8r() ? 1 : -1;
    bi = r.u8r();
    p.boss = bi === 255 ? "" : (ENEMY_TYPES[bi] || "");
    p.freezeT = r.u8frac(10);
    if (!p.mod) p.mod = null;
    if (!p.skin) p.skin = "stock";
    return p;
  }

  function getWriter() {
    if (!snapWriter) snapWriter = new Writer(4096);
    snapWriter.reset();
    return snapWriter;
  }

  function encodeSnap(seq, s) {
    var w = getWriter();
    var i, list;
    w.u8w(MAGIC);
    w.u8w(VER);
    w.u8w(TYPE_SNAP);
    w.u16(seq || 0);
    w.f32(s.tm || 0);
    w.u32(s.sc || 0);
    w.u16(s.rc || 0);
    w.u8w(s.w || 1);
    w.u8frac(s.sh, 10);
    w.u8frac(s.fl, 10);
    if (s.bn && s.bn.text) {
      writeStr(w, s.bn.text);
      w.u8frac(s.bn.life, 10);
    } else {
      w.u8w(0);
    }
    list = s.en || [];
    w.u8w(Math.min(255, list.length));
    for (i = 0; i < list.length && i < 255; i++) writeEn(w, list[i]);
    list = s.pb || [];
    w.u16(Math.min(65535, list.length));
    for (i = 0; i < list.length; i++) writePb(w, list[i]);
    list = s.eb || [];
    w.u16(Math.min(65535, list.length));
    for (i = 0; i < list.length; i++) writeEb(w, list[i]);
    list = s.pk || [];
    w.u8w(Math.min(255, list.length));
    for (i = 0; i < list.length && i < 255; i++) writePk(w, list[i]);
    list = s.te || [];
    w.u8w(Math.min(255, list.length));
    for (i = 0; i < list.length && i < 255; i++) writeTe(w, list[i]);
    list = s.pl || [];
    w.u8w(Math.min(8, list.length));
    for (i = 0; i < list.length && i < 8; i++) writePl(w, list[i]);
    return w.out();
  }

  function encodeInput(msg) {
    var w = getWriter();
    var flags, flags2;
    msg = msg || {};
    flags = (msg.l ? 1 : 0) | (msg.r ? 2 : 0) | (msg.f ? 4 : 0) | (msg.a ? 8 : 0) | (msg.aimX == null ? 0 : 16) | ((msg.a ? ((msg.ab | 0) & 7) : 0) << 5);
    flags2 = (msg.u ? 1 : 0) | (msg.d ? 2 : 0) | (msg.aimY == null ? 0 : 4);
    w.u8w(MAGIC);
    w.u8w(VER);
    w.u8w(TYPE_INPUT);
    w.u16(msg.n || 0);
    w.u8w(msg.slot || 0);
    w.u8w(flags);
    w.u8w(flags2);
    if (flags & 16) w.coord(msg.aimX);
    if (flags2 & 4) w.coord(msg.aimY);
    w.coord(msg.x);
    w.coord(msg.targetX);
    w.coord(msg.y);
    w.coord(msg.targetY);
    return w.out();
  }

  function decodeInputBody(r, seq) {
    var flags, flags2, msg;
    msg = {
      t: "input",
      n: seq,
      slot: r.u8r(),
      l: false,
      r: false,
      u: false,
      d: false,
      f: false,
      a: false,
      ab: 0,
      aimX: null,
      aimY: null,
      x: 0,
      targetX: 0,
      y: 0,
      targetY: 0
    };
    flags = r.u8r();
    flags2 = r.u8r();
    msg.l = !!(flags & 1);
    msg.r = !!(flags & 2);
    msg.f = !!(flags & 4);
    msg.a = !!(flags & 8);
    msg.ab = (flags >> 5) & 7;
    if (msg.a && !msg.ab) msg.ab = 1;
    msg.u = !!(flags2 & 1);
    msg.d = !!(flags2 & 2);
    if (flags & 16) msg.aimX = r.coord();
    if (flags2 & 4) msg.aimY = r.coord();
    msg.x = r.coord();
    msg.targetX = r.coord();
    msg.y = r.coord();
    msg.targetY = r.coord();
    return msg;
  }

  function decodeSnapBody(r) {
    var s, n, i, bnLen, bnText;
    s = {
      tm: r.f32(),
      sc: r.u32(),
      rc: r.u16(),
      w: r.u8r(),
      sh: r.u8frac(10),
      fl: r.u8frac(10),
      bn: null,
      en: [],
      pb: [],
      eb: [],
      pk: [],
      te: [],
      pl: []
    };
    bnLen = r.u8r();
    if (bnLen) {
      r.o -= 1;
      bnText = readStr(r);
      s.bn = { text: bnText, life: r.u8frac(10) };
    }
    n = r.u8r();
    for (i = 0; i < n; i++) s.en.push(readEn(r));
    n = r.u16();
    for (i = 0; i < n; i++) s.pb.push(readPb(r));
    n = r.u16();
    for (i = 0; i < n; i++) s.eb.push(readEb(r));
    n = r.u8r();
    for (i = 0; i < n; i++) s.pk.push(readPk(r));
    n = r.u8r();
    for (i = 0; i < n; i++) s.te.push(readTe(r));
    n = r.u8r();
    for (i = 0; i < n; i++) s.pl.push(readPl(r));
    return s;
  }

  function decode(buf) {
    var u8, r, ver, type, seq;
    if (!buf) return null;
    u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    if (!u8.length || u8[0] !== MAGIC) return null;
    r = new Reader(u8);
    r.u8r();
    ver = r.u8r();
    if (ver !== VER) return null;
    type = r.u8r();
    if (type === TYPE_SNAP) {
      seq = r.u16();
      return { t: "snap", n: seq, s: decodeSnapBody(r) };
    }
    if (type === TYPE_INPUT) {
      seq = r.u16();
      return decodeInputBody(r, seq);
    }
    return null;
  }

  function isBinaryFrame(buf) {
    var u8;
    if (!buf) return false;
    u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    return u8.length >= 3 && u8[0] === MAGIC;
  }

  function selfCheck() {
    var s, buf, out, e, p;
    s = {
      sc: 99, rc: 3, w: 2, sh: 1.2, fl: 0.4, tm: 12.5,
      bn: { text: "WAVE 2", life: 1.1 },
      en: [{
        id: 7, x: 10.5, y: 20.2, type: "grunt", alive: 1, state: "form",
        hitFlash: 0.1, healFlash: 0, isBoss: 0, hp: 1, maxHp: 1, tier: 0,
        phaseIdx: 0, shieldHp: 0, r: 9, leech: 0, leechHp: 0, phase: 1.2
      }],
      pb: [{
        id: 8, x: 1, y: 2, vx: 0, vy: -10, r: 2, gun: "pulse", pierce: 0,
        homing: 0, bolt: 0, splash: 0, helix: 0, owner: 0
      }],
      eb: [{
        id: 9, x: 3, y: 4, vx: 1, vy: 2, r: 2.3, color: "#ffd0e0", glow: "#ff6b9a", mine: 0
      }],
      pk: [{ id: 10, x: 5, y: 6, kind: "coin", amount: 2, bob: 1.2 }],
      te: [{ kind: "line", x: 1, y: 2, x2: 3, y2: 4, t: 0.5, max: 1, color: "#ff6b9a" }],
      pl: [{
        slot: 0, x: 120, y: 326, alive: 1, invuln: 0, muzzle: 0, shieldHp: 0,
        weapon: "normal", weaponT: 0, speedT: 0, lives: 3, r: 9, slowT: 0,
        ship: "wisp", gun: "pulse", mod: null, skin: "stock", targetX: 120, targetY: 326, jamT: 0
      }]
    };
    buf = encodeSnap(4, s);
    out = decode(buf);
    if (!out || out.t !== "snap" || out.n !== 4) return false;
    e = out.s.en[0];
    p = out.s.pl[0];
    if (!(out.s.sc === 99 && e.type === "grunt" && e.id === 7 && p.ship === "wisp" && out.s.bn.text === "WAVE 2")) return false;
    if (p.targetY !== 326) return false;
    buf = encodeInput({ t: "input", n: 11, slot: 1, l: 1, r: 0, u: 1, d: 0, f: 1, a: 0, aimX: 80.4, aimY: 200.5, x: 120.5, targetX: 118, y: 300, targetY: 290 });
    out = decode(buf);
    if (!(out && out.t === "input" && out.n === 11 && out.slot === 1 && out.l && out.u && out.f && !out.a && !out.d && out.aimX === 80.4 && out.aimY === 200.5 && out.x === 120.5 && out.y === 300 && out.targetY === 290)) return false;
    buf = encodeInput({ t: "input", n: 12, slot: 0, l: 0, r: 0, f: 0, a: 1, ab: 3, x: 10, targetX: 10, y: 326, targetY: 326 });
    out = decode(buf);
    return !!(out && out.t === "input" && out.a && out.ab === 3 && out.y === 326);
  }

  window.__netcodec = {
    encodeSnap: encodeSnap,
    encodeInput: encodeInput,
    decode: decode,
    isBinaryFrame: isBinaryFrame,
    selfCheck: selfCheck
  };
})();
