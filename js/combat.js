/* combat.js — isometric tactical board, AI, spells, rounds */
window.COMBAT = (function(){
  const R = () => window.RULES;
  const GRID_W = 14, GRID_H = 10;
  let active = false;
  let animFrame = null;
  const iso = {hw:36, hh:18};

  function parseHp(str){ // '1d4+2' → average number, int
    if(typeof str === 'number') return str;
    if(!str) return 8;
    const m = /^(\d+)d(\d+)([+-]\d+)?$/.exec(str.trim());
    if(!m) return 8;
    const n = parseInt(m[1]), d = parseInt(m[2]);
    const k = m[3] ? parseInt(m[3]) : 0;
    return Math.max(1, Math.round(n*(d+1)/2 + k));
  }
  function parseDice(str){ // '1d4+2' → [n,d,k]
    if(!str) return [1,6,0];
    const m = /^(\d+)d(\d+)([+-]\d+)?$/.exec(str.trim());
    if(!m) return [1,6,0];
    return [parseInt(m[1]), parseInt(m[2]), m[3]?parseInt(m[3]):0];
  }
  function rollDice(str, mult){ const [n,d,k] = parseDice(str); let t=0; for(let i=0;i<n*(mult||1);i++) t+=1+Math.floor(Math.random()*d); return t + (k||0)*(mult||1); }

  function arrayRand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function isoToScreen(x,y,cv){
    const hw = iso.hw, hh = iso.hh;
    const gx = (x - y) * hw;
    const gy = (x + y) * hh;
    return {x: cv.width/2 + gx - (GRID_W-GRID_H)*hw/2, y: gy + 20};
  }
  function screenToIso(sx,sy,cv){
    const hw = iso.hw, hh = iso.hh;
    const gx = sx - cv.width/2 + (GRID_W-GRID_H)*hw/2;
    const gy = sy - 20;
    const x = (gx/hw + gy/hh)/2, y = (gy/hh - gx/hw)/2;
    return {x, y};
  }
  function tileAt(cv, sx, sy){ const p = screenToIso(sx,sy,cv); const rx = Math.round(p.x), ry = Math.round(p.y); if(rx<0||ry<0||rx>=GRID_W||ry>=GRID_H) return null; return {x:rx,y:ry}; }

  function hexOf(ch){ if(!ch) return '#e3b54a'; return ch.color||'#e3b54a'; }

  // ---------- unit construction ----------
  function mkUnitPC(char){
    const str = char.str||10, dex = char.dex||10;
    const eq = window.CAMP ? window.CAMP.resolvedEq(char) : {};
    const wpn = eq.weapon || null;
    const mv = (window.RULES.RACES[char.race]?window.RULES.RACES[char.race].mv:12) + (char.eq && char.eq.boots && window.DATA.ITEMS[char.eq.boots] && window.DATA.ITEMS[char.eq.boots].mv ? window.DATA.ITEMS[char.eq.boots].mv : 0);
    return {kind:'pc', ref:char, name:char.name, cls:char.cls, race:char.race,
      x:0,y:0, mv:mv, hp:char.hp, maxhp:char.maxhp, ac:(window.CAMP?window.CAMP.acOf(char):10),
      thac0:window.RULES.thac0(char),
      atk:wpn?{w:wpn.dmg||'1d6', spd:wpn.spd||4, dmg:wpn.dmg||'1d6', cat:wpn.cat||'sword', melee:true, missile:false, enchant:wpn.enchant||0, silver:wpn.silver||0, vsUndead:wpn.vsUndead||0}:null,
      missile: eq.missile ? {w:eq.missile.w||'1d6', dmg:eq.missile.dmg||'1d6', spd:eq.missile.spd||4, range:eq.missile.range||18, melee:false, enchant:eq.missile.enchant||0} : null,
      str, dex, int:char.int||10, wis:char.wis||10, lv:char.lvl,
      effects:[], downed:false, hidden:false, invis:false, color:char.color,
      attacksLeft:0, _portrait:true
    };
  }
  function mkUnitMon(monId, count){
    const m = window.DATA.MONSTERS[monId]; if(!m) return null;
    const hd = parseFloat(String(m.hd).replace('.','.'));
    let hpStr = m.hp || '1d6';
    const hpAvg = parseHp(hpStr);
    return {kind:'mon', ref:m, id:m.id, name:m.name, mv:parseInt(String(m.mv||'8')), hp:count>1?Math.max(4,Math.round(hpAvg/1.6)):hpAvg, maxhp:count>1?Math.max(4,Math.round(hpAvg/1.6)):hpAvg,
      ac:m.ac||2, thac0:parseInt(String(m.thac0||'14')),
      atk:(m.atk&&m.atk.length)?{w:m.atk[0], dmg:m.atk[0], spd:4, melee:true}:{w:'1d6', dmg:'1d6', spd:4, melee:true},
      missile: m.ranged ? {dmg:m.ranged.dmg||'1d6', spd:m.ranged.spd||4, range:m.ranged.range||24, melee:false} : null,
      caster: m.caster||0, ml:m.ml||0, xp:m.xp||10, gold:m.gold||0,
      tags:m.tags||[], fig:m.fig, leader:m.leader||0, regenerate:m.regenerate||0, stunImmune:!!m.stunImmune,
      x:0,y:0, effects:[], downed:false, hidden:false, invis:false, count:count, maxCount:count,
      str:10, dex:10, int:10, wis:10, lv:Math.max(1,Math.round(Math.log2((m.xp||10)+1))),
      color:'#b05040', lore:m.lore
    };
  }

  // ---------- state ----------
  let S = null;
  function start(spec){
    return new Promise((resolve)=>{
      active = true;
      const cv = document.getElementById('combatCanvas');
      if(!cv){ resolve({result:'lose',xp:0,gold:0,items:[]}); return; }
      const ctx = cv.getContext('2d');
      const r = cv.parentElement ? cv.parentElement.getBoundingClientRect() : {width:900,height:500};
      cv.width = Math.max(480, Math.floor(r.width)); cv.height = Math.max(320, Math.floor(r.height));
      const party = (spec.party||[]).map(c=>mkUnitPC(c));
      const mons = [];
      const counts = {};
      const monsDef = spec.mons || [];
      monsDef.forEach(([mid, cnt])=>{
        const n = typeof cnt === 'string' ? rollCount(cnt) : (cnt||1);
        counts[mid] = n;
        for(let i=0;i<n;i++){ const u = mkUnitMon(mid, n); if(u) mons.push(u); }
      });
      const all = [...party, ...mons];
      const obstacles = genObstacles(cv);
      const units = {
        party, mons, all, round:0,
        activeUnitIdx:0,
        reachable: new Set(),
        lastTurn:null,
        spec, cv, ctx, obstacles,
        resolve, result:null
      };
      S = units;
      layoutUnits(units);
      beginRound(units);
      cv.onclick = e=>handleClick(e, units);
      cv.oncontextmenu = e=>{ e.preventDefault(); if(S.activeUnitIdx>=0) cancelTurn(units); };
      window.COMBAT_KEYS = true;
      document.addEventListener('keydown', combatKeys);
      drawFrame(units);
    });
  }
  function rollCount(str){ const m = /^(\d+)d(\d+)([+-]\d+)?$/.exec(str); if(!m) return parseInt(str)||1; let n = parseInt(m[1]), d = parseInt(m[2]); let t=0; for(let i=0;i<n;i++) t+=1+Math.floor(Math.random()*d); if(m[3]) t+=parseInt(m[3]); return Math.max(1,t); }

  function layoutUnits(units){
    const {party, mons, obstacles} = units;
    // PCs: front rank x=3, second rank x=1 (near left center)
    let leftCenter = [GRID_H/2-1, GRID_H/2, GRID_H/2+1, GRID_H/2-2, GRID_H/2+2, GRID_H/2-3];
    let placed = new Set();
    const free = (x,y) => x>=0&&x<GRID_W&&y>=0&&y<GRID_H && !obstacles.has(x+','+y) && !placed.has(x+','+y);
    party.forEach((u,i)=>{
      const front = i<3;
      const x = front?3:1;
      const y = Math.max(0,Math.min(GRID_H-1, Math.round(GRID_H/2) + Math.floor((i-2)/2)));
      // find nearby free tile
      outer: for(let dx=0; dx<=2; dx++){ for(let dy=-2; dy<=2; dy++){ const nx=x+dx-(front?0:2), ny=Math.max(0,Math.min(GRID_H-1,y+dy)); if(free(nx,ny)){ u.x=nx; u.y=ny; placed.add(nx+','+ny); break outer; } } }
      if(!placed.has(u.x+','+u.y)){ u.x=front?3:1; u.y=Math.floor(GRID_H/2); placed.add(u.x+','+u.y); }
    });
    // monsters: melee nearer, ranged/casters farther
    const melos = mons.filter(m=>!m.missile && !m.caster);
    const far = mons.filter(m=>m.missile || m.caster);
    const sortIdx = i=>{ let y = Math.floor(GRID_H/2) + Math.floor((i - far.length/2)); return Math.max(0,Math.min(GRID_H-1, y)); };
    melos.forEach((u,i)=>{
      outer2: for(let dx=0; dx<=2; dx++){ for(let dy=-2; dy<=2; dy++){ const x=9+dx, y=Math.max(0,Math.min(GRID_H-1, Math.floor(GRID_H/2) + i - Math.floor(melos.length/2) + Math.floor(dy/2))); if(free(x,y)){ u.x=x; u.y=y; placed.add(x+','+y); break outer2; } } }
      if(!placed.has(u.x+','+u.y)){ u.x=9; u.y=Math.max(0,Math.min(GRID_H-1, Math.floor(GRID_H/2)+Math.floor(i/2)-1)); placed.add(u.x+','+u.y); }
    });
    far.forEach((u,i)=>{
      outer3: for(let dx=0; dx<=2; dx++){ for(let dy=-2; dy<=2; dy++){ const x=12+dx*0, y=Math.max(0,Math.min(GRID_H-1, Math.floor(GRID_H/2) + i - Math.floor(far.length/2))); if(free(x,y)){ u.x=x; u.y=y; placed.add(x+','+y); break outer3; } } }
      if(!placed.has(u.x+','+u.y)){ u.x=12; u.y=Math.max(0,Math.min(GRID_H-1, Math.floor(GRID_H/2)+Math.floor(i/2)-1)); placed.add(u.x+','+u.y); }
    });
  }

  function genObstacles(cv){
    const o = new Set(); const n = 4 + Math.floor(Math.random()*3);
    // random obstacles in mid-space (x=6..8)
    for(let i=0;i<n;i++){ const x = 6+Math.floor(Math.random()*3), y = Math.floor(Math.random()*GRID_H); if(!(x>=6&&x<=10)) continue; o.add(x+','+y); }
    return o;
  }

  // ---------- round loop ----------
  function beginRound(units){
    units.round++;
    const alive = units.all.filter(u=>!u.downed && u.hp>0);
    for(const u of alive){
      const spd = (u.kind==='pc' ? (u.atk?u.atk.spd:4) : (u.ref?(u.ref.size>=1.5?0:(u.ref.size>=1?1:3)):1));
      u.init = Math.floor(Math.random()*10)+1 + spd - (u.effects.some(e=>e.type==='haste')?1:0);
    }
    const aliveSorted = alive.sort((a,b)=>(a.init-b.init));
    units.turnOrder = aliveSorted;
    units.turnIdx = 0;
    startTurn(units);
  }
  function startTurn(units){
    const order = units.turnOrder;
    if(!order.length){ return; }
    // advance
    const idx = units.turnIdx;
    const u = order[idx];
    if(!u || u.downed || u.hp<=0){ units.turnIdx++; if(units.turnIdx<order.length) startTurn(units); else endRound(units); return; }
    units.active = u;
    u.attacksLeft = meleeAttacks(u);
    u.moveLeft = movementBudget(u);
    // monsters acting automatically
    if(u.kind==='mon'){ setTimeout(()=>monTurn(units,u), 350); }
    else if(u._auto){ setTimeout(()=>autoTurn(units,u), 350); }
    else { refreshActiveUI(units); }
    drawFrame(units);
  }
  function movementBudget(u){ return 2*Math.ceil(u.mv/2); }
  function meleeAttacks(u){ if(u.kind==='pc'){ const cls = u.cls; if(cls==='F'&&u.ref.spec) return 1.5; if(cls==='F'||cls==='P'||cls==='R'){ return u.lv>=13?2:(u.lv>=7?1.5:1); } return 1; } return 1; }

  function cancelTurn(units){
    if(units.active && units.active.kind==='pc'){ endActiveTurn(units); }
  }

  function endActiveTurn(units){
    units.turnIdx++;
    if(units.turnIdx >= units.turnOrder.length) endRound(units);
    else startTurn(units);
  }

  function endRound(units){
    // cleanup turn state
    units.active = null;
    if(checkEnd(units)) return;
    beginRound(units);
  }

  // ---------- victory / defeat ----------
  function checkEnd(units){
    const monsAlive = units.mons.filter(u=>!u.downed && u.hp>0);
    const pcsAlive = units.party.filter(u=>!u.downed && u.hp>0);
    if(monsAlive.length===0){ finish(units,'win'); return true; }
    if(pcsAlive.length===0){ finish(units,'lose'); return true; }
    return false;
  }
  function finish(units, result){
    active = false;
    const eqItem = units.spec.eventItems || [];
    // victory settlement
    const killed = units.mons.filter(u=>u.downed || u.hp<=0);
    const xp = killed.reduce((s,u)=>s+(u.ref?u.ref.xp||0:0),0);
    let gold = 0;
    killed.forEach(u=>{ gold += u.ref?u.ref.gold||0:0; });
    gold += units.spec.goldRoll ? rollCount(units.spec.goldRoll) : 0;
    const firstAlive = units.party.find(u=>!u.downed && u.hp>0);
    const items = [];
    if(result==='win' && eqItem.length){ items.push(...eqItem); }
    units.result = {result, xp, gold, items, survivors: units.party.filter(u=>!u.downed && u.hp>0).map(u=>u.ref.id), killed: killed.map(u=>({id:u.id||(u.ref&&u.ref.id), ref:u.ref}))};
    renderEnd(units);
    setTimeout(()=>units.resolve(units.result), 1500);
  }
  function renderEnd(units){
    const cv = units.cv; const ctx = units.ctx;
    drawFrame(units);
    ctx.fillStyle = 'rgba(10,10,18,0.75)'; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle = units.result.result==='win' ? '#e3b54a' : '#d0554a';
    ctx.font = 'bold 44px Georgia'; ctx.textAlign = 'center';
    ctx.fillText(units.result.result==='win'?'VICTORY':'DEFEAT', cv.width/2, cv.height/2 - 20);
    ctx.fillStyle = '#e9e2cf'; ctx.font = '20px Georgia';
    ctx.fillText('+' + units.result.xp + ' xp · ' + units.result.gold + ' gp', cv.width/2, cv.height/2 + 24);
  }

  // ---------- movement & interaction ----------
  function reachableTiles(units, u){
    const budget = u.moveLeft || movementBudget(u);
    if(budget<=0) return new Set();
    const dist = new Map(); const prev = new Map();
    const q = [[u.x,u.y]]; dist.set(u.x+','+u.y, 0);
    const cost = (c,x,y)=>{ const dx=Math.abs(x-u.x), dy=Math.abs(y-u.y); return 0; };
    while(q.length){
      const [cx,cy] = q.shift();
      const d = dist.get(cx+','+cy);
      for(const dir of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
        const nx=cx+dir[0], ny=cy+dir[1];
        if(nx<0||ny<0||nx>=GRID_W||ny>=GRID_H) continue;
        if(units.obstacles.has(nx+','+ny)) continue;
        if(isOccupied(units,nx,ny,u.id||u)) continue;
        const diag = dir[0]!==0 && dir[1]!==0;
        const stepCost = diag?3:2;
        // no corner cutting
        if(diag){ if(units.obstacles.has((cx+dir[0])+','+cy) || units.obstacles.has(cx+','+(cy+dir[1]))) continue; }
        const nd = d + stepCost;
        if(nd <= budget && !dist.has(nx+','+ny)){ dist.set(nx+','+ny, nd); prev.set(nx+','+ny, cx+','+cy); q.push([nx,ny]); }
      }
    }
    const set = new Set();
    for(const k of dist.keys()){ if(k!==u.x+','+u.y) set.add(k); }
    return set;
  }
  function isOccupied(units, x, y, exclude){
    for(const u of units.all){ if(u===exclude) continue; if(u.downed||u.hp<=0) continue; if(u.x===x&&u.y===y) return true; }
    return false;
  }
  function handleClick(e, units){
    if(!units.active) return;
    const u = units.active;
    if(u.kind!=='pc') return; // monsters don't respond
    const r = units.cv.getBoundingClientRect();
    const sx = (e.clientX - r.left) * (units.cv.width / r.width);
    const sy = (e.clientY - r.top) * (units.cv.height / r.height);
    const tile = tileAt(units.cv, sx, sy);
    // pending spell mode
    if(units._castMode && u._pendingSpell){
      const target = units.all.find(x=>x.x===tile.x && x.y===tile.y && !x.downed && x.hp>0 && x!==u);
      if(target){
        const ok = castSpell(units, u, u._pendingSpell, target);
        if(ok){ u._pendingSpell = null; units._castMode = false; }
      } else {
        // allow area-ish target — last target remains
        const t2 = units.all.find(x=>x.kind==='mon' && !x.downed && x.hp>0);
        if(t2){ const ok = castSpell(units, u, u._pendingSpell, t2); if(ok){ u._pendingSpell = null; units._castMode = false; } }
      }
      drawFrame(units); return;
    }
    // any PCs targeting
    const targetTile = units.all.find(x=>x.x===tile.x && x.y===tile.y && !x.downed && x.hp>0 && x!==u);
    if(targetTile){
      if(targetTile.kind==='mon'){ tryAttack(units, u, targetTile); return; }
      if(targetTile.kind==='pc'){ tryTargetSelfAlly(units, u, targetTile); return; }
    }
    // tile move
    if(units.reachable && units.reachable.has(tile.x+','+tile.y)){ moveUnit(units, u, tile.y, tile.y, tile.x, tile.y); return; }
  }
  // moveUnit abstraction: pass destination
  function moveUnit(units, u, _0, __0, dx, dy){
    const cost = 2; // cardinal-ish approximation — but tiles can be diagonal; recompute
    // determine actual tile cost
    const ddx = Math.abs(dx - u.x), ddy = Math.abs(dy - u.y);
    const diag = ddx>0 && ddy>0;
    const stepCost = diag?3:2;
    const dist = Math.max(0, u.moveLeft ? u.moveLeft : 99);
    if(dist < stepCost) return;
    u.moveLeft -= stepCost;
    u.x = dx; u.y = dy;
    // opportunity: no free move beyond
    refreshReach(units, u);
    drawFrame(units);
  }
  function tryAttack(units, u, target){
    // melee adjacent or missile in range
    const dist = Math.max(Math.abs(target.x-u.x), Math.abs(target.y-u.y));
    if(dist <= 1){
      // melee attack
      doMeleeAttack(units, u, target);
    } else if(u.missile){ // ranged
      const maxRange = u.missile.range || 18;
      if(dist <= Math.ceil(maxRange/10)){
        if(!hasClearLine(units, u.x, u.y, target.x, target.y)){ logLine(units, 'No clear line to target.'); return; }
        doMissileAttack(units, u, target);
      } else { logLine(units, 'Target out of range.'); }
    } else { logLine(units, 'Out of range.'); }
  }
  function doMeleeAttack(units, u, target){
    if(u.attacksLeft<=0){ logLine(units, 'No attacks remaining.'); return; }
    // provoke check: no reaction needed for player attack
    const attacker = u;
    const cls = attacker.cls || 'M';
    let hitMods = 0;
    if(attacker.kind==='pc'){
      const eq = window.CAMP?window.CAMP.resolvedEq(attacker.ref):{};
      const w = eq.weapon;
      if(w){ hitMods += (w.enchant||0); if(attacker.ref.spec==='sword' && w.cat==='sword') hitMods += 1; }
      if(attacker.cls==='R' && attacker.ref.spec && tagMatch(target, attacker.ref.spec)) hitMods += 4;
      if(attacker.cls==='P' && isEvil(target)) hitMods += 1;
      if(attacker.ref.spec && attacker.cls==='R'){ /* off-hand handled in multiattacks */ }
      // thief backstab
      if(attacker.cls==='T' && attacker.hidden) hitMods += 4;
      // racial bonuses: elf sword +1
      if(attacker.race==='elf' && w && w.cat==='sword') hitMods += 1;
      // dex defense / STR not added to hit except for thief
      // silver/undead tag
      // wards
    }
    const ac = target.ac;
    const need = attacker.thac0 - ac;
    const roll = 1+Math.floor(Math.random()*20);
    const hit = roll === 1 ? false : (roll === 20 ? true : roll + hitMods >= need);
    logLine(units, `${u.name} attacks ${target.name}: d20=${roll} (${hit?'HIT':'miss'}) need ${need}`);
    if(hit){
      let dmg = 0;
      const w = attacker.atk || {dmg:'1d6'};
      const wpn = attacker.atk; const atkStr = wpn?wpn.dmg:'1d6';
      dmg = rollDice(atkStr, 1);
      if(attacker.kind==='pc'){ dmg += Math.floor(((attacker.str||10)-10)/2); if(attacker.kind==='pc' && attacker.ref && attacker.ref.spec==='sword' && attacker.ref.cls==='F') dmg += 2; }
      if(wpn && wpn.enchant) dmg += wpn.enchant;
      // weapon-vs-target reductions
      dmg = applyWeaponVs(damageCheck(units, attacker, target, dmg));
      // thief backstab multiplier
      if(attacker.cls==='T' && attacker.hidden){ const mult = {1:2,5:3,9:4,13:5}[thresholdLevel(attacker.lv)] || 2; dmg = Math.floor(dmg * mult); }
      // helpless
      if(target.effects.some(e=>e.type==='helpless')) dmg = Math.max(dmg, 1);
      damageUnit(units, target, dmg, attacker);
    }
    u.attacksLeft -= 1;
    if(u.attacksLeft<=0) { u.moveLeft = Math.min(u.moveLeft||0, 0); }
    if(u.kind==='pc') refreshReach(units, u);
    drawFrame(units);
  }
  function damageCheck(units, attacker, target, dmg){ return dmg; }
  function applyWeaponVs(dmg){ return dmg; }
  function thresholdLevel(lv){ if(lv>=13) return 13; if(lv>=9) return 9; if(lv>=5) return 5; return 1; }
  function tagMatch(target, spec){ const tags = target.tags || []; const map = {goblin:['goblin'],orc:['orc'],kobold:['goblin'],undead:['undead'],giantkin:['giant'],troll:['giant','troll']}; return map[spec] ? tags.some(t=>map[spec].includes(t)) : false; }
  function isEvil(target){ return (target.tags||[]).some(t=>['demon','evil','devil'].includes(t)); }

  function doMissileAttack(units, u, target){
    const need = u.thac0 - target.ac;
    const roll = 1+Math.floor(Math.random()*20);
    const dexBonus = (window.CAMP?(window.CAMP.resolvedEq(u.ref).missile||{}).enchant||0:0) + (u.kind==='pc'?Math.floor(((u.dex||10)-10)/4):0);
    const hit = roll === 1 ? false : (roll === 20 ? true : roll + dexBonus >= need);
    logLine(units, `${u.name} shoots ${target.name}: d20=${roll} (${hit?'HIT':'miss'})`);
    if(hit){
      const wpn = u.missile; const dmgStr = wpn?wpn.dmg:'1d6';
      const dmg = rollDice(dmgStr,1) + (u.kind==='pc'?Math.floor(((u.int||10)-10)/4):0);
      damageUnit(units, target, dmg, u);
    }
    u.attacksLeft -= 1;
    if(u.kind==='pc') refreshReach(units,u);
    drawFrame(units);
  }
  function hasClearLine(units, x0,y0,x1,y1){
    // simple supercover: check each tile between
    const dx = x1-x0, dy = y1-y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for(let i=1;i<steps;i++){ const x = Math.round(x0 + dx*i/steps), y = Math.round(y0 + dy*i/steps); if(units.obstacles.has(x+','+y)) return false; }
    return true;
  }
  function tryTargetSelfAlly(units, u, target){
    // target self-ally: nothing by default; allow Lay on Hands if offered — handled by buttons
    logLine(units, 'Cannot target an ally with this action.');
  }
  function damageUnit(units, target, dmg, attacker){
    if(target.invis) { logLine(units, `${target.name} is invisible.`); return; }
    let real = Math.max(0, Math.round(dmg));
    // stoneskin absorb
    const stoneskin = target.effects.find(e=>e.type==='stoneskin');
    if(stoneskin && stoneskin.hits>0){ real = Math.max(0, real - stoneskin.hits); stoneskin.hits--; if(stoneskin.hits<=0) target.effects = target.effects.filter(e=>e!==stoneskin); }
    target.hp -= real;
    logLine(units, `${target.name} takes ${real}.`, real>0?'l-bad':'l-muted');
    if(real>0){ target.effects = target.effects.filter(e=>e.type!=='sleep' && e.type!=='stone'); }
    if(target.hp<=0 && !target.downed){
      target.downed = true; target.hp = 0;
      if(target.kind==='pc'){ target.ref.hp = 0; logLine(units, `${target.name} is down!`, 'l-bad'); }
      else logLine(units, `${target.name} is slain.`, 'l-gold');
    }
    if(target.kind==='pc' && target.hp<0) target.hp = 0;
  }

  function refreshReach(units, u){
    units.reachable = reachableTiles(units, u);
    drawFrame(units);
  }
  function refreshActiveUI(units){
    units.reachable = reachableTiles(units, units.active);
    drawFrame(units);
  }

  function logLine(units, text, cls){
    if(window.UI) window.UI.log(text, cls);
  }

  // ---------- monster turn ----------
  // ---------- auto battle ----------
  function autoTurn(units, u){
    if(!units.active || units.active!==u || u.downed || u.hp<=0) return;
    let guard = 0;
    while(u.attacksLeft>0 && guard++<4){
      if(units.active!==u) return;
      const mons = units.all.filter(x=>x.kind==='mon' && !x.downed && x.hp>0);
      if(!mons.length){ endActiveTurn(units); return; }
      const t = mons.sort((a,b)=>(Math.max(Math.abs(a.x-u.x),Math.abs(a.y-u.y)))-(Math.max(Math.abs(b.x-u.x),Math.abs(b.y-u.y))))[0];
      const dist = Math.max(Math.abs(t.x-u.x), Math.abs(t.y-u.y));
      if(dist<=1){ doMeleeAttack(units,u,t); continue; }
      if(u.missile && dist <= Math.ceil((u.missile.range||24)/10) && hasClearLine(units,u.x,u.y,t.x,t.y)){ doMissileAttack(units,u,t); continue; }
      // no line/range — move toward nearest monster
      if(u.moveLeft>0){
        const step = findStepToward(units,u,t);
        if(step && (step.x!==u.x || step.y!==u.y)){ u.moveLeft -= 2; u.x = step.x; u.y = step.y; refreshReach(units,u); continue; }
      }
      break;
    }
    if(units.active===u) endActiveTurn(units);
  }

  function monTurn(units, m){
    if(m.downed || m.hp<=0){ endActiveTurn(units); return; }
    if(m.effects.some(e=>e.type==='stunned'||e.type==='paralyzed')){ endActiveTurn(units); return; }
    // find nearest living PC
    const targets = units.party.filter(u=>!u.downed && u.hp>0);
    if(!targets.length){ finish(units,'lose'); return; }
    const t = targets.sort((a,b)=>(Math.max(Math.abs(a.x-m.x),Math.abs(a.y-m.y)))-(Math.max(Math.abs(b.x-m.x),Math.abs(b.y-m.y))))[0];
    const dist = Math.max(Math.abs(t.x-m.x), Math.abs(t.y-m.y));
    // caster
    if(m.caster && m.effects.every(e=>e.type!=='silenced') && Math.random()<0.4){
      // use spell if in range
      const targets2 = targets.filter(u=>{ const d = Math.max(Math.abs(u.x-m.x),Math.abs(u.y-m.y)); return d <= Math.ceil(20/10); });
      if(targets2.length){ castMonSpell(units, m, targets2[0]); setTimeout(()=>{ endActiveTurn(units); }, 500); return; }
    }
    if(dist <= 1){
      // melee attack
      doMeleeAttack(units, m, t);
      setTimeout(()=>endActiveTurn(units), 500);
      return;
    }
    if(m.missile && dist <= Math.ceil((m.missile.range||24)/10)){
      if(hasClearLine(units, m.x, m.y, t.x, t.y)){ doMissileAttack(units, m, t); setTimeout(()=>endActiveTurn(units),500); return; }
    }
    // move toward target
    const step = findStepToward(units, m, t);
    if(step){ m.moveLeft -= 2; m.x = step.x; m.y = step.y; }
    setTimeout(()=>endActiveTurn(units), 400);
  }
  function findStepToward(units, u, target){
    const dist = new Map(); dist.set(u.x+','+u.y,0);
    const q = [[u.x,u.y]];
    let best = null;
    while(q.length){
      const [cx,cy] = q.shift(); const d = dist.get(cx+','+cy);
      const cur = Math.max(Math.abs(target.x-cx), Math.abs(target.y-cy));
      if(cur < (best?Math.max(Math.abs(target.x-best.x),Math.abs(target.y-best.y)):99)) best = {x:cx,y:cy};
      if(d > 16) continue;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
        const nx=cx+dx, ny=cy+dy;
        if(nx<0||ny<0||nx>=GRID_W||ny>=GRID_H) continue;
        if(units.obstacles.has(nx+','+ny)) continue;
        if(isOccupied(units,nx,ny,u)) continue;
        if(dx!==0&&dy!==0){ if(units.obstacles.has((cx+dx)+','+cy) || units.obstacles.has(cx+','+(cy+dy))) continue; }
        const nd = d + (dx!==0&&dy!==0?3:2);
        if(!dist.has(nx+','+ny)){ dist.set(nx+','+ny, nd); q.push([nx,ny]); }
      }
    }
    // return best step toward target (nearest free cell to target within budget)
    let best2 = null;
    for(const key of dist.keys()){ const [x,y] = key.split(',').map(Number); const d = Math.max(Math.abs(target.x-x),Math.abs(target.y-y)); if(!best2 || d < best2.d) best2 = {x,y,d}; }
    return best2;
  }

  function castMonSpell(units, m, target){
    // simple: fire a magic bolt or melee blast — use last known monster spell heuristic
    const hd = parseFloat(String(m.ref.hd).replace('.','.'));
    const dmg = Math.max(2, Math.round(hd*1.5));
    // check for clear line not required for spells
    logLine(units, `${m.name} casts a dark bolt at ${target.name}! (${dmg})`, 'l-spell');
    damageUnit(units, target, dmg, m);
  }

  // ---------- rendering ----------
  function drawFrame(units){
    const cv = units.cv, ctx = units.ctx;
    const W_ = cv.width, H_ = cv.height;
    const pad = 30;
    ctx.fillStyle = '#15161f'; ctx.fillRect(0,0,W_,H_);
    // background gradient
    const g = ctx.createLinearGradient(0,0,0,H_); g.addColorStop(0,'#1d1f2a'); g.addColorStop(0.6,'#15161f'); g.addColorStop(1,'#0d0e13');
    ctx.fillStyle = g; ctx.fillRect(0,0,W_,H_);
    drawGrid(units, ctx, W_, H_, pad);
    drawReach(units, ctx);
    drawUnits(units, ctx);
    drawOverlay(units, ctx, W_, H_);
  }
  function drawGrid(units, ctx, W_, H_, pad){
    const ox = W_/2 - (GRID_W-GRID_H)*iso.hw/2;
    const oy = 20;
    for(let y=0;y<GRID_H;y++){ for(let x=0;x<GRID_W;x++){
      const sx = ox + (x - y)*iso.hw;
      const sy = oy + (x + y)*iso.hh;
      if(sx<-70||sx>W_+70||sy<-50||sy>H_+50) continue;
      const obs = units.obstacles.has(x+','+y);
      ctx.beginPath();
      ctx.moveTo(sx, sy - iso.hh); ctx.lineTo(sx + iso.hw, sy); ctx.lineTo(sx, sy + iso.hh); ctx.lineTo(sx - iso.hw, sy);
      ctx.closePath();
      if(obs){ ctx.fillStyle = '#2a2d3d'; } else { ctx.fillStyle = ((x+y)%2===0)?'#22242f':'#23252f'; }
      ctx.fill();
      ctx.strokeStyle = '#16171f'; ctx.lineWidth = 1; ctx.stroke();
    }}
  }
  function drawReach(units, ctx){
    if(!units.active || units.active.kind!=='pc') return;
    const u = units.active;
    const ox = units.cv.width/2 - (GRID_W-GRID_H)*iso.hw/2, oy = 20;
    if(units.reachable){
      for(const key of units.reachable){
        const [x,y] = key.split(',').map(Number);
        const sx = ox + (x - y)*iso.hw, sy = oy + (x + y)*iso.hh;
        ctx.beginPath(); ctx.moveTo(sx, sy - iso.hh); ctx.lineTo(sx + iso.hw, sy); ctx.lineTo(sx, sy + iso.hh); ctx.lineTo(sx - iso.hw, sy); ctx.closePath();
        ctx.fillStyle = 'rgba(227,181,74,0.14)'; ctx.fill();
        ctx.strokeStyle = 'rgba(227,181,74,0.4)'; ctx.stroke();
      }
    }
  }
  function drawUnits(units, ctx){
    const ox = units.cv.width/2 - (GRID_W-GRID_H)*iso.hw/2, oy = 20;
    const alive = units.all.filter(u=>!u.downed && u.hp>0);
    const corpses = units.all.filter(u=>u.downed || u.hp<=0);
    // draw corpses first
    for(const u of corpses){ drawUnit(units, ctx, u, ox, oy, true); }
    // sort alive by depth (y+x)
    alive.sort((a,b)=>(a.x+a.y)-(b.x+b.y));
    for(const u of alive){ drawUnit(units, ctx, u, ox, oy, false); }
  }
  function drawUnit(units, ctx, u, ox, oy, dead){
    const sx = ox + (u.x - u.y)*iso.hw, sy = oy + (u.x + u.y)*iso.hh;
    const size = (u.kind==='pc'?26:(u.ref.size>=1.5?30:(u.ref.size>=1?22:16)));
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(sx, sy+8, size*0.5, size*0.25, 0, 0, Math.PI*2); ctx.fill();
    // HP bar above
    const hpFrac = Math.max(0, Math.min(1, u.hp/Math.max(1,u.maxhp)));
    ctx.fillStyle = '#22242f'; ctx.fillRect(sx - 22, sy - size - 14, 44, 5);
    ctx.fillStyle = u.kind==='pc' ? '#5da75d' : '#c8502c';
    ctx.fillRect(sx - 22, sy - size - 14, 44*hpFrac, 5);
    // body
    const color = hexOf(u.kind==='pc'?u.ref:u.ref);
    if(u.kind==='pc'){
      if(window.FIGURES){
        const off = document.createElement('canvas'); off.width = size*2; off.height = size*2;
        const octx = off.getContext('2d');
        window.FIGURES.drawFigure(octx, window.FIGURES.figForChar(u.ref), size, size, size);
        const alpha = (u.hidden?0.35:1) * (u.invis?0.45:1);
        ctx.globalAlpha = alpha; ctx.drawImage(off, sx - size, sy - size*1.6, size*2, size*2); ctx.globalAlpha = 1;
      } else { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(sx, sy - size*0.6, size*0.4, size*0.6, 0, 0, Math.PI*2); ctx.fill(); }
    } else {
      if(window.FIGURES){
        const off = document.createElement('canvas'); off.width = size*2; off.height = size*2;
        const octx = off.getContext('2d');
        window.FIGURES.drawFigure(octx, window.FIGURES.figForMonster(u.ref), size, size, size);
        ctx.fillStyle = 'transparent';
        ctx.globalAlpha = dead?0.4:1; ctx.drawImage(off, sx - size, sy - size*1.6, size*2, size*2); ctx.globalAlpha = 1;
      } else { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(sx, sy - size*0.6, size*0.4, size*0.6, 0, 0, Math.PI*2); ctx.fill(); }
    }
    if(dead){ ctx.strokeStyle = '#c8502c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx-size*0.45, sy - size*0.6 - size*0.3); ctx.lineTo(sx+size*0.45, sy - size*0.6 + size*0.3); ctx.moveTo(sx+size*0.45, sy - size*0.6 - size*0.3); ctx.lineTo(sx-size*0.45, sy - size*0.6 + size*0.3); ctx.stroke(); }
    if(u.effects && u.effects.length){ ctx.fillStyle = '#e3b54a'; ctx.font = '11px Georgia'; ctx.textAlign = 'center'; ctx.fillText(u.effects.map(e=>e.type.toUpperCase().slice(0,3)).join(' '), sx, sy - size*1.6 - 6); }
    if(u.hidden){ ctx.fillStyle = '#9a8fd0'; ctx.font = '9px Georgia'; ctx.textAlign = 'center'; ctx.fillText('HIDDEN', sx, sy + 12); }
    if(u.invis){ ctx.fillStyle = '#9a8fd0'; ctx.font = '9px Georgia'; ctx.textAlign = 'center'; ctx.fillText('INVIS', sx, sy + 24); }
  }
  function drawOverlay(units, ctx, W_, H_){
    // active unit panel top-left
    ctx.fillStyle = 'rgba(13,14,19,0.75)'; ctx.fillRect(0,0,340,64);
    ctx.fillStyle = '#e9e2cf'; ctx.font = '12px Georgia'; ctx.textAlign = 'left';
    const u = units.active;
    if(u){ ctx.fillStyle = u.kind==='pc'?'#e3b54a':'#c8502c'; ctx.fillText(u.name + (u.kind==='pc'?` · L${u.lv}`:` · ${u.ref.name||'Enemy'}`), 12, 24); ctx.fillStyle = '#8a8578'; ctx.fillText(u.kind==='pc'?'Your turn — click a blue tile or a target':'Enemy turn…', 12, 44); }
    ctx.fillStyle = '#8a8578'; ctx.textAlign = 'right'; ctx.fillText('Round '+units.round, W_-12, 22);
  }

  // ---------- spells ----------
  function castSpell(units, u, spellId, target){
    const sp = window.DATA.SPELLS[spellId]; if(!sp) return false;
    const isMage = u.kind==='pc' && u.cls==='M';
    const isPriest = u.kind==='pc' && (u.cls==='C'||u.cls==='P');
    if(isMage || isPriest){
      const prep = (u.ref.prep||{})[spellId]||0; const mem = (u.ref.mem||{})[spellId]||0;
      const known = (u.ref.book||[]).includes(spellId);
      if(!known){ logLine(units, 'Spell not known.'); return false; }
      if(mem<=0){ logLine(units, 'No copies left.'); return false; }
      // priest check
      if(isPriest && Math.random() < 1 - Math.min(1, (u.int||10)/13)){
        // failed priest spell — still consumes
        u.ref.mem[spellId] = Math.max(0, mem-1);
        logLine(units, `${u.name} fails to cast ${sp.name}.`, 'l-spell');
        return true;
      }
      u.ref.mem[spellId] = Math.max(0, mem-1);
    } else { logLine(units, 'Not a caster.'); return false; }
    // apply effect
    applySpellEffect(units, u, sp, target);
    drawFrame(units);
    return true;
  }
  function applySpellEffect(units, u, sp, target){
    const x = Math.round(target.x), y = Math.round(target.y);
    logLine(units, `${u.name} casts ${sp.name}.`, 'l-spell');
    switch(sp.id){
      case 'magic_missile': { const n = Math.min(5, Math.ceil((u.lv||1)/2)); let total=0; for(let i=0;i<n;i++) total += 1+Math.floor(Math.random()*4)+1; damageUnit(units, target, total, u); break; }
      case 'shield': { u.effects.push({type:'shield', until:'round'}); logLine(units, 'Shield up! Magic Missile negated.'); break; }
      case 'armor': { u.effects.push({type:'armor', ac:6, until:'round'}); logLine(units, 'Armor set.'); break; }
      case 'sleep': { const roll = 2+Math.floor(Math.random()*4); let heal = 0; target.effects.push({type:'sleep', until:'round'}); logLine(units, `${target.name} is slept.`, 'l-spell'); break; }
      case 'burning_hands': { const dmg = 1+Math.floor(Math.random()*4); damageUnit(units, target, dmg, u); break; }
      case 'invisibility': { u.effects.push({type:'invis', until:'round'}); u.invis = true; logLine(units, 'You are invisible.'); break; }
      case 'blindness': { const save = Math.random()*20+1; if(save >= 13){ damageUnit(units, target, 0, u); logLine(units, `${target.name} saves against Blindness.`); } else { target.effects.push({type:'blind', until:'round'}); } break; }
      case 'strength': { u.effects.push({type:'strength', str:4, until:'round'}); logLine(units, 'Strength fades in.'); break; }
      case 'haste': { u.effects.push({type:'haste', until:'round'}); logLine(units, 'You quicken!'); break; }
      case 'slow': { target.effects.push({type:'slow', until:'round'}); logLine(units, `${target.name} is slowed.`); break; }
      case 'hold_person': case 'hold_person_priest': { const save = Math.random()*20+1; if(save < 13){ target.effects.push({type:'held', until:'round'}); logLine(units, `${target.name} is held!`); } else { logLine(units, `${target.name} resists.`); } break; }
      case 'mirror_image': { u.effects.push({type:'mirror', until:'round'}); logLine(units, 'Reflections shift.'); break; }
      case 'stoneskin': { u.effects.push({type:'stoneskin', hits:8+(u.lv||1), until:'round'}); logLine(units, 'Stoneskin hardens you.'); break; }
      case 'fireball': { const r = 3; let dmg = 0; const hits = [[target.x,target.y]]; for(let dx=-r;dx<=r;dx++){ for(let dy=-r;dy<=r;dy++){ const nx = target.x+dx, ny = target.y+dy; if(nx<0||ny<0||nx>=GRID_W||ny>=GRID_H) continue; if(Math.abs(dx)+Math.abs(dy) > r*2) continue; const u2 = units.all.find(z=>z.x===nx&&z.y===ny&&!z.downed&&z.hp>0); if(u2){ const save = 13-Math.floor((u2.wis||10)/4); if(Math.random()*20+1 < save){ const dmg2 = 1+Math.floor(Math.random()*6); dmg += dmg2; damageUnit(units, u2, dmg2, u); } else { logLine(units, `${u2.name} resists Fireball.`, 'l-muted'); } } } } break; }
      case 'pain': break;
      case 'cure_light': case 'cure_serious': case 'cure_critical': { const healStr = sp.heal; const heal = rollDice(healStr,1); target.hp = Math.min(target.maxhp, target.hp + heal); if(target.ref) target.ref.hp = target.hp; logLine(units, `${target.name} healed ${heal}.`, 'l-good'); break; }
      case 'heal': { const heal = Math.max(0, target.maxhp - target.hp - (1+Math.floor(Math.random()*4))); target.hp = Math.min(target.maxhp, target.hp + heal); if(target.ref) target.ref.hp = target.hp; logLine(units, `${target.name} healed ${heal}.`, 'l-good'); break; }
      case 'aid': { const heal = 1+Math.floor(Math.random()*4)+1; target.hp = Math.min(target.maxhp, target.hp + heal); if(target.ref) target.ref.hp = target.hp; break; }
      case 'bless': { u.effects.push({type:'blessed', until:'round'}); break; }
      case 'prot_evil': case 'prot_evil_10': { u.effects.push({type:'prot_evil', until:'round'}); break; }
      case 'command': { logLine(units, 'Command spoken.'); break; }
      case 'remove_paralysis': case 'free_action': case 'neutralize_poison': case 'cure_blindness': { target.effects = target.effects.filter(e=>e.type!=='held' && e.type!=='stunned' && e.type!=='paralyzed' && e.type!=='poison' && e.type!=='blind'); logLine(units, `${target.name} is cleansed.`, 'l-good'); break; }
      case 'vampiric_touch': { damageUnit(units, target, 2, u); const heal = 2+Math.floor(Math.random()*4); u.hp = Math.min(u.maxhp, u.hp + heal); if(u.ref) u.ref.hp = u.hp; break; }
      case 'lightning_bolt': { const roll = 1+Math.floor(Math.random()*6); logLine(units, `${u.name} casts Lightning Bolt.`, 'l-spell'); damageUnit(units, target, roll, u); break; }
      case 'frost': break;
      case 'silence': { for(const z of units.all){ if(z.kind!=='pc') continue; z.effects.push({type:'silenced', until:'round'}); } logLine(units, 'Silence falls.', 'l-spell'); break; }
      case 'stoneskin': break;
      case 'death_spell': { const dmg = rollDice('6d6', 1); damageUnit(units, target, dmg, u); break; }
      case 'finger_of_death': { const dmg = 1+Math.floor(Math.random()*6); damageUnit(units, target, dmg, u); break; }
      case 'power_word_stun': { const save = Math.random()*20+1; if(save<15) target.effects.push({type:'stunned', until:'round'}); break; }
      case 'power_word_kill': { const save = Math.random()*20+1; if(save<16) damageUnit(units, target, 999, u); break; }
      case 'power_word_blind': { target.effects.push({type:'blind', until:'round'}); break; }
      case 'stoneskin_old': break;
      case 'fear': case 'scare': { logLine(units, 'Fear courses through!', 'l-spell'); target.effects.push({type:'afraid', until:'round'}); break; }
      case 'fear2': break;
      case 'fog': break;
      default: { logLine(units, `${sp.name} (unhandled generic).`, 'l-muted'); }
    }
  }

  // ---------- frame & cleanup ----------
  function drawFrame1(units){ drawFrame(units); }
  function cleanup(units){
    if(animFrame){ cancelAnimationFrame(animFrame); animFrame = null; }
    active = false;
    if(window.COMBAT_KEYS) window.COMBAT_KEYS = false;
    if(units.cv) units.cv.onclick = null;
    document.removeEventListener('keydown', combatKeys);
  }

  function combatKeys(e){
    if(!active) return;
    const units = S; if(!units || !units.active) return;
    const u = units.active;
    if(u.kind !== 'pc') return;
    const key = e.key.toLowerCase();
    if(key === ' ' || key === 'enter'){ e.preventDefault(); endTurnDirect(units); }
    else if(key === 'c'){ e.preventDefault(); promptCast(units, u); }
    else if(key === 'q'){ e.preventDefault(); startAuto(units, u); }
    else if(key === 'h'){ e.preventDefault(); tryHide(units, u); }
  }
  function endTurnDirect(units){ units.turnIdx++; if(units.turnIdx >= units.turnOrder.length) endRound(units); else startTurn(units); }
  function promptCast(units, u){
    const book = (u.ref.book||[]);
    const mem = (u.ref.mem||{});
    let avail = book.filter(id=>(mem[id]||0)>0);
    if(!avail.length){ logLine(units, 'No spells ready.'); return; }
    logLine(units, 'Choose a spell: ' + avail.map(id=>spName(id)).slice(0,6).join(', '), 'l-muted');
    // cycle through spells on each C press
    u._castIx = ((u._castIx||0)+1) % avail.length;
    const sid = avail[u._castIx];
    // log the chosen spell and prompt to click a tile
    logLine(units, 'Selected ' + spName(sid) + ' — click target.', 'l-spell');
    u._pendingSpell = sid;
    // overlay click: next click targets
    units._castMode = true;
  }
  function startAuto(units, u){
    units._autoBattle = !units._autoBattle;
    units.party.forEach(p=>p._auto = units._autoBattle);
    logLine(units, units._autoBattle?'Auto-battle ON. All PCs act.':'Auto-battle OFF.', 'l-muted');
    if(units._autoBattle && units.active && units.active.kind==='pc') autoTurn(units, units.active);
  }
  function tryHide(units, u){
    if(u.kind!=='pc') return;
    const adjacent = units.all.some(x=>x.kind==='mon' && !x.downed && Math.max(Math.abs(x.x-u.x),Math.abs(x.y-u.y))<=1);
    if(adjacent){ logLine(units, 'Cannot hide — foes adjacent.'); return; }
    u.hidden = !u.hidden; logLine(units, u.hidden?'You hide.':'You stand.', 'l-muted'); drawFrame(units);
  }
  function spName(id){ const s = window.DATA && window.DATA.SPELLS[id]; return s ? s.name : id; }

  return {start, isActive: () => active, drawFrame, reachableTiles, GRID_W, GRID_H, hitRoll: (n)=>1+Math.floor(Math.random()*20)};
})();
