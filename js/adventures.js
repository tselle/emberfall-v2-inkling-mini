/* adventures.js — high-level kits, band shop lists, 50 generated adventures */
(function(){
  const DATA = window.DATA;
  const MAPS = window.MAPS = window.MAPS || {};
  const BUILDERS = window.BUILDERS;

  // ---------- high-level kits (pregen thresholds 3/5/9/13/17) ----------
  const KITS = {
    3:{
      F:{melee:'broad_sword',armor:'chain',notes:'Chain + broad sword'},
      P:{melee:'broad_sword',armor:'chain',notes:'Broad sword'},
      R:{melee:'long_sword',armor:'studded_leather',notes:'Long sword'},
      M:{melee:'staff_magic',missile:'darts',notes:'+1 darts'},
      C:{melee:'mace',armor:'chain',notes:'Mace and chain'},
      T:{melee:'short_sword',armor:'leather',notes:'Short sword'}
    },
    5:{
      F:{melee:'broad_sword_1',armor:'chain_1',notes:'+1 weapons'},
      P:{melee:'broad_sword_1',armor:'chain_1',notes:'+1'},
      R:{melee:'long_bow_1',armor:'studded_leather',notes:'+1 bow'},
      M:{melee:'staff_magic',missile:'darts',notes:'Staff + darts'},
      C:{melee:'mace_1',armor:'chain_1',notes:'+1'},
      T:{melee:'short_sword_1',armor:'leather_1',notes:'+1'}
    },
    9:{
      F:{melee:'broad_sword_1',armor:'plate_1',shield:'shield_1',notes:'Plate +1'},
      P:{melee:'broad_sword_1',armor:'plate_1',shield:'shield_1',notes:'Plate +1'},
      R:{melee:'long_bow_1',armor:'studded_leather',notes:'+1'},
      M:{melee:'staff_magic',missile:'darts',notes:'Staff + darts'},
      C:{melee:'warhammer_1',armor:'chain_1',notes:'Warhammer +1'},
      T:{melee:'short_sword_1',armor:'leather_1',notes:'+1'}
    },
    13:{
      F:{melee:'broad_sword_1',armor:'plate_1',shield:'shield_1',notes:'Plate +1'},
      P:{melee:'broad_sword_1',armor:'plate_1',shield:'shield_1',notes:'Plate +1'},
      R:{melee:'long_bow_1',armor:'leather_1',notes:'+1'},
      M:{melee:'staff_magic',missile:'darts',notes:'Staff + darts'},
      C:{melee:'warhammer_1',armor:'chain_1',notes:'+1'},
      T:{melee:'short_sword_1',armor:'leather_1',notes:'+1'}
    },
    17:{
      F:{melee:'broad_sword_1',armor:'plate_1',shield:'shield_1',notes:'Plate +1'},
      P:{melee:'broad_sword_1',armor:'plate_1',shield:'shield_1',notes:'Plate +1'},
      R:{melee:'long_bow_1',armor:'leather_1',notes:'+1'},
      M:{melee:'staff_magic',missile:'darts',notes:'Staff + darts'},
      C:{melee:'warhammer_1',armor:'chain_1',notes:'+1'},
      T:{melee:'short_sword_1',armor:'leather_1',notes:'+1'}
    }
  };
  // extra gold by threshold for custom heroes
  const KIT_GOLD = {3:150,5:500,9:2000,13:6000,17:12000};

  function pregenKit(ch){
    const thresholds = [3,5,9,13,17];
    for(const t of thresholds){
      if((ch.lvl||1) >= t){
        const kit = KITS[t] && KITS[t][ch.cls]; if(!kit) continue;
        for(const slot in kit){
          if(slot==='notes'||slot==='desc') continue;
          if(kit[slot]) ch.eq[slot] = kit[slot];
        }
      }
    }
  }
  function kitForLevel(ch){ return pregenKit(ch); }

  // ---------- band-specific shop lists ----------
  function shopForBand(band){
    // mundane + silver + items from lower tiers; exclude rare (<4), books, Rod of Resurrection
    const exclude = new Set(['rod_resurrect','scroll_magical_stone','book_strength','gem','crown']);
    const stock = ['long_sword','short_sword','dagger','mace','club','leather','studded_leather','chain','shield','long_bow','short_bow','darts','sling','potion_heal','potion_antivenom','dagger_1','mace_1','chain_1'];
    if(band>=2) stock.push('broad_sword','crossbow','plate','short_bow','bow_silver','long_sword_1');
    if(band>=3) stock.push('warhammer_1','warhammer','plate_1','shield_1','chain_1');
    // inventory of silver/enchanted gear for silver band shops
    if(band>=2) stock.push('long_sword_silver');
    const out = [];
    for(const id of stock){ if(!exclude.has(id)) out.push(id); }
    return out;
  }
  function shopForLevel(lvl){
    const band = Math.max(1, Math.min(5, Math.ceil(lvl/4)));
    return shopForBand(band);
  }

  // ---------- generated adventures ----------
  const BAND_THEMES = {
    1:{sizes:['small','small','small','small','medium','medium','medium','large','large','huge'],
       themes:{small:['vermin','fungus','beasts','bandits','goblinoid','swamp','undead','lycanthrope','undead'],
               medium:['goblinoid','swamp','lycanthrope','undead'],
               large:['undead','goblinoid'],
               huge:['undead']}},
    2:{sizes:['small','small','small','small','medium','medium','medium','large','large','huge'],
       themes:{small:['vermin','beasts','menagerie','wizard'],
               medium:['lycanthrope','swamp','frozen'],
               large:['giants','demons'],
               huge:['dragon']}},
    3:{sizes:['small','small','small','small','medium','medium','medium','large','large','huge'],
       themes:{small:['beasts','swamp','elemental','menagerie'],
               medium:['underdark','devils','giants'],
               large:['undead','dragon'],
               huge:['demons']}},
    4:{sizes:['small','small','small','small','medium','medium','medium','large','large','huge'],
       themes:{small:['beasts','elemental','menagerie','frozen'],
               medium:['wizard','underdark','demons'],
               large:['giants','devils'],
               huge:['dragon']}},
    5:{sizes:['small','small','small','small','medium','medium','medium','large','large','huge'],
       themes:{small:['giants','underdark','dragon','wizard'],
               medium:['demons','devils','undead'],
               large:['giants','dragon'],
               huge:['undead']}}
  };
  const THEME_ARCH = {
    vermin:{monsters:['giant_rat','giant_centipede','spider','beetle'],boss:'giant_centipede',theme:'Vermin'},
    fungus:{monsters:['beetle','spider','boggard'],boss:'boggard',theme:'Fungus'},
    beasts:{monsters:['wolf','bear','prowler'],boss:'bear',theme:'Beasts'},
    bandits:{monsters:['bandit','prowler'],boss:'bandit',theme:'Bandits'},
    goblinoid:{monsters:['goblin','kobold','gnoll_warrior'],boss:'kobold_chief',theme:'Goblinoid'},
    swamp:{monsters:['boggard','spider','hell_hound'],boss:'boggard',theme:'Swamp'},
    lycanthrope:{monsters:['wolf','gnoll_warrior','prowler'],boss:'wolf',theme:'Lycanthrope'},
    undead:{monsters:['skeleton','ghoul','wight'],boss:'wight',theme:'Undead'},
    menagerie:{monsters:['wolf','bear','orc'],boss:'orc',theme:'Menagerie'},
    wizard:{monsters:['mage_npc','warlock','ghoul'],boss:'mage_npc',theme:'Wizard'},
    frozen:{monsters:['ice_elemental','skeleton'],boss:'ice_elemental',theme:'Frozen'},
    giants:{monsters:['ogre','giant','troll'],boss:'giant',theme:'Giants'},
    demons:{monsters:['devil','succubus','lich'],boss:'lich',theme:'Demons'},
    dragon:{monsters:['dragon','wyvern','fire_elemental'],boss:'drake_boss',theme:'Dragon'},
    elemental:{monsters:['fire_elemental','ice_elemental','salamander'],boss:'fire_elemental',theme:'Elemental'},
    underdark:{monsters:['troglodyte','boggard','minotaur'],boss:'minotaur',theme:'Underdark'},
    devils:{monsters:['devil','succubus','hell_hound'],boss:'devil',theme:'Devils'},
    troll:{monsters:['troll','troll_regenerating'],boss:'troll_regenerating',theme:'Trolls'}
  };
  const BAND_NAMES = {
    1:['Crowstead','Dunbarrow','Greycross','Mosslight','Thornhollow','Sable','Fenn','Grim','Ashvale','Mirefield'],
    2:['Grimhold','Veil','Hollow','Frostreach','Stonebreaker','Under','Wyrm','Cliffside','Marsh','Red'],
    3:['Deep','Black','Dark','Storm','Curse','Hollow','Red','Ash','Iron','Witch'],
    4:['Ember','Frost','Storm','Mist','Hollow','Ash','Iron','Night','Stone','Wraith'],
    5:['Dragon','Shadow','Fell','Witch','Iron','Frost','Deep','Grave','Stone','Black']
  };
  const BAND_PLACES = ['Crowstead','Dunbarrow','Greycross','Mosslight','Thornhollow','Sable','Fenn','Grim','Ashvale','Mirefield'];

  function pickPlace(rng, band){ return BAND_NAMES[band][Math.floor(rng()*10)] || 'Greycross'; }

  function kitsFor(band){
    // Shop stock per band (0-indexed band 1..5)
    return shopForBand(band);
  }

  function genAdventure(t, i){
    const id = 'adv'+t+'_'+i;
    const seed = (7919*t + 104729*i + 31*(i+'').length) >>> 0;
    // theme key length (per spec): 31*themeKey.length
    const themeEntry = BAND_THEMES[t];
    const size = themeEntry.sizes[i-1];
    const sizeIdx = ['small','medium','large','huge'].indexOf(size);
    const theme = themeEntry.themes[size][Math.floor(0)]; // deterministic pick below
    const rng = window.RULES.mulberry32(seed);
    const sizeKeys = ['small','medium','large','huge'];
    const themePool = themeEntry.themes[size];
    const themeName = themePool[Math.floor(rng()*themePool.length)];
    const arch = THEME_ARCH[themeName] || THEME_ARCH.vermin;
    const place = pickPlace(rng, t);
    const name = place + ' ' + ['Cells','Hollows','Barrow','Reach','Crypt','Depths','Depths','Mists'][Math.floor(rng()*8)];
    const title = ['The '+themeName+' of '+place, 'The '+themeName+' Den of '+place, place+' '+themeName+' Deep'][Math.floor(rng()*3)];
    const startLvl = t*4 - 3; // band floor: 1,5,9,13,17
    const start = startLvl;
    const sizeFloors = {small:1,medium:2,large:3,huge:5}[size];
    const recommended = [start, Math.min(20,start+2+sizeIdx*2)];
    const gold = Math.round(40 * Math.pow(startLvl,1.5) / 10) * 10;
    const bossBase = arch.boss === 'drake_boss' ? 'dragon' : arch.boss;
    const bossId = id + '_boss';
    const bossData = Object.assign({}, DATA.MONSTERS[bossBase]);
    bossData.id = bossId;
    bossData.leader = 1;
    bossData.xp = (bossData.xp||0)*2;
    bossData.gold = (bossData.gold||0)*2;
    bossData.name = 'The ' + (arch.theme||'Foe') + ' Warlord';
    bossData.lore = 'The warlord of '+name+'.';
    if(bossData.hp && bossData.hp.includes('d')){
      const m = /^(\d+)d(\d+)\+?(\d*)$/.exec(bossData.hp);
      if(m){ const lvl = Math.max(1, bossData.hd ? parseInt(bossData.hd||'2') : 3); bossData.hp = m[1]+'d'+m[2]+'+'+(parseInt(m[3]||'0')+lvl*2); }
    }
    bossData.minMorale = 16;
    DATA.MONSTERS[bossId] = bossData;

    // build maps
    const hubId = 'gen_home_'+id;
    const wildId = 'gen_wild_'+id;
    MAPS[hubId] = {
      name:place, grid:BUILDERS.village(place,19,15,{
        trees:[[3,6],[14,6]], fountains:[[9,8]],
        services:[{x:2,y:2,key:1},{x:5,y:2,key:2},{x:8,y:2,key:3},{x:11,y:2,key:4},{x:14,y:2,key:5}],
        stairsDown:{x:9,y:1}, gate:{x:9,y:12}
      }), wall:'#', floor:'.', start:{x:9,y:8,dir:0}, safe:true, outdoor:false,
      locs:{1:{name:'Inn',svc:'inn'},2:{name:'Shop',svc:'shop'},3:{name:'Shrine',svc:'temple'},4:{name:'Hall',svc:'hall'},5:{name:'Yard',svc:'hall'}},
      stairs:[{x:9,y:1,down:'gen_d1_'+id,tx:1,ty:1}],
      exit:{x:9,y:12,to:wildId,tx:9,ty:2,dir:2,gate:true},
      wander:{chance:0.02, group:[['bandit',2]]}
    };

    const floorIds = [];
    for(let f=1; f<=sizeFloors; f++){
      const floorId = 'gen_d'+f+'_'+id;
      floorIds.push(floorId);
      const ev = {};
      const walls = [];
      for(let w=1; w<=4; w++){ walls.push([6+w, 3+w]); }
      const events = [];
      // boss on final floor
      if(f===sizeFloors){ events.push({x:11,y:8,ch:'a'}); }
      else { events.push({x:9,y:6,ch:'a'}); }
      // chests (1-2 per floor)
      if(rng()<0.8) events.push({x:5,y:10,ch:'b'});
      if(sizeFloors>=3) events.push({x:15,y:10,ch:'c'});
      for(const ev2 of events){ ev[ev2.ch] = (ev2.ch==='a'?{enc:{mons:[[f===sizeFloors?bossId:arch.boss, f===sizeFloors?1:'1d4']],text:(f===sizeFloors?'The warlord of '+name+' rises…':'A set foe in the hall…'),gold:'6d6',deed:'gen_'+id+'_main'},text:(f===sizeFloors?'Boss':'Set foe')}:(ev2.ch==='b'?{chest:{gold:'5d6',items:['gem'],text:'A cache of the foe’s plunder.'},text:'Cache'}:{chest:{gold:'4d6',items:['potion_heal'],text:'A hidden cache.'},text:'Hidden cache'})); }
      MAPS[floorId] = {
        name:'Undercroft '+(f===1?'I':(f===2?'II':(f===3?'III':(f===4?'IV':'V')))), grid:BUILDERS.dungeon('dungeon',21,15,{
          stairsUp:[{x:1,y:1}], stairsDown:(f<sizeFloors?{x:1,y:13}:null),
          events:events, walls:[[10,3],[10,4],[10,5],[10,6],[10,7]]
        }), wall:'#', floor:'.', start:{x:1,y:1,dir:0}, safe:false, outdoor:false,
        locs:{},
        stairs:[
          {x:1,y:1,down:(f===1?hubId:'gen_d'+(f-1)+'_'+id),tx:9,ty:2,up:true},
          ...(f<sizeFloors?[{x:1,y:13,down:'gen_d'+(f+1)+'_'+id,tx:1,ty:1}]:[])
        ],
        ev:ev, traps:[], wander:{chance:0.03, group:[['bandit',2]]}
      };
    }
    const wildId2 = 'gen_wild_'+id;
    MAPS[wildId2] = {
      name:place+' Region', overland:true, grid:BUILDERS.wild(place,30,20,{
        terrain:[{x:0,y:3,w:9,h:6,c:'n'},{x:19,y:3,w:11,h:6,c:'T'}],
        river:{y:9,h:2,bridge:15},
        roads:[[[15,1],[15,2],[15,3],[15,4],[15,5],[15,6],[15,7],[15,8],[15,10],[15,11],[15,12],[15,13],[15,14],[15,15],[15,16],[15,17],[15,18]]],
        sites:[{x:15,y:1,ch:'A',name:place,icon:'town',home:true,enter:hubId}],
        start:{x:15,y:1,dir:2}
      }),
      start:{x:15,y:1,dir:2},
      sites:{A:{name:place,icon:'town',home:true,enter:hubId}},
      encRate:1.0
    };

    const adventure = {
      id, code:'T'+t+'-'+(i<10?'0'+i:''+i), name:title, lvl:start, levels:[start,recommended[1]],
      diff:t, size, length: size==='small'?'about an hour':(size==='huge'?'six hours+':'several hours'), hub:hubId,
      maps:[hubId, ...floorIds, wildId2],
      gold, next:(i<10?('adv'+t+'_'+(i+1)):(t<5?('adv'+(t+1)+'_1'):null)), final:(t===5&&i===10),
      blurb:'A '+arch.theme+'-themed delve beneath '+place+'.',
      intro:'The road to '+place+' is long and dusty. Few go back.',
      hint:'Descend the stairs to the dungeon.',
      victory:'The '+arch.theme+' are clean from '+place+'.',
      lose:'The company is lost in the dark.',
      names:{place:place,giver:'The '+place+' Hall',trainer:'The '+place+' Hall'},
      rumors:['The dungeon of '+place+' is not meant to be slept in.','Report to the hall when the deed is done.'],
      quests:[
        {id:'gen_'+id+'_main',side:false,name:arch.theme+' of '+place,lead:'Slay the warlord on the far floor.',goal:'Kill the warlord',offer:place+' Hall',done:'The warlord is dead.',gold:Math.round(startLvl*100),xp:Math.round(startLvl*80)}
      ]
    };
    // optional side quest (2 for huge)
    if(size!=='small'){ adventure.quests.push({id:'gen_'+id+'_side',side:true,name:'The '+arch.theme+' Cache',lead:'Recover the foe’s cache.',goal:'Recover the cache',offer:place+' Hall',done:'The cache is safe.',gold:Math.round(startLvl*60),xp:Math.round(startLvl*40)}); }
    if(size==='huge'){ adventure.quests.push({id:'gen_'+id+'_side2',side:true,name:'The '+arch.theme+' Mark',lead:'Recover the mark.',goal:'Recover the mark',offer:place+' Hall',done:'The mark is safe.',gold:Math.round(startLvl*60),xp:Math.round(startLvl*40)}); }

    adventure.maps = [hubId, ...floorIds, wildId2];
    adventure.hub = hubId;
    return adventure;
  }

  // generate all 50
  const GENERATED = {};
  for(let t=1;t<=5;t++){
    for(let i=1;i<=10;i++){
      const adv = genAdventure(t,i);
      GENERATED[adv.id] = adv;
      window.MODULES = window.MODULES || {};
      window.MODULES[adv.id] = adv;
    }
  }

  window.ADVENTURES = {KITS, KIT_GOLD, pregenKit, kitForLevel, shopForBand, shopForLevel, shopForLevelBand:shopForBand, GENERATED};
})();
