import fs from "fs";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

var galaga = fs.readFileSync(new URL("../js/galaga.js", import.meta.url), "utf8");
var pvp = fs.readFileSync(new URL("../js/pvp.js", import.meta.url), "utf8");
var sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");

function heliosDef() {
  var m = galaga.match(/\{ id: "helios",[\s\S]*?flavor: "[^"]+" \}/);
  assert(m, "Helios def present");
  return m[0];
}

var helios = heliosDef();
assert(/cd: 0\.96/.test(helios), "Helios cycle cd 0.96");
assert(/tele: 0\.38/.test(helios), "Helios tele 0.38");
assert(/base: \["glare", "sear"\]/.test(helios), "Glare / Sear stay p1");
assert(/p2: \["prominence", "hearth"\]/.test(helios), "Prominence / Hearth stay p2");
assert(/p3: \["noon"\]/.test(helios), "High noon stays p3");

assert(/id: "selene"[\s\S]*?cd: 1\.44, tele: 0\.52/.test(galaga), "Selene cadence unchanged");
assert(/id: "cenotaph"[\s\S]*?cd: 1\.4, tele: 0\.5/.test(galaga), "Cenotaph cadence unchanged");
assert(/id: "mandala"[\s\S]*?cd: 1\.52, tele: 0\.48/.test(galaga), "Mandala cadence unchanged");
assert(/id: "kaleido"[\s\S]*?cd: 1\.5, tele: 0\.46/.test(galaga), "Kaleido cadence unchanged");
assert(/id: "pentarch"[\s\S]*?cd: 1\.36, tele: 0\.5/.test(galaga), "Pentarch cadence unchanged");
assert(/id: "overlord"[\s\S]*?cd: 1\.64, tele: 0\.5/.test(galaga), "Overlord cadence unchanged");

assert(galaga.indexOf('atk === "slab" || atk === "crypt" || atk === "vigil" || atk === "occult"') >= 0, "Sear split off shared slab tele");
assert(galaga.indexOf('} else if (atk === "sear") {') >= 0, "Sear has its own windup");
assert(galaga.indexOf("delay += 0.08;\n    } else if (atk === \"knell\")") >= 0, "Sear extra delay 0.08");
assert(galaga.indexOf('} else if (atk === "glare") {') >= 0, "Glare has its own windup");
assert(galaga.indexOf("delay += 0.04;\n    } else if (atk === \"crescent\")") >= 0, "Glare extra delay 0.04");
assert(galaga.indexOf("delay += 0.08;\n    } else if (atk === \"prominence\")") >= 0, "Crescent extra delay stays 0.08");
assert(galaga.indexOf('addZone(e.slamX, e.slamY, 22, 22, delay + 0.1, col)') >= 0, "Prominence extra delay 0.10");
assert(galaga.indexOf('addTele("hline", 12, H - 40, W - 12, H - 40, delay + 0.1, col)') >= 0, "Hearth / noon extra delay 0.10");
assert(galaga.indexOf("delay += 0.1;\n    } else if (atk === \"limb\")") >= 0, "Hearth / noon fire delay 0.10");
assert(galaga.indexOf('queueFollow(e, 0.3, "hearth2")') >= 0, "Hearth midline follow 0.30s");
assert(galaga.indexOf('queueFollow(e, 0.42, "hearth2")') < 0, "old hearth follow gone");
assert(galaga.indexOf('e.atkCd = e.type === "helios" ? 0.52 : 0.9') >= 0, "Helios phase gap 0.52");
assert(galaga.indexOf('e.atkCd = e.type === "helios" ? 0.48 : 0.8') >= 0, "Helios enter gap 0.48");
assert(galaga.indexOf('queueFollow(e, 0.55, "tiderev")') >= 0, "Selene tide gap unchanged");
assert(galaga.indexOf('queueFollow(e, 0.32, "tiderev")') >= 0, "Selene occult tide gap unchanged");

assert(pvp.indexOf('{ id: "sear", key: "1", name: "Sear", cd: 4.1 }') >= 0, "PvP Sear 4.1");
assert(pvp.indexOf('{ id: "prominence", key: "2", name: "Prominence", cd: 5.3 }') >= 0, "PvP Prominence 5.3");
assert(pvp.indexOf('{ id: "hearth", key: "3", name: "Hearth", cd: 5.6 }') >= 0, "PvP Hearth 5.6");
assert(pvp.indexOf('{ id: "noon", key: "4", name: "High noon", cd: 6.5 }') >= 0, "PvP High noon 6.5");
assert(pvp.indexOf('{ id: "limb", key: "1", name: "Shadow limb", cd: 6.4 }') >= 0, "Selene PvP cds unchanged");
assert(pvp.indexOf('{ id: "crypt", key: "1", name: "Crypt", cd: 5.6 }') >= 0, "Cenotaph PvP cds unchanged");
assert(pvp.indexOf('{ id: "rime", key: "1", name: "Rime lock", cd: 6.2 }') >= 0, "Pentarch PvP cds unchanged");

assert(sw.indexOf("galaga-coop-v51") >= 0, "PWA cache bump");

console.log("helios-faster-fire-smoke: ok");
