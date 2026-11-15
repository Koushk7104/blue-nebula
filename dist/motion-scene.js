import { createMorphPoints, morphPoint, sceneFrame } from './motion-core.mjs';

/** One adaptive loop drives geometry, chapter typography, and scroll transforms. */
export function initMotionScene(canvas){
  const root=canvas?.closest('.cinematic'),ctx=canvas?.getContext('2d',{alpha:false});
  if(!root||!ctx)return {setPaused(){}};
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const intro=root.querySelector('.scene-intro'),chapters=[...root.querySelectorAll('.scene-chapter')],nav=[...root.querySelectorAll('[data-scene-jump]')];
  let w=0,h=0,points=[],raf=0,visible=true,paused=false,blocked=false,dirty=true,last=0,time=0,progress=0,px=0,py=0,tx=0,ty=0;
  let geometry=sceneFrame(0);
  const dust=Array.from({length:95},(_,i)=>({x:((i*197+43)%997)/997,y:((i*311+19)%991)/991,r:i%9===0?1:.45}));
  const fibers=Array.from({length:42},(_,j)=>Array.from({length:116},(_,i)=>{const u=i/115*Math.PI*2,v=j/42*Math.PI*2;return [(1+.35*Math.cos(v+u*.6))*Math.cos(u),(1+.35*Math.cos(v+u*.6))*Math.sin(u),.35*Math.sin(v+u*.6)];}));
  function readProgress(){
    const r=root.getBoundingClientRect(),distance=root.offsetHeight-canvas.clientHeight;
    progress=Math.max(0,Math.min(1,-r.top/Math.max(1,distance)));
    geometry=sceneFrame(progress);root.style.setProperty('--scene-progress',progress);
    root.style.setProperty('--layer-progress',geometry.morph);root.dataset.chapter=progress<.2?'intro':progress<.65?'layers':'connected';
    const opacity=[geometry.intro,geometry.chapterOne,geometry.chapterTwo];
    [intro,...chapters].forEach((el,i)=>{el.style.opacity=media.matches?1:opacity[i];el.style.transform=`translate3d(0,${(1-opacity[i])*22}px,0)`;el.style.visibility=media.matches||opacity[i]>.02?'visible':'hidden';el.inert=!media.matches&&opacity[i]<.5;});
    const active=progress<.2?0:progress<.65?1:2;nav.forEach((b,i)=>b.setAttribute('aria-current',String(i===active)));
    root.querySelector('.scene-current').textContent=`0${active+1}`;
  }
  function draw(){
    const f=media.matches?sceneFrame(0):geometry;
    ctx.fillStyle='#05080f';ctx.fillRect(0,0,w,h);
    const short=h<430,cx=w*.5,cy=h*(.49-f.morph*(short?.3:.26)),unit=Math.min(w*.36,h*.59)*(w<650?1-f.morph*.3:f.scale)*(1-(short?f.morph*.2:0));
    const az=-.29+time*.075*(1-f.morph),ay=f.yaw+px*.09,ax=f.pitch+py*.06;
    const ca=Math.cos(ay),sa=Math.sin(ay),cb=Math.cos(ax),sb=Math.sin(ax),cc=Math.cos(az),sc=Math.sin(az);
    function project(x,y,z){const xx=x*ca+z*sa,zz=-x*sa+z*ca,yy=y*cb-zz*sb,depth=y*sb+zz*cb;const k=4.6/(4.6-depth*.35);return [cx+(xx*cc-yy*sc)*unit*k,cy+(xx*sc+yy*cc)*unit*k,depth];}
    const halo=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.min(w,h)*.8);halo.addColorStop(0,`rgba(23,69,143,${.3-f.morph*.17})`);halo.addColorStop(.45,'rgba(13,39,88,.17)');halo.addColorStop(1,'rgba(5,8,15,0)');ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='lighter';
    for(const d of dust){const drift=paused||media.matches?0:time*.8;ctx.fillStyle='rgba(113,172,250,.36)';ctx.beginPath();ctx.arc((d.x*w+drift)%w,d.y*h,d.r,0,Math.PI*2);ctx.fill();}
    if(f.morph<.99){
      for(let j=0;j<fibers.length;j++){
        ctx.beginPath();fibers[j].forEach((v,i)=>{const p=project(...v);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);});
        ctx.strokeStyle=`rgba(${49+j%5*10},${131+j%7*10},255,${(.24+(j%9===0?.32:0))*(1-f.morph)})`;ctx.lineWidth=j%9===0?1.3:.65;ctx.stroke();
      }
    }
    if(f.morph>.02){
      const names=['PROJECT MEMORY','EDITABLE CANVAS','CONNECTED CODE','VISIBLE EVIDENCE'];
      for(let layer=0;layer<4;layer++){
        const get=(u,v)=>project(...morphPoint({x:0,y:0,z:0,u,v,layer},{...f,morph:1}));
        const corners=[get(-.5,-.5),get(.5,-.5),get(.5,.5),get(-.5,.5)];
        ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=`rgba(14,38,71,${f.morph*.23})`;ctx.fill();ctx.lineWidth=1;ctx.strokeStyle=`rgba(110,181,255,${f.morph*.65})`;ctx.stroke();
        const a=get(-.45,-.39),b=get(.45,-.39);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle=`rgba(101,163,241,${f.morph*.3})`;ctx.stroke();
        const tag=get(-.43,-.44);ctx.font=`${Math.max(5,Math.min(9,w/150))}px Consolas,monospace`;ctx.fillStyle=`rgba(173,210,255,${f.morph*.9})`;ctx.fillText(names[layer],tag[0],tag[1]);
        for(let row=0;row<7;row++){
          const v=-.28+row*.086,len=layer===1?(row<2?.33:.2):.24+(Math.sin(row*5+layer)+1)*.11;
          const left=get(-.39,v),right=get(-.39+len*1.7,v);
          ctx.beginPath();ctx.moveTo(left[0],left[1]);ctx.lineTo(right[0],right[1]);ctx.lineWidth=layer===1&&row<2?4:1.7;ctx.strokeStyle=`rgba(${layer===2?'132,176,255':layer===3?'105,214,188':'102,167,250'},${f.morph*(row%3===0?.75:.26)})`;ctx.stroke();
          if(layer===0||layer===3){const dot=get(.36,v);ctx.beginPath();ctx.arc(dot[0],dot[1],layer===3?1.4:.8,0,Math.PI*2);ctx.fillStyle=`rgba(136,210,255,${f.morph*.8})`;ctx.fill();}
        }
      }
    }
    for(let i=0;i<points.length;i++){
      const v=points[i],p=project(...morphPoint(v,f)),a=v.alpha*(.35+(p[2]+1.5)/4);
      ctx.fillStyle=`rgba(${93+v.layer*18},${162+v.layer*12},255,${a})`;ctx.beginPath();ctx.arc(p[0],p[1],v.size*(w<650?.68:1),0,Math.PI*2);ctx.fill();
    }
    for(let i=0;i<5;i++){
      const a=time*.23+i*Math.PI*.4,p=project(Math.cos(a)*1.2*(1-f.morph),Math.sin(a)*1.2*(1-f.morph),Math.sin(a)*.2);
      const gl=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],i===0?30:16);gl.addColorStop(0,`rgba(171,215,255,${.8-f.morph*.6})`);gl.addColorStop(.1,'rgba(63,152,255,.5)');gl.addColorStop(1,'rgba(39,119,255,0)');ctx.fillStyle=gl;ctx.fillRect(p[0]-30,p[1]-30,60,60);
    }
    ctx.globalCompositeOperation='source-over';
  }
  function tick(now){raf=0;if(!visible||document.hidden||blocked)return;if(dirty){readProgress();dirty=false;}
    if(now-last>=32||paused||media.matches){if(!paused&&!media.matches)time+=Math.min((now-last)/1000,.05);px+=(tx-px)*.035;py+=(ty-py)*.035;draw();last=now;}
    if(!paused&&!media.matches)raf=requestAnimationFrame(tick);
  }
  function queue(){dirty=true;if(!raf&&visible&&!document.hidden&&!blocked)raf=requestAnimationFrame(tick);}
  function resize(){const box=canvas.getBoundingClientRect();w=box.width;h=box.height;const dpr=Math.min(devicePixelRatio||1,w<650?1.4:1.25);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);points=createMorphPoints(w<650?1100:2100);queue();}
  function mode(){root.classList.toggle('scene-reduced',media.matches);root.classList.add('scene-enhanced');dirty=true;resize();}
  nav.forEach(b=>b.addEventListener('click',()=>{const fraction=Number(b.dataset.sceneJump);if(media.matches){root.scrollIntoView({behavior:'instant'});return;}const top=root.getBoundingClientRect().top+scrollY;window.scrollTo({top:top+(root.offsetHeight-canvas.clientHeight)*fraction,behavior:paused?'instant':'smooth'});}));
  window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',resize,{passive:true});
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(!visible&&raf){cancelAnimationFrame(raf);raf=0;}else queue();}).observe(root);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}else queue();});media.addEventListener('change',mode);
  document.addEventListener('bn:workspace-visibility',e=>{blocked=!!e.detail?.open;if(blocked&&raf){cancelAnimationFrame(raf);raf=0;}else queue();});
  canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();tx=(e.clientX-r.left)/w-.5;ty=(e.clientY-r.top)/h-.5;});canvas.addEventListener('pointerleave',()=>{tx=ty=0;});
  mode();root.classList.add('scene-ready');
  return {setPaused(value){paused=value;if(raf){cancelAnimationFrame(raf);raf=0;}queue();}};
}
