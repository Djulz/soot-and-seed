(function(root){
  let candidates=[],batches=[],pinned=new Set();
  const all=()=>[...candidates];
  const clear=()=>{candidates=[];batches=[];pinned=new Set();};
  const add=candidate=>{candidates=[...candidates.filter(item=>item.id!==candidate.id),candidate];return candidate;};
  const addMany=items=>{items.forEach(add);return all();};
  const get=id=>candidates.find(item=>item.id===id)||null;
  const addBatch=batch=>{batches=[...batches.filter(item=>item.id!==batch.id),batch];addMany(batch.allCandidates||batch.candidates||[]);return batch;};
  const allBatches=()=>[...batches];
  const pin=id=>{pinned.add(id);return get(id);};
  const unpin=id=>{pinned.delete(id);};
  const isPinned=id=>pinned.has(id);
  root.SootSeedLevelLabCandidateStore={all,clear,add,addMany,get,addBatch,allBatches,pin,unpin,isPinned};
})(globalThis);
