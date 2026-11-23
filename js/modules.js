/* modules.js — authored maps, saga modules, kits */
(function(){
  const maps = {};
  window.BUILDERS_VILLAGE = village;
  const addMap = (id, def) => { def.id = id; def.locked = false; maps[id] = def; return def; };
  function mkGrid(w,h,fill){ const g=[]; for(let y=0;y<h;y++){ g.push(new Array(w).fill(fill)); } return g; }
  function putCell(g,x,y,c){ if(g[y]&&x>=0&&x<g[y].length) g[y][x]=c; }
  function toStr(g){ return g.map(r=>r.join('')); }

  function village(name,w,h,opts){
    const g = mkGrid(w,h,'#');
    for(let y=0;y<h;y++){ for(let x=0;x<w;x++){ if(y>0&&y<h-1&&x>0&&x<w-1) g[y][x]='.'; } }
    // trees/fountains decor
    (opts.trees||[]).forEach(([x,y])=>putCell(g,x,y,'T'));
    (opts.fountains||[]).forEach(([x,y])=>putCell(g,x,y,'F'));
    (opts.grass||[]).forEach(([x,y])=>putCell(g,x,y,','));
    (opts.fountains??[]); // noop
    // services
    (opts.services||[]).forEach(s=>putCell(g,s.x,s.y,String(s.key)));
    // stairs
    if(opts.stairsDown) putCell(g,opts.stairsDown.x,opts.stairsDown.y,'>');
    if(opts.stairsUp) putCell(g,opts.stairsUp.x,opts.stairsUp.y,'<');
    // gate
    if(opts.gate) putCell(g,opts.gate.x,opts.gate.y,'G');
    // extra events
    (opts.events||[]).forEach(e=>putCell(g,e.x,e.y,e.ch));
    return toStr(g);
  }

  function dungeon(name,w,h,opts){
    const g = mkGrid(w,h,'#');
    for(let y=0;y<h;y++){ for(let x=0;x<w;x++){ if(y>0&&y<h-1&&x>0&&x<w-1) g[y][x]='.'; } }
    // wall stubs for structure
    (opts.walls||[]).forEach(([x,y])=>putCell(g,x,y,'#'));
    (opts.stairsUp||[]).forEach(s=>putCell(g,s.x,s.y,'<'));
    (opts.events||[]).forEach(e=>putCell(g,e.x,e.y,e.ch));
    (opts.locked||[]).forEach(l=>putCell(g,l.x,l.y,'L'));
    (opts.secret||[]).forEach(l=>putCell(g,l.x,l.y,'S'));
    // stairs down
    if(opts.stairsDown) putCell(g,opts.stairsDown.x,opts.stairsDown.y,'>');
    return toStr(g);
  }

  function buildWild(name,w,h,opts){
    const base = mkGrid(w,h,'.'); // grassland base
    const grid = base.map(r=>r.slice());
    // terrain patches
    (opts.terrain||[]).forEach(t=>{
      for(let y=t.y;y<t.y+t.h;y++){ for(let x=t.x;x<t.x+t.w;x++){ if(grid[y]&&grid[y][x]!=='^') grid[y][x]=t.c; } }
    });
    // mountains north border
    for(let x=0;x<w;x++) grid[0][x]='^';
    // river band with bridge
    if(opts.river){
      for(let x=0;x<w;x++){ for(let y=opts.river.y;y<opts.river.y+opts.river.h;y++){ if(grid[y]&&grid[y][x]!=='G') grid[y][x]='~'; } }
      if(opts.river.bridge) for(let y=opts.river.y;y<opts.river.y+opts.river.h;y++){ const bx=opts.river.bridge; if(grid[y]&&grid[y][bx]!==undefined) grid[y][bx]='+'; }
    }
    // roads
    (opts.roads||[]).forEach(r=>{
      // path = list of [x,y]
      r.forEach(([x,y])=>{ if(grid[y]&&grid[y][x]!=='^'&&grid[y][x]!=='~'&&grid[y][x]!=='+') grid[y][x]='='; });
    });
    // bridge road override
    if(opts.river && opts.river.bridge){ const bx=opts.river.bridge; for(let y=opts.river.y;y<opts.river.y+opts.river.h;y++){ grid[y][bx]='+'; } }
    // sites
    (opts.sites||[]).forEach(s=>{ putCell(grid,s.x,s.y,s.ch); });
    return toStr(grid);
  }

  window.BUILDERS_VILLAGE = village; window.BUILDERS_DUNGEON = dungeon; window.BUILDERS_WILD = buildWild;

  // ---------- E0: Thornwick ----------
  addMap('thornwick',{
    name:'Thornwick', grid:village('thornwick',19,15,{
      trees:[[3,6],[15,6]], fountains:[[9,8],[4,4],[14,4]],
      services:[{x:2,y:2,key:1},{x:5,y:2,key:2},{x:8,y:2,key:3},{x:11,y:2,key:4},{x:14,y:2,key:5}],
      stairsDown:{x:9,y:1}, gate:{x:9,y:12}
    }), wall:'#', floor:'.', start:{x:9,y:8,dir:0}, safe:true, outdoor:false,
    locs:{1:{name:'The Sleepy Hen (Inn)',svc:'inn'},2:{name:'Hesk’s General Goods',svc:'shop'},3:{name:'Shrine of the Dawn',svc:'temple'},4:{name:'Elder Maddoc’s Longhouse',svc:'hall'},5:{name:'Sergeant Brask’s Yard',svc:'hall'}},
    stairs:[{x:9,y:1,down:'thorn_cellar',tx:1,ty:1}],
    exit:{x:9,y:12,to:'thorn_wild',tx:14,ty:2,dir:2,gate:true},
    wander:{chance:0.02, group:[['bandit',2]]}
  });

  addMap('thorn_cellar',{
    name:'Thornwick Cellar', grid:dungeon('thorn_cellar',21,15,{
      stairsUp:[{x:1,y:1}],
      walls:[[9,3],[9,4],[9,5],[17,11],[15,11],[15,12],[16,11]],
      locked:[{x:15,y:12}],
      secret:[{x:7,y:8}],
      events:[{x:4,y:3,ch:'a'},{x:17,y:3,ch:'b'},{x:8,y:5,ch:'e'},{x:6,y:10,ch:'d'},{x:18,y:13,ch:'f'}]
    }), wall:'#', floor:'.', start:{x:1,y:1,dir:0}, safe:false, outdoor:false,
    locs:{},
    stairs:[{x:1,y:1,down:'thornwick',tx:9,ty:2,up:true}],
    ev:{
      a:{enc:{mons:[['giant_rat','1d4'],['giant_centipede','1d3']],text:'Rats and centipedes skitter into the hall…',gold:'2d4'},text:'Giant rats and centipedes.'},
      b:{enc:{mons:[['kobold','1d6']],text:'Kobolds carry the Brass Cellar Key through the dark…',gold:'2d6',items:['cellar_key']},text:'Kobolds.'},
      e:{enc:{mons:[['beetle','2']],text:'Beetle wings chitter in the malt…',gold:'1d4'},text:'Beetles.'},
      d:{chest:{gold:'5d4',items:['ring_widow'],trap:{type:'needle',dmg:'1d6'},text:'A needle-trapped chest.'},text:'Ring chest.'},
      f:{enc:{mons:[['skarrik',1],['kobold','1d4']],text:'The Kettle-Crowned Skarrik rises from his throne…',gold:'20d4',deed:'thorn_kobolds'},text:'Skarrik.'},
      S:{text:'Hidden cache. Dagger +1.',items:['dagger_1'],closed:1}
    },
    traps:[], wander:{chance:0.03, group:[['giant_rat','1d3']]}
  });

  addMap('thorn_wild',{
    name:'Thornwick Vale', overland:true,
    grid:buildWild('thorn_wild',30,20,{
      terrain:[
        {x:0,y:3,w:9,h:7,c:'n'},      // west hills
        {x:21,y:3,w:9,h:8,c:'T'},      // east forest
        {x:0,y:15,w:10,h:5,c:'%'}      // southwest fen
      ],
      river:{y:9,h:2,bridge:15},
      roads:[[[15,1],[15,1],[15,2],[15,3],[15,4],[15,5],[15,6],[15,7],[15,8],[15,10],[15,11],[15,12],[15,13],[15,14],[15,15],[15,16],[15,17],[15,18]]],
      sites:[
        {x:15,y:1,ch:'A',name:'Thornwick',icon:'town',home:true,enter:'thornwick'},
        {x:4,y:5,ch:'B',name:'Kobold Lookout',icon:'hill',fight:{mons:[['kobold','1d4']],text:'A kobold war-camp on the ridge.'}},
        {x:22,y:5,ch:'C',name:'Wolf Den',icon:'wolf',fight:{mons:[['wolf','1d3']],text:'A wolf den on the forest edge.'}},
        {x:9,y:13,ch:'D',name:'Ott’s Farm',icon:'house',text:'Abandoned farmhouse — a cache of supplies.',cache:{gold:'3d4',items:['potion_heal']}},
        {x:14,y:16,ch:'F',name:'Mother Brina’s Croft',icon:'home',text:'An old woman’s croft. A safe place to rest.',safe:true},
        {x:24,y:16,ch:'E',name:'Wayfarer’s Stone',icon:'rock',text:'A wayfarer’s stone marks the river road.'}
      ],
      start:{x:15,y:1,dir:2}
    }),
    start:{x:15,y:1,dir:2},
    sites:{
      A:{name:'Thornwick',icon:'town',home:true,enter:'thornwick'},
      B:{name:'Kobold Lookout',icon:'hill',fight:{mons:[['kobold','1d4']],text:'A kobold war-camp on the ridge.'}},
      C:{name:'Wolf Den',icon:'wolf',fight:{mons:[['wolf','1d3']],text:'A wolf den on the forest edge.'}},
      D:{name:'Ott’s Farm',icon:'house',text:'Abandoned farmhouse — a cache of supplies.',cache:{gold:'3d4',items:['potion_heal']}},
      E:{name:'Wayfarer’s Stone',icon:'rock',text:'A wayfarer’s stone marks the river road.'},
      F:{name:'Mother Brina’s Croft',icon:'home',text:'An old woman’s croft. A safe place to rest.',safe:true}
    },
    encRate:1.0
  });

  // ---------- E1: Hollow ----------
  addMap('town',{
    name:'Emberfall', grid:village('town',25,21,{
      trees:[[3,3],[21,3]], fountains:[[12,10]],
      services:[{x:4,y:2,key:1},{x:8,y:2,key:2},{x:12,y:2,key:3},{x:16,y:2,key:4},{x:20,y:2,key:5},{x:6,y:18,key:6}],
      stairsDown:{x:12,y:1}, gate:{x:12,y:19}
    }), wall:'#', floor:'.', start:{x:12,y:10,dir:0}, safe:true, outdoor:false,
    locs:{1:{name:'Drowsy Lantern',svc:'inn'},2:{name:'Ironhand Outfitters',svc:'shop'},3:{name:'Gilded Mortar',svc:'shop'},4:{name:'Gilded Tankard',svc:'tavern'},5:{name:'Temple of the Dawn',svc:'temple'},6:{name:'Town Hall',svc:'hall'}},
    stairs:[{x:12,y:1,down:'crypt1',tx:1,ty:1}],
    exit:{x:12,y:19,to:'wild',tx:20,ty:2,dir:2,gate:true},
    wander:{chance:0.02, group:[['bandit',2]]}
  });
  addMap('crypt1',{
    name:'Abbey Undercroft', grid:dungeon('crypt1',25,21,{
      stairsUp:[{x:1,y:1}],
      walls:[[12,3],[12,4],[12,5],[12,6],[12,7],[12,8],[12,9]],
      events:[{x:6,y:5,ch:'a'},{x:18,y:5,ch:'b'}]
    }), wall:'#', floor:'.', start:{x:1,y:1,dir:0}, safe:false, outdoor:false,
    stairs:[{x:1,y:1,down:'town',tx:12,ty:2,up:true}],
    ev:{
      a:{enc:{mons:[['skeleton','1d6']],text:'A skeleton patrol marches the aisle…',gold:'3d6'},text:'Skeletons.'},
      b:{enc:{mons:[['ghoul','1d3']],text:'Ghouls feast in the shadow…',gold:'4d6'},text:'Ghouls.'}
    },
    traps:[], wander:{chance:0.03, group:[['skeleton','1d3']]}
  });
  addMap('crypt2',{
    name:'Abbey Deep Vaults', grid:dungeon('crypt2',25,21,{
      stairsUp:[{x:1,y:1}],
      walls:[[12,3],[12,4],[12,5],[12,6],[12,7],[12,8]],
      events:[{x:6,y:5,ch:'c'},{x:18,y:5,ch:'d'},{x:6,y:16,ch:'e'}]
    }), wall:'#', floor:'.', start:{x:1,y:1,dir:0}, safe:false, outdoor:false,
    stairs:[{x:1,y:1,down:'crypt1',tx:12,ty:2,up:true}],
    ev:{
      c:{enc:{mons:[['redfang',1],['ghoul','1d3']],text:'The chieftain Redfang rises with his ghouls…',gold:'30d6',deed:'redfang'},text:'Redfang.'},
      d:{chest:{gold:'2d6',items:['dawn_reliquary'],text:'A locked reliquary chest.'},text:'Reliquary chest.'},
      e:{enc:{mons:[['malvek',1],['mage_npc','1d3']],text:'Malvek the Ashen speaks in an ash-dry voice…',gold:'40d6',deed:'malvek'},text:'Malvek.'}
    },
    traps:[], wander:{chance:0.03, group:[['skeleton','1d3']]}
  });
  addMap('wild',{
    name:'The Emberwild', overland:true,
    grid:buildWild('wild',48,32,{
      terrain:[
        {x:0,y:3,w:14,h:12,c:'n'},
        {x:30,y:3,w:18,h:12,c:'T'},
        {x:0,y:26,w:48,h:6,c:'%'}
      ],
      river:{y:14,h:2,bridge:8},
      roads:[[[24,1],[24,2],[24,3],[24,4],[24,5],[24,6],[24,7],[24,8],[24,9],[24,10],[24,11],[24,12],[24,13],[24,15],[24,16],[24,17],[24,18],[24,19],[24,20],[24,21],[24,22],[24,23],[24,24],[24,25],[24,26],[24,27],[24,28],[24,29],[24,30],[24,31]]],
      sites:[
        {x:24,y:1,ch:'A',name:'Emberfall',icon:'town',home:true,enter:'town'},
        {x:5,y:5,ch:'B',name:'Millbrook',icon:'home',text:'A mill on the river. A place to rest.',safe:true},
        {x:36,y:6,ch:'C',name:'Bloodmane Watchtower',icon:'tower',text:'A ruined tower full of gnolls.',enter:'tower'},
        {x:6,y:19,ch:'D',name:'Brigand Camp',icon:'sword',fight:{mons:[['bandit','1d4']],text:'Bandit camp on the road.'}},
        {x:30,y:19,ch:'E',name:'Hermit’s Cottage',icon:'home',text:'A hermit heals the party.',heal:true},
        {x:40,y:29,ch:'F',name:'Dawnstones',icon:'rock',text:'Ancient stones nod to the east.'}
      ],
      start:{x:24,y:1,dir:2}
    }),
    start:{x:24,y:1,dir:2},
    sites:{
      A:{name:'Emberfall',icon:'town',home:true,enter:'town'},
      B:{name:'Millbrook',icon:'home',text:'A mill on the river. A place to rest.',safe:true},
      C:{name:'Bloodmane Watchtower',icon:'tower',text:'A ruined tower full of gnolls.',enter:'tower'},
      D:{name:'Brigand Camp',icon:'sword',fight:{mons:[['bandit','1d4']],text:'Bandit camp on the road.'}},
      E:{name:'Hermit’s Cottage',icon:'home',text:'A hermit heals the party.',heal:true},
      F:{name:'Dawnstones',icon:'rock',text:'Ancient stones nod to the east.'}
    },
    encRate:1.15
  });
  addMap('tower',{
    name:'Bloodmane Watchtower', grid:dungeon('tower',19,15,{
      stairsUp:[{x:1,y:1}],
      walls:[[9,3],[9,4],[9,5],[9,6],[9,7]],
      events:[{x:5,y:4,ch:'a'},{x:13,y:10,ch:'b'}]
    }), wall:'#', floor:'.', start:{x:1,y:1,dir:0}, safe:false, outdoor:false,
    stairs:[{x:1,y:1,down:'wild',tx:36,ty:6,up:true}],
    ev:{
      a:{enc:{mons:[['gnoll_warrior','1d4']],text:'Gnolls snarl from the stairwell…',gold:'6d6'},text:'Gnolls.'},
      b:{enc:{mons:[['gnoll_leader',1],['gnoll_warrior','1d3']],text:'The Bloodmane Packlord rises with his pack…',gold:'20d6',deed:'gnolls'},text:'Bloodmane Packlord.'}
    },
    traps:[], wander:{chance:0.03, group:[['gnoll_warrior','1d3']]}
  });

  // ---------- E2: Coldharrow ----------
  addMap('cold_town',{
    name:'Coldharrow', grid:village('cold_town',23,17,{
      trees:[[3,3],[19,3]], fountains:[[11,8]],
      services:[{x:3,y:2,key:1},{x:7,y:2,key:2},{x:11,y:2,key:3},{x:15,y:2,key:4},{x:19,y:2,key:5}],
      stairsDown:{x:11,y:1}, gate:{x:11,y:15}
    }), wall:'#', floor:'.', start:{x:11,y:8,dir:0}, safe:true, outdoor:false,
    locs:{1:{name:'Dunmore’s Forge',svc:'shop'},2:{name:'The Copper Cup',svc:'inn'},3:{name:'Shrine of St. Brannoc',svc:'temple'},4:{name:'Thane’s Hall',svc:'hall'},5:{name:'Foreman’s Yard',svc:'hall'}},
    stairs:[{x:11,y:1,down:'cold_mine',tx:1,ty:1}],
    exit:{x:11,y:15,to:'cold_wild',tx:11,ty:2,dir:2,gate:true},
    wander:{chance:0.02, group:[['bandit',2]]}
  });
  addMap('cold_mine',{
    name:'The Deepcut Mine', grid:dungeon('cold_mine',25,19,{
      stairsUp:[{x:1,y:1}], stairsDown:{x:1,y:17},
      walls:[[8,4],[8,5],[8,6],[8,7],[8,8],[15,4],[15,5],[15,6],[15,7],[15,8]],
      events:[{x:4,y:10,ch:'a'},{x:12,y:12,ch:'b'}]
    }), wall:'#', floor:'.', start:{x:1,y:1,dir:0}, safe:false, outdoor:false,
    stairs:[{x:1,y:1,down:'cold_town',tx:11,ty:2,up:true},{x:1,y:17,down:'cold_barrow',tx:1,ty:1}],
    ev:{
      a:{enc:{mons:[['giant_rat','1d4']],text:'Mine rats skitter into the headway…',gold:'2d6'},text:'Mine rats.'},
      b:{enc:{mons:[['gorrak',1],['goblin','1d4']],text:'Gorrak Skullsplitter paces the adit…',gold:'30d6',deed:'cold_mine'},text:'Gorrak.'}
    },
    traps:[], wander:{chance:0.03, group:[['giant_rat','1d3']]}
  });
  addMap('cold_barrow',{
    name:'Barrow of the Iron King', grid:dungeon('cold_barrow',25,21,{
      stairsUp:[{x:1,y:1}], stairsDown:{x:1,y:19},
      walls:[[12,3],[12,4],[12,5],[12,6],[12,7],[12,8]],
      events:[{x:6,y:5,ch:'c'},{x:18,y:5,ch:'d'},{x:18,y:15,ch:'e'}]
    }), wall:'#', floor:'.', start:{x:1,y:1,dir:0}, safe:false, outdoor:false,
    stairs:[{x:1,y:1,down:'cold_mine',tx:1,ty:16,up:true}],
    ev:{
      c:{chest:{gold:'5d6',items:['iron_king_seal'],text:'The king’s seal rests in a stone niche.'},text:'The seal.'},
      d:{enc:{mons:[['iron_king',1]],text:'The Iron King stirs from his stone…',gold:'80d6',deed:'cold_king'},text:'Iron King.'},
      e:{enc:{mons:[['skeleton','1d6']],text:'Skeleton wards rise…',gold:'4d6'},text:'Skeletons.'}
    },
    traps:[], wander:{chance:0.03, group:[['skeleton','1d3']]}
  });
  addMap('cold_wild',{
    name:'Harrow Hills', overland:true,
    grid:buildWild('cold_wild',36,24,{
      terrain:[
        {x:0,y:3,w:16,h:14,c:'n'},
        {x:20,y:3,w:16,h:14,c:'T'},
        {x:0,y:20,w:36,h:4,c:'%'}
      ],
      river:{y:15,h:2,bridge:6},
      roads:[[[18,1],[18,2],[18,3],[18,4],[18,5],[18,6],[18,7],[18,8],[18,9],[18,10],[18,11],[18,12],[18,13],[18,14],[18,17],[18,18],[18,19]]],
      sites:[
        {x:18,y:1,ch:'A',name:'Coldharrow',icon:'town',home:true,enter:'cold_town'},
        {x:6,y:5,ch:'B',name:'Vellen Hamlet',icon:'home',text:'A small, quiet hamlet.',safe:true},
        {x:30,y:7,ch:'C',name:'Bugbear Stockade',icon:'sword',fight:{mons:[['bugbear','1d2']],text:'A bugbear stockade on the ridge.'}},
        {x:11,y:12,ch:'D',name:'Ogre Cave',icon:'cave',fight:{mons:[['ogre','1d2']],text:'An ogre lair in the hills.'}},
        {x:24,y:12,ch:'E',name:'Old Cairns',icon:'rock',text:'Ancient cairns stand at the barrow’s edge.'},
        {x:18,y:19,ch:'F',name:'South Road',icon:'road',text:'The south road leads into the dark.'}
      ],
      start:{x:18,y:1,dir:2}
    }),
    start:{x:18,y:1,dir:2},
    sites:{
      A:{name:'Coldharrow',icon:'town',home:true,enter:'cold_town'},
      B:{name:'Vellen Hamlet',icon:'home',text:'A small, quiet hamlet.',safe:true},
      C:{name:'Bugbear Stockade',icon:'sword',fight:{mons:[['bugbear','1d2']],text:'A bugbear stockade on the ridge.'}},
      D:{name:'Ogre Cave',icon:'cave',fight:{mons:[['ogre','1d2']],text:'An ogre lair in the hills.'}},
      E:{name:'Old Cairns',icon:'rock',text:'Ancient cairns stand at the barrow’s edge.'},
      F:{name:'South Road',icon:'road',text:'The south road leads into the dark.'}
    },
    encRate:1.2
  });

  // ---------- E3: Ravenmoor ----------
  addMap('rav_fort',{
    name:'Fort Ravel', grid:village('rav_fort',21,12,{
      trees:[[3,3],[17,3]], fountains:[[10,6]],
      services:[{x:3,y:2,key:1},{x:7,y:2,key:2},{x:11,y:2,key:3},{x:15,y:2,key:4}],
      stairsDown:{x:10,y:1}, gate:{x:10,y:10}
    }), wall:'#', floor:'.', start:{x:10,y:6,dir:0}, safe:true, outdoor:false,
    locs:{1:{name:'The Raven Bastion Inn',svc:'inn'},2:{name:'Ironwood Armory',svc:'shop'},3:{name:'Shrine of the Raven',svc:'temple'},4:{name:'Commander’s Hall',svc:'hall'}},
    stairs:[{x:10,y:1,down:'rav_moor',tx:1,ty:1}],
    exit:{x:10,y:10,to:'rav_wild',tx:10,ty:1,dir:2,gate:true},
    wander:{chance:0.02, group:[['bandit',2]]}
  });
  addMap('rav_moor',{
    name:'The Burned Village', grid:dungeon('rav_moor',25,19,{
      stairsUp:[{x:1,y:1}], stairsDown:{x:1,y:17},
      walls:[[12,3],[12,4],[12,5],[12,6],[12,7],[12,8]],
      events:[{x:6,y:5,ch:'a'},{x:18,y:12,ch:'b'}]
    }), wall:'#', floor:'.', start:{x:1,y:1,dir:0}, safe:false, outdoor:false,
    stairs:[{x:1,y:1,down:'rav_fort',tx:10,ty:2,up:true},{x:1,y:17,down:'rav_keep',tx:1,ty:1}],
    ev:{
      a:{enc:{mons:[['gnashrot',1],['hell_hound','1d3']],text:'Gnashrot the Gnashing rises from the ashes…',gold:'40d6',deed:'rav_moor'},text:'Gnashrot.'},
      b:{enc:{mons:[['hell_hound','2']],text:'Hell hounds circle the street…',gold:'6d6'},text:'Hell hounds.'}
    },
    traps:[], wander:{chance:0.04, group:[['hell_hound','1d2']]}
  });
  addMap('rav_keep',{
    name:'The Witch-Queen’s Keep', grid:dungeon('rav_keep',25,19,{
      stairsUp:[{x:1,y:1}], stairsDown:{x:1,y:17},
      walls:[[12,3],[12,4],[12,5],[12,6],[12,7],[12,8]],
      events:[{x:6,y:5,ch:'c'},{x:24,y:17,ch:'d'}]
    }), wall:'#', floor:'.', start:{x:1,y:1,dir:0}, safe:false, outdoor:false,
    stairs:[{x:1,y:1,down:'rav_moor',tx:1,ty:16,up:true},{x:1,y:17,down:'rav_pit',tx:1,ty:1}],
    ev:{
      c:{enc:{mons:[['grull',1],['troll','1d2']],text:'Grull, the boulder-thrower, crouches on the keep’s height…',gold:'60d6',deed:'rav_keep'},text:'Grull.'},
      d:{enc:{mons:[['gargoyle','1d4']],text:'Gargoyles crouch on the walls…',gold:'10d6'},text:'Gargoyles.'}
    },
    traps:[], wander:{chance:0.03, group:[['troll_regenerating','1d2']]}
  });
  addMap('rav_pit',{
    name:'The Witch-Pit', grid:dungeon('rav_pit',25,18,{
      stairsUp:[{x:1,y:1}], stairsDown:{x:1,y:16},
      walls:[[12,3],[12,4],[12,5],[12,6],[12,7],[12,8]],
      events:[{x:6,y:5,ch:'e'},{x:18,y:12,ch:'f'}]
    }), wall:'#', floor:'.', start:{x:1,y:1,dir:0}, safe:false, outdoor:false,
    stairs:[{x:1,y:1,down:'rav_keep',tx:1,ty:16,up:true}],
    ev:{
      e:{enc:{mons:[['vharra',1]],text:'Vharra, the Witch-Queen, spreads her raven wings…',gold:'120d6',deed:'rav_witch'},text:'The Witch-Queen.'},
      f:{chest:{gold:'6d6',items:['patrol_badge','patrol_badge','patrol_badge'],text:'A chest of badges.'},text:'Badge chest.'}
    },
    traps:[], wander:{chance:0.04, group:[['raven_witch','1d2']]}
  });
  addMap('rav_wild',{
    name:'Northern Moors', overland:true,
    grid:buildWild('rav_wild',36,24,{
      terrain:[
        {x:0,y:3,w:18,h:14,c:'%'},
        {x:20,y:3,w:16,h:14,c:'T'},
        {x:0,y:20,w:36,h:4,c:'%'}
      ],
      river:{y:16,h:2,bridge:4},
      roads:[[[18,1],[18,2],[18,3],[18,4],[18,5],[18,6],[18,7],[18,8],[18,9],[18,10],[18,11],[18,12],[18,13],[18,14],[18,15],[18,17],[18,18],[18,19]]],
      sites:[
        {x:18,y:1,ch:'A',name:'Fort Ravel',icon:'town',home:true,enter:'rav_fort'},
        {x:6,y:5,ch:'B',name:'Worg Den',icon:'wolf',fight:{mons:[['hell_hound','1d3']],text:'The worg den at the fen’s edge.'}},
        {x:30,y:5,ch:'C',name:'Gallows Hill',icon:'hill',text:'The hill of the hanging.'},
        {x:10,y:11,ch:'D',name:'North Watch-post',icon:'watch',text:'The watch-post at the moor’s edge.'},
        {x:26,y:11,ch:'E',name:'Cairn of the Old Kings',icon:'hill',text:'Cairns of the old kings.'},
        {x:18,y:19,ch:'F',name:'Old Tam’s Croft',icon:'home',text:'Old Tam’s croft at the fen’s edge.',safe:true}
      ],
      start:{x:18,y:1,dir:2}
    }),
    start:{x:18,y:1,dir:2},
    sites:{
      A:{name:'Fort Ravel',icon:'town',home:true,enter:'rav_fort'},
      B:{name:'Worg Den',icon:'wolf',fight:{mons:[['hell_hound','1d3']],text:'The worg den at the fen’s edge.'}},
      C:{name:'Gallows Hill',icon:'hill',text:'The hill of the hanging.'},
      D:{name:'North Watch-post',icon:'watch',text:'The watch-post at the moor’s edge.'},
      E:{name:'Cairn of the Old Kings',icon:'hill',text:'Cairns of the old kings.'},
      F:{name:'Old Tam’s Croft',icon:'home',text:'Old Tam’s croft at the fen’s edge.',safe:true}
    },
    encRate:1.3
  });

  window.MAPS = window.MAPS || {};
  Object.assign(window.MAPS, maps);

  // ---------- module metadata ----------
  const MODULES = {
    thornwick:{code:'thornwick',name:'The Cellars of Thornwick',lvl:1,levels:[1,2],diff:1,size:'short',length:'about an hour',hub:'thornwick',maps:['thornwick','thorn_cellar','thorn_wild'],
      gold:40, next:'hollow', final:false, names:{place:'Thornwick',giver:'Elder Maddoc',trainer:'Elder Maddoc'},
      blurb:'Goblins have seized the brass cellar beneath the old brewery.',
      intro:'The Elder’s longhouse smells of dust and wet wool. “The Cellar Key is loose in the cells,” he says. “Take it back. And watch the locked room — Skarrik hates a thief.”',
      hint:'Bump the north brewery stairs to descend, or head south out the gate.',
      victory:'The brass cellar is yours. Elder Maddoc pays 150 gp.',
      lose:'The company is alone in the dark.',
      rumors:['The Brass Cellar Key works only once.','A kobold war-camp sits on the lookout, east of the vale.'],
      quests:[
        {id:'thorn_kobolds',side:false,name:'Clean out the kobold hoard',lead:'Kill Skarrik in the locked cellar.',goal:'Kill Skarrik',offer:'Elder Maddoc',done:'Skarrik’s hoard is clean.',gold:150,xp:200},
        {id:'thorn_ring',side:true,name:'Widow’s Ring',lead:'Recover the Widow Marrow’s Ring (needle-trapped chest).',goal:'Recover the ring',offer:'Sergeant Brask',done:'The ring is safe.',gold:50,xp:50,needItem:'ring_widow'}
      ]},
    hollow:{code:'hollow',name:'The Hollow Vaults',lvl:1,levels:[1,3],diff:2,size:'large',length:'several hours',hub:'town',maps:['town','crypt1','crypt2','wild','tower'],
      gold:60, next:'coldharrow', final:false, names:{place:'Emberfall',giver:'Reeve Halda',trainer:'Reeve Halda'},
      blurb:'The Abbey Undercroft hoards the Dawn Reliquary.',
      intro:'The Reeve spreads the map across the table. “Three floors of crypts,” she says. “Light a lantern, and keep the Reliquary from the cult.”',
      hint:'The abbey is south of town.',
      victory:'The Vaults fall silent. The Reliquary is yours.',
      lose:'The company lies in the dark.',
      rumors:['The cult has gone quiet — too quiet.','The tower is full of gnoll war-beasts.'],
      quests:[
        {id:'redfang',side:false,name:'Chieftain Redfang',lead:'Cut the chieftain down.',goal:'Kill Redfang',offer:'Reeve Halda',done:'The chieftain is dead.',gold:250,xp:190},
        {id:'reliquary',side:false,name:'Dawn Reliquary',lead:'Recover the Reliquary from the reliquary chamber.',goal:'Recover the Reliquary',offer:'Reeve Halda',done:'The Reliquary is safe.',gold:200,xp:150,needItem:'dawn_reliquary'},
        {id:'gnolls',side:true,name:'Tamsin Hask',lead:'Recover Tamsin Hask from the Bloodmane Packlord.',goal:'Slay the Packlord',offer:'Reeve Halda',done:'Tamsin is safe.',gold:250,xp:200}
      ]},
    coldharrow:{code:'coldharrow',name:'Barrow of the Iron King',lvl:3,levels:[3,5],diff:3,size:'medium',length:'two to three hours',hub:'cold_town',maps:['cold_town','cold_mine','cold_barrow','cold_wild'],
      gold:150, next:'ravenmoor', final:false, names:{place:'Coldharrow',giver:'Thane Bergen',trainer:'Thane Bergen'},
      blurb:'The iron king’s barrow holds the king’s seal and blade.',
      intro:'Thane Bergen’s hawk-spear is wreathed in silver. “The Deepcut Mine yields its silver,” he says. “The barrow beyond it is waking. Bring back the seal.”',
      hint:'Take silver from Dunmore’s Forge to the mine.',
      victory:'The Iron King lies still.',
      lose:'The company is buried.',
      rumors:['The Iron King drains life.','A tally book was left in the foreman’s chest.'],
      quests:[
        {id:'cold_mine',side:false,name:'Slay Gorrak',lead:'Kill Gorrak Skullsplitter in the mine.',goal:'Kill Gorrak',offer:'Thane Bergen',done:'Gorrak is dead.',gold:300,xp:350},
        {id:'cold_king',side:false,name:'Lay the Iron King to rest',lead:'Slay the Iron King in the barrow.',goal:'Slay the Iron King',offer:'Thane Bergen',done:'The Iron King is resting.',gold:600,xp:600},
        {id:'cold_tally',side:true,name:'Foreman’s Tally Book',lead:'Recover the foreman’s tally book.',goal:'Recover the tally book',offer:'Thane Bergen',done:'The tally is safe.',gold:150,xp:100,needItem:'tally_book'}
      ]},
    ravenmoor:{code:'ravenmoor',name:'The Witch-Queen of Ravenmoor',lvl:5,levels:[5,7],diff:4,size:'large',length:'three hours or more',hub:'rav_fort',maps:['rav_fort','rav_moor','rav_keep','rav_pit','rav_wild'],
      gold:500, next:null, final:true, names:{place:'Fort Ravel',giver:'Commander Ysolde',trainer:'Commander Ysolde'},
      blurb:'The Witch-Queen Vharra stirs her moor.',
      intro:'Commander Ysolde has a chart of the moor and a silence to hide. “The barrow was not enough,” she says. “Down in the Witch-Pit, her minions wake. Take the badges.”',
      hint:'Burn the village. The keep is gated by the troll deed.',
      victory:'The Witch-Queen is unmade. The moor is quiet.',
      lose:'The company is shattered.',
      rumors:['Twelve patrol badges vanished with the patrol.','The trolls on the causeway are regenerating.'],
      quests:[
        {id:'rav_moor',side:false,name:'Gnashrot’s Hollow',lead:'Slay Gnashrot in the burned village.',goal:'Slay Gnashrot',offer:'Commander Ysolde',done:'Gnashrot is dead.',gold:400,xp:350},
        {id:'rav_keep',side:false,name:'Grull’s Keep',lead:'Slay the boulder-thrower Grull.',goal:'Slay Grull',offer:'Commander Ysolde',done:'Grull is dead.',gold:500,xp:450},
        {id:'rav_witch',side:false,name:'The Witch-Queen',lead:'Slay Vharra in the Witch-Pit.',goal:'Slay Vharra',offer:'Commander Ysolde',done:'The Witch-Queen is unmade.',gold:1000,xp:1000},
        {id:'rav_patrol',side:true,name:'Twelve Badges',lead:'Recover the twelve patrol badges.',goal:'Recover the badges',offer:'Commander Ysolde',done:'The badges are returned.',gold:500,xp:250,needItem:'patrol_badge'}
      ]}
  };
  // extra monsters used by E1-E3
  Object.assign(window.DATA.MONSTERS, {
    redfang:{id:'redfang',name:'Redfang',hd:'5.0',hp:'5d8+10',ac:2,mv:8,thac0:12,atk:['1d8'],size:1,ml:4,xp:350,gold:250,tags:['goblin','cave'],fig:'humanoid',lore:'Chieftain of the vaults.',leader:1},
    malvek:{id:'malvek',name:'Malvek the Ashen',hd:'6.0',hp:'6d8+16',ac:2,mv:8,thac0:11,atk:['1d6','1d6'],size:1,ml:4,xp:500,gold:200,tags:['mage','undead'],fig:'wizard',lore:'The Ashen Regent.',caster:6},
    gnoll_leader:{id:'gnoll_leader',name:'Bloodmane Packlord',hd:'5.0',hp:'5d8+8',ac:2,mv:10,thac0:12,atk:['1d8'],size:1,ml:3,xp:450,gold:200,tags:['goblin','beast'],fig:'wolf',lore:'The pack’s lord.',leader:1},
    gnashrot:{id:'gnashrot',name:'Gnashrot',hd:'7.0',hp:'7d10+7',ac:2,mv:8,thac0:11,atk:['1d10'],size:1.5,ml:4,xp:550,gold:300,tags:['devil'],fig:'devil',lore:'The gnashing shade.',evil:1},
    grull:{id:'grull',name:'Grull',hd:'9.0',hp:'9d12+10',ac:2,mv:6,thac0:10,atk:['1d12'],size:2,ml:4,xp:700,gold:400,tags:['giant','evil'],fig:'ogre',lore:'The boulder-thrower.',leader:1},
    vharra:{id:'vharra',name:'Vharra, the Witch-Queen',hd:'10.0',hp:'10d8+24',ac:2,mv:8,thac0:11,atk:['1d8'],size:1,ml:4,xp:1100,gold:700,tags:['mage','undead'],fig:'woman',lore:'The Witch-Queen of Ravenmoor.',caster:7,leader:1},
    iron_king:{id:'iron_king',name:'The Iron King',hd:'10.0',hp:'10d12+14',ac:2,mv:8,thac0:10,atk:['1d12'],size:2,ml:4,xp:1100,gold:600,tags:['undead','evil'],fig:'humanoid',lore:'The Iron King.',leader:1},
    gorrak:{id:'gorrak',name:'Gorrak Skullsplitter',hd:'7.0',hp:'7d10+8',ac:2,mv:8,thac0:11,atk:['1d10'],size:1.5,ml:3,xp:700,gold:350,tags:['cave'],fig:'humanoid',lore:'The mine’s champion.',leader:1},
    troll_leader:null,
    troll_regenerating:{id:'troll_regenerating',name:'Regenerating Troll',hd:'9.6',hp:'9d10+6',ac:2,mv:8,thac0:10,atk:['1d12'],size:2,ml:3,xp:700,gold:200,tags:['giant','undead'],fig:'troll',lore:'Heals each round.',regenerate:2},
    bugbear:{id:'bugbear',name:'Bugbear',hd:'8.0',hp:'8d8+16',ac:3,mv:8,thac0:11,atk:['1d10'],size:1.5,ml:3,xp:600,gold:150,tags:['ogre'],fig:'ogre',lore:'Thick in the marrow.',leader:1}
  });

  window.MODULES = MODULES;
  window.SAGA_ORDER = ['thornwick','hollow','coldharrow','ravenmoor'];
})();

/* expose builders for generated adventures */
window.BUILDERS = {
  village: window.BUILDERS_VILLAGE,
  dungeon: window.BUILDERS_DUNGEON,
  wild: window.BUILDERS_WILD
};
