/* Soot & Seed: WAIT campaign extension.
   Kept separate so the static GitHub Pages build can be updated safely. */
(() => {
  const WAIT_ICON = '<svg class="token wait" viewBox="0 0 48 48" aria-hidden="true"><path d="M14 7h20M14 41h20M17 8c1 8 5 11 7 16-2 5-6 8-7 16M31 8c-1 8-5 11-7 16 2 5 6 8 7 16" fill="none" stroke="#75654f" stroke-width="3" stroke-linecap="round"/><path d="m19 14 10 10-10 10z" fill="#c58a42"/></svg>';
  const pinebreak = [
    { id:'pinebreak-06-let-it-burn', title:'Let It Burn', hint:'WAIT advances Fire without spending a move.', moves:1, req:{wood:4,charcoal:1}, tools:['woodcutter','wait'], map:['FTTTT','....T','.....','.....','.....'] },
    { id:'pinebreak-07-burn-the-bridge', title:'Burn the Bridge', hint:'Let Fire reshape the Forest before you harvest it.', moves:2, req:{wheat:4,wood:3,charcoal:4}, tools:['sickle','woodcutter','wait'], map:['......','FTTT..','..T...','..TTT.','....WW','....WW'] },
    { id:'pinebreak-08-hold-the-farmstead', title:'Hold the Farmstead', hint:'Protect the Farmstead by removing the fuel it needs.', moves:2, req:{wheat:4,wood:4,charcoal:2}, tools:['sickle','woodcutter','wait'], map:['FTTTH.','...T..','..TT..','......','WWWW..','......'] },
    { id:'pinebreak-09-the-waiting-spark', title:'The Waiting Spark', hint:'Numbers show world steps until ignition.', moves:2, req:{wheat:4,wood:4,charcoal:4}, tools:['sickle','woodcutter','wait'], map:['.TTT..','.T....','..WW..','..WW..','..TT..','..TT..','......'], fires:[{r:0,c:0,after:2}] },
    { id:'pinebreak-10-three-priorities', title:'Three Priorities', hint:'Two Fire fronts. One careful sequence.', moves:3, req:{wheat:4,wood:7,charcoal:6}, tools:['sickle','woodcutter','wait'], map:['FTTTH..','...T...','..TT...','.......','.TTT...','.T.TWW.','.TT.WW.'], fires:[{r:4,c:0,after:2}] }
  ];

  pinebreak.forEach((definition,index) => {
    const level = levels[index + 5];
    Object.assign(level, definition, {formatVersion:2});
    const chapterEntry = campaignChapters[1].entries[index];
    const entry = campaignEntries[index + 5];
    Object.assign(chapterEntry, {id:definition.id,title:definition.title,level});
    Object.assign(entry, {id:definition.id,title:definition.title,level});
  });

  // Chapter 3 intentionally lives in the campaign extension so Chapters 1–2
  // and their authored level definitions remain untouched.
  const ironwood = [
    { id:'ironwood-11-first-forge', title:'First Forge', hint:'Forge uses 1 nearby Tree for each Ore it processes.', moves:2, req:{iron:3,wood:3,charcoal:2}, tools:['forge','woodcutter','wait'], map:['TOO..','T.O..','T....','FT...','T.TTT'] },
    { id:'ironwood-12-leave-enough', title:'Leave Enough', hint:'', moves:2, req:{iron:3,wood:5,charcoal:2}, tools:['forge','woodcutter','wait'], map:['.TTTTT','.T.OO.','.T.OO.','.T....','FT....','.T....'] },
    { id:'ironwood-13-three-ways', title:'Three Ways', hint:'', moves:2, req:{iron:3,wood:5,charcoal:4}, tools:['forge','woodcutter','wait'], map:['.......','...OO..','...OO..','FTTTT..','TTTTT..','.TTT...'] },
    { id:'ironwood-14-before-the-spark', title:'Before the Spark', hint:'', moves:3, req:{iron:3,wood:5,charcoal:4,wheat:4}, tools:['sickle','woodcutter','forge','wait'], map:['.......','....OO.','T...OO.','TTTTT..','2TTTT..','.TT..WW','.....WW'], fires:[{r:4,c:0,after:2}] },
    { id:'ironwood-15-the-iron-line', title:'The Iron Line', hint:'', moves:4, req:{iron:3,wood:8,charcoal:6,wheat:4}, tools:['sickle','woodcutter','forge','wait'], map:['FTTTTTTH','.....OO.','.....OO.','.TTTTT..','.TT1T...','.TT.....','..T...WW','......WW'], fires:[{r:4,c:3,after:1}] }
  ];
  const ironwoodChapter = {
    id:'ironwood', number:3, title:'Ironwood', subtitle:'Ore veins and harder bargains.', mark:'◆',
    entries: ironwood.map((definition,index) => {
      const level = Object.assign({name:definition.title,formatVersion:2}, definition);
      levels.push(level);
      return {id:definition.id,number:11+index,title:definition.title,tag:'',level};
    })
  };
  campaignChapters.push(ironwoodChapter);
  ironwoodChapter.entries.forEach(entry => campaignEntries.push({...entry,chapterId:ironwoodChapter.id}));


  const windfall = [
    { id:'windfall-16-across-the-gap', title:'Across the Gap', hint:'Wind carries Fire one extra tile downwind.', moves:1, wind:'right', req:{wood:3,charcoal:1}, tools:['woodcutter','wait'], map:['F.T...','......','.TTT..','......','......'] },
    { id:'windfall-17-tailwind', title:'Tailwind', hint:'', moves:2, wind:'right', req:{wheat:4,wood:3,charcoal:2}, tools:['sickle','woodcutter','wait'], map:['FTTTTT','......','WW....','WW....','......','......'] },
    { id:'windfall-18-break-the-line', title:'Break the Line', hint:'', moves:2, wind:'down', req:{wheat:4,wood:2,charcoal:2}, tools:['sickle','woodcutter','wait'], map:['....TF','....T.','.WW..T','.WW..T','.....H','......'] },
    { id:'windfall-19-fanned-spark', title:'Fanned Spark', hint:'', moves:3, wind:'left', req:{iron:3,wood:4,charcoal:2,wheat:4}, tools:['sickle','woodcutter','forge','wait'], map:['..WWWW.','TTTTTT2','.......','.......','..OO...','..OOT..','..TTT..'], fires:[{r:1,c:6,after:2}] },
    { id:'windfall-20-the-long-gale', title:'The Long Gale', hint:'', moves:4, wind:'up', req:{iron:3,wood:9,charcoal:7,wheat:4}, tools:['sickle','woodcutter','forge','wait'], map:['........','...TT...','FTTTTTTH','..TOOT..','..TOOT..','..TTT...','..T3TWW.','..TT.WW.'], fires:[{r:6,c:3,after:3}] }
  ];
  const windfallChapter = {
    id:'windfall', number:4, title:'Windfall', subtitle:'The gale changes every fireline.', mark:'↝',
    entries: windfall.map((definition,index) => {
      const level = Object.assign({name:definition.title,formatVersion:2}, definition, {map:definition.map.map(row => row.replace(/[1-9]/g,'.'))});
      levels.push(level);
      return {id:definition.id,number:16+index,title:definition.title,tag:'',level};
    })
  };
  campaignChapters.push(windfallChapter);
  windfallChapter.entries.forEach(entry => campaignEntries.push({...entry,chapterId:windfallChapter.id}));

  const baseShowMenu = showMenu;
  showMenu = function() {
    baseShowMenu();
    const resume = resumeCampaignEntry();
    if (!resume) return;
    const chapter = campaignChapters.find(item => item.id === resume.chapterId);
    document.querySelector('#continueSub').textContent = `Chapter ${chapter.number} · ${chapter.title} · ${resume.title}`;
  };

  const legacyIds = {
    'pinebreak-06-the-first-well':'pinebreak-06-let-it-burn',
    'pinebreak-07-split-grove':'pinebreak-07-burn-the-bridge'
  };
  const campaign = campaignProgress();
  const migrated = campaign.completed.map(id => legacyIds[id] || id);
  const migratedLast = legacyIds[campaign.lastPlayed] || campaign.lastPlayed;
  if (migrated.join('|') !== campaign.completed.join('|') || migratedLast !== campaign.lastPlayed) {
    campaign.completed = migrated;
    campaign.lastPlayed = migratedLast;
    saveCampaign(campaign);
  }

  const originalParser = parseLevelSource;
  parseLevelSource = source => {
    const usesWait = /^WAIT\s*$/im.test(source);
    const parsed = originalParser(source.replace(/^WAIT\s*$/gim, 'WELL'));
    if (parsed.ok && usesWait) {
      const lines = source.split(/\r?\n/).map(line => line.trim().toUpperCase());
      const start = lines.indexOf('ACTIONS');
      const end = lines.indexOf('MAP');
      parsed.level.tools = [...new Set(lines.slice(start + 1, end)
        .filter(action => ['SICKLE','WOODCUTTER','FORGE','WELL','WAIT'].includes(action))
        .map(action => action.toLowerCase()))];
    }
    return parsed;
  };

  const originalLabel = label;
  const originalDesc = desc;
  label = tool => tool === 'wait' ? `<span class="tool-token">${WAIT_ICON}</span>Wait` : originalLabel(tool);
  desc = tool => tool === 'wait' ? 'Advance the world · 0 moves' : originalDesc(tool);

  beginTurn = function(tool, r = null, c = null) {
    const scheduledBefore = [];
    state.cells.forEach((row, rr) => row.forEach((cell, cc) => {
      if (cell.ignition && !cell.ignition.fired) scheduledBefore.push({at:[rr,cc],remaining:Math.max(0,cell.ignition.after-state.actions)});
    }));
    undoStack.push({state:cloneState(),historyLength:turnHistory.length});
    currentTurn = {number:state.actions+1,tool,target:r===null?null:[r,c],movesBefore:state.moves,resourcesBefore:{...state.res},events:[],harvested:[],wet:[],forge:null,fire:[],scheduled:[],scheduledBefore,destroyedCenter:r===null?null:state.cells[r][c].object||null};
  };

  historyText = function(turn) {
    const action = turn.tool === 'wait' ? 'WAIT' : `${turn.tool.toUpperCase()} @ ${pos(turn.target)}`;
    const bits = [];
    if (turn.destroyedCenter && ['forge','well'].includes(turn.tool)) bits.push(`center ${turn.destroyedCenter} removed`);
    if (turn.harvested.length) bits.push(`${turn.harvested.length} ${turn.tool==='sickle'?'Wheat':'Trees'} harvested: ${posList(turn.harvested)}`);
    if (turn.forge) bits.push(`Forge fuel: ${posList(turn.forge.fuel)} · Ore: ${posList(turn.forge.ore)} · Iron +${turn.forge.count}`);
    if (turn.wet.length) bits.push(`Wet: ${posList(turn.wet)}`);
    for (const fire of turn.fire) {
      const normal = fire.normal.length ? `normal: ${posList(fire.normal)}` : '';
      const wind = fire.wind.length ? `wind ${WIND_ARROW[fire.windDir]||''}: ${posList(fire.wind)}` : '';
      const life = `Active→Dying ${fire.activeToDying.length} · Dying→Burnt ${fire.dyingToBurnt.length}`;
      const charcoal = fire.charcoal ? `charcoal +${fire.charcoal}` : '';
      bits.push(['Fire',normal,wind,life,charcoal].filter(Boolean).join(' · '));
    }
    if (turn.scheduledBefore?.length) bits.push(`scheduled: ${turn.scheduledBefore.map(source => `${pos(source.at)} ${source.remaining} → ${Math.max(0,source.remaining-1)}`).join(' · ')}`);
    if (turn.scheduled.length) bits.push(`scheduled Fire: ${posList(turn.scheduled)}`);
    const gains = Object.entries(turn.delta||{}).map(([kind,value]) => `${kind}+${value}`).join(' · ');
    if (gains) bits.push(gains);
    bits.push(`moves ${turn.movesBefore} → ${turn.movesAfter}`);
    return {action,bits};
  };
  renderHistory = function() {
    const host = document.querySelector('#historyLog');
    if (!host) return;
    if (!turnHistory.length) { host.innerHTML='<p>No completed turns yet.</p>'; return; }
    host.innerHTML = turnHistory.map(turn => {
      const x = historyText(turn);
      return `<article class="history-entry"><strong>STEP ${turn.number} · ${x.action}</strong>${x.bits.length?`<span class="history-detail">${x.bits.join('<br>')}</span>`:''}${turn.result?`<span class="history-detail"><strong>RESULT — ${turn.result.toUpperCase()}</strong></span>`:''}</article>`;
    }).join('');
  };
  copyRun = function() {
    const title = activeLevel.name.replace(/^\s*\d+\s*·\s*/, '');
    const status = state.houseLost ? 'LOSS' : won() ? 'WIN' : 'IN PROGRESS';
    const steps = turnHistory.map(turn => `${turn.number}. ${turn.tool==='wait'?'WAIT':`${turn.tool.toUpperCase()} ${pos(turn.target)}`}${turn.forge?` → ${turn.forge.count} Iron`:''}`).join('\n') || 'No actions';
    const totals = Object.entries(state.res).map(([kind,value]) => `${kind[0].toUpperCase()}${value}`).join(' / ');
    navigator.clipboard?.writeText(`${title}\n${status} — ${activeLevel.moves-state.moves} / ${activeLevel.moves} moves\n\n${steps}\n\nFinal:\n${totals}${state.housesTotal?`\nFarmstead ${state.houseLost?'Lost':'Safe'}`:''}`);
    const feedback = document.querySelector('#customFeedback');
    if (feedback) feedback.textContent='Run copied.';
  };

  const canWait = () => activeFireCells().length > 0 || dyingFireCells().length > 0 || state.cells.flat().some(cell => cell.ignition && !cell.ignition.fired);
  const runWait = async () => {
    if (locked || !canWait()) return;
    selected = null;
    beginTurn('wait');
    locked = true;
    render();
    state.actions++;
    render();
    await triggerAutoFire();
    await finishAction();
    endTurn();
  };
  const baseRender = render;
  render = function() {
    baseRender();
    const button = toolsEl.querySelector('[data-tool="wait"]');
    if (button) { button.disabled = locked || !canWait(); button.classList.remove('selected'); button.onclick = runWait; }
    const help = document.querySelector('.format-help p:last-child');
    if (help) help.innerHTML='GOALS: WOOD, CHARCOAL, WHEAT, IRON<br>ACTIONS: SICKLE, WOODCUTTER, FORGE, WELL, WAIT';
    const readout = document.querySelector('#readout');
    if (readout) readout.textContent = readout.textContent.replace(`${state.actions} actions`, `${state.actions} world steps`);
  };
})();
