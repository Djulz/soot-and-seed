(function(root){
  function emptyMetrics(){return{solvable:null,oracleMinimumMoves:null,agentWinRate:null,attempts:0,averageActions:null,averagePaidMoves:null,waitActions:0,firstActionDistribution:{},losingDeadStateStep:null,distinctWinningSequences:null,viableOpeningActions:null,exploredStateCount:null};}
  function smokeSimulation(candidate){const state=root.SootSeedSimulation.createInitialState(candidate.level),actions=root.SootSeedSimulation.getLegalActions(candidate.level,state);return{initialActions:actions.length,stateHash:root.SootSeedLevelLabSolver.stateHash(state),status:root.SootSeedSimulation.getGameStatus(candidate.level,state)};}
  function evaluateCandidate(candidate){const validation=root.SootSeedLevelLabValidation.validate(candidate.level);return{...candidate,evaluation:{status:validation.ok?'static-valid':'invalid',structural:validation.structural,staticSanity:validation.staticSanity,oracle:root.SootSeedLevelLabSolver.createOracleResult(),agents:null,metrics:emptyMetrics()}};}
  root.SootSeedLevelLabEvaluation={emptyMetrics,smokeSimulation,evaluateCandidate};
})(globalThis);
