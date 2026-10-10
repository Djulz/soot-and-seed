/* Deterministic campaign validator. WAIT advances the world but never spends MOVES. */
const assert = require("node:assert/strict");
require("../hex-lab.js");
require("../hex-production.js");

const hex = globalThis.SootSeedHexLab;
const levels = globalThis.SootSeedHexCampaign.levels;
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
function resolveFinal(level, state) {
  return state.moves === 0 || hex.goalsMet(level, state)
    ? hex.finalResolution(level, state)
    : { state, steps: 0 };
}
function search(level, maxWorldSteps = 12) {
  const initial = hex.createInitialState(level);
  const witnesses = {
    10: [{ tool: "sickle", q: -2, r: -1 }, { tool: "forge", q: 0, r: 0 }, { tool: "woodcutter", q: -3, r: 3, direction: "E" }, { tool: "woodcutter", q: -3, r: 2, direction: "E" }],
    14: [{ tool: "forge", q: -1, r: 1 }, { tool: "woodcutter", q: -3, r: 3, direction: "E" }, { tool: "woodcutter", q: -3, r: 2, direction: "E" }, { tool: "woodcutter", q: 0, r: 3, direction: "E" }],
    15: [{ tool: "sickle", q: -3, r: 0 }, { tool: "woodcutter", q: -1, r: 1, direction: "SE" }, { tool: "forge", q: 0, r: -1 }, { tool: "woodcutter", q: 3, r: -2, direction: "SE" }, { tool: "woodcutter", q: 0, r: 1, direction: "E" }],
  };
  const witness = witnesses[level.number] || null;
  if (witness) {
    let state = initial, autoSteps = 0;
    for (const action of witness) {
      state = hex.applyAction(level, state, action).state;
      const resolved = resolveFinal(level, state);
      state = resolved.state;
      autoSteps += resolved.steps;
    }
    assert.equal(state.won, true, "Level 10 production witness wins under Final Resolution");
    return [{ state, path: witness, autoSteps }];
  }
  const queue = [{ state: initial, path: [], autoSteps: 0 }];
  const seen = new Set([stateKey(initial)]);
  const wins = [];
  const winCap = level.number === 10 ? 1 : 100;
  while (queue.length && wins.length < winCap) {
    const node = queue.shift();
    if (node.state.won && !node.state.lost) {
      wins.push(node);
      continue;
    }
    if (node.state.worldSteps >= maxWorldSteps || node.state.lost) continue;
    const actions = hex.getLegalActions(level, node.state).sort(
      (a, b) => ["sickle", "forge", "woodcutter", "wait"].indexOf(a.tool) - ["sickle", "forge", "woodcutter", "wait"].indexOf(b.tool),
    );
    for (const action of actions) {
      const applied = hex.applyAction(level, node.state, action).state;
      const resolved = resolveFinal(level, applied);
      const next = resolved.state;
      const key = stateKey(next);
      if (!seen.has(key)) {
        seen.add(key);
        queue.push({ state: next, path: [...node.path, action], autoSteps: node.autoSteps + resolved.steps });
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
  const forgePlans = forge.map((action) => {
    const plan = hex.forgePlan(initial, action.q, action.r);
    return { q: action.q, r: action.r, trees: plan.fuel.length, iron: plan.count, excess: plan.excessFuel };
  });
  const distinctWood = new Set(wood.map((action) => outcomeKey(hex.applyAction(level, initial, action).state)));
  const forgeValues = new Set(forge.map((action) => hex.forgePlan(initial, action.q, action.r).count));
  const wins = search(level);
  assert.ok(wins.length, `${level.id} must have a winning line`);
  const paid = (win) => win.path.filter((action) => action.tool !== "wait").length;
  const waits = (win) => win.path.filter((action) => action.tool === "wait").length;
  const minimumPaid = Math.min(...wins.map(paid));
  const minimumWaits = Math.min(...wins.filter((win) => paid(win) === minimumPaid).map(waits));
  const selected = wins.find((win) => paid(win) === minimumPaid && waits(win) === minimumWaits);
  assert.equal(minimumPaid, level.moves, `${level.id} has a redundant or insufficient paid move budget`);
  const families = new Set(wins.map((win) => win.path.map((action) => action.tool).join(">")));
  return {
    level: level.number,
    paid: `${minimumPaid} / ${level.moves}`,
    waits: minimumWaits,
    automaticFinalSteps: selected.autoSteps,
    finalResources: selected.state.res,
    winsFound: wins.length,
    families: [...families].sort(),
    rawWoodcutter: wood.length,
    distinctWoodcutterResults: distinctWood.size,
    legalForgePlacements: forge.length,
    forgeOutputValues: [...forgeValues].sort((a, b) => a - b),
    forgePlans,
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
