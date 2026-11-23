/* bestiary.js — first-sight cards, discovery-gated stats */
window.BESTIARY = (function(){
  function record(G, monsterId, kind){
    G.bestiary = G.bestiary||{};
    const entry = G.bestiary[monsterId] || {seen:0, fought:0, slain:0};
    if(kind==='sight') entry.seen = entry.seen||Date.now();
    if(kind==='fight') entry.fought = (entry.fought||0)+1;
    if(kind==='slain') entry.slain = (entry.slain||0)+1;
    G.bestiary[monsterId] = entry;
  }
  function seen(G, monsterId){ return G.bestiary && G.bestiary[monsterId]; }
  function known(G, monsterId){ const e = seen(G, monsterId); return !!e && (e.seen||0)>0; }
  function statsUnlocked(G, monsterId){ const e = seen(G, monsterId); return !!e && ((e.fought||0)>0 || (e.slain||0)>0); }
  function list(G){ return Object.keys(G.bestiary||{}).map(id=>({id, ...G.bestiary[id]})); }
  return {record, seen, known, statsUnlocked, list};
})();
