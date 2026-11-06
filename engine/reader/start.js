function hello(){ $('hello').hidden=false; $('hello1').hidden=false; $('hello2').hidden=true; }
gate($('helloHold'),()=>{ ctx(); sfx.chime(); store.set('ssb.welcomed','1'); $('hello1').hidden=true; $('hello2').hidden=false; });
$('helloFam').onclick=()=>{ $('hello').hidden=true; $('famBtn').onclick(); };
$('helloLater').onclick=()=>{ ctx(); sfx.page(); $('hello').hidden=true; };
$('famDone').onclick=()=>{ ctx(); sfx.page(); saveFamily(); $('fam').hidden=true; shelf(); };
function shelf(){ dropLater(); fx.innerHTML=''; marks.innerHTML=''; $('shelf').hidden=false; ['hunt','choices','letter'].forEach(i=>$(i).hidden=true); $('words').hidden=true; $('next').hidden=true; $('back').hidden=true; $('home').hidden=true; $('gear').hidden=false;
  clearTimeout(hintT); clearTimeout(slowT);
  const keep=BOOK; $('shelf').querySelector('.covers').innerHTML=LIB.map((b,i)=>{ BOOK=b; const c=b.pages[b.start];
    const svg=art({scene:c.scene,actors:c.actors}).replace(/class="tap[^"]*"/g,'class="nohit"');
    return `<button data-b="${i}" aria-label="${b.title}"><svg viewBox="${b.coverView||'100 250 1400 965'}" preserveAspectRatio="xMidYMid slice">${svg}</svg><span>${b.title}</span></button>`; }).join(''); BOOK=keep; }
const openBook=i=>{ BOOK=LIB[i]; history=[]; show(BOOK.start); };
$('shelf').addEventListener('click',e=>{ const b=e.target.closest('[data-b]'); if(!b) return; ctx(); sfx.chime();
  if(FAMILY.more.length&&usesKid(LIB_RAW[+b.dataset.b])) whoPlays(+b.dataset.b); else openBook(+b.dataset.b); });
/* "Who's playing?": each kid's card; the tapped one stars in this reading (kept until the app closes, never stored) */
function whoPlays(i){ const kids=[FAMILY.kid,...FAMILY.more], el=$('pick'), row=el.querySelector('.row');
  row.className='row'+(kids.length>4?' many':''); el.className=''; el.querySelector('.go').textContent='';
  row.innerHTML=kids.map((k,j)=>`<button data-k="${j}" aria-label="${esc(k.name)}"><svg viewBox="${k.role==='baby'?'-95 -175 190 180':k.role==='grownup'?'-95 -280 190 180':'-95 -225 190 180'}"><rect x="-200" y="-400" width="400" height="500" fill="${tint(k.shirt||'#f0c055',.6)}"/>${recolor(person(k))}</svg><span>${esc(k.name)}</span></button>`).join('');
  el.hidden=false;
  row.onclick=e=>{ const c=e.target.closest('[data-k]'); if(!c||el.className) return; ctx(); sfx.fanfare(); STAR=+c.dataset.k; c.classList.add('me'); el.className='picked';
    el.querySelector('.go').textContent=`Here comes ${kids[STAR].name}!`; LIB=personalize(LIB_RAW,reading(FAMILY));
    setTimeout(()=>{ el.hidden=true; openBook(i); },1400); }; }
gate($('home'),()=>{ ctx(); sfx.page(); shelf(); });
$('letter').onclick=()=>{ ctx(); const L_=BOOK.pages[cur].letter; if(!L_) return; burst(800,330,`${L_[1]}  ${L_[2]}`,'#fff6d8','#d0452f',62); tone(660,880,.12,'triangle',.07); };
function replay(seed){ const [bookId,pageId,visit,age]=seed.split('/'), b=LIB.find(x=>x.id===bookId);
  if(!b||!b.pages[pageId]||!(+age>=2&&+age<=5)) return false;
  BOOK=b; AGESET=+age; AUTO=false; visits[bookId+'/'+pageId]=(+visit||1)-1; show(pageId); return true; }
const seedArg=new URLSearchParams(location.search).get('seed');
if(!(seedArg&&replay(seedArg))){ if(LIB.length>1) shelf(); else show(BOOK.start); if(!store.get('ssb.welcomed')) hello(); }
