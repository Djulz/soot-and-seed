const assert=require('node:assert/strict');
require('../hex-lab.js');
require('../hex-production.js');
const hex=globalThis.SootSeedHexLab;
const campaign=globalThis.SootSeedHexCampaign;

function stable(def,state){return state.moves===0?hex.settleFire(def,state):state}
function stateKey(state){return JSON.stringify({moves:state.moves,steps:state.worldSteps,res:state.res,cells:Object.values(state.cells).map(cell=>[cell.q,cell.r,cell.object,cell.fire]),fires:state.scheduledFires})}
function solve(def){const queue=[{state:hex.createInitialState(def),actions:[]}],seen=new Set(),wins=[];while(queue.length){const current=queue.shift(),state=stable(def,current.state),key=stateKey(state);if(seen.has(key))continue;seen.add(key);if(state.won){wins.push(current.actions);continue}if(state.moves===0||state.lost||current.actions.length>7)continue;for(const action of hex.getLegalActions(def,state))queue.push({state:hex.applyAction(def,state,action).state,actions:[...current.actions,action]})}return wins}
function woodCounts(def){const state=hex.createInitialState(def),actions=hex.getLegalActions(def,state).filter(action=>action.tool==='woodcutter'),results=new Set(actions.map(action=>hex.cutLine(state,action.q,action.r,action.direction).map(cell=>hex.key(cell.q,cell.r)).sort().join('|')));return{raw:actions.length,distinct:results.size}}

assert.equal(campaign.levels.length,5,'Lowlands has exactly five authored levels');
assert.deepEqual(campaign.levels.map(level=>level.title),['First Cut','Fireline','Field & Forest','Waiting Spark','Crossroads']);
assert.equal(campaign.levels.some(level=>level.tools.includes('forge')||level.wind),false,'Lowlands 1–5 does not introduce Forge or Wind');
for(const level of campaign.levels)assert.equal(hex.validateDefinition(level).ok,true,`${level.title} validates against production hex rules`);
assert.equal(Object.keys(campaign.levels[0].cells).length,7,'First Cut is a radius-one board');
for(const level of campaign.levels.slice(1))assert.equal(Object.keys(level.cells).length,19,`${level.title} is a radius-two board`);
assert.deepEqual(campaign.levels.map(level=>solve(level).length),[1,1,1,5,5],'every Lowlands level has one or more production-engine winning paths');
assert.equal(solve(campaign.levels[3]).every(path=>path.some(action=>action.tool==='wait')),true,'Waiting Spark requires WAIT in every winning path');
assert.deepEqual(campaign.levels.map(woodCounts),[{raw:18,distinct:6},{raw:24,distinct:8},{raw:18,distinct:6},{raw:30,distinct:9},{raw:48,distinct:24}],'raw directional inputs and distinct cuts remain explicit');
for(const level of campaign.levels){
  const full=campaign.layoutHexes(hex.createInitialState(level),{maxWidth:356,maxHeight:310,maxRadius:70,padding:12});
  const mini=campaign.layoutHexes(hex.createInitialState(level),{maxWidth:76,maxHeight:68,maxRadius:13,padding:3});
  assert.ok(full.width<=356&&full.height<=310,`${level.title} full board fits its content box`);
  assert.ok(mini.width<=76&&mini.height<=68,`${level.title} mini-board is locally scaled into its preview box`);
  for(const cell of full.cells){const p=full.positionFor(cell);assert.ok(p.left>=12&&p.top>=12&&p.left+full.g.width<=full.width-12&&p.top+full.g.height<=full.height-12,`${level.title} includes complete hex polygons`)}
}
const waiting=campaign.levels[3],immediate=hex.applyAction(waiting,hex.createInitialState(waiting),{tool:'woodcutter',q:-2,r:2,direction:'E'}).state;
assert.equal(hex.settleFire(waiting,immediate).res.charcoal,0,'final Fire resolution does not activate a scheduled source whose player-triggered countdown was not reached');
const afterWait=hex.applyAction(waiting,hex.createInitialState(waiting),{tool:'wait'}).state;
const timed=hex.applyAction(waiting,afterWait,{tool:'woodcutter',q:-2,r:2,direction:'E'}).state;
assert.equal(hex.settleFire(waiting,timed).won,true,'WAIT then Woodcutter reaches the scheduled Fire and real win');
console.log('Hex campaign smoke tests passed.');
