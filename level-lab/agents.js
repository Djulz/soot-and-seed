(function(root){
  const presets=[['balanced','Balanced','General-purpose placeholder.',1],['greedy-harvester','Greedy Harvester','Prefers immediate harvest value.',1],['forge-first','Forge First','Prefers Forge actions.',1],['requirement-chaser','Requirement Chaser','Will prioritize missing requirements.',1],['fire-fearful','Fire Fearful','Will avoid exposed Fire futures.',1],['max-yield','Max Yield','Will prefer the largest region.',1],['wait-friendly','Wait Friendly','Will consider timing advances.',1],['action-conservator','Action Conservator','Will preserve paid moves.',1]];
  const agents=presets.map(([id,name,description,lookaheadDepth])=>({id,name,description,lookaheadDepth,heuristicWeights:{},chooseAction(){return null;}}));
  root.SootSeedLevelLabAgents={agents};
})(globalThis);
