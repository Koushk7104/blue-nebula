// Paper layers you can drag, rotate and pull apart. Layout math: editorial-core.mjs (shared with the original).
import {sculptureLayout} from './editorial-core.mjs';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

export function initPaperLab(root){
  const art=root.querySelector('.editorial-art'),stack=root.querySelector('.sculpture-stack'),planes=[...root.querySelectorAll('.paper-plane')],picker=[...root.querySelectorAll('[data-paper]')],tour=root.querySelector('#paper-pull'),detail=root.querySelector('#layer-detail');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const captions=['Decisions with their source, scope, and history intact.','Editable objects and shared tokens, connected to their implementation.','Generated files and a readable comparison with your checkpoint.','Named checks, observed results, and reports you can inspect.'];
  let p=0,targetP=0,selected=1,expanded=false,visible=true,raf=0,pitch=0,yaw=0,tPitch=0,tYaw=0,drag=null,spin=0,lastX=0;
  const readScroll=()=>{const r=root.getBoundingClientRect();targetP=reduced.matches?.3:clamp((innerHeight*.9-r.top)/(innerHeight*.8),0,1)*.62};
  function paint(){
    const st=sculptureLayout(p,expanded,selected),scale=Math.min(1.08,(art.clientWidth-30)/620);
    stack.style.transform=`translate(-50%,-50%) scale(${scale}) rotateX(${st.pitch+pitch}deg) rotateZ(${st.yaw+yaw}deg)`;
    planes.forEach((el,i)=>{const s=st.layers[i];el.style.transform=`translate3d(${s.x}px,${s.y}px,${s.z}px) scale(${s.scale})`;el.style.opacity=s.opacity;el.classList.toggle('paper-selected',selected===i)});
    if(tour){tour.setAttribute('aria-pressed',expanded);tour.firstChild.textContent=expanded?'Bring it together ':'Pull it apart '; tour.lastElementChild.textContent=expanded?'−':'+'}
  }
  function tick(){
    raf=0;if(!visible||document.hidden)return;readScroll();
    const k=reduced.matches?1:.14;p+=(targetP-p)*k;pitch+=(tPitch-pitch)*k;yaw+=(tYaw-yaw)*k;
    if(!drag&&Math.abs(spin)>.005){tYaw=clamp(tYaw+spin,-65,65);spin*=.88}
    paint();
    if(Math.abs(targetP-p)>.0005||Math.abs(tPitch-pitch)>.02||Math.abs(tYaw-yaw)>.02||Math.abs(spin)>.005)raf=requestAnimationFrame(tick);
  }
  const queue=()=>{if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(tick)};
  const toggle=()=>{expanded=!expanded;queue()};
  const reset=()=>{tPitch=tYaw=0;spin=0;expanded=false;queue()};
  picker.forEach(b=>b.addEventListener('click',()=>{selected=Number(b.dataset.paper);expanded=true;picker.forEach(x=>x.setAttribute('aria-pressed',x===b));detail.textContent=captions[selected];queue()}));
  tour?.addEventListener('click',toggle);root.querySelector('#reset-sculpture').addEventListener('click',reset);
  art.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag={x:e.clientX,y:e.clientY,pitch:tPitch,yaw:tYaw};lastX=e.clientX;spin=0;art.setPointerCapture(e.pointerId);art.classList.add('is-dragging')});
  art.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(e.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx)+8){drag=null;art.classList.remove('is-dragging');return}
    tYaw=clamp(drag.yaw+dx*.22,-65,65);tPitch=clamp(drag.pitch-dy*.15,-30,22);spin=(e.clientX-lastX)*.07;lastX=e.clientX;queue()});
  const release=e=>{drag=null;art.classList.remove('is-dragging');if(art.hasPointerCapture(e.pointerId))art.releasePointerCapture(e.pointerId);queue()};
  art.addEventListener('pointerup',release);art.addEventListener('pointercancel',release);
  art.addEventListener('keydown',e=>{if(e.target!==art)return;
    if(e.key==='ArrowLeft')tYaw-=8;else if(e.key==='ArrowRight')tYaw+=8;else if(e.key==='ArrowUp')tPitch-=5;else if(e.key==='ArrowDown')tPitch+=5;
    else if(e.key===' '){toggle();e.preventDefault();return}else if(e.key==='Home'){reset();e.preventDefault();return}else return;
    e.preventDefault();tPitch=clamp(tPitch,-30,22);tYaw=clamp(tYaw,-65,65);queue()});
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;visible?queue():(raf&&cancelAnimationFrame(raf),raf=0)}).observe(root);
  queue();
}
