(function(root){
  const clone=value=>JSON.parse(JSON.stringify(value));
  function createCandidate(seedLevelId,level,options={}){const id=options.id||`candidate-${seedLevelId}-${options.generation||0}-${options.nonce||'seed'}`;return root.SootSeedLevelLabTypes.candidate({id,seedLevelId,generation:options.generation||0,parentId:options.parentId||null,level:clone(level),mutations:options.mutations||[],evaluation:root.SootSeedLevelLabTypes.emptyEvaluation()});}
  function cloneCandidate(candidate,options={}){return createCandidate(candidate.seedLevelId,candidate.level,{id:options.id||`${candidate.id}-copy`,generation:options.generation??candidate.generation,parentId:candidate.id,mutations:[...candidate.mutations],nonce:options.nonce});}
  root.SootSeedLevelLabCandidates={createCandidate,cloneCandidate,clone};
})(globalThis);
