import {createScene} from '/scene.js';
// Shared interactions for the guide pages (header, progress, reveal, cursor, tilt, magnetic, hero reactivity).
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,fine=matchMedia('(pointer: fine)').matches;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const toast=m=>{const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2200)};

const header=$('#header'),bar=$('#progress');let lastY=0,tick=false;
function onScroll(){const y=scrollY,max=document.documentElement.scrollHeight-innerHeight;
  bar.style.transform=`scaleX(${max>0?y/max:0})`;header.classList.toggle('stuck',y>20);
  header.classList.toggle('hide',y>lastY&&y>400&&!document.body.classList.contains('menu-open'));lastY=y;tick=false}
addEventListener('scroll',()=>{if(!tick){tick=true;requestAnimationFrame(onScroll)}},{passive:true});onScroll();

const mb=$('#menu-btn');
const setMenu=o=>{document.body.classList.toggle('menu-open',o);mb.setAttribute('aria-expanded',o);mb.setAttribute('aria-label',o?'Close navigation':'Open navigation');document.body.style.overflow=o?'hidden':''};
mb.onclick=()=>setMenu(!document.body.classList.contains('menu-open'));
$$('#mobile-menu a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});

// reveal: headline words, sections, cards
function split(el){const walk=n=>[...n.childNodes].forEach(c=>{
  if(c.nodeType===3){const f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(p=>{if(!p)return;if(/^\s+$/.test(p))f.append(p);else{const s=document.createElement('span');s.className='w';s.setAttribute('aria-hidden','true');s.textContent=p;f.append(s)}});c.replaceWith(f)}
  else if(c.nodeType===1)walk(c)});
  const label=el.textContent.replace(/\s+/g,' ').trim();walk(el);el.setAttribute('aria-label',label);$$('.w',el).forEach((w,i)=>w.style.setProperty('--i',i))}
$$('.section-heading h2,.guide-cta h2').forEach(h=>{h.classList.add('words');split(h)});
$$('.section-heading>p,.product-features>article,.template-card,.development-grid>article,.permission-grid>article,.detail-column,.explanation-rows>article,.capability-table-wrap,.walkthrough,.boundary-explorer,.hardware-explorer,.faq-list,.figure-note').forEach((el,i)=>{el.classList.add('reveal');el.style.setProperty('--d',(i%3)*.08+'s')});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
$$('.reveal,.words').forEach(el=>io.observe(el));

// jump-nav scroll spy
const jl=$$('.guide-jump a[href^="#"]');
if(jl.length){const spy=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)jl.forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id))}),{rootMargin:'-40% 0px -55% 0px'});
  jl.forEach(a=>{const t=$(a.getAttribute('href'));if(t)spy.observe(t)})}

// spotlight
$$('.product-features>article,.template-card,.development-grid>article,.permission-grid>article,.detail-column,.hardware-detail,.walkthrough,.boundary-explorer').forEach(el=>{
  el.classList.add('spot');
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--mx',(e.clientX-r.left)+'px');el.style.setProperty('--my',(e.clientY-r.top)+'px')})});

// hero: cursor-reactive glow orbs
const hero=$('.page-hero');
if(hero&&!reduce)hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();hero.style.setProperty('--hx',(e.clientX-r.left)+'px');hero.style.setProperty('--hy',(e.clientY-r.top)+'px')});

// FAQ: one open at a time
$$('.faq-list details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)$$('.faq-list details').forEach(o=>{if(o!==d)o.open=false})}));

// motion toggle
let paused=false;const mt=$('#motion-toggle');
mt?.addEventListener('click',()=>{paused=!paused;document.body.classList.toggle('still',paused);mt.setAttribute('aria-pressed',paused);mt.textContent=paused?'Resume graphics ▷':'Pause graphics Ⅱ';toast(paused?'Graphics paused':'Graphics resumed')});

// cinematic hero: dark section + 3D wireframe scene
const ph=$('.page-hero');
if(ph){ph.dataset.theme='dark';const w=document.createElement('div');w.className='scene-wrap';w.setAttribute('aria-hidden','true');const cv=document.createElement('canvas');w.append(cv);ph.prepend(w);
  const sc=createScene(cv,{tiltX:1.0,labels:innerWidth>700});const place=()=>sc.set({zoom:innerWidth<700?1.1:.85,yoff:0});place();addEventListener('resize',place);
  const act=({product:3,'how-it-works':1,'why-local':0})[location.pathname.split('/')[1]];if(act!==undefined)sc.set({active:act});
  (function d(t){requestAnimationFrame(d);if(!reduce)sc.state.ry=-.6+Math.sin(t/4200)*.25;sc.set({explode:.4+Math.min(scrollY/innerHeight,1)*.5})})(0);
  mt?.addEventListener('click',()=>sc.pause(paused));}

