// Safari mode test: bounties must trigger on real merit, verified headlessly.
//  1. KUKO-NETI earns "Absolute zero" (lives, then freezes < 3 px/s).
//  2. A pointer-perturbed run must NOT score, even if the universe qualifies.
//  3. FIZUMU-GEKE earns "Perpetual stampede" (sustained > 400 px/s).
import { readFileSync } from "fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const src = html.match(/<script>([\s\S]*)<\/script>/)[1]
  .replace("boot(urlSeed || randomSeedName(), urlPatch || null);",
    "boot(urlSeed || randomSeedName(), urlPatch || null); globalThis.__test = { U: () => U, run: () => run, progress: () => progress, setSafari, boot };");

const noop = () => {};
const fakeCtx = { setTransform: noop, fillRect: noop, set fillStyle(v) {}, get fillStyle() { return ""; } };
function fakeNode() {
  return { className: "", textContent: "", appendChild: noop };
}
function makeInstance(seed) {
  const elements = {};
  const fakeEl = (id) => elements[id] ??= {
    id, value: "", textContent: "", addEventListener: noop,
    classList: { toggle: noop }, width: 0, height: 0,
    getContext: () => fakeCtx, appendChild: noop,
  };
  const holder = {};
  const sandbox = {
    document: { getElementById: fakeEl, querySelector: fakeEl, createElement: fakeNode },
    window: { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop },
    location: { hash: "#" + seed },
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

// 1. Absolute zero on KUKO-NETI
{
  const inst = makeInstance("KUKO-NETI");
  inst.test.setSafari(true);
  inst.frames(2500);
  const found = inst.test.progress()["absolute-zero"];
  check("KUKO-NETI earns Absolute zero", !!found && found.seed === "KUKO-NETI");
}

// 2. Perturbed runs never score
{
  const inst = makeInstance("KUKO-NETI");
  inst.test.setSafari(true);
  inst.frames(10);
  inst.test.run().perturbed = true;   // simulate a pointer touch
  inst.frames(2500);
  check("perturbed run scores nothing", Object.keys(inst.test.progress()).length === 0);
}

// 3. Perpetual stampede on FIZUMU-GEKE
{
  const inst = makeInstance("FIZUMU-GEKE");
  inst.test.setSafari(true);
  inst.frames(2000);
  const found = inst.test.progress()["stampede"];
  check("FIZUMU-GEKE earns Perpetual stampede", !!found && found.seed === "FIZUMU-GEKE");
}

// 4. Every bounty has at least one known solution (existence proof)
{
  const inst = makeInstance("GRAZIE");
  inst.test.setSafari(true);
  inst.frames(1200);
  const p = inst.test.progress();
  check("GRAZIE earns Metropolis", !!p["metropolis"]);
  check("GRAZIE earns Crowded ark", !!p["crowded-ark"]);
}
{
  const inst = makeInstance("DUMETE-REVA");
  inst.test.setSafari(true);
  inst.frames(1200);
  check("DUMETE-REVA earns Drifting fog", !!inst.test.progress()["drifting-fog"]);
}

process.exit(failures ? 1 : 0);
