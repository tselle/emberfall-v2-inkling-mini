/* data.js — base ITEMS, SHOPS, SPELLS, MONSTERS, MAPS, QUESTS, pregens */
window.DATA = (function(){
  // ---------- helpers ----------
  function item(id, type, slot, name, price, desc, extra){
    return Object.assign({id, type, slot, name, price, desc:desc||''}, extra||{});
  }
  const ITEMS = {};
  const I = (id, type, slot, name, price, desc, extra) => { ITEMS[id] = item(id,type,slot,name,price,desc,extra); return id; };

  // ---------- weapons (melee) ----------
  I('long_sword','w','melee','Long Sword',15,'1d8+STR, spd 4',{w:'1d8',spd:4,dmg:'1d8',price:15,cat:'sword'});
  I('broad_sword','w','melee','Broad Sword',30,'1d10+STR, spd 5',{w:'1d10',spd:5,dmg:'1d10',price:30,cat:'sword'});
  I('short_sword','w','melee','Short Sword',7,'1d6+STR, spd 4',{w:'1d6',spd:4,dmg:'1d6',price:7,cat:'sword'});
  I('dagger','w','melee','Dagger',5,'1d4, spd 3',{w:'1d4',spd:3,dmg:'1d4',price:5,cat:'dagger'});
  I('mace','w','melee','Mace',8,'1d6, blunt, spd 5',{w:'1d6',spd:5,dmg:'1d6',price:8,blunt:1,cat:'blunt'});
  I('club','w','melee','Club',6,'1d8, blunt, spd 5',{w:'1d8',spd:5,dmg:'1d8',price:6,blunt:1,cat:'blunt'});
  I('axe','w','melee','Axe',12,'1d8, spd 6',{w:'1d8',spd:6,dmg:'1d8',price:12,cat:'axe'});
  I('spear','w','melee','Spear',7,'1d6, spd 3',{w:'1d6',spd:3,dmg:'1d6',price:7,cat:'spear'});
  I('warhammer','w','melee','Warhammer',25,'1d12, blunt, spd 7',{w:'1d12',spd:7,dmg:'1d12',price:25,blunt:1,cat:'blunt'});
  I('staff','w','melee','Staff',12,'1d2, spd 6, magic focus',{w:'1d2',spd:6,dmg:'1d2',price:12,cat:'staff'});
  I('handaxe','w','melee','Handaxe',8,'1d6, spd 4',{w:'1d6',spd:4,dmg:'1d6',price:8,cat:'axe'});
  // fist fallback
  I('fist','w','melee','Fist',0,'1d2 unarmed',{w:'1d2',spd:3,dmg:'1d2',price:0,cat:'blunt'});

  // ---------- missile ----------
  I('long_bow','r','missile','Long Bow',50,'1d8, 36ft, spd 6',{w:'1d8',spd:6,dmg:'1d8',range:36,price:50});
  I('short_bow','r','missile','Short Bow',12,'1d6, 18ft, spd 3',{w:'1d6',spd:3,dmg:'1d6',range:18,price:12});
  I('crossbow','r','missile','Crossbow',90,'1d8, 24ft, spd 5',{w:'1d8',spd:5,dmg:'1d8',range:24,price:90});
  I('sling','r','missile','Sling',5,'1d4, 12ft, spd 3',{w:'1d4',spd:3,dmg:'1d4',range:12,price:5});
  I('darts','r','missile','Darts',6,'1d4, 12ft, spd 2',{w:'1d4',spd:2,dmg:'1d4',range:12,price:6});
  I('javelin','r','missile','Javelin',10,'1d6, 24ft, spd 4',{w:'1d6',spd:4,dmg:'1d6',range:24,price:10});

  // ---------- armor ----------
  I('no_armor','a','armor','Cloth Garb',0,'No armor',{ac:10,price:0});
  I('leather','a','armor','Leather Armor',10,'AC 7',{ac:7,price:10});
  I('studded_leather','a','armor','Studded Leather',30,'AC 5',{ac:5,price:30});
  I('chain','a','armor','Chain Mail',60,'AC 4',{ac:4,price:60});
  I('splint','a','armor','Splintmail',40,'AC 5',{ac:5,price:40});
  I('plate','a','armor','Plate Armor',200,'AC 0',{ac:0,price:200});
  I('chain_light','a','armor','Light Chain',40,'AC 5',{ac:5,price:40});
  I('robe','a','armor','Mage Robe',15,'AC 8',{ac:8,price:15});

  // ---------- shields ----------
  I('shield','s','shield','Shield',15,'+1 AC',{def:1,price:15});
  I('tower_shield','s','shield','Tower Shield',45,'+2 AC',{def:2,price:45});

  // ---------- cloaks / worn ----------
  I('cloak','m','cloak','Travel Cloak',12,'+0, heavy',{def:0,price:12,magDef:0});
  I('cloak_magic','m','cloak','Cloak of Protection',180,'+2 AC ward vs element',{def:2,price:180,magDef:2});
  I('cloak_invis','m','cloak','Cloak of Invisibility',450,'Invisibility while worn',{def:0,price:450,invis:1});
  I('boots','m','boots','Traveler Boots',8,'+1 move',{mv:1,price:8});
  I('boots_speed','m','boots','Boots of Speed',300,'+4 move',{mv:4,price:300});
  I('belt_strength','m','belt','Belt of Giant Strength',150,'+2 STR',{str:2,price:150});
  I('gloves','m','gloves','Leather Gloves',6,'+0',{price:6});
  I('neck','m','neck','Pendant',30,'+0',{price:30});
  I('charm','m','charm','Silver Charm',20,'+1 save vs undead',{price:20});

  // ---------- rings ----------
  I('ring_wizardry','m','ring1','Ring of Wizardry',220,'Double spell slots',{ring:'wizardry',price:220});
  I('ring_protection','m','ring2','Ring of Protection',150,'+2 AC vs all',{ring:'protection',price:150});
  I('ring_strength','m','ring1','Ring of Strength',140,'+2 STR',{ring:'strength',price:140});
  I('ring_fly','m','ring2','Ring of Flight',300,'Fly swiftly',{ring:'fly',price:300});
  I('ring_protection2','m','ring2','Ring of Protection',150,'+2 AC',{ring:'protection',price:150});

  // ---------- staffs ----------
  I('staff_magic','w','melee','Staff of Power',220,'1d2, casting focus',{w:'1d2',spd:6,dmg:'1d2',price:220,staff:1,cat:'staff'});

  // ---------- enchanted (silver +1/+2) ----------
  I('long_sword_silver','w','melee','Long Sword (Silver)',250,'silver, vs undead',{w:'1d8',spd:4,dmg:'1d8',price:250,vsUndead:1,silver:1,enchant:0});
  I('long_sword_1','w','melee','Long Sword +1',200,'+1 to hit/damage',{w:'1d8',spd:4,dmg:'1d8',price:200,enchant:1,cat:'sword'});
  I('broad_sword_1','w','melee','Broad Sword +1',300,'+1 to hit/damage',{w:'1d10',spd:5,dmg:'1d10',price:300,enchant:1,cat:'sword'});
  I('short_sword_1','w','melee','Short Sword +1',120,'+1 to hit/damage',{w:'1d6',spd:4,dmg:'1d6',price:120,enchant:1,cat:'sword'});
  I('dagger_1','w','melee','Dagger +1',150,'+1 to hit/damage',{w:'1d4',spd:3,dmg:'1d4',price:150,enchant:1,cat:'dagger'});
  I('mace_1','w','melee','Mace +1',150,'+1 to hit/damage',{w:'1d6',spd:5,dmg:'1d6',price:150,enchant:1,blunt:1,cat:'blunt'});
  I('warhammer_1','w','melee','Warhammer +1',280,'+1 to hit/damage',{w:'1d12',spd:7,dmg:'1d12',price:280,enchant:1,blunt:1,cat:'blunt'});
  I('axe_1','w','melee','Axe +1',220,'+1 to hit/damage',{w:'1d8',spd:6,dmg:'1d8',price:220,enchant:1,cat:'axe'});
  I('spear_1','w','melee','Spear +1',130,'+1 to hit/damage',{w:'1d6',spd:3,dmg:'1d6',price:130,enchant:1,cat:'spear'});
  I('long_bow_1','r','missile','Long Bow +1',300,'+1 to hit/damage',{w:'1d8',spd:6,dmg:'1d8',range:36,price:300,enchant:1});
  I('crossbow_1','r','missile','Crossbow +1',350,'+1 to hit/damage',{w:'1d8',spd:5,dmg:'1d8',range:24,price:350,enchant:1});
  I('leather_1','a','armor','Leather +1',60,'AC 6',{ac:6,price:60,enchant:1});
  I('chain_1','a','armor','Chain Mail +1',140,'AC 3',{ac:3,price:140,enchant:1});
  I('plate_1','a','armor','Plate Armor +1',300,'AC -1',{ac:-1,price:300,enchant:1});
  I('shield_1','s','shield','Shield +1',60,'+2',{def:2,price:60,enchant:1});

  // ---------- potions ----------
  I('potion_heal','p','potion','Healing Potion',30,'Restores 2d4+2 HP (camp/battle)',{potion:'heal',dmg:'2d4+2',price:30});
  I('potion_heal2','p','potion','Greater Healing Potion',120,'Restores 4d6+4',{potion:'heal',dmg:'4d6+4',price:120});
  I('potion_antivenom','p','potion','Antidote',40,'Removes venom',{potion:'antivenom',price:40});
  I('potion_strength','p','potion','Potion of Strength',80,'+4 STR for 1 hour',{potion:'strength',price:80});
  I('potion_invis','p','potion','Potion of Invisibility',200,'Invisible for 1 hour',{potion:'invis',price:200});
  I('potion_death','p','potion','Potion of Death',250,'Causes damage 2d6',{potion:'death',dmg:'2d6',price:250});

  // ---------- scrolls (id scroll:<spellId>) ----------
  // created dynamically below
  // ---------- devices ----------
  I('wand_magic_missile','d','device','Wand of Magic Missile',80,'3 charges: Magic Missile',{device:'magic_missile',charges:3});
  I('wand_fireball','d','device','Wand of Fireball',150,'2 charges: Fireball',{device:'fireball',charges:2});
  I('wand_sleep','d','device','Wand of Sleep',100,'2 charges: Sleep',{device:'sleep',charges:2});
  I('rod_lightning','d','device','Rod of Lightning',300,'2 charges: Lightning Bolt',{device:'lightning_bolt',charges:2});
  I('rod_weapon','d','device','Rod of Weapon',350,'5 charges: enchant weapon +2',{device:'weapon',charges:5});
  I('rod_resurrect','d','device','Rod of Resurrection',4000,'1 charge: Resurrection',{device:'resurrection',charges:1});
  I('scroll_protection','x','scroll','Scroll of Protection',60,'Wards party vs one tag',{scroll:'protection',price:60});
  I('scroll_spear','x','scroll','Scroll of Spear',40,'Spear throw',{scroll:'spear',price:40});
  I('scroll_armor','x','scroll','Scroll of Armor',25,'AC 6 for 8+level dmg',{scroll:'armor',price:25});
  I('scroll_knock','x','scroll','Scroll of Knock',20,'Unlocks a locked door',{scroll:'knock',price:20});

  // ---------- valuables / quest ----------
  I('gem','v','value','Gem',120,'Valuable gem',{value:120});
  I('gem2','v','value','Valuable Jewel',260,'Valuable jewel',{value:260});
  I('crown','v','value','Gold Crown',900,'Ornate crown',{value:900});
  I('ring_widow','v','value','Widow Marrow’s Ring',400,'Quest item: Widow’s Ring',{quest:'ring_widow',value:400});
  I('dagger_plus1','w','melee','Dagger +1',150,'Special quest dagger',{w:'1d4',spd:3,dmg:'1d4',price:150,enchant:1,quest:'dagger',cat:'dagger'});
  I('cellar_key','q','quest','Brass Cellar Key',0,'Quest item: key to the brass cellar',{quest:'cellar_key'});
  I('ogre_iron_key','q','quest','Ogre’s Iron Key',0,'Quest item: opens the locked descent',{quest:'ogre_iron_key'});
  I('dawn_reliquary','q','quest','Dawn Reliquary',0,'Quest item: the Dawn Reliquary',{quest:'dawn_reliquary'});
  I('iron_king_seal','q','quest','Iron King’s Seal',0,'Quest item: the King’s seal',{quest:'iron_king_seal'});
  I('iron_king_blade','w','melee','Iron King’s Blade',0,'Enchanted quest blade',{w:'1d10',spd:5,dmg:'1d10',price:0,enchant:2,quest:'iron_king_blade',locked:1,cat:'sword'});
  I('tally_book','q','quest','Foreman’s Tally Book',0,'Quest item: tally book',{quest:'tally_book'});
  I('patrol_badge','q','quest','Patrol Badge',0,'Quest item: one of twelve badges',{quest:'patrol_badge'});
  I('tamsin_lock','q','quest','Tamsin’s Lock',0,'Quest item: amulet key',{quest:'tamsin_lock'});

  // ---------- spell scrolls: create per wizard/priest spell ----------
  const SPELLS = {};
  const S = (id,name,c,l,tgt,range,desc,extra) => { SPELLS[id] = Object.assign({id,name,c,l,tgt,range,desc},extra||{}); return id; };
  S('magic_missile','Magic Missile','M',1,'enemy',30,'Missiles 1d4+1',{r:0});
  S('sleep','Sleep','M',1,'area',20,'Sleeps creatures',{r:3});
  S('burning_hands','Burning Hands','M',1,'cone',10,'Cone of flame 1d4/2',{r:0,len:6});
  S('armor','Armor','C',1,'self',0,'AC 6 for 8+level damage',{explore:1,self:1});
  S('shield','Shield','M',1,'self',0,'Shield negates missile',{self:1});
  S('color_spray','Color Spray','M',1,'self',0,'Blend in briefly',{self:1});
  S('spook','Spook','M',1,'area',10,'Terrify creatures',{r:3});
  S('stinking_cloud','Stinking Cloud','M',2,'area',20,'Persistent cloud',{r:3});
  S('mirror_image','Mirror Image','M',2,'self',0,'Shifting reflections',{self:1});
  S('strength','Strength','M',2,'self',0,'+4 to STR for 1 hour',{self:1,explore:1,dur:'1h'});
  S('knock','Knock','M',2,'door',0,'Unlocks a locked door',{explore:1,door:1});
  S('web','Web','M',2,'area',15,'Ensnarls creatures',{r:3});
  S('acid_arrow','Acid Arrow','M',2,'enemy',25,'Fires acid dart 1d6',{range:25});
  S('invisibility','Invisibility','M',2,'self',0,'Unseen for a time',{self:1});
  S('blindness','Blindness','M',2,'enemy',20,'Blinds on save fail',{range:20});
  S('scare','Scare','M',2,'area',15,'Frightens area',{r:3});
  S('fireball','Fireball','M',3,'area',30,'Up to 10d6 in radius 2.3',{r:3});
  S('lightning_bolt','Lightning Bolt','M',3,'line',30,'Line of damage',{range:30,len:10});
  S('haste','Haste','M',3,'party',20,'Double movement/attacks',{party:1});
  S('hold_person','Hold Person','M',3,'enemy',20,'Holds on failed save',{range:20});
  S('slow','Slow','M',3,'enemy',20,'Halves movement',{range:20});
  S('dispel_magic','Dispel Magic','C',3,'area',30,'Dispels magics',{r:4});
  S('vampiric_touch','Vampiric Touch','M',3,'enemy',4,'Heal on touch',{range:2});
  S('ice_storm','Ice Storm','M',4,'area',20,'Ice damage',{r:3});
  S('stoneskin','Stoneskin','M',4,'self',0,'Negation of blows',{self:1});
  S('fear','Fear','M',4,'area',25,'Fear of area',{r:3,range:25});
  S('cone_of_cold','Cone of Cold','M',5,'cone',20,'Cone of ice 1d8',{len:5,range:20});
  S('hold_monster','Hold Monster','M',5,'enemy',20,'Hold a monster',{range:20});
  S('cloudkill','Cloudkill','M',5,'area',20,'Poison cloud',{r:3});
  S('chain_lightning','Chain Lightning','M',6,'enemy',30,'Lightning jumps',{range:30});
  S('disintegrate','Disintegrate','M',6,'enemy',20,'Disintegration',{range:20});
  S('flesh_to_stone','Flesh to Stone','M',6,'enemy',20,'Petrify on failed save',{range:20});
  S('death_spell','Death Spell','M',6,'enemy',25,'Death 6d6',{range:25});
  S('delayed_blast_fireball','Delayed Blast Fireball','M',7,'area',25,'Delayed fireball',{r:3,range:25});
  S('finger_of_death','Finger of Death','M',7,'enemy',30,'Finger of death',{range:30});
  S('power_word_stun','Power Word Stun','M',7,'enemy',30,'Stun on failed save',{range:30});
  S('incendiary_cloud','Incendiary Cloud','M',8,'area',20,'Burning cloud',{r:3,range:20});
  S('power_word_blind','Power Word Blind','M',8,'enemy',30,'Blind on failed save',{range:30});
  S('meteor_swarm','Meteor Swarm','M',9,'area',40,'Meteors 8d6',{r:4,range:40});
  S('power_word_kill','Power Word Kill','M',9,'enemy',30,'Instant kill on failed save',{range:30});
  S('cure_light','Cure Light Wounds','C',1,'ally',20,'Heal 1d8',{heal:'1d8',target:'ally'});
  S('bless','Bless','C',1,'party',0,'Blessing for 1d4 rounds',{party:1,bless:1});
  S('prot_evil','Protection From Evil','C',1,'party',20,'Ward vs evil',{party:1,evil:1});
  S('command','Command','C',1,'enemy',30,'Command willing',{range:30});
  S('cause_light','Cause Light Wounds','C',1,'enemy',20,'Pain 1d6',{range:20});
  S('magical_stone','Magical Stone','C',1,'self',0,'Charm the stone',{self:1});
  S('hold_person_priest','Hold Person','C',2,'enemy',20,'Hold on failed save',{range:20});
  S('aid','Aid','C',2,'ally',20,'Heal 1d4+1',{heal:'1d4+1',target:'ally'});
  S('slow_poison','Slow Poison','C',2,'ally',20,'Slows venom',{target:'ally',poison:1});
  S('silence','Silence 15′ Radius','C',2,'area',0,'Silence',{r:2,silence:1});
  S('resist_fire_cold','Resist Fire/Cold','C',2,'party',20,'Resist fire/cold',{party:1,resist:'fire_cold'});
  S('prayer','Prayer','C',3,'party',20,'Prayer buff',{party:1});
  S('remove_paralysis','Remove Paralysis','C',3,'ally',20,'Cures paralysis',{target:'ally'});
  S('magical_vestment','Magical Vestment','C',3,'self',0,'Vestment +2 AC',{self:1});
  S('cause_blindness','Cause Blindness','C',3,'enemy',20,'Blind on failed save',{range:20});
  S('cure_blindness','Cure Blindness','C',3,'ally',20,'Cures blindness',{target:'ally'});
  S('cure_serious','Cure Serious Wounds','C',4,'ally',20,'Heal 2d8+1',{heal:'2d8+1',target:'ally'});
  S('neutralize_poison','Neutralize Poison','C',4,'ally',20,'Cures poison',{target:'ally'});
  S('cause_serious','Cause Serious Wounds','C',4,'enemy',20,'Harm 2d8',{range:20});
  S('free_action','Free Action','C',4,'ally',20,'Freed from hold/stun',{target:'ally'});
  S('prot_evil_10','Protection From Evil 10′ Radius','C',4,'area',0,'Ward vs evil',{r:1,evil:1});
  S('cure_critical','Cure Critical Wounds','C',5,'ally',20,'Heal 3d8+3',{heal:'3d8+3',target:'ally'});
  S('flame_strike','Flame Strike','C',5,'cone',20,'Cone of flame',{len:5,range:20,dmg:'2d6'});
  S('cause_critical','Cause Critical Wounds','C',5,'enemy',20,'Harm 3d8',{range:20});
  S('slay_living','Slay Living','C',5,'enemy',20,'Slay on failed save',{range:20});
  S('dispel_evil','Dispel Evil','C',5,'area',20,'Dispels evil magics',{r:4});
  S('raise_dead','Raise Dead','C',5,'ally',0,'Raises a dead ally',{corpse:1});
  S('heal','Heal','C',6,'ally',20,'Heals most missing',{heal:'heal',target:'ally'});
  S('blade_barrier','Blade Barrier','C',6,'self',0,'Barrier vs magic',{self:1});
  S('harm','Harm','C',6,'enemy',25,'Harm 8d6',{range:25});
  S('holy_word','Holy Word','C',7,'area',20,'Holy blast',{r:3,range:20});
  S('destruction','Destruction','C',7,'enemy',30,'Destruction',{range:30});
  S('resurrection','Resurrection','C',7,'ally',0,'Raise at full HP',{corpse:1});

  // spell scrolls generated: id scroll:<spell>
  for(const id in SPELLS){ const sp=SPELLS[id]; ITEMS['scroll_'+id] = item('scroll_'+id,'x','scroll','Scroll of '+sp.name, 40+sp.l*30, 'Read a scroll to learn/use '+sp.name, {scroll:id, price:40+sp.l*30, learn:1}); }

  function itemPrice(id){ const it=ITEMS[id]; return it?(it.price||0):0; }

  // ---------- monsters (saga) ----------
  const MONSTERS = {};
  const M = (id,name,hd,hp,ac,mv,thac0,atk,size,ml,xp,gold,tags,fig,lore,extra) => { MONSTERS[id] = Object.assign({id,name,hd,hp:hp,ac,mv,thac0,atk:atk,size:size||1,ml:ml||0,xp:xp||0,gold:gold||0,tags:tags||[],fig:fig||'humanoid',lore:lore||''},extra||{}); return id; };

  M('giant_rat','Giant Rat','0.5','1d4',5,'8','17',['1d4'],0.5,0,15,3,['vermin'],'rat','A fat, ancient-looking rat.',{hp:'1d4'});
  M('giant_centipede','Giant Centipede','1.0','1d8',5,'8','16',['1d6'],0.5,0,40,5,['vermin','poison'],'centipede','A many-legged crawler.',{});
  M('kobold','Kobold','0.5','1d4+2',4,'8','15',['1d6'],0.5,2,25,10,['goblin','cave'],'humanoid','Sneaky thief in a hoard.',{ranged:{dmg:'1d4',range:18,spd:2}});
  M('kobold_chief','Kobold Chieftain','2.5','2d8+5',3,'8','13',['1d6'],1,2,120,60,['goblin','cave'],'humanoid','Trumpeter of the hoard.',{ranged:{dmg:'1d4',range:18,spd:2},leader:1});
  M('beetle','Beetle Swarm','1.0','1d8+2',5,'6','15',['1d6'],0.5,0,35,4,['vermin'],'insect','Erratic, many-legged.',{});
  M('skarrik','Skarrik the Kettle-Crowned','5.0','5d8+20',2,'8','12',['1d8'],1,3,350,150,['humanoid','cave'],'humanoid','A greasy kobold king.',{leader:1,hpBonus:20});
  M('ghoul','Ghoul','3.4','3d8+3',3,'8','13',['1d8'],1,1,200,20,['undead'],'ghoul','Shambling grave-eater.',{});
  M('skeleton','Skeleton','2.3','2d8+3',3,'6','14',['1d6'],1,1,150,10,['undead'],'skeleton','A boney foe.',{});
  M('wolf','Dire Wolf','3.4','3d8+3',4,'16','13',['1d6'],1,0,180,15,['beast'],'wolf','Fast and hungry.',{});
  M('gnoll_warrior','Gnoll Warrior','3.4','3d8+3',3,'10','13',['1d6'],1,1,180,25,['goblin','beast'],'wolf','Pack-leader and tracker.',{});
  M('ogre','Ogre','6.6','6d10+3',3,'6','11',['1d12'],2,3,450,80,['giant'],'ogre','Huge and slow.',{});
  M('goblin','Goblin','0.9','1d8−1',4,'8','15',['1d4'],0.5,2,20,8,['goblin'],'humanoid','Small and quick.',{});
  M('elf_archer','Forest Elf Archer','3.4','3d8+3',3,'10','13',['1d6'],1,0,180,40,['elf'],'humanoid','A watcher in the tree shadows.',{ranged:{dmg:'1d6',range:30,spd:5}});
  M('orc','Orc','4.6','4d8+6',3,'8','12',['1d8'],1,2,350,50,['orc'],'humanoid','Brutal fighter.',{});
  M('troll','Troll','8.6','8d10+6',2,'8','10',['1d12'],2,3,600,150,['giant','undead'],'troll','Ancient, regenerating.',{regenerate:1});
  M('troll_regenerating','Regenerating Troll','9.6','9d10+6',2,'8','10',['1d12'],2,3,700,200,['giant','undead'],'troll','Heals each round.',{regenerate:2});
  M('gargoyle','Gargoyle','4.0','4d8+4',2,'8','12',['1d8'],2,0,300,90,['undead','flying'],'gargoyle','Immutable stone-skin.',{});
  M('hell_hound','Hell Hound','3.0','3d6+4',2,'16','12',['1d8'],1,1,250,40,['beast','fire'],'wolf','Burning and cruel.',{});
  M('raven_witch','Raven Witch','5.0','5d8+8',2,'8','11',['1d6'],1,1,380,120,['undead','mage'],'woman','Witch clad in raven feathers.',{caster:5});
  M('devil','Devil','6.0','6d10+14',2,'10','11',['1d10'],1,4,700,200,['demon','evil'],'devil','Dreadful tempter.',{evil:1});
  M('giant','Hill Giant','8.4','8d10+4',2,'8','9',['1d12'],2,3,700,150,['giant','evil'],'ogre','Massive warlord.',{leader:1});
  M('dragon','Red Dragon','12.0','12d10+14',1,'10','8',['1d12'],2,4,1200,400,['dragon','evil'],'dragon','Ancient fire-breather.',{leader:1,flying:1,breath:{dmg:'1d6',range:20,save:'breath'}});
  M('mage_npc','Fallen Mage','5.0','5d4+10',3,'8','11',['1d6'],1,1,350,150,['mage'],'wizard','A brittle necromancer.',{caster:5});
  M('bandit','Bandit','2.0','2d8+4',4,'8','13',['1d6'],1,1,120,30,['humanoid'],'humanoid','Road robber.',{});
  M('warlock','Warlock','4.0','4d6+4',3,'8','12',['1d6'],1,2,300,80,['mage'],'wizard','Dark caster.',{caster:4});
  M('minderth','Minotaur','5.0','5d10+5',3,'8','11',['1d12'],2,2,500,150,['orc','evil'],'minotaur','Huge and brutal.',{});

  // ---------- pre-generated heroes ----------
  function pregen(id,name,race,cls,align,spec,scores,eq,inv){
    return {id,name,race,cls,align,spec:spec||null,str:scores.str,dex:scores.dex,con:scores.con,int:scores.int,wis:scores.wis,cha:scores.cha,
      lvl:1,xp:0,hp:scores.hp||5,maxhp:scores.hp||5,dead:false,layUsed:false,book:[],prep:{},mem:{},fx:{},poison:null,lost:false,eq:eq||{},inv:inv||[],color:scores.color||'#e3b54a'};
  }
  function pregens(){
    return [
      pregen('aldric','Aldric Thorne','human','F','lawful_good','sword',{str:17,dex:13,con:16,int:10,wis:12,cha:11,hp:12,color:'#e3b54a'},{melee:'long_sword',armor:'chain',shield:'shield'},[]),
      pregen('seraphine','Seraphine Vale','human','P','lawful_good','sword',{str:18,dex:13,con:12,int:10,wis:15,cha:18,hp:14,color:'#f0d060'},{melee:'broad_sword',armor:'chain',shield:'shield'},[]),
      pregen('borin','Borin Stonehand','dwarf','C','lawful_neutral','blunt',{str:12,dex:10,con:14,int:10,wis:15,cha:10,hp:14,color:'#c08060'},{melee:'mace',missile:'sling',armor:'chain',shield:'shield'},[]),
      pregen('lyra','Lyra Windwhisper','half_elf','R','neutral_good','goblin',{str:16,dex:17,con:15,int:11,wis:16,cha:12,hp:15,color:'#80d090'},{melee:'long_sword',missile:'long_bow',armor:'studded_leather'},[]),
      pregen('pip','Pip Quickfinger','halfling','T','neutral',null,{str:10,dex:17,con:12,int:12,wis:12,cha:14,hp:9,color:'#90c0e0'},{melee:'short_sword',missile:'sling',armor:'leather'},[]),
      pregen('elowen','Elowen Starfall','elf','M','neutral',null,{str:11,dex:16,con:12,int:18,wis:12,cha:13,hp:6,color:'#b8a0e0'},{melee:'staff',missile:'darts'},[])
    ];
  }

  // ---------- shops / services ----------
  const SHOPS = {
    general:{name:'General Goods',stock:['long_sword','short_sword','mace','club','leather','studded_leather','chain','shield','long_bow','short_bow','dagger','potion_heal','potion_antivenom'],desc:'A general store.'},
    apothecary:{name:'Apothecary',stock:['potion_heal','potion_heal2','potion_antivenom','potion_strength','potion_invis','scroll_armor','scroll_knock'],desc:'Potions and scrolls.'},
    armory:{name:'Armory',stock:['long_sword','broad_sword','short_sword','dagger','mace','club','axe','spear','warhammer','shield','leather','studded_leather','chain','plate','long_bow','crossbow','short_bow','darts','sling'],desc:'Weapons and armor.'}
  };

  return {ITEMS, SPELLS, MONSTERS, pregens, SHOPS, itemPrice, DATA_VERSION:2};
})();
