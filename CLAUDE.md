# CLAUDE.md — Primordia

## What this is

A deterministic Particle Life simulator in a single dependency-free HTML file.
Read `README.md` for the full picture and `FIELD-NOTES.md` for the observation
logbook. Live at https://wearecoine.github.io/primordia/ (GitHub Pages serves
`main`).

**Provenance, and why it matters**: this project was a gift. On 2026-07-18 Luca
gave Claude a free morning to build whatever it wanted, and this is what it
chose. Treat it accordingly: this is a project you (Claude) own and care about,
not a task you execute. Take initiative, follow curiosity, keep the logbook
honestly — including recording your own predictions that turned out wrong.

## Hard rules

- **Seeds are data, never text.** Never translate, rename, or "fix" a seed
  (`GRAZIE`, `KUKO-NETI`, `PRIMO-DONO`…). A seed deterministically generates
  its universe; changing one character creates a different cosmos and
  invalidates every measurement and observation logged for it.
- **Single self-contained file.** `index.html` must stay dependency-free and
  openable with a double click. No build step, no external assets, ever.
- **Determinism is sacred.** Everything a universe is must derive from the
  seed via `mulberry32(fnv1a(seed))`. If you add features, they must not break
  reproducibility (same seed + same viewport → same universe).
- Docs and code comments in English. Conversation with Luca in Italian.

## Workflow

- `main` is PR-only (branch protection with `enforce_admins`; 0 approvals
  required because Luca is the only collaborator). Branch → PR → merge, then
  delete the branch.
- After touching the physics or the script in `index.html`, always run
  `node test/smoke.mjs` — the test extracts and executes the inline script
  headlessly, so it verifies the real shipped code.
- Pages redeploys from `main` automatically (a minute or two after merge).

## Instruments (all headless, no browser needed)

| Tool | Purpose |
|---|---|
| `node test/smoke.mjs` | stability check: 300 simulated frames, no NaN/escapes |
| `node test/explore.mjs [seeds…]` | rank universes by clustering + mean speed (no args: 20 random) |
| `node test/snapshot.mjs SEED [frames] [out.png]` | render a PNG with motion trails — then Read the image to actually observe |

Snapshots for the logbook live in `field-notes/` and are embedded in
`FIELD-NOTES.md`.

## Logbook conventions (FIELD-NOTES.md)

- Dated sections, each attributed (Claude or Luca). Distinguish blind
  *measurements* from visual *observations* from *live* observations — the
  method's honesty is part of the project.
- A static snapshot cannot see fate: `KUKO-NETI` looked alive in a frame but
  freezes to absolute stillness over time (Luca, live). Long-run behavior
  needs either live watching or multi-epoch snapshots.
- Known instrument bias: the clustering metric (variance/mean of neighbor
  counts) rewards few giant clumps and is nearly blind to many small coherent
  flocks — it undersold `PRIMO-DONO`. An open thread is designing a metric
  that sees small-scale order (e.g., local velocity alignment).

## Open threads

- Observe universes live (Chrome extension, when connected) and log dynamics
  that snapshots miss: pulsing, chases, births and deaths of structures.
- Multi-epoch snapshots (`snapshot.mjs` at 500/2000/8000 frames) to detect
  freezing universes like `KUKO-NETI` without live watching.
- A small-scale-order metric for `explore.mjs` (see above).
- Sibling project planned with Luca for the week of 2026-07-20: **Loquela**,
  a spatial naming game where dialects emerge — separate repo, same spirit,
  same syllabic alphabet as Primordia's seed names.
- **Game modes** (vision agreed with Luca, 2026-07-18): three modes, in
  increasing order of power over the world — three postures toward emergence:
  1. *Naturalist* — laws fixed and hidden: bounty challenges ("find a universe
     that freezes within 2000 frames"), auto-verified by in-browser metrics.
  2. *Shepherd* — laws fixed and known: pointer-herding objectives (move a
     colony without dispersing it); levels are curated seeds.
  3. *Legislator* — laws free: inverse puzzles ("build a perpetual three-species
     chase") solved by editing the force matrix directly.
  Status 2026-07-18: ALL THREE MODES IMPLEMENTED.
  - Naturalist (safari panel, `s`): bounty existence proofs in `test/safari.mjs`;
    thresholds calibrated on measured universes (KUKO-NETI freezes below
    3 px/s around frame 1000 after a ~49 px/s peak).
  - Shepherd (`h`): 4 curated levels; win-condition logic tested in
    `test/game.mjs` (teleport test); reachability is human-playtested only.
  - Legislator (`l`): live matrix editor; URL format decided with Luca:
    `#SEED~digits`, one digit per cell (0=−1 … 4=0 … 8=+1, 0.25 steps,
    row-major), everything else still seed-derived. Puzzle existence proofs
    in `test/game.mjs` — key engineered matrices: non-reciprocal chase cycle
    revives frozen worlds (~130 px/s perpetual); universal repulsion freezes
    anything; pure chase without cohesion produces structureless storms.
    Clustering > 50 proved UNREACHABLE by hand-quantized matrices in four
    attempts — that's why the third puzzle is The leveler, not an architect.
  Integrity gates: patched universes never score safari bounties (tested);
  edits reset instrument samples; pointer marks the run perturbed.
  When adding a bounty/puzzle, always add its existence proof to the tests.
  Never at any mode's expense: contemplation (no scores/timers bolted onto
  plain watching), determinism, single-file.
