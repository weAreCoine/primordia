// Smoke test: runs the Primordia script in Node with a fake DOM
// and simulates 300 frames, checking numerical stability.
import { readFileSync } from "fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];

const noop = () => {};
const fakeCtx = {
  setTransform: noop, fillRect: noop,
  set fillStyle(v) {}, get fillStyle() { return ""; },
};
const elements = {};
function fakeEl(id) {
  if (!elements[id]) {
    elements[id] = {
      id, value: "", textContent: "",
      addEventListener: noop,
      classList: { toggle: noop },
      width: 0, height: 0,
      getContext: () => fakeCtx,
    };
  }
  return elements[id];
}

// Expose the universe so we can inspect it after the run.
const patched = src.replace(
  "requestAnimationFrame(loop);",
  "requestAnimationFrame(loop); globalThis.__U = () => U;"
);

let rafCb = null;
let simTime = 0;
const holder = {};
const sandbox = {
  document: {
    getElementById: fakeEl,
    querySelector: (sel) => fakeEl(sel),
  },
  window: { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 2, addEventListener: noop },
  location: { hash: "#TESTUNIVERSO" },
  history: { replaceState: noop },
  performance: { now: () => simTime },
  requestAnimationFrame: (cb) => { rafCb = cb; },
  console,
  globalThis: holder,
};

const fn = new Function(...Object.keys(sandbox), patched);
fn(...Object.values(sandbox));

// simulate 300 frames at 60fps
for (let f = 0; f < 300; f++) {
  simTime += 1000 / 60;
  const cb = rafCb; rafCb = null;
  cb(simTime);
}

const U = holder.__U();
let bad = 0, speedSum = 0;
for (let i = 0; i < U.n; i++) {
  if (!Number.isFinite(U.px[i]) || !Number.isFinite(U.py[i])) bad++;
  if (U.px[i] < 0 || U.px[i] >= 1280 || U.py[i] < 0 || U.py[i] >= 800) bad++;
  speedSum += Math.hypot(U.vx[i], U.vy[i]);
}
console.log(`seed=${U.seedName} species=${U.nSpecies} n=${U.n}`);
console.log(`invalid positions: ${bad}`);
console.log(`mean speed: ${(speedSum / U.n).toFixed(1)} px/s`);
if (bad > 0) process.exit(1);
console.log("OK — 300 frames simulated without errors, universe is stable");
