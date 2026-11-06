// run with a header line first, e.g. const SIB={n:6,view:"picker",picked:2}; or {n:6,view:"page",cap:3}
/* siblings design prototype: a star kid per reading, the others drawn as siblings; a character-select picker */
const KIDS=[
 {kind:'person',name:'Sam',look:'m',role:'kid',skin:'#efc6a6',hair:'swoop',hairColor:'#5a3a24',shirt:'#4f9c9b',pants:'#3f6d8e',glasses:'no',beard:'no'},
 {kind:'person',name:'Rosie',look:'f',role:'kid',skin:'#dcaa84',hair:'pigtails',hairColor:'#5a3a24',shirt:'#e58a8a',pants:'#8d86c6',glasses:'no',beard:'no'},
 {kind:'person',name:'Theo',look:'m',role:'kid',skin:'#efc6a6',hair:'curly',hairColor:'#5a3a24',shirt:'#6a9650',pants:'#3f6d8e',glasses:'yes',beard:'no'},
 {kind:'person',name:'June',look:'f',role:'kid',skin:'#dcaa84',hair:'bob',hairColor:'#5a3a24',shirt:'#f0c055',pants:'#3f6d8e',glasses:'no',beard:'no'},
 {kind:'person',name:'Max',look:'m',role:'kid',skin:'#efc6a6',hair:'spiky',hairColor:'#5a3a24',shirt:'#8d86c6',pants:'#6a9650',glasses:'no',beard:'no'},
 {kind:'person',name:'Baby',look:'f',role:'baby',skin:'#efc6a6',hair:'tuft',hairColor:'#94592f',shirt:'#f0c055',pants:'#f0c055',glasses:'no',beard:'no'}];
const kids=SIB.n===3?[KIDS[0],KIDS[1],KIDS[5]]:KIDS;
const star=kids[SIB.pick||0], sibs=kids.filter(k=>k!==star);
const list=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];

if(SIB.view==='picker'){
  const css=`#pick{position:fixed;inset:0;z-index:99;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2.5vh;
     background:repeating-conic-gradient(from 0deg at 50% 120%,#ffd23f 0 6deg,#ffc21f 6deg 12deg)}
   #pick h1{font:400 clamp(44px,8vw,84px)/1 Bangers,var(--display);letter-spacing:2px;color:#fff;margin:0;
     -webkit-text-stroke:3px #1d1a17;paint-order:stroke;text-shadow:5px 5px 0 #1d1a17}
   #pick .row{display:flex;flex-wrap:wrap;gap:2.2vw;justify-content:center;max-width:${kids.length>4?'64vw':'94vw'}}
   #pick button{all:unset;cursor:pointer;width:${kids.length>4?'17vw':'22vw'};display:flex;flex-direction:column;align-items:stretch;
     transform:skewX(-6deg);border:5px solid #1d1a17;border-radius:14px;overflow:hidden;box-shadow:6px 6px 0 #1d1a17;background:#fff8e7;transition:transform .4s}
   #pick button svg{display:block;width:100%;height:auto;transform:skewX(6deg)}
   #pick button span{font:400 clamp(24px,3.4vw,40px)/1.1 Bangers,var(--display);letter-spacing:1px;text-align:center;padding:4px 0 6px;
     background:#1d1a17;color:#fff;transform:skewX(6deg)}
   #pick.picked button{opacity:.5}
   #pick button.me{opacity:1;transform:skewX(-6deg) scale(1.14) translateY(-10px);border-color:#e8382f;box-shadow:0 0 0 6px #fff,8px 10px 0 6px #1d1a17;z-index:2}
   #pick button.me span{background:#e8382f}
   #pick .go{font:400 clamp(36px,6vw,64px)/1 Bangers,var(--display);color:#e8382f;-webkit-text-stroke:2px #1d1a17;letter-spacing:2px;min-height:1em}`;
  const crop=k=>k.role==='baby'?'-95 -175 190 180':'-95 -225 190 180';
  const card=(k,i)=>`<button class="${SIB.picked===i?'me':''}"><svg viewBox="${crop(k)}"><rect x="-200" y="-400" width="400" height="500" fill="${tint(k.shirt,.6)}"/>${person(k)}</svg><span>${k.name}</span></button>`;
  document.head.insertAdjacentHTML('beforeend',`<style>${css}</style>`);
  document.body.insertAdjacentHTML('beforeend',`<div id="pick" class="${SIB.picked!=null?'picked':''}"><h1>Who's playing?</h1><div class="row">${kids.map(card).join('')}</div>
    <div class="go">${SIB.picked!=null?`Here comes ${kids[SIB.picked].name}!`:''}</div></div>`);
} else {
  FAMILY.kid={...star}; LIB=personalize(LIB_RAW,FAMILY);
  const b=LIB.find(b=>b.id.endsWith('peekaboo-family')), drawn=SIB.cap?sibs.slice(0,SIB.cap):sibs;
  const put=(page,x0,gap,s)=>page.actors.unshift(...drawn.map((k,i)=>({who:'person',x:x0+i*gap,y:k.role==='baby'?925:918,s:(k.role==='baby'?1:s)*.88,args:[k]}))); const bump=(page,i,ds)=>{ const a=page.actors[page.actors.length-1-i]; };
  const c=b.pages.cover; c.actors=c.actors.filter(a=>a.who!=='pet');
  const n=drawn.length, x0=n>3?330:420; [x0,x0+130,x0+260].forEach((x,i)=>{c.actors[i].x=x; if(c.actors[i].slot==='kid') c.actors[i].s=1.1;});
  put(c,x0+380,n>3?118:130,n>3?.85:.9); c.actors.push({who:'pet',x:x0+380+n*(n>3?118:130)+20,y:975,s:.85,args:[FAMILY.pet]});
  if(n>3) b.coverView='160 300 1440 900';
  const p=b.pages.p1; p.actors[0].x=n>3?520:640; p.actors[1].x=n>3?660:800; p.actors[1].s=1.1;
  put(p,n>3?800:960,n>3?118:140,n>3?.85:.95);
  p.text=p.text.replace('go to the farm.',`go to the farm. ${list(sibs.map(k=>k.name))} come${sibs.length>1?'':'s'} too.`);
}
