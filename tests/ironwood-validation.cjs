/* Deterministic campaign validator. WAIT advances the world but never spends MOVES. */
const assert = require("node:assert/strict");
require("../hex-lab.js");
require("../hex-production.js");

const hex = globalThis.SootSeedHexLab;
const levels = globalThis.SootSeedHexCampaign.levels.filter((level) => level.number >= 6);
const actionKey = (action) => `${action.tool}:${action.q ?? ""},${action.r ?? ""}:${action.direction ?? ""}`;
const stateKey = (state) => JSON.stringify({
  moves: state.moves,
  worldSteps: state.worldSteps,
  res: state.res,
  lost: state.lost,
  won: state.won,
  scheduledFires: state.scheduledFires,
  cells: Object.values(state.cells).map((cell) => [cell.q, cell.r, cell.object, cell.fire]),
});
const outcomeKey = (state) => JSON.stringify({
  res: state.res,
  cells: Object.values(state.cells).map((cell) => [cell.q, cell.r, cell.object, cell.fire]),
});
function search(level, maxWorldSteps = 10) {
  const initial = hex.createInitialState(level);
  const queue = [{ state: initial, path: [] }];
  const seen = new Set([stateKey(initial)]);
  const wins = [];
  const winCap = level.number === 10 ? 1 : 100;
  while (queue.length && wins.length < winCap) {
    const node = queue.shift();
    if (node.state.won && !node.state.lost) {
      wins.push(node.path);
      continue;
    }
    if (node.state.worldSteps >= maxWorldSteps || node.state.lost) continue;
    const actions = hex.getLegalActions(level, node.state).sort(
      (a, b) => ["sickle", "forge", "woodcutter", "wait"].indexOf(a.tool) - ["sickle", "forge", "woodcutter", "wait"].indexOf(b.tool),
    );
    for (const action of actions) {
      const next = hex.applyAction(level, node.state, action).state;
      const key = stateKey(next);
      if (!seen.has(key)) {
        seen.add(key);
        queue.push({ state: next, path: [...node.path, action] });
      }
    }
  }
  return wins;
}
function summary(level) {
  const initial = hex.createInitialState(level);
  const legal = hex.getLegalActions(level, initial);
  const wood = legal.filter((action) => action.tool === "woodcutter");
  const forge = legal.filter((action) => action.tool === "forge");
  const distinctWood = new Set(wood.map((action) => outcomeKey(hex.applyAction(level, initial, action).state)));
  const forgeValues = new Set(forge.map((action) => hex.forgePlan(initial, action.q, action.r).count));
  const wins = search(level);
  assert.ok(wins.length, `${level.id} must have a winning line`);
  const paid = (path) => path.filter((action) => action.tool !== "wait").length;
  const waits = (path) => path.filter((action) => action.tool === "wait").length;
  const minimumPaid = Math.min(...wins.map(paid));
  const minimumWaits = Math.min(...wins.filter((path) => paid(path) === minimumPaid).map(waits));
  assert.ok(minimumPaid <= level.moves, `${level.id} exceeds paid move budget`);
  const families = new Set(wins.map((path) => path.map((action) => action.tool).join(">")));
  return {
    level: level.number,
    paid: `${minimumPaid} / ${level.moves}`,
    waits: minimumWaits,
    winsFound: wins.length,
    families: [...families].sort(),
    rawWoodcutter: wood.length,
    distinctWoodcutterResults: distinctWood.size,
    legalForgePlacements: forge.length,
    forgeOutputValues: [...forgeValues].sort((a, b) => a - b),
  };
}

for (const level of levels) {
  const initial = hex.createInitialState(level);
  if (level.tools.includes("wait")) {
    const wait = hex.getLegalActions(level, initial).find((action) => action.tool === "wait");
    if (wait) assert.equal(hex.applyAction(level, initial, wait).state.moves, initial.moves, "WAIT must cost 0 moves");
  }
  console.log(JSON.stringify(summary(level)));
}
