let W = 1080, H = 1920, cv = null, ctx = null;
function bind(id){
  cv = document.getElementById(id);
  W = cv.width; H = cv.height;
  ctx = cv.getContext('2d', { alpha: false });
  return ctx;
}

/* ---------- helpers ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const lerp=(a,b,k)=>a+(b-a)*k;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const smooth=(e0,e1,x)=>{const k=clamp((x-e0)/(e1-e0),0,1);return k*k*(3-2*k)};
const easeOut=k=>1-Math.pow(1-clamp(k,0,1),3);
function off(w,h){const o=document.createElement('canvas');o.width=w;o.height=h;return o}

/* ---------- palette (снято с референса: синий час) ---------- */
const SKY_TOP='#0a1220', SKY_MID='#1d3348', SKY_LOW='#4a6a86', SKY_HORIZON='#6d7f8d';
const INK='#04070b', INK2='#080d14';
const WARM='rgba(226,150,70,';

/* ---------- слои, отрисованные один раз ---------- */
const L = {};

function buildSkyWindow(){
  const o=off(W,H), g=o.getContext('2d');
  const grd=g.createLinearGradient(0,0,0,H*0.78);
  grd.addColorStop(0,SKY_TOP); grd.addColorStop(0.34,SKY_MID);
  grd.addColorStop(0.72,SKY_LOW); grd.addColorStop(1,SKY_HORIZON);
  g.fillStyle=grd; g.fillRect(0,0,W,H);
  // облачные полосы
  const r=mulberry32(7);
  g.filter='blur(38px)';
  for(let i=0;i<26;i++){
    const y=H*0.06+r()*H*0.62, w=300+r()*760, h=26+r()*70;
    g.globalAlpha=0.05+r()*0.13;
    g.fillStyle=i%3?'#8fb0c9':'#0b1725';
    g.beginPath(); g.ellipse(r()*W,y,w/2,h/2,0,0,7); g.fill();
  }
  // тёплое зарево у горизонта
  g.globalAlpha=0.5; g.filter='blur(70px)'; g.fillStyle='#8a5f37';
  g.beginPath(); g.ellipse(W*0.78,H*0.72,420,120,0,0,7); g.fill();
  g.filter='none'; g.globalAlpha=1;
  return o;
}

function drawTreeline(g,baseY,scale,color,seed){
  const r=mulberry32(seed);
  g.fillStyle=color; g.beginPath(); g.moveTo(-40,baseY+300);
  let x=-40;
  while(x<W+60){
    const w=(26+r()*46)*scale, h=(70+r()*150)*scale;
    g.lineTo(x,baseY); g.lineTo(x+w*0.5,baseY-h); g.lineTo(x+w,baseY);
    x+=w*0.82;
  }
  g.lineTo(W+60,baseY+300); g.closePath(); g.fill();
}

function buildWindowFar(){          // дальний план за стеклом
  const o=off(W,H), g=o.getContext('2d');
  // дома с окнами вдали
  const r=mulberry32(21);
  g.globalAlpha=0.9; g.fillStyle='#070c14';
  g.fillRect(W*0.60,H*0.435,W*0.55,H*0.35);
  g.fillRect(W*0.53,H*0.505,W*0.10,H*0.28);
  g.fillStyle='#060a11'; g.fillRect(W*0.02,H*0.545,W*0.24,H*0.24);
  for(let row=0;row<5;row++) for(let col=0;col<3;col++){
    if(r()>0.2) continue;
    const x=W*0.045+col*62, y=H*0.565+row*46;
    g.fillStyle=WARM+(0.4+r()*0.35)+')'; g.fillRect(x,y,15,22);
    g.filter='blur(10px)'; g.fillStyle=WARM+'0.3)'; g.fillRect(x-7,y-7,29,36); g.filter='none';
  }
  for(let row=0;row<7;row++) for(let col=0;col<5;col++){
    if(r()>0.26) continue;
    const x=W*0.62+col*54, y=H*0.46+row*44;
    g.fillStyle=WARM+(0.5+r()*0.4)+')'; g.fillRect(x,y,17,25);
    g.filter='blur(11px)'; g.fillStyle=WARM+'0.35)'; g.fillRect(x-7,y-7,31,39); g.filter='none';
  }
  g.globalAlpha=1;
  drawTreeline(g,H*0.755,1,'#05090f',3);
  // фонарь
  g.filter='blur(24px)'; g.fillStyle='rgba(235,160,80,0.75)';
  g.beginPath(); g.arc(W*0.93,H*0.70,26,0,7); g.fill(); g.filter='none';
  return o;
}

function leafCluster(g,x,y,scale,seed,color){
  const r=mulberry32(seed);
  g.fillStyle=color;
  const stems=10+Math.floor(r()*6);
  for(let s=0;s<stems;s++){
    const a=-Math.PI/2+(r()-0.5)*2.1, len=(90+r()*130)*scale;
    const ex=x+Math.cos(a)*len, ey=y+Math.sin(a)*len;
    g.lineWidth=2.4*scale; g.strokeStyle=color;
    g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+Math.cos(a)*len*0.5,y+Math.sin(a)*len*0.5-14*scale,ex,ey); g.stroke();
    const leaves=5+Math.floor(r()*5);
    for(let i=0;i<leaves;i++){
      const k=0.35+i/leaves*0.75;
      const lx=lerp(x,ex,k)+(r()-0.5)*20*scale, ly=lerp(y,ey,k)+(r()-0.5)*16*scale;
      const la=a+(r()-0.5)*1.9, lw=(17+r()*17)*scale, lh=(6.5+r()*5)*scale;
      g.beginPath(); g.ellipse(lx,ly,lw,lh,la,0,7); g.fill();
    }
  }
}

function buildWindowNear(){        // рама, подоконник, растения
  const o=off(W,H), g=o.getContext('2d');
  const sill=H*0.745;
  // рама: тонкая стойка справа + перекладина сверху
  g.fillStyle=INK;
  g.fillRect(W*0.615,-10,46,sill+20);
  g.fillRect(-10,H*0.07,W+20,44);
  g.fillRect(-10,-10,58,sill+20);
  g.fillRect(W-46,-10,58,sill+20);
  // подоконник и комната
  const room=g.createLinearGradient(0,sill,0,H);
  room.addColorStop(0,'#080e16'); room.addColorStop(0.45,'#04080e'); room.addColorStop(1,'#02040a');
  g.fillStyle=room; g.fillRect(-10,sill,W+20,H-sill+10);
  g.fillStyle='#101923'; g.fillRect(-10,sill,W+20,14);
  g.fillStyle='rgba(150,180,215,0.10)'; g.fillRect(-10,sill,W+20,2);
  // тёплый свет из комнаты
  const lamp=g.createRadialGradient(W*0.12,H*0.97,20,W*0.12,H*0.97,520);
  lamp.addColorStop(0,'rgba(228,152,72,0.16)'); lamp.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=lamp; g.fillRect(0,sill,W,H-sill);
  // растения на подоконнике
  g.fillStyle=INK;
  g.beginPath(); g.moveTo(W*0.20,sill); g.lineTo(W*0.41,sill); g.lineTo(W*0.385,sill+150); g.lineTo(W*0.225,sill+150); g.closePath(); g.fill();
  leafCluster(g,W*0.305,sill+4,2.05,11,'#04070c');
  g.beginPath(); g.moveTo(W*0.735,sill); g.lineTo(W*0.875,sill); g.lineTo(W*0.858,sill+112); g.lineTo(W*0.752,sill+112); g.closePath(); g.fill();
  leafCluster(g,W*0.805,sill+4,1.2,29,'#04070c');
  leafCluster(g,W*0.03,sill-4,1.45,53,'#04070c');
  return o;
}

function buildSkyBirds(){
  const o=off(W,H), g=o.getContext('2d');
  const grd=g.createLinearGradient(0,0,0,H);
  grd.addColorStop(0,'#101d2e'); grd.addColorStop(0.42,'#33506c');
  grd.addColorStop(0.68,'#5a7691'); grd.addColorStop(1,'#20303f');
  g.fillStyle=grd; g.fillRect(0,0,W,H);
  const r=mulberry32(101);
  g.filter='blur(46px)';
  for(let i=0;i<22;i++){
    g.globalAlpha=0.06+r()*0.12; g.fillStyle=i%2?'#a8c3da':'#14202e';
    g.beginPath(); g.ellipse(r()*W,r()*H*0.75,(260+r()*620)/2,(30+r()*80)/2,0,0,7); g.fill();
  }
  g.filter='none'; g.globalAlpha=1;
  return o;
}

function buildPanelHouse(){
  const o=off(W,H), g=o.getContext('2d');
  const r=mulberry32(404);
  // правая панелька
  const hx=W*0.60, hy=H*0.50;
  g.fillStyle='#070b12'; g.fillRect(hx,hy,W-hx+20,H-hy+20);
  for(let row=0;row<12;row++) for(let col=0;col<6;col++){
    const x=hx+34+col*68, y=hy+40+row*82;
    if(x>W-30) continue;
    if(r()<0.22){
      g.fillStyle=WARM+(0.42+r()*0.45)+')'; g.fillRect(x,y,34,44);
      g.filter='blur(15px)'; g.fillStyle=WARM+'0.28)'; g.fillRect(x-12,y-12,58,68); g.filter='none';
    } else { g.fillStyle='#0b111a'; g.fillRect(x,y,34,44); }
  }
  // левая панелька пониже
  g.fillStyle='#05080e'; g.fillRect(-20,H*0.72,W*0.34,H);
  for(let row=0;row<5;row++) for(let col=0;col<4;col++){
    const x=24+col*66, y=H*0.74+row*76;
    if(r()<0.18){ g.fillStyle=WARM+(0.4+r()*0.4)+')'; g.fillRect(x,y,30,40);
      g.filter='blur(14px)'; g.fillStyle=WARM+'0.25)'; g.fillRect(x-10,y-10,50,60); g.filter='none'; }
  }
  // ель слева
  g.fillStyle='#03060a';
  const tx=W*0.13, ty=H*0.62;
  for(let i=0;i<11;i++){
    const k=i/10, w=(52+k*190)*(0.86+r()*0.3), y=ty+i*82;
    const sk=(r()-0.5)*40;
    g.beginPath(); g.moveTo(tx+sk*0.4,y-150);
    g.lineTo(tx-w+sk,y+70); g.lineTo(tx-w*0.35+sk,y+44);
    g.lineTo(tx+w*0.35+sk,y+48); g.lineTo(tx+w+sk,y+70);
    g.closePath(); g.fill();
  }
  g.fillRect(tx-22,ty+600,44,H);
  return o;
}

function buildWires(){
  const o=off(W,H), g=o.getContext('2d');
  g.strokeStyle='rgba(6,10,16,0.92)';
  const lines=[[H*0.16,H*0.27,5],[H*0.23,H*0.36,4],[H*0.40,H*0.33,3]];
  for(const [y0,y1,lw] of lines){
    g.lineWidth=lw; g.beginPath(); g.moveTo(-30,y0);
    g.quadraticCurveTo(W*0.5,(y0+y1)/2+120,W+30,y1); g.stroke();
  }
  return o;
}

/* ---------- птицы ---------- */
const BIRDS=(()=>{const r=mulberry32(777);const a=[];
  for(let i=0;i<165;i++) a.push({x:r()*1.5-0.25,y:r()*0.60,s:0.45+r()*2.1,ph:r()*7,sp:0.012+r()*0.03,dy:(r()-0.5)*0.02});
  return a})();
function bird(g,x,y,s,f){
  const w=9*s, flap=Math.sin(f)*0.85;
  g.beginPath();
  g.moveTo(x-w,y+flap*w*0.55);
  g.quadraticCurveTo(x-w*0.45,y-flap*w*0.5,x,y);
  g.quadraticCurveTo(x+w*0.45,y-flap*w*0.5,x+w,y+flap*w*0.55);
  g.lineWidth=Math.max(1,1.7*s); g.stroke();
}

/* ---------- флакон ---------- */
function bottlePath(g,cx,cy,bw,bh){
  const r=34, x=cx-bw/2, y=cy-bh/2;
  g.beginPath();
  g.moveTo(x+r,y);
  g.lineTo(x+bw-r,y); g.quadraticCurveTo(x+bw,y,x+bw,y+r);
  g.lineTo(x+bw,y+bh-r); g.quadraticCurveTo(x+bw,y+bh,x+bw-r,y+bh);
  g.lineTo(x+r,y+bh); g.quadraticCurveTo(x,y+bh,x,y+bh-r);
  g.lineTo(x,y+r); g.quadraticCurveTo(x,y,x+r,y);
  g.closePath();
}
function drawBottle(g,cx,cy,scale,t,opts){
  const scrim=(opts&&opts.scrim)||0;
  const bw=360*scale, bh=520*scale;
  const top=cy-bh/2;
  g.save();
  // ореол
  const au=g.createRadialGradient(cx,cy-40*scale,20,cx,cy-40*scale,540*scale);
  au.addColorStop(0,'rgba(150,190,240,0.20)'); au.addColorStop(0.55,'rgba(110,150,200,0.07)'); au.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=au; g.fillRect(cx-620*scale,cy-720*scale,1240*scale,1440*scale);
  // горло + крышка
  g.fillStyle='rgba(18,26,36,0.92)';
  g.fillRect(cx-58*scale,top-64*scale,116*scale,70*scale);
  g.fillStyle='#10161f';
  g.beginPath(); g.roundRect(cx-76*scale,top-198*scale,152*scale,140*scale,10*scale); g.fill();
  const capg=g.createLinearGradient(cx-76*scale,0,cx+76*scale,0);
  capg.addColorStop(0,'rgba(255,255,255,0.03)'); capg.addColorStop(0.12,'rgba(200,225,255,0.30)');
  capg.addColorStop(0.5,'rgba(255,255,255,0.02)'); capg.addColorStop(0.92,'rgba(190,215,250,0.22)');
  capg.addColorStop(1,'rgba(255,255,255,0.02)');
  g.fillStyle=capg; g.beginPath(); g.roundRect(cx-76*scale,top-198*scale,152*scale,140*scale,10*scale); g.fill();
  // корпус
  bottlePath(g,cx,cy,bw,bh);
  const body=g.createLinearGradient(cx-bw/2,0,cx+bw/2,0);
  body.addColorStop(0,'rgba(140,175,210,0.10)'); body.addColorStop(0.07,'rgba(225,240,255,0.30)');
  body.addColorStop(0.30,'rgba(120,150,185,0.10)'); body.addColorStop(0.62,'rgba(90,120,155,0.09)');
  body.addColorStop(0.90,'rgba(215,235,255,0.26)'); body.addColorStop(1,'rgba(130,165,200,0.09)');
  g.fillStyle=body; g.fill();
  if(scrim){ bottlePath(g,cx,cy,bw,bh); g.fillStyle=`rgba(7,12,22,${scrim})`; g.fill(); }
  // парфюм внутри
  g.save(); bottlePath(g,cx,cy,bw,bh); g.clip();
  const liq=g.createLinearGradient(0,cy-bh*0.06,0,cy+bh/2);
  liq.addColorStop(0,'rgba(150,96,44,0.16)'); liq.addColorStop(0.5,'rgba(126,78,38,0.34)'); liq.addColorStop(1,'rgba(70,42,22,0.48)');
  g.fillStyle=liq; g.fillRect(cx-bw/2,cy-bh*0.06,bw,bh);
  g.fillStyle='rgba(224,180,120,0.30)'; g.fillRect(cx-bw/2,cy-bh*0.06,bw,2.5*scale);
  // световой блик, идущий по стеклу
  const sweep=((t*0.16)%1.4)-0.2;
  const sx=cx-bw/2+bw*sweep;
  const sw=g.createLinearGradient(sx-90*scale,0,sx+90*scale,0);
  sw.addColorStop(0,'rgba(255,255,255,0)'); sw.addColorStop(0.5,'rgba(235,245,255,0.16)'); sw.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=sw; g.fillRect(cx-bw/2,cy-bh/2,bw,bh);
  g.restore();
  // кромка
  bottlePath(g,cx,cy,bw,bh);
  const rim=g.createLinearGradient(cx-bw/2,0,cx+bw/2,0);
  rim.addColorStop(0,'rgba(210,232,255,0.55)'); rim.addColorStop(0.16,'rgba(255,255,255,0.06)');
  rim.addColorStop(0.84,'rgba(255,255,255,0.06)'); rim.addColorStop(1,'rgba(225,240,255,0.62)');
  g.strokeStyle=rim; g.lineWidth=2.6*scale; g.stroke();
  // гравировка
  g.fillStyle='rgba(232,240,250,0.82)';
  g.font=`${Math.round(34*scale)}px Cormorant, Georgia, serif`;
  g.textAlign='center'; g.letterSpacing=`${10*scale}px`;
  g.fillText('AROMIO',cx,cy+bh*0.12);
  g.letterSpacing='0px';
  g.font=`${Math.round(15*scale)}px Inter, sans-serif`;
  g.fillStyle='rgba(210,224,240,0.45)';
  g.letterSpacing=`${5*scale}px`; g.fillText("PARFUM'S",cx,cy+bh*0.12+34*scale); g.letterSpacing='0px';
  g.restore();
}

/* ---------- сцены ---------- */
function cam(g,lt,z0,z1,dx,dy,dur){
  const k=clamp(lt/dur,0,1);
  const z=lerp(z0,z1,k*k*(3-2*k));
  const sh=Math.sin(lt*0.9)*3.2+Math.sin(lt*2.3)*1.4;   // лёгкое «с рук»
  const sv=Math.cos(lt*0.7)*3.0+Math.cos(lt*1.9)*1.2;
  g.translate(W/2+sh+dx*k,H/2+sv+dy*k);
  g.rotate(Math.sin(lt*0.4)*0.0016);
  g.scale(z,z); g.translate(-W/2,-H/2);
}

function sceneWindow(g,lt){
  g.save(); cam(g,lt,1.03,1.13,-14,10,7);
  g.drawImage(L.skyW,0,0);
  g.drawImage(L.winFar,0,0);
  // мерцание дальних окон
  g.globalAlpha=0.16+0.1*Math.sin(lt*2.1); g.drawImage(L.winFar,0,0); g.globalAlpha=1;
  // тюль справа: вертикальные складки, медленно дышат
  g.save();
  g.filter='blur(4px)';
  for(let i=0;i<40;i++){
    const k=i/39;
    const x=W*0.50+k*W*0.56;
    const wob=Math.sin(lt*0.55+k*7.5)*10+Math.sin(lt*0.31+k*3.1)*16;
    const a=0.075+0.105*(0.5+0.5*Math.sin(k*13.0+lt*0.42));
    const grd=g.createLinearGradient(0,0,0,H*0.8);
    grd.addColorStop(0,`rgba(198,216,236,${a*1.25})`);
    grd.addColorStop(0.62,`rgba(176,198,222,${a})`);
    grd.addColorStop(1,`rgba(120,145,175,${a*0.3})`);
    g.fillStyle=grd;
    g.beginPath(); g.moveTo(x+wob,-20);
    g.quadraticCurveTo(x+wob*1.6+8,H*0.42,x+wob*0.7,H*0.80);
    g.lineTo(x+wob*0.7+22,H*0.80);
    g.quadraticCurveTo(x+wob*1.6+30,H*0.42,x+wob+22,-20);
    g.closePath(); g.fill();
  }
  g.filter='none'; g.restore();
  // конденсат на стекле
  g.globalAlpha=0.5; g.filter='blur(30px)';
  g.fillStyle='rgba(170,195,220,0.16)';
  g.beginPath(); g.ellipse(W*0.30,H*0.30,300,190,0,0,7); g.fill();
  g.beginPath(); g.ellipse(W*0.72,H*0.55,260,150,0,0,7); g.fill();
  g.filter='none'; g.globalAlpha=1;
  g.drawImage(L.winNear,0,0);
  g.restore();
}

function sceneBirds(g,lt){
  g.save(); cam(g,lt,1.12,1.0,0,-26,7);
  g.drawImage(L.skyB,0,0);
  g.strokeStyle='rgba(7,11,18,0.9)'; g.lineCap='round';
  for(const b of BIRDS){
    const x=((b.x - lt*b.sp*0.16 + 2)%1.5-0.25)*W;
    const y=(b.y + Math.sin(lt*0.7+b.ph)*0.012 + lt*b.dy*0.02)*H;
    g.globalAlpha=clamp(0.25+b.s*0.5,0,0.95);
    bird(g,x,y,b.s,lt*7.5*(0.6+b.s*0.5)+b.ph);
  }
  g.globalAlpha=1;
  g.drawImage(L.wires,0,0);
  g.drawImage(L.panel,0,0);
  g.restore();
}

function sceneBottle(g,lt){
  g.save(); cam(g,lt,1.16,1.03,0,6,6);
  // размытая версия окна как боке-фон
  g.save(); g.filter='blur(26px)'; g.globalAlpha=1;
  g.drawImage(L.skyW,-40,-60,W+80,H+120);
  g.globalAlpha=0.85; g.drawImage(L.winFar,-40,-60,W+80,H+120);
  g.filter='none'; g.restore();
  g.fillStyle='rgba(6,10,17,0.55)'; g.fillRect(0,0,W,H);
  // боке
  const r=mulberry32(88);
  for(let i=0;i<14;i++){
    const x=r()*W, y=H*0.18+r()*H*0.5, rad=18+r()*46;
    g.filter='blur(16px)'; g.fillStyle=WARM+(0.05+r()*0.14)+')';
    g.beginPath(); g.arc(x,y+Math.sin(lt*0.3+i)*4,rad,0,7); g.fill(); g.filter='none';
  }
  // поверхность подоконника
  const sill=H*0.715;
  const sg=g.createLinearGradient(0,sill,0,H);
  sg.addColorStop(0,'#0c131c'); sg.addColorStop(0.25,'#070c13'); sg.addColorStop(1,'#03060a');
  g.fillStyle=sg; g.fillRect(0,sill,W,H-sill);
  g.fillStyle='rgba(150,180,215,0.10)'; g.fillRect(0,sill,W,2);
  const scale=1.1, cy=sill-scale*262;
  // отражение
  g.save(); g.globalAlpha=0.22; g.filter='blur(7px)';
  g.translate(0,sill*2+4); g.scale(1,-1);
  drawBottle(g,W/2,cy,scale,lt); g.restore(); g.filter='none'; g.globalAlpha=1;
  drawBottle(g,W/2,cy,scale,lt);
  g.restore();
}

function sceneEnd(g,lt){
  g.save();
  const bg=g.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#070c14'); bg.addColorStop(0.5,'#0b1421'); bg.addColorStop(1,'#05080e');
  g.fillStyle=bg; g.fillRect(0,0,W,H);
  const gl=g.createRadialGradient(W/2,H*0.44,10,W/2,H*0.44,760);
  gl.addColorStop(0,'rgba(120,160,215,0.18)'); gl.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gl; g.fillRect(0,0,W,H);
  const k=easeOut(lt/1.1), k2=easeOut((lt-0.42)/1.0), k3=easeOut((lt-0.72)/0.9);
  g.textAlign='center';
  g.save(); g.globalAlpha=clamp(k,0,1);
  g.filter=`blur(${(1-clamp(k,0,1))*12}px)`;
  g.shadowColor='rgba(165,200,250,0.55)'; g.shadowBlur=42;
  g.fillStyle='#eef3fa'; g.letterSpacing='26px';
  g.font='300 132px Cormorant, Georgia, serif';
  g.fillText('AROMIO',W/2+13,H*0.455-lerp(16,0,clamp(k,0,1)));
  g.restore();
  if(k2>0){
    g.save(); g.globalAlpha=clamp(k2,0,1); g.filter=`blur(${(1-clamp(k2,0,1))*9}px)`;
    g.strokeStyle='rgba(190,215,245,0.45)'; g.lineWidth=1;
    g.beginPath(); g.moveTo(W/2-150,H*0.485); g.lineTo(W/2+150,H*0.485); g.stroke();
    g.fillStyle='rgba(224,234,247,0.88)'; g.letterSpacing='16px';
    g.font='400 34px Inter, sans-serif';
    g.fillText("PARFUM'S",W/2+8,H*0.528);
    g.restore();
  }
  if(k3>0){
    g.save(); g.globalAlpha=clamp(k3,0,1); g.filter=`blur(${(1-clamp(k3,0,1))*7}px)`;
    g.shadowColor='rgba(150,190,245,0.35)'; g.shadowBlur=18;
    g.fillStyle='rgba(216,228,243,0.95)'; g.letterSpacing='8px';
    g.font='300 29px Inter, sans-serif';
    g.fillText('нишевая парфюмерия',W/2+4,H*0.585);
    g.restore();
  }
  g.letterSpacing='0px'; g.filter='none';
  g.restore();
}

const SCENES=[
  {t:0.0, draw:sceneWindow},
  {t:6.2, draw:sceneBirds},
  {t:12.0,draw:sceneBottle},
  {t:16.0,draw:sceneEnd},
];
const XF=0.35;   // половина длительности перехода

/* ---------- текст ---------- */
const LINES=[
  {t:1.10, out:5.55, y:1010, size:52, words:['тихий','вечер']},
  {t:2.75, out:5.55, y:1078, size:52, words:['и','запах','дождя']},
  {t:7.00, out:11.35, y:735,  size:52, words:['город','выдыхает']},
  {t:8.65, out:11.35, y:803,  size:52, words:['птицы','уносят','день']},
  {t:12.70,out:15.35, y:540,  size:52, words:['а','запах','остаётся']},
  {t:14.15,out:15.35, y:608,  size:52, words:['он','помнит','всё']},
];
function drawLines(g,t){
  g.textAlign='center'; g.textBaseline='alphabetic';
  for(const ln of LINES){
    const app=0.5, step=0.27;
    const lineStart=ln.t, lineEnd=ln.out+0.45;
    if(t<lineStart-0.05||t>lineEnd) continue;
    g.font=`400 ${ln.size}px Inter, "Helvetica Neue", sans-serif`;
    // ширины слов для центрирования
    const gapw=g.measureText(' ').width+7;
    const ws=ln.words.map(w=>g.measureText(w).width);
    const total=ws.reduce((a,b)=>a+b,0)+gapw*(ws.length-1);
    let x=W/2-total/2;
    const fadeOut=1-smooth(ln.out,ln.out+0.45,t);
    for(let i=0;i<ln.words.length;i++){
      const wt=ln.t+i*step;
      const k=clamp((t-wt)/app,0,1), e=easeOut(k);
      if(k<=0){ x+=ws[i]+gapw; continue; }
      const blur=(1-e)*11 + (1-fadeOut)*9;
      const dy=(1-e)*13;
      g.save();
      g.globalAlpha=e*fadeOut;
      g.filter=blur>0.3?`blur(${blur.toFixed(2)}px)`:'none';
      g.shadowColor='rgba(150,190,245,0.75)'; g.shadowBlur=26;
      g.fillStyle='#eaf1f9';
      g.fillText(ln.words[i],x+ws[i]/2,ln.y+dy);
      g.shadowBlur=0;
      g.globalAlpha=e*fadeOut*0.5;
      g.fillText(ln.words[i],x+ws[i]/2,ln.y+dy);
      g.restore();
      x+=ws[i]+gapw;
    }
  }
}

/* ---------- виньетка + постобработка ---------- */
function vignette(g){
  const v=g.createRadialGradient(W/2,H*0.47,H*0.22,W/2,H*0.5,H*0.78);
  v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(0.62,'rgba(0,0,0,0.30)'); v.addColorStop(1,'rgba(0,0,0,0.80)');
  g.fillStyle=v; g.fillRect(0,0,W,H);
}

/* ---------- кадр ---------- */
const DURATION=18.4;
function renderFrame(t){
  ctx.setTransform(1,0,0,1,0,0);
  ctx.globalAlpha=1; ctx.filter='none';
  ctx.fillStyle='#04070b'; ctx.fillRect(0,0,W,H);
  let idx=0;
  for(let i=0;i<SCENES.length;i++) if(t>=SCENES[i].t-XF) idx=i;
  const cur=SCENES[idx];
  const prev=SCENES[idx-1];
  const fade=smooth(cur.t-XF,cur.t+XF,t);
  if(prev&&fade<1){ prev.draw(ctx,t-prev.t); }
  ctx.save();
  ctx.globalAlpha=prev?fade:1;
  cur.draw(ctx,t-cur.t);
  ctx.restore();
  ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.filter='none';
  vignette(ctx);
  drawLines(ctx,t);
  ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.filter='none';
  // лёгкая «засветка» сверху, как на плёнке
  const fl=ctx.createLinearGradient(0,0,0,H*0.35);
  fl.addColorStop(0,'rgba(120,150,190,0.05)'); fl.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=fl; ctx.fillRect(0,0,W,H*0.35);
  return true;
}

function init(){
  L.skyW=buildSkyWindow();
  L.winFar=buildWindowFar();
  L.winNear=buildWindowNear();
  L.skyB=buildSkyBirds();
  L.panel=buildPanelHouse();
  L.wires=buildWires();
}

/* ---------- обложка (квадрат, для Spotify / профиля) ---------- */
function grainTile(size,alpha,seed){
  const o=off(size,size), g=o.getContext('2d');
  const img=g.createImageData(size,size), d=img.data, r=mulberry32(seed);
  for(let i=0;i<d.length;i+=4){
    const v=128+(r()-0.5)*190;
    d[i]=d[i+1]=d[i+2]=v; d[i+3]=alpha;
  }
  g.putImageData(img,0,0);
  return o;
}
function coverSky(g){
  const grd=g.createLinearGradient(0,0,0,H);
  grd.addColorStop(0,'#04080f'); grd.addColorStop(0.26,'#0d1c30');
  grd.addColorStop(0.55,'#254462'); grd.addColorStop(0.74,'#4d6d8d');
  grd.addColorStop(0.86,'#2a3d51'); grd.addColorStop(1,'#080d15');
  g.fillStyle=grd; g.fillRect(0,0,W,H);
  const r=mulberry32(1303);
  g.filter='blur(46px)';
  for(let i=0;i<22;i++){
    g.globalAlpha=0.05+r()*0.13; g.fillStyle=i%3?'#8fb0cc':'#081525';
    g.beginPath(); g.ellipse(r()*W,H*0.10+r()*H*0.58,(300+r()*740)/2,(36+r()*80)/2,0,0,7); g.fill();
  }
  g.filter='none'; g.globalAlpha=1;
  // луна — ниже вордмарка, левее флакона
  g.filter='blur(44px)'; g.fillStyle='rgba(198,218,242,0.26)';
  g.beginPath(); g.arc(W*0.145,H*0.375,140,0,7); g.fill(); g.filter='none';
  g.fillStyle='rgba(226,238,252,0.50)';
  g.beginPath(); g.arc(W*0.145,H*0.375,34,0,7); g.fill();
  // ореол за флаконом — отделяет силуэт от неба
  const halo=g.createRadialGradient(W*0.5,H*0.60,20,W*0.5,H*0.60,H*0.46);
  halo.addColorStop(0,'rgba(176,206,242,0.30)'); halo.addColorStop(0.45,'rgba(120,160,210,0.12)');
  halo.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=halo; g.fillRect(0,0,W,H);
}
function coverCity(g){
  const r=mulberry32(5150), base=H*0.822;
  // дальняя линия крыш — мягкая, чтобы не резала глаз в превью
  const far=off(W,H), fg=far.getContext('2d');
  let x=-90;
  while(x<W+90){
    const bw=100+r()*190, bh=170+r()*420;
    fg.fillStyle='#08111e'; fg.fillRect(x,base-bh,bw,bh+220);
    if(r()<0.45){                       // надстройка на крыше
      const aw=bw*(0.2+r()*0.3), ah=26+r()*54;
      fg.fillRect(x+bw*0.15+r()*bw*0.4,base-bh-ah,aw,ah+10);
    }
    const cols=Math.floor(bw/46), rows=Math.floor(bh/52);
    for(let row=0;row<rows;row++) for(let col=0;col<cols;col++){
      if(r()>0.16) continue;
      const wx=x+16+col*46, wy=base-bh+18+row*52;
      fg.fillStyle=WARM+(0.45+r()*0.45)+')'; fg.fillRect(wx,wy,16,24);
      fg.filter='blur(13px)'; fg.fillStyle=WARM+'0.34)'; fg.fillRect(wx-9,wy-9,34,42); fg.filter='none';
    }
    x+=bw*(0.55+r()*0.4);
  }
  g.save(); g.filter='blur(2.2px)'; g.drawImage(far,0,0); g.filter='none'; g.restore();
  // дымка у подножия города
  const haze=g.createLinearGradient(0,base-H*0.16,0,base+6);
  haze.addColorStop(0,'rgba(120,160,200,0)'); haze.addColorStop(1,'rgba(128,166,206,0.20)');
  g.fillStyle=haze; g.fillRect(0,base-H*0.16,W,H*0.16);
  // провода и птицы
  g.strokeStyle='rgba(6,11,19,0.7)'; g.lineWidth=2.6;
  g.beginPath(); g.moveTo(-20,H*0.335); g.quadraticCurveTo(W*0.5,H*0.425,W+20,H*0.305); g.stroke();
  g.lineWidth=1.8;
  g.beginPath(); g.moveTo(-20,H*0.392); g.quadraticCurveTo(W*0.5,H*0.468,W+20,H*0.368); g.stroke();
  g.strokeStyle='rgba(7,12,20,0.8)'; g.lineCap='round';
  const br=mulberry32(64);
  for(let i=0;i<22;i++) bird(g,br()*W,H*0.13+br()*H*0.26,0.7+br()*1.5,br()*6.2);
  // земля
  const gg=g.createLinearGradient(0,base,0,H);
  gg.addColorStop(0,'#070d16'); gg.addColorStop(0.3,'#040810'); gg.addColorStop(1,'#02050b');
  g.fillStyle=gg; g.fillRect(0,base,W,H-base);
  g.fillStyle='rgba(158,190,226,0.14)'; g.fillRect(0,base,W,2);
}
function renderCover(){
  const g=ctx;
  g.setTransform(1,0,0,1,0,0); g.globalAlpha=1; g.filter='none';
  coverSky(g);
  coverCity(g);
  // флакон: тёмное стекло, яркая кромка
  const base=H*0.822, sc=W/1080*0.80, cy=base-sc*262;
  g.save(); g.globalAlpha=0.24; g.filter='blur(8px)';
  g.translate(0,base*2+4); g.scale(1,-1);
  drawBottle(g,W/2,cy,sc,3.4,{scrim:0.34}); g.restore();
  g.filter='none'; g.globalAlpha=1;
  drawBottle(g,W/2,cy,sc,3.4,{scrim:0.34});
  // виньетка
  const v=g.createRadialGradient(W/2,H*0.52,H*0.18,W/2,H*0.54,H*0.82);
  v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(0.55,'rgba(2,5,10,0.34)'); v.addColorStop(1,'rgba(1,3,7,0.88)');
  g.fillStyle=v; g.fillRect(0,0,W,H);
  const topg=g.createLinearGradient(0,0,0,H*0.34);
  topg.addColorStop(0,'rgba(2,5,11,0.62)'); topg.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=topg; g.fillRect(0,0,W,H*0.34);
  // вордмарк
  g.textAlign='center';
  g.shadowColor='rgba(140,180,240,0.55)'; g.shadowBlur=44;
  g.fillStyle='#f4f7fc'; g.letterSpacing=`${Math.round(W*0.024)}px`;
  g.font=`300 ${Math.round(W*0.125)}px Cormorant, Georgia, serif`;
  g.fillText('AROMIO',W/2+W*0.012,H*0.163);
  g.shadowBlur=0;
  g.strokeStyle='rgba(205,224,248,0.55)'; g.lineWidth=1.6;
  g.beginPath(); g.moveTo(W/2-W*0.125,H*0.197); g.lineTo(W/2+W*0.125,H*0.197); g.stroke();
  g.fillStyle='rgba(232,240,250,0.92)'; g.letterSpacing=`${Math.round(W*0.014)}px`;
  g.font=`400 ${Math.round(W*0.0275)}px Inter, sans-serif`;
  g.fillText("PARFUM'S",W/2+W*0.007,H*0.238);
  g.letterSpacing='0px';
  // зерно
  const tile=grainTile(220,26,2024);
  g.save(); g.globalCompositeOperation='overlay'; g.globalAlpha=0.55;
  for(let y=0;y<H;y+=220) for(let x=0;x<W;x+=220) g.drawImage(tile,x,y);
  g.restore();
  return true;
}

window.AROMIO={bind,init,renderFrame,renderCover,DURATION,get W(){return W},get H(){return H}};
