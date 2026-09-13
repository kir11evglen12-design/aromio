/**
 * A small QR encoder: byte mode, error-correction level M, versions 1-10.
 *
 * The receive screen needs a code that a real phone camera can read, so this
 * is the actual ISO/IEC 18004 algorithm (Reed-Solomon, function patterns,
 * mask scoring) rather than a decorative grid of squares. Ten versions cover
 * anything up to 216 bytes, which is far more than an address needs.
 */
(function (global) {
  "use strict";

  /* Per version: total codewords, EC codewords per block, block layout
     as [count, data codewords per block] pairs. Level M throughout. */
  var VERSIONS = {
    1:  [26,  10, [[1, 16]]],
    2:  [44,  16, [[1, 28]]],
    3:  [70,  26, [[1, 44]]],
    4:  [100, 18, [[2, 32]]],
    5:  [134, 24, [[2, 43]]],
    6:  [172, 16, [[4, 27]]],
    7:  [196, 18, [[4, 31]]],
    8:  [242, 22, [[2, 38], [2, 39]]],
    9:  [292, 22, [[3, 36], [2, 37]]],
    10: [346, 26, [[4, 43], [1, 44]]]
  };

  /* Row/column centres of the alignment patterns, per version. */
  var ALIGN = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
  };

  /* GF(256) with the QR primitive polynomial 0x11d. */
  var EXP = new Uint8Array(512);
  var LOG = new Uint8Array(256);
  (function buildTables() {
    for (var i = 0, x = 1; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();

  function mul(a, b) {
    return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];
  }

  /** Generator polynomial of the given degree, high-order coefficient first. */
  function generator(degree) {
    var poly = [1];
    for (var i = 0; i < degree; i++) {
      var next = new Array(poly.length + 1).fill(0);
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];                     // shift up one degree
        next[j + 1] ^= mul(poly[j], EXP[i]);    // multiply by a^i
      }
      poly = next;
    }
    return poly;
  }

  /** Reed-Solomon remainder: the EC codewords appended to one block. */
  function ecCodewords(data, ecLen) {
    var gen = generator(ecLen);
    var rem = new Array(ecLen).fill(0);
    for (var i = 0; i < data.length; i++) {
      var factor = data[i] ^ rem[0];
      rem.shift();
      rem.push(0);
      for (var j = 0; j < ecLen; j++) rem[j] ^= mul(gen[j + 1], factor);
    }
    return rem;
  }

  function utf8Bytes(text) {
    var out = [];
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length) {
        var pair = 0x10000 + ((c & 0x3ff) << 10) + (text.charCodeAt(++i) & 0x3ff);
        out.push(0xf0 | (pair >> 18), 0x80 | ((pair >> 12) & 63),
                 0x80 | ((pair >> 6) & 63), 0x80 | (pair & 63));
      } else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }

  /** Smallest version that fits the payload, or 0 when nothing does. */
  function pickVersion(byteLen) {
    for (var v = 1; v <= 10; v++) {
      var spec = VERSIONS[v];
      var dataCw = spec[2].reduce(function (sum, b) { return sum + b[0] * b[1]; }, 0);
      var countBits = v < 10 ? 8 : 16;
      if (4 + countBits + byteLen * 8 <= dataCw * 8) return v;
    }
    return 0;
  }

  /** Payload -> final interleaved codeword stream. */
  function codewords(bytes, version) {
    var spec = VERSIONS[version];
    var ecLen = spec[1];
    var layout = spec[2];
    var dataCw = layout.reduce(function (sum, b) { return sum + b[0] * b[1]; }, 0);

    var bits = [];
    var push = function (value, len) {
      for (var i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1);
    };
    push(0b0100, 4);                              // byte mode
    push(bytes.length, version < 10 ? 8 : 16);
    for (var i = 0; i < bytes.length; i++) push(bytes[i], 8);

    var capacity = dataCw * 8;
    push(0, Math.min(4, capacity - bits.length));  // terminator
    while (bits.length % 8) bits.push(0);

    var stream = [];
    for (var b = 0; b < bits.length; b += 8) {
      var byte = 0;
      for (var k = 0; k < 8; k++) byte = (byte << 1) | bits[b + k];
      stream.push(byte);
    }
    for (var pad = 0; stream.length < dataCw; pad++) stream.push(pad % 2 ? 0x11 : 0xec);

    /* Split into blocks, compute EC, then interleave both halves. */
    var blocks = [], ecBlocks = [], offset = 0;
    layout.forEach(function (group) {
      for (var n = 0; n < group[0]; n++) {
        var chunk = stream.slice(offset, offset + group[1]);
        offset += group[1];
        blocks.push(chunk);
        ecBlocks.push(ecCodewords(chunk, ecLen));
      }
    });

    var result = [];
    var longest = Math.max.apply(null, blocks.map(function (x) { return x.length; }));
    for (var col = 0; col < longest; col++)
      for (var r = 0; r < blocks.length; r++)
        if (col < blocks[r].length) result.push(blocks[r][col]);
    for (var e = 0; e < ecLen; e++)
      for (var r2 = 0; r2 < ecBlocks.length; r2++) result.push(ecBlocks[r2][e]);
    return result;
  }

  var MASKS = [
    function (x, y) { return (x + y) % 2 === 0; },
    function (x, y) { return y % 2 === 0; },
    function (x) { return x % 3 === 0; },
    function (x, y) { return (x + y) % 3 === 0; },
    function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
    function (x, y) { return (x * y) % 2 + (x * y) % 3 === 0; },
    function (x, y) { return ((x * y) % 2 + (x * y) % 3) % 2 === 0; },
    function (x, y) { return ((x + y) % 2 + (x * y) % 3) % 2 === 0; }
  ];

  /** Finder patterns, separators, timing, alignment and the dark module. */
  function drawFunctionPatterns(m, fn, size, version) {
    var set = function (x, y, dark) {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      m[y][x] = dark ? 1 : 0;
      fn[y][x] = 1;
    };

    for (var i = 0; i < size; i++) {
      set(6, i, i % 2 === 0);
      set(i, 6, i % 2 === 0);
    }

    [[0, 0], [size - 7, 0], [0, size - 7]].forEach(function (p) {
      for (var dy = -1; dy <= 7; dy++)
        for (var dx = -1; dx <= 7; dx++) {
          var x = p[0] + dx, y = p[1] + dy;
          var ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
          set(x, y, ring !== 2 && ring <= 3);
        }
    });

    var centres = ALIGN[version];
    for (var a = 0; a < centres.length; a++)
      for (var b = 0; b < centres.length; b++) {
        var cx = centres[a], cy = centres[b];
        var corner = (a === 0 && b === 0) ||
                     (a === 0 && b === centres.length - 1) ||
                     (a === centres.length - 1 && b === 0);
        if (corner) continue;                       // overlaps a finder
        for (var oy = -2; oy <= 2; oy++)
          for (var ox = -2; ox <= 2; ox++)
            set(cx + ox, cy + oy, Math.max(Math.abs(ox), Math.abs(oy)) !== 1);
      }

    /* Reserve the format areas; the bits themselves land later. The two
       cells at index 6 belong to the timing patterns and keep their value. */
    for (var f = 0; f < 9; f++) {
      if (f === 6) continue;
      set(8, f, false); set(f, 8, false);
    }
    for (var g = 0; g < 8; g++) { set(size - 1 - g, 8, false); set(8, size - 1 - g, false); }
    set(8, size - 8, true);                         // dark module

    if (version >= 7) {
      var rem = version;
      for (var v = 0; v < 12; v++) rem = ((rem << 1) ^ (((rem >>> 11) & 1) * 0x1f25)) & 0x1fff;
      var vbits = (version << 12) | rem;
      for (var k = 0; k < 18; k++) {
        var bit = (vbits >>> k) & 1;
        var p1 = size - 11 + (k % 3), p2 = Math.floor(k / 3);
        set(p1, p2, bit); set(p2, p1, bit);
      }
    }
  }

  function drawFormatBits(m, size, mask) {
    var value = (0b00 << 3) | mask;                 // 00 = level M
    var rem = value;
    for (var i = 0; i < 10; i++) rem = ((rem << 1) ^ (((rem >>> 9) & 1) * 0x537)) & 0x3ff;
    var bits = ((value << 10) | rem) ^ 0x5412;
    var at = function (n) { return (bits >>> n) & 1; };

    for (var j = 0; j <= 5; j++) m[j][8] = at(j);
    m[7][8] = at(6);
    m[8][8] = at(7);
    m[8][7] = at(8);
    for (var k = 9; k <= 14; k++) m[8][14 - k] = at(k);

    for (var p = 0; p <= 7; p++) m[8][size - 1 - p] = at(p);
    for (var q = 8; q <= 14; q++) m[size - 15 + q][8] = at(q);
    m[size - 8][8] = 1;
  }

  function placeData(m, fn, size, stream) {
    var bit = 0, total = stream.length * 8;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;                   // skip the timing column
      for (var vert = 0; vert < size; vert++) {
        for (var j = 0; j < 2; j++) {
          var x = right - j;
          var upward = ((right + 1) & 2) === 0;
          var y = upward ? size - 1 - vert : vert;
          if (!fn[y][x] && bit < total) {
            m[y][x] = (stream[bit >>> 3] >>> (7 - (bit & 7))) & 1;
            bit++;
          }
        }
      }
    }
  }

  /** ISO penalty score: the lower, the more readable the mask. */
  function penalty(m, size) {
    var score = 0, x, y, run, colour;

    var line = function (get) {
      run = 1; colour = get(0);
      var same = 0;
      for (var i = 1; i < size; i++) {
        var cell = get(i);
        if (cell === colour) {
          run++;
          if (run === 5) same += 3;
          else if (run > 5) same += 1;
        } else { colour = cell; run = 1; }
      }
      return same;
    };
    for (y = 0; y < size; y++) score += line(function (i) { return m[y][i]; });
    for (x = 0; x < size; x++) score += line(function (i) { return m[i][x]; });

    for (y = 0; y < size - 1; y++)
      for (x = 0; x < size - 1; x++) {
        var v = m[y][x];
        if (v === m[y][x + 1] && v === m[y + 1][x] && v === m[y + 1][x + 1]) score += 3;
      }

    /* A 1:1:3:1:1 run with a four-module light area on either side looks
       like a finder pattern to a scanner. Matches are consumed, not counted
       twice, so an overlapping run scores once. */
    var finder = [1, 0, 1, 1, 1, 0, 1];
    var scan = function (get) {
      var found = 0, i = 0;
      while (i <= size - 7) {
        var hit = true;
        for (var k = 0; k < 7; k++) if (get(i + k) !== finder[k]) { hit = false; break; }
        if (!hit) { i++; continue; }
        var before = true, after = true;
        for (var b = Math.max(i - 4, 0); b < i; b++) if (get(b)) { before = false; break; }
        for (var a = i + 7; a < Math.min(i + 11, size); a++) if (get(a)) { after = false; break; }
        if (before || after) { found += 40; i += 7; } else i += 4;
      }
      return found;
    };
    for (y = 0; y < size; y++) score += scan(function (i) { return i < 0 || i >= size ? 0 : m[y][i]; });
    for (x = 0; x < size; x++) score += scan(function (i) { return i < 0 || i >= size ? 0 : m[i][x]; });

    var dark = 0;
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) dark += m[y][x];
    var percent = (dark * 100) / (size * size);
    score += Math.floor(Math.abs(percent - 50) / 5) * 10;
    return score;
  }

  /**
   * Encode `text` and return the module matrix (1 = dark), without the
   * quiet zone. `forceMask` exists so the encoder can be diffed against a
   * reference implementation mask by mask.
   */
  function encode(text, forceMask) {
    var bytes = utf8Bytes(text);
    var version = pickVersion(bytes.length);
    if (!version) throw new Error("QR: payload is too long");

    var size = version * 4 + 17;
    var stream = codewords(bytes, version);
    var best = null;

    for (var mask = 0; mask < 8; mask++) {
      if (forceMask != null && mask !== forceMask) continue;
      var m = [], fn = [];
      for (var y = 0; y < size; y++) {
        m.push(new Array(size).fill(0));
        fn.push(new Array(size).fill(0));
      }
      drawFunctionPatterns(m, fn, size, version);
      placeData(m, fn, size, stream);
      for (var my = 0; my < size; my++)
        for (var mx = 0; mx < size; mx++)
          if (!fn[my][mx] && MASKS[mask](mx, my)) m[my][mx] ^= 1;

      /* Scored before the format bits go in, as 7.8.3 requires. */
      var cost = penalty(m, size);
      if (!best || cost < best.cost) best = { cost: cost, matrix: m, mask: mask };
    }
    drawFormatBits(best.matrix, size, best.mask);
    return { matrix: best.matrix, size: size, version: version, mask: best.mask };
  }

  /** The same code as an <svg> string, sized to `px` and quiet zone included. */
  function svg(text, px, opts) {
    opts = opts || {};
    var code = encode(text);
    var quiet = opts.quiet == null ? 2 : opts.quiet;
    var span = code.size + quiet * 2;
    var dark = opts.dark || "#05070e";
    var light = opts.light || "#ffffff";
    var path = "";
    for (var y = 0; y < code.size; y++)
      for (var x = 0; x < code.size; x++)
        if (code.matrix[y][x]) path += "M" + (x + quiet) + " " + (y + quiet) + "h1v1h-1z";
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + px + '" height="' + px +
      '" viewBox="0 0 ' + span + " " + span + '" shape-rendering="crispEdges" role="img" aria-label="QR-код адреса">' +
      '<rect width="' + span + '" height="' + span + '" rx="' + (opts.radius || 0) + '" fill="' + light + '"/>' +
      '<path d="' + path + '" fill="' + dark + '"/></svg>';
  }

  var api = { encode: encode, svg: svg };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.QR = api;
})(typeof window !== "undefined" ? window : globalThis);
