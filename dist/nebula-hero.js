import {createNebulaPoints,nebulaPoint,projectNebulaPoint,resolveNebulaMode} from './nebula-core.mjs';

/** One visible-only canvas, capped at 30 paints/second and 2,304 points. */
export function initNebulaHero(){
  if(document.body.hasAttribute('data-prototype-page'))return {setPaused(){}};
  const hero=document.querySelector('.startup-hero');if(!hero)return {setPaused(){}};
  document.body.classList.add('nebula-home');hero.classList.add('nebula-hero');
  const pin=hero.querySelector('.nebula-pin'),art=hero.querySelector('.nebula-art'),pause=hero.querySelector('.nebula-pause');
  const motion=document.getElementById('motion-toggle');pause.addEventListener('click',()=>motion.click());
  new MutationObserver(()=>{const stopped=motion.getAttribute('aria-pressed')==='true';pause.setAttribute('aria-pressed',stopped);pause.disabled=motion.disabled;pause.setAttribute('aria-label',motion.disabled?'Reduced motion enabled':stopped?'Play hero animation':'Pause hero animation');pause.textContent=stopped?'▷':'Ⅱ';}).observe(motion,{attributes:true,attributeFilter:['aria-pressed','disabled']});
  // The paper study remains available as a supporting concept, without repeating the hero.
  const study=document.getElementById('cinematic'),details=document.querySelector('.product-details');
  if(study&&details){const disclosure=document.createElement('details');disclosure.className='product-disclosure nebula-study';disclosure.innerHTML='<summary><span><b>The workspace, in layers</b><small>Explore the interactive product model.</small></span><i>+</i></summary>';disclosure.append(study);details.append(disclosure);let target;try{target=document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch{}if(target&&(target===study||study.contains(target)))disclosure.open=true;}

  const canvas=art.querySelector('canvas'),ctx=canvas.getContext('2d');
  if(!ctx){art.classList.add('nebula-unavailable');return {setPaused(){}};}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),compact=matchMedia('(max-width:760px)'),fine=matchMedia('(pointer:fine)');
  let points=createNebulaPoints(compact.matches?1152:2304),visible=true,paused=false,blocked=false,raf=0,last=0,clock=0,width=1,height=1,dpr=1;
  const makeFaces=()=>points.flatMap((point,i)=>i<points.length-49&&i%48<47&&point.layer===points[i+49].layer?[{i,z:0,shine:(Math.sin(point.v-.8)+1)*.5}]:[]);
  let faces=makeFaces();
  let progress=0,target=0,manual=null,pointerX=0,pointerY=0,targetX=0,targetY=0,manualOrigin=scrollY;
  let lastLayered=null,lastSelected=null;
  const labels=[...art.querySelectorAll('.nebula-layer-labels>span')],buttons=[...art.querySelectorAll('[data-nebula-mode]')];
  function active(){return visible&&!document.hidden&&!blocked&&!paused&&!reduced.matches;}
  function readScroll(){
    const rect=hero.getBoundingClientRect(),travel=hero.offsetHeight-pin.offsetHeight;
    const state=resolveNebulaMode({manual,origin:manualOrigin,scroll:scrollY,progress:(76-rect.top)/Math.max(1,travel),scrollDriven:!reduced.matches&&!compact.matches});
    manual=state.manual;target=state.target;
  }
  function paint(){
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    const frame={progress,time:clock,pointerX,pointerY};
    const projected=points.map(point=>{const position=nebulaPoint(point,frame);return {...projectNebulaPoint(position,width,height),z:position[2]};});
    for(const face of faces)face.z=(projected[face.i].z+projected[face.i+49].z)*.5;
    faces.sort((a,b)=>b.z-a.z);
    for(const {i,z,shine} of faces){
      const light=35+shine*37-z*4;
      ctx.beginPath();ctx.moveTo(projected[i].x,projected[i].y);ctx.lineTo(projected[i+1].x,projected[i+1].y);ctx.lineTo(projected[i+49].x,projected[i+49].y);ctx.lineTo(projected[i+48].x,projected[i+48].y);ctx.closePath();
      ctx.fillStyle=`hsla(209,76%,${light}%,${.92-progress*.52})`;ctx.fill();
    }
    ctx.beginPath();
    for(let i=0;i<projected.length;i++){
      if(i%48>43||Math.floor(i/48)%3!==0)continue;
      const a=projected[i],b=projected[i+4];if(!b||points[i].layer!==points[i+4].layer)continue;
      ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
    }
    ctx.strokeStyle='rgba(47,120,188,.16)';ctx.lineWidth=.65;ctx.stroke();
    for(const point of projected){
      const alpha=Math.max(.2,Math.min(.85,.54-point.z*.18)),size=(compact.matches?.95:1.12)*point.depth;
      ctx.fillStyle=`rgba(38,119,198,${alpha})`;ctx.fillRect(point.x,point.y,size,size);
    }
    labels.forEach((label,layer)=>{const center=nebulaPoint({u:0,v:0,layer,gridX:0,gridY:-.65},{...frame,progress:1});const screen=projectNebulaPoint(center,width,height);label.style.left=screen.x+'px';label.style.top=screen.y+'px';label.style.opacity=Math.max(0,(progress-.6)/.4);});
    const layered=progress>.55,selected=manual??(layered?1:0);
    if(selected!==lastSelected){buttons.forEach(button=>button.setAttribute('aria-pressed',Number(button.dataset.nebulaMode)===selected));lastSelected=selected;}
    if(layered!==lastLayered){art.querySelector('.nebula-caption').textContent=layered?'Memory. Design. Code. Checks.':'One project. Every layer connected.';lastLayered=layered;}
    hero.style.setProperty('--nebula-progress',progress);
  }
  function tick(now){
    raf=0;if(!active())return;
    if(now-last>=1000/30){const dt=Math.min(.08,(now-last)/1000);last=now;clock+=dt;progress+=(target-progress)*.13;pointerX+=(targetX-pointerX)*.09;pointerY+=(targetY-pointerY)*.09;paint();}
    raf=requestAnimationFrame(tick);
  }
  function start(){if(active()&&!raf){last=performance.now();raf=requestAnimationFrame(tick);}}
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;}
  function resize(){
    const rect=art.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,canvas.clientHeight);
    dpr=Math.min(devicePixelRatio||1,1.6);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    readScroll();if(!active())progress=target;paint();start();
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{manual=Number(button.dataset.nebulaMode);target=manual;manualOrigin=scrollY;buttons.forEach(item=>item.setAttribute('aria-pressed',item===button));if(!active()){progress=target;paint();}else start();}));
  if(fine.matches){art.addEventListener('pointermove',event=>{if(!active())return;const r=art.getBoundingClientRect();targetX=(event.clientX-r.left)/r.width*2-1;targetY=(event.clientY-r.top)/r.height*2-1;});art.addEventListener('pointerleave',()=>{targetX=targetY=0;});}
  window.addEventListener('scroll',()=>{readScroll();start();},{passive:true});
  new ResizeObserver(resize).observe(art);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){readScroll();start();}else stop();}).observe(pin);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
  document.addEventListener('bn:workspace-visibility',event=>{blocked=!!event.detail?.open;if(blocked)stop();else start();});
  reduced.addEventListener('change',()=>{stop();readScroll();progress=target;paint();start();});
  compact.addEventListener('change',()=>{points=createNebulaPoints(compact.matches?1152:2304);faces=makeFaces();resize();});
  resize();
  return {setPaused(value){paused=value;if(value)stop();else start();}};
}
