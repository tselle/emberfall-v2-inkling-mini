/* campaign.js — create/import company state, kits, services, travel */
window.CAMP = (function(){
  const R = () => window.RULES;
  const DATA = () => window.DATA;

  function newCompany(pregensIds, gold, moduleCode){
    const roster = window.DATA.pregens().map(c=>Object.assign({}, c, {eq:Object.assign({}, c.eq), inv:(c.inv||[]).slice(), fx:{}, prep:{}, mem:{}, book:[]}));
    // pick pregens subset
    const selected = (pregensIds||[]).filter(id=>roster.find(r=>r.id===id));
    if(!selected.length) return null;
    // ensure selected hero pregens have kit applied
    selected.forEach(ch=>applyGrowthKit(ch));
    // prepare default spells
    selected.forEach(ch=>autoPrep(ch));
    return {roster, party:selected.map(c=>c.id), gold:gold??40, module:moduleCode, won:false, done:[], flags:{}, quests:{}, mods:{}, seen:{}, ground:{}, journal:[], bestiary:{}, meta:{leader:selected[0].name, where:'', when:'', saved:'', ts:Date.now(), mod:moduleCode, lvl:1}};
  }
  function applyGrowthKit(ch){
    // thresholds 3/5/9/13/17 — give kit gear (only if newly made / advancing)
    const thresholds = [3,5,9,13,17];
    for(const t of thresholds){ if((ch.lvl||1) >= t){ const kit = (window.ADVENTURES && window.ADVENTURES.KITS && window.ADVENTURES.KITS[t]) || null; if(!kit || !kit[ch.cls]) continue; const k = kit[ch.cls]; for(const slot in k){ if(slot==='notes') continue; ch.eq[slot] = k[slot]; } } }
  }
  function autoPrep(ch){
    if(ch.cls==='M'){
      if(!(ch.book||[]).length){ ch.book = ['magic_missile','sleep','armor','burning_hands','shield']; }
      const slots = R().MAGE_SLOTS[Math.min(19, Math.max(0, (ch.lvl||1)-1))] || {1:4};
      let prep = ch.prep && Object.keys(ch.prep).length ? Object.assign({}, ch.prep) : {};
      if(!Object.keys(prep).length){ // auto-fill
        for(const level in slots){ let n = slots[level]; for(let i=0;i<n;i++){ const sid = ch.book[Math.floor(i/1)]; if(sid){ prep[sid] = (prep[sid]||0)+1; } } }
        // stop if no matches
        if(!Object.keys(prep).length){ prep = {magic_missile:2, sleep:1, armor:1}; }
      }
      ch.prep = prep;
      if(!Object.keys(ch.mem||{}).length) ch.mem = Object.assign({}, ch.prep);
    } else if(ch.cls==='C'||ch.cls==='P'){
      const slots = ch.cls==='P' ? (R().PALADIN_SLOTS[Math.min(19, Math.max(0,(ch.lvl||1)-1))] || {}) : (R().CLERIC_SLOTS[Math.min(19, Math.max(0,(ch.lvl||1)-1))] || {});
      // give a default prep: heal if any slots
      const all = ch.book && ch.book.length ? ch.book : ['cure_light','bless','prayer'];
      ch.book = ch.book && ch.book.length ? ch.book : all.slice();
      let total = 0; for(const lvl in slots) total += slots[lvl];
      let prep = {};
      for(let i=0;i<Math.min(total, 3);i++){ const sid = ch.book[i % ch.book.length]; prep[sid] = (prep[sid]||0)+1; }
      ch.prep = prep; ch.mem = Object.assign({}, prep);
    }
  }
  function resolvedEq(ch){
    if(!ch) return {};
    const eq = {};
    const slot = (s) => ch.eq && ch.eq[s] ? DATA().ITEMS[ch.eq[s]] : null;
    const weapon = slot('melee'), missile = slot('missile'), armor = slot('armor'), shield = slot('shield');
    const cloak = slot('cloak'), st = slot('boots');
    eq.weapon = weapon; eq.missile = missile; eq.armor = armor; eq.shield = shield; eq.cloak = cloak;
    eq.str = (ch.str||10) + (slot('belt')&&slot('belt').str?slot('belt').str:0) + ringStr(ch);
    eq.dex = ch.dex||10;
    eq.mv = (R().RACES[ch.race]?R().RACES[ch.race].mv:12) + (st&&st.mv?st.mv:0);
    eq.ac = acOfOnly(ch);
    return eq;
  }
  function ringStr(ch){ let s = 0; ['ring1','ring2'].forEach(r=>{ const it = ch.eq && ch.eq[r] ? DATA().ITEMS[ch.eq[r]] : null; if(it && it.ring==='strength') s += 2; }); return s; }
  function acOfOnly(ch){
    if(!ch) return 10;
    const slot = (s) => ch.eq && ch.eq[s] ? DATA().ITEMS[ch.eq[s]] : null;
    let ac = 10;
    const armor = slot('armor');
    if(armor && armor.ac!=null){ ac = armor.ac; if(armor.enchant) ac -= armor.enchant; }
    const shield = slot('shield');
    if(shield){ ac -= 1 + (shield.enchant||0); }
    const cloak = slot('cloak');
    if(cloak && cloak.magDef) ac -= cloak.magDef;
    return ac;
  }
  function acOf(ch){ return acOfOnly(ch); }

  // ---------- travel ----------
  function travel(G, destModuleId){
    const dest = window.MODULES[destModuleId];
    if(!dest) return null;
    const hubMap = window.MAPS[dest.hub];
    if(!hubMap) return null;
    G.module = destModuleId;
    G.map = dest.hub; G.x = hubMap.start.x; G.y = hubMap.start.y; G.dir = hubMap.start.dir||0;
    G.time = G.time + 14*1440 - (G.time % 1440) + 8*60; // day +14 at 08:00
    G.march = 0;
    G.done = G.done||[];
    // advance roster to starting level
    for(const id of G.party||[]){
      const ch = G.roster.find(c=>c.id===id); if(!ch) continue;
      while(ch.lvl < dest.lvl){ levelUp(ch, dest.lvl); }
      if(ch.lvl >= dest.lvl) applyGrowthKit(ch);
      // heal living
      if(!ch.dead && !ch.lost){ ch.hp = ch.maxhp; }
      ch.prep = Object.assign({}, ch.prep||{}); ch.mem = Object.assign({}, ch.mem||{}); // restore prep
      ch.fx = {}; ch.poison = null; ch.layUsed = false;
    }
    autoPrepAll(G);
    G.meta = Object.assign(G.meta||{}, {leader:(G.roster.find(c=>c.id===G.party[0])||{}).name, where:hubMap.name, when:'', mod:destModuleId, lvl:partyLevel(G), ts:Date.now()});
    return {map:dest.hub, x:G.x, y:G.y, time:G.time, day:Math.floor(G.time/1440)+1};
  }
  function levelUp(ch, target){
    const R = window.RULES;
    const hdStr = ({F:'d10',P:'d10',R:'d10',M:'d4',C:'d8',T:'d6'})[ch.cls]||'d6';
    const dInt = parseInt(hdStr.slice(1));
    let hpGain;
    const con = Math.floor(((ch.con||10)-10)/2);
    const hpCap = 9; // roll through level 9, fixed after
    const lv = ch.lvl||1;
    const isMagic = ch.cls==='M';
    const rollUpTo = 10; // thieves/mages roll through ~10
    if(lv < rollUpTo){ hpGain = Math.max(1, 1+Math.floor(Math.random()*dInt) + con); }
    else { hpGain = ch.cls==='M'?1 : (ch.cls==='T'||ch.cls==='C'?2:3); }
    ch.lvl = lv+1;
    ch.hp = ch.maxhp + hpGain;
    ch.maxhp = (ch.maxhp||5) + hpGain;
    // prepare a new spell slot if any
    return ch;
  }
  function autoPrepAll(G){ for(const id of G.party||[]){ const ch = G.roster.find(c=>c.id===id); if(ch && !ch.dead) autoPrep(ch); } }
  function partyLevel(G){ if(!G || !G.party) return 1; const ls = G.party.map(id=>G.roster.find(c=>c.id===id)?.lvl).filter(Boolean); return ls.length?Math.max(...ls):1; }

  return {newCompany, autoPrep, resolvedEq, acOf, travel, levelUp, applyGrowthKit, partyLevel, autoPrepAll};
})();
