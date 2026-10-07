(function(root){
  function generateOne(seedCandidate,mutationId,rng){return root.SootSeedLevelLabMutations.applyMutation(seedCandidate,mutationId,rng);}
  root.SootSeedLevelLabGeneration={generateOne};
})(globalThis);
