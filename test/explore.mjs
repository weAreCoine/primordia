// Universe explorer: simulates many seeds headlessly and ranks them.
// Indicators:
//  - clustering: dispersion (variance/mean) of the neighbor count within 25px.
//    ~1 = uniform gas; high = clumps, membranes, creatures.
//  - mean speed: low = frozen, extremely high = chaos without structure.
// Usage: node test/explore.mjs [seed1 seed2 ...]   (no arguments: 20 random seeds)
import { readFileSync } from "fs";

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
    window: { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop },
    location: { hash: "#" + seed },
    history: { replaceState: noop },
    performance: { now: () => 0 },
    requestAnimationFrame: (cb) => { holder.raf = cb; },
    console, globalThis: holder,
  };
}

function simulate(seed, frames = 500) {
  const holder = {};
  const sandbox = makeSandbox(seed, holder);
  new Function(...Object.keys(sandbox), src)(...Object.values(sandbox));
  let t = 0;
  for (let f = 0; f < frames; f++) {
    t += 1000 / 60;
    const cb = holder.raf; holder.raf = null;
    cb(t);
  }
  const U = holder.__U();

  // neighbor count within 25px (toroidal)
  const R = 25, R2 = R * R, W = 1280, H = 800;
  const counts = new Array(U.n).fill(0);
  for (let i = 0; i < U.n; i++) {
    for (let j = i + 1; j < U.n; j++) {
      let dx = U.px[j] - U.px[i]; dx -= W * Math.round(dx / W);
      let dy = U.py[j] - U.py[i]; dy -= H * Math.round(dy / H);
      if (dx * dx + dy * dy < R2) { counts[i]++; counts[j]++; }
    }
  }
  const mean = counts.reduce((a, b) => a + b, 0) / U.n;
  const varc = counts.reduce((a, b) => a + (b - mean) ** 2, 0) / U.n;
  let speed = 0;
  for (let i = 0; i < U.n; i++) speed += Math.hypot(U.vx[i], U.vy[i]);
  return { seed, species: U.nSpecies, n: U.n, clustering: varc / Math.max(mean, 0.01), speed: speed / U.n };
}

const CONS = "KLMNRSTVZBDGF", VOWS = "AEIOU";
function randomName() {
  let s = "";
  for (let w = 0; w < 2; w++) {
    if (w) s += "-";
    for (let i = 0, k = 2 + Math.floor(Math.random() * 2); i < k; i++)
      s += CONS[Math.floor(Math.random() * 13)] + VOWS[Math.floor(Math.random() * 5)];
  }
  return s;
}

const seeds = process.argv.slice(2).map(s => s.toUpperCase());
if (seeds.length === 0) while (seeds.length < 20) seeds.push(randomName());

const results = seeds.map(s => {
  const r = simulate(s);
  process.stderr.write(".");
  return r;
});
process.stderr.write("\n");

results.sort((a, b) => b.clustering - a.clustering);
console.log("seed              species  clustering  mean speed");
for (const r of results) {
  console.log(`${r.seed.padEnd(18)}${String(r.species).padEnd(9)}${r.clustering.toFixed(1).padEnd(12)}${r.speed.toFixed(0)} px/s`);
}
