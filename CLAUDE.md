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
