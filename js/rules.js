/* rules.js — dice, races, classes, stats, saves, XP */
window.RULES = (function(){
  // ---------- dice ----------
  function rnd(n,d,k){ // NdS+K / NdS-K / NdS
    n=n||1; d=d||6; k=k||0;
    let t=0; for(let i=0;i<n;i++) t+=1+Math.floor(Math.random()*d);
    return t+k;
  }
  function d4d6dropLow(){
    let rolls=[]; for(let i=0;i<4;i++) rolls.push(1+Math.floor(Math.random()*6));
    rolls.sort((a,b)=>a-b);
    return rolls[1]+rolls[2]+rolls[3];
  }
  // deterministic RNG for content gen
  function mulberry32(seed){ let a=seed>>>0; return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  function rr(rng,n,d,k){ n=n||1; d=d||6; k=k||0; let t=0; for(let i=0;i<n;i++) t+=1+Math.floor(rng()*d); return t+k; }

  // ---------- races ----------
  const RACES = {
    human:{id:'human',name:'Human',mv:12,mod:{},limits:{str:null,dex:null,con:null,int:null,wis:null,cha:null},desc:'Versatile, any class.'},
    dwarf:{id:'dwarf',name:'Dwarf',mv:10,mod:{con:1,cha:-1},limits:{str:null,dex:null,con:null,int:null,wis:null,cha:null},desc:'F/C/T. +1 CON −1 CHA.'},
    elf:{id:'elf',name:'Elf',mv:12,mod:{dex:1,con:-1},limits:{str:null,dex:null,con:null,int:null,wis:null,cha:null},desc:'F/R/M/C/T. +1 DEX −1 CON.'},
    gnome:{id:'gnome',name:'Gnome',mv:10,mod:{int:1,wis:-1},limits:{str:null,dex:null,con:null,int:null,wis:null,cha:null},desc:'F/C/T. +1 INT −1 WIS.'},
    half:{id:'half',name:'Half-Elf',mv:12,mod:{},limits:{},desc:'F/R/M/C/T. No adjustment.'},
    half_elf:{id:'half_elf',name:'Half-Elf',mv:12,mod:{},limits:{},desc:'F/R/M/C/T.'},
    halfling:{id:'halfling',name:'Halfling',mv:10,mod:{dex:1,str:-1},limits:{str:null,dex:null,con:null,int:null,wis:null,cha:null},desc:'F/C/T. +1 DEX −1 STR.'}
  };
  const CLASSES = {
    F:{id:'F',name:'Fighter',hd:'d10',mins:{str:9},req:['str'],lvl2xp:2000,gold:'5d4',can:['F','P','R'],desc:'Any melee weapon family; +1 hit, +2 dmg, extra half attack.'},
    P:{id:'P',name:'Paladin',hd:'d10',mins:{str:12,con:9,wis:13,cha:17},req:['str','cha'],lvl2xp:2250,gold:'5d4',can:[],desc:'Lawful human only. +2 saves, lay hands 2HP/lvl/rest.'},
    R:{id:'R',name:'Ranger',hd:'d10',mins:{str:13,dex:13,con:14,wis:14},req:['str','dex','wis'],lvl2xp:2250,gold:'5d4',can:[],desc:'Good only; choose a species enemy.'},
    M:{id:'M',name:'Mage',hd:'d4',mins:{int:9},req:['int'],lvl2xp:2500,gold:'1d4+1',can:[],desc:'Spellbook; no ordinary armor.'},
    C:{id:'C',name:'Cleric',hd:'d8',mins:{wis:9},req:['wis'],lvl2xp:1500,gold:'3d6',can:[],desc:'Blunt weapons, priest spells.'},
    T:{id:'T',name:'Thief',hd:'d6',mins:{dex:9},req:['dex'],lvl2xp:1250,gold:'2d6',can:[],desc:'Light armor, locks, traps, silent movement.'}
  };
  const CLASS_RACE_LIMITS = {F:{human:1,dwarf:1,elf:1,gnome:1,half:1,half_elf:1,halfling:1},P:{human:1},R:{human:1,elf:1,half:1,half_elf:1},M:{human:1,elf:1,half:1,half_elf:1},C:{human:1,dwarf:1,elf:1,gnome:1,half:1,half_elf:1,halfling:1},T:{human:1,dwarf:1,elf:1,gnome:1,half:1,half_elf:1,halfling:1}};
  // alignment filters: lawful good classes (paladin) etc. In this table the classes with
  // alignment restrictions are paladin (LG) and ranger (good); thief not LG.
  const CLASS_ALIGN_OK = {P:['lawful_good'],R:['lawful_good','neutral_good','chaotic_good'],T:['any']}; // Thief not lawful good
  // XP thresholds (first level-up), per class, scaled to match table at level 2.
  const XP_TABLES = {}; // filled per class: index 0 = level1->2 threshold
  (function(){
    const base = [2000,4500,8000,13000,20000,30000,45000,65000,95000,140000,200000,280000,390000,540000,750000,1050000,1450000,2000000,2750000];
    const scale = {F:1,P:1.125,R:1.125,M:1.25,C:0.75,T:0.625};
    for(const c of ['F','P','R','M','C','T']){
      XP_TABLES[c]=base.map((v,i)=>Math.round(v*scale[c]/50)*50);
      XP_TABLES[c][0]=CLASSES[c].lvl2xp;
    }
  })();
  // saves by level index (0 = lvl1): paralyz/death, rod/staff, petrify, breath, spell
  const SAVE_TABLE = [
    [14,16,15,17,17],[14,15,14,16,16],[13,15,14,16,15],[13,14,13,15,15],[12,14,13,15,14],
    [12,13,12,14,14],[11,13,12,14,13],[11,12,11,13,13],[10,12,11,13,12],[10,11,10,12,12],
    [9,11,10,12,11],[9,10,9,11,11],[8,10,9,11,10],[8,9,8,10,10],[7,9,8,10,9],[7,8,7,9,9],
    [6,8,7,9,8],[6,7,6,8,8],[5,7,6,8,8],[5,6,5,7,7]
  ];
  // spell slots by level (index 0=lvl1): {1st:[n],2nd:[n],...}
  const MAGE_SLOTS = [
    {1:4},{1:4,2:1},{1:5,2:2},{1:5,2:2,3:1},{1:6,2:3,3:1},{1:6,2:3,3:2},{1:7,2:4,3:2,4:1},{1:7,2:4,3:2,4:1},{1:8,2:5,3:3,4:2},{1:8,2:5,3:3,4:2},{1:9,2:6,3:4,4:3},{1:9,2:6,3:4,4:3},{1:10,2:7,3:5,4:3},{1:10,2:7,3:5,4:4},{1:11,2:8,3:5,4:4},{1:11,2:8,3:6,4:5},{1:12,2:9,3:6,4:5},{1:12,2:9,3:7,4:5,5:1},{1:13,2:10,3:7,4:6,5:1},{1:13,2:10,3:7,4:6,5:2}
  ];
  const CLERIC_SLOTS = [
    {1:3},{1:3,2:1},{1:4,2:1},{1:4,2:2},{1:5,2:2},{1:5,2:2,3:1},{1:6,2:3,3:1},{1:6,2:3,3:2},{1:7,2:3,3:2},{1:7,2:4,3:2,4:1},{1:8,2:4,3:3,4:1},{1:8,2:5,3:3,4:1},{1:9,2:5,3:4,4:2},{1:9,2:5,3:4,4:2},{1:10,2:6,3:4,4:2,5:1},{1:10,2:6,3:5,4:3,5:1},{1:11,2:7,3:5,4:3,5:1},{1:11,2:7,3:5,4:3,5:2},{1:12,2:8,3:6,4:4,5:2},{1:12,2:8,3:6,4:4,5:2}
  ];
  const PALADIN_SLOTS = [
    {9:1},{9:1},{9:1,8:1},{9:1,8:1},{9:1,8:2},{9:1,8:2},{9:1,8:2,7:1},{9:1,8:2,7:1},{9:1,8:2,7:1},{9:1,8:2,7:2},{9:1,8:2,7:2,6:1},{9:1,8:2,7:2,6:1},{9:1,8:2,7:2,6:2},{9:1,8:2,7:2,6:2},{9:1,8:2,7:2,6:2},{9:1,8:2,7:2,6:2,5:1},{9:1,8:2,7:2,6:2,5:1},{9:1,8:2,7:2,6:2,5:1},{9:1,8:2,7:2,6:2,5:1},{9:1,8:2,7:2,6:2,5:1}
  ];
  // note: paladin spells list = priest list subset; level index → spell level distribution
  // hp gain after level 9
  return {
    rnd, d4d6dropLow, mulberry32, rr,
    RACES, CLASSES, CLASS_RACE_LIMITS, CLASS_ALIGN_OK, XP_TABLES, SAVE_TABLE, MAGE_SLOTS, CLERIC_SLOTS, PALADIN_SLOTS,
    // derived helpers ------------------------------------------------
    baseStats(race){
      // roll in order str,dex,con,int,wis,cha then apply racial mods
      const raw = {str:d4d6dropLow(),dex:d4d6dropLow(),con:d4d6dropLow(),int:d4d6dropLow(),wis:d4d6dropLow(),cha:d4d6dropLow()};
      const adj = Object.assign({}, raw);
      const r = RACES[race];
      for(const k in r.mod) adj[k] = (adj[k]||0) + r.mod[k];
      return adj;
    },
    validClassFor(ch){
      const cls = ch.cls; if(!CLASSES[cls]) return 'no class';
      const r = ch.race;
      const limits = CLASS_RACE_LIMITS[cls]; if(limits && !limits[r]) return 'race not allowed for this class';
      const mins = CLASSES[cls].mins;
      for(const k in mins) if((ch[k]||0) < mins[k]) return `needs ${k.toUpperCase()} ${mins[k]}`;
      // alignment check
      if(cls==='P' && ch.align!=='lawful_good') return 'paladin requires lawful good';
      if(cls==='R' && !['lawful_good','neutral_good','chaotic_good'].includes(ch.align)) return 'ranger must be good';
      if(cls==='T' && ch.align==='lawful_good') return 'thief may not be lawful good';
      return null;
    },
    thac0(ch){
      const n = Math.max(0,(ch.lvl||1)-1);
      if(ch.cls==='F'||ch.cls==='P'||ch.cls==='R') return 20-n;
      if(ch.cls==='M') return 20-Math.floor(n/3);
      if(ch.cls==='T') return 20-Math.floor(n/2);
      return 20-2*Math.floor(n/3); // priests
    },
    baseAC(ch,eq){
      // eq: resolved equipment info or null. Return {ac, armor}
      let ac = 10; const armor = eq && eq.armor;
      if(armor){ ac = armor.ac; if(armor.enchant) ac -= armor.enchant; }
      // DEX defense
      if((ch.cls==='F'||ch.cls==='P'||ch.cls==='R'||ch.cls==='T')) {
        const dexPen = Math.floor(((ch.dex||10)-10)/2); // lower AC with dex
        ac -= dexPen;
      }
      if(eq && eq.shield){ ac -= 1 + (eq.shield.enchant||0); }
      if(eq && eq.cloak && eq.cloak.def){ ac -= eq.cloak.def; }
      if(eq && eq.armor && eq.armor.weave){ /* cloth bonus */ }
      return ac; // negative allowed
    },
    meleeAttacks(ch){
      const lv = ch.lvl||1;
      if(ch.cls==='F'||ch.cls==='P'||ch.cls==='R'){
        if(lv>=13) return 2; if(lv>=7) return 1.5; return 1;
      }
      return 1;
    },
    fighterHalfAttack(ch){ return (ch.cls==='F'||ch.cls==='P'||ch.cls==='R') && (ch.spec||null); },
    maxHp(ch, level){
      const cls = CLASSES[ch.cls]; const lv = level||ch.lvl||1;
      let hp;
      if(cls.hd==='d4') hp = Math.floor((lv*2.5)) ; // mage avg
      else if(cls.hd==='d6') hp = Math.floor(lv*3.5);
      else if(cls.hd==='d8') hp = Math.floor(lv*4.5);
      else hp = Math.floor(lv*5.5);
      // first level uses full die; simplify: compute stronger at low levels
      if(lv<=9){
        const dieMid = {d4:2.5,d6:3.5,d8:4.5,d10:5.5}[cls.hd];
        hp = Math.floor(dieMid*lv) + (ch.con||10)/4*lv;
      } else {
        const fixed = {d4:1,d6:2,d8:2,d10:3}[cls.hd];
        hp = hp + fixed*(lv-9);
      }
      return Math.max(1, Math.round(hp));
    },
    totalMaxHp(ch){ // accurate-ish based on rolled hp tracked or recompute
      return ch.maxhp || RULES.maxHp(ch, ch.lvl||1);
    },
    saves(ch){
      const i = Math.min(19, Math.max(0,(ch.lvl||1)-1));
      const base = SAVE_TABLE[i].slice();
      let bonus = 0;
      if(ch.cls==='P') bonus += 2;
      if(ch.race==='dwarf'||ch.race==='gnome'||ch.race==='halfling') bonus += Math.floor((ch.con||10)/4);
      if(ch.race==='dwarf'||ch.race==='halfling') bonus += 0; // poison-specific handled in combat via save index 0
      return {paralyz:base[0]+bonus, rod:base[1]+bonus, petrify:base[2]+bonus, breath:base[3]+bonus, spell:base[4]+bonus, base};
    },
    thiefSkill(ch, skill){
      if(ch.cls!=='T') return 0;
      const by = {locks:20,trap:15,silent:20,hide:15,hear:15};
      let v = by[skill] || 0;
      v += (ch.lvl-1)*5;
      v += Math.floor((ch.dex||10)/4)*5;
      if(ch.race==='halfling' && skill!=='hear') v += 5;
      if(ch.race==='elf' && (skill==='silent'||skill==='hide')) v += 5;
      return Math.min(95, Math.max(0, v));
    },
    xpNeeded(ch, targetLevel){
      const tbl = XP_TABLES[ch.cls]||XP_TABLES.T;
      const idx = (targetLevel||ch.lvl||1)-2; // index 0 = level1->2 threshold
      if(idx<0||idx>=tbl.length) return null;
      return tbl[idx];
    },
    goldRoll(spec){ // '5d4' etc → int gp
      const m = /^(\d+)d(\d+)([+-]\d+)?$/.exec(spec||'1d4');
      if(!m) return 5;
      return rnd(parseInt(m[1]), parseInt(m[2]), m[3]?parseInt(m[3]):0);
    }
  };
})();
