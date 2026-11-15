// Site-wide motion + interaction layer: page transitions, command palette, mega menu, banner,
// header theme, back-to-top, scroll-speed ticker, drag hint. No dependencies.
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,fine=matchMedia('(pointer: fine)').matches;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const el=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};

/* page transitions: wipe on leave, fade on arrival */
const curtain=el('div','curtain');curtain.setAttribute('aria-hidden','true');document.body.append(curtain);
addEventListener('pageshow',e=>{if(e.persisted)curtain.classList.remove('go')});
document.addEventListener('click',e=>{
  const a=e.target.closest('a[href]');
  if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target||a.hasAttribute('download'))return;
  const u=new URL(a.href,location.href);
  if(u.origin!==location.origin||(u.pathname===location.pathname&&u.search===location.search)||/\.(md|png|svg)$/.test(u.pathname))return;
  if(reduce)return;
  e.preventDefault();curtain.classList.add('go');
  setTimeout(()=>{location.href=u.href},520);
});

/* staggered grid reveals + drawn eyebrow lines */
$$('.stats,.template-grid,.product-features,.guide-three-columns,.permission-grid,.development-grid,.explanation-rows').forEach(g=>[...g.children].forEach((c,i)=>c.style.setProperty('--d',i*.1+'s')));
const eio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('drawn');eio.unobserve(e.target)}}),{threshold:1});
$$('.eyebrow,.page-kicker').forEach(x=>{x.classList.add('draw');eio.observe(x)});

/* back-to-top with progress ring; ticker speeds with scroll */
const marq=$('#marquee'),top=el('button','to-top','<svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="20"/><circle class="ring" cx="22" cy="22" r="20"/></svg><span aria-hidden="true">↑</span>');
top.setAttribute('aria-label','Back to top');top.onclick=()=>scrollTo({top:0,behavior:reduce?'auto':'smooth'});document.body.append(top);
const ring=$('.ring',top),C=2*Math.PI*20;ring.style.strokeDasharray=C;
let lastY=scrollY,vel=0,raf=0;
function frame(){raf=0;const y=scrollY,max=document.documentElement.scrollHeight-innerHeight;vel+=((y-lastY)-vel)*.2;lastY=y;
  ring.style.strokeDashoffset=C*(1-(max>0?y/max:0));top.classList.toggle('show',y>innerHeight*.8);
  if(marq&&!reduce){const a=marq.getAnimations()[0];if(a)a.playbackRate=1+clamp(Math.abs(vel)*.35,0,6)}
  if(Math.abs(vel)>.05)raf=requestAnimationFrame(frame);else if(marq){const a=marq.getAnimations()[0];if(a)a.playbackRate=1}}
addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(frame)},{passive:true});frame();

/* command palette (Ctrl/Cmd+K or "/") */
const items=[
  ['Home','/','page'],['Product','/product/','page'],['How it works','/how-it-works/','page'],['Why local','/why-local/','page'],['Open the prototype','/prototype/','page'],['Download the product brief','/product-brief.md','file'],
  ['Hardware profiles','/why-local/#hardware','section'],['Data boundaries','/why-local/#data-boundaries','section'],['Development status','/product/#development','section'],['Questions & answers','/product/#faq','section'],['Live playground','/#playground','section'],['Roadmap','/#roadmap','section']];
const pal=el('div','palette','<div class="pal-box" role="dialog" aria-modal="true" aria-label="Command palette"><div class="pal-in"><span aria-hidden="true">⌕</span><input type="text" placeholder="Search pages and sections…" aria-label="Search pages and sections"><kbd>esc</kbd></div><ul role="listbox"></ul></div>');
document.body.append(pal);
const pin=$('input',pal),pul=$('ul',pal);let sel=0,list=items,prev=null;
function draw(){pul.replaceChildren(...list.map((it,i)=>{const li=el('li',i===sel?'on':'','<b>'+it[0]+'</b><small>'+it[2].toUpperCase()+'</small>');li.setAttribute('role','option');li.onmouseenter=()=>{sel=i;mark()};li.onclick=()=>go(it);return li}));if(!list.length)pul.append(el('li','none','No matches'))}
const mark=()=>$$('li',pul).forEach((l,i)=>l.classList.toggle('on',i===sel));
function go(it){close();if(it[1].endsWith('.md')){const a=el('a');a.href=it[1];a.download='Blue-Nebula-Product-Brief.md';a.click();return}
  const u=new URL(it[1],location.href);if(u.pathname===location.pathname&&u.hash){$(u.hash)?.scrollIntoView({behavior:reduce?'auto':'smooth'})}else{const a=el('a');a.href=it[1];document.body.append(a);a.click();a.remove()}}
function open(){prev=document.activeElement;pal.classList.add('open');pin.value='';list=items;sel=0;draw();setTimeout(()=>pin.focus(),30);document.body.style.overflow='hidden'}
function close(){pal.classList.remove('open');document.body.style.overflow='';prev?.focus?.()}
pin.addEventListener('input',()=>{const q=pin.value.toLowerCase().trim();list=items.filter(i=>i[0].toLowerCase().includes(q));sel=0;draw()});
pal.addEventListener('click',e=>{if(e.target===pal)close()});
addEventListener('keydown',e=>{
  const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'');
  if((e.key==='k'&&(e.metaKey||e.ctrlKey))||(e.key==='/'&&!typing&&!pal.classList.contains('open'))){e.preventDefault();pal.classList.contains('open')?close():open();return}
  if(!pal.classList.contains('open'))return;
  if(e.key==='Escape')close();
  else if(e.key==='ArrowDown'){e.preventDefault();sel=(sel+1)%Math.max(list.length,1);mark()}
  else if(e.key==='ArrowUp'){e.preventDefault();sel=(sel+list.length-1)%Math.max(list.length,1);mark()}
  else if(e.key==='Enter'&&list[sel]){e.preventDefault();go(list[sel])}
});
const navCta=$('.nav>.btn');
if(navCta){const k=el('button','kbd-btn','<span>Search</span><kbd>Ctrl K</kbd>');k.setAttribute('aria-label','Open command palette');k.onclick=open;navCta.before(k)}

/* mega menu, banner, header theme (dark/light sections) */
const hdr=$('#header');
const dds=$$('.dd'),closeDD=(except)=>dds.forEach(x=>{if(x!==except){x.classList.remove('open');$('.dd-btn',x).setAttribute('aria-expanded','false')}});
dds.forEach(d=>{const b=$('.dd-btn',d),set=o=>{d.classList.toggle('open',o);b.setAttribute('aria-expanded',o)};
  b.addEventListener('click',e=>{e.stopPropagation();const o=!d.classList.contains('open');closeDD(d);set(o)});
  if(fine){d.addEventListener('pointerenter',()=>{closeDD(d);set(true)});d.addEventListener('pointerleave',()=>set(false))}
  d.addEventListener('keydown',e=>{if(e.key==='Escape'){set(false);b.focus()}})});
document.addEventListener('click',()=>closeDD());
try{if(sessionStorage.getItem('bn-banner')==='x')hdr?.classList.add('no-banner')}catch{}
$('#banner-x')?.addEventListener('click',()=>{hdr.classList.add('no-banner');try{sessionStorage.setItem('bn-banner','x')}catch{}});
const themed=$$('[data-theme]');
function themeCheck(){if(!hdr)return;const y=hdr.getBoundingClientRect().height*.6;let t='light';
  for(const s of themed){const r=s.getBoundingClientRect();if(r.top<=y&&r.bottom>y){t=s.dataset.theme;break}}
  hdr.classList.toggle('on-dark',t==='dark')}
addEventListener('scroll',themeCheck,{passive:true});addEventListener('resize',themeCheck);themeCheck();
