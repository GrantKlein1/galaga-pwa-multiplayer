(function () {
  var MAGIC = 0x47;
  var VER = 1;
  var TYPE_SNAP = 1;

  var ENEMY_TYPES = [
    "grunt", "sniper", "tank", "weaver", "kami", "shield",
    "seraph", "wraith", "hydra", "colossus", "chronos",
    "leviathan", "inferno", "nullwarden", "basilisk", "overlord"
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
  var PICKUP_KINDS = ["spread", "double", "rapid", "shield", "speed", "life", "heal", "coin"];
  var TELE_KINDS = ["line", "vline", "hline", "ring", "glow", "flash", "zone"];
  var WEAPONS = ["normal", "spread", "double", "rapid", "shield", "speed"];

  function idxOf(list, val) {
    var i = list.indexOf(val == null ? "" : val);
    return i < 0 ? 0 : i;
  }

  function hexToRgb(hex) {
    var n, v;
    if (!hex || typeof hex !== "string") return [255, 255, 255];
    n = hex.charAt(0) === "#" ? hex.slice(1) : hex;
    if (n.length === 3) n = n.charAt(0) + n.charAt(0) + n.charAt(1) + n.charAt(1) + n.charAt(2) + n.charAt(2);
    v = parseInt(n, 16);
    if (!isFinite(v)) return [255, 255, 255];
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
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
  Writer.prototype.out = function () {
    return this.u8.slice(0, this.o);
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
    var b = new TextEncoder().encode(String(text || "").slice(0, 40));
    w.u8w(b.length);
    w.bytes(b);
  }

  function readStr(r) {
    var n = r.u8r();
    return new TextDecoder().decode(r.bytes(n));
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
  }

  function readEb(r) {
    var b = { id: r.u16(), x: r.coord(), y: r.coord(), vx: r.coord(), vy: r.coord() };
    b.r = r.u8frac(10);
    b.mine = !!r.u8r();
    b.color = r.rgb();
    b.glow = r.rgb();
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
    w.u8w(idxOf(SHIP_IDS, p.ship || "wisp"));
    w.u8w(idxOf(GUN_IDS, p.gun || "pulse"));
    w.u8w(idxOf(MOD_IDS, p.mod || ""));
    w.coord(p.targetX != null ? p.targetX : p.x);
  }

  function readPl(r) {
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
      mod: MOD_IDS[r.u8r()] || null
    };
    p.targetX = r.coord();
    if (!p.mod) p.mod = null;
    return p;
  }

  function encodeSnap(seq, s) {
    var w = new Writer(2048);
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
        ship: "wisp", gun: "pulse", mod: null, targetX: 120
      }]
    };
    buf = encodeSnap(4, s);
    out = decode(buf);
    if (!out || out.t !== "snap" || out.n !== 4) return false;
    e = out.s.en[0];
    p = out.s.pl[0];
    return out.s.sc === 99 && e.type === "grunt" && e.id === 7 && p.ship === "wisp" && out.s.bn.text === "WAVE 2";
  }

  window.__netcodec = {
    encodeSnap: encodeSnap,
    decode: decode,
    isBinaryFrame: isBinaryFrame,
    selfCheck: selfCheck
  };
})();
