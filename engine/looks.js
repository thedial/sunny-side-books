/* Looks: a family picks one on the family screen. A look redraws kit pieces (same footprint, door and perches as the
   piece it replaces) and dresses the cast over their clothes; face, skin and hair stay so a kid still knows who is who.
   make() patches P and SCENE in place and returns scene colors to swap; applyLook() puts the default back first. */
/* a costume goes inside the piece's <g class="anim"> so it moves and scales with the wearer */
const dress=(fn,behind,front)=>(x,y,...a)=>{ const s=fn(x,y,...a), m=/<g class="anim"[^>]*>/.exec(s); if(!m) return s;
  const open=m.index+m[0].length, re=/<g[\s>]|<\/g>/g; re.lastIndex=open; let d=1, t;
  while(d&&(t=re.exec(s))) d+=t[0]==='</g>'?-1:1;
  const close=t?t.index:s.length;
  return s.slice(0,open)+(behind?behind(...a):'')+s.slice(open,close)+(front?front(...a):'')+s.slice(close); };
/* the same drawing in a look's colors: swap(P.hay,{'#e2b860':'#d7e0e0'}) */
const swap=(fn,map)=>(...a)=>{ let t=fn(...a); for(const k in map) t=t.split(k).join(map[k]); return t; };
const LOOKS={
fantasy:{name:'Fantasy',make:()=>{
  const COLORS={'#6fa79f':'#9c93c9','#9dbba6':'#b7aed6','#a9bf74':'#9fbf86','#8fae5a':'#8fb27a','#7f9e4f':'#7ea36c','#6b8a45':'#6a8f5c'};
  const sky0=P.sky;
  P.sky=c=>c==='night'?sky0(c):`<defs><linearGradient id="fanSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c93c9"/><stop offset="1" stop-color="#f1d6c8"/></linearGradient></defs>
    <rect x="-2000" y="-2000" width="5600" height="2700" fill="url(#fanSky)"/>`;
  const stone='#c9c1d6', stoneD='#a79fbd', roof='#6a5aa8', trim='#f4ead2';
  const turret=(tx)=>`<rect x="${tx-40}" y="-330" width="80" height="330" fill="${stone}" ${L(6,OUT)}/>
    <path d="M${tx-52} -326 L${tx} -440 L${tx+52} -326 Z" fill="${roof}" ${L(6,OUT)}/>
    <path d="M${tx} -440 V-478" ${L(4,OUT)}/><path d="M${tx} -478 l40 10 l-40 10 z" fill="#e58a8a" ${L(3,OUT)}/>
    <path d="M${tx-14} -260 v-26 a14 14 0 0 1 28 0 v26 z" fill="#4b3f78" ${L(4,OUT)}/>`;
  P.barn=(x,y)=>{ let blocks=''; for(let r=0;r<5;r++) for(let c=0;c<6;c++) blocks+=`<rect x="${-120+c*48+(r%2?24:0)}" y="${-196+r*40}" width="44" height="36" rx="5" fill="none" stroke="${stoneD}" stroke-width="3"/>`;
    const merlons=Array.from({length:6},(_,i)=>`<rect x="${-118+i*44}" y="-232" width="28" height="36" fill="${stone}" ${L(5,OUT)}/>`).join('');
    return `<g class="tap" data-react="boing" data-say="Castle!" transform="translate(${x} ${y})"><g class="anim">
    ${turret(-150)}${turret(150)}${merlons}
    <path d="M-120 0 V-200 H120 V0 Z" fill="${stone}" ${L(6,OUT)}/><g clip-path="none">${blocks}</g>
    <path d="M-70 0 V-110 A70 52 0 0 1 70 -110 V0 Z" fill="#7a4b8f" stroke="${trim}" stroke-width="9"/>
    <path d="M0 -162 V0" stroke="${trim}" stroke-width="6"/><circle cx="-16" cy="-70" r="6" fill="#f0c055"/><circle cx="16" cy="-70" r="6" fill="#f0c055"/>
    <path d="M-150 -330 V0 M150 -330 V0" stroke="none"/></g></g>`; };
  const tree0=P.tree;
  P.tree=(x,y,s=1)=>tree0(x,y,s).replace(/#5f8048/g,'#9a6fb0').replace(/#6f914e/g,'#b085c4').replace(/#7a9c54/g,'#c29ad3').replace(/#86a85c/g,'#d2aee0').replace(/#a3bf72/g,'#ead0f0')
    .replace(/<\/g><\/g>$/,[[-90,-250],[40,-320],[90,-230],[-30,-200]].map(([a,b])=>`<path d="M${a} ${b-14} l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" fill="#fff3c0"/>`).join('')+'</g></g>');
  const fence0=P.fence;
  P.fence=(x0,x1,y)=>{ let t=`<path d="M${x0-20} ${y} V${y-62} H${x1+20} V${y} Z" fill="${stone}" ${L(5,OUT)}/>`;
    for(let x=x0;x<=x1;x+=60) t+=`<path d="M${x} ${y-62} V${y}" stroke="${stoneD}" stroke-width="3"/>`;
    t+=`<path d="M${x0-20} ${y-31} H${x1+20}" stroke="${stoneD}" stroke-width="3"/>`;
    return `<g class="nohit">${t}</g>`; };
  const sparkles=()=>Array.from({length:9},(_,i)=>{ const x=120+i*170, y=120+(i*97)%300, r=6+(i%3)*3;
    return `<path class="nohit" d="M${x} ${y-r*2} l${r*.5} ${r*1.5} l${r*1.5} ${r*.5} l${-r*1.5} ${r*.5} l${-r*.5} ${r*1.5} l${-r*.5} ${-r*1.5} l${-r*1.5} ${-r*.5} l${r*1.5} ${-r*.5} z" fill="#fff6d8" opacity=".85"/>`; }).join('');
  const yard0=SCENE.yard; SCENE.yard=()=>yard0()+sparkles();
  /* the cast dresses up: face, skin and hair stay, so a kid still knows who is who */
  const gold='#f0c055', robe='#6a5aa8', ermine='#fbf6ea';
  const crown=(m,big)=>{ const r=ROLE[m.role]||ROLE.grownup, top=r.hy-r.hr+6, w=big?34:28;
    return `<path d="M${-w} ${top} l0 -30 l${w/2} 14 l${w/2} -24 l${w/2} 24 l${w/2} -14 l0 30 z" fill="${gold}" ${S(4)}/><circle cx="0" cy="${top-34}" r="5" fill="#e58a8a" ${S(2)}/><circle cy="${top-12}" r="5" fill="#8d86c6"/>`; };
  const cape=m=>{ const {sh,bw}=ROLE[m.role]||ROLE.grownup, long=m.role==='grownup', end=long?-8:-30, fl=long?40:26, c=m.role==='grownup'?robe:'#d9826f';
    return `<path d="M${-bw+4} ${sh+4} Q${-bw-fl} ${(sh+end)/2} ${-bw-fl} ${end} L${bw+fl} ${end} Q${bw+fl} ${(sh+end)/2} ${bw-4} ${sh+4} Z" fill="${c}" ${S(5)}/>`; };
  const front=m=>{ const {sh,wa,bw}=ROLE[m.role]||ROLE.grownup;
    let s=`<path d="M${-bw+2} ${sh+8} q${bw-2} 22 ${2*bw-4} 0" fill="none" ${L(14,OUT)}/><path d="M${-bw+2} ${sh+8} q${bw-2} 22 ${2*bw-4} 0" fill="none" ${L(9,m.role==='grownup'?ermine:gold)}/>`;
    s+=`<path d="M${-bw+4} ${wa-12} H${bw-4}" ${L(12,OUT)}/><path d="M${-bw+4} ${wa-12} H${bw-4}" ${L(7,gold)}/>`;
    s+=`<path d="M0 ${(sh+wa)/2-14} l5 10 l11 2 l-8 8 l2 11 l-10 -5 l-10 5 l2 -11 l-8 -8 l11 -2 z" fill="${gold}" ${S(3)}/>`;
    if(m.role==='kid'){ const hx=bw+10, hy=sh+16+(wa-sh)*.75; s+=`<path d="M${hx} ${hy} l28 -70" ${L(7,OUT)}/><path d="M${hx+28} ${hy-90} l6 14 l15 2 l-11 10 l3 15 l-13 -7 l-13 7 l3 -15 l-11 -10 l15 -2 z" fill="#fff3c0" ${S(3.5)}/>`; }
    return s+crown(m,m.role==='grownup'); };
  P.person=dress(P.person,(m={})=>cape(m),(m={})=>front(m));
  const wing=(x,y,c,d=1)=>`<path d="M${x} ${y} q${d*-20} -60 ${d*-70} -66 q${d*16} 20 ${d*6} 34 q${d*24} -6 ${d*30} 14 q${d*14} -2 ${d*34} 18 z" fill="${c}" ${S(4)}/>`;
  P.pet=dress(P.pet,(m={})=>wing(-6,-84,'#9c93c9'),(m={})=>{ const cat=m.type==='cat', hx=cat?46:58, hy=cat?-96:-112;
    return `<path d="M${hx-4} ${hy-34} l6 -30 l8 30 z" fill="${gold}" ${S(3.5)}/>`; });
  P.cow=dress(P.cow,()=>`<path d="M-128 -64 q-26 -6 -30 22 q14 -10 24 0 q-2 -14 10 -16" fill="#b7aed6" ${S(4)}/>`,
    ()=>`<path d="M98 -200 L112 -268 L124 -200 Z" fill="${gold}" ${S(4)}/><path d="M102 -214 l18 -6 M106 -234 l14 -5 M110 -252 l8 -3" ${L(3,OUT)}/>`
      +`<path d="M64 -186 q-14 -20 0 -40 q4 22 18 28 z" fill="#e9b5c0" ${S(3.5)}/>`);
  P.pig=dress(P.pig,()=>`<g opacity=".9"><ellipse cx="-24" cy="-140" rx="34" ry="52" fill="#d9ecf5" transform="rotate(-30 -24 -140)" ${S(4)}/><ellipse cx="18" cy="-146" rx="30" ry="48" fill="#ead0f0" transform="rotate(18 18 -146)" ${S(4)}/></g>`);
  P.hen=dress(P.hen,()=>`<path d="M-48 -78 q-70 -40 -60 -110 q20 40 44 50 q-20 -50 4 -86 q10 50 34 74 z" fill="#d9826f" ${S(4)}/><path d="M-60 -100 q-24 -40 -20 -70" fill="none" ${L(5,'#f0c055')}/>`,
    ()=>`<path d="M26 -124 l0 -22 l8 10 l8 -14 l8 14 l8 -10 l0 22 z" fill="${gold}" ${S(3)}/>`);

  /* rooms: the barn inside is a castle hall, the night barn a castle with one window lit */
  P.barnInside=()=>{ let t=`<rect x="-2000" y="-2000" width="5600" height="2720" fill="#b7aed6"/>`;
    for(let r=0;r<14;r++) for(let c=-3;c<17;c++) t+=`<rect x="${c*120+(r%2?60:0)}" y="${-100+r*60}" width="112" height="52" rx="8" fill="none" stroke="#9c93c9" stroke-width="4"/>`;
    t+=`<path d="M-2000 330 H3600" ${L(26,'#6a5aa8')}/><path d="M-2000 318 H3600" stroke="${gold}" stroke-width="5"/>
      <path d="M1120 550 V450 A110 110 0 0 1 1340 450 V550 Z" fill="#d9ecf5" stroke="${trim}" stroke-width="12"/><path d="M1230 340 V550 M1120 465 H1340" stroke="${trim}" stroke-width="8"/>
      <path d="M1120 550 L900 1000 H1700 L1340 550 Z" fill="#fff3c0" opacity=".25"/>
      ${[300,820].map(bx=>`<path d="M${bx-60} 344 h120 v230 l-60 -42 l-60 42 z" fill="#d9826f" ${L(6,OUT)}/><path d="M${bx} 420 l8 16 l17 3 l-12 12 l3 17 l-16 -8 l-16 8 l3 -17 l-12 -12 l17 -3 z" fill="${gold}" ${S(3)}/>`).join('')}
      <path d="M-2000 720 H3600 V4000 H-2000 Z" fill="#e8d3a8"/>`;
    for(let c=-2;c<16;c++) t+=`<path d="M${c*130} 720 L${c*130-60+(c%2)*20} 1100" stroke="#d3b98a" stroke-width="4"/>`;
    t+=`<path d="M-2000 840 H3600 M-2000 980 H3600" stroke="#d3b98a" stroke-width="4"/><ellipse cx="700" cy="900" rx="520" ry="80" fill="#8d86c6" ${L(6,OUT)}/><ellipse cx="700" cy="900" rx="480" ry="62" fill="none" stroke="${gold}" stroke-width="6"/>`;
    return t; };
  P.barnNight=(x,y)=>{ const tw=tx=>`<rect x="${tx-40}" y="-330" width="80" height="330" fill="#3d3560"/><path d="M${tx-52} -326 L${tx} -440 L${tx+52} -326 Z" fill="#2a2546"/>`;
    return `<g transform="translate(${x} ${y})">${tw(-150)}${tw(150)}${Array.from({length:6},(_,i)=>`<rect x="${-118+i*44}" y="-232" width="28" height="36" fill="#3d3560"/>`).join('')}
    <path d="M-120 0 V-200 H120 V0 Z" fill="#3d3560"/><path d="M-164 -290 v-26 a14 14 0 0 1 28 0 v26 z" fill="#f2c35a"/><path d="M-164 -290 v-26 a14 14 0 0 1 28 0 v26 z" fill="#fff3c0" opacity=".4" class="blink"/>
    <path d="M-70 0 V-110 A70 52 0 0 1 70 -110 V0 Z" fill="#2a2546"/></g>`; };
  const hay0=P.hay, hayC={'#8a5e3c':'#6a5aa8'}; P.hay=swap(hay0,hayC);
  /* flaps: same size and hinge as the farm's, drawn for the castle */
  const arch=(w,h)=>`M0 ${h} V${w/2} A${w/2} ${w/2} 0 0 1 ${w} ${w/2} V${h} Z`;
  FLAP.door={...FLAP.door,front:(w,h)=>`<path d="${arch(w,h)}" fill="#7a4b8f" stroke="${trim}" stroke-width="10"/><path d="${arch(w,h)}" fill="none" ${L(6,OUT)}/>
      ${[.33,.66].map(f=>`<path d="M${w*f} ${w*.12} V${h-6}" stroke="#5f3a75" stroke-width="6"/>`).join('')}<path d="M8 ${h*.4} H${w-8} M8 ${h*.78} H${w-8}" ${L(9,gold)}/>
      <circle cx="${w-26}" cy="${h*.6}" r="11" fill="none" ${L(6,gold)}/>`,
    back:(w,h)=>`<path d="${arch(w,h)}" fill="#4b3f78" ${L(6,OUT)}/><path d="M0 ${h*.4} H${w} M0 ${h*.78} H${w}" ${L(4,'#3a2f60')}/>`};
  const sparkle=(x,y,r=8)=>`<path d="M${x} ${y-r*2} l${r*.5} ${r*1.5} l${r*1.5} ${r*.5} l${-r*1.5} ${r*.5} l${-r*.5} ${r*1.5} l${-r*.5} ${-r*1.5} l${-r*1.5} ${-r*.5} l${r*1.5} ${-r*.5} z" fill="#fff3c0" ${S(2)}/>`;
  const bush0=FLAP.bush;
  FLAP.bush={...bush0,front:(w,h)=>swap(bush0.front,{'#5f8048':'#9a6fb0','#86a85c':'#d2aee0'})(w,h)+sparkle(w*.2,h*.3)+sparkle(w*.82,h*.25,6),back:swap(bush0.back,{'#3f6b36':'#6a4f86'})};
  const wave=(w,h)=>`M0 0 H${w} V${h-20} q-${w/8} 22 -${w/4} 0 q-${w/8} 22 -${w/4} 0 q-${w/8} 22 -${w/4} 0 q-${w/8} 22 -${w/4} 0 Z`;
  FLAP.blanket={...FLAP.blanket,front:(w,h)=>`<path d="${wave(w,h)}" fill="#6a5aa8" ${L(6,OUT)}/><path d="M0 18 H${w}" ${L(7,gold)}/>`
      +Array.from({length:7},(_,i)=>sparkle(w*(i>3?.25+(i-4)*.25:.12+i*.253),h*(i>3?.72:.42),7)).join('')};
  FLAP.box={...FLAP.box,front:(w,h)=>`<rect width="${w}" height="${h}" rx="10" fill="#8a5e3c" ${L(6,OUT)}/><path d="M0 ${h*.32} H${w}" ${L(6,OUT)}/>
      ${[.16,.84].map(f=>`<rect x="${w*f-9}" width="18" height="${h}" fill="${gold}" ${L(3,OUT)}/>`).join('')}
      <rect x="${w/2-22}" y="${h*.22}" width="44" height="48" rx="8" fill="${gold}" ${L(4,OUT)}/><text x="${w/2}" y="${h*.22+38}" text-anchor="middle" font-family="Bangers,sans-serif" font-size="34" fill="#7a5530">?</text>`,
    back:(w,h)=>`<rect width="${w}" height="${h}" rx="10" fill="#5e3f28" ${L(6,OUT)}/>`};
  const hayF=FLAP.hay; FLAP.hay={...hayF,front:swap(hayF.front,hayC)};
  const reeds0=FLAP.reeds; FLAP.reeds={...reeds0,front:(w,h)=>swap(reeds0.front,{'#7f9e4f':'#9c93c9','#8a5e3c':gold})(w,h),back:swap(reeds0.back,{'#5f8048':'#6a4f86'})};
  return COLORS;
}},
robots:{name:'Robots',make:()=>{
  const COLORS={'#9dbba6':'#a9c3c8','#a9bf74':'#9db98a','#8fae5a':'#8aae7a','#7f9e4f':'#7a9e6c','#6b8a45':'#66895c'};
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

  /* rooms: the barn inside is the workshop floor, the night barn the workshop with its lights on */
  P.barnInside=()=>{ let t=`<rect x="-2000" y="-2000" width="5600" height="2720" fill="${steel}"/>`;
    for(let px=-320;px<2000;px+=160) t+=`<path d="M${px} -100 V720" stroke="${steelD}" stroke-width="5"/>`+rivet(px+14,360)+rivet(px+14,690);
    t+=`<path d="M-2000 330 H3600" ${L(26,'#5f7378')}/><path d="M300 -100 V720 M1300 -100 V720" ${L(30,'#5f7378')}/>${[400,520,640].map(v=>rivet(300,v)+rivet(1300,v)).join('')}
      <circle cx="1230" cy="465" r="100" fill="#a9cbb6" stroke="${trim}" stroke-width="14"/><path d="M1230 365 V565 M1130 465 H1330" stroke="${trim}" stroke-width="6"/>
      ${Array.from({length:8},(_,i)=>rivet(1230+112*Math.cos(i*Math.PI/4),465+112*Math.sin(i*Math.PI/4))).join('')}
      <path d="M1150 530 L900 1000 H1700 L1310 530 Z" fill="#f6e3a8" opacity=".25"/>
      <g transform="translate(760 210)">${gear(56,10,'#f0c055')}<circle r="18" fill="${OUT}"/></g>
      <path d="M-2000 600 H560 q30 0 30 -30 V330" fill="none" ${L(22,OUT)}/><path d="M-2000 600 H560 q30 0 30 -30 V330" fill="none" ${L(14,'#e58a8a')}/>
      <path d="M-2000 720 H3600 V4000 H-2000 Z" fill="#c9cfc8"/>`;
    for(let i=0;i<70;i++){ const dx=(i%14)*130-200+((i/14|0)%2)*65, dy=760+(i/14|0)*70; t+=`<path d="M${dx} ${dy} l22 -10 M${dx+40} ${dy} l22 10" stroke="#aab2ab" stroke-width="5" stroke-linecap="round"/>`; }
    return t; };
  P.barnNight=(x,y)=>`<g transform="translate(${x} ${y})"><path d="M0 -300 V-380" stroke="#2a3533" stroke-width="6"/><circle cy="-388" r="14" fill="#e58a8a"/><circle cy="-388" r="14" fill="#fff3c0" opacity=".5" class="blink"/>
    <path d="M-176 -196 L-176 -250 Q0 -330 176 -250 L176 -196 Z" fill="#2a3533"/><path d="M-160 0 V-200 H160 V0 Z" fill="#3e5257"/>
    <rect x="-120" y="-182" width="56" height="36" fill="#f2c35a"/><rect x="64" y="-182" width="56" height="36" fill="#f2c35a"/><rect x="64" y="-182" width="56" height="36" fill="#fff3c0" opacity=".4" class="blink"/>
    <rect x="-70" y="-150" width="140" height="150" fill="#2f3d40"/></g>`;
  const hayC={'#e2b860':'#b8c4c6','#ecca7c':'#d7e0e0','#c99a3e':'#8a9fa4','#8a5e3c':'#4f7fa0'}; P.hay=swap(P.hay,hayC);
  /* flaps: same size and hinge as the farm's, drawn for the workshop */
  FLAP.door={...FLAP.door,front:(w,h)=>`<rect width="${w}" height="${h}" fill="#8a9fa4" stroke="${trim}" stroke-width="10"/><rect width="${w}" height="${h}" fill="none" ${L(6,OUT)}/>
      ${Array.from({length:Math.floor((h-24)/18)},(_,i)=>`<path d="M10 ${20+i*18} H${w-10}" stroke="#5f7378" stroke-width="4"/>`).join('')}<rect x="${w/2-26}" y="${h-30}" width="52" height="12" rx="6" fill="#f0c055" ${L(3,OUT)}/>`,
    back:(w,h)=>`<rect width="${w}" height="${h}" fill="#5f7378" ${L(6,OUT)}/>`};
  const bush0=FLAP.bush;
  FLAP.bush={...bush0,front:(w,h)=>swap(bush0.front,{'#5f8048':'#5f9e8a','#86a85c':'#9cc6a3'})(w,h)+`<rect y="${h*.78}" width="${w}" height="${h*.22}" rx="6" fill="${steel}" ${L(5,OUT)}/>`+rivet(w*.1,h*.89)+rivet(w*.9,h*.89),
    back:swap(bush0.back,{'#3f6b36':'#3f6b5e'})};
  const wave=(w,h)=>`M0 0 H${w} V${h-20} q-${w/8} 22 -${w/4} 0 q-${w/8} 22 -${w/4} 0 q-${w/8} 22 -${w/4} 0 q-${w/8} 22 -${w/4} 0 Z`;
  const nut=(x,y)=>`<path d="M${x-10} ${y} l5 -9 h10 l5 9 l-5 9 h-10 z" fill="#d7e0e0" ${S(2.5)}/><circle cx="${x}" cy="${y}" r="3.5" fill="#7fa7c9"/>`;
  FLAP.blanket={...FLAP.blanket,front:(w,h)=>`<path d="${wave(w,h)}" fill="#7fa7c9" ${L(6,OUT)}/><path d="M0 18 H${w}" ${L(7,'#d7e0e0')}/>`
      +Array.from({length:7},(_,i)=>nut(w*(i>3?.25+(i-4)*.25:.12+i*.253),h*(i>3?.72:.42))).join('')};
  FLAP.box={...FLAP.box,front:(w,h)=>`<rect width="${w}" height="${h}" rx="6" fill="${steel}" ${L(6,OUT)}/><rect x="12" y="12" width="${w-24}" height="${h-24}" rx="4" fill="none" stroke="${steelD}" stroke-width="5"/>
      ${[[18,18],[w-18,18],[18,h-18],[w-18,h-18]].map(([a,b])=>rivet(a,b)).join('')}<text x="${w/2}" y="${h*.66}" text-anchor="middle" font-family="Bangers,sans-serif" font-size="${h*.4}" fill="#f0c055" ${L(3,OUT)}>?</text>`,
    back:(w,h)=>`<rect width="${w}" height="${h}" rx="6" fill="#5f7378" ${L(6,OUT)}/>`};
  const hayF=FLAP.hay; FLAP.hay={...hayF,front:swap(hayF.front,hayC),back:swap(hayF.back,hayC)};
  const reeds0=FLAP.reeds; FLAP.reeds={...reeds0,front:(w,h)=>swap(reeds0.front,{'#7f9e4f':'#8a9fa4','#8a5e3c':'#e58a8a'})(w,h),back:swap(reeds0.back,{'#5f8048':'#5f7378'})};
  return COLORS;
}},
};
