/* Look prototype: robots. Run in the reader before a shot (node engine/shots.mjs ... --eval looks/proto/robots.js).
   A sketch for the spec, not the engine: it swaps pieces in place and recolors, so every page, tap and flap still works.
   The workshop keeps the barn's footprint and door, so the barn-door flap still lines up. */
(()=>{
  const COLORS={'#9dbba6':'#a9c3c8','#a9bf74':'#9db98a','#8fae5a':'#8aae7a','#7f9e4f':'#7a9e6c','#6b8a45':'#66895c'};
  const look=s=>s.replace(/#[0-9a-fA-F]{6}/g,m=>COLORS[m.toLowerCase()]||m);
  const sky0=P.sky;
  P.sky=c=>c==='night'?sky0(c):`<defs><linearGradient id="botSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f98a6"/><stop offset="1" stop-color="#d6e4dc"/></linearGradient>
    <pattern id="botGrid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0 H0 V80" fill="none" stroke="#f4ead2" stroke-width="2" opacity=".18"/></pattern></defs>
    <rect x="-2000" y="-2000" width="5600" height="2700" fill="url(#botSky)"/><rect x="-2000" y="-2000" width="5600" height="2700" fill="url(#botGrid)"/>`;
  const steel='#9fb0b4', steelD='#7d8f94', trim='#f4ead2', rivet=(x,y)=>`<circle cx="${x}" cy="${y}" r="5" fill="#d7e0e0" ${L(2,OUT)}/>`;
  const gear=(r,teeth,fill)=>Array.from({length:teeth},(_,i)=>`<rect x="-9" y="${-r-16}" width="18" height="22" rx="3" fill="${fill}" ${L(4,OUT)} transform="rotate(${i*360/teeth})"/>`).join('')+`<circle r="${r}" fill="${fill}" ${L(5,OUT)}/>`;
  P.barn=(x,y)=>{ let panels='', rivets=''; for(let px=-160;px<=160;px+=80){ panels+=`<path d="M${px} -200 V0" stroke="${steelD}" stroke-width="4"/>`; rivets+=rivet(px+8,-188)+rivet(px+8,-12); }
    let slats=''; for(let sy=-140;sy<0;sy+=18) slats+=`<path d="M-70 ${sy} H70" stroke="#5f7378" stroke-width="4"/>`;
    return `<g class="tap" data-react="boing" data-say="Workshop!" transform="translate(${x} ${y})"><g class="anim">
    <path d="M0 -300 V-380" ${L(6,OUT)}/><circle cy="-388" r="14" fill="#e58a8a" ${L(4,OUT)}/>
    <path d="M-176 -196 L-176 -250 Q0 -330 176 -250 L176 -196 Z" fill="#5f7378" ${L(6,OUT)}/>
    <path d="M-160 0 V-200 H160 V0 Z" fill="${steel}" ${L(6,OUT)}/>${panels}${rivets}
    <g transform="translate(0 -250)">${gear(30,8,'#f0c055')}<circle r="10" fill="${OUT}"/></g>
    <rect x="-70" y="-150" width="140" height="150" fill="#8a9fa4" stroke="${trim}" stroke-width="9"/>${slats}
    <rect x="-20" y="-24" width="40" height="10" rx="5" fill="${OUT}"/></g></g>`; };
  P.tree=(x,y,s=1)=>`<g class="tap" data-react="shake" transform="translate(${x} ${y}) scale(${s})"><g class="anim">
    <rect x="-16" y="-200" width="32" height="200" fill="${steel}" ${L(5,OUT)}/>${rivet(0,-170)}${rivet(0,-100)}${rivet(0,-30)}
    <path d="M0 -150 L-70 -200 M0 -120 L70 -170" ${L(10,OUT)}/><path d="M0 -150 L-70 -200 M0 -120 L70 -170" stroke="${steel}" stroke-width="5"/>
    ${[[-90,-230,70],[80,-240,76],[-5,-320,86]].map(([a,b,r])=>`<g transform="translate(${a} ${b})">${gear(r,10,'#7fae8a')}<circle r="${r*.55}" fill="#9cc6a3"/><circle r="${r*.18}" fill="${OUT}"/></g>`).join('')}</g></g>`;
  P.sun=(x,y)=>`<g class="tap" data-react="spin" data-say="Hello sun!" transform="translate(${x} ${y})"><g class="anim" style="transform-origin:50% 50%">
    ${gear(70,12,'#f2a24e')}<circle r="54" fill="#f6bb6a"/>
    <rect x="-32" y="-22" width="20" height="14" rx="4" fill="#7a3b1e"/><rect x="12" y="-22" width="20" height="14" rx="4" fill="#7a3b1e"/>
    <path d="M-24 12 q24 22 48 0" fill="none" ${L(6,'#7a3b1e')}/><circle cx="-38" cy="10" r="9" fill="#e9874a" opacity=".6"/><circle cx="38" cy="10" r="9" fill="#e9874a" opacity=".6"/></g></g>`;
  P.fence=(x0,x1,y)=>{ let t=`<path d="M${x0} ${y-72} H${x1} M${x0} ${y-34} H${x1}" ${L(14,OUT)}/><path d="M${x0} ${y-72} H${x1} M${x0} ${y-34} H${x1}" stroke="${steel}" stroke-width="8"/>`;
    for(let x=x0;x<=x1;x+=100) t+=`<rect x="${x-10}" y="${y-110}" width="20" height="110" fill="${steel}" ${L(4,OUT)}/>${rivet(x,y-72)}${rivet(x,y-34)}`;
    return `<g class="nohit">${t}</g>`; };
  /* the cast suits up: face, skin and hair stay, so a kid still knows who is who */
  const panel=(w,h,c='#cdd8d9')=>`<rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="10" fill="${c}" ${S(4)}/>`;
  const front=m=>{ const r=ROLE[m.role]||ROLE.grownup, {sh,wa,bw,hy,hr}=r, top=hy-hr+4, cy=(sh+wa)/2+4, w=bw*1.25, h=(wa-sh)*.62;
    let s=`<g transform="translate(0 ${cy})">${panel(w,h)}<circle cx="${-w*.22}" cy="${-h*.18}" r="${Math.min(9,h*.14)}" fill="#e58a8a" ${S(3)}/><circle cx="${w*.05}" cy="${-h*.18}" r="${Math.min(9,h*.14)}" fill="#f0c055" ${S(3)}/>`
      +`<circle cx="${w*.3}" cy="${-h*.18}" r="${Math.min(9,h*.14)}" fill="#7fae8a" ${S(3)}/><path d="M${-w*.3} ${h*.2} h${w*.6}" ${L(6,'#5f7378')}/></g>`;
    s+=[-1,1].map(d=>`<circle cx="${d*(bw-4)}" cy="${sh+10}" r="15" fill="${steel}" ${S(4)}/>`+rivet(d*(bw-4),sh+10)).join('');
    s+=`<path d="M${-hr-4} ${top+20} Q0 ${top-18} ${hr+4} ${top+20}" fill="none" ${L(8,'#5f7378')}/>`+[-1,1].map(d=>`<rect x="${d*(hr+4)-9}" y="${hy-14}" width="18" height="28" rx="6" fill="${steel}" ${S(4)}/>`).join('');
    s+=`<path d="M0 ${top-6} v-34" ${L(4,OUT)}/><circle cy="${top-44}" r="10" fill="${m.role==='grownup'?'#f0c055':'#e58a8a'}" ${S(3)}/>`;
    return s; };
  P.person=dress(P.person,null,(m={})=>front(m));
  P.pet=dress(P.pet,null,(m={})=>{ const cat=m.type==='cat', hx=cat?46:58, hy=cat?-96:-112, bx=cat?-6:-10, by=cat?-54:-62;
    return `<g transform="translate(${bx-14} ${by-4})">${panel(46,30)}${rivet(-14,0)}${rivet(14,0)}</g><path d="M${hx-6} ${hy-34} v-26" ${L(4,OUT)}/><circle cx="${hx-6}" cy="${hy-64}" r="8" fill="#e58a8a" ${S(3)}/>`; });
  P.cow=dress(P.cow,null,()=>`<g transform="translate(-10 -100)">${panel(70,44)}<circle cx="-14" r="10" fill="#f0c055" ${S(3)}/><path d="M6 -8 h18 M6 6 h18" ${L(5,'#5f7378')}/></g>`
    +`<path d="M110 -205 v-34" ${L(4,OUT)}/><circle cx="110" cy="-244" r="9" fill="#e58a8a" ${S(3)}/>`+[[-90,-140],[70,-60],[-90,-60]].map(([a,b])=>rivet(a,b)).join(''));
  P.pig=dress(P.pig,null,()=>`<rect x="-30" y="-130" width="44" height="10" rx="5" fill="${OUT}"/><g transform="translate(-20 -70)">${panel(54,34)}${rivet(-16,0)}${rivet(16,0)}</g>`
    +`<path d="M66 -130 v-24" ${L(4,OUT)}/><circle cx="66" cy="-160" r="8" fill="#f0c055" ${S(3)}/>`);
  P.hen=dress(P.hen,()=>`<g transform="translate(-50 -80) scale(.55)">${gear(30,8,'#9fb0b4')}</g>`,()=>`<path d="M44 -126 v-26" ${L(4,OUT)}/><circle cx="44" cy="-158" r="8" fill="#e58a8a" ${S(3)}/>`
    +`<g transform="translate(-6 -58)">${panel(40,26)}${rivet(-10,0)}${rivet(10,0)}</g>`);
  const art0=art; art=(p,s)=>look(art0(p,s));
})();
