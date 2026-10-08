/* Authoritative deterministic Soot & Seed rules. No DOM, no animation. */
(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SootSeedSimulation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const T={ground:'ground',rock:'rock',water:'water',void:'void'};
  const O={tree:'tree',wheat:'wheat',ore:'ore',woodcutter:'woodcutter',forge:'forge',well:'well',house:'house',none:null};
  const DIR=[[1,0],[-1,0],[0,1],[0,-1]], AROUND=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  const clone=value=>JSON.parse(JSON.stringify(value));
  const key=(r,c)=>`${r},${c}`;
  // Campaign/custom source digits are scheduled-fire markers. Timing lives in `fires`; their terrain is Ground.
  const cellFrom=ch=>ch==='.'||/[1-9]/.test(ch)?{terrain:T.ground,object:null,state:'normal',wet:false}:ch==='F'?{terrain:T.ground,object:null,state:'active-fire',wet:false}:ch==='T'?{terrain:T.ground,object:O.tree,state:'normal',wet:false}:ch==='W'?{terrain:T.ground,object:O.wheat,state:'normal',wet:false}:ch==='H'?{terrain:T.ground,object:O.house,state:'normal',wet:false}:ch==='O'?{terrain:T.rock,object:O.ore,state:'normal',wet:false}:{terrain:T.void,object:null,state:'normal',wet:false};
  const levelFires=level=>level.fires || (level.ignition?[level.ignition]:[]);
  function createInitialState(level){
    const state={cells:level.map.map(row=>[...row].map(cellFrom)),moves:level.moves,res:{wood:0,charcoal:0,wheat:0,iron:0},actions:0,houseLost:false,housesTotal:level.map.join('').split('H').length-1};
    levelFires(level).forEach(fire=>{ if(state.cells[fire.r]?.[fire.c]) state.cells[fire.r][fire.c].ignition={after:fire.after,fired:false}; });
    return state;
  }
  const inBoard=(state,r,c)=>!!state.cells[r]?.[c];
  const neighbors=(state,r,c,diag=false)=>(diag?AROUND:DIR).map(([dr,dc])=>[r+dr,c+dc]).filter(([rr,cc])=>inBoard(state,rr,cc));
  function region(state,r,c,kind){const out=[],seen=new Set(),queue=[[r,c]];while(queue.length){const [rr,cc]=queue.shift(),id=key(rr,cc);if(seen.has(id)||!inBoard(state,rr,cc)||state.cells[rr][cc].object!==kind)continue;seen.add(id);out.push([rr,cc]);neighbors(state,rr,cc).forEach(next=>queue.push(next));}return out;}
  function forgeOreRegion(state,r,c){for(const [rr,cc] of neighbors(state,r,c,true))if(state.cells[rr][cc].object===O.ore)return region(state,rr,cc,O.ore);return [];}
  function calculateForgeResult(state,r,c){const fuel=neighbors(state,r,c,true).filter(([rr,cc])=>state.cells[rr][cc].object===O.tree).sort(([ar,ac],[br,bc])=>(Math.abs(ar-r)+Math.abs(ac-c))-(Math.abs(br-r)+Math.abs(bc-c))||ar-br||ac-bc),ore=forgeOreRegion(state,r,c),count=Math.min(fuel.length,ore.length);return{valid:count>0,fuel:fuel.slice(0,count),ore:ore.slice(0,count),count,oreRegion:ore.length};}
  function isLegalAction(level,state,action){const tool=action?.tool;if(!level.tools.includes(tool))return false;if(tool==='wait')return canWait(state);const {r,c}=action,cell=state.cells[r]?.[c];if(!cell)return false;if(tool==='sickle')return cell.object===O.wheat;if(tool==='woodcutter')return cell.object===O.tree;if(['forge','well'].includes(tool)){if(cell.ignition||['active-fire','dying-fire'].includes(cell.state)||cell.terrain!==T.ground||[O.woodcutter,O.forge,O.well,O.house].includes(cell.object))return false;return tool==='forge'?calculateForgeResult(state,r,c).valid:true;}return false;}
  function getLegalActions(level,state){const actions=[];for(let r=0;r<state.cells.length;r++)for(let c=0;c<state.cells[r].length;c++)for(const tool of level.tools)if(tool!=='wait'&&isLegalAction(level,state,{tool,r,c}))actions.push({tool,r,c});if(level.tools.includes('wait')&&canWait(state))actions.push({tool:'wait'});return actions;}
  const activeFireCells=state=>{const out=[];state.cells.forEach((row,r)=>row.forEach((cell,c)=>{if(cell.state==='active-fire')out.push([r,c]);}));return out;};
  const dyingFireCells=state=>{const out=[];state.cells.forEach((row,r)=>row.forEach((cell,c)=>{if(cell.state==='dying-fire')out.push([r,c]);}));return out;};
  const windDirections={up:[-1,0],down:[1,0],left:[0,-1],right:[0,1]};
  const ignitable=cell=>!!cell&&!cell.wet&&[O.tree,O.wheat,O.house].includes(cell.object);
  function fireTargetsFor(level,state,fronts){const normal=new Map(),wind=new Map(),add=(map,r,c)=>{if(ignitable(state.cells[r]?.[c]))map.set(key(r,c),[r,c]);};fronts.forEach(([r,c])=>{neighbors(state,r,c).forEach(([rr,cc])=>add(normal,rr,cc));const vector=windDirections[level.wind];if(vector){const [dr,dc]=vector,first=state.cells[r+dr]?.[c+dc],second=state.cells[r+dr*2]?.[c+dc*2];if(first&&first.terrain!==T.void&&second&&second.terrain!==T.void)add(wind,r+dr*2,c+dc*2);}});return{normal,wind};}
  function ignite(state,targets){for(const [r,c] of targets.values()){const cell=state.cells[r][c];if(cell.state==='active-fire')continue;if(cell.object===O.house){cell.state='active-fire';state.houseLost=true;}else{cell.charcoalPending=cell.object===O.tree;cell.object=null;cell.state='active-fire';}}}
  function advanceWorldStep(level,state){const next=clone(state),fronts=activeFireCells(next),dying=dyingFireCells(next),targets=fireTargetsFor(level,next,fronts),event={activeToDying:[...fronts],dyingToBurnt:[...dying],normal:[...targets.normal.values()],wind:[...targets.wind.values()],scheduled:[],charcoal:0};dying.forEach(([r,c])=>{const cell=next.cells[r][c];cell.state='burnt';if(cell.charcoalPending){cell.charcoalPending=false;next.res.charcoal++;event.charcoal++;}});fronts.forEach(([r,c])=>next.cells[r][c].state='dying-fire');ignite(next,targets.normal);if(!next.houseLost)ignite(next,targets.wind);next.cells.forEach((row,r)=>row.forEach((cell,c)=>{const fire=cell.ignition;if(fire&&!fire.fired&&next.actions>=fire.after){fire.fired=true;cell.state='active-fire';event.scheduled.push([r,c]);}}));return{state:next,event};}
  function resolveFinalFire(level,state){let next=clone(state),steps=0;while((activeFireCells(next).length||dyingFireCells(next).length)&&!next.houseLost){next=advanceWorldStep(level,next).state;if(++steps>1024)throw new Error('Fire resolution exceeded safety limit.');}return next;}
  const canWait=state=>activeFireCells(state).length>0||dyingFireCells(state).length>0||state.cells.flat().some(cell=>cell.ignition&&!cell.ignition.fired);
  const pendingMandatoryEvents=state=>state.cells.flat().some(cell=>cell.ignition&&!cell.ignition.fired&&cell.ignition.after<=state.actions+state.moves);
  const getGameStatus=(level,state)=>({won:!state.houseLost&&!activeFireCells(state).length&&!dyingFireCells(state).length&&!pendingMandatoryEvents(state)&&Object.entries(level.req).every(([kind,need])=>(state.res[kind]||0)>=need),lost:state.houseLost,paidMovesUsed:level.moves-state.moves,worldSteps:state.actions});
  function applyAction(level,state,action){if(!isLegalAction(level,state,action))throw new Error(`Illegal action: ${JSON.stringify(action)}`);let next=clone(state),event={action:clone(action),harvested:[],forge:null,world:null};if(action.tool==='sickle'||action.tool==='woodcutter'){const kind=action.tool==='sickle'?O.wheat:O.tree,gain=action.tool==='sickle'?'wheat':'wood';for(const [r,c] of region(next,action.r,action.c,kind)){next.cells[r][c].object=null;next.cells[r][c].state='harvested';next.res[gain]++;event.harvested.push([r,c]);}next.moves--;}else if(action.tool==='forge'){const plan=calculateForgeResult(next,action.r,action.c);next.cells[action.r][action.c].object=O.forge;for(const [r,c] of plan.fuel){next.cells[r][c].object=null;next.cells[r][c].state='processed';}for(const [r,c] of plan.ore){next.cells[r][c].object=null;next.cells[r][c].state='processed';next.res.iron++;}next.moves--;event.forge=plan;}else if(action.tool==='well'){next.cells[action.r][action.c].object=O.well;neighbors(next,action.r,action.c,true).forEach(([r,c])=>next.cells[r][c].wet=true);}
    next.actions++;const stepped=advanceWorldStep(level,next);next=stepped.state;event.world=stepped.event;if(next.moves===0&&!next.houseLost)next=resolveFinalFire(level,next);return{state:next,event,status:getGameStatus(level,next)};}
  const getAvailableResources=state=>({...state.res});
  const getRequirements=level=>({...level.req});
  const serializeState=state=>JSON.stringify(state);
  return{T,O,cloneState:clone,cellFrom,createInitialState,getLegalActions,isLegalAction,applyAction,advanceWorldStep,resolveFinalFire,getGameStatus,getAvailableResources,getRequirements,serializeState,inBoard,neighbors,region,forgeOreRegion,calculateForgeResult,activeFireCells,dyingFireCells,canWait};
});
