/**
 * QR regression check.
 *
 * The golden matrices in qr.golden.json were verified byte-for-byte against
 * the `segno` reference encoder (versions 1-10, all eight masks, using
 * payloads that fill the data capacity exactly so padding differences never
 * intrude) and read back with OpenCV's decoder. This suite keeps them from
 * drifting and re-checks the structure a scanner actually looks for.
 */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "/");
const win = {};
new Function("window", fs.readFileSync(ROOT + "qr.js", "utf8"))(win);
const QR = win.QR;

let fails = 0;
const ok = (name, cond, extra) => {
  if (!cond) { fails++; console.log("FAIL " + name + (extra ? " — " + extra : "")); }
  else console.log("ok   " + name);
};

const golden = JSON.parse(fs.readFileSync(path.join(__dirname, "qr.golden.json"), "utf8"));
Object.keys(golden).forEach(function (payload) {
  const want = golden[payload];
  const got = QR.encode(payload);
  const label = "v" + want.version + " " + (payload.length > 16 ? payload.slice(0, 16) + "…" : payload);
  ok("matrix unchanged: " + label,
     got.matrix.map(r => r.join("")).join("|") === want.rows.join("|"));
  ok("version and mask unchanged: " + label,
     got.version === want.version && got.mask === want.mask,
     "v" + got.version + " mask" + got.mask + " vs v" + want.version + " mask" + want.mask);
});

/* structure: size, finder patterns, timing patterns, dark module */
const code = QR.encode("7cVfgArCheMR6Cs29GVQrJDvbrLQGJqZgLGKa4Uy4gxV");
const m = code.matrix, size = code.size;
ok("size is 4 × version + 17", size === code.version * 4 + 17);

const finderAt = (ox, oy) => {
  for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
    const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
    if (m[oy + y][ox + x] !== (ring !== 2 ? 1 : 0)) return false;
  }
  return true;
};
ok("three finder patterns in place", finderAt(0, 0) && finderAt(size - 7, 0) && finderAt(0, size - 7));

let timing = true;
for (let i = 8; i < size - 8; i++)
  if (m[6][i] !== (i % 2 === 0 ? 1 : 0) || m[i][6] !== (i % 2 === 0 ? 1 : 0)) timing = false;
ok("timing patterns alternate", timing);
ok("dark module is set", m[size - 8][8] === 1);
ok("every module is 0 or 1", m.every(r => r.every(v => v === 0 || v === 1)));

/* the two masks of one payload must differ, or masking is a no-op */
ok("masks actually change the matrix",
   QR.encode("cobalt", 0).matrix.join() !== QR.encode("cobalt", 5).matrix.join());

/* version growth and the upper limit */
ok("short payload picks version 1", QR.encode("hi").version === 1);
ok("a 44-byte address fits version 4", QR.encode("a".repeat(44)).version === 4);
ok("213 bytes still fit version 10", QR.encode("a".repeat(213)).version === 10);
try {
  QR.encode("a".repeat(400));
  fails++; console.log("FAIL oversized payload should throw");
} catch (e) { ok("oversized payload throws", /too long/.test(e.message)); }

/* the svg wrapper */
const svg = QR.svg("cobalt", 200, { quiet: 2 });
ok("svg carries size, viewBox and a path",
   /width="200"/.test(svg) && /viewBox="0 0 25 25"/.test(svg) && /<path d="M/.test(svg));

console.log(fails ? "\n" + fails + " FAILURES" : "\nall QR checks passed");
process.exit(fails ? 1 : 0);
