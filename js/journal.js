/* journal.js — commission states and dated notes */
window.JOURNAL = (function(){
  const R = () => window.RULES;
  function derive(G){
    const notes = G.journal||[];
    const quests = (G.quests||{});
    // derived commission list: based on module state
    const out = [];
    const modId = G.module;
    const mod = window.MODULES[modId];
    if(mod){
      for(const q of mod.quests||[]){
        const st = quests[q.id] || {status:'not_offered'};
        out.push({id:q.id, name:q.name, side:q.side, status:st.status||'not_offered', goal:q.goal, gold:q.gold, xp:q.xp, offer:q.offer, done:q.done, needItem:q.needItem});
      }
    }
    return out;
  }
  function advance(G, questId, status){
    G.quests = G.quests||{};
    const cur = G.quests[questId] || {status:'not_offered'};
    cur.status = status; G.quests[questId] = cur;
  }
  function note(G, text){
    G.journal = G.journal||[];
    const day = Math.floor((G.time||0)/1440)+1;
    const mins = ((G.time||0)%1440);
    const hh = Math.floor(mins/60), mm = Math.floor(mins%60);
    const t = 'Day '+day+' '+(hh<10?'0':'')+hh+':'+(mm<10?'0':'')+mm;
    // dedupe by (module,text)
    if(G.journal.some(n=>n.text===text && n.mod===G.module)) return;
    G.journal.unshift({day, t, text, mod:G.module});
    if(G.journal.length>200) G.journal.length = 200;
  }
  return {derive, advance, note};
})();
