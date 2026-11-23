/* monsters.js — wider creature catalogue, generated-encounter source */
(function(){
  const DATA = window.DATA;
  const extra = [
    ['bear','Bear','4.0','4d8+8',3,'10','13',['1d8'],1.5,0,300,60,['beast'],'beast','A hulking bear.'],
    ['spider','Giant Spider','3.0','3d8+2',3,'8','13',['1d8'],1,0,150,10,['vermin'],'spider','Eight legs and a fang.'],
    ['bat','Vampire Bat','0.5','1d4',4,'10','17',['1d4'],0.5,0,15,5,['flying'],'bat','A fluttering menace.'],
    ['wraith','Wraith','5.0','5d8+6',1,'12','11',['1d8'],1,1,450,200,['undead','flying'],'ghost','A spectral hound.'],
    ['hell_hound2','Hell Hound','3.0','3d6+4',2,'16','12',['1d8'],1,1,250,40,['beast','fire'],'wolf','Burning and cruel.'],
    ['gnoll_warrior','Gnoll Warrior','3.4','3d8+3',3,'10','13',['1d6'],1,1,180,25,['goblin','beast'],'wolf','Pack-leader and tracker.'],
    ['sphinx','Sphinx','9.0','9d10+10',2,'8','10',['1d12'],2,3,800,250,['undead','flying'],'humanoid','A winged riddle.'],
    ['medusa','Medusa','6.0','6d8+12',2,'8','11',['1d8'],1,3,450,200,['undead','evil'],'woman','Her gaze turns to stone.'],
    ['wyvern','Wyvern','8.0','8d12+8',1,'10','10',['1d12'],2,3,800,300,['dragon','flying'],'dragon','A flying terror.'],
    ['assassin','Assassin','4.0','4d6+8',3,'8','12',['1d6'],1,1,250,80,['humanoid'],'humanoid','A blade in the shadow.'],
    ['troglodyte','Troglodyte','4.0','4d8+8',3,'8','12',['1d8'],1,1,300,60,['cave'],'humanoid','A stalking cavern-dweller.'],
    ['salamander','Salamander','5.0','5d10+10',2,'8','11',['1d10'],1,2,450,150,['fire'],'dragon','A wreathed lizard.'],
    ['vampire','Vampire','7.0','7d8+14',2,'8','11',['1d8'],1,3,600,250,['undead','evil'],'ghost','The night-riding lord.'],
    ['lich','Lich','9.0','9d10+14',2,'8','10',['1d12'],1,3,900,400,['undead','mage','evil'],'wizard','The undead archmage.',{caster:9,evil:1}],
    ['fire_elemental','Fire Elemental','7.0','7d10+10',2,'8','11',['1d10'],2,4,700,250,['fire','evil'],'fire','A wreathed fist.',{breath:{dmg:'2d6',range:20,save:'breath'}}],
    ['ice_elemental','Ice Elemental','7.0','7d10+10',2,'8','11',['1d10'],2,4,700,250,['cold','evil'],'ice','A wreathed fist.',{breath:{dmg:'2d6',range:20,save:'breath'}}],
    ['death_knight','Death Knight','10.0','10d12+10',2,'8','10',['1d12'],2,4,1100,500,['undead','evil'],'humanoid','The knight of cold.',{leader:1}],
    ['dragon_wyrm','Wyrm','9.0','9d10+12',2,'10','10',['1d12'],2,4,900,300,['dragon'],'dragon','A winged terror.',{flying:1}],
    ['goblin_chief','Goblin Chieftain','2.5','2d8+5',3,'8','13',['1d6'],1,2,120,60,['goblin'],'humanoid','War-feasting.',{leader:1}],
    ['prowler','Prowler','3.0','3d6+4',3,'10','13',['1d6'],1,0,180,30,['beast'],'wolf','Low and quick.'],
    ['boggard','Boggard','6.0','6d8+12',2,'8','11',['1d8'],1,3,450,150,['undead'],'ghost','A water-bound demon.'],
    ['wight','Wight','5.0','5d10+4',2,'8','11',['1d12'],1,2,400,120,['undead'],'skeleton','A rattling corpse.'],
    ['succubus','Succubus','5.0','5d6+6',2,'8','11',['1d6'],1,3,400,150,['devil','evil'],'woman','The moor’s siren.',{evil:1}]
  ];
  for(const [id,name,hd,hp,ac,mv,thac0,atk,size,ml,xp,gold,tags,fig,lore,extra2] of extra){
    DATA.MONSTERS[id] = Object.assign({id,name,hd,hp,ac,mv,thac0,atk,size,ml,xp,gold,tags,fig,lore}, extra2||{});
  }
  // source of encounters by terrain
  window.WILDS_DATA = {
    table:[
      {terrains:['forest'],mons:['wolf','bear','spider','elf_archer']},
      {terrains:['grass','road'],mons:['bandit','goblin','wolf']},
      {terrains:['hills'],mons:['goblin','gnoll_warrior','ogre']},
      {terrains:['swamp','fen'],mons:['boggard','spider','wolf']}
    ]
  };
})();
