/*KIT*/

/* ---- extra pieces for the farm books ---- */
Object.assign(P,{
  nest:(x,y,s=1)=>`<g class="nohit" transform="translate(${x} ${y}) scale(${s})"><path d="M-90 -10 q90 50 180 0 q-10 -40 -90 -40 q-80 0 -90 40z" fill="#c8962a" ${S(6)}/>
    <path d="M-70 -20 q40 20 60 0 M-10 -14 q40 20 70 -4" fill="none" stroke="#8f6a1e" stroke-width="5"/></g>`,
  egg:(x,y,s=1,cls='')=>`<g class="tap" data-react="boing" data-sfx="pop" data-bubble="Peep?" transform="translate(${x} ${y}) scale(${s})"><g class="anim ${cls}">
    <ellipse cx="0" cy="-42" rx="32" ry="42" fill="#fffdf4" ${S(6)}/><ellipse cx="-10" cy="-58" rx="8" ry="12" fill="#fff" opacity=".9"/></g></g>`,
  crackedEgg:(x,y)=>`<g class="nohit" transform="translate(${x} ${y})"><path d="M-34 -30 a34 30 0 0 0 68 0 l-10 -10 l-10 10 l-12 -12 l-12 12 l-12 -10 z" fill="#fffdf4" ${S(6)}/></g>`,
  chick:(x,y,s=1)=>`<g class="tap" data-react="boing" data-sfx="chime" data-bubble="Peep! Peep!" transform="translate(${x} ${y}) scale(${s})"><g class="anim">
    <path d="M-10 0 v-16 M10 0 v-16" stroke="#f2a03d" stroke-width="6"/><circle cx="0" cy="-50" r="36" fill="#ffe14d" ${S(6)}/>
    <circle cx="-12" cy="-58" r="5" fill="${OUT}"/><circle cx="12" cy="-58" r="5" fill="${OUT}"/><path d="M-8 -46 l8 10 l8 -10 z" fill="#f2a03d" ${S(3)}/>
    <path d="M-36 -48 q-16 -4 -14 12 M36 -48 q16 -4 14 12" fill="none" ${S(5)}/><path d="M-4 -86 q4 -14 10 -2" fill="none" ${S(4)}/></g></g>`,
  duck:(x,y)=>`<g class="tap" data-react="boing" data-sfx="boing" data-bubble="Quack!" transform="translate(${x} ${y})"><g class="anim">
    <ellipse cx="0" cy="-40" rx="70" ry="40" fill="#fff" ${S(6)}/><path d="M-70 -50 q-20 -24 -4 -30 q8 14 20 14" fill="#fff" ${S(5)}/>
    <circle cx="56" cy="-92" r="32" fill="#fff" ${S(6)}/><path d="M80 -92 q34 -2 34 12 q-14 10 -34 4 z" fill="#f2a03d" ${S(5)}/><circle cx="62" cy="-100" r="5" fill="${OUT}"/>
    <path d="M-30 -42 q30 20 60 0" fill="none" ${S(4)}/></g></g>`,
  rock:(x,y)=>`<g class="tap" data-react="shake" data-sfx="pop" data-bubble="Bonk!" transform="translate(${x} ${y})"><g class="anim">
    <path d="M-46 0 q-10 -50 30 -62 q50 -10 62 30 q8 32 -14 32 z" fill="#b8b2a7" ${S(6)}/><circle cx="-10" cy="-34" r="6" fill="#9a948a"/></g></g>`,
  potato:(x,y)=>`<g class="tap" data-react="shake" data-sfx="pop" data-bubble="Potato!" transform="translate(${x} ${y})"><g class="anim">
    <ellipse cx="0" cy="-30" rx="56" ry="34" fill="#c99b5f" ${S(6)}/><circle cx="-20" cy="-38" r="4" fill="#8a6533"/><circle cx="14" cy="-24" r="4" fill="#8a6533"/><circle cx="26" cy="-42" r="3" fill="#8a6533"/></g></g>`,
  barnInside:()=>`<rect x="-2000" y="-2000" width="5600" height="2700" fill="#b8492f"/>
    ${Array.from({length:16},(_,i)=>`<path d="M${i*110-50} -100 V700" stroke="#9c3a24" stroke-width="8"/>`).join('')}
    <path d="M-2000 700 H3600 V4000 H-2000 Z" fill="#d9b26a"/><path d="M-200 330 H1800" ${S(14)}/>
    <rect x="1180" y="300" width="190" height="150" fill="#bfe6ff" ${S(8)}/><path d="M1275 300 V450 M1180 375 H1370" ${S(6)}/>`,
  moon:(x,y)=>`<g class="nohit" transform="translate(${x} ${y})"><circle r="80" fill="#fff3b0" ${S(6)}/><circle cx="34" cy="-26" r="70" fill="#1d2b53"/></g>`,
  stars:()=>Array.from({length:50},()=>`<circle class="blink nohit" style="animation-delay:${(Math.random()*2).toFixed(2)}s" cx="${(Math.random()*1600)|0}" cy="${(170+Math.random()*480)|0}" r="${(2+Math.random()*4).toFixed(1)}" fill="#fff8e7"/>`).join(''),
  hiddenBug:(x,y,s=.55)=>`<g class="tap hidden-bug" transform="translate(${x} ${y}) scale(${s})"><circle r="90" fill="transparent"/><g class="anim body">${ladybug()}</g></g>`,
});


/* ---- storybook style: flat screenprint shapes, soft shading, warm palette ---- */
const L=(w=3,c='#3a4a46')=>`stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
let _seed=7; const sr=()=>{ _seed=(_seed*16807)%2147483647; return (_seed-1)/2147483646; };
Object.assign(P,{
  sky:(c)=>c==='night'?`<rect x="-2000" y="-2000" width="5600" height="2800" fill="url(#nightG)"/>`
     :`<rect x="-2000" y="-2000" width="5600" height="2000" fill="#6fa79f"/><rect x="-2000" y="0" width="5600" height="800" fill="url(#skyG)"/><rect x="-2000" y="380" width="5600" height="300" fill="url(#dotsW)"/>`,
  hills:(y,night)=>{ const a=night?['#2f4b47','#2a4339']:['#9dbba6','#a9bf74'];
    return `<path d="M-2000 ${y-40} Q 200 ${y-230} 620 ${y-80} Q 1000 ${y-250} 1420 ${y-90} Q 1700 ${y-190} 3600 ${y-60} V ${y+500} H -2000 Z" fill="${a[0]}" ${L(5,OUT)}/>
      <path d="M-2000 ${y+20} Q 320 ${y-120} 820 ${y} Q 1250 ${y-150} 3600 ${y+10} V ${y+500} H -2000 Z" fill="${a[1]}" ${L(5,OUT)}/>`; },
  ground:(y,night)=>{ _seed=11; const a=night?['#36564a','#2f4d40','#24403a']:['#8fae5a','#7f9e4f','#6b8a45'];
    let t=`<path d="M-2000 ${y} Q 400 ${y-50} 800 ${y} T 3600 ${y} V 4000 H -2000 Z" fill="${a[0]}" ${L(5,OUT)}/><path d="M-2000 ${y+150} Q 600 ${y+90} 1100 ${y+160} T 3600 ${y+140} V 4000 H -2000 Z" fill="${a[1]}"/>`;
    for(let i=0;i<70;i++){ const gx=-200+sr()*2000, gy=y+20+sr()*330; t+=`<path d="M${gx-8} ${gy} l4 -14 M${gx} ${gy} l0 -18 M${gx+8} ${gy} l-4 -14" ${L(3,a[2])} fill="none"/>`; }
    if(!night) for(let i=0;i<26;i++){ const fx=-100+sr()*1800, fy=y+40+sr()*300; t+=`<circle cx="${fx}" cy="${fy}" r="${4+sr()*3}" fill="${['#f4ead2','#e9874a','#e7b04f'][i%3]}"/>`; }
    return `<g class="nohit">${t}</g>`; },
  sun:(x,y)=>`<g class="tap" data-react="spin" data-say="Hello sun!" transform="translate(${x} ${y})"><g class="anim" style="transform-origin:50% 50%">
    ${Array.from({length:12},(_,i)=>`<path d="M-11 -78 L0 -122 L11 -78 Z" fill="#e9874a" ${L(4,OUT)} transform="rotate(${i*30})"/>`).join('')}
    <circle r="68" fill="#f2a24e" ${L(6,OUT)}/><circle r="54" fill="#f6bb6a"/>
    <path d="M-30 -10 q10 -10 20 0 M10 -10 q10 -10 20 0" fill="none" ${L(5,'#7a3b1e')}/><path d="M-22 14 q22 20 44 0" fill="none" ${L(5,'#7a3b1e')}/>
    <circle cx="-38" cy="10" r="9" fill="#e9874a" opacity=".6"/><circle cx="38" cy="10" r="9" fill="#e9874a" opacity=".6"/></g></g>`,
  cloud:(x,y,s=1)=>`<g class="tap" data-react="boing" transform="translate(${x} ${y}) scale(${s})"><g class="anim">
    <path d="M-120 30 a42 42 0 0 1 30 -64 a58 58 0 0 1 104 -18 a48 48 0 0 1 82 30 a36 36 0 0 1 24 52 z" fill="#ddd2b8" ${L(6,OUT)}/>
    <path d="M-120 20 a42 42 0 0 1 30 -64 a58 58 0 0 1 104 -18 a48 48 0 0 1 82 30 a36 36 0 0 1 24 52 z" fill="#f6edd6"/>
    <path d="M-60 -20 a30 30 0 0 1 40 -26" fill="none" ${L(4,'#fffaf0')}/></g></g>`,
  tree:(x,y,s=1,fruit='')=>`<g class="tap" data-react="shake" transform="translate(${x} ${y}) scale(${s})"><g class="anim">
    <path d="M-30 0 q10 -20 14 -60 L-16 -190 L16 -190 L16 -60 q4 40 18 60 q-20 -6 -24 -14 q-6 10 -26 14 z" fill="#8a5e3c" ${L(3)}/>
    <path d="M-6 -150 v-40 M6 -120 q20 -30 40 -40" fill="none" ${L(4,'#6e4a2f')}/>
    <g ${L(6,OUT)}><circle cx="-90" cy="-230" r="80" fill="#5f8048"/><circle cx="70" cy="-240" r="88" fill="#5f8048"/><circle cx="-10" cy="-310" r="96" fill="#6f914e"/></g>
    <g fill="#6f914e"><circle cx="-90" cy="-230" r="77"/><circle cx="70" cy="-240" r="85"/><circle cx="-10" cy="-310" r="93"/></g><path d="M-160 -200 q80 50 220 30 q70 -10 100 -50 v60 h-320z" fill="url(#dots)" opacity=".6"/>
    <circle cx="-100" cy="-250" r="62" fill="#7a9c54"/><circle cx="60" cy="-262" r="66" fill="#7a9c54"/><circle cx="-20" cy="-326" r="70" fill="#86a85c"/>
    <path d="M-60 -350 a50 50 0 0 1 60 -30 M60 -300 a40 40 0 0 1 40 10" fill="none" ${L(5,'#a3bf72')}/>
    ${fruit?[[-80,-240],[30,-300],[80,-230],[-30,-260]].map(([a,b])=>`<circle cx="${a}" cy="${b}" r="13" fill="${fruit}"/>`).join(''):''}</g></g>`,
  pine:(x,y,s=1)=>`<g class="tap" data-react="shake" transform="translate(${x} ${y}) scale(${s})"><g class="anim">
    <rect x="-14" y="-50" width="28" height="50" fill="#7a5233"/>
    <path d="M0 -360 L-80 -230 H-40 L-110 -120 H-60 L-130 -40 H130 L60 -120 H110 L40 -230 H80 Z" fill="#3f6b55" ${L(6,OUT)}/>
    <path d="M0 -360 L-80 -230 H-40 L-110 -120 H-60 L-130 -40 H0 Z" fill="#4f7d60"/></g></g>`,
  flower:(x,y,c='#e58a8a',s=1)=>`<g class="tap" data-react="boing" transform="translate(${x} ${y}) scale(${s})"><g class="anim">
    <path d="M0 0 V-66" ${L(5,'#5f7f48')}/><path d="M0 -26 q-26 -2 -32 -22 q24 -4 32 16" fill="#7f9e4f"/>
    ${[0,72,144,216,288].map(a=>`<ellipse cx="0" cy="-98" rx="15" ry="21" fill="${c}" transform="rotate(${a} 0 -78)"/>`).join('')}
    <circle cx="0" cy="-78" r="12" fill="#f2a24e"/><circle cx="-3" cy="-81" r="4" fill="#f6d08a"/></g></g>`,
  fence:(x0,x1,y)=>{ let t=`<path d="M${x0} ${y-72} H${x1} M${x0} ${y-34} H${x1}" ${L(14,'#8d8a78')}/><path d="M${x0} ${y-72} H${x1} M${x0} ${y-34} H${x1}" stroke="#f4ead2" stroke-width="9"/>`;
    for(let x=x0;x<=x1;x+=100) t+=`<path d="M${x-13} ${y} V${y-104} l13 -16 l13 16 V${y} Z" fill="#f4ead2" ${L(3,'#8d8a78')}/><path d="M${x+6} ${y-100} V${y}" stroke="#ddd2b8" stroke-width="6"/>`;
    return `<g class="nohit">${t}</g>`; },
  barn:(x,y)=>{ let planks=''; for(let px=-140;px<160;px+=28) planks+=`<path d="M${px} -196 V0" stroke="#a83b28" stroke-width="3"/>`;
    const door=(dx)=>`<rect x="${dx}" y="-150" width="70" height="150" fill="#b8402b" stroke="#f4ead2" stroke-width="9"/><path d="M${dx} -150 L${dx+70} 0 M${dx+70} -150 L${dx} 0" stroke="#f4ead2" stroke-width="7"/>`;
    return `<g class="tap" data-react="boing" data-say="Barn!" transform="translate(${x} ${y})"><g class="anim">
    <path d="M-160 0 V-200 H160 V0 Z" fill="#c4462f" ${L(6,OUT)}/>${planks}<path d="M-160 -100 H160 V0 H-160Z" fill="url(#dots)" opacity=".5"/>
    <path d="M-182 -196 L-118 -300 L0 -344 L118 -300 L182 -196 Z" fill="#4b5552" ${L(6,OUT)}/><path d="M-182 -196 L-118 -300 L0 -344 L118 -300 L182 -196" fill="none" stroke="#f4ead2" stroke-width="9" stroke-linejoin="round"/>
    <path d="M-160 -200 V0 M160 -200 V0" stroke="#f4ead2" stroke-width="8"/>
    <rect x="-36" y="-282" width="72" height="62" fill="#b8402b" stroke="#f4ead2" stroke-width="7"/><path d="M-36 -282 L36 -220 M36 -282 L-36 -220" stroke="#f4ead2" stroke-width="5"/>
    ${door(-70)}${door(0)}<rect x="-26" y="-372" width="52" height="34" fill="#c4462f" stroke="#f4ead2" stroke-width="5"/><path d="M-34 -372 L0 -396 L34 -372 Z" fill="#4b5552"/></g></g>`; },
  hay:(x,y)=>`<g class="tap" data-react="boing" transform="translate(${x} ${y})"><g class="anim">
    <rect x="-82" y="-92" width="164" height="92" rx="16" fill="#e2b860" ${L(6,OUT)}/><rect x="-82" y="-92" width="164" height="30" rx="14" fill="#ecca7c"/>
    ${[-56,-28,0,28,56].map(d=>`<path d="M${d} -84 v76" stroke="#c99a3e" stroke-width="3"/>`).join('')}<path d="M-46 -92 v92 M46 -92 v92" stroke="#8a5e3c" stroke-width="6"/></g></g>`,
  pond:(x,y)=>`<g class="tap" data-react="boing" data-say="Splash!" transform="translate(${x} ${y})"><g class="anim">
    <ellipse rx="250" ry="78" fill="#8cc0b5" ${L(6,OUT)}/><ellipse cy="6" rx="232" ry="64" fill="#5d9c9a"/>
    <path d="M-120 -8 h60 M40 22 h80 M-30 30 h40" ${L(4,'#9fd0c6')}/>
    <path d="M-150 0 a38 16 0 1 0 60 0 l-30 4 z" fill="#7fa35a"/><path d="M70 18 a42 17 0 1 0 70 0 l-34 4 z" fill="#7fa35a"/><circle cx="96" cy="12" r="9" fill="#e9a6a0"/>
    ${[[-250,0],[-226,10],[236,-4],[256,8]].map(([a,b])=>`<path d="M${a} ${b} V${b-110}" ${L(4,'#6b8a45')}/><rect x="${a-6}" y="${b-110}" width="12" height="34" rx="6" fill="#8a5e3c"/>`).join('')}</g></g>`,
  /* characters */
  hen:(x,y)=>`<g class="tap" data-react="boing" data-say="Bawk bawk!" transform="translate(${x} ${y})"><g class="anim">
    <path d="M-12 0 v-26 M12 0 v-26 M-20 0 h16 M4 0 h16" ${L(5,'#d9802f')}/>
    <path d="M-48 -66 q-44 -6 -50 -48 q22 -2 32 12 q-10 -32 8 -50 q18 14 18 38 q8 -22 30 -26 q6 34 -14 66 z" fill="#efe5cc" ${L(6,OUT)}/>
    <path d="M-62 -60 q0 -50 60 -54 q50 -2 68 26 q16 30 -4 58 q-26 26 -66 22 q-58 -6 -58 -52 z" fill="#f7f0de" ${L(6,OUT)}/>
    <path d="M-50 -38 q34 26 92 6 q-36 22 -92 -6 z" fill="#e2d6ba"/>
    <path d="M-22 -74 q30 -10 46 10 q-20 24 -46 -10 z" fill="#ebe0c6" ${L(4.5,OUT)}/>
    <circle cx="48" cy="-112" r="30" fill="#f7f0de" ${L(6,OUT)}/>
    <path d="M30 -136 q4 -18 14 -6 q6 -16 14 -2 q8 -12 12 6 z" fill="#d0452f" ${L(4.5,OUT)}/>
    <path d="M74 -114 l22 6 l-22 8 z" fill="#e9874a" ${L(4.5,OUT)}/><path d="M72 -98 q6 16 -4 18 q-8 -4 -2 -16" fill="#d0452f"/>
    <circle cx="56" cy="-118" r="5" fill="${OUT}"/><circle cx="57.5" cy="-120" r="1.8" fill="#fff"/><circle cx="46" cy="-104" r="6" fill="#e9a6a0" opacity=".7"/></g></g>`,
  chick:(x,y,s=1)=>`<g class="tap" data-react="boing" data-sfx="chime" data-bubble="Peep! Peep!" transform="translate(${x} ${y}) scale(${s})"><g class="anim">
    <path d="M-10 0 v-14 M10 0 v-14" ${L(5,'#d9802f')}/><circle cy="-48" r="36" fill="#f5d35f" ${L(6,OUT)}/>
    <path d="M-30 -30 q30 22 60 0 q-30 12 -60 0z" fill="#e5b94a"/><path d="M-30 -52 q-18 4 -16 20 q12 -2 18 -12" fill="#efc350" ${L(4.5,OUT)}/>
    <path d="M-4 -84 q2 -16 10 -6 q4 -10 10 0" fill="none" ${L(4.5,OUT)}/>
    <circle cx="-11" cy="-56" r="4.5" fill="${OUT}"/><circle cx="13" cy="-56" r="4.5" fill="${OUT}"/><circle cx="-10" cy="-58" r="1.5" fill="#fff"/><circle cx="14" cy="-58" r="1.5" fill="#fff"/>
    <path d="M-7 -46 l7 9 l7 -9 z" fill="#e9874a" ${L(4,OUT)}/><circle cx="-22" cy="-42" r="5" fill="#e9a6a0" opacity=".7"/><circle cx="24" cy="-42" r="5" fill="#e9a6a0" opacity=".7"/></g></g>`,
  cow:(x,y)=>`<g class="tap" data-react="boing" data-say="Moooo!" transform="translate(${x} ${y})"><g class="anim">
    <path d="M-84 0 v-56 M-48 0 v-56 M36 0 v-56 M70 0 v-56" ${L(18,OUT)}/><path d="M-84 0 v-56 M-48 0 v-56 M36 0 v-56 M70 0 v-56" ${L(11,'#f7f0de')}/>
    <path d="M-92 -4 h16 M-56 -4 h16 M28 -4 h16 M62 -4 h16" ${L(9,'#4a3b30')}/>
    <path d="M-112 -110 q-30 10 -26 56" fill="none" ${L(6,OUT)}/><path d="M-142 -56 q4 14 10 0 z" fill="#4a3b30" ${L(4.5,OUT)}/>
    <rect x="-116" y="-160" width="210" height="112" rx="48" fill="#f7f0de" ${L(6,OUT)}/>
    <path d="M-80 -158 q34 26 4 62 q-34 -18 -30 -62 z M20 -126 q34 -10 34 28 q-34 10 -34 -28 z M-30 -66 q20 -10 30 18 h-36 z" fill="#3b3a36"/>
    <path d="M-104 -62 q90 22 190 0" fill="none" ${L(6,'#e2d6ba')}/><ellipse cx="-10" cy="-50" rx="20" ry="10" fill="#eaa28c" ${L(4.5,OUT)}/>
    <path d="M78 -196 q-14 -22 2 -30 M150 -196 q14 -22 -2 -30" fill="none" ${L(7,'#efe5cc')}/>
    <ellipse cx="62" cy="-176" rx="22" ry="12" fill="#3b3a36" transform="rotate(-25 62 -176)"/><ellipse cx="168" cy="-176" rx="22" ry="12" fill="#3b3a36" transform="rotate(25 168 -176)"/>
    <ellipse cx="114" cy="-150" rx="48" ry="54" fill="#f7f0de" ${L(6,OUT)}/><path d="M86 -196 q28 18 54 0 q-10 30 -28 30 q-18 0 -26 -30z" fill="#3b3a36"/>
    <ellipse cx="120" cy="-114" rx="40" ry="26" fill="#eaa28c" ${L(6,OUT)}/><circle cx="106" cy="-114" r="5" fill="${OUT}"/><circle cx="134" cy="-114" r="5" fill="${OUT}"/>
    <circle cx="98" cy="-160" r="6" fill="${OUT}"/><circle cx="130" cy="-160" r="6" fill="${OUT}"/><circle cx="100" cy="-162" r="2" fill="#fff"/><circle cx="132" cy="-162" r="2" fill="#fff"/></g></g>`,
  pig:(x,y)=>`<g class="tap" data-react="boing" data-say="Oink oink!" transform="translate(${x} ${y})"><g class="anim">
    <path d="M-44 0 v-30 M-14 0 v-30 M26 0 v-30 M52 0 v-30" ${L(16,OUT)}/><path d="M-44 0 v-30 M-14 0 v-30 M26 0 v-30 M52 0 v-30" ${L(9,'#eaa28c')}/>
    <path d="M-84 -72 q-26 -6 -20 -28 q14 2 8 14 q-4 8 6 10" fill="none" ${L(6,OUT)}/>
    <ellipse cx="0" cy="-72" rx="84" ry="58" fill="#eaa28c" ${L(6,OUT)}/><path d="M-70 -44 q70 40 140 0 q-70 22 -140 0z" fill="#d98a78"/>
    <path d="M44 -136 l-4 -30 l28 18 z M90 -134 l14 -28 l10 32 z" fill="#d98a78" ${L(4.5,OUT)}/>
    <circle cx="76" cy="-100" r="44" fill="#eaa28c" ${L(6,OUT)}/><ellipse cx="104" cy="-90" rx="20" ry="16" fill="#f0b7a3" ${L(6,OUT)}/>
    <circle cx="98" cy="-90" r="3.5" fill="${OUT}"/><circle cx="110" cy="-90" r="3.5" fill="${OUT}"/><circle cx="72" cy="-112" r="5.5" fill="${OUT}"/><circle cx="73.5" cy="-114" r="2" fill="#fff"/>
    <circle cx="62" cy="-88" r="7" fill="#d9826f" opacity=".7"/></g></g>`,
  duck:(x,y)=>`<g class="tap" data-react="boing" data-bubble="Quack!" transform="translate(${x} ${y})"><g class="anim">
    <path d="M-14 0 v-14 M14 0 v-14 M-24 0 h18 M6 0 h18" ${L(5,'#e9874a')}/>
    <path d="M-80 -54 q-14 -34 -2 -40 q14 14 30 14 q30 -20 84 -6 q40 12 36 42 q-6 34 -70 36 q-70 2 -78 -46z" fill="#f7f0de" ${L(6,OUT)}/>
    <path d="M-50 -30 q50 26 104 4 q-50 14 -104 -4z" fill="#e2d6ba"/><path d="M-30 -62 q34 -14 56 6 q-24 22 -56 -6z" fill="#ebe0c6" ${L(4.5,OUT)}/>
    <circle cx="58" cy="-96" r="30" fill="#f7f0de" ${L(6,OUT)}/><path d="M84 -98 q32 -6 36 8 q-12 14 -36 6 z" fill="#e9874a" ${L(4.5,OUT)}/>
    <circle cx="64" cy="-104" r="5" fill="${OUT}"/><circle cx="65.5" cy="-106" r="1.8" fill="#fff"/><circle cx="54" cy="-88" r="6" fill="#e9a6a0" opacity=".6"/></g></g>`,
  frog:(x,y)=>`<g class="tap" data-react="boing" data-say="Ribbit!" transform="translate(${x} ${y})"><g class="anim">
    <path d="M-62 -4 q-14 -30 18 -30 M62 -4 q14 -30 -18 -30" fill="#7fa35a" ${L(6,OUT)}/>
    <ellipse cy="-34" rx="62" ry="38" fill="#8fb35a" ${L(6,OUT)}/><ellipse cy="-24" rx="40" ry="20" fill="#c3d58f"/>
    <circle cx="-28" cy="-70" r="20" fill="#8fb35a" ${L(6,OUT)}/><circle cx="28" cy="-70" r="20" fill="#8fb35a" ${L(6,OUT)}/>
    <circle cx="-28" cy="-72" r="10" fill="#f7f0de"/><circle cx="28" cy="-72" r="10" fill="#f7f0de"/><circle cx="-26" cy="-72" r="5" fill="${OUT}"/><circle cx="30" cy="-72" r="5" fill="${OUT}"/>
    <path d="M-26 -40 q26 16 52 0" fill="none" ${L(6,OUT)}/><circle cx="-40" cy="-46" r="6" fill="#e9a6a0" opacity=".6"/><circle cx="40" cy="-46" r="6" fill="#e9a6a0" opacity=".6"/></g></g>`,
  egg:(x,y,s=1,cls='')=>`<g class="tap" data-react="boing" data-sfx="pop" data-bubble="Peep?" transform="translate(${x} ${y}) scale(${s})"><g class="anim ${cls}">
    <ellipse cx="0" cy="-42" rx="32" ry="42" fill="#f4ead2" ${L(6,OUT)}/><path d="M-26 -24 q26 22 52 0 q-26 14 -52 0z" fill="#e2d6ba"/>
    <circle cx="-8" cy="-52" r="3" fill="#c9b58e"/><circle cx="10" cy="-34" r="2.5" fill="#c9b58e"/><circle cx="12" cy="-60" r="2" fill="#c9b58e"/><ellipse cx="-12" cy="-62" rx="6" ry="10" fill="#fffaf0"/></g></g>`,
  nest:(x,y,s=1)=>`<g class="nohit" transform="translate(${x} ${y}) scale(${s})"><path d="M-96 -16 q96 56 192 0 q-8 -42 -96 -42 q-88 0 -96 42z" fill="#b98a3c" ${L(6,OUT)}/>
    <path d="M-80 -22 q40 22 70 4 M-20 -10 q40 18 84 -10 M-60 -40 q30 10 50 0 M10 -42 q30 12 60 -2" fill="none" ${L(4,'#e2b860')}/></g>`,
  crackedEgg:(x,y)=>`<g class="nohit" transform="translate(${x} ${y})"><path d="M-34 -30 a34 30 0 0 0 68 0 l-10 -10 l-10 10 l-12 -12 l-12 12 l-12 -10 z" fill="#f4ead2" ${L(6,OUT)}/></g>`,
  rock:(x,y)=>`<g class="tap" data-react="shake" data-sfx="pop" data-bubble="Bonk!" transform="translate(${x} ${y})"><g class="anim">
    <path d="M-50 0 q-12 -54 30 -66 q52 -10 64 32 q8 34 -14 34 z" fill="#a9a596" ${L(6,OUT)}/><path d="M-40 -8 q40 6 70 -10 q-4 18 -70 10z" fill="#918d7f"/><circle cx="-12" cy="-40" r="5" fill="#918d7f"/></g></g>`,
  potato:(x,y)=>`<g class="tap" data-react="shake" data-sfx="pop" data-bubble="Potato!" transform="translate(${x} ${y})"><g class="anim">
    <ellipse cx="0" cy="-32" rx="58" ry="34" fill="#c4935e" ${L(6,OUT)}/><path d="M-44 -18 q44 18 88 0 q-44 12 -88 0z" fill="#a97c4c"/>
    <circle cx="-20" cy="-40" r="4" fill="#8a6533"/><circle cx="14" cy="-26" r="4" fill="#8a6533"/><circle cx="26" cy="-44" r="3" fill="#8a6533"/></g></g>`,
  barnInside:()=>{ let t=`<rect x="-2000" y="-2000" width="5600" height="2720" fill="#b8402b"/>`;
    for(let i=0;i<40;i++) t+=`<path d="M${i*60-600} -100 V720" stroke="#a3381f" stroke-width="5"/>`;
    t+=`<path d="M-2000 330 H3600" ${L(26,'#6e2f1f')}/><path d="M300 -100 V720 M1300 -100 V720" ${L(30,'#6e2f1f')}/>
      <rect x="1120" y="380" width="220" height="170" fill="#a9cbb6" stroke="#f4ead2" stroke-width="12"/><path d="M1230 380 V550 M1120 465 H1340" stroke="#f4ead2" stroke-width="8"/>
      <path d="M1120 550 L900 1000 H1700 L1340 550 Z" fill="#f6e3a8" opacity=".25"/>
      <path d="M520 330 l-40 400 M600 330 l-40 400" ${L(9,'#8a5e3c')}/>${[400,480,560,640].map(v=>`<path d="M${520-(v-330)/10} ${v} h80" ${L(8,'#8a5e3c')}/>`).join('')}
      <path d="M-2000 720 H3600 V4000 H-2000 Z" fill="#e2c48a"/>`; _seed=5;
    for(let i=0;i<60;i++){ const sx=-200+sr()*2000, sy=740+sr()*300; t+=`<path d="M${sx} ${sy} l${20+sr()*20} ${-4+sr()*8}" ${L(3,'#c99a3e')}/>`; }
    return t; },
  moon:(x,y)=>`<g class="nohit" transform="translate(${x} ${y})"><circle r="150" fill="#f4e3a6" opacity=".08"/><path d="M14 -79 A80 80 0 1 0 79 14 A72 72 0 1 1 14 -79 Z" fill="#f4e3a6"/></g>`,
});


/* ---- more critters: the bee book and the sea book ---- */
function beeSmall(){ return `<g class="wingL"><ellipse cx="-14" cy="-40" rx="16" ry="24" fill="#e9f4f2" ${L(4.5,OUT)} transform="rotate(-20 -14 -40)"/></g>
  <g class="wingR"><ellipse cx="14" cy="-42" rx="16" ry="24" fill="#e9f4f2" ${L(4.5,OUT)} transform="rotate(20 14 -42)"/></g>
  <ellipse cx="0" cy="0" rx="42" ry="30" fill="#f2c94c" ${L(6,OUT)}/><path d="M-14 -28 q8 28 0 56 M8 -29 q8 29 0 58" ${L(11,OUT)} fill="none"/>
  <path d="M-42 0 l-14 4 l14 6" fill="${OUT}"/><circle cx="30" cy="-6" r="5" fill="${OUT}"/><circle cx="31.5" cy="-8" r="1.8" fill="#fff"/><path d="M24 8 q8 6 14 -2" fill="none" ${L(3.5,OUT)}/>
  <path d="M30 -26 q4 -22 16 -24 M38 -22 q10 -16 22 -12" fill="none" ${L(3.5,OUT)}/>`; }
function squid(){ return `<path d="M-30 20 q-6 40 -20 56 M-14 22 q-2 44 -8 60 M2 22 q4 44 8 60 M18 20 q8 40 20 56" fill="none" ${L(6,OUT)}/>
  <path d="M-30 20 q-6 40 -20 56 M-14 22 q-2 44 -8 60 M2 22 q4 44 8 60 M18 20 q8 40 20 56" fill="none" ${L(3,'#e7a7b6')}/>
  <path d="M-34 24 q-6 -60 30 -96 q38 36 30 96 z" fill="#e7a7b6" ${L(6,OUT)}/><path d="M-40 -30 l-18 -24 l26 6 M32 -30 l18 -24 l-26 6" fill="#e7a7b6" ${L(5,OUT)}/>
  <circle cx="-12" cy="0" r="8" fill="#fff" ${L(3,OUT)}/><circle cx="12" cy="0" r="8" fill="#fff" ${L(3,OUT)}/><circle cx="-11" cy="1" r="4" fill="${OUT}"/><circle cx="13" cy="1" r="4" fill="${OUT}"/>
  <path d="M-6 14 q6 5 12 0" fill="none" ${L(3,OUT)}/>`; }
function starfish(){ const pts=Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5, r=i%2?20:52; return `${(Math.cos(a)*r).toFixed(1)},${(Math.sin(a)*r).toFixed(1)}`}).join(' ');
  return `<g style="transform-box:fill-box;transform-origin:50% 50%"><polygon points="${pts}" fill="#ef9a4f" ${L(6,OUT)} stroke-linejoin="round"/>
  ${[[0,-30],[26,-8],[16,24],[-16,24],[-26,-8]].map(([a,b])=>`<circle cx="${a}" cy="${b}" r="3.5" fill="#f9d18f"/>`).join('')}
  <circle cx="-7" cy="-4" r="4" fill="${OUT}"/><circle cx="7" cy="-4" r="4" fill="${OUT}"/><path d="M-6 6 q6 5 12 0" fill="none" ${L(3,OUT)}/></g>`; }
const FINDS={
  ladybug:{draw:()=>ladybug(),anim:'fly',ms:2300,icon:'🐞',snd:()=>sfx.chime()},
  bee:{draw:()=>beeSmall(),anim:'fly',ms:2300,icon:'🐝',snd:()=>buzz()},
  caterpillar:{draw:()=>`<g transform="translate(-10 20)">${caterpillar()}</g>`,anim:'wiggle',ms:2000,icon:'🐛',snd:()=>[0,.1,.2,.3].forEach(d=>tone(700,1100,.06,'triangle',.07,d))},
  snail:{draw:()=>`<g transform="translate(-30 10)">${snail()}</g>`,anim:'hide',ms:1700,icon:'🐌',snd:()=>tone(500,300,.3,'sine',.08)},
  squid:{draw:()=>squid(),anim:'squirt',ms:1600,icon:'🦑',snd:()=>noise(.4,{type:'lowpass',f:900,f2:300,vol:.12})},
  starfish:{draw:()=>starfish(),anim:'spinC',ms:1100,icon:'⭐',snd:()=>[1500,2000,2600].forEach((f,i)=>tone(f,f,.12,'triangle',.06,i*.07))},
};
const finds=page=>page.find||(page.bug?[['ladybug',...page.bug]]:[]);
function buzz(){ voice(220,240,.5,{type:'sawtooth',lp:1400,vib:28,vol:.06}); }
function blub(){ [0,.12,.26].forEach((d,i)=>tone(300+i*80,700+i*120,.09,'sine',.09,d)); }
Object.assign(P,{
  beeBig:(x,y)=>`<g class="tap" data-react="boing" data-say="Bzzz!" transform="translate(${x} ${y})"><g class="hover"><g class="anim">
    <g class="flapW"><ellipse cx="-24" cy="-118" rx="30" ry="44" fill="#e9f4f2" ${L(6,OUT)} transform="rotate(-18 -24 -118)"/><ellipse cx="20" cy="-122" rx="30" ry="44" fill="#e9f4f2" ${L(6,OUT)} transform="rotate(18 20 -122)"/></g>
    <ellipse cx="0" cy="-60" rx="80" ry="56" fill="#f2c94c" ${L(6,OUT)}/><path d="M-28 -112 q14 52 0 104 M14 -114 q14 54 0 108" fill="none" ${L(20,OUT)}/>
    <path d="M-60 -24 q60 30 120 0 q-60 18 -120 0z" fill="#c7a63e"/>
    <path d="M-80 -60 l-26 8 l26 12" fill="${OUT}"/><circle cx="54" cy="-72" r="9" fill="${OUT}"/><circle cx="57" cy="-75" r="3" fill="#fff"/>
    <path d="M42 -44 q14 12 28 -2" fill="none" ${L(5,OUT)}/><circle cx="34" cy="-50" r="8" fill="#e9a6a0" opacity=".7"/>
    <path d="M52 -108 q6 -40 30 -44 M66 -100 q20 -30 42 -24" fill="none" ${L(5,OUT)}/><circle cx="82" cy="-152" r="7" fill="${OUT}"/><circle cx="108" cy="-124" r="7" fill="${OUT}"/></g></g></g>`,
  hive:(x,y)=>`<g class="tap" data-react="shake" transform="translate(${x} ${y})"><g class="anim">
    <path d="M-12 0 V-40 M12 0 V-40" ${L(10,OUT)}/><path d="M-12 0 V-40 M12 0 V-40" ${L(5,'#8a5e3c')}/>
    ${[0,1,2,3,4].map(i=>`<rect x="${-110+i*14}" y="${-80-i*40}" width="${220-i*28}" height="46" rx="23" fill="${i%2?'#e2b860':'#ecca7c'}" ${L(6,OUT)}/>`).join('')}
    <path d="M-26 -40 a26 30 0 0 1 52 0 z" fill="#3b2a1a" ${L(5,OUT)}/></g></g>`,
  butterfly:(x,y)=>`<g class="tap" data-react="boing" data-say="Flutter!" transform="translate(${x} ${y})"><g class="hover"><g class="anim">
    <g class="flutterW l"><path d="M-6 -60 q-80 -80 -100 -20 q-10 40 100 30 z" fill="#ef9a4f" ${L(6,OUT)}/><path d="M-6 -50 q-70 30 -60 70 q30 10 60 -60z" fill="#e58a8a" ${L(6,OUT)}/><circle cx="-60" cy="-56" r="10" fill="#f6edd6"/></g>
    <g class="flutterW r"><path d="M6 -60 q80 -80 100 -20 q10 40 -100 30 z" fill="#ef9a4f" ${L(6,OUT)}/><path d="M6 -50 q70 30 60 70 q-30 10 -60 -60z" fill="#e58a8a" ${L(6,OUT)}/><circle cx="60" cy="-56" r="10" fill="#f6edd6"/></g>
    <ellipse cx="0" cy="-50" rx="10" ry="40" fill="${OUT}"/><circle cx="0" cy="-96" r="14" fill="${OUT}"/><path d="M-4 -106 q-10 -24 -24 -26 M4 -106 q10 -24 24 -26" fill="none" ${L(4,OUT)}/></g></g></g>`,
  mouse:(x,y)=>`<g class="tap" data-react="boing" data-say="Squeak!" transform="translate(${x} ${y})"><g class="anim">
    <path d="M-40 -20 q-50 0 -60 -40" fill="none" ${L(5,OUT)}/><ellipse cx="0" cy="-30" rx="44" ry="30" fill="#a9a596" ${L(6,OUT)}/>
    <circle cx="36" cy="-56" r="26" fill="#a9a596" ${L(6,OUT)}/><circle cx="24" cy="-84" r="16" fill="#e9a6a0" ${L(5,OUT)}/><circle cx="52" cy="-82" r="14" fill="#e9a6a0" ${L(5,OUT)}/>
    <circle cx="44" cy="-58" r="4.5" fill="${OUT}"/><circle cx="60" cy="-48" r="5" fill="#e58a8a" ${L(3,OUT)}/><path d="M-20 -2 v-6 M20 -2 v-6" ${L(5,OUT)}/></g></g>`,
  /* sea folk */
  fish:(x,y)=>`<g class="tap" data-react="boing" data-say="Blub blub!" transform="translate(${x} ${y})"><g class="hover"><g class="anim">
    <path d="M-80 -70 l-46 -40 q-8 40 0 76 z" fill="#e9874a" ${L(6,OUT)}/>
    <ellipse cx="0" cy="-70" rx="88" ry="60" fill="#f2a24e" ${L(6,OUT)}/><path d="M-50 -122 q20 22 0 104 M-10 -128 q20 30 0 116" fill="none" ${L(14,'#f6edd6')}/>
    <path d="M-50 -122 q20 22 0 104 M-10 -128 q20 30 0 116" fill="none" ${L(3,OUT)}/>
    <path d="M-10 -128 q30 -40 60 -10" fill="#e9874a" ${L(6,OUT)}/><path d="M-60 -30 q60 40 120 6 q-60 20 -120 -6z" fill="#d36d5a"/>
    <circle cx="44" cy="-84" r="20" fill="#fff" ${L(5,OUT)}/><circle cx="48" cy="-84" r="10" fill="${OUT}"/><circle cx="51" cy="-88" r="3.5" fill="#fff"/>
    <path d="M60 -52 q10 8 20 0" fill="none" ${L(5,OUT)}/><circle cx="30" cy="-56" r="8" fill="#e58a8a" opacity=".8"/></g></g></g>`,
  octopus:(x,y)=>`<g class="tap" data-react="boing" data-say="Hello!" transform="translate(${x} ${y})"><g class="anim">
    ${[-70,-40,-12,16,44,72].map((a,i)=>`<path d="M${a*.7} -60 q${a*.5} 30 ${a} 56 q${i%2?14:-14} 10 ${i%2?24:-24} -6" fill="none" ${L(26,OUT)}/><path d="M${a*.7} -60 q${a*.5} 30 ${a} 56 q${i%2?14:-14} 10 ${i%2?24:-24} -6" fill="none" ${L(18,'#c58b9e')}/>`).join('')}
    <ellipse cx="0" cy="-110" rx="78" ry="82" fill="#c58b9e" ${L(6,OUT)}/><path d="M-50 -70 q50 30 100 0 q-50 18 -100 0z" fill="#a8708a"/>
    <circle cx="-26" cy="-112" r="14" fill="#fff" ${L(4.5,OUT)}/><circle cx="26" cy="-112" r="14" fill="#fff" ${L(4.5,OUT)}/><circle cx="-24" cy="-110" r="7" fill="${OUT}"/><circle cx="28" cy="-110" r="7" fill="${OUT}"/>
    <path d="M-14 -84 q14 12 28 0" fill="none" ${L(5,OUT)}/><circle cx="-48" cy="-90" r="8" fill="#e58a8a" opacity=".8"/><circle cx="48" cy="-90" r="8" fill="#e58a8a" opacity=".8"/>
    <circle cx="-30" cy="-160" r="8" fill="#d7a3b4"/><circle cx="20" cy="-172" r="6" fill="#d7a3b4"/></g></g>`,
  turtle:(x,y)=>`<g class="tap" data-react="boing" data-say="Slow and steady!" transform="translate(${x} ${y})"><g class="hover"><g class="anim">
    <path d="M-70 -40 q-40 10 -50 40 q40 -4 60 -22 M60 -40 q30 20 40 46 q-36 -2 -54 -26 M-50 -100 q-50 -30 -70 -10 q30 20 66 20" fill="#8fb35a" ${L(6,OUT)}/>
    <circle cx="104" cy="-74" r="32" fill="#8fb35a" ${L(6,OUT)}/><circle cx="114" cy="-82" r="6" fill="${OUT}"/><circle cx="116" cy="-84" r="2" fill="#fff"/><path d="M112 -62 q10 6 18 -4" fill="none" ${L(4,OUT)}/>
    <path d="M-90 -40 q0 -90 90 -90 q90 0 90 90 z" fill="#5f8048" ${L(6,OUT)}/>
    <path d="M-40 -40 l10 -40 l40 -16 l40 16 l10 40 M-30 -80 l-40 6 M50 -80 l36 10 M10 -96 v-30" fill="none" ${L(4,'#3f5f36')}/>
    <path d="M-90 -40 h180" ${L(8,OUT)}/><path d="M-80 -40 h160 v10 h-160z" fill="#c3d58f"/></g></g></g>`,
  crab:(x,y)=>`<g class="tap" data-react="scuttle" data-say="Click click!" transform="translate(${x} ${y})"><g class="anim">
    ${[-1,1].map(d=>`<path d="M${d*40} -30 l${d*34} 22 l${d*10} 20 M${d*30} -24 l${d*40} 6 l${d*14} 22 M${d*20} -20 l${d*30} 18 l${d*2} 22" fill="none" ${L(7,OUT)}/>`).join('')}
    ${[-1,1].map(d=>`<path d="M${d*50} -70 q${d*30} -30 ${d*50} -60" fill="none" ${L(8,OUT)}/><path d="M${d*100} -150 q${d*40} -10 ${d*30} 30 q${d*-10} 20 ${d*-30} 0 l${d*16} -10 z" fill="#d0452f" ${L(6,OUT)}/>`).join('')}
    <ellipse cx="0" cy="-50" rx="70" ry="42" fill="#d0452f" ${L(6,OUT)}/><path d="M-50 -24 q50 24 100 0 q-50 12 -100 0z" fill="#d36d5a"/>
    <path d="M-18 -88 v-30 M18 -88 v-30" ${L(5,OUT)}/><circle cx="-18" cy="-122" r="11" fill="#fff" ${L(4,OUT)}/><circle cx="18" cy="-122" r="11" fill="#fff" ${L(4,OUT)}/>
    <circle cx="-17" cy="-121" r="5" fill="${OUT}"/><circle cx="19" cy="-121" r="5" fill="${OUT}"/><path d="M-14 -50 q14 12 28 0" fill="none" ${L(5,OUT)}/></g></g>`,
  seahorse:(x,y)=>`<g class="tap" data-react="boing" data-say="Peekaboo!" transform="translate(${x} ${y})"><g class="hover"><g class="anim">
    <path d="M40 -150 q40 -10 46 24 q-30 10 -46 -6z" fill="#ef9a4f" ${L(5,OUT)}/>
    <path d="M-6 -214 C44 -196 56 -140 24 -100 C-6 -62 12 -20 50 -20 C82 -20 82 -62 54 -62 C40 -62 40 -44 52 -44" fill="none" ${L(52,OUT)}/>
    <path d="M-6 -214 C44 -196 56 -140 24 -100 C-6 -62 12 -20 50 -20 C82 -20 82 -62 54 -62 C40 -62 40 -44 52 -44" fill="none" ${L(40,'#f2c94c')}/>
    <path d="M-2 -180 q-16 40 0 70 M10 -150 h-22 M4 -124 h-22" fill="none" ${L(4,'#c7a63e')}/>
    <path d="M-50 -222 L-104 -214" ${L(22,OUT)}/><path d="M-50 -222 L-104 -214" ${L(11,'#f2c94c')}/>
    <ellipse cx="-20" cy="-226" rx="40" ry="30" fill="#f2c94c" ${L(6,OUT)} transform="rotate(-15 -20 -226)"/>
    <path d="M-28 -254 l4 -20 l12 14 l8 -18 l8 22" fill="#ef9a4f" ${L(4,OUT)}/>
    <circle cx="-16" cy="-230" r="11" fill="#fff" ${L(4,OUT)}/><circle cx="-18" cy="-230" r="5.5" fill="${OUT}"/><circle cx="-4" cy="-210" r="7" fill="#e58a8a" opacity=".8"/></g></g></g>`,
  jelly:(x,y)=>`<g class="tap" data-react="boing" data-say="Glow!" transform="translate(${x} ${y})"><g class="hover"><g class="anim">
    <circle cx="0" cy="-130" r="110" fill="#f3b6c8" opacity=".18" class="glow"/>
    ${[-40,-16,8,32].map((a,i)=>`<path d="M${a} -100 q${i%2?16:-16} 30 0 60 q${i%2?-16:16} 30 0 60" fill="none" ${L(6,'#f3b6c8')}/>`).join('')}
    <path d="M-60 -100 q0 -80 60 -80 q60 0 60 80 q-15 12 -30 0 q-15 12 -30 0 q-15 12 -30 0 q-15 12 -30 0z" fill="#f3b6c8" ${L(6,OUT)}/>
    <circle cx="-18" cy="-128" r="6" fill="${OUT}"/><circle cx="18" cy="-128" r="6" fill="${OUT}"/><path d="M-10 -112 q10 8 20 0" fill="none" ${L(4,OUT)}/>
    <path d="M-36 -150 q10 -14 26 -14" fill="none" ${L(5,'#fff')}/></g></g></g>`,
  whale:(x,y)=>`<g class="tap" data-react="boing" data-say="Whoosh!" transform="translate(${x} ${y})"><g class="hover"><g class="anim">
    <path d="M-200 -120 q-60 -50 -70 -90 q40 10 60 40 q10 -50 40 -70 q4 50 -10 100" fill="#5d8fb0" ${L(6,OUT)}/>
    <path d="M-200 -110 q0 -110 200 -110 q170 0 200 90 q10 60 -60 80 q-120 30 -280 10 q-60 -10 -60 -70z" fill="#5d8fb0" ${L(6,OUT)}/>
    <path d="M-160 -60 q150 40 330 0 q-20 40 -100 50 q-120 10 -230 -10z" fill="#d7e3e0" ${L(5,OUT)}/>
    ${[0,1,2,3,4].map(i=>`<path d="M${-100+i*50} -40 q0 20 6 32" fill="none" ${L(3,'#9fb9c4')}/>`).join('')}
    <circle cx="130" cy="-130" r="10" fill="${OUT}"/><circle cx="133" cy="-134" r="3.5" fill="#fff"/><path d="M150 -90 q20 8 40 -6" fill="none" ${L(5,OUT)}/>
    <circle cx="110" cy="-100" r="12" fill="#e58a8a" opacity=".7"/><path d="M0 -150 q-20 50 40 60 q-30 -50 -40 -60z" fill="#4b7a98"/></g></g></g>`,
  clam:(x,y)=>`<g class="tap" data-react="clamOpen" data-say="A pearl!" transform="translate(${x} ${y})"><g class="anim">
    <path d="M-70 0 q0 -36 70 -36 q70 0 70 36 z" fill="#e7b6a8" ${L(6,OUT)}/><circle cx="0" cy="-36" r="16" fill="#fbf6ee" ${L(4,OUT)}/><circle cx="-5" cy="-41" r="5" fill="#fff"/>
    <g class="lid"><path d="M-70 -2 q0 -80 70 -80 q70 0 70 80 z" fill="#efc7b8" ${L(6,OUT)}/>${[-40,-14,14,40].map(a=>`<path d="M0 -4 L${a} -70" ${L(3.5,'#c58b8b')}/>`).join('')}</g></g></g>`,
  /* sea scenery */
  coral:(x,y,c='#e58a8a',s=1)=>`<g class="tap" data-react="boing" transform="translate(${x} ${y}) scale(${s})"><g class="anim">
    <path d="M-10 0 q-6 -60 -40 -90 q-20 -20 -10 -50 M-10 -60 q30 -30 20 -90 M20 0 q10 -50 50 -70 q20 -20 10 -60 M40 -60 q-20 -40 0 -70" fill="none" ${L(30,OUT)}/>
    <path d="M-10 0 q-6 -60 -40 -90 q-20 -20 -10 -50 M-10 -60 q30 -30 20 -90 M20 0 q10 -50 50 -70 q20 -20 10 -60 M40 -60 q-20 -40 0 -70" fill="none" ${L(20,c)}/></g></g>`,
  kelp:(x,y,h=420,s=1)=>`<g class="tap" data-react="shake" transform="translate(${x} ${y}) scale(${s})"><g class="wave" style="animation-delay:-${(Math.random()*3).toFixed(1)}s"><g class="anim">
    <path d="M0 0 q-30 -${h*.25} 0 -${h*.5} q30 -${h*.25} 0 -${h}" fill="none" ${L(30,OUT)}/><path d="M0 0 q-30 -${h*.25} 0 -${h*.5} q30 -${h*.25} 0 -${h}" fill="none" ${L(22,'#6a9650')}/>
    ${[.2,.4,.6,.8].map((f,i)=>`<path d="M0 -${h*f} q${i%2?40:-40} -20 ${i%2?60:-60} -60 q${i%2?-30:30} 10 ${i%2?-60:60} 60z" fill="#7fa35a" ${L(5,OUT)}/>`).join('')}</g></g></g>`,
  anemone:(x,y,c='#c58b9e',s=1)=>`<g class="tap" data-react="boing" transform="translate(${x} ${y}) scale(${s})"><g class="anim">
    ${[-50,-30,-10,10,30,50].map((a,i)=>`<path d="M${a*.8} -50 q${i%2?10:-10} -30 ${a*.4} -60" fill="none" ${L(16,OUT)}/><path d="M${a*.8} -50 q${i%2?10:-10} -30 ${a*.4} -60" fill="none" ${L(9,c)}/>`).join('')}
    <path d="M-70 0 q0 -70 70 -70 q70 0 70 70z" fill="${c}" ${L(6,OUT)}/><path d="M-50 -10 q50 20 100 0 q-50 10 -100 0z" fill="url(#dots)"/></g></g>`,
  rockS:(x,y,s=1)=>`<g class="nohit" transform="translate(${x} ${y}) scale(${s})"><path d="M-120 0 q-10 -80 60 -100 q50 -20 110 10 q50 30 40 90z" fill="#7c8f98" ${L(6,OUT)}/><path d="M-100 -10 q80 20 190 -6 q-90 20 -190 6z" fill="#3d7f86"/></g>`,
});

