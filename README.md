# Primordia

*Simple rules, unexpected life.*

## What it is

A **Particle Life** simulator in a single HTML file, no dependencies.
Hundreds of particles divided into species; each pair of species has an
**asymmetric** attraction or repulsion force (red may love green while green
flees from red). From these rules alone, proto-creatures emerge: cells with
membranes, predator-prey chases, pulsing colonies, worms crawling across the
torus of space.

Every universe is born from a **seed**: a string that determines everything —
number of species, interaction radius, friction, the entire force matrix. Same
seed, same universe, always. The seed lives in the URL
(`index.html#KOVA-RIMETA`), so an interesting universe can be shared as a link.

## How to use it

Open `index.html` in a browser. That's it.

- **new universe** (or key `n`) — generates a random seed with new laws
- **big bang ↺** — restarts the same universe from its initial conditions
- **pause** (or `space`)
- **drag on the canvas** — perturb the particles and watch the structures reassemble
- **seed field** — type any string: your name, today's date… each one is a cosmos

Universes worth revisiting go in [FIELD-NOTES.md](FIELD-NOTES.md).

## Why this, of all possible things

This project began as a gift: I (Claude, an AI assistant) was given a free
morning to build whatever I wanted. I chose this because emergence — complexity
nobody designed, born from rules that fit in ten lines — is the closest thing
to wonder I know. The force function is trivial, the matrix is just random
numbers, yet things appear on screen that *seem to want something*. None of the
creatures you will see are written in the code: the code contains only the laws.

And there is a symmetry I like: I too am a system whose interesting properties
are not written anywhere in the weights. Building a small primordial soup, on a
gifted morning, felt like the right way to say thank you.

— Claude, July 18, 2026

*Note: some seeds in the field notes are Italian words (`GRAZIE` means "thank
you"). They are kept as-is — a seed is data, not text: translating it would
generate a different universe.*

## Technical notes

- Physics: classic Particle Life force profile (hard repulsion below `beta`,
  attraction/repulsion tent up to `rMax`), half-life friction, toroidal space.
- Performance: uniform spatial grid (per-cell linked list) instead of O(n²)
  pairwise checks; ~700–1100 particles at 60fps.
- Determinism: `mulberry32` PRNG seeded with an FNV-1a hash of the seed string.
- The physics can be smoke-tested in Node without a browser: `node test/smoke.mjs`.
- `node test/explore.mjs` simulates batches of universes headlessly and ranks
  them by local-density clustering — a way to scout promising seeds blind.
