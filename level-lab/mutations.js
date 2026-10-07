(function(root){
  const clone=root.SootSeedLevelLabCandidates.clone;
  const registry=[
    {id:'move-first-tree-right',name:'Move first Tree right',description:'Moves the first Tree one cell right when that cell is Ground.',canApply(level){return level.map.some(row=>row.includes('T.'));},apply(level){const next=clone(level);for(let r=0;r<next.map.length;r++){const c=next.map[r].indexOf('T.');if(c>=0){next.map[r]=next.map[r].slice(0,c)+'.T'+next.map[r].slice(c+2);return{level:next,history:`Moved Tree (${r+1},${c+1}) → (${r+1},${c+2})`};}}throw new Error('Mutation unexpectedly became inapplicable.');}},
    {id:'increase-charcoal-goal',name:'Increase Charcoal goal',description:'Raises the Charcoal requirement by one.',canApply(){return true;},apply(level){const next=clone(level);const before=next.req.charcoal||0;next.req.charcoal=before+1;return{level:next,history:`Charcoal requirement ${before} → ${before+1}`};}}
  ];
  function applyMutation(candidate,id,rng){const mutation=registry.find(item=>item.id===id);if(!mutation)throw new Error(`Unknown mutation: ${id}`);if(!mutation.canApply(candidate.level,rng))throw new Error(`Mutation is not legal for ${candidate.id}.`);const result=mutation.apply(candidate.level,rng);return root.SootSeedLevelLabTypes.candidate({...candidate,id:`${candidate.id}-${id}`,parentId:candidate.id,generation:candidate.generation+1,level:result.level,mutations:[...candidate.mutations,result.history],evaluation:root.SootSeedLevelLabTypes.emptyEvaluation()});}
  root.SootSeedLevelLabMutations={registry,applyMutation};
})(globalThis);
