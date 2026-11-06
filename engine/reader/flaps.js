/* ---- lift-the-flap: a flap covers a hiding animal; tap to lift it, tap again to close ---- */
const FLAP={
  door:{axis:'x',icon:'🚪',front:(w,h)=>`<rect width="${w}" height="${h}" fill="#b8402b" stroke="#f4ead2" stroke-width="12"/><rect width="${w}" height="${h}" fill="none" ${L(6,OUT)}/>
      <path d="M8 8 L${w-8} ${h-8} M${w-8} 8 L8 ${h-8}" stroke="#f4ead2" stroke-width="10"/><circle cx="${w-24}" cy="${h/2}" r="9" fill="#e2b860" ${L(4,OUT)}/>`,
    back:(w,h)=>`<rect width="${w}" height="${h}" fill="#7e2f22" ${L(6,OUT)}/><path d="M0 ${h*.33} H${w} M0 ${h*.66} H${w}" ${L(4,'#5e2318')}/>`},
  bush:{axis:'y',icon:'🌳',front:(w,h)=>`<path d="M0 ${h} V${h*.45} q0 -${h*.45} ${w*.22} -${h*.4} q${w*.08} -${h*.12} ${w*.28} -${h*.05} q${w*.2} -${h*.1} ${w*.3} ${h*.05} q${w*.22} 0 ${w*.2} ${h*.4} V${h} Z" fill="#5f8048" ${L(6,OUT)}/>
      <path d="M${w*.15} ${h*.5} q${w*.1} -${h*.12} ${w*.2} 0 M${w*.5} ${h*.35} q${w*.1} -${h*.12} ${w*.2} 0 M${w*.3} ${h*.75} q${w*.1} -${h*.12} ${w*.2} 0 M${w*.65} ${h*.68} q${w*.1} -${h*.12} ${w*.2} 0" fill="none" ${L(5,'#86a85c')}/>
      <circle cx="${w*.3}" cy="${h*.45}" r="9" fill="#e58a8a" ${L(3,OUT)}/><circle cx="${w*.72}" cy="${h*.55}" r="9" fill="#f0c055" ${L(3,OUT)}/><rect y="${h*.6}" width="${w}" height="${h*.4}" fill="url(#dots)" opacity=".5"/>`,
    back:(w,h)=>`<path d="M0 ${h} V${h*.45} q0 -${h*.45} ${w*.5} -${h*.45} q${w*.5} 0 ${w*.5} ${h*.45} V${h} Z" fill="#3f6b36" ${L(6,OUT)}/>`},
  blanket:{axis:'y',icon:'🛏️',front:(w,h)=>`<path d="M0 0 H${w} V${h-20} q-${w/8} 22 -${w/4} 0 q-${w/8} 22 -${w/4} 0 q-${w/8} 22 -${w/4} 0 q-${w/8} 22 -${w/4} 0 Z" fill="url(#gingham)" ${L(6,OUT)}/>
      <path d="M0 18 H${w}" ${L(5,'#c4462f')}/>`,
    back:(w,h)=>`<path d="M0 0 H${w} V${h-20} q-${w/2} 30 -${w} 0 Z" fill="#f6edd6" ${L(6,OUT)}/>`},
  box:{axis:'y',icon:'📦',front:(w,h)=>`<rect width="${w}" height="${h}" rx="6" fill="#c99a5e" ${L(6,OUT)}/><rect x="${w/2-18}" width="36" height="${h}" fill="#e3c38f" ${L(3,OUT)}/>
      <path d="M12 ${h*.6} h${w*.25} M${w*.65} ${h*.75} h${w*.25}" ${L(4,'#9a7444')}/><text x="${w*.25}" y="${h*.45}" font-family="Bangers,sans-serif" font-size="${h*.22}" fill="#7a5530">?</text>`,
    back:(w,h)=>`<rect width="${w}" height="${h}" rx="6" fill="#9a7444" ${L(6,OUT)}/>`},
  hay:{axis:'y',icon:'🌾',front:(w,h)=>`<rect width="${w}" height="${h}" rx="18" fill="#e2b860" ${L(6,OUT)}/><rect width="${w}" height="${h*.3}" rx="16" fill="#ecca7c"/>
      ${[.2,.4,.6,.8].map(f=>`<path d="M${w*f} 10 v${h-20}" stroke="#c99a3e" stroke-width="4"/>`).join('')}<path d="M${w*.3} 0 v${h} M${w*.7} 0 v${h}" ${L(7,'#8a5e3c')}/>`,
    back:(w,h)=>`<rect width="${w}" height="${h}" rx="18" fill="#c99a3e" ${L(6,OUT)}/>`},
  reeds:{axis:'y',icon:'🌿',front:(w,h)=>Array.from({length:9},(_,i)=>{ const x=w*(i+.5)/9; return `<path d="M${x} ${h} q${i%2?14:-14} -${h*.5} ${i%2?-6:6} -${h*(.75+(i%3)*.08)}" fill="none" ${L(16,OUT)}/><path d="M${x} ${h} q${i%2?14:-14} -${h*.5} ${i%2?-6:6} -${h*(.75+(i%3)*.08)}" fill="none" ${L(9,'#7f9e4f')}/>`+(i%3===1?`<rect x="${x-8}" y="${h*.12}" width="16" height="44" rx="8" fill="#8a5e3c" ${L(4,OUT)}/>`:''); }).join(''),
    back:(w,h)=>`<rect y="${h*.3}" width="${w}" height="${h*.7}" rx="20" fill="#5f8048" ${L(6,OUT)}/>`},
};
let flapState={};
function flapPiece(f,i,x,y,k){ const T=FLAP[f.type], w=f.w*k, h=f.h*k, x0=x-w/2, y0=y-h;
  return `<g class="tap flapG" data-f="${i}" data-axis="${T.axis}" data-hx="${x0}" data-hy="${y0}"><g class="fl"><g class="ff" transform="translate(${x0} ${y0})"><rect width="${w}" height="${h}" fill="transparent"/>${T.front(w,h)}</g><g class="fb" transform="translate(${x0} ${y0})" style="display:none">${T.back(w,h)}</g></g></g>`; }
function flipFlap(g){ const i=+g.dataset.f, open=!flapState[i]; flapState[i]=open; const fl=g.querySelector('.fl'), ff=g.querySelector('.ff'), fb=g.querySelector('.fb');
  const ax=g.dataset.axis, hx=+g.dataset.hx, hy=+g.dataset.hy, from=open?1:-.5, to=open?-.5:1;
  tween(420,k=>{ const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2, v=from+(to-from)*e; ff.style.display=v>0?'':'none'; fb.style.display=v>0?'none':'';
    fl.setAttribute('transform', ax==='x'?`translate(${hx} 0) scale(${v.toFixed(3)} 1) translate(${-hx} 0)`:`translate(0 ${hy}) scale(1 ${v.toFixed(3)}) translate(0 ${-hy})`); });
  noise(.18,{f:1800,q:.8,vol:.07}); world.querySelectorAll(`[data-flap="${i}"]`).forEach(n=>n.style.pointerEvents=open?'':'none');
  if(open){ const f=BOOK.pages[cur].flaps[i], who=[].concat(f.hide||[])[0]?.who; const hid=world.querySelector(`[data-flap="${i}"]`);
    const m=g.getBBox(); later(()=>{ burst(m.x+m.width/2, m.y-40, f.peek||'PEEKABOO!','#f6c84c','#d0452f',56); if(who&&SOUND[who]) SOUND[who]();
      if(hid){ const t=hid.querySelector('.tap'); const an=t&&t.querySelector('.anim'); animate(an,'boing',900); if(f.say) later(()=>bubble(m.x+m.width*.6,m.y+m.height*.3,f.say),500); } },380);
    const sp=$('hunt').querySelector(`[data-fl="${i}"]`); if(sp) sp.classList.add('got');
    if(Object.values(flapState).filter(Boolean).length===BOOK.pages[cur].flaps.length && BOOK.pages[cur].flaps.length>1) later(()=>sfx.fanfare(),1200); }
}

