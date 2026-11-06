/* ---- engine ---- */
const world=$('world'), fx=$('fx'), marks=$('marks');
let cur=BOOK.start, history=[];
const SCENEBG={night:'#2f4d40',barn:'#e2c48a',reef:'#2c6f7e',kelp:'#24585c',sand:'#d8c08c',deep:'#10293a',garden:'#8fae5a'};

const SHADES=['#e2d6ba','#e5b94a','#d98a78','#a97c4c','#918d7f','#c7a63e','#d36d5a','#6a8f4a','#d3a94e','#c58b9e','#3d7f86'];
const halftone=str=>str.replace(/<(path|ellipse|circle)([^>]*?)fill="(#[0-9a-f]{6})"([^>]*?)\/>/g,(m,tag,a,c,b)=>SHADES.includes(c)&&!/stroke=/.test(a+b)?m+`<${tag}${a}fill="url(#dots)"${b}/>`:m);
const HEIGHT={person:250,pet:150,lovey:150,hen:150,chick:95,cow:220,pig:150,duck:130,frog:100,egg:90,beeBig:180,butterfly:150,fish:140,octopus:200,turtle:140,crab:160,seahorse:260,jelly:200,whale:230,clam:90,carrot:90,flower:130,potato:70,rock:70};
const BIG=1.35, NOBIG=['hive','shell','coral','kelp','rockS','wreck','cabbage','carrot','scarecrow','leafBig'];
function withTapFloor(piece,h,sc){ return piece.replace(/<g class="tap[^"]*"[^>]*>/,m=>m+`<circle class="hit" data-k="${sc}" data-base="0" cx="0" cy="${-h/2}" r="${hitR(sc,0)}"/>`); }
function art(page,seed=''){
  const pd=BOOK.art&&BOOK.art[page.scene], acts=page.actors||[];
  /* on narrow screens, center the crop on where the characters are */
  const focus=pd&&acts.length?acts.reduce((t,a)=>t+toPic(a.x,a.y)[0],0)/acts.length:null;
  let s=pd?painted(pd,focus):SCENE[page.scene]();
  const at=(x,y)=>{ if(!pd) return [x,y,1]; const [px,py]=toPic(x,y); return [PX(px),PY(py),PK/CK]; };
  for(const a of acts){
    const fn=P[a.who]; if(!fn) continue; const [x,y,k]=at(a.x,a.y), sc=(a.s||1)*k*(pd||NOBIG.includes(a.who)?1:BIG);
    let piece = a.who==='egg' ? P.egg(x,y,1,a.wobble?'wobbleEgg':'') : fn(x,y,...(a.args||[]));
    const n=acts.filter(b=>b.who===a.who).length, hgt=((HEIGHT[a.who]||150)*sc)|0;
    if(n>1||a.hide) piece=withTapFloor(piece,HEIGHT[a.who]||150,sc);
    s += `<g data-i="${acts.indexOf(a)}" data-n="${n}" data-h="${hgt}"${a.hide?` data-hide="${a.found||'FOUND YOU!'}"`:''}>`+(sc!==1 ? `<g transform="translate(${x} ${y}) scale(${sc}) translate(${-x} ${-y})">${piece}</g>` : piece)+`</g>`;
  }
  (page.flaps||[]).forEach((f,i)=>{ const [x,y,k]=at(f.x,f.y);
    for(const hd of [].concat(f.hide||[])){ const fn=P[hd.who]; if(!fn) continue; const hx=x+(hd.dx||0)*k, hy=y+(hd.dy||0)*k, sc=(hd.s||1)*k*BIG, pc=fn(hx,hy,...(hd.args||[]));
      s+=`<g data-flap="${i}" style="pointer-events:none">`+(sc!==1?`<g transform="translate(${hx} ${hy}) scale(${sc}) translate(${-hx} ${-hy})">${pc}</g>`:pc)+`</g>`; }
    s+=flapPiece(f,i,x,y,k); });
  for(const f of page.front||[]){ const fn=P[f.who]; if(!fn) continue; const [x,y,k]=at(f.x,f.y);
    const pc=fn(x,y,...(f.args||[])); s+=`<g style="pointer-events:none">`+((f.s||1)*k!==1?`<g transform="translate(${x} ${y}) scale(${(f.s||1)*k}) translate(${-x} ${-y})">${pc}</g>`:pc)+`</g>`; }
  if(finds(page).length) s+=layFinds(page,at,mulberry32(hash32(seed)));
  return halftone(recolor(s));
}

function focusView(o){ const d=BOOK.art&&BOOK.art[o.scene]; if(d&&o.focus){ paintMap(d); const [fx_,fy,fw]=o.focus, w=fw*PK, h=w/1.6; return `${(PX(fx_)-w/2)|0} ${(PY(fy)-h/2)|0} ${w|0} ${h|0}`; } return o.view||'0 0 1600 1000'; }
function thumb(o){ const s=art({scene:o.scene,actors:o.actors}); return s.replace(/id="paint"/g,'id="paintT"').replace(/#paint"/g,'#paintT"').replace(/class="tap actor"/g,'class="actor"'); }
function show(id){
  dropLater(); const page=BOOK.pages[id]; cur=id; counted={}; found=new Set(); flapState={}; $('shelf').hidden=true; $('home').hidden=false; $('gear').hidden=true;
  marks.innerHTML=''; if(page.letter&&AGEROW().letterTiles){ $('letter').hidden=false; $('letter').textContent=page.letter[0]; } else $('letter').hidden=true;
  const pd=BOOK.art&&BOOK.art[page.scene]; document.body.classList.toggle('painted',!!pd);
  document.body.style.background=pd?(pd.bottom||'#7d9a4f'):(SCENEBG[page.scene]||'#8fae5a');
  $('words').innerHTML=page.text||''; $('words').hidden=!page.text;
  const seed=nextSeed(id); $('seed').textContent='seed='+seed;
  layout(); world.innerHTML=art(page,seed); fx.innerHTML='';
  huntLabel(page); pageTimers(page);
  const ch=$('choices');
  if(page.choice){
    ch.innerHTML=page.choice.options.map((o,i)=>`<button class="choice" data-go="${o.go}" aria-label="${o.label}">
      <svg viewBox="${focusView(o)}" preserveAspectRatio="xMidYMid slice">${thumb(o)}</svg><span>${o.label}</span></button>`).join('');
    ch.hidden=false; $('next').hidden=true;
  } else { ch.hidden=true; ch.innerHTML=''; $('next').hidden=!page.next && !page.end; }
  $('next').textContent=page.end?'↺':'▶';
  $('back').hidden=history.length===0;
}

const BURST_MS=TABLES.burstMs;
function burst(x,y,text,fill='#f6c84c',ink='#d0452f',size=54){ const w=Math.max(160,text.length*size*.62+60), h=size*2.1; let pts=[];
  for(let i=0;i<24;i++){ const a=i/24*Math.PI*2, r=i%2?0.8:1.1; pts.push(`${(Math.cos(a)*w/2*r).toFixed(0)},${(Math.sin(a)*h/2*r).toFixed(0)}`); }
  addFx(`<g transform="translate(${x} ${y}) rotate(${rnd(-7,7)|0})"><g class="pop"><polygon points="${pts.join(' ')}" fill="${fill}" ${S(6)}/>
    <text class="bubble" y="${size*.36}" text-anchor="middle" font-size="${size}" fill="${ink}" stroke="${OUT}" stroke-width="2.5" paint-order="stroke">${text}</text></g></g>`,BURST_MS); }
const SFXWORD={barn:['CREAK!',-400],cloud:['PITTER-PAT!',60],pond:['SPLASH!',-110],tree:['RUSTLE!',-420],pine:['RUSTLE!',-380],flower:['POP!',-150],hay:['SQUEAK!',-150],
  sun:['HELLO!',150],hive:['BZZZ!',-300],coral:['BLUB!',-220],kelp:['SWISH!',-360],clam:['SNAP!',-120],cabbage:['CRUNCH!',-140],carrot:['CRUNCH!',-120]};
/* counting: tap each animal of a kind and it gets a number */
const PLURAL={person:'OF US',pig:'PIGS',hen:'HENS',chick:'CHICKS',duck:'DUCKS',cow:'COWS',fish:'FISH',crab:'CRABS',jelly:'JELLYFISH',beeBig:'BEES',butterfly:'BUTTERFLIES',frog:'FROGS',clam:'CLAMS',
  ladybug:'LADYBUGS',bee:'BEES',caterpillar:'CATERPILLARS',snail:'SNAILS',squid:'SQUID',starfish:'STARFISH',carrot:'CARROTS',flower:'FLOWERS'};
let counted={}, found=new Set();
function badge(x,y,n){ const g=document.createElementNS('http://www.w3.org/2000/svg','g'); g.setAttribute('class','nohit');
  g.innerHTML=`<g transform="translate(${x} ${y})"><g class="popin"><circle r="40" fill="#fff6d8" ${S(6)}/><text class="bubble" y="17" text-anchor="middle" font-size="52" fill="#d0452f">${n}</text></g></g>`; marks.appendChild(g); }
function countTap(kind,key,x,y,total){ if(total<2) return; const c=counted[kind]=counted[kind]||new Set(); if(c.has(key)) return; c.add(key); badge(x,y,c.size);
  tone(500+c.size*120,500+c.size*120,.15,'triangle',.07); if(c.size===total) later(()=>{ burst(x,y-130,`${total} ${PLURAL[kind]||kind.toUpperCase()}!`); sfx.fanfare(); },450); }
function huntLabel(page){ const f=finds(page), h=(page.actors||[]).filter(a=>a.hide); $('hunt').hidden=!(f.length||h.length);
  const fl=page.flaps||[]; if(fl.length) $('hunt').hidden=false;
  $('hunt').innerHTML=(fl.length?'Lift '+fl.map((x,i)=>`<span data-fl="${i}">${FLAP[x.type].icon}</span>`).join(' ')+' ':'')+(f.length||h.length?'Find ':'')+h.map(a=>`<span data-h="1">${a.icon||'👀'}</span>`).join(' ')+' '+f.map((it,i)=>`<span data-i="${i}">${FINDS[it[0]].icon}</span>`).join(' '); }
function animate(node,cls,ms=1200){ if(!node) return; node.classList.remove(cls); void node.getBBox(); node.classList.add(cls); pace(node); setTimeout(()=>node.classList.remove(cls),ms*PACE()); }
function bubble(x,y,text){
  text=text.toUpperCase(); const w=Math.max(150,text.length*27+50);
  addFx(`<g transform="translate(${x} ${y})"><g class="say"><path d="M0 0 l20 -40 h${w-20} a20 20 0 0 0 20 -20 v-60 a20 20 0 0 0 -20 -20 h-${w} a20 20 0 0 0 -20 20 v60 a20 20 0 0 0 20 20 z" fill="#ffffff" ${S(6)}/>
    <text class="bubble" x="${w/2}" y="-80" text-anchor="middle" font-size="50" fill="${OUT}">${text}</text></g></g>`,1700);
}

$('stage').addEventListener('pointerdown',e=>{
  ctx(); restartIdleHint(); const g=e.target.closest('.tap'); if(!g){ const w=toWorld(e); sparkle(w.x,w.y); return; }
  if(g.dataset.hot!=null){ gallery(g); return; }
  if(g.classList.contains('flapG')){ flipFlap(g); return; }
  if(g.classList.contains('decoy')){ animate(g.querySelector('.anim'),'nudge',500); return; }   // a look-alike: a gentle wobble and nothing else
  if(g.classList.contains('find')){ const kind=g.dataset.kind, F=FINDS[kind], i=[...world.querySelectorAll('.find')].indexOf(g), list=finds(BOOK.pages[cur]);
    animate(g.querySelector('.body'),F.anim,F.ms); F.snd();
    if(!found.has(i)){ found.add(i); const sp=$('hunt').querySelector(`[data-i="${i}"]`); if(sp) sp.classList.add('got');
      const m=g.transform.baseVal.consolidate().matrix; countTap(kind,i,m.e+60,m.f-70,list.filter(it=>it[0]===kind).length);
      if(found.size===list.length){ clearTimeout(hintT); clearTimeout(slowT); if(!hinted&&performance.now()-shownAt<=autoRow.upMs*list.length) grade(1);
        later(()=>{ burst(800,420,'YOU FOUND THEM!','#8fd3c4','#1d1a17',60); sfx.fanfare(); },900*PACE()); } }
    return; }
  const a=g.querySelector('.anim'); const actor=g.closest('.actor'); const who=actor&&actor.dataset.who, ax=actor?+actor.dataset.ax:800, ay=actor?+actor.dataset.ay:600;
  const hid=g.closest('[data-hide]'); if(hid && !hid.dataset.done){ hid.dataset.done=1; animate(a,'peekUp',2300); if(SOUND[who]) SOUND[who]();
    burst(ax,ay-(+hid.dataset.h||180)-120,hid.dataset.hide,'#8fd3c4','#1d1a17',58); const sp=$('hunt').querySelector('[data-h="1"]'); if(sp) sp.classList.add('got'); later(()=>sfx.fanfare(),300); return; }
  animate(a,g.dataset.react||'boing',1100);
  if(SOUND[who]) SOUND[who](); else if(g.dataset.sfx) sfx[g.dataset.sfx]();
  if(REACT[who]) REACT[who](ax,ay);
  if(SFXWORD[who]) burst(ax+(who==='sun'?-200:0), ay+SFXWORD[who][1], SFXWORD[who][0]);
  else if(g.dataset.bubble||g.dataset.say) bubble(ax+30, ay-(+g.closest('[data-h]')?.dataset.h||150), g.dataset.bubble||g.dataset.say.replace(/!.*$/,'!'));
  const holder=g.closest('[data-i]'); if(holder){ const kin=+holder.dataset.n; countTap(who,+holder.dataset.i,ax,ay-(+holder.dataset.h||180)-40,kin); }
});
/* lift the scene so the ground and characters always sit above the words strip, whatever the screen shape */
function layout(){
  const st=$('stage'), m=st.getScreenCTM(); const w=$('words');
  let T=170;
  if(m && !w.hidden){ const top=w.getBoundingClientRect().top; T=Math.round(965-(top-10-m.f)/m.d); }
  T=Math.max(170,Math.min(460,T));
  world.setAttribute('transform',`translate(0 ${-T})`); fx.setAttribute('transform',`translate(0 ${-T})`); marks.setAttribute('transform',`translate(0 ${-T})`);
  if(m){ VIEW={x0:(0-m.e)/m.a, x1:(innerWidth-m.e)/m.a, y0:(0-m.f)/m.d+T, y1:(innerHeight-m.f)/m.d+T};
    world.querySelectorAll('.hit').forEach(c=>c.setAttribute('r',hitR(+c.dataset.k||1,c.dataset.base!=null?+c.dataset.base:FIND_HIT_R))); }
}
let rz; addEventListener('resize',()=>{ clearTimeout(rz); rz=setTimeout(()=>{ const pd=BOOK.art&&BOOK.art[BOOK.pages[cur].scene]; if(pd) show(cur); else layout(); },150); });
$('next').onclick=()=>{ ctx(); const p=BOOK.pages[cur]; sfx.page();
  if(p.end){ history=[]; if(LIB.length>1) shelf(); else show(BOOK.start); return; } history.push(cur); show(p.next); if(BOOK.pages[cur].sound) sfx[BOOK.pages[cur].sound](); };
$('back').onclick=()=>{ ctx(); sfx.page(); if(history.length) show(history.pop()); };
$('choices').addEventListener('click',e=>{ const b=e.target.closest('.choice'); if(!b) return; ctx(); sfx.chime(); history.push(cur); show(b.dataset.go); });
document.addEventListener('contextmenu',e=>e.preventDefault());
$('anyway').onclick=()=>document.body.classList.add('anyway');
