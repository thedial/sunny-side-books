/* ---- scene backdrops ---- */
const SCENE={
  yard:()=>P.sky()+P.sun(1380,320)+P.cloud(430,330,1)+P.cloud(930,230,.6)+P.hills(650)+P.ground(720)+P.tree(1500,760,.8)+P.barn(300,730)+P.fence(560,1240,750)
     +P.flower(1460,970,'#e58a8a',.9)+P.flower(1540,990,'#f0c055',.8),
  barn:()=>P.barnInside()+P.hay(1250,870)+P.hay(1420,880)+P.hay(1335,786),
  pond:()=>P.sky()+P.sun(230,320)+P.cloud(1100,300,.8)+P.hills(640)+P.ground(710)+P.pond(800,850)+P.pine(1430,740,.95)+P.pine(1560,770,.75)
     +P.flower(130,970,'#f0c055',.9)+P.flower(220,995,'#e58a8a',.75),
  meadow:()=>P.sky()+P.hills(640)+P.cloud(700,320,.95)+P.sun(1420,320)+P.ground(710)+P.tree(1180,830,1.05,'#e9874a')
     +P.flower(250,900,'#e58a8a')+P.flower(380,940,'#f0c055',.9)+P.flower(520,910,'#f4ead2')+P.flower(320,985,'#e9874a',.8)+P.flower(160,950,'#8d86c6',.85),
  night:()=>P.sky('night')+P.stars()+P.moon(1300,330)+P.hills(660,true)+P.ground(720,true)
     +`<g transform="translate(330 730)"><path d="M-160 0 V-200 H160 V0 Z" fill="#6b2f24"/><path d="M-182 -196 L-118 -300 L0 -344 L118 -300 L182 -196 Z" fill="#2a3533"/>
       <rect x="-36" y="-282" width="72" height="62" fill="#f2c35a"/><rect x="-36" y="-282" width="72" height="62" fill="#fff3c0" opacity=".4" class="blink"/><rect x="-70" y="-150" width="140" height="150" fill="#57261d"/></g>`
     +Array.from({length:14},(_,i)=>`<circle class="blink nohit" style="animation-delay:${(i*.37%2).toFixed(2)}s" cx="${(i*151)%1600}" cy="${760+(i*67)%180}" r="5" fill="#f6e08a"/>`).join(''),
};

/* ---- painted backgrounds: a picture fills the scene; hotspots on it are shooting-gallery targets ---- */
/* the painting covers whatever part of the world is on screen; hotspot coordinates are in the picture's own pixels */
let PX, PY, PK, VIEW={x0:0,y0:170,x1:1600,y1:1170};
/* actors are placed as if on a 16:10 tablet (painting scale CK, offset COX/COY); on other screens they move and scale with the painting so they stay on the same painted spot */
const CK=1.225, COX=-92, COY=170, toPic=(x,y)=>[(x-COX)/CK,(y-COY)/CK];
function paintMap(d,focus){ const vw=VIEW.x1-VIEW.x0, vh=VIEW.y1-VIEW.y0; PK=Math.max(vw/d.w, vh/d.h);
  let ox=VIEW.x0+(vw-d.w*PK)/2; const oy=VIEW.y0+(vh-d.h*PK)*.6;
  if(focus!=null){ ox=VIEW.x0+vw/2-focus*PK; ox=Math.min(VIEW.x0,Math.max(VIEW.x1-d.w*PK,ox)); }
  PX=px=>ox+px*PK; PY=py=>oy+py*PK; }
const pts=a=>a.map(([x,y])=>`${PX(x).toFixed(0)},${PY(y).toFixed(0)}`).join(' ');
function painted(d,focus){
  paintMap(d,focus);
  let s=`<rect x="-3000" y="-3000" width="7600" height="3600" fill="${d.top||'#3f8f86'}"/><rect x="-3000" y="600" width="7600" height="4000" fill="${d.bottom||'#7d9a4f'}"/>
    <image id="paint" href="${d.src}" x="${PX(0)}" y="${PY(0)}" width="${d.w*PK}" height="${d.h*PK}" preserveAspectRatio="none"/>`;
  (d.hot||[]).forEach((h,i)=>{
    const shape=h.poly?`<polygon class="hot" points="${pts(h.poly)}"/>`:`<circle class="hot" cx="${PX(h.c[0])}" cy="${PY(h.c[1])}" r="${h.r*PK}"/>`;
    const c=h.c?[PX(h.c[0]),PY(h.c[1])]:center(h.poly);
    s+=`<g class="tap actor" data-hot="${i}" data-who="${h.who}" data-ax="${c[0]|0}" data-ay="${c[1]|0}">${shape}</g>`;
  });
  return s;
}
function center(poly){ const xs=poly.map(p=>PX(p[0])), ys=poly.map(p=>PY(p[1])); return [(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2]; }
function bounds(poly){ const xs=poly.map(p=>PX(p[0])), ys=poly.map(p=>PY(p[1])); return {x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)}; }
function tween(ms,fn,done){ const t0=performance.now(); const step=t=>{ const k=Math.min(1,(t-t0)/ms); fn(k); if(k<1) requestAnimationFrame(step); else if(done) done(); }; requestAnimationFrame(step); }
let uid=0;
/* critters that pop out of things */
const CRIT={
  mouse:(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-30" r="34" fill="#a7a3a0" ${S(5)}/><circle cx="-24" cy="-62" r="16" fill="#a7a3a0" ${S(4)}/><circle cx="24" cy="-62" r="16" fill="#a7a3a0" ${S(4)}/>
    <circle cx="-10" cy="-36" r="5" fill="${OUT}"/><circle cx="10" cy="-36" r="5" fill="${OUT}"/><circle cx="0" cy="-22" r="5" fill="#d9826f"/></g>`,
  chick:(x,y,s=1)=>P.chick(x,y,s), pig:(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})">${P.pig(x,y)}</g>`,
  bunny:(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})">${P.bunny(x,y)}</g>`,
  bird:(c='#4f9c9b')=>`<ellipse rx="16" ry="11" fill="${c}" ${S(4)}/><circle cx="14" cy="-8" r="8" fill="${c}" ${S(4)}/><path d="M22 -8 l8 3 l-8 3z" fill="#e08a3c"/><path class="flap" d="M-6 -4 q-10 -22 -24 -16 q8 10 24 16" fill="#a6cfc4" ${S(3)}/>`,
  butterfly:(c='#e58a8a')=>`<g class="flap"><path d="M0 0 q-26 -30 -30 -6 q4 16 30 6 M0 0 q26 -30 30 -6 q-4 16 -30 6" fill="${c}" ${S(3)}/></g><path d="M0 -8 v16" ${S(4)}/>`,
  hopper:()=>`<path d="M-20 0 q10 -16 34 -10 l8 6 q-20 10 -42 4z" fill="#86a95a" ${S(3)}/><path d="M0 -6 l-12 -18 l-10 22" fill="none" ${S(3)}/><circle cx="18" cy="-8" r="3" fill="${OUT}"/>`,
};
/* pop something up from behind an edge at (x,y) */
function popUp(x,y,html,ms=2500){ const id='pc'+(uid++);
  addFx(`<clipPath id="${id}"><rect x="${x-300}" y="${y-500}" width="600" height="500"/></clipPath><g clip-path="url(#${id})"><g class="fxpeek">${html}</g></g>`,ms); }
function flyOut(x,y,n=3,what='bird'){ let s=''; for(let k=0;k<n;k++) s+=`<g transform="translate(${x+rnd(-60,60)} ${y+rnd(-30,30)})"><g class="fxfly" style="--dx:${(rnd(250,500)*(Math.random()<.5?-1:1))|0}px;--dy:${-rnd(300,500)|0}px;animation-delay:${k*.15}s">${CRIT[what]()}</g></g>`; addFx(s,2900); }
function flutter(x,y,n=2){ let s=''; const cs=['#e58a8a','#f0c055','#8d86c6'];
  for(let k=0;k<n;k++) s+=`<g transform="translate(${x+rnd(-40,40)} ${y-rnd(20,60)})"><g class="fxacross" style="--dx:${(rnd(300,600)*(k%2?-1:1))|0}px;--dy:${-rnd(150,300)|0}px;animation-delay:${k*.2}s">${CRIT.butterfly(cs[k%3])}</g></g>`; addFx(s,3600); }
/* the barn doors in the painting swing open on their hinges */
function barnDoors(h,inside,say){
  const L=h.doorL, R=h.doorR, id='d'+(uid++), bL=bounds(L), bR=bounds(R);
  const cx=(bL.x0+bR.x1)/2, by=Math.max(bL.y1,bR.y1), dh=Math.max(bL.y1-bL.y0,bR.y1-bR.y0);
  addFx(`<clipPath id="${id}o"><polygon points="${pts(L)}"/><polygon points="${pts(R)}"/></clipPath>
    <clipPath id="${id}l"><polygon points="${pts(L)}"/></clipPath><clipPath id="${id}r"><polygon points="${pts(R)}"/></clipPath>
    <polygon points="${pts(L)}" fill="#24170f"/><polygon points="${pts(R)}" fill="#24170f"/>
    <g clip-path="url(#${id}o)"><g class="fxpeek">${inside(cx,by,dh/180)}</g></g>
    <g id="${id}L"><g clip-path="url(#${id}l)"><use href="#paint"/></g><polygon points="${pts(L)}" fill="none" ${S(4)}/></g>
    <g id="${id}R"><g clip-path="url(#${id}r)"><use href="#paint"/></g><polygon points="${pts(R)}" fill="none" ${S(4)}/></g>`,2900);
  const gl=document.getElementById(id+'L'), gr=document.getElementById(id+'R');
  const swing=k=>{ const o=k<.2?1-k/.2*.9:(k>.8?.1+(k-.8)/.2*.9:.1);
    gl.setAttribute('transform',`translate(${bL.x0} 0) scale(${o} 1) translate(${-bL.x0} 0)`); gr.setAttribute('transform',`translate(${bR.x1} 0) scale(${o} 1) translate(${-bR.x1} 0)`); };
  tween(2700,swing); SOUND.barn&&voiceCreak(); if(say) later(()=>bubble(cx+60,by-dh-40,say),650);
}
function voiceCreak(){ voice(90,140,.6,{lp:500,vol:.06}); }
/* each target hides a few surprises and takes turns */
const GALLERY={
  sun:[ (x,y,h)=>{ const r=h.r*PK; addFx(`<g transform="translate(${x} ${y})"><g class="fxshades"><path d="M${-r*.75} ${-r*.12} h${r*.62} v${r*.2} q0 ${r*.28} ${-r*.31} ${r*.28} q${-r*.31} 0 ${-r*.31} ${-r*.28}z M${r*.13} ${-r*.12} h${r*.62} v${r*.2} q0 ${r*.28} ${-r*.31} ${r*.28} q${-r*.31} 0 ${-r*.31} ${-r*.28}z M${-r*.13} ${-r*.08} h${r*.26}" fill="${OUT}" ${S(6)}/></g></g>`,2700); later(()=>bubble(x+r*.6,y+r*.3,'Cool!'),500); SOUND.sun(); },
        (x,y,h)=>{ const r=h.r*PK; addFx(`<circle class="fxglow" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#f4e3a6" stroke-width="18"/><circle class="fxglow" style="animation-delay:.3s" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#f0c055" stroke-width="12"/>`,2000); bubble(x+r*.6,y+r*.3,'Hello!'); SOUND.sun(); },
        (x,y,h)=>{ for(let k=0;k<8;k++) later(()=>sparkle(x+rnd(-h.r,h.r)*PK,y+rnd(-h.r,h.r)*PK),k*90); SOUND.flower(); } ],
  cloud:[ (x,y,h)=>{ let s=''; const w=h.r*PK*.8; for(let k=0;k<20;k++) s+=`<path class="fxdrop" style="animation-delay:${rnd(0,1.2).toFixed(2)}s" d="M${x+rnd(-w,w)} ${y+rnd(0,h.r*PK*.4)} q-6 14 0 20 q6 -6 0 -20z" fill="#4f9c9b"/>`; addFx(s,2300); SOUND.cloud(); },
          (x,y,h)=>{ const r=h.r*PK; addFx(`<g transform="translate(${x} ${y+r*.5})"><g class="fxbow">${['#c9432f','#e08a3c','#f0c055','#86a95a','#4f9c9b','#8d86c6'].map((c,i)=>`<path d="M${-r*1.1+i*14} 0 a${r*1.1-i*14} ${r*.9-i*14} 0 0 1 ${2*(r*1.1-i*14)} 0" fill="none" stroke="${c}" stroke-width="15"/>`).join('')}</g></g>`,3100); SOUND.flower(); },
          (x,y)=>{ flyOut(x,y,2); SOUND.tree(); } ],
  barn:[ (x,y,h)=>{ barnDoors(h,(cx,by,s)=>CRIT.mouse(cx,by,s*1.4),'Squeak!'); later(()=>[0,.12].forEach(d=>tone(3000,3600,.08,'sine',.07,d)),700); },
         (x,y,h)=>{ barnDoors(h,(cx,by,s)=>P.chick(cx,by,s*1.6),'Peep!'); later(()=>SOUND.chick(),700); },
         (x,y,h)=>{ barnDoors(h,(cx,by,s)=>CRIT.pig(cx-60*s,by,s*1.1),'Oink!'); later(()=>SOUND.pig(),700); } ],
  fence:[ (x,y,h)=>{ const b=bounds(h.poly), px=rnd(b.x0+60,b.x1-60), py=b.y0+(b.y1-b.y0)*.45; popUp(px,py,CRIT.bunny(px,py+40,.8)); later(()=>bubble(px+30,py-140,'Hop!'),500); SOUND.bunny(); },
          (x,y,h)=>{ const b=bounds(h.poly); flyOut(rnd(b.x0,b.x1),b.y0+40,1); [0,.12,.3].forEach(d=>tone(2600,3400,.07,'sine',.08,d)); },
          (x,y,h)=>{ flutter(x,y,2); } ],
  grass:[ (x,y)=>{ addFx(`<g transform="translate(${x-40} ${y+60})"><g class="fxjump">${CRIT.hopper()}</g></g>`,1300); tone(2400,2800,.05,'square',.03); tone(2400,2800,.05,'square',.03,.1); },
          (x,y)=>{ flutter(x,y,2); },
          (x,y,h)=>{ const b=bounds(h.poly), px=(b.x0+b.x1)/2, py=b.y0+(b.y1-b.y0)*.55; popUp(px,py,CRIT.bunny(px,py+40,.7)); SOUND.bunny(); } ],
  tree:[ (x,y)=>{ flyOut(x,y-60,3); SOUND.tree(); }, (x,y)=>{ REACT.tree(x,y+260); SOUND.tree(); }, (x,y)=>{ flutter(x,y,3); } ],
  pond:[ (x,y)=>{ REACT.pond(x,y); SOUND.pond(); }, (x,y)=>{ addFx(`<g transform="translate(${x-60} ${y})"><g class="fxjump">${P.frog(0,0)}</g></g>`,1300); SOUND.frog(); }, (x,y)=>{ addFx(`<ellipse class="fxring" cx="${x}" cy="${y}" rx="80" ry="22" fill="none" stroke="#f5eddb" stroke-width="6"/><ellipse class="fxring" style="animation-delay:.25s" cx="${x}" cy="${y}" rx="80" ry="22" fill="none" stroke="#f5eddb" stroke-width="5"/>`,1800); SOUND.pond(); } ],
  flowers:[ (x,y)=>{ flutter(x,y,3); }, (x,y)=>{ REACT.flower(x,y+90); SOUND.flower(); }, (x,y)=>{ for(let k=0;k<6;k++) later(()=>sparkle(x+rnd(-90,90),y+rnd(-60,40)),k*100); SOUND.flower(); } ],
  moon:[ (x,y)=>{ addFx(`<g transform="translate(${x+300} ${y-120})"><g class="fxstar"><path d="M0 0 L120 -60" stroke="#f4e3a6" stroke-width="6" stroke-linecap="round" opacity=".7"/><path d="M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4Z" fill="#f4e3a6"/></g></g>`,1400); [0,.1,.2].forEach((d,i)=>tone(1600+i*400,1600+i*400,.2,'triangle',.04,d)); },
          (x,y,h)=>{ for(let k=0;k<6;k++) later(()=>sparkle(x+rnd(-260,260),y+rnd(-120,200)),k*120); SOUND.flower(); },
          (x,y)=>{ bubble(x+80,y+60,'Hoo hoo!'); voice(420,380,.3,{type:'sine',lp:1200,vol:.07}); voice(420,380,.4,{type:'sine',lp:1200,vol:.07,delay:.4}); } ],
  window:[ (x,y,h)=>{ const r=(h.r||40)*PK; addFx(`<circle class="fxhold" cx="${x}" cy="${y}" r="${r}" fill="#183847" opacity=".85"/>`,1400); tone(1200,1200,.05,'square',.03); later(()=>tone(1500,1500,.05,'square',.03),1300); } ],
  hay:[ (x,y,h)=>{ const b=bounds(h.poly), px=rnd(b.x0+80,b.x1-80), py=b.y0+(b.y1-b.y0)*.35; popUp(px,py,CRIT.mouse(px,py+50,1)); later(()=>bubble(px+30,py-110,'Squeak!'),500); [0,.12].forEach(d=>tone(3000,3600,.08,'sine',.07,d+.5)); },
         (x,y,h)=>{ const b=bounds(h.poly), px=rnd(b.x0+80,b.x1-80), py=b.y0+(b.y1-b.y0)*.35; popUp(px,py,P.chick(px,py+60,1)); later(()=>bubble(px+30,py-110,'Peep!'),500); SOUND.chick(); },
         (x,y)=>{ let s=''; for(let k=0;k<12;k++) s+=`<g transform="translate(${x+rnd(-80,80)} ${y+rnd(-40,40)})"><path class="fxfloat" style="--dx:${rnd(-160,160)|0}px;--dy:${rnd(-160,40)|0}px;--r:${rnd(-300,300)|0}deg" d="M0 0 l28 -6" stroke="#e3bd62" stroke-width="5" stroke-linecap="round"/></g>`; addFx(s,2700); noise(.4,{f:2500,q:.7,vol:.05}); } ],
  beam:[ (x,y,h)=>{ for(let k=0;k<10;k++) later(()=>sparkle(x+rnd(-120,120),y+rnd(-120,160)),k*110); SOUND.flower(); }, (x,y)=>{ flyOut(x,y,1); SOUND.tree(); } ],
  hen:[ (x,y)=>{ REACT.hen(x,y+80); SOUND.hen(); bubble(x+60,y-80,'Bawk!'); } ],
  nest:[ (x,y)=>{ popUp(x,y,P.egg(x,y+30,1)); SOUND.egg(); later(()=>bubble(x+40,y-100,'Peep?'),500); } ],
};
const shots={};
CRIT.beeMini=()=>`<g transform="scale(.5)">${beeSmall()}</g>`;
function bubblesFx(x,y,n=8){ let t=''; for(let k=0;k<n;k++) t+=`<circle class="fxfloat" style="--dx:${rnd(-60,60)|0}px;--dy:${-rnd(160,320)|0}px;--r:0deg;animation-delay:${(k*.08).toFixed(2)}s" cx="${x+rnd(-30,30)}" cy="${y}" r="${rnd(6,16)|0}" fill="none" stroke="#e6f6f4" stroke-width="4"/>`; addFx(t,3000); }
Object.assign(REACT,{
  hive:(x,y)=>flyOut(x,y-120,4,'beeMini'),
  fish:(x,y)=>bubblesFx(x+90,y-90,6),
  whale:(x,y)=>{ let t=''; for(let k=0;k<10;k++) t+=`<circle class="fxfloat" style="--dx:${rnd(-120,120)|0}px;--dy:${-rnd(120,260)|0}px;--r:0deg;animation-delay:${(k*.05).toFixed(2)}s" cx="${x+40}" cy="${y-220}" r="${rnd(8,18)|0}" fill="#e6f6f4" opacity=".9"/>`; addFx(t,2800); },
  octopus:(x,y)=>addFx(`<g transform="translate(${x-60} ${y-90})"><g class="fxink">${[[-40,0,60],[30,-20,70],[10,40,55],[-20,-40,50],[60,30,45]].map(([a,b,r])=>`<circle cx="${a}" cy="${b}" r="${r}" fill="#2b2338"/>`).join('')}</g></g>`,2500),
  jelly:(x,y)=>addFx(`<circle class="fxglow" cx="${x}" cy="${y-130}" r="120" fill="none" stroke="#f3b6c8" stroke-width="16"/>`,1700),
  coral:(x,y)=>bubblesFx(x,y-150,7),
  clam:(x,y)=>{ for(let k=0;k<5;k++) later(()=>sparkle(x+rnd(-50,50),y-rnd(40,120)),k*120); },
  butterfly:(x,y)=>flutter(x,y-80,2),
});
function gallery(g){ const page=BOOK.pages[cur], d=BOOK.art[page.scene], i=+g.dataset.hot, h=d.hot[i], list=GALLERY[h.who]; if(!list) return;
  const key=cur+':'+i, n=shots[key]=(shots[key]||0); shots[key]++; list[n%list.length](+g.dataset.ax,+g.dataset.ay,h); }


const sea=(deep)=>{ const top=deep?'#0f2a3d':'#5fb3c4', mid=deep?'#143a52':'#2f8ba0', bot=deep?'#1b4a5e':'#1f6b80';
  let t=`<rect x="-2000" y="-2000" width="5600" height="4000" fill="${top}"/><rect x="-2000" y="200" width="5600" height="800" fill="${mid}" opacity=".7"/><rect x="-2000" y="560" width="5600" height="600" fill="${bot}" opacity=".7"/>`;
  if(!deep) t+=[100,420,800,1180,1500].map((x,i)=>`<path class="drift nohit" style="animation-delay:-${i*2}s" d="M${x} -100 l120 0 l${-120+i*30} 900 l-60 0 z" fill="#ffffff" opacity=".1"/>`).join('')
     +`<rect class="nohit" x="-2000" y="150" width="5600" height="420" fill="url(#dotsW)" opacity=".7"/>`;
  _seed=21; for(let i=0;i<16;i++){ const bx=sr()*1600, by=650+sr()*350, r=5+sr()*9; t+=`<circle class="rise nohit" style="animation-delay:-${(sr()*6).toFixed(1)}s" cx="${bx}" cy="${by}" r="${r}" fill="none" stroke="#e6f6f4" stroke-width="3" opacity=".8"/>`; }
  return t; };
const sand=(y,deep)=>{ _seed=31; let t=`<path d="M-2000 ${y} Q 300 ${y-50} 800 ${y} T 3600 ${y} V 4000 H -2000 Z" fill="${deep?'#6e6a55':'#e8d3a0'}" ${L(5,OUT)}/>
  <path d="M-2000 ${y+140} Q 600 ${y+90} 1100 ${y+150} T 3600 ${y+130} V 4000 H -2000 Z" fill="${deep?'#5e5a48':'#dcc28a'}"/><path d="M-2000 ${y+40} H3600 V ${y+400} H-2000Z" fill="url(#dots)" opacity=".35"/>`;
  for(let i=0;i<22;i++){ const sx=-100+sr()*1800, sy=y+30+sr()*300; t+=`<path d="M${sx} ${sy} q10 -8 20 0" fill="none" ${L(3,deep?'#4a4738':'#c5a86e')}/>`; }
  return `<g class="nohit">${t}</g>`; };
Object.assign(SCENE,{
  garden:()=>P.sky()+P.sun(1380,320)+P.cloud(500,320,.9)+P.hills(650)+P.ground(720)
     +`<g class="nohit">${[780,860,940].map(y=>`<path d="M-2000 ${y} H3600" ${L(30,'#8a5e3c')}/><path d="M-2000 ${y} H3600" ${L(3,'#6e4a2f')}/>`).join('')}</g>`
     +P.scarecrow(1420,830)+P.cabbage(160,790,.8)+P.cabbage(360,790,.8)+P.carrot(560,790)+P.carrot(660,790)+P.cabbage(240,870,.85)+P.carrot(820,870)+P.flower(1560,980,'#f0c055',.8),
  reef:()=>sea()+sand(740)+P.rockS(180,760,1.1)+P.coral(120,760,'#e58a8a')+P.coral(330,770,'#ef9a4f',.8)+P.coral(1300,760,'#c58b9e',1.1)+P.coral(1480,770,'#e58a8a',.85)+P.kelp(1560,760,380,.9),
  kelp:()=>sea()+sand(760)+[60,220,380,1180,1340,1500].map((x,i)=>P.kelp(x,770+(i%2)*20,420+(i%3)*90,1)).join('')+P.rockS(1420,790,.8),
  sand:()=>sea()+sand(700)+P.rockS(1350,740,1.2)+P.rockS(200,760,.8)+P.coral(1500,740,'#ef9a4f',.8)+P.kelp(80,740,300,.8),
  deep:()=>sea(true)+sand(760,true)+P.rockS(1300,780,1.2)+P.kelp(1500,780,360,.9)+P.kelp(120,790,300,.8)
     +Array.from({length:30},(_,i)=>`<circle class="blink nohit" style="animation-delay:${(i*.29%2).toFixed(2)}s" cx="${(i*197)%1600}" cy="${200+(i*83)%520}" r="${2+(i%3)}" fill="#bfe8e0"/>`).join(''),
});


