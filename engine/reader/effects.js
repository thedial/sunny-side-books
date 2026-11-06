/* ---- tag every kit piece so taps know what was touched; add sway, breathing and ground shadows ---- */
const INKED=[];
const SWAY=['tree','pine','flower'], BREATHE=['cow','pig','hen','duck','chick','frog','crab','octopus','clam','person','pet','lovey'], SHADOW={person:50,pet:75,lovey:50,crab:80,octopus:80,clam:70,hive:110,cow:110,pig:85,hen:55,duck:70,chick:40,frog:60,barn:180,hay:85,rock:50,potato:55,egg:36,scarecrow:70,bunny:45,tree:120,pine:100};
for(const name of Object.keys(P)){
  const orig=P[name]; if(typeof orig!=='function'||['sky','ground','hills','fence','stars','barnInside','leaf','button'].includes(name)) continue;
  P[name]=(...args)=>{
    const [x,y]=args; let inner=orig(...args);
    if(SWAY.includes(name)) inner=`<g class="sway" style="animation-duration:${(3+Math.random()*2).toFixed(1)}s;animation-delay:-${(Math.random()*3).toFixed(1)}s">${inner}</g>`;
    if(BREATHE.includes(name)) inner=`<g class="breathe" style="animation-delay:-${(Math.random()*3).toFixed(1)}s">${inner}</g>`;
    if(name==='cloud') inner=`<g class="drift" style="animation-delay:-${(Math.random()*10).toFixed(1)}s">${inner}</g>`;
    const sh=SHADOW[name]?`<ellipse class="nohit" cx="${x}" cy="${y+4}" rx="${SHADOW[name]}" ry="${(SHADOW[name]*.16).toFixed(0)}" fill="#2a1d16" opacity=".14"/>`:'';
    const ink=INKED.includes(name)?' filter="url(#ink)"':'';
    /* crosshatch shading: a copy of the drawing filled with hatching, faded in toward the lower right */
    if(ink){ const h=inner.replace(/class="tap[^"]*"/g,'class="nohit"').replace(/ stroke="[^"]*"| stroke-width="[^"]*"/g,'');
      inner=inner.replace(/<\/g><\/g>(?![\s\S]*<\/g><\/g>)/, m=>`<g class="nohit" mask="url(#shade)">${h.replace(/fill="(?!none)[^"]*"/g,'fill="url(#hatch)"').replace(/^[\s\S]*?<g class="anim[^"]*">/,'').replace(/<\/g><\/g>\s*$/,'')}</g><g class="nohit" mask="url(#shade2)">${h.replace(/fill="(?!none)[^"]*"/g,'fill="url(#hatch2)"').replace(/^[\s\S]*?<g class="anim[^"]*">/,'').replace(/<\/g><\/g>\s*$/,'')}</g>`+m); }
    return `<g class="actor" data-who="${name}" data-ax="${x}" data-ay="${y}">${sh}<g${ink}>${inner}</g></g>`;
  };
}
/* sky with a soft glow toward the horizon */

const _sun=P.sun; P.sun=(x,y)=>`<circle class="nohit" cx="${x}" cy="${y}" r="150" fill="#f6e3a8" opacity=".35"/>`+_sun(x,y);

/* ---- little effects, each removes itself ---- */
/* timers for what a tap sets off on this page (a burst, a peekaboo, a fanfare); a turn drops them all (page-states.json: turn-leaves-nothing) */
const tapTimers=new Set();
function later(fn,ms){ const t=setTimeout(()=>{ tapTimers.delete(t); fn(); },ms); tapTimers.add(t); return t; }
function dropLater(){ tapTimers.forEach(clearTimeout); tapTimers.clear(); }
function addFx(html,ms){ const g=document.createElementNS('http://www.w3.org/2000/svg','g'); g.innerHTML=recolor(html); fx.appendChild(g); pace(g); setTimeout(()=>g.remove(),ms*PACE()); }
/* older child, calmer page: one-shot animations run faster (the endless ones, bobbing and blinking, are left alone) */
function pace(node){ const p=PACE(); if(p===1||!node.getAnimations) return; node.getAnimations({subtree:true}).forEach(a=>{ if(a.effect.getTiming().iterations!==Infinity) a.playbackRate=1/p; }); }
const rnd=(a,b)=>a+Math.random()*(b-a);
const tweet=()=>[0,.12,.3].forEach(d=>tone(2600,3400,.07,'sine',.12,d));
const REACT={
  tree:(x,y)=>{ let s=''; for(let k=0;k<3;k++){ const bx=x+rnd(-90,90), by=y-rnd(230,300);
      s+=`<g transform="translate(${bx} ${by})"><g class="fxfly" style="--dx:${rnd(250,500)|0}px;--dy:${-rnd(350,520)|0}px;animation-delay:${k*.15}s">
      <ellipse rx="16" ry="11" fill="#5ab4e0" ${S(4)}/><circle cx="14" cy="-8" r="8" fill="#5ab4e0" ${S(4)}/><path d="M22 -8 l8 3 l-8 3z" fill="#f2a03d"/>
      <path class="flap" d="M-6 -4 q-10 -22 -24 -16 q8 10 24 16" fill="#8fd3f4" ${S(3)}/></g></g>`; }
    for(let k=0;k<4;k++) s+=`<g transform="translate(${x+rnd(-120,120)} ${y-rnd(180,260)})"><path class="fxfloat" style="--dx:${rnd(-80,80)|0}px;--dy:${rnd(180,260)|0}px;--r:${rnd(-200,200)|0}deg" d="M0 0 q12 -14 24 0 q-12 14 -24 0z" fill="#4fae46" ${S(3)}/></g>`;
    addFx(s,2800); },
  pine:(x,y)=>REACT.tree(x,y-40),
  cloud:(x,y)=>{ let s=''; for(let k=0;k<14;k++) s+=`<path class="fxdrop" style="animation-delay:${rnd(0,.9).toFixed(2)}s" d="M${x+rnd(-80,80)} ${y+20} q-6 14 0 20 q6 -6 0 -20z" fill="#5ab4e0"/>`;
    addFx(s,2000); },
  flower:(x,y)=>{ let s=''; const c=['#ff7eb6','#ffd23f','#9b7cff','#ff9a3d'];
    for(let k=0;k<5;k++) s+=`<g transform="translate(${x} ${y-90})"><ellipse class="fxfloat" style="--dx:${rnd(-120,120)|0}px;--dy:${rnd(-140,-40)|0}px;--r:${rnd(-300,300)|0}deg" rx="10" ry="15" fill="${c[k%4]}" ${S(3)}/></g>`;
    addFx(s,2700); },
  pond:(x,y)=>{ let s=`<ellipse class="fxring" cx="${x-40}" cy="${y}" rx="60" ry="18" fill="none" stroke="#fff" stroke-width="6"/>`+
      `<g transform="translate(${x+20} ${y})"><g class="fxjump"><ellipse rx="34" ry="16" fill="#f2a03d" ${S(4)}/><path d="M30 0 l22 -14 v28z" fill="#f2a03d" ${S(4)}/><circle cx="-18" cy="-4" r="4" fill="${OUT}"/></g></g>`;
    addFx(s,1500); },
  barn:(x,y)=>{ addFx(`<g transform="translate(${x} ${y})"><rect x="-70" y="-150" width="140" height="150" fill="#3b2418"/>
      <g class="fxpeek"><circle cx="0" cy="-30" r="34" fill="#a7a3a0" ${S(5)}/><circle cx="-24" cy="-62" r="16" fill="#a7a3a0" ${S(4)}/><circle cx="24" cy="-62" r="16" fill="#a7a3a0" ${S(4)}/>
        <circle cx="-10" cy="-36" r="5" fill="${OUT}"/><circle cx="10" cy="-36" r="5" fill="${OUT}"/><circle cx="0" cy="-22" r="5" fill="#ff8fa6"/></g>
      <g class="doorL"><rect x="-70" y="-150" width="70" height="150" fill="#b8402b" stroke="#f4ead2" stroke-width="9"/><path d="M-70 -150 L0 0 M0 -150 L-70 0" stroke="#f4ead2" stroke-width="7"/></g>
      <g class="doorR"><rect x="0" y="-150" width="70" height="150" fill="#b8402b" stroke="#f4ead2" stroke-width="9"/><path d="M70 -150 L0 0 M0 -150 L70 0" stroke="#f4ead2" stroke-width="7"/></g></g>`,2700);
    later(()=>bubble(x+60,y-200,'Squeak!'),600); },
  hay:(x,y)=>{ addFx(`<g transform="translate(${x+20} ${y-80})"><g class="fxpeek"><circle r="26" fill="#a7a3a0" ${S(4)}/><circle cx="-16" cy="-22" r="11" fill="#a7a3a0" ${S(4)}/><circle cx="16" cy="-22" r="11" fill="#a7a3a0" ${S(4)}/>
      <circle cx="-8" cy="-4" r="4" fill="${OUT}"/><circle cx="8" cy="-4" r="4" fill="${OUT}"/></g></g><rect x="${x-80}" y="${y-90}" width="160" height="90" rx="20" fill="#f0c34f" ${S(6)}/>`,2500);
    later(()=>bubble(x+40,y-150,'Squeak!'),500); },
  hen:(x,y)=>{ let s=''; for(let k=0;k<3;k++) s+=`<g transform="translate(${x} ${y-80})"><path class="fxfloat" style="--dx:${rnd(-100,100)|0}px;--dy:${rnd(-120,-40)|0}px;--r:${rnd(-180,180)|0}deg" d="M0 0 q10 -20 4 -36 q-10 16 -4 36z" fill="#fff" ${S(3)}/></g>`; addFx(s,2700); },
  pig:(x,y)=>{ let s=''; for(let k=0;k<6;k++) s+=`<circle class="fxsplat" style="--dx:${rnd(-120,120)|0}px;--dy:${rnd(-90,10)|0}px" cx="${x}" cy="${y-30}" r="${rnd(8,16)|0}" fill="#7a5133"/>`; addFx(s,1000); },
  duck:(x,y)=>{ let s=''; for(let k=0;k<7;k++) s+=`<circle class="fxsplat" style="--dx:${rnd(-110,110)|0}px;--dy:${rnd(-120,-20)|0}px" cx="${x}" cy="${y-30}" r="${rnd(6,12)|0}" fill="#8fd3f4" stroke="#fff" stroke-width="3"/>`; addFx(s,1000); },

};
function sparkle(x,y){ addFx(`<g transform="translate(${x} ${y})"><path class="fxspark" d="M0 -26 L7 -7 L26 0 L7 7 L0 26 L-7 7 L-26 0 L-7 -7Z" fill="#ffd23f" ${S(4)}/></g>`,800); }
function toWorld(e){ const st=$('stage'); const pt=st.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const m=fx.getScreenCTM(); return m?pt.matrixTransform(m.inverse()):{x:800,y:500}; }

