/* ---------------- the family cast: people, pets and loveys built from parts ----------------
   A member is plain data ({kind, name, ...parts}); the book names a slot, the tablet's family fills it.
   Swatches avoid the PAL keys, so a parent's pick is the color that gets drawn (check.py holds this). */
const SWATCH={
  skin:['#f6dcc8','#efc6a6','#dcaa84','#c08b62','#94623f','#62402a'],
  hair:['#2b2220','#5a3a24','#94592f','#d9b25e','#b5552e','#d6d0c4'],
  cloth:['#e58a8a','#f0c055','#4f9c9b','#8d86c6','#6a9650','#3f6d8e','#f5eddb','#d9826f'],
  coat:['#c98f4f','#2e2724','#f1e8d6','#8a8580','#e09a4c','#6b4a33'],
  lovey:['#d8b08a','#e9b5c0','#a9c7d9','#f2ead8','#b9a6d6','#9fc29a','#8a7a6c']
};
const CAST_OPTS={
  person:[['role','Who',['grownup','kid','baby']],['skin','Skin',SWATCH.skin],['hair','Hair',['short','long','bun','curly','ponytail','bald','tuft']],
    ['hairColor','Hair color',SWATCH.hair],['shirt','Shirt',SWATCH.cloth],['pants','Pants',SWATCH.cloth],['glasses','Glasses',['no','yes']],['beard','Beard',['no','yes']]],
  pet:[['type','Pet',['dog','cat']],['coat','Coat',SWATCH.coat],['marks','Markings',['none','patch','spots','socks','stripes']],['ears','Ears',['floppy','pointy']],['collar','Collar',SWATCH.cloth]],
  lovey:[['type','Lovey',['bear','bunny','elephant']],['fur','Color',SWATCH.lovey],['patch','Patch',['none',...SWATCH.cloth]],['bow','Bow',['none',...SWATCH.cloth]],['eyes','Eyes',['buttons','one stitched']]]
};
const esc=t=>String(t==null?'':t).replace(/[&<>"'\\{}]/g,c=>'&#'+c.charCodeAt(0)+';');
/* a slightly darker or lighter shade of a member's color, for shading and markings */
const tint=(hex,k)=>'#'+[1,3,5].map(i=>{ const v=parseInt(hex.slice(i,i+2),16), w=k<0?v*(1+k):v+(255-v)*k; return Math.round(Math.max(0,Math.min(255,w))).toString(16).padStart(2,'0'); }).join('');
const castWrap=(x,y,s,sfxName,say,inner)=>`<g class="tap" data-react="boing" data-sfx="${sfxName}" data-bubble="${say}" transform="translate(${x} ${y}) scale(${s})"><g class="anim">${inner}</g></g>`;

/* body sizes per role: head radius and center, shoulder and waist heights, half body width */
const ROLE={grownup:{hr:44,hy:-206,sh:-158,wa:-70,bw:44},kid:{hr:42,hy:-150,sh:-106,wa:-44,bw:34},baby:{hr:40,hy:-104,sh:-64,wa:-22,bw:32}};
function hairBack(st,c,hr,hy){
  if(st==='long') return `<path d="M${-hr-10} ${hy} q0 ${-hr-12} ${hr+10} ${-hr-12} q${hr+10} 0 ${hr+10} ${hr+12} v${hr*1.3} q${-hr-10} 20 ${-2*hr-20} 0 z" fill="${c}" ${S(5)}/>`;
  if(st==='ponytail') return `<ellipse cx="${hr+16}" cy="${hy+8}" rx="18" ry="34" fill="${c}" transform="rotate(-18 ${hr+16} ${hy+8})" ${S(5)}/>`;
  if(st==='bun') return `<circle cy="${hy-hr-10}" r="20" fill="${c}" ${S(5)}/>`;
  if(st==='curly') return Array.from({length:9},(_,i)=>{ const a=Math.PI*(0.95+i*0.14); return `<circle cx="${(Math.cos(a)*(hr+4)).toFixed(0)}" cy="${(hy+Math.sin(a)*(hr+4)+6).toFixed(0)}" r="17" fill="${c}" ${S(5)}/>`; }).join('');
  return '';
}
function hairFront(st,c,hr,hy){
  if(st==='bald') return `<path d="M${-hr*.45} ${hy-hr*.6} q12 -10 26 -8" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>`;
  if(st==='tuft') return `<path d="M-4 ${hy-hr+2} q-4 -22 10 -26 q10 -2 8 10 q-4 6 -10 0" fill="none" ${L(6,c)}/>`;
  if(st==='curly') return `<path d="M${-hr} ${hy-6} q8 ${-hr+2} ${hr} ${-hr+2} q${hr-8} 0 ${hr} ${hr-2} q-14 -18 -30 -14 q-10 12 -26 8 q-16 10 -32 4 z" fill="${c}"/>`;
  return `<path d="M${-hr-4} ${hy+4} A${hr+4} ${hr+6} 0 0 1 ${hr+4} ${hy+4} Q${hr*.5} ${hy-hr*.5} ${-hr*.15} ${hy-hr*.42} Q${-hr*.7} ${hy-hr*.3} ${-hr-4} ${hy+4} Z" fill="${c}" ${S(5)}/>`;
}
function person(m){
  const R=ROLE[m.role]||ROLE.grownup, {hr,hy,sh,wa,bw}=R, sk=m.skin||SWATCH.skin[1], hc=m.hairColor||SWATCH.hair[1], sh1=m.shirt||SWATCH.cloth[2];
  const baby=m.role==='baby', pants=baby?sh1:(m.pants||SWATCH.cloth[5]), lw=baby?bw-6:bw-10, ld=baby?-6:-10;
  const legs=[-1,1].map(d=>`<rect x="${d<0?-lw-3:3}" y="${wa-6}" width="${lw}" height="${-wa+ld+6}" rx="${lw/2}" fill="${pants}" ${S(5)}/>`).join('')
    +[-1,1].map(d=>`<ellipse cx="${d*(lw/2+6)}" cy="-6" rx="${baby?13:18}" ry="9" fill="${baby?sk:'#3a3330'}" ${S(5)}/>`).join('');
  const arm=d=>`<path d="M${d*(bw-8)} ${sh+16} q${d*24} ${(wa-sh)*.4} ${d*18} ${(wa-sh)*.75}" fill="none" ${L(30,OUT)}/><path d="M${d*(bw-8)} ${sh+16} q${d*24} ${(wa-sh)*.4} ${d*18} ${(wa-sh)*.75}" fill="none" ${L(21,sh1)}/>`
    +`<circle cx="${d*(bw+10)}" cy="${sh+16+(wa-sh)*.75}" r="${baby?11:12}" fill="${sk}" ${S(5)}/>`;
  const body=`<rect x="${-bw}" y="${sh}" width="${2*bw}" height="${wa-sh+12}" rx="${bw*.55}" fill="${sh1}" ${S(6)}/><path d="M${-bw+10} ${wa-8} q${bw-10} 12 ${2*bw-20} 0" fill="none" stroke="${tint(sh1,-.18)}" stroke-width="6" stroke-linecap="round"/>`
    +(baby?`<circle cy="${(sh+wa)/2}" r="4" fill="${tint(sh1,-.3)}"/><circle cy="${(sh+wa)/2+16}" r="4" fill="${tint(sh1,-.3)}"/>`:'');
  const neck=`<rect x="-10" y="${hy+hr-10}" width="20" height="${sh-hy-hr+16}" fill="${sk}" ${S(5)}/>`;
  const head=[-1,1].map(d=>`<circle cx="${d*hr}" cy="${hy+6}" r="10" fill="${sk}" ${S(5)}/>`).join('')+`<circle cy="${hy}" r="${hr}" fill="${sk}" ${S(6)}/>`;
  const ey=hy+4, ex=hr*.38;
  let face=[-1,1].map(d=>`<circle cx="${d*ex}" cy="${ey}" r="5.5" fill="${OUT}"/><circle cx="${d*ex+1.5}" cy="${ey-2}" r="1.8" fill="#fff"/><circle cx="${d*hr*.62}" cy="${ey+15}" r="7" fill="#e9a6a0" opacity=".65"/>`).join('');
  if(m.beard==='yes'&&!baby&&m.role!=='kid') face+=`<path d="M${-hr*.88} ${hy+4} Q${-hr*.8} ${hy+hr+20} 0 ${hy+hr+22} Q${hr*.8} ${hy+hr+20} ${hr*.88} ${hy+4} Q${hr*.5} ${hy+30} 0 ${hy+26} Q${-hr*.5} ${hy+30} ${-hr*.88} ${hy+4}Z" fill="${hc}" ${S(5)}/>`;
  face+=`<path d="M-11 ${ey+17} q11 11 22 0" fill="none" ${S(4.5)}/>`;
  if(m.glasses==='yes') face+=[-1,1].map(d=>`<circle cx="${d*ex}" cy="${ey}" r="13" fill="#fff" fill-opacity=".25" ${S(4)}/>`).join('')+`<path d="M${-ex+13} ${ey} h${2*ex-26}" ${S(4)}/>`;
  return hairBack(m.hair,hc,hr,hy)+legs+arm(-1)+arm(1)+body+neck+head+face+hairFront(m.hair,hc,hr,hy);
}
function pet(m){
  const c=m.coat||SWATCH.coat[0], dk=tint(c,-.28), lt=tint(c,.55), cat=m.type==='cat', mk=m.marks||'none', pointy=cat||m.ears==='pointy';
  const bx=cat?-6:-10, by=cat?-54:-62, rx=cat?58:70, ry=cat?28:36, hx=cat?46:58, hy=cat?-96:-112, hr=cat?32:38;
  const legX=cat?[-46,-26,18,36]:[-58,-36,22,44];
  let s=`<path class="wag" d="M${bx-rx+8} ${by-6} ${cat?'q-40 -10 -34 -70 q4 -14 14 -4':'q-30 -16 -26 -52'}" fill="none" ${L(cat?16:18,OUT)}/><path d="M${bx-rx+8} ${by-6} ${cat?'q-40 -10 -34 -70 q4 -14 14 -4':'q-30 -16 -26 -52'}" fill="none" ${L(cat?9:11,mk==='stripes'?dk:c)}/>`;
  s+=legX.map((x,i)=>`<rect x="${x-9}" y="${by+ry-22}" width="18" height="${-by-ry+22}" rx="9" fill="${c}" ${S(5)}/>`+(mk==='socks'?`<rect x="${x-7}" y="-16" width="14" height="14" rx="6" fill="${lt}"/>`:'')).join('');
  s+=`<ellipse cx="${bx}" cy="${by}" rx="${rx}" ry="${ry}" fill="${c}" ${S(6)}/>`;
  if(mk==='spots') s+=[[-36,-8,14],[4,6,10],[-4,-20,8],[30,-6,11]].map(([x,y,r])=>`<ellipse cx="${bx+x}" cy="${by+y}" rx="${r}" ry="${r*.8}" fill="${dk}"/>`).join('');
  if(mk==='stripes') s+=[-34,-12,10,32].map(x=>`<path d="M${bx+x} ${by-ry+4} q6 14 0 26" fill="none" ${L(7,dk)}/>`).join('');
  s+=`<ellipse cx="${bx+rx*.45}" cy="${by+ry*.35}" rx="${rx*.3}" ry="${ry*.45}" fill="${lt}" opacity=".8"/>`;
  const earL=pointy?`<path d="M${hx-26} ${hy-18} l-6 -38 l30 20 z M${hx+8} ${hy-26} l14 -36 l14 32 z" fill="${c}" ${S(5)}/><path d="M${hx-22} ${hy-22} l-3 -20 l14 10 z M${hx+14} ${hy-28} l8 -20 l7 18 z" fill="#e9a6a0"/>`
    :`<path d="M${hx-30} ${hy-24} q-24 6 -18 52 q16 6 24 -14 z" fill="${dk}" ${S(5)}/>`;
  s+=`<circle cx="${hx}" cy="${hy}" r="${hr}" fill="${c}" ${S(6)}/>`+earL;
  if(mk==='patch') s+=`<ellipse cx="${hx+10}" cy="${hy-6}" rx="15" ry="13" fill="${dk}"/>`;
  if(mk==='stripes') s+=`<path d="M${hx-8} ${hy-hr+4} v12 M${hx+4} ${hy-hr+2} v14 M${hx+16} ${hy-hr+6} v10" ${L(5,dk)}/>`;
  if(cat) s+=`<path d="M${hx+24} ${hy+4} l8 -6 l8 6 z" fill="#e58a8a" ${S(3)}/><path d="M${hx+32} ${hy+4} q0 10 -10 10 M${hx+32} ${hy+4} q0 10 10 10" fill="none" ${S(3.5)}/>`
    +`<path d="M${hx+44} ${hy+2} h26 M${hx+44} ${hy+10} l24 6 M${hx+16} ${hy+2} h-24 M${hx+16} ${hy+10} l-22 6" ${L(2.5,OUT)}/>`;
  else s+=`<ellipse cx="${hx+30}" cy="${hy+12}" rx="24" ry="17" fill="${lt}" ${S(5)}/><ellipse cx="${hx+50}" cy="${hy+4}" rx="9" ry="7" fill="${OUT}"/>`
    +`<path d="M${hx+28} ${hy+22} q10 10 22 2" fill="none" ${S(4)}/><path d="M${hx+34} ${hy+26} q2 14 10 10 q4 -4 0 -10" fill="#e58a8a" ${S(3)}/>`;
  s+=`<circle cx="${hx+(cat?10:12)}" cy="${hy-6}" r="5.5" fill="${OUT}"/><circle cx="${hx+(cat?11.5:13.5)}" cy="${hy-8}" r="1.8" fill="#fff"/>`
    +(cat?`<circle cx="${hx-10}" cy="${hy-6}" r="5" fill="${OUT}"/>`:'');
  s+=`<path d="M${hx-hr+6} ${hy+hr-10} q${hr} 20 ${2*hr-14} -4" fill="none" ${L(10,OUT)}/><path d="M${hx-hr+6} ${hy+hr-10} q${hr} 20 ${2*hr-14} -4" fill="none" ${L(6,m.collar||SWATCH.cloth[0])}/><circle cx="${hx+4}" cy="${hy+hr+4}" r="7" fill="#f0c055" ${S(3)}/>`;
  return s;
}
function lovey(m){
  const c=m.fur||SWATCH.lovey[1], lt=tint(c,.45), dk=tint(c,-.25), t=m.type||'bear', hy=-104;
  let s='';
  if(t==='bunny') s+=`<ellipse cx="-16" cy="${hy-50}" rx="13" ry="36" fill="${c}" ${S(5)}/><ellipse cx="-16" cy="${hy-48}" rx="6" ry="24" fill="${lt}"/>`
    +`<path d="M10 ${hy-26} q8 -40 22 -44 q22 -2 30 14 q-14 -6 -26 4 q-12 12 -14 30 z" fill="${c}" ${S(5)}/>`;
  if(t==='elephant') s+=[-1,1].map(d=>`<ellipse cx="${d*40}" cy="${hy+2}" rx="26" ry="32" fill="${c}" ${S(5)}/><ellipse cx="${d*40}" cy="${hy+4}" rx="15" ry="20" fill="${lt}"/>`).join('');
  s+=[-1,1].map(d=>`<ellipse cx="${d*28}" cy="-16" rx="24" ry="17" fill="${c}" ${S(5)}/><ellipse cx="${d*34}" cy="-16" rx="10" ry="9" fill="${lt}"/>`).join('');
  s+=`<ellipse cy="-50" rx="42" ry="38" fill="${c}" ${S(6)}/><ellipse cy="-46" rx="26" ry="24" fill="${lt}"/><path d="M0 -84 v62" stroke="${dk}" stroke-width="3" stroke-dasharray="6 6"/>`;
  s+=[-1,1].map(d=>`<ellipse cx="${d*42}" cy="-56" rx="13" ry="22" fill="${c}" transform="rotate(${d*-28} ${d*42} -56)" ${S(5)}/>`).join('');
  if(m.patch&&m.patch!=='none') s+=`<rect x="8" y="-44" width="24" height="22" rx="4" fill="${m.patch}" ${S(3.5)}/><rect x="11" y="-41" width="18" height="16" rx="3" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/>`;
  if(t==='bear') s+=[-1,1].map(d=>`<circle cx="${d*27}" cy="${hy-28}" r="14" fill="${c}" ${S(5)}/><circle cx="${d*27}" cy="${hy-28}" r="7" fill="${lt}"/>`).join('');
  s+=`<circle cy="${hy}" r="36" fill="${c}" ${S(6)}/>`;
  if(t==='elephant') s+=`<path d="M-8 ${hy+12} q-4 30 10 40 q12 6 14 -4 q-10 -2 -8 -14 q2 -14 8 -22 z" fill="${c}" ${S(5)}/>`;
  else s+=`<ellipse cy="${hy+12}" rx="16" ry="12" fill="${lt}" ${S(4)}/><ellipse cy="${hy+6}" rx="6" ry="4.5" fill="${OUT}"/><path d="M-6 ${hy+16} q6 6 12 0" fill="none" ${S(3)}/>`;
  const eye=(x,stitch)=>stitch?`<path d="M${x-6} ${hy-14} l12 12 M${x+6} ${hy-14} l-12 12" ${S(4)}/>`
    :`<circle cx="${x}" cy="${hy-8}" r="7.5" fill="#3a3330" ${S(2.5)}/><circle cx="${x-2}" cy="${hy-9}" r="1.4" fill="#cfc6b6"/><circle cx="${x+2}" cy="${hy-7}" r="1.4" fill="#cfc6b6"/>`;
  s+=eye(-14,false)+eye(14,m.eyes==='one stitched');
  s+=`<circle cx="-24" cy="${hy+10}" r="6" fill="#e9a6a0" opacity=".55"/><circle cx="24" cy="${hy+10}" r="6" fill="#e9a6a0" opacity=".55"/>`;
  if(m.bow&&m.bow!=='none') s+=`<path d="M0 -84 l-24 -12 v24 z M0 -84 l24 -12 v24 z" fill="${m.bow}" ${S(4)}/><circle cy="-84" r="7" fill="${m.bow}" ${S(4)}/>`;
  return `<g transform="rotate(-4)">${s}</g>`;
}
/* the pieces a book places: {"who":"person","slot":"grownup1"}; the family fills the slot before drawing */
const SAYS={dog:'Woof! Woof!',cat:'Meow!'};
Object.assign(P,{
  person:(x,y,m={})=>castWrap(x,y,1,'chime',esc(m.name||'Hello')+'!',person(m)),
  pet:(x,y,m={})=>castWrap(x,y,1,m.type==='cat'?'meow':'woof',SAYS[m.type]||SAYS.dog,pet(m)),
  lovey:(x,y,m={})=>castWrap(x,y,1,'squish',esc(m.name||'Lovey')+'!',lovey(m))
});
sfx.woof=()=>{ [0,.2].forEach(d=>voice(330,200,.13,{type:'sawtooth',lp:900,vol:.09,delay:d})); };
sfx.meow=()=>{ voice(520,820,.18,{type:'triangle',lp:2200,vol:.08}); voice(820,480,.32,{type:'triangle',lp:2200,vol:.08,delay:.18}); };
sfx.squish=()=>{ tone(320,180,.18,'sine',.14); tone(600,900,.12,'sine',.08,.16); };
