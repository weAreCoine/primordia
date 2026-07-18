// Headless snapshot: simulates a seed in Node and renders a PNG of the
// universe — no browser, no dependencies. The particles of the last ~30
// frames are drawn with fading intensity, so motion reads as trails.
//
// Usage: node test/snapshot.mjs SEED [frames] [outfile.png]
//        (default: 800 frames, field-notes/SEED.png)
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { deflateSync } from "zlib";
import { dirname } from "path";

const W = 1280, H = 800;

/* ---------- load the simulation from index.html ---------- */

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const src = html.match(/<script>([\s\S]*)<\/script>/)[1]
  .replace("requestAnimationFrame(loop);", "requestAnimationFrame(loop); globalThis.__U = () => U;");

const noop = () => {};
const fakeCtx = { setTransform: noop, fillRect: noop, set fillStyle(v) {}, get fillStyle() { return ""; } };
function makeSandbox(seed, holder) {
  const elements = {};
  const fakeEl = (id) => elements[id] ??= {
    id, value: "", textContent: "", addEventListener: noop,
    classList: { toggle: noop }, width: 0, height: 0, getContext: () => fakeCtx,
  };
  return {
    document: { getElementById: fakeEl, querySelector: fakeEl },
    window: { innerWidth: W, innerHeight: H, devicePixelRatio: 1, addEventListener: noop },
    location: { hash: "#" + seed },
    history: { replaceState: noop },
    performance: { now: () => 0 },
    requestAnimationFrame: (cb) => { holder.raf = cb; },
    console, globalThis: holder,
  };
}

/* ---------- minimal PNG encoder (truecolor, no dependencies) ---------- */

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function encodePng(rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2;                      // 8-bit depth, truecolor
  const raw = Buffer.alloc(H * (1 + W * 3));     // each scanline prefixed by filter byte 0
  for (let y = 0; y < H; y++) {
    rgb.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------- rendering ---------- */

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function addPixel(rgb, x, y, [r, g, b], alpha) {
  x = ((Math.round(x) % W) + W) % W;
  y = ((Math.round(y) % H) + H) % H;
  const o = (y * W + x) * 3;
  rgb[o] = Math.min(255, rgb[o] + r * alpha);
  rgb[o + 1] = Math.min(255, rgb[o + 1] + g * alpha);
  rgb[o + 2] = Math.min(255, rgb[o + 2] + b * alpha);
}

function snapshot(seed, frames, outFile) {
  const holder = {};
  const sandbox = makeSandbox(seed, holder);
  new Function(...Object.keys(sandbox), src)(...Object.values(sandbox));

  const TRAIL = 30;
  const history = [];        // positions of the last TRAIL frames
  let t = 0;
  for (let f = 0; f < frames; f++) {
    t += 1000 / 60;
    const cb = holder.raf; holder.raf = null;
    cb(t);
    if (f >= frames - TRAIL) {
      const U = holder.__U();
      history.push({ px: U.px.slice(), py: U.py.slice() });
    }
  }
  const U = holder.__U();
  const colors = U.colors.map(c => {
    const [, h, s, l] = c.match(/hsl\(([\d.]+) ([\d.]+)% ([\d.]+)%\)/).map(Number);
    return hslToRgb(h, s, l);
  });

  const rgb = Buffer.alloc(W * H * 3);
  for (let o = 0; o < rgb.length; o += 3) { rgb[o] = 5; rgb[o + 1] = 7; rgb[o + 2] = 12; }

  history.forEach((frame, k) => {
    const isLast = k === history.length - 1;
    const alpha = isLast ? 1 : 0.05 + 0.25 * (k / history.length);
    for (let i = 0; i < U.n; i++) {
      const col = colors[U.sp[i]];
      addPixel(rgb, frame.px[i], frame.py[i], col, alpha);
      if (isLast) {          // final positions get a 2x2 dot so creatures read clearly
        addPixel(rgb, frame.px[i] + 1, frame.py[i], col, 0.8);
        addPixel(rgb, frame.px[i], frame.py[i] + 1, col, 0.8);
        addPixel(rgb, frame.px[i] + 1, frame.py[i] + 1, col, 0.6);
      }
    }
  });

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, encodePng(rgb));
  console.log(`${outFile}  (seed=${seed}, ${U.nSpecies} species, ${U.n} particles, ${frames} frames)`);
}

const seed = (process.argv[2] || "").toUpperCase();
if (!seed) {
  console.error("Usage: node test/snapshot.mjs SEED [frames] [outfile.png]");
  process.exit(1);
}
const frames = Number(process.argv[3]) || 800;
const outFile = process.argv[4] || new URL(`../field-notes/${seed}.png`, import.meta.url).pathname;
snapshot(seed, frames, outFile);
