/* wilds.js — authored region encounter data and rumors */
(function(){
  const DATA = window.DATA;
  // enrich the three authored wilderness maps with encounter tables
  const AUTHORED = ['thorn_wild','cold_wild','rav_wild'];
  for(const id of AUTHORED){
    const m = (window.MAPS||{})[id];
    if(!m) continue;
    m.encTable = ['bandit','wolf','goblin','bear','prowler','kobold'];
    m.rumors = ['The road south leads into the wilderness.','Watch the forest edge.','The fen is worse than it looks.'];
    m.travellers = ['merchant','pilgrim'];
  }
  window.WILDS_DATA = window.WILDS_DATA || {};
  for(const id of AUTHORED){
    (window.WILDS_DATA[id] = window.WILDS_DATA[id] || {}).table = ['bandit','wolf','goblin','bear','prowler'];
  }
})();
