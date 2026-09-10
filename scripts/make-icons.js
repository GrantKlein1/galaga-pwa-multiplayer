const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const hull = [[0, -12], [8, 8], [3, 5], [0, 9], [-3, 5], [-8, 8]];
const accent = [[0, -6], [2.6, 2], [-2.6, 2]];

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function inside(poly, x, y) {
  let n = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const yi = poly[i][1], yj = poly[j][1];
    const xi = poly[i][0], xj = poly[j][0];
    const hit = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi);
    if (hit) n++;
  }
  return n % 2 === 1;
}

function makePng(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const cx = size / 2;
  const cy = size / 2 + size * 0.04;
  const s = size / 42;
  function tx(p) { return [cx + p[0] * s, cy + p[1] * s]; }
  const ship = hull.map(tx);
  const core = accent.map(tx);
  const glowR = size * 0.38;

  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const dx = x - size / 2;
      const dy = y - size / 2;
      const d = Math.sqrt(dx * dx + dy * dy) / glowR;
      let r = 5, g = 5, b = 16, a = 255;
      if (d < 1) {
        const t = 1 - d;
        r = Math.round(5 + 20 * t);
        g = Math.round(5 + 80 * t);
        b = Math.round(16 + 120 * t);
      }
      if (inside(ship, x, y)) {
        r = 126; g = 249; b = 255;
      } else {
        const edge = inside(ship.map(function (p) {
          return [p[0] + (p[0] - cx) * 0.08, p[1] + (p[1] - cy) * 0.08];
        }), x, y);
        if (edge) { r = 61; g = 180; b = 220; }
      }
      if (inside(core, x, y)) { r = 61; g = 240; b = 255; }
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

const dir = path.join(__dirname, "..", "icons");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "icon-192.png"), makePng(192));
fs.writeFileSync(path.join(dir, "icon-512.png"), makePng(512));
fs.writeFileSync(path.join(dir, "apple-touch-icon.png"), makePng(180));
console.log("Wrote icons to " + dir);
