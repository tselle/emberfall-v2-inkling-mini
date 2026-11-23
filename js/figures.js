/* figures.js — procedural figures, portraits, tokens */
window.FIGURES = (function(){
  const SKINS = {human:'#e0b088',dwarf:'#d8a070',elf:'#f0d8b8',gnome:'#e8c088',half_elf:'#e8c8a0',halfling:'#e0c090',rat:'#a88868',spider:'#705860',wolf:'#806048',crab:'#405',ghoul:'#90a070',skeleton:'#d8d0b8',ogre:'#90a060',dragon:'#b85040',troll:'#70a060',gargoyle:'#909098',fire:'#e07030',ghost:'#c0c8d0',rabbit:'#c09080',bird:'#808080',humanoid:'#d8b890',woman:'#e0b080',wizard:'#d0c8b0',minotaur:'#a88458',skeleton_old:'#c0b898'};
  function skin(desc){ return SKINS[desc.race] || SKINS[desc.base] || '#d8b890'; }
  function drawFigure(ctx, desc, cx, cy, s){
    // desc: {race,cls,color,shape,gear,shield,size}
    const shape = desc.shape || 'humanoid';
    ctx.save();
    ctx.translate(cx, cy);
    const col = desc.color || '#c0b090';
    if(shape==='rat'){
      ctx.fillStyle = col||'#a08868';
      ctx.beginPath(); ctx.ellipse(0,0,s*0.36,s*0.22,0,0,Math.PI*2); ctx.fill(); // body
      ctx.beginPath(); ctx.ellipse(0,-s*0.28,s*0.14,s*0.13,0,0,Math.PI*2); ctx.fill(); // head
      ctx.strokeStyle = '#c0b090'; ctx.lineWidth = s*0.04;
      ctx.beginPath(); ctx.moveTo(-s*0.3,s*0.05); ctx.quadraticCurveTo(-s*0.6,s*0.2,-s*0.5,s*0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,-s*0.36); ctx.lineTo(-s*0.18,-s*0.5); ctx.stroke(); // ear
    } else if(shape==='spider'){
      ctx.fillStyle = col||'#605040';
      ctx.beginPath(); ctx.arc(0,0,s*0.28,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(0,-s*0.22,s*0.16,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = col||'#605040'; ctx.lineWidth = s*0.045;
      for(let i=0;i<4;i++){ const a = (i/4)*Math.PI - Math.PI/2; const sx = Math.cos(a)*s*0.34, sy = Math.sin(a)*s*0.34;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(sx*0.6, sy*0.6 - s*0.1, sx + s*0.18, sy + s*0.22); ctx.stroke(); }
    } else if(shape==='wolf'||shape==='beast'){
      ctx.fillStyle = col||'#806050';
      ctx.beginPath(); ctx.ellipse(0,0,s*0.38,s*0.2,0,0,Math.PI*2); ctx.fill(); // body
      ctx.beginPath(); ctx.ellipse(s*0.34,-s*0.18,s*0.16,s*0.12,-0.3,0,Math.PI*2); ctx.fill(); // head
      ctx.fillRect(-s*0.3,s*0.18,s*0.1,s*0.3); ctx.fillRect(s*0.14,s*0.18,s*0.1,s*0.3);
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(s*0.44,-s*0.22,s*0.03,0,Math.PI*2); ctx.fill();
    } else if(shape==='dragon'){
      ctx.fillStyle = col||'#b85040';
      ctx.beginPath(); ctx.moveTo(-s*0.4, s*0.1); ctx.lineTo(-s*0.05,-s*0.3); ctx.lineTo(s*0.4,s*0.1); ctx.lineTo(s*0.05,s*0.2); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0,0,s*0.26,s*0.18,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffd060'; ctx.beginPath(); ctx.arc(-s*0.08,-s*0.08,s*0.045,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-s*0.18,-s*0.2); ctx.quadraticCurveTo(-s*0.5,-s*0.5,-s*0.7,-s*0.2); ctx.quadraticCurveTo(-s*0.4,-s*0.05,-s*0.18,-s*0.1); ctx.closePath(); ctx.fill();
    } else if(shape==='skeleton'){
      ctx.fillStyle = '#d8d0b0';
      ctx.beginPath(); ctx.arc(0,-s*0.5,s*0.18,0,Math.PI*2); ctx.fill();
      ctx.fillRect(-s*0.14,-s*0.3,s*0.28,s*0.5);
      ctx.strokeStyle = '#d8d0b0'; ctx.lineWidth = s*0.05;
      ctx.beginPath(); ctx.moveTo(-s*0.2,-s*0.05); ctx.lineTo(-s*0.32,s*0.3); ctx.moveTo(s*0.2,-s*0.05); ctx.lineTo(s*0.32,s*0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s*0.12,s*0.2); ctx.lineTo(-s*0.16,s*0.55); ctx.moveTo(s*0.12,s*0.2); ctx.lineTo(s*0.16,s*0.55); ctx.stroke();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-s*0.07,-s*0.52,s*0.05,0,Math.PI*2); ctx.arc(s*0.07,-s*0.52,s*0.05,0,Math.PI*2); ctx.fill();
    } else if(shape==='ghost'){
      ctx.fillStyle = 'rgba(200,210,224,0.85)';
      ctx.beginPath(); ctx.moveTo(-s*0.4, s*0.6); ctx.lineTo(-s*0.4, -s*0.1); ctx.arc(0,-s*0.1, s*0.4, Math.PI, 0); ctx.lineTo(s*0.4, s*0.6); ctx.lineTo(s*0.2,s*0.4); ctx.lineTo(0,s*0.6); ctx.lineTo(-s*0.2,s*0.4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(-s*0.14,-s*0.15,s*0.06,0,Math.PI*2); ctx.arc(s*0.14,-s*0.15,s*0.06,0,Math.PI*2); ctx.fill();
    } else if(shape==='ogre' || shape==='troll'){
      ctx.fillStyle = col||'#909050';
      ctx.beginPath(); ctx.ellipse(0,0,s*0.34,s*0.44,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(0,-s*0.5,s*0.2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#223'; ctx.beginPath(); ctx.arc(-s*0.09,-s*0.52,s*0.035,0,Math.PI*2); ctx.arc(s*0.09,-s*0.52,s*0.035,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = col||'#909050'; ctx.lineWidth = s*0.08; ctx.beginPath(); ctx.moveTo(-s*0.32,0); ctx.lineTo(-s*0.5,s*0.4); ctx.moveTo(s*0.32,0); ctx.lineTo(s*0.5,s*0.4); ctx.stroke();
    } else if(shape==='fire'){
      ctx.fillStyle = '#e07030';
      ctx.beginPath(); ctx.ellipse(0,0,s*0.3,s*0.45,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffd060'; ctx.beginPath(); ctx.ellipse(0,s*0.15,s*0.16,s*0.28,0,0,Math.PI*2); ctx.fill();
    } else if(shape==='insect'){
      ctx.fillStyle = col||'#706050';
      ctx.beginPath(); ctx.ellipse(0,0,s*0.26,s*0.4,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = col||'#706050'; ctx.lineWidth = s*0.04;
      for(let i=0;i<3;i++){ const yoff = (i-1)*s*0.18; ctx.beginPath(); ctx.moveTo(-s*0.26,yoff); ctx.lineTo(-s*0.5,yoff - s*0.1); ctx.moveTo(s*0.26,yoff); ctx.lineTo(s*0.5,yoff - s*0.1); ctx.stroke(); }
    } else if(shape==='centipede'){
      ctx.fillStyle = col||'#806050';
      for(let i=0;i<6;i++){ ctx.beginPath(); ctx.arc((i-2.5)*s*0.16, 0, s*0.09, 0, Math.PI*2); ctx.fill(); }
      ctx.beginPath(); ctx.arc(s*0.42, -s*0.05, s*0.1, 0, Math.PI*2); ctx.fill();
    } else { // humanoid
      const h = s*0.55;
      ctx.fillStyle = col||'#c0a070';
      // body
      ctx.beginPath(); ctx.moveTo(-s*0.28, s*0.5); ctx.quadraticCurveTo(-s*0.3, -s*0.15, -s*0.18, -s*0.2); ctx.lineTo(s*0.18, -s*0.2); ctx.quadraticCurveTo(s*0.3, -s*0.15, s*0.28, s*0.5); ctx.closePath(); ctx.fill();
      // head
      ctx.beginPath(); ctx.arc(0,-s*0.32,s*0.22,0,Math.PI*2); ctx.fill();
      // shoulders
      ctx.fillRect(-s*0.32,-s*0.2,s*0.64,s*0.14);
      // class gear
      if(desc.gear==='sword'){ ctx.strokeStyle='#e8e0c0'; ctx.lineWidth=s*0.05; ctx.beginPath(); ctx.moveTo(s*0.34,s*0.1); ctx.lineTo(s*0.5,-s*0.4); ctx.stroke(); }
      if(desc.gear==='bow'){ ctx.strokeStyle='#8a6a40'; ctx.lineWidth=s*0.05; ctx.beginPath(); ctx.arc(s*0.32,-s*0.02,s*0.32,-Math.PI/2,Math.PI/2); ctx.stroke(); }
      if(desc.gear==='staff'){ ctx.strokeStyle='#8a6a40'; ctx.lineWidth=s*0.05; ctx.beginPath(); ctx.moveTo(s*0.34,s*0.2); ctx.lineTo(s*0.34,-s*0.55); ctx.stroke(); ctx.fillStyle='#9ad0ff'; ctx.beginPath(); ctx.arc(s*0.34,-s*0.58,s*0.07,0,Math.PI*2); ctx.fill(); }
      if(desc.gear==='mace'){ ctx.strokeStyle='#8a6a40'; ctx.lineWidth=s*0.05; ctx.beginPath(); ctx.moveTo(s*0.34,s*0.1); ctx.lineTo(s*0.34,-s*0.3); ctx.stroke(); ctx.fillStyle='#909098'; ctx.beginPath(); ctx.arc(s*0.34,-s*0.36,s*0.08,0,Math.PI*2); ctx.fill(); }
      if(desc.gear==='dagger'){ ctx.strokeStyle='#e8e0c0'; ctx.lineWidth=s*0.04; ctx.beginPath(); ctx.moveTo(s*0.32,s*0.1); ctx.lineTo(s*0.46,-s*0.12); ctx.stroke(); }
      if(desc.shield){ ctx.fillStyle='#6a7080'; ctx.beginPath(); ctx.ellipse(-s*0.36,-s*0.02,s*0.1,s*0.24,0,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#d0d0d0'; ctx.lineWidth=s*0.02; ctx.stroke(); }
      if(desc.headwear==='hood'){ ctx.fillStyle='rgba(60,50,90,0.9)'; ctx.beginPath(); ctx.arc(0,-s*0.38,s*0.28,Math.PI*0.9,Math.PI*2.1); ctx.fill(); }
      if(desc.headwear==='helm'){ ctx.fillStyle='#8890a0'; ctx.beginPath(); ctx.arc(0,-s*0.38,s*0.24,Math.PI*0.8,Math.PI*2.2); ctx.fill(); }
      if(desc.headwear==='crown'){ ctx.fillStyle='#e3b54a'; ctx.beginPath(); ctx.moveTo(-s*0.22,-s*0.42); ctx.lineTo(-s*0.12,-s*0.58); ctx.lineTo(0,-s*0.44); ctx.lineTo(s*0.12,-s*0.58); ctx.lineTo(s*0.22,-s*0.42); ctx.closePath(); ctx.fill(); }
    }
    ctx.restore();
  }

  function figForChar(ch){
    if(!ch) return {};
    const gearFor = {F:'sword',P:'sword',R:'bow',M:'staff',C:'mace',T:'dagger'};
    const hp = ch.cls==='M'?'hood':(ch.cls==='P'||ch.cls==='F'?'helm':null);
    return {race:ch.race,cls:ch.cls,color:ch.color||'#c0a070',shape:'humanoid',gear:gearFor[ch.cls],shield:!!(ch.eq && ch.eq.shield),headwear:hp};
  }
  function figForMonster(mon){
    const shape = mon.fig || 'humanoid';
    const gear = mon.ml>=3 ? 'sword' : null;
    return {shape, race:shape, color:(shape==='dragon'?'#b85040':(shape==='skeleton'?'#c8c0a0':(shape==='ghost'?'#c0c8d0':'#b09070'))), gear, headwear:mon.leader?'crown':null};
  }
  function portrait(ctx, desc, w, h){
    ctx.clearRect(0,0,w,h);
    const g = ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#2a2d3d'); g.addColorStop(1,'#1a1c28');
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    drawFigure(ctx, desc, w/2, h*0.62, Math.min(w*0.85, h*0.9));
  }
  function portraitChar(ctx, ch, w, h){ portrait(ctx, figForChar(ch), w, h); }

  return {drawFigure, figForChar, figForMonster, portrait, portraitChar};
})();
