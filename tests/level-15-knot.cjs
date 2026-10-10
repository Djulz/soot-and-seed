const assert = require("node:assert/strict");
require("../hex-lab.js");
require("../hex-production.js");

const hex = globalThis.SootSeedHexLab;
const level = globalThis.SootSeedHexCampaign.levels.find((item) => item.number === 15);
const initial = hex.createInitialState(level);
const key = (action) => `${action.tool}:${action.q ?? ""},${action.r ?? ""}:${action.direction ?? ""}`;
const legal = hex.getLegalActions(level, initial);
const wood = legal.filter((action) => action.tool === "woodcutter");
const distinctWood = new Set(wood.map((action) => hex.cutLine(initial, action.q, action.r, action.direction).map((cell) => `${cell.q},${cell.r}`).sort().join("|")));
const forge = legal.filter((action) => action.tool === "forge");

assert.equal(Object.keys(level.cells).length, 37, "The Wildfire uses a radius-three board");
assert.equal(Object.values(level.cells).filter((cell) => cell.object === "tree").length, 18, "The Wildfire preserves two Ground fire corridors on a radius-three board");
assert.equal(Object.values(level.cells).filter((cell) => cell.object === "wheat").length, 13, "Wheat is deliberately surplus");
assert.equal(Object.values(level.cells).filter((cell) => cell.object === "ore").length, 4, "Ore is a compact contested region");
assert.equal(level.req.charcoal, undefined, "Wildfire triage has no Charcoal goal");
assert.deepEqual(level.farmstead, { q: 2, r: 0 }, "Farmstead occupies an explicit, threatened hex");
assert.deepEqual(level.scheduledFires.map((fire) => fire.after), [2, 4], "Two scheduled Fires attack on different clocks");
assert.ok(wood.length >= 16 && distinctWood.size >= 10, "directional opening space is substantial");
assert.ok(forge.length >= 4, "multiple Forge placements are legal");
assert.ok(forge.some((action) => { const plan = hex.forgePlan(initial, action.q, action.r); return plan.count === 4 && plan.excessFuel === 1; }), "a high-output Forge visibly wastes fuel");
const fields = [
  hex.connected(initial, -3, 0, "wheat"),
  hex.connected(initial, 0, -3, "wheat"),
  hex.connected(initial, 0, 2, "wheat"),
].map((field) => field.length).sort((a, b) => b - a);
assert.deepEqual(fields, [5, 4, 4], "three separated Wheat fields create non-obvious harvest choices");
const meaningfulWood = wood.filter((action) => hex.cutLine(initial, action.q, action.r, action.direction).length >= 2);
const meaningfulForge = forge.filter((action) => hex.forgePlan(initial, action.q, action.r).count >= 3);
const wheatOpenings = new Set(legal
  .filter((action) => action.tool === "sickle")
  .map((action) => hex.connected(initial, action.q, action.r, "wheat").map((cell) => `${cell.q},${cell.r}`).sort().join("|")));
assert.ok(wheatOpenings.size + meaningfulWood.length + meaningfulForge.length + 1 >= 5, "the opening offers more than five credible action candidates");

function play(actions) {
  let state = initial;
  for (const action of actions) state = hex.applyAction(level, state, action).state;
  return hex.finalResolution(level, state).state;
}
const winner = play([
  { tool: "sickle", q: -3, r: 0 },
  { tool: "woodcutter", q: -1, r: 1, direction: "SE" },
  { tool: "forge", q: 0, r: -1 },
  { tool: "woodcutter", q: 3, r: -2, direction: "SE" },
  { tool: "woodcutter", q: 0, r: 1, direction: "E" },
]);
assert.equal(winner.won, true, "the five-paid-move reference line wins");
assert.equal(winner.moves, 0, "every paid move is required");
assert.deepEqual(winner.res, { wood: 7, wheat: 5, charcoal: 6, iron: 3 }, "the reference line uses exact Wood, Wheat, and Iron goals while Charcoal remains incidental");

let unattended = initial;
for (let step = 0; step < 6 && !unattended.lost; step++) unattended = hex.applyAction(level, unattended, { tool: "wait" }).state;
assert.equal(unattended.lost, true, "the later Scheduled Fire reaches the Farmstead without a firebreak");

const maxForge = forge
  .slice()
  .sort((a, b) => hex.forgePlan(initial, b.q, b.r).count - hex.forgePlan(initial, a.q, a.r).count || key(a).localeCompare(key(b)))[0];
const resourceScore = (state) => Object.entries(level.req).reduce((score, [name, goal]) => score + Math.min(goal, state.res[name] || 0), 0);
let greedyState = hex.applyAction(level, initial, maxForge).state;
while (greedyState.moves > 0 && !greedyState.lost) {
  const next = hex.getLegalActions(level, greedyState)
    .filter((action) => action.tool !== "wait")
    .map((action) => ({ action, state: hex.applyAction(level, greedyState, action).state }))
    .sort((a, b) => resourceScore(b.state) - resourceScore(a.state) || key(a.action).localeCompare(key(b.action)))[0];
  if (!next) break;
  greedyState = next.state;
}
const greedyFailure = hex.finalResolution(level, greedyState).state;
assert.equal(greedyFailure.won, false, "maximum-iron Forge greed cannot meet the tight Wood and Wheat goals");
console.log("Level 15 knot validation passed.");
