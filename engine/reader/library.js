/* ---- the book (generated content goes here; the engine above never changes) ---- */
/* our family: the book names slots ({kid} in words, "slot":"kid" on a piece); this tablet's family fills them in.
   The sample family comes with the app; a grown-up's own is kept in localStorage and nowhere else. */
const FAMILY_SAMPLE=/*FAMILY*/, SLOTS=Object.keys(FAMILY_SAMPLE).filter(k=>k[0]!=='_'&&FAMILY_SAMPLE[k].kind!=='siblings'), MAX_KIDS=6;
function loadFamily(){ let mine={}; try{ mine=JSON.parse(store.get('ssb.family')||'{}')||{}; }catch(e){}
  const f={}; for(const k of SLOTS){ f[k]={...FAMILY_SAMPLE[k],...(mine[k]||{}),kind:FAMILY_SAMPLE[k].kind}; f[k].name=cleanName(f[k].name)||FAMILY_SAMPLE[k].name;
    f[k].out=!!(FAMILY_SAMPLE[k].optional&&f[k].out); }
  f.more=(Array.isArray(mine.more)?mine.more:[]).slice(0,MAX_KIDS-1).map(m=>({...FAMILY_SAMPLE.kid,...m,kind:'person',out:false,name:cleanName(m&&m.name)||'Kid'}));
  return f; }
/* the family as one reading sees it: the kid it stars in the kid slot, every other kid in siblings. Never stored */
let STAR=0;
function reading(fam,star=STAR){ const kids=[fam.kid,...fam.more], k=kids[star]||kids[0], others=kids.filter(x=>x!==k), names=others.map(o=>o.name);
  return {...fam,kid:k,siblings:{kind:'siblings',name:names.length<2?names.join(''):names.slice(0,-1).join(', ')+' and '+names[names.length-1],list:others,out:!others.length}}; }
const usesKid=b=>/\{kid\}|"slot":\s*"kid"/.test(JSON.stringify(b));
/* a name is words, not markup: it lands in bubbles and bursts that are built as SVG text */
function cleanName(t){ return String(t||'').replace(/[<>&"\{}]/g,'').slice(0,14); }
/* a member switched out of the family: "[pet: words | other words]" picks its words, "needs" and a slot piece drop out
   or take their "else", and a dropped page is skipped. check.py resolves the same way (resolve_book) to check every mix. */
const BRANCH=/\[(\w+):([^\[\]|]*)(?:\|([^\[\]]*))?\]/g, DROP={};
function personalize(books,fam){
  const isOut=k=>!!(fam[k]&&fam[k].out), gated=o=>[].concat(o.needs||[],o.slot||[]).some(isOut);
  const words=s=>(s.includes('[')?s.replace(BRANCH,(m,k,a,b)=>(isOut(k)?b||'':a).trim()).replace(/\s{2,}/g,' ').trim():s)
    .replace(/\{(\w+)\}/g,(m,k)=>fam[k]?esc(fam[k].name):m);
  /* a siblings piece is one person per sibling in a row centered on x; "w" is the widest the row may get (gap and size give way) */
  const group=o=>{ const list=fam.siblings.list, n=list.length, {who,slot,gap=110,w=gap*3,s=1,x,y,...rest}=o, g=n>1?Math.min(gap,w/(n-1)):0, k=Math.max(.75,g/gap||1);
    return list.map((m,i)=>({...rest,who:'person',x:Math.round(x+(i-(n-1)/2)*g),y,s:+(s*k).toFixed(2),args:[m]})); };
  const fill=o=>{ if(Array.isArray(o)) return o.flatMap(v=>v&&v.who==='siblings'&&v.slot&&!gated(v)?group(fill(v)):[fill(v)]).filter(x=>x!==DROP); if(typeof o==='string') return words(o); if(!o||typeof o!=='object') return o;
    if(gated(o)){ if(!o.else) return DROP; const {needs,else:alt,slot,...rest}=o; return fill({...rest,...alt}); }
    const r={}; for(const [k,v] of Object.entries(o)){ if(k==='needs'||k==='else') continue; const x=fill(v); if(x!==DROP) r[k]=x; }
    if(r.slot&&fam[r.slot]){ r.args=[fam[r.slot]]; if(r.icon) r.icon=CAST_ICON[fam[r.slot].type]||r.icon; } return r; };
  return books.map(b=>{ const gone=new Set(Object.keys(b.pages).filter(id=>gated(b.pages[id])&&!b.pages[id].else));
    const to=id=>{ const seen=new Set(); while(gone.has(id)&&!seen.has(id)){ seen.add(id); id=b.pages[id].next; } return id; };
    const {pages,...rest}=b, out=fill(rest); out.pages={};
    for(const id of Object.keys(pages)) if(!gone.has(id)) out.pages[id]=fill(pages[id]);
    out.start=to(out.start); for(const p of Object.values(out.pages)){ if(p.next) p.next=to(p.next); for(const o of (p.choice&&p.choice.options)||[]) o.go=to(o.go); }
    return out; }); }
const LIB_RAW = /*BOOKS*/; let FAMILY=loadFamily(), LIB=personalize(LIB_RAW,reading(FAMILY)); let BOOK = LIB[0];

