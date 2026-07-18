// Shepherd + Legislator tests.
// Legislator: every puzzle ships with a known solving matrix (existence proof).
// Shepherd: level definitions are valid and the win condition triggers when
// the flock is in the pen (reachability is playtested by humans, not here).
import { readFileSync } from "fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const src = html.match(/<script>([\s\S]*)<\/script>/)[1]
  .replace("boot(urlSeed || randomSeedName(), urlPatch || null);",
    "boot(urlSeed || randomSeedName(), urlPatch || null); globalThis.__test = " +
    "{ U: () => U, run: () => run, lawsProgress: () => lawsProgress, " +
    "shepherdProgress: () => shepherdProgress, safariProgress: () => progress, " +
    "setLaws, setShepherd, setSafari, startLevel, LEVELS, boot };");

const noop = () => {};
const fakeCtx = {
  setTransform: noop, fillRect: noop, setLineDash: noop, beginPath: noop,
  arc: noop, stroke: noop,
  set fillStyle(v) {}, get fillStyle() { return ""; },
  set strokeStyle(v) {}, get strokeStyle() { return ""; },
};
function fakeNode() {
  return { className: "", textContent: "", style: {}, title: "",
           appendChild: noop, addEventListener: noop };
}
function makeInstance(hash) {
  const elements = {};
  const fakeEl = (id) => elements[id] ??= {
    id, value: "", textContent: "", addEventListener: noop,
    classList: { toggle: noop }, style: {}, width: 0, height: 0,
    getContext: () => fakeCtx, appendChild: noop,
  };
  const holder = {};
  const sandbox = {
    document: { getElementById: fakeEl, querySelector: fakeEl, createElement: fakeNode },
    window: { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop },
    location: { hash: "#" + hash },
    history: { replaceState: noop },
    performance: { now: () => 0 },
    requestAnimationFrame: (cb) => { holder.raf = cb; },
    console, globalThis: holder, Date,
  };
  new Function(...Object.keys(sandbox), src)(...Object.values(sandbox));
  let t = 0;
  return {
    test: holder.__test,
    frames(n) {
      for (let f = 0; f < n; f++) {
        t += 1000 / 60;
        const cb = holder.raf; holder.raf = null;
        cb(t);
      }
    },
  };
}

let failures = 0;
function check(label, ok) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) failures++;
}

// Known solving matrices (see FIELD-NOTES / PR for how they were engineered).
const RESURRECTION = "3840038440388403";       // 4-species non-reciprocal chase cycle
const TAMER = "2".repeat(49);                  // 7 species, universal repulsion
const LEVELER = (() => {                        // 7-species pure chase, no cohesion
  let s = "";
  for (let i = 0; i < 7; i++)
    for (let j = 0; j < 7; j++)
      s += j === (i + 1) % 7 ? "8" : j === (i + 6) % 7 ? "0" : "4";
  return s;
})();

// Legislator existence proofs
{
  const inst = makeInstance(`KUKO-NETI~${RESURRECTION}`);
  inst.test.setLaws(true);
  inst.frames(1200);
  check("Resurrection: chase cycle keeps KUKO-NETI alive",
    !!inst.test.lawsProgress()["resurrection"]);
}
{
  const inst = makeInstance(`FIZUMU-GEKE~${TAMER}`);
  inst.test.setLaws(true);
  inst.frames(1000);
  check("The tamer: universal repulsion freezes FIZUMU-GEKE",
    !!inst.test.lawsProgress()["tamer"]);
}
{
  const inst = makeInstance(`GRAZIE~${LEVELER}`);
  inst.test.setLaws(true);
  inst.frames(1000);
  check("The leveler: pure chase erases GRAZIE's structure",
    !!inst.test.lawsProgress()["leveler"]);
}

// Edited laws must never score naturalist bounties: leveled GRAZIE is exactly
// a "drifting fog" (speed ~105, clustering ~1.1) — if the !U.patch gate broke,
// safari would award the bounty to an engineered universe.
{
  const inst = makeInstance(`GRAZIE~${LEVELER}`);
  inst.test.setSafari(true);
  inst.test.setLaws(true);
  inst.frames(1000);
  check("patched universe wins no safari bounty",
    !inst.test.safariProgress()["drifting-fog"] &&
    !!inst.test.lawsProgress()["leveler"]);
}

// Shepherd: level definitions are valid on their own seeds
{
  const inst = makeInstance("PRIMO-DONO");
  for (const lv of inst.test.LEVELS) {
    const probe = makeInstance(lv.seed);
    const U = probe.test.U();
    const population = Array.from(U.sp).filter(s => s === lv.species).length;
    check(`level "${lv.id}": species ${lv.species} exists with ${population} ≥ 2× target ${lv.target}`,
      lv.species < U.nSpecies && population >= 2 * lv.target);
  }
}

// Shepherd: win condition triggers when the flock is teleported into the pen
{
  const inst = makeInstance("PRIMO-DONO");
  inst.test.setShepherd(true);
  const lv = inst.test.LEVELS[0];
  inst.test.startLevel(lv);
  const U = inst.test.U();
  const zx = lv.zone.fx * 1280, zy = lv.zone.fy * 800;
  let placed = 0;
  for (let i = 0; i < U.n && placed < lv.target + 5; i++) {
    if (U.sp[i] !== lv.species) continue;
    U.px[i] = zx + (placed % 5) * 8 - 16;
    U.py[i] = zy + Math.floor(placed / 5) * 8 - 16;
    U.vx[i] = 0; U.vy[i] = 0;
    placed++;
  }
  inst.frames(Math.ceil((lv.hold + 1.5) * 60));
  check("teleported flock completes First flock",
    !!inst.test.shepherdProgress()[lv.id]);
}

process.exit(failures ? 1 : 0);
