/* ui.js — DOM helpers, modal stack, command bar, party drawer, sheets, shops */
window.UI = (function(){
  const overlay = () => document.getElementById('overlay');
  const modalEl = () => document.getElementById('modal');
  const modalBody = () => document.getElementById('modalBody');

  function el(tag, cls, html){ const e = document.createElement(tag); if(cls) e.className = cls; if(html!==undefined) e.innerHTML = html; return e; }

  function modal(opts){
    return new Promise(resolve=>{
      const ov = overlay(), m = modalEl(), mb = modalBody();
      ov.classList.add('show'); m.classList.remove('hidden'); mb.innerHTML = '';
      const head = el('div','m-head'); head.innerHTML = '<h3>'+ (opts.title||'') +'</h3>'; mb.appendChild(head);
      const body = el('div','m-body');
      if(typeof opts.body === 'function') opts.body(body); else body.innerHTML = opts.body || '';
      mb.appendChild(body);
      const foot = el('div','m-foot');
      const buttons = opts.buttons || [{label:'Close',class:'btn',onClick:()=>resolve(null)}];
      buttons.forEach(b=>{
        const btn = el('button', 'btn '+(b.class||''), b.label);
        if(b.disabled) btn.disabled = true;
        btn.onclick = () => { if(b.onClick){ const r = b.onClick(body); if(!(r && r.keepOpen)) close(); } else close(); };
        foot.appendChild(btn);
      });
      mb.appendChild(foot);
      function close(){ ov.classList.remove('show'); m.classList.add('hidden'); mb.innerHTML=''; resolve(opts.value!==undefined?opts.value:null); }
      ov.onclick = () => close();
      modalStack.push({close});
    });
  }
  const modalStack = [];
  function closeTop(){ if(modalStack.length){ modalStack.pop().close(); } }
  function isModalOpen(){ return modalStack.length>0; }

  async function prompt(text, def){
    return new Promise(resolve=>{
      let input;
      modal({title:'Input', body:(body)=>{ body.innerHTML = '<p>'+text+'</p>'; const wrap = el('div','','<input id="__prow" class="input" style="width:100%;padding:10px;margin-top:10px;background:#12131c;color:#e9e2cf;border:1px solid #3a4055;border-radius:6px;" value="'+(def||'')+'">'); body.appendChild(wrap); input = wrap.querySelector('input'); input.focus(); input.select(); input.addEventListener('keydown',e=>{ if(e.key==='Enter'){ resolve(input.value.trim()); closeTop(); } }); },
        buttons:[{label:'OK',class:'btn btn-gold',onClick:()=>{ resolve((input?input.value.trim():'')); }}]});
    });
  }

  function log(msg, cls){
    const l = document.getElementById('log'); if(!l) return;
    const p = el('div', cls||'', msg); l.appendChild(p); l.scrollTop = l.scrollHeight;
    while(l.children.length>250) l.removeChild(l.firstChild);
  }

  function logHead(msg){ log('◆ '+msg, 'l-head'); }

  // party drawer
  function partyDrawer(){ return document.getElementById('partyDrawer'); }
  function toggleParty(open){
    const d = partyDrawer(); if(!d) return;
    if(open===undefined) open = !d.classList.contains('open');
    d.classList.toggle('open', open);
  }
  function buildPartyDrawer(G, state){
    const body = document.getElementById('partyBody'); if(!body) return;
    body.innerHTML = '';
    const party = (G.party||[]).map(id=>G.roster.find(c=>c.id===id)).filter(Boolean);
    for(const ch of party){
      const row = el('div','drow');
      const cv = el('canvas'); cv.width = 92; cv.height = 112;
      if(window.FIGURES) window.FIGURES.portraitChar(cv.getContext('2d'), ch, 92, 112);
      const info = el('div');
      const clsName = ({F:'Fighter',P:'Paladin',R:'Ranger',M:'Mage',C:'Cleric',T:'Thief'})[ch.cls]||ch.cls;
      const raceName = {human:'Human',dwarf:'Dwarf',elf:'Elf',gnome:'Gnome',half:'Half-Elf',half_elf:'Half-Elf',halfling:'Halfling'}[ch.race]||ch.race;
      info.innerHTML = `<div class="dname">${ch.name}</div><div class="dsub">${raceName} ${clsName} · L${ch.lvl}</div>
        <div class="hpbar ${(ch.hp/Math.max(1,ch.maxhp))<0.3?'low':''}"><i style="width:${Math.max(0,(ch.hp/Math.max(1,ch.maxhp))*100)}%"></i></div>
        <div class="dsub">HP ${ch.hp}/${ch.maxhp} · AC ${computedAC(ch)} · THAC0 ${window.RULES.thac0(ch)}</div>`;
      row.appendChild(cv); row.appendChild(info); body.appendChild(row);
    }
    if(!party.length) body.innerHTML = '<div class="empty">No party assembled.</div>';
  }

  function computedAC(ch){
    if(window.CAMP) return CAMP.acOf(ch);
    return 10;
  }

  // character sheet
  function sheet(G, ch, onClose){
    const body = (b) => buildSheet(b, G, ch);
    modal({title:ch.name, body, buttons:[{label:'Close',onClick:()=>{}}]});
  }
  function buildSheet(b, G, ch){
    const R = window.RULES;
    const eq = window.CAMP ? CAMP.resolvedEq(ch) : {};
    const ac = window.CAMP ? CAMP.acOf(ch) : 10;
    const thac0 = R.thac0(ch);
    const saves = R.saves(ch);
    const clsName = ({F:'Fighter',P:'Paladin',R:'Ranger',M:'Mage',C:'Cleric',T:'Thief'})[ch.cls]||ch.cls;
    const raceName = ({human:'Human',dwarf:'Dwarf',elf:'Elf',gnome:'Gnome',half:'Half-Elf',half_elf:'Half-Elf',halfling:'Halfling'})[ch.race]||ch.race;
    b.innerHTML = `
      <div class="sheet-grid">
        <div>
          <div style="display:flex;gap:12px;align-items:center;"><canvas id="sheetPortrait" width="120" height="140" style="border-radius:8px;background:#22242f;"></canvas></div>
          <div class="small">${raceName} ${clsName} · Level ${ch.lvl} · ${ch.align}</div>
          <div class="small">HP ${ch.hp}/${ch.maxhp} · XP ${ch.xp} · ${ch.spec||''}</div>
        </div>
        <div>
          <table class="tbl"><tr><th>STR</th><th>DEX</th><th>CON</th><th>INT</th><th>WIS</th><th>CHA</th></tr>
          <tr><td>${ch.str}</td><td>${ch.dex}</td><td>${ch.con}</td><td>${ch.int}</td><td>${ch.wis}</td><td>${ch.cha}</td></tr></table>
          <div class="kv" style="margin-top:8px;"><dt>AC</dt><dd>${ac}</dd><dt>THAC0</dt><dd>${thac0}</dd><dt>MV</dt><dd>${ch.mv||(raceSpeed(ch))}</dd></div>
          <div class="small" style="margin-top:6px;">Saves: ${saves.paralyz}/${saves.rod}/${saves.petrify}/${saves.breath}/${saves.spell}</div>
        </div>
      </div>
      <h4 style="margin:14px 0 6px;color:var(--gold);">Equipment</h4>
      <div id="equipGrid"></div>
      <h4 style="margin:14px 0 6px;color:var(--gold);">Pack</h4>
      <div id="packList" class="small"></div>
      <h4 style="margin:14px 0 6px;color:var(--gold);">Spells</h4>
      <div id="spellList" class="small"></div>`;
    if(window.FIGURES){ const cv = b.querySelector('#sheetPortrait'); window.FIGURES.portraitChar(cv.getContext('2d'), ch, 120, 140); }
    buildEquipGrid(b, ch);
    buildPackList(b, ch, G);
    buildSpellsList(b, ch, G);
  }
  function raceSpeed(ch){ const r = window.RULES.RACES[ch.race]; return r?r.mv:12; }

  function buildEquipGrid(b, ch){
    const grid = b.querySelector('#equipGrid'); if(!grid) return; grid.innerHTML='';
    const slots = Object.keys(ch.eq||{});
    for(const slot of ['melee','missile','armor','shield','ring1','ring2','cloak','boots','gloves','belt','neck','charm']){
      const id = ch.eq && ch.eq[slot];
      const it = id ? window.DATA.ITEMS[id] : null;
      const row = el('div','small'); row.style.cssText='padding:5px 0;border-bottom:1px solid #2a2e3d55;';
      row.innerHTML = `<b>${slot}</b>: ${it?it.name:'<i>—</i>'}`;
      grid.appendChild(row);
    }
  }
  function buildPackList(b, ch, G){
    const pl = b.querySelector('#packList'); if(!pl) return; pl.innerHTML='';
    (ch.inv||[]).forEach((id,i)=>{ const it = window.DATA.ITEMS[id]; const row = el('div','small'); row.style.cssText='padding:3px 0;'; row.innerHTML = `${it?it.name:id} <button class="btn btn-small" data-act="take" data-idx="${i}">Take</button> <button class="btn btn-small" data-act="drop" data-idx="${i}">Drop</button>`; pl.appendChild(row); });
    pl.addEventListener('click', e=>{
      const btn = e.target.closest('button'); if(!btn) return;
      const act = btn.dataset.act, idx = parseInt(btn.dataset.idx||'-1');
      if(act==='take'){ takeItem(G, ch, idx); b.innerHTML=''; buildSheet(b,G,ch); modalRefresh(b,G,ch); }
      if(act==='drop'){ dropItem(G, ch, idx); b.innerHTML=''; buildSheet(b,G,ch); }
    });
  }
  function buildSpellsList(b, ch, G){
    const sl = b.querySelector('#spellList'); if(!sl) return; sl.innerHTML='';
    const R = window.RULES;
    const isMage = ch.cls==='M' || (ch.cls==='C'||ch.cls==='P');
    if(!isMage){ sl.innerHTML = '<div class="small">No spells.</div>'; return; }
    const slots = ch.cls==='P' ? R.PALADIN_SLOTS[Math.max(0,Math.min(19,(ch.lvl||1)-1))] : (ch.cls==='M' ? R.MAGE_SLOTS[Math.max(0,Math.min(19,(ch.lvl||1)-1))] : R.CLERIC_SLOTS[Math.max(0,Math.min(19,(ch.lvl||1)-1))]);
    const book = (ch.book||[]).slice();
    for(const sid of book){ const sp = window.DATA.SPELLS[sid]; if(!sp) continue; const copies = (ch.mem||{})[sid]||0; const prep = (ch.prep||{})[sid]||0;
      const row = el('div','small'); row.style.cssText='padding:3px 0;border-bottom:1px solid #2a2e3d55;';
      row.innerHTML = `${sp.name} <span class="badge">L${sp.l}</span> <span class="gold">ready ${copies}</span> <span class="muted">prep ${prep}</span>`;
      sl.appendChild(row);
    }
    if(!book.length) sl.innerHTML = '<div class="small">No spells known.</div>';
  }
  function modalRefresh(b,G,ch){}

  function takeItem(G, ch, idx){
    const id = (ch.inv||[])[idx]; if(!id) return;
    if(!window.GAME) return;
    GAME.takeOnSheet(ch, idx);
    if(window.UI) buildPartyDrawer(G,null);
  }
  function dropItem(G, ch, idx){
    if(!window.GAME) return;
    GAME.dropOnSheet(ch, idx);
    if(window.UI) buildPartyDrawer(G,null);
  }

  // shop dialog
  function shop(G, buyer, shopDef, onDone){
    const body = (b) =>{
      b.innerHTML = `<div class="small">Buyer: <b>${buyer.name}</b> · Funds: <span class="gold">${G.gold} gp</span></div>
        <table class="tbl" style="margin-top:10px;"><thead><tr><th>Item</th><th>Price</th><th></th></tr></thead></table>`;
      const table = b.querySelector('table');
      const tbody = el('tbody');
      for(const itemId of (shopDef.stock||[])){
        const it = window.DATA.ITEMS[itemId]; if(!it) continue;
        const price = window.DATA.itemPrice(itemId) || it.price || 0;
        const row = el('tr'); row.innerHTML = `<td>${it.name}</td><td class="gold">${price} gp</td><td><button class="btn btn-small">Buy</button></td>`;
        row.querySelector('button').onclick = () => {
          if(G.gold < price){ alert('Not enough gold.'); return; }
          G.gold -= price; ch_addItem(buyer, itemId); row.remove(); buildGold();
          log(`${buyer.name} bought ${it.name}.`, 'l-good');
        };
        tbody.appendChild(row);
      }
      table.appendChild(tbody);
      // sell section
      const sellHead = el('h4','small','Sell pack gear'); b.appendChild(sellHead);
      const sellTable = el('table','tbl'); sellTable.innerHTML = '<thead><tr><th>Item</th><th>Sell for</th><th></th></tr></thead>';
      const stbody = el('tbody');
      (buyer.inv||[]).forEach((id,i)=>{ const it = window.DATA.ITEMS[id]; if(!it) return; if(it.type==='q') return; // quest items not sold
        const sellPrice = Math.floor((it.price||0)/2);
        const row = el('tr'); row.innerHTML = `<td>${it.name}</td><td class="gold">${sellPrice} gp</td><td><button class="btn btn-small">Sell</button></td>`;
        row.querySelector('button').onclick = () => { buyItem_consume(buyer,i); G.gold += sellPrice; row.remove(); buildGold(); log(`${buyer.name} sold ${it.name}.`,'l-good'); };
        stbody.appendChild(row);
      });
      sellTable.appendChild(stbody); b.appendChild(sellTable);
      const buildGold = () => { const el2 = b.querySelector('.gold'); if(el2) el2.textContent = G.gold + ' gp'; };
      buildGold();
    };
    modal({title:shopDef.name, body, buttons:[{label:'Leave',onClick:()=>{ if(onDone) onDone(); }}]});
  }
  function ch_addItem(ch, id){ ch.inv = ch.inv||[]; ch.inv.push(id); }
  function buyItem_consume(ch, i){ ch.inv.splice(i,1); }

  return {el, modal, closeTop, isModalOpen, log, logHead, toggleParty, buildPartyDrawer, sheet, shop, prompt, el_h:el};
})();
