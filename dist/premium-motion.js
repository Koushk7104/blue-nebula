import { clamp01, surfaceFrame, pointerMotion } from './motion-core.mjs';

/** Finite UI transitions and scroll effects share one motion preference. */
export function initPageMotion(){
  const media=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(pointer:fine)');
  const easing='cubic-bezier(.22,1,.36,1)',active=new Set(),byElement=new WeakMap(),disclosures=new Map();
  let paused=false,blocked=false,raf=0,nearSurface=true;
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const hero=$('.startup-hero,.page-hero'),surface=$('.studio-workspace-shell'),header=$('.site-header');
  const canAnimate=el=>!paused&&!media.matches&&!document.hidden&&(!blocked||!!el?.closest('dialog[open]'));

  function play(el,keyframes,options={}){
    if(!el||!canAnimate(el)||!el.getClientRects().length)return;
    byElement.get(el)?.cancel();
    const animation=el.animate(keyframes,{duration:720,easing,fill:'both',...options});
    const entry={el,animation};active.add(entry);byElement.set(el,animation);
    const release=()=>{active.delete(entry);if(byElement.get(el)===animation)byElement.delete(el);animation.cancel();};
    animation.finished.then(release,()=>{active.delete(entry);if(byElement.get(el)===animation)byElement.delete(el);});
    return animation;
  }
  function enter(el,delay=0,distance=25){return play(el,[{opacity:0,transform:`translateY(${distance}px)`},{opacity:1,transform:'translateY(0)'}],{delay});}
  function settleDisclosure(details){
    const state=disclosures.get(details);if(!state)return;
    disclosures.delete(details);state.animation?.cancel();details.open=state.want;
    details.style.height='';details.style.overflow='';details.classList.remove('is-closing');
  }
  function settle(){
    for(const {animation} of active)try{animation.finish();}catch{animation.cancel();}
    for(const details of [...disclosures.keys()])settleDisclosure(details);
  }

  // Nothing is hidden in the authored CSS. A failed or disabled animation leaves readable content.
  const reveals=$$('.section-heading,.feature-card,.local-illustration,.local-copy,.details-heading,.product-disclosure,.startup-progress>article,.faq-section>div,.closing-content,.footer-main,.footer-bottom,.walkthrough,.boundary-explorer,.hardware-explorer,.detail-column,.template-card,.product-features>article,.permission-grid>article,.development-grid>article');
  const revealObserver=new IntersectionObserver(entries=>{
    for(const {target,isIntersecting} of entries){
      if(!isIntersecting)continue;
      target.classList.add('premium-in-view');revealObserver.unobserve(target);
      const index=[...target.parentElement.children].indexOf(target);
      const stagger=target.matches('.feature-card,.product-disclosure,.startup-progress>article')?Math.min(index,3)*65:0;
      enter(target,stagger,target.matches('.local-illustration')?35:25);
      if(target.matches('.closing-content'))$$('.closing-routes path').forEach((path,i)=>play(path,[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:1450,delay:150+i*85}));
    }
  },{threshold:.09});reveals.forEach(el=>revealObserver.observe(el));
  const activity=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>target.classList.toggle('motion-offscreen',!isIntersecting)),{rootMargin:'100px'});
  $$('.architecture-map,.local-illustration,.stack-strip,.closing-section').forEach(el=>activity.observe(el));
  $$('.premium-line>span').forEach((el,i)=>play(el,[{transform:'translateY(112%)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:1000,delay:80+i*115}));
  ['.startup-eyebrow,.page-kicker','.startup-hero>p,.nebula-copy>p,.page-hero>p','.startup-actions,.page-actions','.startup-stage,.page-note'].forEach((selector,i)=>enter($(selector),120+i*110,16));
  enter($('#workspace'),380,30);
  const logos=$('.stack-logos');
  if(logos&&!logos.querySelector('.logo-track')){const track=document.createElement('div');track.className='logo-track';while(logos.firstChild)track.append(logos.firstChild);logos.append(track);}

  // Selection belongs to the app; the underline only follows its ARIA state.
  const tablists=$$('.workspace-tabs,.walkthrough-tabs,.boundary-tabs');
  const indicators=tablists.map(tablist=>{const indicator=document.createElement('span');indicator.className='tab-motion-indicator';indicator.setAttribute('aria-hidden','true');tablist.prepend(indicator);return {tablist,indicator};});
  function updateIndicator(){
    for(const {tablist,indicator} of indicators){
      const selected=tablist.querySelector('[aria-selected="true"]');if(!selected||!tablist.getClientRects().length)continue;
      const vertical=tablist.getAttribute('aria-orientation')==='vertical';
      indicator.style.width=vertical?'3px':`${Math.max(0,selected.offsetWidth-22)}px`;
      indicator.style.height=vertical?`${Math.max(0,selected.offsetHeight-12)}px`:'2px';
      indicator.style.translate=vertical?`0 ${selected.offsetTop+6}px`:`${selected.offsetLeft+11}px 0`;
    }
  }
  const sections=['workspace','how-it-works','local-first'].map(id=>document.getElementById(id)).filter(Boolean);let currentSection='';
  function update(){
    raf=0;if(document.hidden)return;
    document.documentElement.style.setProperty('--page-progress',clamp01(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)));
    header.classList.toggle('header-scrolled',scrollY>24);
    hero?.style.setProperty('--hero-scroll',canAnimate(hero)?clamp01(scrollY/Math.max(1,hero.offsetHeight)):0);
    if(surface&&(nearSurface||blocked||!canAnimate(surface))){
      const rect=surface.getBoundingClientRect(),engaged=surface.contains(document.activeElement)||(fine.matches&&surface.matches(':hover'));
      const frame=surfaceFrame(rect.top,rect.height,innerHeight,canAnimate(surface)&&!blocked&&innerWidth>760&&!engaged);
      surface.style.setProperty('--surface-scale',frame.scale);surface.style.setProperty('--surface-lift',`${frame.lift}px`);
    }
    let next='';for(const section of sections)if(section.getBoundingClientRect().top<innerHeight*.4)next=section.id;
    if(next!==currentSection){currentSection=next;$$('.desktop-nav>a[href^="#"]').forEach(a=>{if(a.hash==='#'+next)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});$('[aria-controls="product-menu"]')?.classList.toggle('section-current',next==='workspace');}
    updateIndicator();
  }
  function queue(){if(!raf&&!document.hidden)raf=requestAnimationFrame(update);}
  if(surface)new IntersectionObserver(entries=>{nearSurface=entries[0].isIntersecting;queue();},{rootMargin:'120px'}).observe(surface);
  tablists.forEach(tablist=>new ResizeObserver(queue).observe(tablist));
  window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue,{passive:true});
  if(surface)['pointerenter','pointerleave','focusin','focusout'].forEach(type=>surface.addEventListener(type,queue));
  if(fine.matches)$$('.startup-actions>.button,.nav-cta,.closing-content>.button,.feature-card,.startup-progress>article,.product-disclosure>summary').forEach(el=>{
    let box;el.addEventListener('pointerenter',()=>{box=el.getBoundingClientRect();});
    el.addEventListener('pointermove',event=>{if(!box||!canAnimate(el))return;const p=pointerMotion(event.clientX-box.left,event.clientY-box.top,box.width,box.height);el.style.setProperty('--pointer-x',`${p.x}px`);el.style.setProperty('--pointer-y',`${p.y}px`);});
    el.addEventListener('pointerleave',()=>{el.style.setProperty('--pointer-x','0px');el.style.setProperty('--pointer-y','0px');});
  });

  function animateDisclosure(details,want){
    const from=details.getBoundingClientRect().height,previous=disclosures.get(details);previous?.animation?.cancel();
    const state={want,animation:null};disclosures.set(details,state);
    details.open=true;details.style.height='auto';details.style.overflow='hidden';
    const summary=details.querySelector('summary'),style=getComputedStyle(details);
    const to=want?details.getBoundingClientRect().height:summary.getBoundingClientRect().height+parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth);
    details.style.height=from+'px';details.classList.toggle('is-closing',!want);
    state.animation=details.animate([{height:from+'px'},{height:to+'px'}],{duration:want?520:360,easing,fill:'both'});
    state.animation.finished.then(()=>{if(disclosures.get(details)===state){settleDisclosure(details);queue();}},()=>{});
  }
  $$('.product-disclosure,.faq-list details').forEach(details=>{
    details.querySelector('summary').addEventListener('click',event=>{if(!canAnimate(details))return;event.preventDefault();animateDisclosure(details,!(disclosures.get(details)?.want??details.open));});
    details.addEventListener('toggle',()=>{if(details.open&&!disclosures.has(details))enter(details.querySelector(':scope>section,:scope>p'),0,12);queue();});
  });
  function settleFragment(hash){
    let id;try{id=decodeURIComponent(hash.slice(1));}catch{return;}
    const target=document.getElementById(id),details=target?.closest('.product-disclosure');
    if(details&&disclosures.has(details)){disclosures.get(details).want=true;settleDisclosure(details);}
  }
  document.addEventListener('click',event=>{const link=event.target.closest('a[href^="#"]');if(link)settleFragment(link.hash);},true);
  window.addEventListener('hashchange',()=>settleFragment(location.hash));

  const mutations=new MutationObserver(records=>{
    for(const {target,attributeName} of records){
      if(attributeName==='aria-selected'&&target.closest('.workspace-tabs,.walkthrough-tabs,.boundary-tabs'))queue();
      if(attributeName==='hidden'&&!target.hidden){
        if(target.matches('[role="tabpanel"],[data-step-content]'))enter(target,0,12);
        else if(target.matches('.mega-menu,.mobile-nav'))play(target,[{opacity:0,transform:'translateY(-7px)'},{opacity:1,transform:'translateY(0)'}],{duration:320});
      }
      if(attributeName==='open'&&target.matches('dialog')&&target.open)play(target,[{opacity:0,transform:'translateY(16px) scale(.988)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:440});
    }
  });mutations.observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden','open','aria-selected']});
  const bench=$('.workbench');
  if(bench)new MutationObserver(()=>{if(bench.classList.contains('properties-open'))enter($('.canvas-inspector'),0,12);}).observe(bench,{attributes:true,attributeFilter:['class']});
  $('#screen-template')?.addEventListener('change',()=>play($('#design-card'),[{opacity:.25,transform:'translateY(10px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:390}));
  const checks=$('#check-results');if(checks)new MutationObserver(()=>{if(checks.getClientRects().length)[...checks.children].forEach((el,i)=>enter(el,i*45,9));}).observe(checks,{childList:true});
  // Animate a completed content change, never the inputs or their focus position.
  document.addEventListener('bn:guide-change',event=>{
    const parts=event.detail==='boundary'?$$('.boundary-explanation>*,.boundary-runtime'):
      event.detail==='hardware'?$$('.hardware-detail>*'):[];
    parts.forEach((el,i)=>enter(el,i*35,10));
    if(event.detail==='boundary')play($('.boundary-connection i'),[{opacity:.2},{opacity:1}],{duration:650});
  });
  function sync(){
    document.body.classList.toggle('page-motion-reduced',media.matches);document.body.classList.toggle('motion-paused',paused);document.body.classList.toggle('motion-document-hidden',document.hidden);
    document.documentElement.style.scrollBehavior=paused||media.matches?'auto':'';
    if(paused||media.matches||document.hidden)settle();queue();
  }
  document.addEventListener('visibilitychange',sync);
  document.addEventListener('bn:workspace-visibility',event=>{blocked=!!event.detail?.open;if(blocked)settle();queue();});
  media.addEventListener('change',sync);document.body.classList.add('premium-motion-ready');sync();
  return {setPaused(value){paused=value;sync();}};
}
