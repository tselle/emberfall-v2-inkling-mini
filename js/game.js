/* game.js — campaign state, exploration runtime, save/load, title screens, bootstrap */
window.GAME = (function(){
  const R = () => window.RULES;
  const MAPS = () => window.MAPS;
  const MODULES = () => window.MODULES;
  const DATA = () => window.DATA;

  let G = null;           // persistent state
  let X = null;           // transient exploration runtime
  const DIRS = [[0,-1],[1,0],[0,1],[-1,0]];
  let inputHeld = null;
  let animating = false, pendingMove = null;
  const SAVE_PREFIX = 'emberfall.save';

  // ---------- screens ----------
  function showScreen(id){
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    const el = document.getElementById(id); if(el) el.classList.add('active');
    const stage = document.getElementById('stage'); if(stage) stage.style.display = (id==='game')?'block':'none';
  }
  function setActiveView(kind){ window.GAME_VIEW = kind; // '3d' | 'over' | 'combat'
    const v3 = document.getElementById('view3d'), oc = document.getElementById('overCanvas'), cc = document.getElementById('combatCanvas');
    if(v3) v3.style.display = kind==='3d'?'block':'none';
    if(oc) oc.style.display = kind==='over'?'block':'none';
    if(cc) cc.style.display = kind==='combat'?'block':'none';
  }

  // ---------- persistence ----------
  function saveState(slot){
    try {
      const key = SAVE_PREFIX + '.' + slot;
      const save = JSON.parse(JSON.stringify(G));
      save.meta = Object.assign({}, G.meta||{}, {ts:Date.now(), saved:new Date().toLocaleString()});
      localStorage.setItem(key, JSON.stringify(save));
      if(slot !== 'auto'){}
      return true;
    } catch(e){ console.warn('save failed', e); return false; }
  }
  function autosave(){ if(!G) return; try { saveState('auto'); } catch(e){} }
  function readSave(slot){
    try { const raw = localStorage.getItem(SAVE_PREFIX+'.'+slot); if(!raw) return null; const s = JSON.parse(raw); return s; } catch(e){ return null; }
  }
  function allSaves(){
    const out = [];
    for(const s of ['auto','1','2','3']){ const sv = readSave(s); if(sv) out.push({slot:s, meta:sv.meta||{}, data:sv}); }
    return out;
  }
  function newestSave(){
    const saves = allSaves(); if(!saves.length) return null;
    return saves.sort((a,b)=>(b.meta.ts||0)-(a.meta.ts||0))[0];
  }
  function saveSlots(){
    const saves = allSaves();
    const btn = document.getElementById('btnContinue'); const btn2 = document.getElementById('btnLoad');
    if(btn) btn.disabled = !saves.length;
    if(btn2) btn2.disabled = !saves.length;
    const status = document.getElementById('titleStatus');
    if(status){ const n = newestSave(); status.textContent = n?('Continue: '+(n.data.meta&&n.data.meta.where?('Day '+Math.floor((n.data.time||0)/1440+1)+' · '+n.data.meta.where):'—')):'No saved games.'; }
  }
  function loadFrom(slot){
    const sv = readSave(slot); if(!sv) return false;
    const data = JSON.parse(JSON.stringify(sv));
    return startGame(data);
  }
  function startGame(data){
    G = data;
    // heal state integrity
    for(const ch of G.roster||[]){ if(ch.maxhp===undefined) ch.maxhp = 5; if(ch.hp===undefined) ch.hp = ch.maxhp; }
    buildRuntime();
    showScreen('game');
    updateHUD();
    render3D();
    setActiveView('3d');
    UI.log('Welcome back.', 'l-good');
    if(G.module && window.JOURNAL){ JOURNAL.note(G, 'Continued: ' + (window.MODULES[G.module]?window.MODULES[G.module].name:'')); }
    return true;
  }

  // ---------- campaign / assembly ----------
  function showCampaign(){
    showScreen('campaign');
    const tabs = document.getElementById('campaignTabs'); tabs.innerHTML='';
    const scroll = document.getElementById('campaignCards');
    const sagaMods = (window.SAGA_ORDER || []).map(id=>window.MODULES[id]);
    const genMods = Object.values(window.MODULES).filter(m=>m.id && m.id.startsWith('adv'));
    const bands = [1,2,3,4,5];
    const all = [...sagaMods, ...genMods];
    const tabsWrap = el('div','tabs'); tabsWrap.style.display='flex'; tabsWrap.style.gap='6px'; tabsWrap.style.flexWrap='wrap';
    const tabsSpec = [{key:'saga',label:'Saga'}, ...bands.map(b=>({key:'band'+b, label:'Band '+b}))];
    let selTab = 'saga';
    function renderTab(key){
      tabsWrap.innerHTML='';
      tabsSpec.forEach(t=>{ const btn = el('button','tab'+(t.key===key?' active':''), t.label); btn.onclick = ()=>{ selTab=t.key; renderTab(t.key); }; tabsWrap.appendChild(btn); });
      scroll.innerHTML='';
      const list = key==='saga' ? sagaMods : genMods.filter(m=>Number(m.id.split('_')[0].slice(3))===parseInt(key.replace('band','')) || (m.id.startsWith('adv') && key==='band'+(m.id.split('_')[0].slice(3))));
      const finalList = key==='saga' ? sagaMods : genMods.filter(m=>m.id.startsWith('adv'+(key.replace('band',''))+'_'));
      for(const m of finalList){
        const card = el('div','card');
        const diff = m.diff || m.difficulty || 1;
        const diffName = ['Trivial','Easy','Standard','Hard','Deadly'][Math.min(4, Math.max(0, diff-1))];
        const isDone = G && G.done && G.done.indexOf(m.id||m.code)>=0;
        card.innerHTML = `<div class="code">${m.code||m.id}</div><h3>${m.name}</h3>
          <div class="meta">Levels ${m.levels[0]}–${m.levels[1]} · ${diffName} <span class="pips-diff">${'●'.repeat(Math.min(4,diff))}${'○'.repeat(Math.max(0,4-Math.min(4,diff)))}</span></div>
          <div class="meta small">${m.size||'medium'} · ${m.length||'—'} · ${m.maps?m.maps.length:0} maps · ${(m.quests||[]).length} commissions</div>
          <div class="blurb">${m.blurb||''}</div>
          ${isDone?'<div class="done">✓ Completed</div>':''}`;
        card.onclick = () => selectModule(m, card);
        scroll.appendChild(card);
      }
      const assemble = document.getElementById('btnAssemble');
      updateAssembleBtn(finalList[0]);
    }
    tabs.appendChild(tabsWrap);
    renderTab(selTab);
  }
  let selectedModule = null;
  function selectModule(m, card){
    selectedModule = m;
    document.querySelectorAll('#campaignCards .card').forEach(c=>c.classList.remove('sel'));
    card && card.classList.add('sel');
    const btn = document.getElementById('btnAssemble'); if(btn) btn.disabled = !m;
  }
  function updateAssembleBtn(m){ const btn = document.getElementById('btnAssemble'); if(btn) btn.disabled = !m; }

  function showAssembly(){
    if(!selectedModule) return;
    showScreen('assembly');
    renderRoster();
  }
  function rosterChips(list){
    return list.map(ch=>`<div class="hero-row"><canvas width="46" height="56"></canvas><div class="hinfo"><div class="hname">${ch.name}</div><div class="hsub">${ch.cls} · L${ch.lvl} · ${ch.race}</div></div></div>`).join('');
  }
  function renderRoster(){
    const waiting = document.getElementById('waitingRoster'); const party = document.getElementById('partyList');
    if(!waiting || !party) return;
    // fresh waiting roster (if no G or no party)
    const rosterList = (G && G.roster && G.roster.length) ? G.roster : window.DATA.pregens();
    const partySet = new Set((G && G.party) || []);
    const waitingIds = rosterList.filter(p=>!partySet.has(p.id));
    const partyList = rosterList.filter(p=>partySet.has(p.id));
    waiting.innerHTML = waitingIds.map(ch=>{
      return `<div class="hero-row"><canvas data-char="${ch.id}" width="46" height="56"></canvas><div class="hinfo"><div class="hname">${ch.name}</div><div class="hsub">${ch.cls} · L${ch.lvl} · ${({human:'Human',dwarf:'Dwarf',elf:'Elf',gnome:'Gnome',half_elf:'Half-Elf',halfling:'Halfling'})[ch.race]||ch.race}</div></div><button class="btn btn-small" data-add="${ch.id}">Add</button></div>`;
    }).join('');
    party.innerHTML = partyList.map(ch=>{
      return `<div class="hero-row"><canvas data-char="${ch.id}" width="46" height="56"></canvas><div class="hinfo"><div class="hname">${ch.name}</div><div class="hsub">${ch.cls} · L${ch.lvl} · ${({human:'Human',dwarf:'Dwarf',elf:'Elf',gnome:'Gnome',half_elf:'Half-Elf',halfling:'Halfling'})[ch.race]||ch.race}</div></div><button class="btn btn-small" data-remove="${ch.id}">Remove</button></div>`;
    }).join('');
    // portraits via canvas
    document.querySelectorAll('#waitingRoster canvas, #partyList canvas').forEach(cv=>{
      const id = cv.dataset.char;
      const ch = rosterList.find(p=>p.id===id) || window.DATA.pregens().find(p=>p.id===id);
      if(ch && window.FIGURES){ const ctx = cv.getContext('2d'); window.FIGURES.portraitChar(ctx, ch, 46, 56); }
    });
    waiting.querySelectorAll('[data-add]').forEach(b=>b.onclick = ()=>{ addToParty(b.dataset.add); });
    party.querySelectorAll('[data-remove]').forEach(b=>b.onclick = ()=>{ removeFromParty(b.dataset.remove); });
    document.getElementById('assemblyFunds').textContent = 'Purse: ' + ((G && G.gold)||40) + ' gp';
    const begin = document.getElementById('btnBegin');
    begin.disabled = !(G && G.party && G.party.length);
  }
  function addToParty(id){
    if(!G) return;
    if(G.party.length>=6){ alert('Party is full.'); return; }
    if(!G.party.includes(id)) G.party.push(id);
    renderRoster();
  }
  function removeFromParty(id){
    if(!G) return;
    G.party = G.party.filter(x=>x!==id);
    renderRoster();
  }
  function ensureGameRoster(pregensIds){
    if(!G){ G = {roster:window.DATA.pregens().map(c=>Object.assign({},c)), party:[], gold:40, module:(selectedModule && (selectedModule.id||selectedModule.code))||'thornwick', done:[], won:false, flags:{}, quests:{}, mods:{}, seen:{}, ground:{}, journal:[], bestiary:{}, meta:{leader:'', where:'', when:'', saved:'', ts:Date.now(), mod:'', lvl:1}}; }
  }

  function beginAdventure(){
    if(!G || !G.party.length){ alert('Select a party first.'); return; }
    const mod = selectedModule;
    const hubMap = MAPS()[mod.hub];
    if(!hubMap){ alert('Adventure map missing.'); return; }
    G.module = mod.id||mod.code;
    G.map = mod.hub; G.x = hubMap.start.x; G.y = hubMap.start.y; G.dir = hubMap.start.dir||0;
    G.time = 8*60; G.march = 0;
    G.gold = G.money0!==undefined?G.money0:mod.gold;
    buildRuntime();
    showScreen('game');
    setActiveView('3d');
    updateHUD();
    render3D();
    UI.log('◆ ' + (mod.name), 'l-head'); UI.log(mod.intro||'', 'l-gold');
    if(window.JOURNAL) JOURNAL.note(G, mod.intro||('Arrived: '+(mod.name)));
    autosave();
    // close the intro modal after one tick, then render fresh
    setTimeout(()=>{ render3D(); }, 350);
    // intro modal
    UI.modal({title:mod.name, body:(b)=>{ b.innerHTML = `<p style="font-style:italic;">${mod.intro||''}</p><p style="margin-top:12px;color:var(--muted)">${mod.hint||''}</p>`; }, buttons:[{label:'Enter',class:'btn btn-gold',onClick:()=>{}}]});
  }

  // ---------- runtime ----------
  function buildRuntime(){
    const map = MAPS()[G.map];
    X = {
      map, mods:G.mods[G.map]||{}, seen:G.seen[G.map] || new Set(),
      sprites:[], sprites3D:null,
      angle:(G.dir||0)*Math.PI/2 - Math.PI/2, // adjust so dir 0 = north
      targetAngle:(G.dir||0)*Math.PI/2 - Math.PI/2,
      busy:false,
      posX:G.x, posY:G.y // interpolated
    };
    X.angle = (G.dir||0)*Math.PI/2 - Math.PI/2;
    X.targetAngle = X.angle;
    // reveal
    revealSquares();
    // mods applied via cellChar in view3d: we pass mods to prepare
    if(window.VIEW3D){ VIEW3D.prepare(map, X.mods); }
    buildSprites();
    drawHUDAhead();
  }

  function revealSquares(){
    const map = X.map; const rows = map.grid;
    const cx = G.x, cy = G.y;
    const dir = G.dir||0;
    const d = DIRS[dir];
    // 3x3 around party
    for(let dy=-1;dy<=1;dy++){ for(let dx=-1;dx<=1;dx++){ const nx=cx+dx, ny=cy+dy; if(nx>=0&&ny>=0&&nx<rows[0].length&&ny<rows.length) addSeen(nx,ny); } }
    // ahead up to 7
    for(let i=1;i<=7;i++){ const nx = cx+d[0]*i, ny = cy+d[1]*i; if(nx<0||ny<0||nx>=rows[0].length||ny>=rows.length) break; addSeen(nx,ny); if(isOpaqueCell(nx,ny)) break; }
  }
  function addSeen(x,y){ if(!X.seen[x+','+y]){ X.seen[x+','+y] = 1; } }
  function isOpaqueCell(x,y){ const c = cellChar(x,y); return ['#','H','B','D','L','S','G'].includes(c); }
  function cellChar(x,y){ if(x<0||y<0) return '#'; const rows = X.map.grid; if(x>=rows[0].length||y>=rows.length) return '#'; const key = x+','+y; if(X.mods && X.mods[key]) return X.mods[key]; return rows[y][x]; }

  function buildSprites(){
    // monsters visible bands
    X.sprites = [];
    const map = X.map; const mods = X.mods;
    // trees / fountains / stairs
    for(let y=0;y<map.grid.length;y++){ for(let x=0;x<map.grid[y].length;x++){
      const c = cellChar(x,y);
      if(c==='T') X.sprites.push({kind:'tree', x:x+0.5, y:y+0.5, hsize:1.6, wsize:1});
      else if(c==='F') X.sprites.push({kind:'fountain', x:x+0.5, y:y+0.5, hsize:0.9, wsize:1.2});
      else if(c==='>'||c==='<') X.sprites.push({kind:'stairs', x:x+0.5, y:y+0.5, hsize:1, wsize:1.1, down:c==='>'});
    }}
    // watch bands
    const bands = (window.WATCH?WATCH.bands(map, mods, G.flags):[]);
    bands.forEach(b=>{ if(b.seen || true) X.sprites.push({kind:'monster', x:b.x+0.5, y:b.y+0.5, hsize:1.1, wsize:0.8, fig:()=>{ const ev = map.ev && map.ev[b.letter]; const monId = ev && ev.enc && ev.enc.mons && ev.enc.mons[0] && ev.enc.mons[0][0]; const m = monId && DATA().MONSTERS[monId]; return m ? window.FIGURES.figForMonster(m) : {}; }, band:b}); });
    // chests
    if(map.ev){ for(const letter in map.ev){ const ev = map.ev[letter]; if(ev.chest){ for(let y=0;y<map.grid.length;y++){ for(let x=0;x<map.grid[y].length;x++){ if(map.grid[y][x]===letter){ const key = G.map+':'+letter; if(G.flags[key]) continue; X.sprites.push({kind:'chest', x:x+0.5, y:y+0.5, hsize:0.6, wsize:0.7, chest:letter}); } } } } } }
    // ground loot in this map
    if(G.ground && G.ground[G.map]){ for(const key in G.ground[G.map]){ const [gx,gy] = key.split(',').map(Number); if(gx===G.x&&gy===G.y){} X.sprites.push({kind:'floor', x:gx+0.5, y:gy+0.5, hsize:0.35, wsize:0.5, ground:key}); } }
    if(X.seen){ X.sprites = X.sprites.filter(s=>true); }
  }

  function drawHUDAhead(){
    const a = document.getElementById('hudAhead'); if(!a) return;
    const d = DIRS[G.dir||0];
    const nx = G.x + d[0], ny = G.y + d[1];
    const c = cellChar(nx, ny);
    if(c==='#'||c==='H'||c==='B') a.textContent = 'Wall ahead';
    else if(c==='T'||c==='F') a.textContent = 'Obstacle ahead';
    else if(c==='>'||c==='<') a.textContent = 'Stairs ahead';
    else if(c==='G') a.textContent = 'Gate ahead — press Enter';
    else if(c==='L') a.textContent = 'Locked door ahead — Bump to open';
    else if(c==='S') a.textContent = 'Possible secret — Search';
    else if(c>='1'&&c<='9') a.textContent = 'Service door ahead — Bump to enter';
    else if(c>='a'&&c<='z'){ const ev = X.map.ev[c]; a.textContent = ev ? (ev.text||'Something ahead') : 'Something ahead'; }
    else a.textContent = 'Clear';
  }

  // ---------- rendering ----------
  let lastFrame = 0;
  function render3D(){
    const cv = document.getElementById('view3d'); if(!cv) return;
    if(window.VIEW3D && X){
      VIEW3D.init(cv);
      const state = {x:X.posX, y:X.posY, angle:X.angle, sprites:X.sprites};
      try { VIEW3D.render(state); } catch(e){ console.warn('render err', e); }
      try {
        const foeMarks = [];
        const bands = (window.WATCH?WATCH.bands(X.map, X.mods, G.flags, G.map):[]);
        for(const b of bands){ if(b.letter && b.letter!=='&') foeMarks.push({x:b.x,y:b.y}); }
        VIEW3D.minimap(X.map, X.mods, X.seen, X.posX, X.posY, G.dir||0, foeMarks, G.ground ? (G.ground[G.map]||{}) : {});
      } catch(e){ /* minimap best-effort */ }
    }
  }

  // ---------- movement ----------
  function animateStep(nx, ny, dir){
    animating = true;
    // interpolate
    const startX = G.x, startY = G.y;
    const cv = document.getElementById('view3d');
    const dur = 170;
    const t0 = performance.now();
    function frame(t){
      const k = Math.min(1, (t - t0)/dur);
      const ease = k < 0.5 ? 2*k*k : 1 - Math.pow(-2*k+2, 2)/2;
      X.posX = startX + (nx-startX)*ease; X.posY = startY + (ny-startY)*ease;
      render3D();
      if(k < 1){ requestAnimationFrame(frame); }
      else { animating = false; finishStep(nx, ny, dir); }
    }
    requestAnimationFrame(frame);
  }
  function finishStep(nx, ny, dir){
    G.x = nx; G.y = ny;
    G.time += 1; G.march += 1;
    buildRuntime();
    revealSquares();
    buildSprites();
    drawHUDAhead();
    updateHUD();
    render3D();
    // arrival checks
    arrivalSequence();
  }

  function arrivalSequence(){
    // elven passive discovery
    const party = partyAlive();
    const elf = party.find(ch=>ch.race==='elf'||ch.race==='half_elf'||ch.race==='half');
    if(elf){ for(let dx=-1;dx<=1;dx++){ for(let dy=-1;dy<=1;dy++){ const nx=G.x+dx, ny=G.y+dy; const c=cellChar(nx,ny); if(c==='S' && Math.random()<0.33){ log('Elf notices a secret door.','l-gold'); discoverSecret(nx, ny); return; } } } }
    // stairs arrival already handled in step; gate handled; traps:
    checkTrapAt();
  }

  function checkTrapAt(){
    const t = (X.map.traps||[]).find(t=>t.x===G.x&&t.y===G.y);
    if(!t) return;
    const key = G.map+':trap:'+G.x+','+G.y;
    if(G.flags[key]) return;
    if(!trapSeen(t)){
      // anyone spot, thief detect/disarm
      const thief = partyAlive().find(ch=>ch.cls==='T');
      if(thief && Math.random() < thiefTrapSkill(thief)/100){
        log('Thief disarms the trap.', 'l-good');
        G.flags[key] = 'off'; render3D(); return;
      }
      // nobody did: trap springs
      const dmg = rollCountD(t.dmg || '1d6');
      log('Trap springs! ' + dmg + ' damage.', 'l-bad');
      // apply to first conscious PC
      const target = partyAlive()[0];
      if(target){ target.hp -= dmg; refreshPortraits(); }
      G.flags[key] = 'sprung';
      updateHUD();
      render3D();
    }
  }
  function trapSeen(t){ const key = G.map+':trap:'+G.x+','+G.y; return G.flags[key]==='found'; }
  function thiefTrapSkill(thief){ return Math.min(95, R().thiefSkill(thief,'trap')); }
  function rollCountD(spec){ const m = /^(\d+)d(\d+)([+-]\d+)?$/.exec(spec||'1d6'); if(!m) return 1; let t=0; const n=parseInt(m[1]), d=parseInt(m[2]); for(let i=0;i<n;i++) t+=1+Math.floor(Math.random()*d); if(m[3]) t+=parseInt(m[3]); return t; }

  function openService(x,y,key){
    const loc = X.map.locs && X.map.locs[key]; if(!loc){ log('No service here.'); return; }
    const svc = loc.svc;
    if(svc==='inn') openInn();
    else if(svc==='shop') openShop(loc.name);
    else if(svc==='temple') openTemple();
    else if(svc==='hall') openHall(loc.name);
    else if(svc==='tavern') openTavern();
  }
  function openGate(x,y){
    // travel offer
    const exit = X.map.exit; if(!exit){ log('No way out.'); return; }
    UI.modal({title:'Gate', body:(b)=>{ b.innerHTML = '<p>Step out of the village?</p>'; }, buttons:[{label:'Travel',class:'btn btn-gold',onClick:()=>{ closeModal(); travelGate(exit); }},{label:'Stay',class:'btn',onClick:()=>{ closeModal(); }}]});
  }
  function travelGate(exit){
    G.map = exit.to; G.x = exit.tx; G.y = exit.ty; G.dir = exit.dir||0;
    G.time += 1; G.march += 1;
    buildRuntime();
    const isOver = window.MAPS[exit.to] && window.MAPS[exit.to].overland;
    setActiveView(isOver ? 'over' : '3d');
    updateHUD();
    if(isOver && window.OVERLAND){ OVERLAND.render(); }
    if(!isOver && window.VIEW3D) render3D();
    autosave();
  }

  function stairs(x, y, c){
    const cell = X.map.stairs && X.map.stairs.find(s=>s.x===x&&s.y===y); if(!cell){ log('No stairs here.'); return; }
    const dest = MAPS()[cell.down]; if(!dest) return;
    G.map = cell.down; G.x = cell.tx; G.y = cell.ty; G.dir = 0;
    G.time += 1;
    buildRuntime(); setActiveView('3d'); updateHUD();
    UI.log('— ' + (dest.name) + ' —', 'l-head');
    autosave();
  }
  function triggerEvent(x,y,c){
    const ev = X.map.ev && X.map.ev[c]; if(!ev) return;
    const key = G.map+':'+c;
    if(G.flags[key]){ if(c==='S') return; log('Already handled.','l-muted'); return; }
    if(ev.chest){ openChest(x,y,c,ev,key); return; }
    if(ev.enc){ challengeBand(x,y,c,ev,key); return; }
    if(ev.text && !ev.chest && !ev.enc){ log(ev.text,'l-gold'); G.flags[key]='seen'; updateHUD(); }
  }
  function challengeBand(x,y,c,ev,key){
    const mons = (ev.enc && ev.enc.mons) || [];
    if(!mons.length) return;
    const map = X.map;
    const title = 'The watch';
    setActiveView('combat');
    UI.log('◆ '+(ev.enc.text||'Encounter!'), 'l-head');
    window.COMBAT.start({map, def:map, mons, party:partyAlive(), title, goldRoll:(ev.enc && ev.enc.gold)||'1d4', eventItems:(ev.enc && ev.enc.items)||[]}).then(result=>{
      setActiveView('3d');
      if(result.result==='win'){
        UI.log('Encounter cleared! +'+result.xp+' xp, +'+result.gold+' gp.','l-good');
        applyVictory(result, ev);
        G.flags[key]='cleared';
      } else if(result.result==='lose'){
        UI.log('The party has fallen.','l-bad');
        showDefeat();
      } else {
        UI.log('The party flees.','l-muted');
      }
      buildRuntime(); updateHUD(); render3D(); setActiveView('3d');
      autosave();
    });
  }
  function applyVictory(result, ev){
    // XP to surviving party members
    const party = partyAlive();
    const per = Math.floor(result.xp / Math.max(1, party.length));
    party.forEach(ch=>{ ch.xp = (ch.xp||0) + per; });
    // level-ups from XP
    for(const ch of party){
      const need = R().xpNeeded(ch, (ch.lvl||1)+1);
      let leveled = false;
      while(need !== null && (ch.xp||0) >= need && (ch.lvl||1) < 20){
        ch.xp = (ch.xp||0) - need;
        if(window.CAMP) CAMP.levelUp(ch, ch.lvl+1);
        ch.layUsed = false;
        if(ch.cls==='M'||ch.cls==='C'||ch.cls==='P'){ if(window.CAMP) CAMP.autoPrep(ch); }
        leveled = true;
        const need2 = R().xpNeeded(ch, ch.lvl+1);
        if(need2 === null || (ch.xp||0) < need2) break;
        need = need2;
      }
      if(leveled){
        UI.log('◆ ' + ch.name + ' reaches level ' + ch.lvl + '!', 'l-gold');
        if(window.CAMP) CAMP.applyGrowthKit(ch);
        if(window.JOURNAL) JOURNAL.note(G, ch.name + ' leveled to ' + ch.lvl);
      }
    }
    const dead = party.filter(ch=>ch.dead);
    // gold
    G.gold = (G.gold||0) + result.gold;
    // items to first conscious carrier
    const first = party.find(ch=>!ch.dead && ch.hp>0);
    if(first && result.items && result.items.length){ first.inv = first.inv||[]; for(const it of result.items) first.inv.push(it); UI.log('Obtained: '+result.items.join(', '),'l-gold'); }
    // bestiary
    if(window.BESTIARY){ for(const m of result.killed||[]){ BESTIARY.record(G, m.id, 'slain'); } }
    // quest deed if any
    if(ev && ev.enc && ev.enc.deed){ recordDeed(ev.enc.deed); }
  }
  function recordDeed(deedId){
    G.flags = G.flags||{};
    G.flags['q:'+deedId] = true;
    // check commissions
    const mod = window.MODULES[G.module];
    if(mod && mod.quests){
      for(const q of mod.quests){ if(q.id===deedId){ JOURNAL.advance(G, q.id, 'ready'); UI.log('Deed done: '+q.name+' — report at the Hall.','l-gold'); } }
    }
  }
  function showDefeat(){
    UI.modal({title:'The party has fallen', body:(b)=>{ b.innerHTML = `<p>The darkness closes in.</p>`; }, buttons:[{label:'Load a Save',class:'btn btn-gold',onClick:()=>{ closeModal(); loadGamePicker(); }},{label:'Quit to Title',class:'btn',onClick:()=>{ closeModal(); quitToTitle(); }}]});
  }
  function loadGamePicker(){ showScreen('title'); updateTitleButtons(); }
  function quitToTitle(){ showScreen('title'); updateTitleButtons(); }

  function openChest(x,y,c,ev,key){
    const chest = ev.chest;
    UI.modal({title:'Chest', body:(b)=>{ b.innerHTML = `<p>${chest.text||'A chest.'}</p>`; }, buttons:[{label:'Open',class:'btn btn-gold',onClick:()=>{
      // trap
      if(chest.trap){ const dmg = rollCountD(chest.trap.dmg||'1d6'); log('Chest trap! '+dmg+' damage.','l-bad'); const first = partyAlive()[0]; if(first) first.hp -= dmg; }
      // gold
      const g = rollCountD(chest.gold||'1d4'); G.gold = (G.gold||0) + g;
      // items
      const items = chest.items||[];
      const first = partyAlive().find(ch=>!ch.dead && ch.hp>0);
      if(first){ first.inv = first.inv||[]; for(const it of items) first.inv.push(it); }
      // xp split per gp
      const xp = g;
      const party = partyAlive(); for(const ch of party) ch.xp = (ch.xp||0) + Math.floor(xp/party.length);
      G.flags[key] = 'looted';
      UI.log('Chest opened: +'+g+' gp, items: '+items.join(', '),'l-gold');
      autosave();
      closeModal(); buildRuntime(); updateHUD(); render3D();
    }},{label:'Leave',class:'btn',onClick:()=>{ closeModal(); }}]});
  }

  function tryOpenLock(x,y){
    const c = cellChar(x,y);
    UI.modal({title:'Locked Door', body:(b)=>{ b.innerHTML = `<p>The door is locked.</p>`; }, buttons:[
      {label:'Use Key',class:'btn',onClick:()=>{ if(findKey()){ unlockCell(x,y); closeModal(); } else { log('No matching key in the party.','l-bad'); } }},
      {label:'Pick',class:'btn',onClick:()=>{ pickLock(x,y); }},
      {label:'Force',class:'btn',onClick:()=>{ forceLock(x,y); }},
      {label:'Leave',class:'btn',onClick:()=>{ closeModal(); }}
    ]});
  }
  function findKey(){ return partyAlive().some(ch=>ch.inv && ch.inv.includes('cellar_key')); }
  function unlockCell(x,y){ X.mods[x+','+y] = 'D'; G.mods[G.map] = X.mods; unlockToast(); UI.log('Door unlocked.','l-good'); buildRuntime(); render3D(); }
  function unlockToast(){ UI.log('—','l-muted'); }
  function pickLock(x,y){
    const thief = partyAlive().filter(ch=>ch.cls==='T').sort((a,b)=>R().thiefSkill(b,'locks')-R().thiefSkill(a,'locks'))[0];
    if(!thief){ log('No thief to pick.','l-muted'); closeModal(); return; }
    const chance = R().thiefSkill(thief,'locks')/100;
    if(Math.random() < chance){ unlockCell(x,y); UI.log(thief.name+' picked the lock.','l-good'); }
    else { log('The lock resists.','l-bad'); closeModal(); }
  }
  function forceLock(x,y){
    const str = Math.max(...partyAlive().map(ch=>ch.str||10));
    if(Math.random() < str/20){ unlockCell(x,y); UI.log('The door is pried open.','l-good'); }
    else { log('The door holds firm.','l-bad'); closeModal(); }
  }
  function tryOpenSecret(x,y){ discoverSecret(x,y); }
  function discoverSecret(x,y){
    X.mods[x+','+y] = 'D'; G.mods[G.map] = X.mods;
    UI.log('Secret door discovered!','l-gold');
    buildRuntime(); render3D();
  }

  // ---------- camp ----------
  function openCamp(){
    const alive = partyAlive();
    UI.modal({title:'Rest', body:(b)=>{ b.innerHTML = `<p>Rest until healed? (8 hours)</p>`; }, buttons:[{label:'Rest',class:'btn btn-gold',onClick:()=>{ doFieldRest(); closeModal(); }},{label:'Cancel',class:'btn',onClick:()=>{ closeModal(); }}]});
  }
  function doFieldRest(){
    UI.log('The party rests.','l-head');
    const alive = partyAlive();
    for(const ch of alive){ ch.hp = Math.min(ch.maxhp, ch.hp + 1 + (ch.fx&&ch.fx.regen?10:0)); ch.layUsed = false; }
    G.march = 0; G.time += 480;
    // restore spells
    for(const ch of alive){ if(ch.mem && ch.prep) ch.mem = Object.assign({}, ch.prep); }
    UI.log('The party recovers a little.','l-good');
    autosave(); updateHUD(); buildRuntime(); render3D();
  }

  // ---------- services ----------
  function openShop(name){
    const mod = window.MODULES[G.module];
    const band = mod ? Math.max(1, Math.min(5, Math.ceil((mod.lvl||1)/4))) : 1;
    const stock = (window.ADVENTURES?ADVENTURES.shopForBand(band):['long_sword','leather','shield','potion_heal']);
    const shopDef = {name:name||'Shop', stock};
    const buyer = partyAlive()[0]; if(!buyer) return;
    UI.shop(G, buyer, shopDef, null);
  }
  function openInn(){
    const cost = 1 * (G.party||[]).length;
    if(G.gold < cost){ log('Not enough gold for the inn.','l-bad'); return; }
    UI.modal({title:'Inn', body:(b)=>{ b.innerHTML = `<p>Cost: ${cost} gp per night. Wake at 07:00.</p>`; }, buttons:[{label:`Stay (${cost} gp)`,class:'btn btn-gold',onClick:()=>{
      G.gold -= cost; G.time = Math.floor(G.time/1440)*1440 + 7*60;
      for(const id of G.party||[]){ const ch = G.roster.find(c=>c.id===id); if(!ch) continue; if(ch.dead) continue; ch.hp = Math.min(ch.maxhp, ch.hp+3); ch.layUsed = false; }
      buildRuntime(); updateHUD(); render3D(); closeModal();
      UI.log('The party wakes at 07:00.','l-good');
    }},{label:'Leave',class:'btn',onClick:()=>{ closeModal(); }}]});
  }
  function openTemple(){
    UI.modal({title:'Temple', body:(b)=>{ b.innerHTML = `<p>Cure Light: 20 gp · Cure Serious: 60 gp · Neutralize Poison: 80 gp · Raise Dead: 400 gp</p>`; }, buttons:[{label:'Leave',class:'btn',onClick:()=>{ closeModal(); }}]});
  }
  function openHall(name){ UI.modal({title:name||'Hall', body:(b)=>{ b.innerHTML = '<p>The hall. Commissions and recruits handled here.</p>'; }, buttons:[{label:'Leave',class:'btn',onClick:()=>{ closeModal(); }}]}); }
  function openTavern(){ log('A round and a rumor: The road to the barrow is longer than it appears.','l-muted'); }

  // ---------- input ----------
  function bindInput(){
    document.addEventListener('keydown', e=>{
      if(isModalOpen()) { if(e.key==='Escape') closeModal(); return; }
      if(!G) return;
      if(window.COMBAT && window.COMBAT.isActive()){ return; } // combat handles
      const key = e.key.toLowerCase();
      const isWilds = isWildsMap();
      if(isWilds){
        if(key==='w'||key==='arrowup'){ e.preventDefault(); overlandMove(0,-1); }
        else if(key==='s'||key==='arrowdown'){ e.preventDefault(); overlandMove(0,1); }
        else if(key==='a'||key==='arrowleft'){ e.preventDefault(); overlandMove(-1,0); }
        else if(key==='d'||key==='arrowright'){ e.preventDefault(); overlandMove(1,0); }
        else if(key==='q'){ e.preventDefault(); overlandMove(-1,-1); }
        else if(key==='e'){ e.preventDefault(); overlandMove(1,-1); }
        else if(key==='z'){ e.preventDefault(); overlandMove(-1,1); }
        else if(key==='c'){ e.preventDefault(); overlandMove(1,1); }
        else if(key==='enter'||key===' '){ e.preventDefault(); overlandSite(); }
      } else {
        if(key==='w'||key==='arrowup'){ e.preventDefault(); moveCmd('fwd'); }
        else if(key==='s'||key==='arrowdown'){ e.preventDefault(); moveCmd('back'); }
        else if(key==='a'||key==='arrowleft'){ e.preventDefault(); moveCmd('turnL'); }
        else if(key==='d'||key==='arrowright'){ e.preventDefault(); moveCmd('turnR'); }
        else if(key==='q'||key==='e'){ e.preventDefault(); moveCmd(key==='q'?'strafeL':'strafeR'); }
      }
      if(key==='f'){ e.preventDefault(); searchCmd(); }
      else if(key==='r'){ e.preventDefault(); openCamp(); }
      else if(key==='p'){ toggleParty(); }
      else if(key==='m'){ toggleMap(); }
      else if(key==='j'){ toggleJournal(); }
      else if(key==='b'){ toggleBestiary(); }
      else if(key==='escape'){ openMenu(); }
      else if(key>='1'&&key<='6'){ openSheet(parseInt(key)-1); }
      else if(key==='enter'||key===' '){ e.preventDefault(); useDefault(); }
    });
  }
  function isWildsMap(){ if(!G) return false; const m = window.MAPS[G.map]; return !!(m && m.overland); }
  function overlandMove(dx, dy){ if(window.OVERLAND) OVERLAND.moveStep(dx, dy, dx!==0 && dy!==0); }
  function overlandSite(){ if(window.OVERLAND && window.OVERLAND.render) OVERLAND.render(); }
  function setActiveView(kind){ window.GAME_VIEW = kind; const v3=document.getElementById('view3d'), oc=document.getElementById('overCanvas'), cc=document.getElementById('combatCanvas'); if(v3) v3.style.display = kind==='3d'?'block':'none'; if(oc) oc.style.display = kind==='over'?'block':'none'; if(cc) cc.style.display = kind==='combat'?'block':'none'; buildCommandBar(); }
  function isModalOpen(){ return window.UI && window.UI.isModalOpen(); }
  function closeModal(){ window.UI && window.UI.closeTop(); }
  function moveCmd(dir){
    if(animating) return;
    if(dir==='fwd'){ step(G.dir||0); }
    else if(dir==='back'){ step(((G.dir||0)+2)%4, true); }
    else if(dir==='turnL'){ turn(((G.dir||0)+3)%4); }
    else if(dir==='turnR'){ turn(((G.dir||0)+1)%4); }
    else if(dir==='strafeL'){ const s = ((G.dir||0)+3)%4; step(s, true); }
    else if(dir==='strafeR'){ const s = ((G.dir||0)+1)%4; step(s, true); }
  }
  function turn(dir){
    G.dir = dir;
    buildRuntime(); render3D(); drawHUDAhead(); updateHUD();
  }
  function step(dir, silent){
    const d = DIRS[dir];
    const nx = G.x + d[0], ny = G.y + d[1];
    const c = cellChar(nx, ny);
    // stairs check first for gate/services/events
    if(c==='#'||c==='H'||c==='B'){ if(!silent) log('Blocked.','l-muted'); return; }
    if(c==='T'||c==='F'){ if(!silent) log('Blocked.','l-muted'); return; }
    if(c==='L'){ if(!silent) tryOpenLock(nx,ny); return; }
    if(/^[1-9]$/.test(c)){ if(!silent) openService(nx,ny,c); return; }
    if(c==='G'){ if(!silent) openGate(nx,ny); return; }
    if(c==='S'){ if(!silent) tryOpenSecret(nx,ny); return; }
    if(/^[a-z]$/.test(c)){ if(!silent) triggerEvent(nx,ny,c); return; }
    if(c==='>'||c==='<'){ if(!silent) stairs(nx,ny,c); return; }
    animateStep(nx, ny, dir);
  }
  function searchCmd(){
    log('Searching…');
    // check 4 neighbors for secrets
    const dx = [-1,0,1,0,-1,0,1,0]; const dy = [0,-1,0,1,0,0,0,0];
    const attacks = [[0,1],[0,-1],[1,0],[-1,0]];
    for(const [ax,ay] of attacks){ const nx = G.x+ax, ny = G.y+ay; const c = cellChar(nx,ny); if(c==='S'){ discoverSecret(nx,ny); log('Secret door found!','l-gold'); return; } }
    log('Nothing.','l-muted');
  }
  function useDefault(){
    // enter/space: open gate? if adjacent service door, open it
    const d = DIRS[G.dir||0];
    const nx = G.x+d[0], ny = G.y+d[1];
    const c = cellChar(nx,ny);
    if(/^[1-9]$/.test(c)) openService(nx,ny,c);
    else if(c==='G') openGate(nx,ny);
    else if(c==='>'||c==='<') stairs(nx,ny,c);
    else step(G.dir||0);
  }
  function toggleParty(){ UI.toggleParty(); }
  function toggleMap(){ UI.modal({title:'Map', body:(b)=>{ b.innerHTML = '<p style="font-size:13px;">Full map — see legend in menu.</p>'; }, buttons:[{label:'Close',onClick:()=>{ closeModal(); }}]}); }
  function toggleJournal(){
    const rows = window.JOURNAL ? JOURNAL.derive(G).map(q=>'<p><b>'+(q.side?'Side':'Main')+'</b>: '+q.name+' — '+q.status+' <span class="small">('+q.goal+')</span></p>').join('') : '<p>No commissions.</p>';
    UI.modal({title:'Journal', body:(b)=>{ b.innerHTML = rows; }, buttons:[{label:'Close',onClick:()=>{ closeModal(); }}]});
  }
  function toggleBestiary(){
    const list = window.BESTIARY ? BESTIARY.list(G) : [];
    let rows = '<p class="small">No creatures seen yet.</p>';
    if(list.length){
      rows = list.map(e=>{ const m = DATA().MONSTERS[e.id]||{name:e.id,hd:'?',hp:'?',lore:''}; const stats = window.BESTIARY && BESTIARY.statsUnlocked(G,e.id); const statLine = stats ? ('HD '+m.hd+' · HP '+m.hp+' · AC '+m.ac+' · THAC0 '+m.thac0) : '? (not yet fought)'; return '<p><b>'+m.name+'</b> <span class="small">'+statLine+'</span>'+(stats&&m.lore?'<br><span class="small">'+m.lore+'</span>':'')+'</p>'; }).join('');
    }
    UI.modal({title:'Bestiary', body:(b)=>{ b.innerHTML = rows; }, buttons:[{label:'Close',onClick:()=>{ closeModal(); }}]});
  }
  function openSheet(i){ const id = G && G.party && G.party[i]; if(!id) return; const ch = G.roster.find(c=>c.id===id); if(ch) UI.sheet(G, ch, null); }
  function openMenu(){
    UI.modal({title:'Menu', body:(b)=>{ b.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;">
      <button class="btn" id="m_map">Map</button><button class="btn" id="m_j">Journal</button><button class="btn" id="m_b">Bestiary</button><button class="btn" id="m_save">Save</button><button class="btn" id="m_load">Load</button><button class="btn" id="m_help">How to Play</button><button class="btn" id="m_title">Quit to Title</button></div>`;
      b.querySelector('#m_map').onclick = ()=>{ closeModal(); toggleMap(); };
      b.querySelector('#m_j').onclick = ()=>{ closeModal(); toggleJournal(); };
      b.querySelector('#m_b').onclick = ()=>{ closeModal(); toggleBestiary(); };
      b.querySelector('#m_save').onclick = ()=>{ closeModal(); saveGamePicker(); };
      b.querySelector('#m_load').onclick = ()=>{ closeModal(); loadGamePicker(); };
      b.querySelector('#m_help').onclick = ()=>{ closeModal(); openHelp(); };
      b.querySelector('#m_title').onclick = ()=>{ closeModal(); quitToTitle(); };
    }, buttons:[{label:'Resume',class:'btn btn-gold',onClick:()=>{ closeModal(); }}]});
  }
  function saveGamePicker(){
    UI.modal({title:'Save', body:(b)=>{ b.innerHTML = `<p>Pick a slot:</p>`; }, buttons:[{label:'1',class:'btn',onClick:()=>saveSlot('1')},{label:'2',class:'btn',onClick:()=>saveSlot('2')},{label:'3',class:'btn',onClick:()=>saveSlot('3')},{label:'Close',class:'btn',onClick:()=>{ closeModal(); }}]});
  }
  function saveSlot(slot){ saveState(slot); UI.log('Saved to slot '+slot,'l-good'); for(const btn of document.querySelectorAll('#modalBody .btn')){ /* no-op */ } closeModal(); }
  function openHelp(){
    UI.modal({title:'How to Play', body:(b)=>{ b.innerHTML = `<p><b>Explore:</b> W/↑ forward · S/↓ back · A/D turn · Q/E strafe · F search · R camp · 1–6 sheets</p><p><b>Combat:</b> click tile to move, enemy to attack. C cast · T turn undead · H hide · Space end turn</p><p><b>Save:</b> M map · J journal · B bestiary · Esc menu</p><p>Combat uses turn-based tactical board. Victory may require training to improve.</p>`; }, buttons:[{label:'Close',class:'btn btn-gold',onClick:()=>{ closeModal(); }}]});
  }

  // ---------- helpers ----------
  function partyAlive(){ return (G.party||[]).map(id=>G.roster.find(c=>c.id===id)).filter(ch=>ch && !ch.dead && !ch.lost && ch.hp>0); }
  function refreshPortraits(){
    document.querySelectorAll('#partyList canvas, #waitingRoster canvas, #partyBody canvas').forEach(cv=>{
      const id = cv.dataset && cv.dataset.char; if(!id) return;
      const ch = (G && G.roster.find(c=>c.id===id)) || window.DATA.pregens().find(p=>p.id===id);
      if(ch && window.FIGURES){ const ctx = cv.getContext('2d'); ctx.clearRect(0,0,cv.width,cv.height); window.FIGURES.portraitChar(ctx, ch, cv.width, cv.height); }
    });
  }
  function updateHUD(){
    const loc = document.getElementById('hudLoc'); if(loc) loc.textContent = X && X.map ? X.map.name : (G.module||'');
    const clock = document.getElementById('hudClock'); if(clock) clock.textContent = 'Day '+(Math.floor(G.time/1440)+1)+' '+String(Math.floor((G.time%1440)/60)).padStart(2,'0')+':'+String(Math.floor(G.time%60)).padStart(2,'0');
    const gold = document.getElementById('hudGold'); if(gold) gold.textContent = (G.gold||0) + ' gp';
    const pips = document.getElementById('hudPips'); if(pips){ pips.innerHTML = (G.party||[]).map(id=>{ const ch = G.roster.find(c=>c.id===id); const f = ch?Math.max(0, ch.hp/Math.max(1,ch.maxhp)):0; const color = ch?ch.color||'#e3b54a':'#666'; return `<span class="pip" title="${ch?ch.name:''} HP ${ch?ch.hp+'/'+ch.maxhp:''}" style="background:${color};opacity:${0.35+f*0.65};"></span>`; }).join(''); }
    const ahead = document.getElementById('hudAhead'); // set by buildRuntime/drawHUDAhead
    UI.buildPartyDrawer(G, X);
  }
  function log(msg, cls){ if(window.UI) UI.log(msg, cls); }
  function el(tag, cls, html){ return window.UI ? UI.el(tag, cls, html) : document.createElement(tag); }

  // ---------- navpad ----------
  function navpadPress(dir){
    if(animating) return;
    if(isWildsMap()){ if(dir==='up') overlandMove(0,-1); else if(dir==='down') overlandMove(0,1); else if(dir==='left') overlandMove(-1,0); else if(dir==='right') overlandMove(1,0); else if(dir==='fwd') overlandMove(0,-1); return; }
    if(dir==='up') moveCmd('fwd');
    else if(dir==='down') moveCmd('back');
    else if(dir==='left') moveCmd('turnL');
    else if(dir==='right') moveCmd('turnR');
    else if(dir==='fwd') moveCmd('fwd');
  }

  function buildCommandBar(){
    const bar = document.getElementById('cmdbar'); if(!bar) return;
    bar.innerHTML = '';
    const cmds = isCombatView() ? [
      {label:'Auto', key:'Q', action:()=>{ document.dispatchEvent(new KeyboardEvent('keydown',{key:'q',bubbles:true})); }},
      {label:'Cast', key:'C', action:()=>{ document.dispatchEvent(new KeyboardEvent('keydown',{key:'c',bubbles:true})); }},
      {label:'Hide', key:'H', action:()=>{ document.dispatchEvent(new KeyboardEvent('keydown',{key:'h',bubbles:true})); }},
      {label:'End Turn', key:'Space', action:()=>{ document.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true})); }}
    ] : isWildsMap() ? [
      {label:'North', key:'W', action:()=>overlandMove(0,-1)},
      {label:'West', key:'A', action:()=>overlandMove(-1,0)},
      {label:'South', key:'S', action:()=>overlandMove(0,1)},
      {label:'East', key:'D', action:()=>overlandMove(1,0)},
      {label:'Camp', key:'R', action:()=>openCamp()},
      {label:'Search', key:'F', action:()=>searchCmd()}
    ] : [
      {label:'Forward', key:'↑', action:()=>moveCmd('fwd')},
      {label:'Back', key:'↓', action:()=>moveCmd('back')},
      {label:'Turn ◀', key:'A', action:()=>moveCmd('turnL')},
      {label:'Turn ▶', key:'D', action:()=>moveCmd('turnR')},
      {label:'Strafe ◀', key:'Q', action:()=>moveCmd('strafeL')},
      {label:'Strafe ▶', key:'E', action:()=>moveCmd('strafeR')},
      {label:'Search', key:'F', action:()=>searchCmd()},
      {label:'Camp', key:'R', action:()=>openCamp()},
      {label:'Sheet', key:'1-6', action:()=>openSheet(0)},
      {label:'Menu', key:'Esc', action:()=>openMenu()}
    ];
    for(const c of cmds){
      const b = el('button','cmd', `<span class="k">${c.key}</span> ${c.label}`);
      b.onclick = ()=>{ c.action(); };
      bar.appendChild(b);
    }
    bar.style.display = 'flex';
  }
  function isCombatView(){ return !!(window.COMBAT && window.COMBAT.isActive && window.COMBAT.isActive()); }

  function init(){
    bindInput();
    buildCommandBar();
    // title buttons
    document.getElementById('btnNew').onclick = ()=>{ ensureGameRoster(); showCampaign(); };
    document.getElementById('btnContinue').onclick = ()=>{ const n = newestSave(); if(n) loadFrom(n.slot); };
    document.getElementById('btnLoad').onclick = ()=>{ showScreen('title'); loadGamePicker(); };
    document.getElementById('btnHelpTitle').onclick = ()=>{ openHelp(); };
    document.querySelectorAll('[data-to]').forEach(b=>b.onclick = ()=>{ const t=b.dataset.to; if(t==='title'){ showScreen('title'); updateTitleButtons(); } else if(t==='campaign'){ showCampaign(); } });
    document.getElementById('btnAssemble').onclick = ()=>showAssembly();
    document.getElementById('btnBegin').onclick = ()=>beginAdventure();
    document.getElementById('hudParty').onclick = ()=>UI.toggleParty();
    document.getElementById('partyClose').onclick = ()=>UI.toggleParty(false);
    document.getElementById('btnCreateHero').onclick = ()=>openCreateHero();
    document.getElementById('viewArrow').onclick = ()=>{ if(window.NAVPAD){ NAVPAD.set(({off:'right',right:'left',left:'both',both:'off'})[NAVPAD.get()]||'right'); } };
    updateTitleButtons();
    setActiveView('3d');
    const oc = document.getElementById('overCanvas'); if(oc && window.OVERLAND){ OVERLAND.init(oc); OVERLAND.bindInput && OVERLAND.bindInput(); }
  }
  function updateTitleButtons(){ saveSlots(); }
  // ---------- custom hero creation ----------
  function rollSixStats(){
    const R = window.RULES;
    const out = [];
    for(let i=0;i<6;i++) out.push(R.d4d6dropLow());
    return out;
  }
  function raceAllowedForClass(cls, race){
    const R = window.RULES;
    const limits = R.CLASS_RACE_LIMITS[cls]; if(!limits) return true;
    return !!limits[race];
  }
  function classMinsFor(cls){ const R = window.RULES; return (R.CLASSES[cls] && R.CLASSES[cls].mins) || {}; }
  function heroGold(cls){ const R = window.RULES; const g = R.CLASSES[cls] ? R.CLASSES[cls].gold : '1d4'; return R.goldRoll(g); }
  function starterGear(cls){
    // sensible starter loadout per class
    const gear = {
      F:{melee:'long_sword',armor:'chain',shield:'shield'},
      P:{melee:'broad_sword',armor:'chain',shield:'shield'},
      R:{melee:'long_sword',missile:'long_bow',armor:'studded_leather'},
      M:{melee:'staff',missile:'darts'},
      C:{melee:'mace',missile:'sling',armor:'chain',shield:'shield'},
      T:{melee:'short_sword',missile:'sling',armor:'leather'}
    };
    return gear[cls] || gear.F;
  }
  function openCreateHero(){
    const R = window.RULES;
    const st = {name:'', cls:'F', race:'human', stats:{str:0,dex:0,con:0,int:0,wis:0,cha:0}, rolls:null, selRoll:null, gold:0, stage:'name'};
    const STAT_LABELS = {str:'STR',dex:'DEX',con:'CON',int:'INT',wis:'WIS',cha:'CHA'};
    let bodyEl = null;
    function render(){
      const b = bodyEl; if(!b) return;
      b.innerHTML = '';
      const foot = document.querySelector('#modal .m-foot');
      if(foot){ const btns = foot.querySelectorAll('button');
        if(btns[0]) btns[0].textContent = st.stage==='name' ? 'Close' : '‹ Back';
        if(btns[1]) btns[1].textContent = st.stage==='confirm' ? 'Create' : 'Next ›';
        if(btns[0]) btns[0].style.display = st.stage==='name' ? 'none' : '';
      }
      if(st.stage==='name'){
        const wrap = el('div','hero-step');
        wrap.innerHTML = `<h4 style="margin-bottom:10px;">Name your hero</h4>
          <input id="heroName" class="input" maxlength="40" placeholder="Hero name…" style="width:100%;padding:10px;background:#12131c;color:#e9e2cf;border:1px solid #3a4055;border-radius:6px;margin-bottom:12px;" value="${st.name}">
          <div class="small" style="color:var(--muted);margin-bottom:10px;">Choose a class:</div>
          <div class="hero-grid" id="heroClasses" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;"></div>`;
        b.appendChild(wrap);
        const grid = wrap.querySelector('#heroClasses');
        for(const cls of Object.keys(R.CLASSES)){
          const c = R.CLASSES[cls];
          const btn = el('button','btn btn-small',`<b>${c.name}</b><br><span class="small">mins: ${Object.entries(c.mins||{}).map(([k,v])=>STAT_LABELS[k]+' '+v).join(' ')}</span>`);
          btn.style.textAlign='center'; btn.style.lineHeight='1.4';
          btn.onclick = ()=>{ st.cls = cls; render(); };
          if(cls===st.cls) btn.classList.add('btn-gold');
          grid.appendChild(btn);
        }
        const inp = wrap.querySelector('#heroName');
        inp.addEventListener('input', ()=>{ st.name = inp.value; });
      } else if(st.stage==='race'){
        const wrap = el('div','hero-step');
        wrap.innerHTML = `<h4 style="margin-bottom:10px;">Choose a race</h4>
          <div class="small" style="color:var(--muted);margin-bottom:10px;">${R.CLASSES[st.cls].name} — allowed races:</div>
          <div class="hero-grid" id="heroRaces" style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;"></div>`;
        b.appendChild(wrap);
        const grid = wrap.querySelector('#heroRaces');
        for(const rac of Object.keys(R.RACES)){
          const r = R.RACES[rac];
          const ok = raceAllowedForClass(st.cls, rac);
          const btn = el('button','btn btn-small',`<b>${r.name}</b><br><span class="small">${r.desc||''}</span>`);
          btn.disabled = !ok; btn.style.textAlign='left'; btn.style.lineHeight='1.35';
          if(ok) btn.onclick = ()=>{ st.race = rac; render(); };
          if(rac===st.race) btn.classList.add('btn-gold');
          if(!ok) btn.style.opacity = '.35';
          grid.appendChild(btn);
        }
      } else if(st.stage==='rolls'){
        const wrap = el('div','hero-step');
        wrap.innerHTML = `<h4 style="margin-bottom:8px;">Assign the 6 stat rolls</h4>
          <div class="small" style="color:var(--muted);margin-bottom:8px;">Click a roll, then click a stat to place it.</div>
          <div id="rollTray" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;"></div>
          <div id="statSlots" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;"></div>`;
        b.appendChild(wrap);
        const tray = wrap.querySelector('#rollTray');
        if(!st.picked) st.picked = [];
        const consumed = st.picked.map(p=>p.val);
        const remaining = st.rolls.filter(v=>!consumed.includes(v));
        for(const v of remaining){
          const btn = el('button','btn btn-small', '<b>'+v+'</b>');
          btn.style.minWidth='52px'; btn.style.textAlign='center';
          if(st.selRoll===v) btn.classList.add('btn-gold');
          btn.onclick = ()=>{ st.selRoll = (st.selRoll===v)?null:v; render(); };
          tray.appendChild(btn);
        }
        const slots = wrap.querySelector('#statSlots');
        for(const k of Object.keys(st.stats)){
          const filled = st.picked.find(p=>p.slot===k);
          const btn = el('button','btn btn-small', `<b>${STAT_LABELS[k]}</b><br><span class="small">${filled?filled.val:'?'}</span>`);
          btn.style.textAlign='center'; btn.style.lineHeight='1.35';
          btn.onclick = ()=>{
            if(!st.selRoll && !filled) return;
            st.picked = st.picked.filter(p=>p.slot!==k);
            if(st.selRoll) st.picked.push({slot:k,val:st.selRoll});
            st.selRoll = null;
            render();
          };
          if(filled) btn.classList.add('btn-gold');
          slots.appendChild(btn);
        }
      } else if(st.stage==='confirm'){
        const wrap = el('div','hero-step');
        const r = R.RACES[st.race], c = R.CLASSES[st.cls];
        const mins = classMinsFor(st.cls);
        const missing = Object.entries(mins).filter(([k,v])=>(st.stats[k]||0)<v);
        wrap.innerHTML = `<h4 style="margin-bottom:10px;">${st.name||'Hero'} — ${r.name} ${c.name}</h4>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px;">
            ${Object.entries(st.stats).map(([k,v])=>`<div style="background:var(--panel2);border:1px solid #2a2e3d;border-radius:8px;padding:6px;text-align:center;"><div class="small">${STAT_LABELS[k]}</div><div style="font-size:1.15rem;color:${(mins[k]||0)>v?'var(--red)':'var(--gold)'};font-weight:bold;">${v}</div></div>`).join('')}
          </div>
          <p class="small">Race ${r.name} · ${r.desc||''}</p>
          <p class="small" style="margin-top:6px;">Starting funds: <b class="gold">${st.gold} gp</b> · ${c.name} — ${c.desc||''}</p>
          ${missing.length?`<p class="l-bad" style="margin-top:10px;">Minimum scores not met: ${missing.map(([k,v])=>STAT_LABELS[k]+' '+v).join(', ')}</p>`:'<p class="l-good" style="margin-top:10px;">All minimum scores met.</p>'}`;
        b.appendChild(wrap);
        st.missing = missing.length;
      }
    }
    function stageNext(){
      if(st.stage==='name'){
        if(!st.name || !st.name.trim()){ UI.log('Name your hero first.','l-bad'); return; }
        st.name = st.name.trim();
        st.stage = 'race'; render();
      } else if(st.stage==='race'){
        st.stage = 'rolls'; st.rolls = rollSixStats(); st.picked = []; st.selRoll = null; render();
      } else if(st.stage==='rolls'){
        if(st.picked.length < 6){ UI.log('Place all 6 rolls before confirming.','l-bad'); return; }
        // finalize stats from picked assignments
        st.stats = {str:0,dex:0,con:0,int:0,wis:0,cha:0};
        for(const p of st.picked){ st.stats[p.slot] = p.val; }
        // apply race mods
        const R = window.RULES; const r = R.RACES[st.race];
        if(r && r.mod){ for(const k of Object.keys(r.mod)){ st.stats[k] = (st.stats[k]||0) + r.mod[k]; } }
        st.gold = heroGold(st.cls);
        st.stage = 'confirm'; render();
      } else if(st.stage==='confirm'){
        if(st.missing){ UI.log('Minimum scores not met — pick a different race or class.','l-bad'); return; }
        finishHero();
      }
    }
    function stageBack(){
      if(st.stage==='name'){ closeModal(); return; }
      if(st.stage==='race') st.stage='name';
      else if(st.stage==='rolls') st.stage='race';
      else if(st.stage==='confirm') st.stage='rolls';
      render();
    }
    function finishHero(){
      const R = window.RULES;
      const stats = st.stats;
      const gear = starterGear(st.cls);
      const maxhp = (st.cls==='M'?5:(st.cls==='T'?6:(st.cls==='C'?8:10))) + Math.floor((stats.con||10)/4);
      const ch = {id:'hero_'+Date.now(), name:st.name, race:st.race, cls:st.cls, align:'neutral', spec:st.cls,
        str:stats.str,dex:stats.dex,con:stats.con,int:stats.int,wis:stats.wis,cha:stats.cha,
        lvl:1,xp:0,hp:maxhp,maxhp,dead:false,layUsed:false,book:[],prep:{},mem:{},fx:{},poison:null,lost:false,
        eq:gear,inv:[],color:'#e3b54a',quest:null};
      // autoprep mage/cleric/paladin
      if(window.CAMP) CAMP.autoPrep(ch);
      if(!G) ensureGameRoster();
      G.roster = G.roster||[]; G.roster.push(ch);
      if((G.party||[]).length<6 && !G.party.includes(ch.id)) G.party.push(ch.id);
      G.gold = (G.gold||0) + st.gold;
      if(window.JOURNAL) JOURNAL.note(G,'Forged: '+ch.name);
      UI.log('◆ '+ch.name+' — a new hero joins.','l-head');
      UI.log('Funds +'+st.gold+' gp.','l-good');
      renderRosterSafe();
      closeModal();
      updateHUD();
    }
    function renderRosterSafe(){ if(window.GAME && window.GAME.showAssembly){ try{ window.GAME.showAssembly(); }catch(e){} } }
    const modal = UI.modal({
      title:'Forge a Hero',
      body:(b)=>{ bodyEl = b; render(); },
      buttons:[
        {label:'‹ Back',class:'btn',onClick:()=>{ stageBack(); return {keepOpen:true}; }},
        {label:'Next ›',class:'btn btn-gold',onClick:()=>{ stageNext(); return {keepOpen:true}; }}
      ]
    });
    st.el = (q)=>document.querySelector(q);
    this._tmp = null;
  }
  function loadGamePicker(){
    showScreen('title');
    // show list of saved slots
    const saves = allSaves().sort((a,b)=>(b.meta.ts||0)-(a.meta.ts||0));
    const buttons = saves.map(s=>({label:`${s.slot} — ${s.data.meta&&s.data.meta.where?s.data.meta.where:'?'}`,class:'btn',onClick:()=>{ closeModal(); loadFrom(s.slot); }}));
    buttons.push({label:'Cancel',class:'btn',onClick:()=>{ closeModal(); }});
    UI.modal({title:'Load Game', body:(b)=>{ b.innerHTML = `<p class="small">Pick a slot:</p>`; }, buttons});
  }
  function quitToTitleGuard(){ quitToTitle(); }

  // global watch — toggle map/camp key handling
  function toggleMap2(){ toggleMap(); }

  // expose internals needed by ui/overland/combat
  window.GAME_INTERNAL = {G:()=>G, X:()=>X, _setG:(v)=>{G=v;}, setStartState:(d)=>{ G = d; buildRuntime(); showScreen('game'); updateHUD(); setActiveView('3d'); }};
  return {
    get G(){ return G; }, set G(v){ G = v; },
    get X(){ return X; },
    showScreen, init, newGame:()=>{ ensureGameRoster(); showCampaign(); }, showCampaign, showAssembly, beginAdventure,
    saveState, autosave, allSaves, loadFrom, buildRuntime, revealSquares, buildSprites, drawHUDAhead, render3D, updateHUD,
    moveCmd, turn, step, searchCmd, useDefault, openCamp, openSheet, openMenu, quitToTitle, toggleMap, toggleJournal, toggleBestiary, toggleParty, saveGamePicker, openHelp,
    navpadPress, cellChar, partyAlive, refreshPortraits, triggerEvent, openService, openGate, stairs, travelGate, loadGamePicker, saveSlot, openCreateHero, updateTitleButtons,
    isModalOpen, closeModal, setActiveView, isWildsMap,
    takeOnSheet:(ch,idx)=>{
      if(!ch || !G) return;
      const it = ch.inv && ch.inv[idx]; if(!it) return;
      const item = window.DATA.ITEMS[it]; if(!item) return;
      const validSlots = ['melee','missile','armor','shield','cloak','boots','belt','gloves','neck','charm','ring1','ring2'];
      const slot = item.slot;
      if(!slot || !validSlots.includes(slot)){ if(window.UI) UI.log(item.name + ' cannot be equipped.', 'l-muted'); return; }
      ch.inv.splice(idx,1);
      ch.eq = ch.eq||{};
      if(ch.eq[slot]){ const old = ch.eq[slot]; ch.inv = ch.inv||[]; ch.inv.push(old); }
      ch.eq[slot] = it;
      if(window.UI) UI.log(ch.name + ' equips ' + item.name + '.', 'l-good');
      if(window.CAMP) CAMP.autoPrep(ch);
      updateHUD(); buildRuntime(); render3D();
    },
    dropOnSheet:(ch,idx)=>{
      if(!ch || !G) return;
      const it = ch.inv && ch.inv[idx]; if(!it) return;
      ch.inv.splice(idx,1);
      if(!G.ground) G.ground = {};
      const map = G.map; if(!G.ground[map]) G.ground[map] = {};
      const key = G.x+','+G.y;
      G.ground[map][key] = G.ground[map][key]||[];
      G.ground[map][key].push(it);
      if(window.UI) UI.log('Dropped ' + (window.DATA.ITEMS[it]?window.DATA.ITEMS[it].name:it) + '.', 'l-muted');
      updateHUD(); buildRuntime(); render3D();
    }
  };
})();

// bootstrap
window.addEventListener('DOMContentLoaded', ()=>{ try { GAME.init(); } catch(e){ console.error(e); } });
