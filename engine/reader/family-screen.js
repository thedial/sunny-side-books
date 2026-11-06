/* the family screen: pick a member along the top, change their name and looks, see them drawn as you go */
let famPick=SLOTS[0];
const castSvg=m=>recolor(P[m.kind](0,0,m));
/* extra kids live in FAMILY.more; their tab is "more:<index>" and they take the kid slot's sample and options */
const mem=k=>k.startsWith('more:')?FAMILY.more[+k.slice(5)]:FAMILY[k], samp=k=>k.startsWith('more:')?FAMILY_SAMPLE.kid:FAMILY_SAMPLE[k];
const tabs=()=>SLOTS.flatMap(k=>k==='kid'?['kid',...FAMILY.more.map((_,i)=>'more:'+i)]:[k]);
const pickOf=a=>a[Math.floor(Math.random()*a.length)];
/* a new kid takes after the grown-ups (skin and hair color) with a kid's hair style and shirt; the name is the one thing to type */
function newKid(){ const ps=[FAMILY.grownup1,FAMILY.grownup2].filter(g=>!g.out), look=pickOf(['f','m']);
  return {...FAMILY_SAMPLE.kid,kind:'person',out:false,name:'Kid',role:'kid',look,skin:pickOf(ps).skin,hairColor:pickOf(ps).hairColor,
    hair:pickOf(HAIR[look].filter(h=>!/bald|tuft/.test(h))),shirt:pickOf(SWATCH.cloth),pants:pickOf(SWATCH.cloth),glasses:'no',beard:'no'}; }
const famStage=()=>{ const m=mem(famPick); $('famBig').innerHTML=`<ellipse cx="0" cy="4" rx="150" ry="14" fill="#a9c49a"/><g opacity="${m.out?.25:1}">${castSvg(m)}</g>`; };
function drawFamily(){
  if(!mem(famPick)) famPick='kid';
  $('famWho').innerHTML=tabs().map(k=>`<button data-slot="${k}" class="${k===famPick?'on':''}${mem(k).out?' out':''}"><svg viewBox="-150 -290 300 300">${castSvg(mem(k))}</svg><span>${esc(mem(k).name)}</span></button>`).join('')
    +(FAMILY.more.length<MAX_KIDS-1?`<button data-add><svg viewBox="-150 -290 300 300"><circle cy="-140" r="90" fill="#fff8e7" ${S(10)}/><path d="M0 -190 V-90 M-50 -140 H50" ${L(18,OUT)}/></svg><span>Add a kid</span></button>`:'');
  const m=mem(famPick); famStage();
  const inOut=famPick.startsWith('more:')?`<div class="famRow"><button data-drop>Take ${esc(m.name)} off</button></div>`
    :samp(famPick).optional?`<div class="famRow"><button data-in="1" class="${m.out?'':'on'}">In our family</button><button data-in="0" class="${m.out?'on':''}">Not in our family</button></div>`:'';
  if(m.out){ $('famEdit').innerHTML=inOut+`<p class="famOut">Our books leave ${esc(m.name)} out. Switch back any time; the looks are kept.</p>`; return; }
  $('famEdit').innerHTML=inOut+`<label for="famName">Name</label><input id="famName" maxlength="14" autocomplete="off" value="${esc(m.name)}">`
    +CAST_OPTS[m.kind].map(([key,label,list])=>{ const vals=typeof list==='function'?list(m):list; if(!vals) return '';
      return (label?`<label>${label}</label>`:'')+`<div class="famRow">`+vals.map(v=>{ const sw=/^#/.test(v);
      return `<button data-key="${key}" data-v="${v}" class="${sw?'sw':''}${m[key]===v?' on':''}"${sw?` style="background:${v}" aria-label="${label} ${v}"`:''}>${sw?'':optLabel(key,v,m)}</button>`; }).join('')+`</div>`; }).join('');
}
function saveFamily(){ store.set('ssb.family',JSON.stringify(FAMILY)); if(STAR>FAMILY.more.length) STAR=0; const id=BOOK.id; LIB=personalize(LIB_RAW,reading(FAMILY)); BOOK=LIB.find(b=>b.id===id)||LIB[0]; }
$('famBtn').onclick=()=>{ ctx(); sfx.chime(); FAMILY=loadFamily(); $('ages').hidden=true; $('fam').hidden=false; drawFamily(); };
$('famWho').addEventListener('click',e=>{ if(e.target.closest('[data-add]')){ sfx.pop(); FAMILY.more.push(newKid()); famPick='more:'+(FAMILY.more.length-1); saveFamily(); drawFamily();
    const n=$('famName'); if(n){ n.focus(); n.select(); } return; }
  const b=e.target.closest('[data-slot]'); if(!b) return; sfx.pop(); famPick=b.dataset.slot; drawFamily(); });
$('famEdit').addEventListener('click',e=>{ const t=e.target.closest('[data-in]'); if(t){ sfx.pop(); mem(famPick).out=t.dataset.in==='0'; saveFamily(); drawFamily(); return; }
  if(e.target.closest('[data-drop]')){ sfx.pop(); FAMILY.more.splice(+famPick.slice(5),1); famPick='kid'; STAR=0; saveFamily(); drawFamily(); return; }
  const b=e.target.closest('[data-key]'); if(!b) return; sfx.pop(); const m=mem(famPick); m[b.dataset.key]=b.dataset.v;
  if(m.kind==='person'){ if(!HAIR[m.look==='m'?'m':'f'].includes(m.hair)) m.hair=HAIR[m.look==='m'?'m':'f'][0]; if(m.look!=='m'||m.role!=='grownup') m.beard='no'; }
  saveFamily(); drawFamily(); });
$('famEdit').addEventListener('input',e=>{ if(e.target.id!=='famName') return; mem(famPick).name=cleanName(e.target.value); saveFamily(); famStage();
  const tab=$('famWho').querySelector(`[data-slot="${famPick}"] span`); if(tab) tab.textContent=e.target.value; });
$('famEdit').addEventListener('change',e=>{ if(e.target.id==='famName'&&!e.target.value.trim()){ mem(famPick).name=samp(famPick).name; saveFamily(); drawFamily(); } });
