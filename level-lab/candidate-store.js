(function(root){
  const storageKey='soot-seed-level-lab-pinned-v1',schemaVersion=1;
  let candidates=[],batches=[],pinned=new Set();
  const all=()=>[...candidates];
  const clear=()=>{candidates=[];batches=[];pinned=new Set();};
  const add=candidate=>{candidates=[...candidates.filter(item=>item.id!==candidate.id),candidate];return candidate;};
  const addMany=items=>{items.forEach(add);return all();};
  const get=id=>candidates.find(item=>item.id===id)||null;
  const addBatch=batch=>{batches=[...batches.filter(item=>item.id!==batch.id),batch];addMany(batch.allCandidates||batch.candidates||[]);return batch;};
  const allBatches=()=>[...batches];
  function persist(){try{if(!globalThis.localStorage)return;const saved=all().filter(item=>pinned.has(item.id)).map(item=>JSON.parse(JSON.stringify(item)));globalThis.localStorage.setItem(storageKey,JSON.stringify({version:schemaVersion,candidates:saved}));}catch(error){/* Storage is optional developer convenience. */}}
  function restore(){try{const raw=globalThis.localStorage?.getItem(storageKey);if(!raw)return[];const parsed=JSON.parse(raw);if(parsed?.version!==schemaVersion||!Array.isArray(parsed.candidates))return[];for(const item of parsed.candidates){if(!item?.id||!item?.level?.map||!root.SootSeedLevelLabValidation?.validate(item.level).ok)continue;add(item);pinned.add(item.id);}return all().filter(item=>pinned.has(item.id));}catch(error){return[];}}
  const pin=id=>{const item=get(id);if(item){pinned.add(id);persist();}return item;};
  const unpin=id=>{pinned.delete(id);persist();};
  const isPinned=id=>pinned.has(id);
  root.SootSeedLevelLabCandidateStore={all,clear,add,addMany,get,addBatch,allBatches,pin,unpin,isPinned,persist,restore,storageKey,schemaVersion};
})(globalThis);
