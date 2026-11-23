/* view3d.js — first-person raycaster (Canvas 2D) */
window.VIEW3D = (function(){
  let canvas, ctx, W=0, H=0;
  let tex = {};
  let prepared = null; // {grid, w, h, px, py...}
  const FOV = Math.PI/3;
  const DIRS = [[0,-1],[1,0],[0,1],[-1,0]];

  function ensureCanvas(cv){
    canvas = cv; ctx = cv.getContext('2d');
    const r = cv.parentElement ? cv.parentElement.getBoundingClientRect() : {width:800,height:500};
    W = Math.max(320, Math.floor(r.width)); H = Math.max(200, Math.floor(r.height));
    cv.width = W; cv.height = H;
  }
  function makeTex(id, fn){ if(tex[id]) return tex[id]; const c = document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); fn(x); tex[id]=c; return c; }
  function texWallStone(){ return makeTex('wall2',(x)=>{ x.fillStyle='#3a3b46'; x.fillRect(0,0,64,64); for(let i=0;i<8;i++){ for(let j=0;j<8;j++){ const v = 30+((i*3+j*7)%9)*6; x.fillStyle=`rgb(${v+20},${v+18},${v+24})`; x.fillRect(i*8+1,j*8+1,7,7); } } x.fillStyle='#292a33'; for(let i=0;i<8;i++){ x.fillRect(i*8,0,2,64); x.fillRect(0,i*8,64,2); } }); }
  function texWallBrick(){ return makeTex('wall1',(x)=>{ x.fillStyle='#4a3226'; x.fillRect(0,0,64,64); for(let r=0;r<4;r++){ for(let i=0;i<8;i++){ const v=50+((i+r*3)%5)*8; x.fillStyle=`rgb(${v+35},${v*0.7+10},${v*0.5+5})`; x.fillRect((i*8+(r%2)*4)%64+1, r*16+1, 13, 13); } } }); }
  function texWallCrypt(){ return makeTex('wall3',(x)=>{ x.fillStyle='#24242e'; x.fillRect(0,0,64,64); for(let i=0;i<8;i++){ for(let j=0;j<4;j++){ const v=26+(i*11+j*7)%10; x.fillStyle=`rgb(${v+20},${v+20},${v+26})`; x.fillRect(i*8+1,j*16+1,7,14); } } x.fillStyle='#34343f'; for(let i=0;i<8;i++){ x.fillRect(i*8,0,2,64); } }); }
  function texFloor(){ return makeTex('floor1',(x)=>{ x.fillStyle='#332f2c'; x.fillRect(0,0,64,64); for(let i=0;i<8;i++){ for(let j=0;j<4;j++){ const v=40+(i*7+j*3)%9; x.fillStyle=`rgb(${v+18},${v+12},${v+6})`; x.fillRect(i*8+1,j*16+1,7,14); } } }); }
  function texCeil(){ return makeTex('ceil',(x)=>{ x.fillStyle='#15161f'; x.fillRect(0,0,64,64); for(let i=0;i<32;i++){ x.fillStyle='#1d1e28'; x.fillRect((i*7)%64, (i*13)%64, 3,3); } }); }

  function prepare(map, mods){
    const rows = map.grid;
    const h = rows.length, w = rows[0].length;
    // wall flags from mods (modified cells change walls)
    const modArr = [];
    if(mods) { for(const key in mods){ const parts = key.split(','); const x=+parts[0], y=+parts[1]; if(rows[y] && x>=0 && x<w) modArr.push({x,y,c:mods[key]}); } }
    prepared = {grid:rows.map(r=>r.split('')), w, h, mods:modArr, modMap:(mods||{})};
  }
  function cellChar(x,y){ const g = prepared.grid; if(x<0||y<0||x>=g[0].length||y>=g.length) return '#'; return g[y][x]; }
  function isWallCell(c){ return c==='#' || c==='H' || c==='B' || c==='T' || c==='F'; }

  function render(state){
    if(!canvas || !prepared) return;
    ensureCanvas(canvas);
    const W_ = W, H_ = H;
    const cx = state.x + 0.5, cy = state.y + 0.5;
    const angle = state.angle;
    const dirx = Math.cos(angle), diry = Math.sin(angle);
    const PF = Math.PI/3;
    // floor & ceiling with perspective bands
    const horizon = H_/2;
    const bands = 44;
    for(let i=0;i<bands;i++){
      const t0 = i/bands, t1 = (i+1)/bands;
      const y0 = horizon + (H_/2)*t0, y1 = horizon + (H_/2)*t1;
      const m = (t0+t1)/2;
      // distance-ish shading (near = brighter)
      const shade = Math.max(0.22, 1.18 - m*1.05);
      const wobble = ((i*37 + Math.floor(i/1)*13) % 5) * 2;
      ctx.fillStyle = `rgb(${Math.floor(74*shade+wobble)},${Math.floor(60*shade+wobble*0.6)},${Math.floor(46*shade)})`;
      ctx.fillRect(0, y0, W_, y1-y0+1);
      // subtle grout line every other band
      if(i%4===0){ ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fillRect(0, y0, W_, 1); }

      const cy0 = horizon - (H_/2)*t0, cy1 = horizon - (H_/2)*t1;
      const cshade = Math.max(0.3, 1 - m*0.75);
      ctx.fillStyle = `rgb(${Math.floor(26*cshade)},${Math.floor(28*cshade)},${Math.floor(36*cshade)})`;
      ctx.fillRect(0, cy1, W_, cy0-cy1+1);
      if(i%6===2){ ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, cy1, W_, 1); }
    }
    // soft horizon fog
    const fog = ctx.createLinearGradient(0,horizon - 60,0,horizon + 18);
    fog.addColorStop(0,'rgba(19,20,29,0)'); fog.addColorStop(1,'rgba(28,27,33,0.6)');
    ctx.fillStyle = fog; ctx.fillRect(0,0,W_,H_);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0,horizon - 2,W_,4);

    const rays = 200;
    const depthBuf = new Float32Array(rays);
    for(let i=0;i<rays;i++){
      const ra = angle - PF/2 + (i/(rays-1)) * PF;
      const dx = Math.cos(ra), dy = Math.sin(ra);
      const ddx = Math.abs(1/dx), ddy = Math.abs(1/dy);
      let mapX = Math.floor(cx), mapY = Math.floor(cy);
      let stepX, stepY, sideX, sideY;
      if(dx<0){ stepX=-1; sideX=(cx-mapX)*ddx; } else { stepX=1; sideX=(mapX+1-cx)*ddx; }
      if(dy<0){ stepY=-1; sideY=(cy-mapY)*ddy; } else { stepY=1; sideY=(mapY+1-cy)*ddy; }
      let hit=false, side=0, guard=0;
      while(!hit && guard++<200){
        if(sideX<sideY){ sideX+=ddx; mapX+=stepX; side=0; } else { sideY+=ddy; mapY+=stepY; side=1; }
        const c = cellChar(mapX,mapY);
        if(isWallCell(c)) hit=true;
      }
      const rgtDx = (mapX + (side===0?0:0.5)) - cx, rgtDy = (mapY + (side===1?0:0.5)) - cy;
      // corrected distance
      const dist = Math.max(0.001, side===0 ? (mapX - cx + (1-stepX)/2)/dx : (mapY - cy + (1-stepY)/2)/dy);
      const corr = dist * Math.cos(ra - angle);
      const wallH = H_ / corr;
      const tex = texWallStone();
      depthBuf[i] = corr;
      const colX = (i/(rays-1)) * W_;
      ctx.drawImage(tex, 0, 0, 64, 64, colX - (W_/rays)/2, H_/2 - wallH/2, W_/rays + 1, wallH);
      // distance shading
      const shade = Math.min(1, corr/14);
      ctx.fillStyle = `rgba(10,10,16,${shade*0.85})`;
      ctx.fillRect(colX - (W_/rays)/2, H_/2 - wallH/2, W_/rays + 1, wallH);
    }

    // billboards
    if(state && state.sprites){
      drawBillboards(ctx, W_, H_, cx, cy, angle, state.sprites, depthBuf, rays);
    }
    // HUD-lite: compass
    return {rays, depthBuf};
  }

  function drawBillboards(ctx, W_, H_, cx, cy, angle, sprites, depthBuf, rays){
    // project sprites
    const rel = [];
    for(const sp of sprites){
      const rx = sp.x - cx, ry = sp.y - cy;
      const d = rx*Math.cos(angle)+ry*Math.sin(angle);
      if(d<=0.01) continue;
      const t = -rx*Math.sin(angle)+ry*Math.cos(angle);
      rel.push({sp, d, t});
    }
    rel.sort((a,b)=>b.d-a.d);
    for(const it of rel){
      const sp = it.sp;
      const sx = W_/2 + (it.t / it.d) * (W_/2) / Math.tan(Math.PI/6);
      const sh = (H_ / it.d) * (sp.hsize||1);
      const sw = sh * (sp.wsize||0.8);
      // clip by depth buffer at center column
      const col = Math.max(0, Math.min(rays-1, Math.floor((sx/W_)*rays)));
      if(it.d > depthBuf[col]) continue;
      // draw billboard
      drawSprite(ctx, sp, sx, H_/2 + sh*0.4 - sh/2, sw, sh, it.d);
    }
  }
  function drawSprite(ctx, sp, sx, sy, sw, sh, d){
    // sprite types
    if(sp.kind==='monster'){
      ctx.save();
      drawMonster(ctx, sp, sx, sy, sw, sh);
      ctx.restore();
    } else if(sp.kind==='floor'||sp.kind==='gear'){
      // small bag icon
      ctx.fillStyle = '#6a5030'; ctx.beginPath(); ctx.ellipse(sx, sy + sh*0.3, sw*0.3, sh*0.2, 0, 0, Math.PI*2); ctx.fill();
    } else if(sp.kind==='tree'){
      ctx.fillStyle = '#2f4a24'; ctx.beginPath(); ctx.ellipse(sx, sy, sw*0.5, sh*0.5, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#3a2e1c'; ctx.fillRect(sx - sh*0.05, sy + sh*0.3, sh*0.1, sh*0.25);
    } else if(sp.kind==='fountain'){
      ctx.fillStyle = '#5a5a6a'; ctx.beginPath(); ctx.ellipse(sx, sy, sw*0.55, sh*0.3, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#4a90c0'; ctx.beginPath(); ctx.ellipse(sx, sy - sh*0.15, sw*0.38, sh*0.16, 0, 0, Math.PI*2); ctx.fill();
    } else if(sp.kind==='stairs'){
      ctx.fillStyle = '#262430'; ctx.fillRect(sx - sw*0.3, sy - sh*0.3, sw*0.6, sh*0.6);
      ctx.fillStyle = '#e3b54a'; ctx.font = `${Math.floor(sh*0.3)}px serif`; ctx.textAlign='center'; ctx.fillText(sp.down?'▼':'▲', sx, sy + sh*0.1);
    } else if(sp.kind==='chest'){
      ctx.fillStyle = '#6a4a28'; ctx.fillRect(sx - sw*0.3, sy - sh*0.2, sw*0.6, sh*0.42);
      ctx.fillStyle = '#e3b54a'; ctx.fillRect(sx - sw*0.06, sy - sh*0.18, sw*0.12, sh*0.2);
    }
  }
  function drawMonster(ctx, sp, sx, sy, sw, sh){
    if(window.FIGURES){
      const desc = typeof sp.fig === 'function' ? sp.fig() : (sp.fig || {});
      const IMG_W = sw, IMG_H = sh;
      // use cached offscreen portrait-like draw
      const off = document.createElement('canvas'); off.width = Math.max(2,Math.floor(IMG_W)); off.height = Math.max(2,Math.floor(IMG_H));
      const octx = off.getContext('2d');
      window.FIGURES.drawFigure(octx, desc, IMG_W/2, IMG_H*0.6, Math.min(IMG_W*0.85, IMG_H*0.9));
      const d = sp.d || 4; const shade = Math.min(0.75, d/16);
      ctx.globalAlpha = 1 - shade*0.5;
      ctx.drawImage(off, sx - IMG_W/2, sy - IMG_H/2, IMG_W, IMG_H);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#806050'; ctx.beginPath(); ctx.ellipse(sx, sy, sw*0.3, sh*0.45, 0, 0, Math.PI*2); ctx.fill();
    }
  }

  // minimap
  function minimap(map, mods, seen, x, y, dir, foeMarks, ground, canvas){
    const cv = canvas || document.getElementById('minimap');
    if(!cv) return;
    const ctx2 = cv.getContext('2d');
    const w = cv.width, h = cv.height;
    ctx2.clearRect(0,0,w,h);
    const rows = map.grid; const gh = rows.length, gw = rows[0].length;
    const sc = Math.min(w/gw, h/gh);
    const ox = (w - gw*sc)/2, oy = (h - gh*sc)/2;
    // cell colors
    const seenSet = seen ? seen : {};
    for(let yy=0;yy<gh;yy++){ for(let xx=0;xx<gw;xx++){
      const c = (()=>{ if(mods && mods[xx+','+yy]) return mods[xx+','+yy]; return rows[yy][xx]; })();
      const isSeen = seenSet[xx+','+yy];
      if(!isSeen) continue;
      let color = 'transparent';
      if(c==='#') color = '#3a3d4d';
      else if(c==='H'||c==='B') color = '#4a3a2a';
      else if(c==='T') color = '#2a4a24';
      else if(c==='F') color = '#3a4a5a';
      else if(c==='G') color = '#5a5a3a';
      else if(c==='>'||c==='<') color = '#e3b54a';
      else if(c==='L') color = '#a03030';
      else if(c==='S') color = '#2a4a24';
      else if(c>='a'&&c<='z') color = '#7a5a3a';
      else if(c>='1'&&c<='9') color = '#3a6a5a';
      else if(c==='D') color = '#7a6038';
      else if(c===',') color = '#2e4024';
      else color = '#1f2230';
      ctx2.fillStyle = color; ctx2.fillRect(ox+xx*sc, oy+yy*sc, sc-0.5, sc-0.5);
    }}
    // revealed border around party
    // foe marks
    if(foeMarks) for(const f of foeMarks){ ctx2.fillStyle='#c8502c'; ctx2.beginPath(); ctx2.moveTo(ox+f.x*sc+sc/2, oy+f.y*sc+sc/2 - sc*0.3); ctx2.lineTo(ox+f.x*sc+sc*0.8, oy+f.y*sc+sc*0.7); ctx2.lineTo(ox+f.x*sc+sc*0.2, oy+f.y*sc+sc*0.7); ctx2.closePath(); ctx2.fill(); }
    // ground loot
    if(ground) for(const key in ground){ const [gx,gy] = key.split(',').map(Number); ctx2.fillStyle='#e3b54a'; ctx2.beginPath(); ctx2.arc(ox+gx*sc+sc/2, oy+gy*sc+sc/2, sc*0.25, 0, Math.PI*2); ctx2.fill(); }
    // party arrow
    const px = ox+x*sc+sc/2, py = oy+y*sc+sc/2;
    ctx2.fillStyle = '#e9e2cf'; ctx2.save(); ctx2.translate(px,py); ctx2.rotate(DIRS[dir]?Math.atan2(DIRS[dir][1],DIRS[dir][0]):0);
    ctx2.beginPath(); ctx2.moveTo(0,-sc*0.45); ctx2.lineTo(sc*0.3,sc*0.25); ctx2.lineTo(-sc*0.3,sc*0.25); ctx2.closePath(); ctx2.fill(); ctx2.restore();
  }

  return {init:ensureCanvas, prepare, render, minimap, DIRS, FOV};
})();
