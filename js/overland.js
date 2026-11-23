/* overland.js — wilderness rendering, movement, encounters, sites */
window.OVERLAND = (function(){
  let cv, ctx;
  let painted = null; let paintedMap = null;
  const TILE = 44;
  const PASSABLE = new Set(['.',',','T','n','%','=','+','^']);
  const IMPASSABLE = new Set(['^','~']);
  const TERRAIN = {
    '.': {cost:1, enc:.05, theme:'plains'},
    '=': {cost:0.5, enc:.035, theme:'road'},
    '+': {cost:0.5, enc:.035, theme:'road'},
    'T': {cost:2, enc:.08, theme:'forest'},
    'n': {cost:2, enc:.07, theme:'hills'},
    '%': {cost:3, enc:.09, theme:'swamp'}
  };

  function init(cv2){ cv = cv2; ctx = cv.getContext('2d'); }
  function cellChar(map, x, y){ if(x<0||y<0||x>=map.grid[0].length||y>=map.grid.length) return '^'; return map.grid[y][x]; }
  function passable(c){ if(IMPASSABLE.has(c)) return false; if(c>='A'&&c<='Z') return true; return PASSABLE.has(c); }

  function isNight(time){ return ((time%1440)<330)||((time%1440)>=1200); }

  function render(){
    const G = window.GAME && window.GAME.G;
    if(!G || !cv) return;
    const map = window.MAPS[G.map];
    if(!map || !map.overland) return;
    const r = cv.parentElement.getBoundingClientRect();
    cv.width = Math.max(480, Math.floor(r.width)); cv.height = Math.max(320, Math.floor(r.height));
    ensurePainted(map);
    const W = cv.width, H = cv.height;
    // camera
    const camX = (G.x+0.5)*TILE, camY = (G.y+0.5)*TILE;
    ctx.clearRect(0,0,W,H);
    ctx.imageSmoothingEnabled = false;
    const viewW = W, viewH = H;
    ctx.save();
    ctx.translate(viewW/2 - camX, viewH/2 - camY);
    ctx.drawImage(painted, 0, 0);
    // site labels
    drawSites(ctx, map, G);
    ctx.restore();
    // fog of war in screen space (party is centered)
    drawFog(ctx, G, W, H);
    // HUD overlay: compass & tint
    drawOverlay(ctx, W, H, G);
  }

  function ensurePainted(map){
    if(paintedMap === map && painted) return;
    paintedMap = map;
    painted = document.createElement('canvas');
    const w = map.grid[0].length, h = map.grid.length;
    painted.width = w*TILE; painted.height = h*TILE;
    const pc = painted.getContext('2d');
    for(let y=0;y<h;y++){ for(let x=0;x<w;x++){ const c = map.grid[y][x]; drawCell(pc, x*TILE, y*TILE, c, x, y); } }
  }

  function drawCell(pc, px, py, c, x, y){
    const t = TILE;
    if(c==='~'){ pc.fillStyle='#2a4a6a'; pc.fillRect(px,py,t,t); pc.fillStyle='#3a5a82'; pc.fillRect(px,py+8,t,4); pc.fillStyle='#22405c'; pc.fillRect(px,py+t-6,t,6); }
    else if(c==='^'){ pc.fillStyle='#4a4a55'; pc.fillRect(px,py,t,t); pc.fillStyle='#3a3a45'; pc.beginPath(); pc.moveTo(px,py+t); pc.lineTo(px+t*0.5,py+4); pc.lineTo(px+t,py+t); pc.closePath(); pc.fill(); pc.fillStyle='#5a5a68'; pc.beginPath(); pc.moveTo(px+t*0.15,py+t); pc.lineTo(px+t*0.5,py+10); pc.lineTo(px+t*0.8,py+t); pc.closePath(); pc.fill(); }
    else if(c==='+'){ pc.fillStyle='#6a5a42'; pc.fillRect(px,py,t,t); pc.fillStyle='#8a7a52'; pc.fillRect(px,py+t*0.3,t,t*0.4); }
    else if(c==='='){ pc.fillStyle='#6a5a42'; pc.fillRect(px,py,t,t); pc.fillStyle='#8a7a52'; pc.fillRect(px,py+t*0.3,t,t*0.4); }
    else if(c==='T'){ pc.fillStyle='#3a5230'; pc.fillRect(px,py,t,t); pc.fillStyle='#2e4428'; pc.beginPath(); pc.arc(px+t*0.5,py+t*0.45,t*0.34,0,Math.PI*2); pc.fill(); pc.fillStyle='#20301c'; pc.fillRect(px+t*0.46,py+t*0.6,t*0.08,t*0.3); }
    else if(c==='n'){ pc.fillStyle='#4d4838'; pc.fillRect(px,py,t,t); pc.fillStyle='#5d5240'; pc.beginPath(); pc.moveTo(px,py+t); pc.lineTo(px+t*0.5,py+5); pc.lineTo(px+t,py+t); pc.closePath(); pc.fill(); pc.fillStyle='#6d6046'; pc.beginPath(); pc.moveTo(px+t*0.4,py+t); pc.lineTo(px+t*0.75,py+12); pc.lineTo(px+t,py+t); pc.closePath(); pc.fill(); }
    else if(c==='%'){ pc.fillStyle='#2c3a30'; pc.fillRect(px,py,t,t); pc.fillStyle='#3c5a40'; for(let i=0;i<4;i++){ pc.beginPath(); pc.ellipse(px+(i%2)*t*0.5+t*0.25, py+t*0.3+((i<2)?0:t*0.4), t*0.14, t*0.07, 0, 0, Math.PI*2); pc.fill(); } }
    else if(c===','){ pc.fillStyle='#4a5a34'; pc.fillRect(px,py,t,t); pc.fillStyle='#5a7040'; pc.fillRect(px+t*0.2,py+t*0.3,2,3); pc.fillRect(px+t*0.6,py+t*0.55,2,3); }
    else { pc.fillStyle='#4a5230'; pc.fillRect(px,py,t,t); if((x*7+y*13)%5===0){ pc.fillStyle='#5a6436'; pc.fillRect(px+t*0.7,py+t*0.7,2,2); } }
    if(c>='A'&&c<='Z'){ // site marker
      pc.fillStyle='#e3b54a'; pc.beginPath(); pc.arc(px+t*0.5, py+t*0.5, t*0.22, 0, Math.PI*2); pc.fill();
      pc.fillStyle='#171922'; pc.font='bold ' + Math.floor(t*0.28) + 'px serif'; pc.textAlign='center'; pc.textBaseline='middle'; pc.fillText(c, px+t*0.5, py+t*0.52);
    }
  }

  function drawFog(ctx2, G, W, H){
    const night = isNight(G.time);
    const radius = night ? Math.min(W,H)*0.34 : Math.min(W,H)*0.62;
    ctx2.save();
    const grad = ctx2.createRadialGradient(W/2, H/2, radius*0.35, W/2, H/2, radius);
    grad.addColorStop(0, 'rgba(8,9,14,0)');
    grad.addColorStop(0.5, 'rgba(8,9,14,0.45)');
    grad.addColorStop(1, 'rgba(8,9,14,0.94)');
    ctx2.fillStyle = grad; ctx2.fillRect(0,0,W,H);
    // dark vignette edges
    const ev = ctx2.createLinearGradient(0,0,0,H);
    ev.addColorStop(0,'rgba(0,0,0,0.35)'); ev.addColorStop(0.15,'rgba(0,0,0,0)');
    ev.addColorStop(0.85,'rgba(0,0,0,0)'); ev.addColorStop(1,'rgba(0,0,0,0.35)');
    ctx2.fillStyle = ev; ctx2.fillRect(0,0,W,H);
    ctx2.restore();
  }

  function drawSites(ctx2, map, G){
    // label of hovered tile or nearest site
    // draw the home marker/highlight for currently known sites
    const rows = map.grid;
    for(let y=0;y<rows.length;y++){ for(let x=0;x<rows[0].length;x++){
      const c = rows[y][x];
      if(c>='A'&&c<='Z'){
        const site = (map.sites && map.sites[c]) || {};
        if(site.home){ ctx2.fillStyle = 'rgba(227,181,74,0.25)'; ctx2.beginPath(); ctx2.arc((x+0.5)*TILE,(y+0.5)*TILE,TILE*0.5,0,Math.PI*2); ctx2.fill(); }
      }
    }}
  }

  function drawOverlay(ctx2, W, H, G){
    const night = isNight(G.time);
    ctx2.strokeStyle = 'rgba(227,181,74,0.6)'; ctx2.lineWidth = 2; ctx2.strokeRect(6,6,W-12,H-12);
    ctx2.fillStyle = 'rgba(227,181,74,0.95)'; ctx2.font = 'bold 16px Georgia'; ctx2.textAlign = 'left';
    ctx2.fillText('N', 18, 30); ctx2.fillText(night?'Night':'Day', W - 90, 30);
    const locName = window.MAPS[G.map] ? window.MAPS[G.map].name : '';
    ctx2.textAlign = 'center'; ctx2.fillStyle = 'rgba(233,226,207,0.9)'; ctx2.font = '15px Georgia';
    ctx2.fillText(locName, W/2, 26);
  }

  function canStepTo(map, x, y, G){
    if(!map) return {ok:false, reason:'No map'};
    const c = cellChar(map, x, y);
    if(IMPASSABLE.has(c)) return {ok:false, reason:'Blocked — impassable'};
    return {ok:true, cell:c};
  }
  function costFor(c){
    if(c>='A'&&c<='Z') return {cost:1, site:c};
    const t = TERRAIN[c]; return {cost: t ? t.cost : 1};
  }
  function stepCost(map, x, y, diag, march){
    const c = cellChar(map, x, y);
    if(!passable(c)) return {ok:false, reason:'Blocked'};
    let cost = costFor(c).cost;
    if(diag) cost *= 1.4;
    if(march >= 600) cost *= 1.5;
    let slowMV = 12; // conservative; caller passes actual
    return {ok:true, cost};
  }
  function moveStep(dx, dy, diag){
    const G = window.GAME && window.GAME.G;
    if(!G || !window.GAME.X) return;
    const map = window.MAPS[G.map];
    const nx = G.x + dx, ny = G.y + dy;
    if(!map) return;
    if(!passable(cellChar(map,nx,ny))){ window.UI && UI.log('Blocked.','l-muted'); return; }
    const slowMV = (function(){ let m = 99; for(const id of G.party||[]){ const ch = G.roster.find(c=>c.id===id); if(ch&&!ch.dead&&!ch.lost){ const mv = window.RULES.RACES[ch.race]?window.RULES.RACES[ch.race].mv:12; if(mv < m) m = mv; } } return m===99?12:m; })();
    const cost = costFor(cellChar(map,nx,ny)).cost;
    const diagon = diag?1.4:1;
    const marchCost = costFor(cellChar(map,nx,ny)).cost * diagon * (G.march>=600?1.5:1);
    const minutes = Math.round(600/(2*slowMV) * marchCost);
    G.time += minutes; G.march += minutes;
    G.x = nx; G.y = ny;
    window.GAME.buildRuntime && window.GAME.buildRuntime();
    window.UI && UI.log('Step: '+minutes+' min ('+(cellChar(map,nx,ny)>='A'&&cellChar(map,nx,ny)<='Z'?'site':'road')+')','l-muted');
    // encounter roll
    if(!(cellChar(map,nx,ny)>='A'&&cellChar(map,nx,ny)<='Z')){
      const t = TERRAIN[cellChar(map,nx,ny)];
      const base = t ? t.enc : 0.05;
      const night = isNight(G.time);
      const prob = 1 - Math.pow(1 - base * (map.encRate||1) * (night?1.5:1), minutes/60);
      if(Math.random() < prob){ triggerWildEncounter(map, G); }
    }
    // site
    const c = cellChar(map,nx,ny);
    if(c>='A'&&c<='Z'){ visitSite(map, c); }
    render();
    window.GAME.updateHUD && window.GAME.updateHUD();
  }

  function triggerWildEncounter(map, G){
    // simple hostile encounter from terrain-weighted table
    const c = cellChar(map, G.x, G.y);
    const tier = ['bandit','wolf','goblin','bear','prowler'];
    const pick = tier[Math.floor(Math.random()*tier.length)];
    const mons = [[pick, '1d3']];
    if(window.UI) UI.log('Something moves in the brush!','l-bad');
    setTimeout(()=>{
      if(window.COMBAT){
        setTimeout(()=>{ window.COMBAT.start({map, def:map, mons, party:window.GAME.partyAlive(), title:'Wilderness', goldRoll:'2d4'}).then(result=>{
          if(result.result==='win'){ G.gold = (G.gold||0) + result.gold; if(result.items&&result.items.length){ const first = window.GAME.partyAlive()[0]; if(first){ first.inv=first.inv||[]; result.items.forEach(i=>first.inv.push(i)); } } if(window.JOURNAL) JOURNAL.note(G,'Wilderness encounter'); }
          window.GAME.buildRuntime && window.GAME.buildRuntime();
          window.OVERLAND.render();
          window.GAME.updateHUD && window.GAME.updateHUD();
        }); }, 800);
      }
    }, 100);
  }

  function visitSite(map, ch){
    const site = map.sites && map.sites[ch]; if(!site) return;
    if(site.enter){ // enter that map
      const dest = window.MAPS[site.enter]; if(!dest) return;
      const G = window.GAME.G;
      G.map = site.enter; G.x = dest.start.x; G.y = dest.start.y; G.dir = 0;
      window.GAME.buildRuntime && window.GAME.buildRuntime();
      if(window.GAME.setActiveView) window.GAME.setActiveView('3d');
      window.GAME.updateHUD && window.GAME.updateHUD();
      if(window.VIEW3D){ window.VIEW3D.init(document.getElementById('view3d')); window.VIEW3D.render({x:window.GAME.X.posX, y:window.GAME.X.posY, angle:window.GAME.X.angle, sprites:window.GAME.X.sprites}); }
      if(window.UI) UI.log('— ' + dest.name + ' —', 'l-head');
      return;
    }
    if(site.fight){
      const party = window.GAME.partyAlive();
      if(window.COMBAT){
        window.GAME.setActiveView && window.GAME.setActiveView('combat');
        setTimeout(()=>{ window.COMBAT.start({map, def:map, mons:site.fight.mons, party, title:site.name, goldRoll:'2d6'}).then(result=>{ window.GAME.setActiveView && window.GAME.setActiveView('over'); if(result.result==='win'){ G_push(site); } window.OVERLAND.render(); window.GAME.updateHUD && window.GAME.updateHUD(); }); }, 400);
      }
      function G_push(site){ const G = window.GAME.G; G.gold = (G.gold||0) + 0; if(site.text){ if(window.UI) UI.log(site.text,'l-gold'); } if(window.JOURNAL) JOURNAL.note(G, site.name); }
      return;
    }
    if(site.cache){
      const G = window.GAME.G;
      const g = 1; // deterministic 1d4
      G.gold = (G.gold||0) + g; if(window.UI) UI.log(site.name+': found supplies.','l-gold');
      return;
    }
    if(site.heal){ const G = window.GAME.G; for(const id of G.party||[]){ const ch2 = G.roster.find(c=>c.id===id); if(ch2) ch2.hp = ch2.maxhp; } if(window.UI) UI.log(site.name+': the party is healed.','l-good'); return; }
    if(site.safe){ // safe camp offer
      if(window.UI) UI.modal({title:site.name, body:(b)=>{ b.innerHTML = '<p>'+(site.text||'A safe place.')+'</p>'; }, buttons:[{label:'Camp here',class:'btn btn-gold',onClick:()=>{ if(window.GAME.openCamp) window.GAME.openCamp(); else closeModalLocal(); }},{label:'Continue',class:'btn',onClick:()=>{ closeModalLocal(); }}]});
      return;
    }
    if(site.text){ if(window.UI) UI.log(site.text,'l-gold'); if(window.JOURNAL) JOURNAL.note(window.GAME.G, site.text); }
  }
  function closeModalLocal(){ window.UI && window.UI.closeTop && window.UI.closeTop(); }
  function GAME_active_view(k){ if(window.GAME && window.GAME.init) { /* handled in travelGate */ } }

  function handleClick(e, units){
    // click on landscape to step toward point — one step per click
    const G = window.GAME && window.GAME.G; if(!G || !cv) return;
    const r = cv.getBoundingClientRect();
    const sx = (e.clientX - r.left) / r.width * cv.width;
    const sy = (e.clientY - r.top) / r.height * cv.height;
    const map = window.MAPS[G.map]; if(!map) return;
    const camX = (G.x+0.5)*TILE, camY = (G.y+0.5)*TILE;
    const worldX = sx - cv.width/2 + camX, worldY = sy - cv.height/2 + camY;
    const tx = Math.floor(worldX / TILE), ty = Math.floor(worldY / TILE);
    const dx = tx - G.x, dy = ty - G.y;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    // move toward the clicked tile (one step toward it)
    const stepX = dx === 0 ? 0 : Math.sign(dx);
    const stepY = dy === 0 ? 0 : Math.sign(dy);
    const diag = stepX!==0 && stepY!==0;
    if(!stepX && !stepY) return;
    moveStep(stepX, stepY, diag);
  }

  function bindInput(){
    if(cv) cv.addEventListener('click', handleClick);
  }

  return {init, bindInput, render, moveStep, isActive:()=>{ const G = window.GAME && window.GAME.G; if(!G) return false; const m = window.MAPS[G.map]; return m && m.overland; }, handleClick};
})();
