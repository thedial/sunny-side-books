const TABLES=/*TABLES*/;
const OUT='#1d1a17';
/* print palette: the kit's toy-bright colors mapped to the screenprint look of Scott's art */
const PAL={'#fff':'#f5eddb','#ffb3c1':'#eba891','#ff8fa6':'#d9826f','#e8382f':'#c9432f','#e2412f':'#c9432f','#d6402f':'#b8432f','#f2a03d':'#e08a3c','#f2903d':'#e08a3c',
 '#ffd23f':'#f0c055','#ffe14d':'#f3cf5f','#6cc04a':'#86a95a','#5ab4e0':'#4f9c9b','#8fd3f4':'#a6cfc4','#4fae46':'#6a9650','#5fa832':'#6a9650','#8fd14f':'#9ab765',
 '#2f8f4e':'#3f7a55','#7cc242':'#8fae5a','#6ab33a':'#7c9d4d','#a5d86b':'#a9c27a','#b7e08a':'#b3c985','#9b6a3c':'#8c6440','#f0c34f':'#e3bd62','#c8962a':'#b98a3c',
 '#f5e3c0':'#efe2c4','#ff7eb6':'#e58a8a','#9b7cff':'#8d86c6','#ff9a3d':'#e38a45','#a9dcf0':'#9fcfc6','#bfe6ff':'#b2d8cc','#1d2b53':'#183847','#2f5d3a':'#2f5a45',
 '#b8492f':'#a8472f','#9c3a24':'#8c3a26','#d9b26a':'#cfae6c','#ff9a8a':'#e9907a','#fffdf4':'#f7f0de','#c99b5f':'#bf9562','#b8b2a7':'#aaa597','#fff3b0':'#f4e3a6','#6cbf6a':'#7aa860'};
const recolor=str=>str.replace(/#[0-9a-fA-F]{3,6}(?=["';)])/g,m=>PAL[m.toLowerCase()]||m);
const $=id=>document.getElementById(id);
const S=(w=6)=>`stroke="${OUT}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
let ac=null;
function ctx(){ if(!ac){ try{ ac=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(ac&&ac.state==='suspended') ac.resume(); return ac; }
let muted=false, _bus=null;
function soundBus(a){ if(!_bus){ _bus=a.createGain(); _bus.gain.value=TABLES.sound.masterGain; _bus.connect(a.destination); } return _bus; }
function tone(f0,f1,dur,type='sine',vol=.22,delay=0){ const a=ctx(); if(!a||muted) return; const t=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();
  o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(f1,30),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g).connect(soundBus(a));o.start(t);o.stop(t+dur+.02); }
const sfx={pop:()=>tone(700,250,.12),boing:()=>{tone(220,520,.15);tone(520,180,.35,'sine',.18,.15)},
  chime:()=>[660,880,1320].forEach((f,i)=>tone(f,f,.25,'triangle',.16,i*.09)),page:()=>tone(1400,600,.12,'triangle',.08),
  fanfare:()=>[523,659,784,1047].forEach((f,i)=>tone(f,f,.22,'square',.08,i*.13))};
/* soft, short sound effects; the parent does the reading */
let _nb=null;
function noise(dur,{type='bandpass',f=1000,f2=null,q=1,vol=.12,delay=0}={}){ const a=ctx(); if(!a||muted) return; const t=a.currentTime+delay;
  if(!_nb){ _nb=a.createBuffer(1,a.sampleRate*2,a.sampleRate); const d=_nb.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; }
  const src=a.createBufferSource(); src.buffer=_nb; const fl=a.createBiquadFilter(); fl.type=type; fl.frequency.setValueAtTime(f,t); if(f2) fl.frequency.exponentialRampToValueAtTime(f2,t+dur); fl.Q.value=q;
  const g=a.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.001,t+dur); src.connect(fl).connect(g).connect(soundBus(a)); src.start(t,Math.random()); src.stop(t+dur+.02); }
function voice(f0,f1,dur,{type='sawtooth',lp=900,vib=0,vol=.1,delay=0}={}){ const a=ctx(); if(!a||muted) return; const t=a.currentTime+delay;
  const o=a.createOscillator(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  if(vib){ const l=a.createOscillator(), lg=a.createGain(); l.frequency.value=vib; lg.gain.value=f0*.04; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t+dur); }
  const fl=a.createBiquadFilter(); fl.type='lowpass'; fl.frequency.value=lp; const g=a.createGain();
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.04); g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(fl).connect(g).connect(soundBus(a)); o.start(t); o.stop(t+dur+.02); }
const SOUND={
  cow:()=>voice(150,105,1.0,{lp:650,vib:4,vol:.13}),
  pig:()=>[0,.18].forEach(d=>{voice(230,150,.13,{type:'square',lp:800,vol:.07,delay:d});noise(.12,{type:'lowpass',f:500,vol:.08,delay:d});}),
  duck:()=>[0,.2].forEach(d=>voice(560,400,.15,{lp:1600,vol:.07,delay:d})),
  hen:()=>{[0,.1,.2].forEach(d=>voice(720,560,.07,{type:'square',lp:1800,vol:.05,delay:d}));voice(950,620,.25,{type:'square',lp:1800,vol:.05,delay:.34});},
  chick:()=>[0,.16].forEach(d=>tone(2200,3000,.08,'sine',.1,d)),
  egg:()=>[0,.18].forEach(d=>tone(2000,2600,.06,'sine',.06,d)),
  frog:()=>[0,.12].forEach(d=>voice(190,170,.06,{type:'square',lp:700,vol:.09,delay:d})),
  bunny:()=>tone(900,1300,.1,'triangle',.08),
  barn:()=>{voice(90,140,.6,{lp:500,vol:.06});[.7,.82].forEach(d=>tone(3000,3600,.08,'sine',.07,d));},
  hay:()=>{noise(.3,{f:2500,q:.7,vol:.05});[.5,.62].forEach(d=>tone(3000,3600,.08,'sine',.07,d));},
  tree:()=>{noise(.5,{f:2600,q:.6,vol:.06});[0,.12,.3,.45].forEach(d=>tone(2600,3400,.07,'sine',.07,d+.1));},
  pine:()=>SOUND.tree(),
  cloud:()=>{for(let k=0;k<14;k++) noise(.03,{f:3500,q:2,vol:.08,delay:Math.random()*1.1});},
  flower:()=>[1800,2400,3200].forEach((f,i)=>tone(f,f,.12,'triangle',.05,i*.06)),
  pond:()=>noise(.5,{type:'highpass',f:2500,f2:600,vol:.1}),
  rock:()=>voice(120,90,.15,{type:'square',lp:400,vol:.08}),
  potato:()=>voice(160,120,.15,{type:'square',lp:500,vol:.07}),
  sun:()=>[1200,1600].forEach((f,i)=>tone(f,f,.15,'triangle',.06,i*.1)),
  scarecrow:()=>noise(.4,{f:1800,q:.6,vol:.05}),
  mouse:()=>[0,.12].forEach(d=>tone(3000,3600,.08,'sine',.07,d)), bunny:()=>tone(900,1300,.1,'triangle',.08), beeBig:()=>buzz(), hive:()=>{buzz();later(buzz,250);}, butterfly:()=>[1800,2400,3000].forEach((f,i)=>tone(f,f,.1,'triangle',.05,i*.08)),
  fish:()=>blub(), octopus:()=>noise(.6,{type:'lowpass',f:700,f2:200,vol:.12}), turtle:()=>tone(300,220,.4,'sine',.08),
  crab:()=>[0,.1,.2,.3].forEach(d=>noise(.03,{type:'highpass',f:3000,vol:.12,delay:d})), seahorse:()=>[1200,1600].forEach((f,i)=>tone(f,f,.15,'triangle',.06,i*.1)),
  jelly:()=>[2000,2400,2800,3200].forEach((f,i)=>tone(f,f,.15,'sine',.04,i*.06)), whale:()=>voice(140,90,1.4,{type:'sine',lp:600,vib:3,vol:.12}),
  clam:()=>{tone(400,200,.1,'sine',.1);[1600,2400].forEach((f,i)=>tone(f,f,.2,'triangle',.06,.3+i*.1));}, coral:()=>blub(), kelp:()=>noise(.4,{f:1200,q:.5,vol:.05}),
};
sfx.page=()=>noise(.22,{type:'highpass',f:3000,f2:1200,vol:.06});
sfx.sparkle=()=>[2400,3200].forEach((f,i)=>tone(f,f,.08,'triangle',.04,i*.05));

