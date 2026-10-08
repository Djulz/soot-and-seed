/* Level Lab data contracts. Kept as plain objects for the static app. */
(function(root){
  root.SootSeedLevelLabTypes={
    candidate({id,seedLevelId,generation=0,parentId=null,level,mutations=[],evaluation=null,metadata={}}){return{id,seedLevelId,generation,parentId,level,mutations,evaluation,metadata};},
    emptyEvaluation(){return{status:'not-run',structural:null,staticSanity:null,oracle:null,agents:null,metrics:null,analysis:null};}
  };
})(globalThis);
