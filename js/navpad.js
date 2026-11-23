/* navpad.js — on-screen direction pad */
window.NAVPAD = (function(){
  let mode = localStorage.getItem('emberfall.navpad') === '1' ? 'right' : 'right'; // default right for coarse
  let prefs = {repeat:true};
  function set(m){ mode = m; localStorage.setItem('emberfall.navpad', m==='off'?'0':'1'); render(); }
  function render(){
    const pad = document.getElementById('navpad'); if(!pad) return;
    if(mode==='off'){ pad.style.display='none'; return; }
    pad.style.display = mode==='both'?'flex':'block';
    pad.className = mode;
    pad.innerHTML = '';
    const make = (dir, label, cls) => {
      const b = document.createElement('button');
      b.className = 'pad-btn '+ (cls||'');
      b.textContent = label;
      b.addEventListener('pointerdown', e=>{ e.preventDefault(); b.setPointerCapture(e.pointerId); repeat(b); press(dir); });
      b.addEventListener('pointerup', ()=>stopRepeat(b));
      b.addEventListener('pointerleave', ()=>stopRepeat(b));
      return b;
    };
    const pad2 = document.createElement('div'); pad2.className='pad-inner';
    const grid = document.createElement('div'); grid.className='pad-inner';
    const up = make('up','▲'); pad2.appendChild(up);
    const left = make('left','◀'); pad2.appendChild(left);
    const right = make('right','▶'); pad2.appendChild(right);
    const down = make('down','▼'); pad2.appendChild(down);
    const fwd = make('fwd','→'); pad2.appendChild(fwd);
    pad2.style.display='grid'; pad2.style.gridTemplateColumns='1fr 1fr 1fr';
    // layout: up row, left/turn/right row, down
    pad.appendChild(pad2);
  }
  let repeatTimer = null;
  function press(dir){ if(window.GAME) GAME.navpadPress(dir); }
  function repeat(b){ clearInterval(b._r); b._r = setInterval(()=>press(b.dataset.dir), 110); }
  function stopRepeat(b){ clearInterval(b._r); }
  return {set, render, get:()=>mode};
})();
