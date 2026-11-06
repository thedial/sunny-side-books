/* ---- age dial: one setting per tablet (2, 3, 4, 5 and auto). It drives the mechanics only: how big and where the finds sit, decoys,
   how soon a hint comes, how long a grown-up holds Home/Mute/gear, how long the bursts run. Story, words, art, surprises and pages never change. ---- */
const store={get:k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set:(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} }};
let AGESET=Math.min(5,Math.max(2,+store.get('ssb.age')||2)), AUTO=store.get('ssb.auto')!=='0', OFFSET=Math.max(-1,Math.min(1,+store.get('ssb.autoOffset')||0));
const AGE=()=>Math.min(5,Math.max(2,AGESET+(AUTO?OFFSET:0))), AGEROW=()=>TABLES.ages[AGE()];
const FINDK=()=>AGEROW().findScale, DECOYS=()=>AGEROW().decoys, HINTMS=()=>AGEROW().hintMs, HOLDMS=()=>AGEROW().holdMs, PACE=()=>AGEROW().pace;
/* auto moves one step per page, timed per critter by the age's row in tables.auto: every critter found within upMs each and no hint
   steps up; a critter still hidden after downMs each steps down. A hint never steps down. */
let hintT=0, slowT=0, hinted=false, shownAt=0, graded=0, autoRow=null;
function grade(d){ if(graded) return; graded=d; if(!AUTO) return; OFFSET=Math.max(-1,Math.min(1,OFFSET+d)); store.set('ssb.autoOffset',OFFSET); }
function restartIdleHint(){ clearTimeout(hintT); if(finds(BOOK.pages[cur]).length) hintT=setTimeout(hint,HINTMS()); }
function hint(){ const left=[...world.querySelectorAll('.find')].filter((g,i)=>!found.has(i)); if(!left.length) return; hinted=true;
  $('hunt').querySelectorAll('span[data-i]:not(.got)').forEach(s=>{ s.classList.add('hint'); setTimeout(()=>s.classList.remove('hint'),TABLES.hintShowMs); });
  left.forEach(g=>animate(g.querySelector('.body'),'nudge',700)); restartIdleHint(); }
function pageTimers(page){ clearTimeout(hintT); clearTimeout(slowT); shownAt=performance.now(); hinted=false; graded=0; autoRow=TABLES.auto[AGE()];
  const n=finds(page).length; if(n){ slowT=setTimeout(()=>grade(-1),autoRow.downMs*n); restartIdleHint(); } }

/* perches and actor-top perches live in tables.json (fields: open, cover, for, fit; see BOOK-FORMAT "Age and finds") */
const PERCH=TABLES.perches, ONTOP=TABLES.onTop;
function perches(page){ const list=(PERCH[page.scene]||[]).map(p=>({...p}));
  for(const a of page.actors||[]){ const on=ONTOP[a.who]; if(!on||a.hide) continue; const sc=(a.s||1)*(NOBIG.includes(a.who)?1:BIG);
    for(const o of on) list.push({x:a.x+o.dx*sc,y:a.y+o.dy*sc,open:o.open!==false,fit:o.fit,on:a.who}); }
  for(const p of page.perches||[]) list.push({...p,open:p.open!==false,cover:typeof p.cover==='object'?p.cover:null});   // a number means "that piece in front already hides it"
  return list; }
/* which perch a critter gets: age 2 open spots only; 4 and 5 tucked-away spots first, except the one critter a page of two or more keeps in view;
   a spot made for that critter wins; never one already taken or on top of another find */
function pickPerch(pool,kind,age,avoid,rand,tuck=true){
  let c=pool.filter(p=>!p.used&&(!p.for||p.for.includes(kind))&&(age>2||p.open)&&!avoid.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<150));
  if(!c.length) return null;
  if(age>=4){ const h=c.filter(p=>tuck?!p.open:p.open); if(h.length) c=h; }
  const f=c.filter(p=>p.fit&&p.fit.includes(kind)); if(f.length) c=f;
  const p=c[Math.floor(rand()*c.length)]; p.used=true; return p; }
/* decoys: look-alikes near the find; a tap just wobbles them */
const DECOY={
  ladybug:()=>[0,72,144,216,288].map(a=>`<ellipse cx="0" cy="-24" rx="14" ry="20" fill="#d0452f" transform="rotate(${a})" ${L(4,OUT)}/>`).join('')+`<circle r="12" fill="#f2a24e" ${L(4,OUT)}/><circle cx="-3" cy="-3" r="4" fill="#f6d08a"/>`,
  bee:()=>[0,72,144,216,288].map(a=>`<ellipse cx="0" cy="-24" rx="14" ry="20" fill="#f0c055" transform="rotate(${a})" ${L(4,OUT)}/>`).join('')+`<circle r="12" fill="#e9874a" ${L(4,OUT)}/>`,
  caterpillar:i=>i%2?`<path d="M-50 10 q40 -60 100 -30 q-30 50 -100 30 z" fill="#6a9650" ${L(5,OUT)}/><path d="M-44 8 q50 -22 90 -26" fill="none" ${L(3,'#4f7d3a')}/>`
    :`<path d="M-56 6 q20 -36 60 -30 q40 6 54 36 q-50 12 -114 -6 z" fill="#7fa35a" ${L(5,OUT)}/>${[-32,-6,20].map(x=>`<circle cx="${x}" cy="-4" r="11" fill="#9ab765" ${L(3,OUT)}/>`).join('')}`,
  snail:()=>`<path d="M-40 14 q-6 -40 30 -42 q44 -2 42 26 q-2 18 -34 18 z" fill="#a9a596" ${L(5,OUT)}/><path d="M-24 -8 q16 -12 36 -6" fill="none" ${L(4,'#cfcbbc')}/>`,
  starfish:()=>`<path d="M-44 20 q0 -56 44 -56 q44 0 44 56 z" fill="#ef9a4f" ${L(5,OUT)}/>${[-28,-10,8,26].map(x=>`<path d="M${x} 18 L${x*.5} -30" ${L(3,'#c9743a')}/>`).join('')}`,
};
P.tuft=(x,y,c='#6b8a45',s=1)=>`<g class="nohit" transform="translate(${x} ${y}) scale(${s})"><path d="M-40 0 q-6 -40 -22 -58 q26 10 32 44 q-2 -46 10 -74 q10 30 6 72 q10 -34 36 -46 q-14 26 -22 62 z" fill="${c}" ${L(5,OUT)}/></g>`;
P.pebble=(x,y,s=1,c='#a9a596')=>`<g class="nohit" transform="translate(${x} ${y}) scale(${s})"><path d="M-40 0 q-4 -36 32 -40 q40 -2 44 26 q0 14 -22 14 z" fill="${c}" ${L(5,OUT)}/><path d="M-26 -14 q14 -10 30 -8" fill="none" ${L(3,'#cfcbbc')}/></g>`;
const cssPxPerWorld=()=>{ const m=$('stage').getScreenCTM(); return m?m.a:.6; };
const {minCss:MIN_TAP_CSS, findHitR:FIND_HIT_R, decoyR:DECOY_R}=TABLES.tap;
const hitR=(k,base=FIND_HIT_R)=>Math.ceil(Math.max(base,MIN_TAP_CSS/2/(cssPxPerWorld()*k)));
P.find=(kind,x,y,k=1,perch='fixed')=>`<g class="tap find" data-kind="${kind}" data-k="${k}" data-perch="${perch}" transform="translate(${x} ${y}) scale(${k})"><circle class="hit" data-k="${k}" r="${hitR(k)}"/><g class="anim body">${FINDS[kind].draw()}</g></g>`;
P.decoy=(kind,x,y,k,i)=>`<g class="tap decoy" transform="translate(${x} ${y}) scale(${k})"><circle r="${DECOY_R}" fill="transparent"/><g class="anim">${DECOY[kind](i)}</g></g>`;
/* lay out a page's finds for the age: perch the coordinate-free ones, scatter decoys near each, add the covers of the perches used */
function layFinds(page,at,rand){
  const between=(a,b)=>a+rand()*(b-a);
  const pool=perches(page), age=AGE(), k=FINDK(), fl=finds(page).map(f=>({kind:f[0],x:f[1],y:f[2]})), fixed=fl.filter(f=>f.x!=null);
  for(const p of pool) if(fixed.some(f=>Math.hypot(f.x-p.x,f.y-p.y)<120)) p.used=true;
  const free=fl.filter(f=>f.x==null), inView=free.length>1?free[Math.floor(rand()*free.length)]:null;
  for(const f of free){ const p=pickPerch(pool,f.kind,age,fl.filter(o=>o.x!=null),rand,f!==inView); if(p){ f.x=p.x; f.y=p.y; f.cover=p.cover; f.perch=p.open?'open':'half'; } else { f.x=800; f.y=930; f.perch='none'; } }
  const dec=[], clear=hitR(k)*k+DECOY_R*k+4, clearOfFinds=(x,y)=>fl.every(o=>Math.hypot(o.x-x,o.y-y)>=clear); let s='';
  const perFind=Math.min(DECOYS(),page.decoys??Infinity);
  for(const f of fl) for(let i=0;i<perFind&&DECOY[f.kind];i++){
    const near=pool.filter(p=>!p.used&&p.open&&p.fit&&p.fit.includes(f.kind)&&Math.hypot(p.x-f.x,p.y-f.y)<420&&clearOfFinds(p.x,p.y)); let d=null;   // a flower head goes on a stem; leaves, pods and pebbles lie on the ground
    if(near.length){ const p=near[Math.floor(rand()*near.length)]; p.used=true; d={x:p.x,y:p.y}; }
    else for(let t=0;t<14&&!d;t++){ const x=Math.min(1540,Math.max(60,f.x+between(-260,260))), y=f.y>680?Math.min(985,Math.max(700,f.y+between(-120,120))):between(760,960);
      if(clearOfFinds(x,y)&&!dec.some(q=>Math.hypot(q.x-x,q.y-y)<110)) d={x,y}; }
    if(d) dec.push({kind:f.kind,x:d.x,y:d.y,i}); }
  for(const d of dec){ const [x,y,kk]=at(d.x,d.y); s+=P.decoy(d.kind,x,y,kk*k,d.i); }
  for(const f of fl){ const [x,y,kk]=at(f.x,f.y); s+=P.find(f.kind,x,y,kk*k,f.perch); }
  for(const f of fl) if(f.cover){ const c=f.cover, fn=P[c.who]; if(!fn) continue; const [x,y,kk]=at(c.x,c.y), sc=(c.s||1)*kk, pc=fn(x,y,...(c.args||[]));
    s+=`<g style="pointer-events:none">`+(sc!==1?`<g transform="translate(${x} ${y}) scale(${sc}) translate(${-x} ${-y})">${pc}</g>`:pc)+`</g>`; }
  /* ?debug: every perch outlined (red open, blue half hidden) with its name */
  s+=`<g class="perchD nohit">`+pool.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="30" fill="none" stroke="${p.open?'red':'blue'}" stroke-width="3"/><text x="${p.x+34}" y="${p.y+6}" font-size="20" fill="${p.open?'red':'blue'}">${p.on||''}</text>`).join('')+`</g>`;
  return s; }

/* a page's perch picks and decoys replay exactly from its seed: book/page/visit/age. A new visit re-rolls them.
   ?debug shows the seed; ?seed=<that text> opens that page at that age with the same layout. */
const visits={};
const hash32=s=>{ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; };
function mulberry32(a){ return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function nextSeed(id){ const key=BOOK.id+'/'+id, v=visits[key]=(visits[key]||0)+1; return `${key}/${v}/${AGE()}`; }

