(function(root){
  let candidates=[];
  const all=()=>[...candidates];
  const clear=()=>{candidates=[];};
  const add=candidate=>{candidates=[...candidates.filter(item=>item.id!==candidate.id),candidate];return candidate;};
  const get=id=>candidates.find(item=>item.id===id)||null;
  root.SootSeedLevelLabCandidateStore={all,clear,add,get};
})(globalThis);
