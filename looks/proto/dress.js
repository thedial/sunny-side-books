/* shared by the look prototypes: lay costume parts behind and in front of a piece, inside its wobble group
   (the engine wraps each piece in shadow and breathing groups, so the end of the piece is found by matching tags) */
const dress=(fn,behind,front)=>(x,y,...a)=>{ const s=fn(x,y,...a), m=/<g class="anim"[^>]*>/.exec(s); if(!m) return s;
  const open=m.index+m[0].length, re=/<g[\s>]|<\/g>/g; re.lastIndex=open; let d=1, t;
  while(d&&(t=re.exec(s))) d+=t[0]==='</g>'?-1:1;
  const close=t?t.index:s.length;
  return s.slice(0,open)+(behind?behind(...a):'')+s.slice(open,close)+(front?front(...a):'')+s.slice(close); };
