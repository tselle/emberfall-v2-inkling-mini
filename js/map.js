/* map.js — hover names, legend, full map */
window.MAP = (function(){
  function squareName(G, mods){
    if(!G) return '';
    const m = window.MAPS[G.map]; if(!m) return '';
    const rows = m.grid; const x = G.x, y = G.y;
    const key = x+','+y; const c = (mods && mods[key]) || rows[y][x];
    const names = {
      '#':'Wall','H':'Timber wall','B':'Brick wall','T':'Tree','F':'Fountain','G':'Gate','D':'Door','L':'Locked door','S':'Secret door','<':'Stairs down','>':'Stairs up'
    };
    if(names[c]) return names[c];
    if(m.locs && m.locs[c]) return m.locs[c].name;
    if(c>='a'&&c<='z'){ const ev = m.ev && m.ev[c]; return ev ? (ev.text||('Event '+c)) : 'Site'; }
    if(c>='1'&&c<='9'){ return m.locs && m.locs[c] ? m.locs[c].name : 'Door'; }
    if(c==='.'||c===',') return m.name + ' (street)';
    return m.name;
  }
  function legend(map){
    return {
      '#':'Wall','H':'Timber','B':'Brick','1-9':'Services','G':'Gate','.':'Floor',',':'Grass','T':'Tree','F':'Fountain','D':'Door','L':'Locked','S':'Secret','<':'Stairs up','>':'Stairs down','a-z':'Event'
    };
  }
  return {squareName, legend};
})();
