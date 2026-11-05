// Screenshots of the built reader, so a change can be shown instead of described.
//
//   python3 -I engine/build.py preview.html books/*.json
//   node engine/shots.mjs [targets...] [--page preview.html] [--out reports/shots] [--age 2-5] [--size 1024x768] [--family my.json]
//
// Targets (default: shelf):
//   shelf                         the bookshelf
//   hello                         the first-open grown-up card
//   family  family:pet            the family screen, on a member (grownup1, grownup2, kid, pet, lovey)
//   peekaboo-family/p1            a book page; the book is matched by the end of its id
//   peekaboo-family/p1+open       the same page with every flap lifted and every hidden actor found
//   peekaboo-family/*             every page of a book
//   cast:hair cast:pets cast:loveys   every option of the family cast, side by side
//
// --family takes a JSON file shaped like engine/family.json (any subset of slots) and plays it as the tablet's family.
// Exit 1 if the page throws, so a broken screen is not mistaken for a picture of one.
import { launch, openPage } from './browser.mjs';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args.splice(i, 2)[1]; };
const pagePath = opt('page', 'preview.html'), out = opt('out', 'reports/shots'), age = +opt('age', 2);
const [W, H] = opt('size', '1024x768').split('x').map(Number), famFile = opt('family', '');
const targets = args.length ? args : ['shelf'];
const url = pathToFileURL(resolve(pagePath)).href;
mkdirSync(out, { recursive: true });

const family = famFile ? readFileSync(famFile, 'utf-8') : '';
const preload = (welcomed) => `try{ ${welcomed ? "localStorage.setItem('ssb.welcomed','1');" : "localStorage.removeItem('ssb.welcomed');"}
  localStorage.setItem('ssb.age','${age}'); localStorage.setItem('ssb.auto','0');
  ${family ? `localStorage.setItem('ssb.family', ${JSON.stringify(family)});` : "localStorage.removeItem('ssb.family');"} }catch(e){}`;
const wait = ms => new Promise(r => setTimeout(r, ms));

/* a tap the way the stage hears one: pointerdown then pointerup at the middle of the element */
const TAP = `const tap=g=>{ const r=g.getBoundingClientRect(), o={bubbles:true,clientX:r.x+r.width/2,clientY:r.y+r.height/2,pointerId:1,isPrimary:true};
  g.dispatchEvent(new PointerEvent('pointerdown',o)); g.dispatchEvent(new PointerEvent('pointerup',o)); };`;

/* galleries are drawn straight into the stage, one cast member per cell */
const GALLERY = {
  hair: `const rows=[]; for(const look of ['f','m']) for(const role of ['grownup','kid']) rows.push(HAIR[look].map(h=>({kind:'person',look,role,hair:h,
      hairColor:['#5a3a24','#2b2220','#d9b25e','#b5552e'][rows.length],skin:SWATCH.skin[[1,4,0,2][rows.length]],shirt:look==='f'?'#e58a8a':'#4f9c9b',pants:'#3f6d8e',
      beard:look==='m'&&role==='grownup'?'short':'no',name:h})));`,
  pets: `const rows=['dog','cat'].map(type=>['none','patch','spots','socks','stripes'].map((marks,i)=>({kind:'pet',type,marks,coat:SWATCH.coat[i],ears:i%2?'pointy':'floppy',collar:SWATCH.cloth[i],name:type+' '+marks})));`,
  loveys: `const rows=['bear','bunny','elephant'].map((type,r)=>[{patch:'none',bow:'none',eyes:'buttons'},{patch:'#f0c055',bow:'#8d86c6',eyes:'buttons'},{patch:'#4f9c9b',bow:'#e58a8a',eyes:'one stitched'}]
      .map(o=>({kind:'lovey',type,fur:SWATCH.lovey[r],name:type,...o})));`,
};
const drawGallery = (name) => `(()=>{ const name=${JSON.stringify(name)}; ${GALLERY[name]}
  const cols=Math.max(...rows.map(r=>r.length)), cw=name==='pets'?250:170, rh=name==='hair'?330:260, k=name==='loveys'?1.4:1; let svg='';
  rows.forEach((row,r)=>row.forEach((m,i)=>{ const x=130+i*cw, y=(name==='hair'?290:230)+r*rh;
    svg+='<g transform="translate('+x+' '+y+') scale('+k+') translate('+(-x)+' '+(-y)+')">'+P[m.kind](x,y,m)+'</g>';
    svg+='<text x="'+x+'" y="'+(y+34)+'" text-anchor="middle" font-size="22" fill="#1d1a17">'+esc(m.name)+'</text>'; }));
  /* its own picture over the reader, so the reader's layout code cannot move or crop it */
  const box=document.createElement('div'); box.style.cssText='position:fixed;inset:0;z-index:99;background:#cfe3d6';
  box.innerHTML='<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 '+(cols*cw+80)+' '+(rows.length*rh+60)+'">'+recolor(svg)+'</svg>';
  document.body.appendChild(box); })()`;

const browser = await launch();
const failed = [];
try {
  for (const target of targets) {
    const page = await openPage(browser, { width: W, height: H, preload: preload(target !== 'hello') });
    await page.goto(url); await wait(600);
    const snap = async (name) => { const f = join(out, name.replace(/[^\w.+-]+/g, '_') + '.png'); writeFileSync(f, await page.screenshot()); console.log(f); };
    if (target === 'shelf' || target === 'hello') await snap(target);
    else if (target.startsWith('family')) {
      const slot = target.split(':')[1];
      await page.evaluate(`document.getElementById('famBtn').click()`);
      if (slot) await page.evaluate(`document.querySelector('[data-slot="${slot}"]').click()`);
      await wait(200); await snap(target);
    } else if (target.startsWith('cast:')) {
      const name = target.slice(5); if (!GALLERY[name]) throw new Error(`no gallery "${name}" (hair, pets, loveys)`);
      await page.resize(1500, name === 'hair' ? 1400 : 900); await page.evaluate(drawGallery(name)); await wait(300); await snap(target);
    } else {
      const [bookEnd, pageSpec] = target.split('/'), open = pageSpec?.endsWith('+open'), pageId = pageSpec?.replace('+open', '');
      const ids = await page.evaluate(`(()=>{ const b=LIB.find(b=>b.id.endsWith(${JSON.stringify(bookEnd)})); if(!b) return null; BOOK=b; return Object.keys(b.pages); })()`);
      if (!ids) throw new Error(`no book whose id ends with "${bookEnd}"`);
      for (const id of pageId === '*' ? ids : [pageId || ids[0]]) {
        if (!ids.includes(id)) throw new Error(`"${bookEnd}" has no page "${id}" (${ids.join(', ')})`);
        await page.evaluate(`(()=>{ AGESET=${age}; AUTO=false; history=[]; show(${JSON.stringify(id)}); })()`); await wait(500);
        if (open) { await page.evaluate(`(()=>{ ${TAP} document.querySelectorAll('.flapG, [data-hide] .tap').forEach(tap); })()`); await wait(900); }
        await snap(`${bookEnd}-${id}${open ? '+open' : ''}`);
      }
    }
    if (page.errors.length) failed.push(`${target}: ${page.errors.join(' | ')}`);
    await page.close();
  }
} finally { await browser.close(); }
if (failed.length) { console.error('the page threw:\n' + failed.join('\n')); process.exit(1); }
