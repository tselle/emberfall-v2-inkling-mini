/* watch.js — locate live set encounters, line of sight, surprise */
window.WATCH = (function(){
  const WALL_CHARS = new Set(['#','H','B','T','F']);
  function cellChar(map, mods, x, y){
    const key = x+','+y;
    if(mods && mods[key]) return mods[key];
    const rows = map.grid;
    if(x<0||y<0||x>=rows[0].length||y>=rows.length) return '#';
    return rows[y][x];
  }
  function isOpaque(c){ return c==='#'||c==='H'||c==='B'||c==='D'||c==='L'||c==='S'||c==='G'; }
  function lineOfSight(map, mods, x0,y0,x1,y1){
    // supercover line; endpoints do not block
    const dx = x1-x0, dy = y1-y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy))*3;
    for(let i=1;i<steps;i++){
      const t = i/steps;
      const x = Math.floor(x0 + dx*t + 0.5), y = Math.floor(y0 + dy*t + 0.5);
      const c = cellChar(map, mods, x, y);
      if(isOpaque(c)) return false;
    }
    return true;
  }
  function bands(map, mods, evFlags, mapKey){
    // return array of live bands: {x, y, eventLetter, hidden, seen}
    const bands = [];
    if(!map.ev) return bands;
    for(const letter in map.ev){
      const ev = map.ev[letter];
      if(!ev || !ev.enc) continue;
      const key = (mapKey || (map && map.id) || 'map')+':'+letter;
      if(evFlags && evFlags[key]) continue; // cleared/hidden
      // find the cell of this event
      outer: for(let y=0;y<map.grid.length;y++){ for(let x=0;x<map.grid[y].length;x++){ if(map.grid[y][x]===letter){ bands.push({x,y,letter,hidden:!!ev.enc.hidden,seen:!!ev.enc.seen}); break outer; } } }
      // fallback: use a position
      if(!bands.length && ev.x!==undefined) bands.push({x:ev.x,y:ev.y,letter,hidden:!!ev.enc.hidden,seen:!!ev.enc.seen});
    }
    return bands;
  }
  return {cellChar, lineOfSight, bands, isOpaque};
})();
