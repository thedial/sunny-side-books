/* ---------------- drawing: critters ---------------- */
function caterpillar(){
  const segs=[-60,-32,-4,24].map((x,i)=>`<circle class="seg" style="animation-delay:${i*.08}s" cx="${x}" cy="0" r="20" fill="${i%2?'#5fa832':'#8fd14f'}" ${S(5)}/>`).join('');
  const feet=[-60,-32,-4,24].map(x=>`<path d="M${x-6} 18 v10 M${x+6} 18 v10" ${S(4)}/>`).join('');
  return `${feet}${segs}
  <g class="seg" style="animation-delay:.34s">
    <path d="M52 -18 q-4 -26 -14 -34 M60 -16 q10 -26 22 -30" fill="none" ${S(4)}/><circle cx="38" cy="-52" r="5" fill="${OUT}"/><circle cx="82" cy="-46" r="5" fill="${OUT}"/>
    <circle cx="56" cy="-4" r="25" fill="#e2412f" ${S(5)}/>
    <circle cx="50" cy="-10" r="7" fill="#fff" ${S(3)}/><circle cx="66" cy="-10" r="7" fill="#fff" ${S(3)}/>
    <circle cx="52" cy="-9" r="3.5" fill="${OUT}"/><circle cx="68" cy="-9" r="3.5" fill="${OUT}"/>
    <path d="M50 6 q8 8 16 0" fill="none" ${S(4)}/>
  </g>`;
}
function ladybug(){
  return `<path d="M-30 20 l-14 12 M30 20 l14 12 M-34 0 l-16 0 M34 0 l16 0 M-28 -18 l-12 -10 M28 -18 l12 -10" ${S(4)}/>
  <circle cx="0" cy="-36" r="18" fill="${OUT}"/>
  <circle cx="-7" cy="-40" r="5" fill="#fff"/><circle cx="7" cy="-40" r="5" fill="#fff"/>
  <path d="M-8 -54 q-8 -14 -16 -14 M8 -54 q8 -14 16 -14" fill="none" ${S(4)}/>
  <g class="wingL"><path d="M0 -26 A38 40 0 0 0 0 40 Z" fill="#e8382f" ${S(5)}/><circle cx="-16" cy="-6" r="7" fill="${OUT}"/><circle cx="-20" cy="18" r="6" fill="${OUT}"/><circle cx="-6" cy="28" r="5" fill="${OUT}"/></g>
  <g class="wingR"><path d="M0 -26 A38 40 0 0 1 0 40 Z" fill="#e8382f" ${S(5)}/><circle cx="16" cy="-6" r="7" fill="${OUT}"/><circle cx="20" cy="18" r="6" fill="${OUT}"/><circle cx="6" cy="28" r="5" fill="${OUT}"/></g>`;
}
function snail(){
  return `<g class="sbody"><path d="M-10 24 q40 6 80 -2 q14 -4 12 -24 q-2 -14 -16 -14 q-10 0 -14 10 q-20 20 -62 22 z" fill="#9ad1c4" ${S(5)}/>
    <path d="M62 -12 l-6 -30 M74 -10 l6 -30" ${S(4)}/><circle cx="55" cy="-46" r="7" fill="#fff" ${S(3)}/><circle cx="81" cy="-44" r="7" fill="#fff" ${S(3)}/>
    <circle cx="56" cy="-45" r="3" fill="${OUT}"/><circle cx="82" cy="-43" r="3" fill="${OUT}"/><path d="M66 6 q6 5 12 0" fill="none" ${S(3)}/></g>
  <circle cx="-14" cy="-10" r="40" fill="#f2a03d" ${S(5)}/>
  <path d="M-14 -10 m0 -4 a6 6 0 1 1 -2 10 a12 12 0 1 1 14 -18 a20 20 0 1 1 -28 28 a28 28 0 1 1 40 -38" fill="none" ${S(4)}/>`;
}
const BUG={caterpillar,ladybug,snail};
const NAMES={caterpillar:'Caterpillar!',ladybug:'Ladybug!',snail:'Snail!'};
const ANIM={caterpillar:'wiggle',ladybug:'fly',snail:'hide'};

/* ---------------- drawing: scenery pieces ---------------- */
const P={
  sky:(c='#8fd3f4')=>`<rect x="-2000" y="-2000" width="5600" height="2700" fill="${c}"/>`,
  ground:(y,c='#7cc242',c2='#6ab33a')=>`<path d="M-2000 ${y} Q 400 ${y-60} 800 ${y} T 3600 ${y} V 4000 H -2000 Z" fill="${c}"/><path d="M-2000 ${y+120} Q 600 ${y+60} 1100 ${y+130} T 3600 ${y+110} V 4000 H -2000 Z" fill="${c2}"/>`,
  hills:(y,c)=>`<path d="M-2000 ${y} Q 200 ${y-200} 500 ${y-40} Q 800 ${y-260} 1200 ${y-30} Q 1500 ${y-180} 3600 ${y} V 900 H -2000 Z" fill="${c}" ${S(5)}/>`,
  sun:(x,y)=>`<g class="tap" data-react="spin" data-say="Hello sun!" transform="translate(${x} ${y})"><g class="anim" style="transform-origin:50% 50%">
    ${Array.from({length:12},(_,i)=>`<path d="M0 -78 L0 -104" transform="rotate(${i*30})" ${S(8)}/>`).join('')}
    <circle r="62" fill="#ffd23f" ${S(6)}/><circle cx="-20" cy="-10" r="6" fill="${OUT}"/><circle cx="20" cy="-10" r="6" fill="${OUT}"/>
    <path d="M-24 14 q24 22 48 0" fill="none" ${S(6)}/><circle cx="-36" cy="12" r="9" fill="#ff9a8a" opacity=".7"/><circle cx="36" cy="12" r="9" fill="#ff9a8a" opacity=".7"/></g></g>`,
  cloud:(x,y,s=1)=>`<g class="tap" data-react="boing" data-sfx="boing" transform="translate(${x} ${y}) scale(${s})"><g class="anim">
    <path d="M-90 30 a40 40 0 0 1 20 -70 a55 55 0 0 1 100 -10 a45 45 0 0 1 70 60 z" fill="#fff" ${S(6)}/></g></g>`,
  flower:(x,y,c='#ff7eb6',s=1)=>`<g class="tap" data-react="boing" data-sfx="pop" transform="translate(${x} ${y}) scale(${s})"><g class="anim">
    <path d="M0 0 V-70" ${S(6)}/><path d="M0 -30 q-26 -4 -34 -24 q26 -2 34 18" fill="#5fa832" ${S(4)}/>
    ${[0,72,144,216,288].map(a=>`<ellipse cx="0" cy="-104" rx="16" ry="24" fill="${c}" transform="rotate(${a} 0 -82)" ${S(4)}/>`).join('')}
    <circle cx="0" cy="-82" r="14" fill="#ffd23f" ${S(4)}/></g></g>`,
  tree:(x,y,s=1,fruit='#e8382f')=>`<g class="tap" data-react="shake" data-sfx="boing" transform="translate(${x} ${y}) scale(${s})"><g class="anim">
    <path d="M-26 0 L-18 -170 L18 -170 L26 0 Z" fill="#9b6a3c" ${S(6)}/>
    <path d="M-150 -170 q-20 -110 70 -140 q30 -90 130 -50 q110 -10 100 90 q60 70 -10 110 q-140 40 -290 -10 z" fill="#4fae46" ${S(6)}/>
    ${fruit?[[-80,-220],[10,-280],[70,-200],[-20,-190]].map(([a,b])=>`<circle cx="${a}" cy="${b}" r="16" fill="${fruit}" ${S(4)}/>`).join(''):''}</g></g>`,
  pine:(x,y,s=1)=>`<g class="tap" data-react="shake" data-sfx="boing" transform="translate(${x} ${y}) scale(${s})"><g class="anim">
    <rect x="-16" y="-40" width="32" height="40" fill="#8a5a33" ${S(5)}/>
    <path d="M0 -330 L-90 -170 H-50 L-120 -40 H120 L50 -170 H90 Z" fill="#2f8f4e" ${S(6)}/></g></g>`,
  fence:(x0,x1,y)=>{let s=`<path d="M${x0} ${y-70} H${x1} M${x0} ${y-30} H${x1}" ${S(16)}/><path d="M${x0} ${y-70} H${x1} M${x0} ${y-30} H${x1}" stroke="#f5e3c0" stroke-width="8"/>`;
    for(let x=x0;x<=x1;x+=110) s+=`<path d="M${x-14} ${y} V${y-100} l14 -18 l14 18 V${y} Z" fill="#f5e3c0" ${S(5)}/>`; return `<g class="nohit">${s}</g>`;},
  barn:(x,y)=>`<g class="tap" data-react="boing" data-say="Barn!" transform="translate(${x} ${y})"><g class="anim">
    <path d="M-170 0 V-210 L0 -330 L170 -210 V0 Z" fill="#d6402f" ${S(7)}/><path d="M-170 -210 L0 -330 L170 -210" fill="none" stroke="#fff" stroke-width="10"/>
    <rect x="-70" y="-150" width="140" height="150" fill="#f5e3c0" ${S(6)}/><path d="M-70 -150 L70 0 M70 -150 L-70 0" ${S(6)}/>
    <rect x="-34" y="-250" width="68" height="56" fill="#ffd23f" ${S(5)}/></g></g>`,
  hay:(x,y)=>`<g class="tap" data-react="boing" data-sfx="pop" transform="translate(${x} ${y})"><g class="anim">
    <rect x="-80" y="-90" width="160" height="90" rx="20" fill="#f0c34f" ${S(6)}/><path d="M-50 -70 v50 M-10 -80 v60 M30 -70 v50" stroke="#c8962a" stroke-width="5"/></g></g>`,
  cow:(x,y)=>`<g class="tap" data-react="boing" data-say="Moooo!" data-pitch="0.6" transform="translate(${x} ${y})"><g class="anim">
    <path d="M-80 0 v-50 M-40 0 v-50 M40 0 v-50 M80 0 v-50" ${S(10)}/>
    <rect x="-110" y="-150" width="200" height="110" rx="45" fill="#fff" ${S(6)}/>
    <path d="M-60 -150 q30 30 0 60 q-30 -20 -20 -60 z M30 -120 q30 -10 30 30 q-30 10 -30 -30 z" fill="${OUT}"/>
    <ellipse cx="110" cy="-150" rx="50" ry="55" fill="#fff" ${S(6)}/><ellipse cx="120" cy="-118" rx="38" ry="24" fill="#ffb3c1" ${S(5)}/>
    <circle cx="108" cy="-118" r="4" fill="${OUT}"/><circle cx="132" cy="-118" r="4" fill="${OUT}"/>
    <circle cx="94" cy="-165" r="6" fill="${OUT}"/><circle cx="124" cy="-165" r="6" fill="${OUT}"/>
    <path d="M70 -195 q-20 -20 -4 -30 M150 -195 q20 -20 4 -30" fill="none" ${S(6)}/><path d="M-110 -110 q-30 10 -24 50" fill="none" ${S(6)}/></g></g>`,
  pig:(x,y)=>`<g class="tap" data-react="boing" data-say="Oink oink!" data-pitch="1.2" transform="translate(${x} ${y})"><g class="anim">
    <path d="M-40 0 v-30 M30 0 v-30" ${S(9)}/><ellipse cx="0" cy="-70" rx="80" ry="55" fill="#ffb3c1" ${S(6)}/>
    <path d="M-80 -70 q-30 0 -20 -24 q8 14 22 6" fill="none" ${S(5)}/>
    <circle cx="70" cy="-90" r="40" fill="#ffb3c1" ${S(6)}/><ellipse cx="96" cy="-82" rx="18" ry="14" fill="#ff8fa6" ${S(5)}/>
    <circle cx="91" cy="-82" r="3" fill="${OUT}"/><circle cx="101" cy="-82" r="3" fill="${OUT}"/><circle cx="68" cy="-102" r="5" fill="${OUT}"/>
    <path d="M50 -122 l-6 -26 l22 14 z" fill="#ff8fa6" ${S(5)}/></g></g>`,
  hen:(x,y)=>`<g class="tap" data-react="boing" data-say="Bawk bawk!" data-pitch="1.8" transform="translate(${x} ${y})"><g class="anim">
    <path d="M-10 0 v-26 M14 0 v-26" stroke="#f2a03d" stroke-width="7"/><ellipse cx="0" cy="-60" rx="52" ry="40" fill="#fff" ${S(6)}/>
    <circle cx="40" cy="-100" r="26" fill="#fff" ${S(6)}/><path d="M30 -124 q6 -16 14 -2 q8 -14 12 4" fill="#e8382f" ${S(4)}/>
    <path d="M64 -100 l18 6 l-18 6 z" fill="#f2a03d" ${S(4)}/><circle cx="46" cy="-104" r="4" fill="${OUT}"/><path d="M-50 -70 q-30 -20 -20 -46 q14 20 24 24" fill="#fff" ${S(5)}/></g></g>`,
  frog:(x,y)=>`<g class="tap" data-react="boing" data-say="Ribbit!" data-pitch="0.8" transform="translate(${x} ${y})"><g class="anim">
    <ellipse cx="0" cy="-30" rx="60" ry="36" fill="#6cc04a" ${S(6)}/><circle cx="-26" cy="-66" r="18" fill="#6cc04a" ${S(5)}/><circle cx="26" cy="-66" r="18" fill="#6cc04a" ${S(5)}/>
    <circle cx="-26" cy="-68" r="8" fill="#fff"/><circle cx="26" cy="-68" r="8" fill="#fff"/><circle cx="-26" cy="-68" r="4" fill="${OUT}"/><circle cx="26" cy="-68" r="4" fill="${OUT}"/>
    <path d="M-28 -24 q28 18 56 0" fill="none" ${S(5)}/></g></g>`,
  owl:(x,y)=>`<g class="tap" data-react="spin" data-say="Hoo hoo!" data-pitch="0.9" transform="translate(${x} ${y})"><g class="anim" style="transform-origin:50% 50%">
    <ellipse cx="0" cy="-50" rx="42" ry="52" fill="#a8774b" ${S(6)}/><path d="M-40 -96 l10 -20 l14 14 M40 -96 l-10 -20 l-14 14" fill="#a8774b" ${S(5)}/>
    <circle cx="-16" cy="-70" r="15" fill="#fff" ${S(4)}/><circle cx="16" cy="-70" r="15" fill="#fff" ${S(4)}/><circle cx="-16" cy="-70" r="6" fill="${OUT}"/><circle cx="16" cy="-70" r="6" fill="${OUT}"/>
    <path d="M-6 -52 l6 10 l6 -10 z" fill="#f2a03d" ${S(3)}/><ellipse cx="0" cy="-24" rx="22" ry="18" fill="#e6c9a0"/></g></g>`,
  bunny:(x,y)=>`<g class="tap" data-react="boing" data-say="Hop hop!" data-pitch="1.6" transform="translate(${x} ${y})"><g class="anim">
    <ellipse cx="0" cy="-40" rx="44" ry="38" fill="#fff" ${S(6)}/><circle cx="34" cy="-80" r="28" fill="#fff" ${S(6)}/>
    <ellipse cx="22" cy="-130" rx="10" ry="30" fill="#fff" ${S(5)}/><ellipse cx="44" cy="-128" rx="10" ry="30" fill="#fff" ${S(5)}/>
    <circle cx="42" cy="-84" r="4" fill="${OUT}"/><circle cx="58" cy="-74" r="5" fill="#ff8fa6"/><circle cx="-44" cy="-40" r="12" fill="#fff" ${S(4)}/></g></g>`,
  mushroom:(x,y,s=1)=>`<g class="tap" data-react="boing" data-sfx="boing" transform="translate(${x} ${y}) scale(${s})"><g class="anim">
    <path d="M-22 0 q-4 -50 0 -60 h44 q4 10 0 60 z" fill="#f5e3c0" ${S(5)}/><path d="M-80 -56 q10 -80 80 -80 q70 0 80 80 z" fill="#e8382f" ${S(6)}/>
    <circle cx="-34" cy="-88" r="10" fill="#fff"/><circle cx="20" cy="-108" r="12" fill="#fff"/><circle cx="46" cy="-74" r="8" fill="#fff"/></g></g>`,
  log:(x,y)=>`<g class="nohit" transform="translate(${x} ${y})"><rect x="-150" y="-70" width="300" height="70" rx="35" fill="#9b6a3c" ${S(6)}/><ellipse cx="150" cy="-35" rx="22" ry="35" fill="#d9a066" ${S(5)}/><ellipse cx="150" cy="-35" rx="10" ry="16" fill="none" ${S(3)}/></g>`,
  pond:(x,y)=>`<g class="tap" data-react="boing" data-sfx="pop" data-say="Splash!" transform="translate(${x} ${y})"><g class="anim"><ellipse cx="0" cy="0" rx="230" ry="70" fill="#5ab4e0" ${S(6)}/>
    <path d="M-120 -10 a40 18 0 1 0 60 0 l-30 4 z" fill="#4fae46" ${S(4)}/><path d="M60 14 a44 18 0 1 0 70 0 l-34 4 z" fill="#4fae46" ${S(4)}/></g></g>`,
  cabbage:(x,y,s=1)=>`<g class="tap" data-react="boing" data-sfx="pop" transform="translate(${x} ${y}) scale(${s})"><g class="anim">
    <circle cx="0" cy="-50" r="56" fill="#a5d86b" ${S(6)}/><path d="M-40 -60 q40 -40 80 0 M-30 -30 q30 -26 60 0 M0 -104 v60" fill="none" ${S(4)}/>
    <circle cx="-22" cy="-74" r="8" fill="#7cc242" ${S(3)}/><circle cx="26" cy="-40" r="7" fill="#7cc242" ${S(3)}/></g></g>`,
  carrot:(x,y)=>`<g class="tap" data-react="boing" data-sfx="pop" data-say="Carrot!" transform="translate(${x} ${y})"><g class="anim">
    <path d="M-8 -20 q-20 -40 -6 -60 M0 -20 q0 -50 10 -66 M8 -20 q20 -40 26 -54" fill="none" stroke="#4fae46" stroke-width="10" stroke-linecap="round"/>
    <path d="M-26 -20 h52 l-26 70 z" fill="#f2903d" ${S(5)}/></g></g>`,
  scarecrow:(x,y)=>`<g class="tap" data-react="shake" data-say="Boo! Just kidding!" data-pitch="1.1" transform="translate(${x} ${y})"><g class="anim">
    <path d="M0 0 V-250 M-110 -190 H110" ${S(12)}/><path d="M-70 -200 h140 l-20 120 h-100 z" fill="#5a8fd6" ${S(6)}/>
    <circle cx="0" cy="-250" r="44" fill="#f5e3c0" ${S(6)}/><path d="M-60 -276 h120 M-36 -276 q0 -50 36 -50 q36 0 36 50" fill="#c8962a" ${S(6)}/>
    <circle cx="-14" cy="-252" r="5" fill="${OUT}"/><circle cx="14" cy="-252" r="5" fill="${OUT}"/><path d="M-16 -232 q16 12 32 0" fill="none" ${S(4)}/></g></g>`,
  leaf:(x,y,r=0,s=1,c='#5fa832')=>`<path class="nohit" transform="translate(${x} ${y}) rotate(${r}) scale(${s})" d="M0 0 q40 -70 120 -40 q-30 70 -120 40 z" fill="${c}" ${S(5)}/>`,
  button:(x,y)=>`<g id="bigbutton" class="tap" transform="translate(${x} ${y})">
    <path class="nohit" d="M-150 -40 V-200" ${S(8)}/><g class="nohit"><rect x="-235" y="-290" width="170" height="96" rx="12" fill="#f5e3c0" ${S(6)}/>
    <text x="-150" y="-252" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="30" fill="${OUT}">DON'T</text>
    <text x="-150" y="-216" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="30" fill="${OUT}">PUSH!</text></g>
    <g class="anim"><rect x="-80" y="-50" width="160" height="50" rx="14" fill="#c9c3b8" ${S(6)}/>
    <path d="M-62 -48 q0 -66 62 -66 q62 0 62 66 z" fill="#e8382f" ${S(6)}/><ellipse cx="-22" cy="-86" rx="16" ry="9" fill="#fff" opacity=".6"/></g>
    <circle r="130" cy="-60" fill="transparent"/></g>`,
};

