(function(root){
  const clone=value=>JSON.parse(JSON.stringify(value));
  function createCandidate(seedLevelId,level,options={}){const id=options.id||`candidate-${seedLevelId}-${options.generation||0}-${options.nonce||'seed'}`;return root.SootSeedLevelLabTypes.candidate({id,seedLevelId,generation:options.generation||0,parentId:options.parentId||null,level:clone(level),mutations:options.mutations||[],metadata:clone(options.metadata||{}),evaluation:options.evaluation||root.SootSeedLevelLabTypes.emptyEvaluation()});}
  function cloneCandidate(candidate,options={}){return createCandidate(candidate.seedLevelId,candidate.level,{id:options.id||`${candidate.id}-copy`,generation:options.generation??candidate.generation,parentId:options.parentId??candidate.id,mutations:options.mutations||[...candidate.mutations],metadata:{...(candidate.metadata||{}),...(options.metadata||{})},nonce:options.nonce,evaluation:options.evaluation});}
  root.SootSeedLevelLabCandidates={createCandidate,cloneCandidate,clone};
})(globalThis);
