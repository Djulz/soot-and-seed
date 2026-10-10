const assert = require("node:assert/strict");
require("../hex-lab.js");
const hex = globalThis.SootSeedHexLab;

const cell = (q, r, object = null, fire = "normal") => ({ q, r, terrain: "ground", object, fire });
const stateForForge = (trees, ores, center = null) => {
  const cells = { "0,0": cell(0, 0, center) };
  for (const [q, r] of trees) cells[`${q},${r}`] = cell(q, r, "tree");
  for (const [q, r] of ores) cells[`${q},${r}`] = cell(q, r, "ore");
  return { id: "forge-case", moves: 1, req: {}, tools: ["forge"], cells };
};
function assertForge(def, fuel, iron, excess) {
  const initial = hex.createInitialState(def);
  const plan = hex.forgePlan(initial, 0, 0);
  assert.equal(plan.fuel.length, fuel, "preview exposes every adjacent fuel Tree");
  assert.equal(plan.count, iron, "Iron is min(all fuel, connected Ore)");
  assert.equal(plan.excessFuel, excess, "preview exposes excess fuel");
  const after = hex.applyAction(def, initial, { tool: "forge", q: 0, r: 0 }).state;
  assert.equal(after.res.iron, iron, "Forge awards expected Iron");
  assert.equal(Object.values(after.cells).filter((c) => c.object === "tree").length, 0, "Forge consumes all eligible adjacent Trees");
}

assertForge(stateForForge([[1,0],[0,-1]], [[-1,0],[-1,1],[-2,1],[-2,2]]), 2, 2, 0);
assertForge(stateForForge([[1,0],[0,-1],[-1,0],[0,1]], [[-1,1],[-2,1],[-2,2]]), 4, 3, 1);
assertForge(stateForForge([[1,0],[0,-1],[-1,0],[0,1],[1,-1]], [[-1,1],[-2,1]]), 5, 2, 3);
const centerTree = stateForForge([[1,0],[0,-1],[-1,0]], [[0,1],[-1,1],[-2,1]], "tree");
const centered = hex.applyAction(centerTree, hex.createInitialState(centerTree), { tool: "forge", q: 0, r: 0 }).state;
assert.equal(centered.res.iron, 3, "centre Tree is not counted as Forge fuel");
assert.equal(centered.cells["0,0"].object, "forge", "centre Tree is destroyed and replaced by Forge");

const finalFire = {
  id: "final-scheduled-fire",
  moves: 0,
  req: { charcoal: 2 },
  tools: ["wait"],
  cells: { "0,0": cell(0, 0, "tree"), "1,0": cell(1, 0, "tree") },
  scheduledFires: [{ q: 0, r: 0, after: 2 }],
};
const resolution = hex.finalResolution(finalFire, hex.createInitialState(finalFire));
assert.equal(resolution.steps, 5, "Final Resolution keeps advancing through a future scheduled Fire");
assert.equal(resolution.state.res.charcoal, 2, "scheduled Fire spreads and resolves normally after moves end");
assert.equal(resolution.state.scheduledFires[0].fired, true, "scheduled source activates during Final Resolution");
assert.equal(Object.values(resolution.state.cells).some((c) => c.fire === "active" || c.fire === "dying"), false, "Final Resolution stops only when Fire is stable");
assert.equal(resolution.state.won, true, "outcome evaluates only after automatic resolution completes");

const early = { id: "early-complete", moves: 2, req: { wood: 1 }, tools: ["woodcutter"], cells: { "0,0": cell(0, 0, "tree") } };
const earlyAction = hex.applyAction(early, hex.createInitialState(early), { tool: "woodcutter", q: 0, r: 0, direction: "E" }).state;
const earlyComplete = hex.completionResolution(early, earlyAction);
assert.equal(earlyComplete.state.moves, 1, "early completion preserves irrelevant paid moves");
assert.equal(earlyComplete.state.won, true, "requirements complete immediately when the world is stable");

const earlyWithFire = {
  id: "early-complete-with-scheduled-fire",
  moves: 2,
  req: { wood: 1 },
  tools: ["woodcutter", "wait"],
  cells: { "0,0": cell(0, 0, "tree"), "2,0": cell(2, 0, "tree") },
  scheduledFires: [{ q: 2, r: 0, after: 1 }],
};
const earlyWithFireAction = hex.applyAction(earlyWithFire, hex.createInitialState(earlyWithFire), { tool: "woodcutter", q: 0, r: 0, direction: "E" }).state;
const earlyWithFireComplete = hex.completionResolution(earlyWithFire, earlyWithFireAction);
assert.equal(earlyWithFireComplete.state.moves, 1, "automatic completion does not spend a remaining paid move");
assert.ok(earlyWithFireComplete.steps > 0, "goals met with unresolved Fire enters automatic resolution");
assert.equal(earlyWithFireComplete.state.won, true, "automatic resolution wins only after the scheduled Fire has resolved");
assert.equal(earlyWithFireComplete.state.res.charcoal, 1, "the scheduled Fire resolves before the early win is awarded");
console.log("Hex core rule smoke tests passed.");
