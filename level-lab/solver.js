(function(root){
  // Interface only: future exhaustive search must hash full simulation state, not moves alone.
  function stateHash(state){return root.SootSeedSimulation.serializeState(state);}
  function createOracleResult(){return{status:'not-implemented',solvable:null,minimumPaidMoves:null,exploredStates:0,winningActions:[],distinctWinningSequences:null};}
  root.SootSeedLevelLabSolver={stateHash,createOracleResult};
})(globalThis);
