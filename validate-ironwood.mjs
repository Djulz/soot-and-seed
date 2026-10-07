/*
 * Legacy validation entry point retained for existing workflows.
 * Rules live only in game-simulation.js; this file must not grow a second engine.
 */
import simulation from './game-simulation.js';

const smokeLevel={name:'Simulation smoke',moves:1,req:{charcoal:1},tools:['wait'],map:['FT']};
const initial=simulation.createInitialState(smokeLevel);
const result=simulation.applyAction(smokeLevel,initial,{tool:'wait'});
console.log(`Shared simulation smoke: ${result.status.worldSteps} world step, ${result.status.paidMovesUsed} paid moves.`);
