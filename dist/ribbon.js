// The Blue Nebula ribbon, v2.
// A shaded 3D ribbon that resolves into the four product layers. Point math: nebula-core.mjs (unit tested).
//  - responsive layout (split beside the copy on wide screens, above it on narrow ones)
//  - lit faces with depth fog, additive glow particles, stardust parallax
//  - drag to rotate with inertia, click for a ripple, hover repels the surface
//  - layers get their own colour and drawn content; hover or choose a layer to focus it
//  - frame-rate independent motion, adaptive quality, pauses when hidden
import {createNebulaPoints,nebulaPoint,resolveNebulaMode} from './nebula-core.mjs';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const easeOut=t=>1-Math.pow(1-clamp(t,0,1),4);
const LAYERS=[{name:'MEMORY',hue:158},{name:'DESIGN',hue:212},{name:'CODE',hue:226},{name:'CHECKS',hue:38}];
const LIGHT=(()=>{const x=-.35,y=-.55,z=-.76,l=Math.hypot(x,y,z);return[x/l,y/l,z/l]})();

export function createRibbon(canvas,opts={}){
  const {host,wrap=host,modes=[],items=[],enter=false,reverse=false,layout='split',labels=true,interactive=true,scaleMul=1,onFocus=()=>{}}=opts;
  const ctx=canvas.getContext('2d');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),compact=matchMedia('(max-width:760px)'),fine=matchMedia('(pointer:fine)');
  let points=createNebulaPoints(compact.matches?1152:2304);
  const build=()=>points.flatMap((p,i)=>i<points.length-49&&i%48<47&&p.layer===points[i+49].layer?[{i,z:0}]:[]);
  let faces=build();
  const dust=Array.from({length:70},(_,i)=>({x:(i*97%100)/100,y:(i*53%100)/100,z:.2+(i*31%100)/140,s:.6+(i%5)*.35}));

  let W=1,H=1,dpr=1,progress=0,target=0,manual=null,manualOrigin=scrollY;
  let intro=(enter||reverse)?1:0,raf=0,last=0,clock=0,visible=true,paused=false,lastLayered=null,capped=false,slowFrames=0,frames=0,lastPaint=0;
  const ptr={x:-1e4,y:-1e4,nx:0,ny:0,on:false};let px=0,py=0;
  let yawE=0,pitchE=0,yawV=0,pitchV=0,dragging=null,moved=0,idleT=0;
  let pulses=[],hover=-1,locked=-1,quads=[];

  const active=()=>visible&&!document.hidden&&!paused&&!reduced.matches;

  /* ---------- scroll + mode ---------- */
  function readScroll(){
    const r=wrap.getBoundingClientRect(),travel=Math.max(1,wrap.offsetHeight-innerHeight);
    let raw=enter?clamp((innerHeight*.95-r.top)/(innerHeight*.75),0,1):clamp(-r.top/travel,0,1)*1.7;
    if(reverse)raw=1-clamp(raw*1.25,0,1);
    const s=resolveNebulaMode({manual,origin:manualOrigin,scroll:scrollY,progress:raw,scrollDriven:!reduced.matches});
    manual=s.manual;target=s.target;
  }
  const setManual=v=>{manual=v;target=v;manualOrigin=scrollY;if(!active()){progress=target;paint()}else start()};

  /* ---------- layout: where the ribbon lives ---------- */
  function place(){
    let cx,cy,sc;
    if(layout==='center'){cx=W/2;cy=H*.5;sc=Math.min(W*.2,H*.28)*scaleMul}
    else if(W>=900){cx=W*.71;cy=H*.52;sc=Math.min(W*.155,H*.2)}
    else{cx=W/2;cy=H*.26;sc=Math.min(W*.2,H*.105)}
    return{cx,cy,sc:sc*lerp(1,.88,ease(progress))*lerp(.78,1,easeOut(intro))};
  }

  /* ---------- geometry ---------- */
  const rot=(p)=>{ // extra user rotation on top of the core's
    let[x,y,z]=p;
    if(intro<1){const k=1-easeOut(intro),a=k*1.1,c=Math.cos(a),s=Math.sin(a);[x,z]=[x*c+z*s,-x*s+z*c];const b=k*-.35,c2=Math.cos(b),s2=Math.sin(b);[y,z]=[y*c2-z*s2,y*s2+z*c2]}
    if(yawE){const c=Math.cos(yawE),s=Math.sin(yawE);[x,z]=[x*c+z*s,-x*s+z*c]}
    if(pitchE){const c=Math.cos(pitchE),s=Math.sin(pitchE);[y,z]=[y*c-z*s,y*s+z*c]}
    return[x,y,z];
  };
  function paint(){
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
    const L=place(),frame={progress,time:clock,pointerX:px*.5,pointerY:py*.5},m=ease((progress-.2)/.7),focus=hover>=0?hover:locked;
    const P3=new Array(points.length),S=new Array(points.length);
    for(let i=0;i<points.length;i++){
      const q=rot(nebulaPoint(points[i],frame));P3[i]=q;
      const per=5.8/(5.8+clamp(q[2],-4,4));
      let x=L.cx+q[0]*L.sc*per,y=L.cy+q[1]*L.sc*per;
      if(ptr.on&&!dragging&&interactive){const dx=x-ptr.x,dy=y-ptr.y,d2=dx*dx+dy*dy;if(d2<17000&&d2>1){const d=Math.sqrt(d2),f=Math.pow(1-d/130,2)*24;x+=dx/d*f;y+=dy/d*f}}
      for(const pu of pulses){const dx=x-pu.x,dy=y-pu.y,d=Math.hypot(dx,dy)||1,g=Math.exp(-Math.pow((d-pu.t*520)/46,2))*22*Math.exp(-pu.t*1.4);x+=dx/d*g;y+=dy/d*g}
      S[i]={x,y,d:per,z:q[2]};
    }
    /* stardust, behind everything */
    if(!capped){ctx.globalCompositeOperation='lighter';
      for(const s of dust){const x=((s.x*W+px*-26*s.z+clock*4*s.z)%W+W)%W,y=((s.y*H+py*-18*s.z)%H+H)%H;ctx.fillStyle=`rgba(150,190,255,${.12+.2*s.z})`;ctx.fillRect(x,y,s.s,s.s)}
      ctx.globalCompositeOperation='source-over'}
    /* lit faces, far to near */
    for(const f of faces)f.z=(S[f.i].z+S[f.i+49].z)*.5;
    faces.sort((a,b)=>b.z-a.z);
    for(const f of faces){
      const i=f.i,a=P3[i],b=P3[i+1],c=P3[i+49],e=P3[i+48];
      const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=e[0]-a[0],vy=e[1]-a[1],vz=e[2]-a[2];
      let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;
      const lit=Math.abs(nx*LIGHT[0]+ny*LIGHT[1]+nz*LIGHT[2]),rim=1-Math.abs(nz),layer=points[i].layer;
      const hue=lerp(212+rim*10,LAYERS[layer].hue,m);
      let alpha=(.94-progress*.42)*clamp(1.12-f.z*.2,.35,1);
      if(focus>=0&&m>.5)alpha*=layer===focus?1:lerp(1,.22,m);
      const lum=16+lit*44+rim*14+(layer===focus&&m>.5?10:0);
      ctx.beginPath();ctx.moveTo(S[i].x,S[i].y);ctx.lineTo(S[i+1].x,S[i+1].y);ctx.lineTo(S[i+49].x,S[i+49].y);ctx.lineTo(S[i+48].x,S[i+48].y);ctx.closePath();
      ctx.fillStyle=`hsla(${hue},82%,${lum}%,${alpha})`;ctx.fill();
    }
    /* glowing grain + fine contour lines (additive) */
    ctx.globalCompositeOperation='lighter';
    if(!capped){ctx.beginPath();
      for(let i=0;i<S.length;i++){if(i%48>43||Math.floor(i/48)%3!==0)continue;const a=S[i],b=S[i+4];if(!b||points[i].layer!==points[i+4].layer)continue;ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y)}
      ctx.strokeStyle='rgba(140,190,255,.13)';ctx.lineWidth=.7;ctx.stroke()}
    const size=(compact.matches?.95:1.2),stride=capped?2:1;
    for(let i=0;i<S.length;i+=stride){const p=S[i],layer=points[i].layer;
      if(focus>=0&&m>.5&&layer!==focus)continue;
      const a=clamp(.7-p.z*.22,.15,.95);ctx.fillStyle=`hsla(${lerp(205,LAYERS[layer].hue,m)},90%,${72+(layer===focus?10:0)}%,${a*.8})`;ctx.fillRect(p.x,p.y,size*p.d,size*p.d)}
    ctx.globalCompositeOperation='source-over';
    /* layered state: drawn content + labels + hit areas */
    quads=[];
    const la=clamp((progress-.62)/.38,0,1);
    if(la>0){
      for(let li=0;li<4;li++){
        const cs=[[-.5,-.5],[.5,-.5],[-.5,.5],[.5,.5]].map(([gx,gy])=>{const q=rot(nebulaPoint({u:0,v:0,layer:li,gridX:gx,gridY:gy},frame)),per=5.8/(5.8+clamp(q[2],-4,4));return{x:L.cx+q[0]*L.sc*per,y:L.cy+q[1]*L.sc*per}});
        quads[li]=cs;const dim=focus>=0&&li!==focus?.3:1;
        drawContent(li,cs,la*dim,li===focus);
        if(labels){ctx.font='600 11px ui-monospace,Menlo,Consolas,monospace';ctx.textAlign='left';ctx.textBaseline='bottom';ctx.fillStyle=`hsla(${LAYERS[li].hue},90%,82%,${la*dim})`;ctx.fillText(`0${li+1}  ${LAYERS[li].name}`,cs[0].x,cs[0].y-10)}
      }
    }
    // ripple rings
    for(const pu of pulses){ctx.strokeStyle=`rgba(160,205,255,${.4*Math.exp(-pu.t*1.8)})`;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(pu.x,pu.y,pu.t*520,0,6.283);ctx.stroke()}
    const layered=progress>.55,sel=manual??(layered?1:0);
    modes.forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.mode)===sel));
    if(layered!==lastLayered){lastLayered=layered;host.classList.toggle('is-layered',layered)}
    host.style.setProperty('--p',progress.toFixed(3));
  }
  /* affine unit-square -> layer quad, so content follows the layer's perspective */
  function drawContent(li,cs,alpha,focused){
    const O=cs[0],Ux=cs[1].x-O.x,Uy=cs[1].y-O.y,Vx=cs[2].x-O.x,Vy=cs[2].y-O.y,k=1/((Math.hypot(Ux,Uy)+Math.hypot(Vx,Vy))/2||1);
    const h=LAYERS[li].hue,ink=`hsla(${h},90%,${focused?86:78}%,${.62*alpha})`,fill=`hsla(${h},85%,60%,${.4*alpha})`,ARX=1.68;
    ctx.save();ctx.transform(Ux,Uy,Vx,Vy,O.x,O.y);ctx.lineWidth=1.3*k;ctx.strokeStyle=ink;ctx.fillStyle=fill;ctx.lineCap='round';ctx.lineJoin='round';
    const rr=(x,y,w,hh,r=.02)=>{ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,hh,r):ctx.rect(x,y,w,hh)};
    const ell=(cx,cy,rx)=>{ctx.beginPath();ctx.ellipse(cx,cy,rx,rx*ARX,0,0,6.283)};
    if(li===0){for(let i=0;i<5;i++){const y=.12+i*.17;rr(.08,y,.84,.11);ctx.stroke();ell(.15,y+.055,.02);ctx.fill();ctx.beginPath();ctx.moveTo(.23,y+.055);ctx.lineTo(.45+(i*37%30)/100,y+.055);ctx.stroke()}}
    if(li===1){rr(.08,.1,.84,.46,.03);ctx.stroke();ell(.24,.33,.07);ctx.fill();ctx.beginPath();ctx.moveTo(.42,.26);ctx.lineTo(.8,.26);ctx.moveTo(.42,.38);ctx.lineTo(.68,.38);ctx.stroke();rr(.08,.68,.34,.16,.03);ctx.fill();ctx.stroke()}
    if(li===2){const W2=[.6,.45,.7,.35,.55,.4,.65,.3];ctx.lineWidth=2.4*k;for(let i=0;i<8;i++){const y=.1+i*.105,ind=[0,.06,.06,.12,.06,.12,.06,0][i];ctx.beginPath();ctx.moveTo(.08+ind,y);ctx.lineTo(.08+ind+W2[i]*.8,y);ctx.stroke()}}
    if(li===3){for(let i=0;i<4;i++){const x=.18+i*.21;ell(x,.3,.06);ctx.stroke();ctx.beginPath();ctx.moveTo(x-.028,.3);ctx.lineTo(x-.006,.3+.03*ARX);ctx.lineTo(x+.035,.3-.04*ARX);ctx.stroke()}rr(.08,.68,.84,.1,.03);ctx.stroke();rr(.08,.68,.84*(.55+.1*Math.sin(clock)),.1,.03);ctx.fill()}
    if(focused){ctx.lineWidth=2*k;ctx.strokeStyle=`hsla(${h},95%,80%,${.9*alpha})`;rr(0,0,1,1,.03);ctx.stroke()}
    ctx.restore();
  }

  /* ---------- loop ---------- */
  function update(dt){
    clock+=dt;if(intro<1)intro=Math.min(1,intro+dt/2.4);progress+=(target-progress)*(1-Math.exp(-dt*6.5));
    px+=(ptr.nx-px)*(1-Math.exp(-dt*5));py+=(ptr.ny-py)*(1-Math.exp(-dt*5));
    if(!dragging){yawE+=yawV*dt;pitchE+=pitchV*dt;yawV*=Math.exp(-dt*2.6);pitchV*=Math.exp(-dt*2.6);idleT+=dt;
      if(idleT>1.2){const r=1-Math.exp(-dt*.9);yawE-=yawE*r;pitchE-=pitchE*r}}
    pulses.forEach(p=>p.t+=dt);pulses=pulses.filter(p=>p.t<2.2);
  }
  function frame(now){
    raf=0;if(!active())return;
    const dt=Math.min(.05,(now-last)/1000||.016);last=now;
    // adaptive quality: after ~40 slow frames drop to 30fps, lighter drawing, lower resolution
    if(++frames>20&&!capped){if(dt>.028)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);if(slowFrames>40){capped=true;dpr=1;resize(true)}}
    if(capped&&now-lastPaint<32){raf=requestAnimationFrame(frame);return}
    lastPaint=now;update(dt);paint();raf=requestAnimationFrame(frame);
  }
  const start=()=>{if(active()&&!raf){last=performance.now();raf=requestAnimationFrame(frame)}};
  const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0};
  function resize(keepDpr){
    const r=canvas.getBoundingClientRect();W=Math.max(1,r.width);H=Math.max(1,r.height);
    if(!keepDpr)dpr=Math.min(devicePixelRatio||1,capped?1:1.75);
    canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);readScroll();if(!active()){progress=target;intro=1}paint();start();
  }

  /* ---------- controls ---------- */
  modes.forEach(b=>b.addEventListener('click',()=>setManual(Number(b.dataset.mode))));
  const sync=()=>{const f=hover>=0?hover:locked;items.forEach((b,k)=>b.classList.toggle('on',k===f));onFocus(f)};
  items.forEach((b,k)=>b.addEventListener('click',()=>{locked=locked===k?-1:k;if(locked>=0&&target<.95)setManual(1);sync();if(!active())paint()}));
  items.forEach((b,k)=>{b.addEventListener('pointerenter',()=>{hover=k;sync()});b.addEventListener('pointerleave',()=>{hover=-1;sync()})});
  if(interactive&&fine.matches&&!reduced.matches){
    const inside=(q,x,y)=>{let c=false;for(let i=0,j=3;i<4;j=i++){const a=q[[0,1,3,2][i]],b=q[[0,1,3,2][j]];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)c=!c}return c};
    canvas.style.cursor='grab';
    canvas.addEventListener('pointermove',e=>{
      const r=canvas.getBoundingClientRect();ptr.x=e.clientX-r.left;ptr.y=e.clientY-r.top;ptr.nx=ptr.x/r.width*2-1;ptr.ny=ptr.y/r.height*2-1;ptr.on=true;
      if(dragging){const dx=e.clientX-dragging.x,dy=e.clientY-dragging.y;moved+=Math.abs(dx)+Math.abs(dy);yawV=dx*.28;pitchV=dy*.18;yawE=clamp(yawE+dx*.0065,-1.3,1.3);pitchE=clamp(pitchE+dy*.0045,-.7,.7);dragging.x=e.clientX;dragging.y=e.clientY;idleT=0}
      else if(quads.length&&progress>.75){let h=-1;for(let i=3;i>=0;i--)if(quads[i]&&inside(quads[i],ptr.x,ptr.y)){h=i;break}if(h!==hover){hover=h;sync()}}
      if(!active())paint();
    });
    canvas.addEventListener('pointerleave',()=>{ptr.on=false;ptr.nx=ptr.ny=0;if(hover!==-1){hover=-1;sync()}});
    canvas.addEventListener('pointerdown',e=>{dragging={x:e.clientX,y:e.clientY};moved=0;yawV=pitchV=0;canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing'});
    const up=e=>{if(!dragging)return;if(moved<6){const r=canvas.getBoundingClientRect();pulses.push({x:e.clientX-r.left,y:e.clientY-r.top,t:0});if(pulses.length>3)pulses.shift()}dragging=null;canvas.style.cursor='grab';start()};
    canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',()=>{dragging=null;canvas.style.cursor='grab'});
    canvas.style.touchAction='pan-y';
  }
  addEventListener('scroll',()=>{readScroll();if(!active()){progress=target;paint()}else start()},{passive:true});
  new ResizeObserver(()=>resize()).observe(canvas);
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;visible?(readScroll(),start()):stop()}).observe(host);
  document.addEventListener('visibilitychange',()=>{document.hidden?stop():start()});
  reduced.addEventListener('change',()=>{stop();readScroll();progress=target;paint();start()});
  compact.addEventListener('change',()=>{points=createNebulaPoints(compact.matches?1152:2304);faces=build();resize()});
  resize();
  return{pause(v){paused=v;v?stop():start()},focus(i){locked=i;sync();paint()},mode:setManual};
}
