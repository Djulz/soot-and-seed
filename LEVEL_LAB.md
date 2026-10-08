# Level Lab

## Mutation batches (v1)

Level Lab can now generate one deterministic batch of nearby variations around an immutable campaign seed. It never edits Levels 1–15 or campaign progress. A batch is identified by its seed level, RNG seed, mutation depth, candidate count, Oracle budget and ensemble budget.

The v1 registry makes only local content changes: tree, wheat and ore additions/removals/moves; one-step requirement and move-limit changes; and local scheduled-fire/ignition timing changes. Resource additions only use plain ground and never overwrite houses, fire, void, or another object. Every accepted change is stored as human-readable mutation history.

Pipeline: clone seed → mutate → structural/static validation → canonical level fingerprint de-duplication → Oracle → ensemble → Level Analysis. Oracle search-limit results remain **unresolved**, never unsolvable. Only Oracle-solved candidates receive the ensemble and design analysis by default.

The Level Lab candidate browser is session-local. It supports sorting/filtering by independent signals, candidate details, pinning, JSON copy, and playing a candidate through the normal renderer. It intentionally does not select winners, promote a level into campaign, or perform multi-generation evolution.

## Quality-diversity search (v1)

The developer-only QD search mutates archive representatives over several generations. It uses a small MAP-Elites-style grid rather than a global puzzle-quality score. The default **General** grid uses strategic constraint × strategy separation, five buckets per axis. Timing, Forge, Openness and Disagreement are alternative projections of the same evaluated candidates.

An archive cell retains one representative through a transparent, local-only `archiveQuality`: Oracle confirmation, usable ensemble evidence, expressed behaviour, non-degenerate solution length, low loop rate and restrained distance from the root seed. It does **not** declare one candidate globally better than another.

Parents are selected uniformly across occupied cells. Each child receives one or two local mutations, is deduplicated against every fingerprint seen in the run, and is evaluated through the same Oracle/ensemble/analysis pipeline. The search yields between small chunks, updates the archive progressively, and may be cancelled without discarding completed results.

Pinned candidates are saved locally with schema version 1. They retain their level definition, lineage, fingerprint and evaluation data, but never enter campaign progression automatically.

Level Lab is a developer-only foundation for exploring candidate Soot & Seed levels. Open a normal campaign level, expand **Developer controls**, then choose **Level Lab**. It is intentionally absent from player navigation and does not alter campaign progress.

## Shared simulation

`game-simulation.js` is the DOM-free authoritative rules layer. Gameplay now uses it to create level state and for board bounds, regions, Forge planning and legal-action checks. Level Lab calls the same API for initial states, actions, world steps, Fire resolution, status and state serialization. It never uses a simplified Fire/WAIT/Forge model.

The public API includes `createInitialState`, `getLegalActions`, `applyAction`, `advanceWorldStep`, `getGameStatus`, resource/requirement accessors, cloning and serialization. WAIT takes no paid move, increments world steps, then advances the normal Fire/scheduled-event lifecycle.

## Candidate lifecycle

`seed level → clone candidate → optional legal mutation → structural/static validation → Oracle → human-agent ensemble → metrics / comparison`.

Candidates contain their seed ID, a stable candidate ID, generation, optional parent ID, cloned level definition, readable mutation history and evaluation placeholders. The two current mutations are deliberate pipeline checks only; they never mutate canonical campaign definitions.

## Current capabilities

- Immutable campaign seed loading
- Deterministic seeded RNG
- Candidate cloning and temporary in-memory storage
- Two safe test mutations
- Structural and static-sanity validation
- Simulation smoke inspection
- Oracle Solver v1 with replay-verified solutions and deterministic duplicate-state detection
- Eight bounded heuristic agents: Balanced, Greedy Harvester, Max Yield, Forge First, Requirement Chaser, Fire Fearful, Wait Friendly and Action Conservator
- Seeded ensemble runs, attempt traces, first-action distributions and post-run Oracle comparison
- Reusable level analysis: opening/trap detection, agent contrasts, solution flexibility and multi-dimensional design signals
- Campaign overview for Levels 1–15 (measurement only; no progression or level data is changed)
- Candidate playthrough through the normal gameplay renderer
- Extensible interfaces for metrics and generation

## Intentionally deferred

- Production-strength oracle optimization
- Tuned/calibrated human-like solver ensemble
- Empirically calibrated classification thresholds and large-scale candidate search
- Large-scale mutation generation
- Fitness/difficulty model
- Evolutionary generations
- MAP-Elites / quality-diversity search
- Automatic campaign promotion
