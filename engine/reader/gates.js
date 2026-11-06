/* hold gates: Home, Mute and the gear need a held finger (1.2 s at age 2 and 3, 0.8 s at 4 and 5); a tap or a slip off the button does nothing */
/* a quick tap shows the grown-up a word on what to do; a toddler can't read it, so it gives her nothing */
let tipT=0;
function holdTip(btn){ const tip=$('holdTip'), r=btn.getBoundingClientRect(); tip.textContent=btn.dataset.tip; tip.hidden=false;
  tip.style.top=(r.top<innerHeight/2?r.bottom+8:r.top-tip.offsetHeight-8)+'px'; tip.style.right=Math.max(8,innerWidth-r.right)+'px';
  clearTimeout(tipT); tipT=setTimeout(()=>{ tip.hidden=true; },2200); }
function gate(btn,fn){ let t=0; const stop=()=>{ clearTimeout(t); t=0; btn.classList.remove('holding'); };
  btn.addEventListener('pointerup',()=>{ if(t&&btn.dataset.tip) holdTip(btn); });
  btn.addEventListener('pointerdown',e=>{ e.preventDefault(); stop(); btn.style.setProperty('--hold',HOLDMS()+'ms'); btn.classList.add('holding'); t=setTimeout(()=>{ stop(); fn(); },HOLDMS()); });
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,stop)); }
gate($('mute'),()=>{ muted=!muted; $('mute').textContent=muted?'🔇':'🔊'; });
if(/debug/.test(location.search+location.hash)) document.body.classList.add('debug');
/* the age screen: a big number, four suns to pick from, auto on or off. Nothing else is stored. */
function ages(){ $('ages').hidden=false; drawAges(); }
function drawAges(){ $('ageNum').textContent=AGESET; $('ageRow').innerHTML=[2,3,4,5].map(n=>`<button class="sunb${n===AGESET?' on':''}" data-age="${n}" aria-label="Age ${n}">${n}</button>`).join('');
  $('autoBtn').textContent=AUTO?'Auto on':'Auto off'; $('autoBtn').classList.toggle('on',AUTO);
  $('ageNote').textContent=AUTO?`Auto nudges the finds a step easier or harder as she plays${OFFSET?` (right now: ${OFFSET>0?'a step harder':'a step easier'})`:''}.`:'The finds stay set for this age.'; }
$('ageRow').addEventListener('click',e=>{ const b=e.target.closest('[data-age]'); if(!b) return; ctx(); sfx.chime(); AGESET=+b.dataset.age; OFFSET=0;
  store.set('ssb.age',AGESET); store.set('ssb.autoOffset',0); drawAges(); });
$('autoBtn').onclick=()=>{ ctx(); sfx.pop(); AUTO=!AUTO; OFFSET=0; store.set('ssb.auto',AUTO?'1':'0'); store.set('ssb.autoOffset',0); drawAges(); };
$('ageDone').onclick=()=>{ ctx(); sfx.page(); $('ages').hidden=true; shelf(); };
$('ages').addEventListener('click',e=>{ if(e.target===$('ages')) $('ageDone').onclick(); });
gate($('gear'),()=>{ ctx(); sfx.chime(); ages(); });
