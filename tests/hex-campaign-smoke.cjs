const assert=require('node:assert/strict');
require('../hex-lab.js');
require('../hex-production.js');
const hex=globalThis.SootSeedHexLab;
const campaign=globalThis.SootSeedHexCampaign;
const timing=campaign.presentationTiming;

function stable(def,state){return state.moves===0?hex.settleFire(def,state):state}
function stateKey(state){return JSON.stringify({moves:state.moves,steps:state.worldSteps,res:state.res,cells:Object.values(state.cells).map(cell=>[cell.q,cell.r,cell.object,cell.fire]),fires:state.scheduledFires})}
function solve(def){const queue=[{state:hex.createInitialState(def),actions:[]}],seen=new Set(),wins=[];while(queue.length){const current=queue.shift(),state=stable(def,current.state),key=stateKey(state);if(seen.has(key))continue;seen.add(key);if(state.won){wins.push(current.actions);continue}if(state.moves===0||state.lost||current.actions.length>7)continue;for(const action of hex.getLegalActions(def,state))queue.push({state:hex.applyAction(def,state,action).state,actions:[...current.actions,action]})}return wins}
function woodCounts(def){const state=hex.createInitialState(def),actions=hex.getLegalActions(def,state).filter(action=>action.tool==='woodcutter'),results=new Set(actions.map(action=>hex.cutLine(state,action.q,action.r,action.direction).map(cell=>hex.key(cell.q,cell.r)).sort().join('|')));return{raw:actions.length,distinct:results.size}}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}

assert.equal(campaign.levels.length,5,'Lowlands has exactly five authored levels');
assert.deepEqual(timing,{POINTER_RESPONSE:70,DIRECTION_SNAP:60,HARVEST_STAGGER:150,LOCAL_HIT:120,RESOURCE_POP:120,RESOURCE_HOLD:280,RESOURCE_FLY:280,RESOURCE_FLY_STAGGER:40,HUD_BOUNCE:170,ACTION_WORLD_PAUSE:180,WORLD_TICK:120,FIRE_ANTICIPATION:120,FIRE_TRAVEL:180,FIRE_IGNITION:140,FIRE_SETTLE:160,SCHEDULED_IGNITION_PAUSE:120,FINAL_WAVE_PAUSE:150,STABLE_TO_RESULT:350,RESULT_ENTER:260},'the complete presentation timeline is centrally configured');
assert.equal(50+2*timing.HARVEST_STAGGER+timing.LOCAL_HIT,470,'three-tree Woodcutter action resolves as a readable 0/150/300ms chop rhythm');
assert.equal(timing.RESOURCE_POP+timing.RESOURCE_HOLD+timing.RESOURCE_FLY,680,'each resource uses one pop/hold/fly pipeline before the HUD increment');
assert.equal(timing.FIRE_ANTICIPATION+timing.FIRE_TRAVEL+timing.FIRE_IGNITION+timing.FIRE_SETTLE,600,'a normal Fire response has one coordinated 600ms visual grammar');
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
  assert.equal(full.visualGap,3,`${level.title} uses one explicit gameplay seam width`);
  assert.ok(Math.abs(full.g.width-2*full.radius)<1e-9,`${level.title} uses flat-top width = 2S`);
  assert.ok(Math.abs(full.g.height-Math.sqrt(3)*full.radius)<1e-9,`${level.title} uses flat-top height = √3S`);
  assert.ok(Math.abs(full.g.distance-(Math.sqrt(3)*full.radius+full.visualGap))<1e-9,`${level.title} uses D = √3S + G`);
  const center=hex.point(0,0,full.radius,full.visualGap);
  for(const direction of hex.directions){const [name,q,r]=direction,neighbour=hex.point(q,r,full.radius,full.visualGap);assert.ok(Math.abs(distance(center,neighbour)-full.g.distance)<1e-9,`${level.title} ${name} neighbour center is exactly D away`);assert.ok(Math.abs(hex.visibleEdgeGap(direction,full.radius,full.visualGap)-full.visualGap)<1e-9,`${level.title} ${name} actual polygon edge gap is G`)}
  const miniOrigin=hex.point(0,0,mini.radius,mini.visualGap),fullOrigin=hex.point(0,0,full.radius,full.visualGap),miniEast=hex.point(1,0,mini.radius,mini.visualGap),fullEast=hex.point(1,0,full.radius,full.visualGap);
  assert.equal(Math.sign(miniEast.x-miniOrigin.x),Math.sign(fullEast.x-fullOrigin.x),`${level.title} thumbnail and gameplay share flat-top projection`);
  for(const cell of full.cells){const p=full.positionFor(cell);assert.ok(p.left>=12&&p.top>=12&&p.left+full.g.width<=full.width-12&&p.top+full.g.height<=full.height-12,`${level.title} includes complete hex polygons`)}
}
const waiting=campaign.levels[3],immediate=hex.applyAction(waiting,hex.createInitialState(waiting),{tool:'woodcutter',q:-2,r:2,direction:'E'}).state;
assert.equal(hex.settleFire(waiting,immediate).res.charcoal,0,'final Fire resolution does not activate a scheduled source whose player-triggered countdown was not reached');
const afterWait=hex.applyAction(waiting,hex.createInitialState(waiting),{tool:'wait'}).state;
const timed=hex.applyAction(waiting,afterWait,{tool:'woodcutter',q:-2,r:2,direction:'E'}).state;
assert.equal(hex.settleFire(waiting,timed).won,true,'WAIT then Woodcutter reaches the scheduled Fire and real win');
console.log('Hex campaign smoke tests passed.');
