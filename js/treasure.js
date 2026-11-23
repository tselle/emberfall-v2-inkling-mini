/* treasure.js — enchanted items, seeded treasure rolls */
window.TREASURE = (function(){
  const DATA = window.DATA;
  // item tiers for treasure gen: weight <4 rare excluded from shops
  const CATALOG = [
    // potions
    {id:'potion_heal',cat:'potions',tier:1,w:3},{id:'potion_heal2',cat:'potions',tier:3,w:2},
    {id:'potion_antivenom',cat:'potions',tier:1,w:3},{id:'potion_strength',cat:'potions',tier:2,w:2},
    {id:'potion_invis',cat:'potions',tier:3,w:2},{id:'potion_death',cat:'potions',tier:3,w:2},
    // scrolls
    {id:'scroll_fireball',cat:'scrolls',tier:3,w:2},{id:'scroll_magic_missile',cat:'scrolls',tier:1,w:3},
    {id:'scroll_armor',cat:'scrolls',tier:1,w:3},{id:'scroll_knock',cat:'scrolls',tier:1,w:3},
    {id:'scroll_lightning_bolt',cat:'scrolls',tier:4,w:2},{id:'scroll_sleep',cat:'scrolls',tier:2,w:2},
    {id:'scroll_mirror_image',cat:'scrolls',tier:2,w:2},{id:'scroll_invisibility',cat:'scrolls',tier:3,w:2},
    {id:'scroll_fireball_legacy',cat:'scrolls',tier:3,w:2},
    // rings
    {id:'ring_wizardry',cat:'rings',tier:3,w:1},{id:'ring_protection',cat:'rings',tier:3,w:2},
    {id:'ring_strength',cat:'rings',tier:2,w:2},{id:'ring_fly',cat:'rings',tier:4,w:1},
    // devices
    {id:'wand_magic_missile',cat:'devices',tier:2,w:2},{id:'wand_fireball',cat:'devices',tier:3,w:2},
    {id:'wand_sleep',cat:'devices',tier:2,w:2},{id:'rod_lightning',cat:'devices',tier:4,w:2},
    {id:'rod_weapon',cat:'devices',tier:4,w:2},{id:'rod_resurrect',cat:'devices',tier:5,w:1},
    // miscellaneous
    {id:'gem',cat:'misc',tier:2,w:2},{id:'gem2',cat:'misc',tier:3,w:2},{id:'crown',cat:'misc',tier:4,w:1},
    {id:'cloak_magic',cat:'misc',tier:3,w:2},{id:'boots_speed',cat:'misc',tier:3,w:2},{id:'belt_strength',cat:'misc',tier:3,w:2},
    // armor/shields
    {id:'leather_1',cat:'armor',tier:2,w:3},{id:'chain_1',cat:'armor',tier:3,w:2},{id:'plate_1',cat:'armor',tier:4,w:2},
    {id:'shield_1',cat:'armor',tier:3,w:2},
    // swords
    {id:'long_sword_1',cat:'swords',tier:3,w:2},{id:'broad_sword_1',cat:'swords',tier:3,w:2},
    {id:'short_sword_1',cat:'swords',tier:2,w:2},{id:'dagger_1',cat:'swords',tier:2,w:2},{id:'mace_1',cat:'swords',tier:2,w:2},
    // other weapons
    {id:'long_bow_1',cat:'weapons',tier:3,w:2},{id:'crossbow_1',cat:'weapons',tier:4,w:2},{id:'axe_1',cat:'weapons',tier:3,w:2},
    {id:'spear_1',cat:'weapons',tier:2,w:2},{id:'warhammer_1',cat:'weapons',tier:3,w:2}
  ];
  const WEIGHTS = {potions:20,scrolls:15,rings:5,devices:5,misc:15,armor:15,swords:11,weapons:14};
  // generated scroll item IDs: scroll_fireball, scroll_magic_missile, ... already in ITEMS? data.js generates scroll_<id> for top-level spells
  function ensureScroll(id){ if(!DATA.ITEMS['scroll_'+id]) DATA.ITEMS['scroll_'+id] = {id:'scroll_'+id,type:'x',slot:'scroll',name:'Scroll of '+id.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),price:50,scroll:id,price:50}; }
  CATALOG.forEach(c=>{ if(c.id.startsWith('scroll_')) ensureScroll(c.id.slice(7)); });

  function roll(rng, chLevel, kind){
    // kind: 'chest' (1), 'cache' (2), 'hoard' (6)
    const tier = Math.max(1, Math.min(5, Math.ceil(chLevel/4)));
    const weights = Object.assign({}, WEIGHTS);
    // favor newer tiers at depth: bump weights for higher tiers if kind==='hoard'
    const total = Object.values(weights).reduce((a,b)=>a+b,0);
    let r = rng()*total, cat='misc';
    for(const k in weights){ if(r < weights[k]){ cat=k; break; } r-=weights[k]; }
    const pool = CATALOG.filter(c=>c.cat===cat && c.tier <= (kind==='hoard'?Math.min(5,tier+1):tier));
    const pick = (pool.length?pool:CATALOG.filter(c=>c.tier<=tier));
    const item = pick[Math.floor(rng()*pick.length)] || CATALOG[0];
    let gold = Math.round((25*Math.pow(chLevel,1.45)) * (0.6 + rng()*0.8));
    gold = Math.round(gold/5)*5;
    const mult = kind==='hoard'?6:(kind==='cache'?2:1);
    gold = Math.round(gold*mult/5)*5;
    const items = [item.id];
    if(kind==='hoard'){ items.push('potion_heal'); if(rng()<0.5) items.push('gem'); }
    return {gold, items, category:cat};
  }
  return {roll, CATALOG, ensureScroll};
})();
