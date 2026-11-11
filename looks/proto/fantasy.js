/* Look prototype: fantasy. Run in the reader before a shot (node engine/shots.mjs ... --eval looks/proto/fantasy.js).
   A sketch for the spec, not the engine: it swaps pieces in place and recolors, so every page, tap and flap still works.
   The castle keeps the barn's footprint and door, so the barn-door flap still lines up. */
(()=>{
  const COLORS={'#6fa79f':'#9c93c9','#9dbba6':'#b7aed6','#a9bf74':'#9fbf86','#8fae5a':'#8fb27a','#7f9e4f':'#7ea36c','#6b8a45':'#6a8f5c'};
  const look=s=>s.replace(/#[0-9a-fA-F]{6}/g,m=>COLORS[m.toLowerCase()]||m);
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
  const art0=art; art=(p,s)=>look(art0(p,s));
  document.documentElement.style.setProperty('--display',"'Baloo 2',serif");
})();
