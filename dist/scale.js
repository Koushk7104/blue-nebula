// Blue Nebula — home page interactions. No dependencies.
import {createScene} from '/scene.js';
import {createRibbon} from '/ribbon.js';
import {initPaperLab} from '/paper.js';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(pointer: fine)').matches;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const smooth=t=>t*t*(3-2*t);
let paused=false;
const toast=(m)=>{const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2200)};

/* ---------- header, progress, mobile menu ---------- */
const header=$('#header'),bar=$('#progress');let lastY=0,ticking=false;
function onScroll(){
  const y=scrollY,max=document.documentElement.scrollHeight-innerHeight;
  bar.style.transform=`scaleX(${max>0?y/max:0})`;
  header.classList.toggle('stuck',y>20);
  header.classList.toggle('hide',y>lastY&&y>600&&!document.body.classList.contains('menu-open'));
  lastY=y;scenes();scrub();roadProgress();ticking=false;
}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});
const menuBtn=$('#menu-btn');
function setMenu(o){document.body.classList.toggle('menu-open',o);menuBtn.setAttribute('aria-expanded',o);menuBtn.setAttribute('aria-label',o?'Close navigation':'Open navigation');document.body.style.overflow=o?'hidden':''}
menuBtn.onclick=()=>setMenu(!document.body.classList.contains('menu-open'));
$$('#mobile-menu a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});

/* ---------- reveal + word split ---------- */
function split(el,cls){
  const walk=(node)=>{[...node.childNodes].forEach(n=>{
    if(n.nodeType===3){const f=document.createDocumentFragment();n.textContent.split(/(\s+)/).forEach(p=>{if(!p)return;if(/^\s+$/.test(p))f.append(p);else{const s=document.createElement('span');s.className=cls;s.setAttribute('aria-hidden','true');s.textContent=p;f.append(s)}});n.replaceWith(f)}
    else if(n.nodeType===1)walk(n)})};
  const label=el.textContent.trim();walk(el);el.setAttribute('aria-label',label);
  $$('.'+cls,el).forEach((w,i)=>w.style.setProperty('--i',i));
}
$$('[data-words]').forEach(el=>split(el,'w'));
$$('.story-step h3').forEach(el=>split(el,'sx')); // headline words stagger in when their step activates
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15,rootMargin:'0px 0px -6% 0px'});
$$('.uc').forEach((c,i)=>{c.classList.add('reveal');c.style.setProperty('--d',(i%4)*.08+'s')});
$$('.reveal,.words,.rm').forEach(el=>io.observe(el));

/* ---------- scroll-scrubbed text: words light up as you scroll ---------- */
const scrubs=$$('[data-scrub]').map(el=>{split(el,'sw');return{el,words:$$('.sw',el)}});
const panelEl=$('#panel'),tickers=$$('.ticker-row');
function scrub(){
  tickers.forEach((r,i)=>{r.style.translate=((i?1:-1)*scrollY*.1)+'px 0'});
  if(panelEl&&!reduce){const r=panelEl.getBoundingClientRect(),p=clamp((innerHeight-r.top)/(innerHeight*.7),0,1);panelEl.style.transform=`scale(${.93+.07*p})`;panelEl.style.borderRadius=(44-20*p)+'px'}
  for(const s of scrubs){
    const r=s.el.getBoundingClientRect(),n=s.words.length;
    const p=reduce?1:clamp((innerHeight*.9-r.top)/(innerHeight*.5+r.height*.6),0,1);
    const floor=s.el.classList.contains('panel-scrub')?.3:.18;
    s.words.forEach((w,i)=>{w.style.opacity=floor+(1-floor)*clamp(p*(n+3)-i,0,1)});
  }
}

/* ---------- counters ---------- */
const cio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;cio.unobserve(e.target);
  const to=+e.target.dataset.count,t0=performance.now(),d=1600;
  const tick=t=>{const p=clamp((t-t0)/d,0,1),v=1-Math.pow(1-p,4);e.target.textContent=Math.round(to*v);if(p<1)requestAnimationFrame(tick)};
  reduce?e.target.textContent=to:requestAnimationFrame(tick)}),{threshold:.6});
$$('[data-count]').forEach(el=>cio.observe(el));

/* ---------- hero word rotator (scramble) ---------- */
const rot=$('#rotator'),words=['memory','design','code','checks'];let wi=0;
function roll(el,to){
  if(reduce){el.textContent=to;return}
  el.classList.add('out');
  setTimeout(()=>{el.textContent=to;el.classList.remove('out');el.classList.add('in-up');setTimeout(()=>el.classList.remove('in-up'),480)},260);
}
setInterval(()=>{if(document.hidden||paused)return;wi=(wi+1)%words.length;roll(rot,words[wi])},2600);

/* ---------- 3D wireframe scenes ---------- */
const storyCv=$('#story-scene');
const ribbon=createRibbon($('#hero-ribbon'),{host:$('.cine'),wrap:$('.cine-wrap'),modes:$$('.ribbon-modes button'),items:$$('.lp-item')});
initPaperLab($('.paper-lab'));
const ctaRibbon=createRibbon($('#cta-ribbon'),{host:$('.cta-dark'),wrap:$('.cta-dark'),enter:true,reverse:true,scaleMul:1.7,layout:'center',labels:false,interactive:false});
const storyScene=createScene(storyCv,{tiltX:1.1,pointer:false});
const storyEl=$('[data-story]');
function placeScenes(){
  const h=innerHeight,mob=innerWidth<700;
  // lift the stack into the upper half so it never sits behind the caption
  // desktop: scene lives in the right column with the camera following the active layer; mobile: stacked above the caption
  const wide=innerWidth>=900;
  storyScene.set({cam:wide?1:0,yoff:wide?0:-storyCv.clientHeight*(mob?.16:.1),zoom:wide?clamp(Math.min(h/680,storyCv.clientWidth/800),.75,1.4):(mob?1.35:clamp(h/820,.6,.9))});
}
placeScenes();addEventListener('resize',placeScenes);
function scenes(){
  const r=storyEl.getBoundingClientRect(),total=r.height-innerHeight;
  if(r.bottom<-50||r.top>innerHeight+50)return;
  const p=clamp(-r.top/total,0,.999);setStory(Math.floor(p*4),p);
}

/* ---------- pinned story ---------- */
const steps=$$('.story-step'),snav=$$('#story-nav button');let cur=-1;
function setStory(i,p){
  if(i!==cur){cur=i;storyEl.style.setProperty('--sc',steps[i].style.getPropertyValue('--c'));steps.forEach((s,k)=>s.classList.toggle('active',k===i));snav.forEach((b,k)=>b.classList.toggle('active',k===i))}
  snav.forEach((b,k)=>b.style.setProperty('--fill',k<i?'100%':k===i?clamp((p*4-i)*100,0,100)+'%':'0%'));
  storyScene.set({active:i,explode:.35+.65*smooth(clamp(p*3,0,1)),ry:-.9+p*1.8,rx:1.12-p*.28});
}
snav.forEach((b,k)=>b.addEventListener('click',()=>{const total=storyEl.offsetHeight-innerHeight,top=storyEl.getBoundingClientRect().top+scrollY;scrollTo({top:top+total*(k+.5)/4,behavior:reduce?'auto':'smooth'})}));
setStory(0,0);

/* ---------- drag-to-scroll rails (use cases, roadmap) ---------- */
function makeDrag(wrap){
  let down=false,sx=0,sl=0,moved=false;
  wrap.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;down=true;moved=false;sx=e.clientX;sl=wrap.scrollLeft;wrap.classList.add('drag')});
  addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-sx;if(Math.abs(dx)>4)moved=true;wrap.scrollLeft=sl-dx});
  addEventListener('pointerup',()=>{down=false;wrap.classList.remove('drag')});
  wrap.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopPropagation();moved=false}},true);
  wrap.addEventListener('keydown',e=>{if(e.key==='ArrowRight')wrap.scrollBy({left:320,behavior:'smooth'});if(e.key==='ArrowLeft')wrap.scrollBy({left:-320,behavior:'smooth'})});
}
const rail=$('#rail-wrap');makeDrag(rail);
const railProg=()=>$('#rail-prog').style.setProperty('--p',((rail.scrollLeft+rail.clientWidth)/rail.scrollWidth*100)+'%');
rail.addEventListener('scroll',railProg,{passive:true});railProg();
$('#rail-prev').onclick=()=>rail.scrollBy({left:-360,behavior:'smooth'});
$('#rail-next').onclick=()=>rail.scrollBy({left:360,behavior:'smooth'});
const rw=$('#road-wrap'),road=$('#road');makeDrag(rw);
function roadProgress(){const max=rw.scrollWidth-rw.clientWidth;const p=max>0?rw.scrollLeft/max:0;road.style.setProperty('--pw',(12+p*88)+'%')}
rw.addEventListener('scroll',roadProgress,{passive:true});roadProgress();

$('#motion-toggle').onclick=e=>{paused=!paused;ribbon.pause(paused);ctaRibbon.pause(paused);storyScene.pause(paused);document.body.classList.toggle('still',paused);e.currentTarget.setAttribute('aria-pressed',paused);e.currentTarget.textContent=paused?'Resume graphics ▷':'Pause graphics Ⅱ';toast(paused?'Graphics paused':'Graphics resumed')};

/* ---------- live playground ---------- */
const promptEl=$('#prompt'),log=$('#log'),stepEls=$$('#steps .step'),headingEl=$('#heading'),gapEl=$('#gap');
const state={accent:'#4d8dff',accentName:'blue',gap:16,heading:headingEl.value};let runId=0,running=false;
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,reduce?0:ms));
const compName=p=>/pric/i.test(p)?'PricingCard':/setting/i.test(p)?'SettingsPanel':/onboard/i.test(p)?'OnboardingStep':'WelcomeCard';
function applyPreview(){
  const m=$('#mock');m.style.setProperty('--accent',state.accent);m.style.setProperty('--gap',state.gap+'px');
  $('#mock-title').textContent=state.heading||' ';$('#gap-out').textContent=state.gap+'px';
}
function codeFor(name){return[
`export function ${name}() {`,
`  return (`,
`    <Card accent="${state.accentName}" gap={${state.gap}}>`,
`      <Eyebrow>YOUR NEXT CHAPTER</Eyebrow>`,
`      <h2>${state.heading.replace(/[<>{}]/g,'')||'Untitled'}</h2>`,
`      <Button>Open your project</Button>`,
`    </Card>`,
`  );`,
`}`]}
function addLine(html,cls=''){const d=document.createElement('div');if(cls)d.className=cls;d.innerHTML=html;log.append(d);log.scrollTop=log.scrollHeight;return d}
function setStep(i,s,dur){stepEls.forEach((el,k)=>{el.classList.remove('run','done');if(k<i)el.classList.add('done');if(k===i&&s==='run'){el.style.setProperty('--dur',dur+'ms');el.classList.add('run')}if(k===i&&s==='done')el.classList.add('done')})}
async function run(){
  if(running)return;running=true;const id=++runId,name=compName(promptEl.value);
  const live=()=>id===runId;
  log.replaceChildren();$('#run').disabled=true;
  addLine(`› <span class="hl">${esc(promptEl.value||'Build something')}</span>`);
  setStep(0,'run',1000);await sleep(300);addLine(`<span class="kw">memory</span>.search("conventions")`);await sleep(500);
  if(!live())return;addLine('✓ 4 records · architecture.md, tokens.md','ok');await sleep(300);
  setStep(1,'run',1000);addLine(`<span class="kw">canvas</span>.bind(&lt;${name}/&gt;)`);await sleep(500);
  if(!live())return;addLine(`✓ accent=${state.accentName}  space=${state.gap}px`,'ok');await sleep(400);
  setStep(2,'run',1800);addLine(`<span class="kw">code</span>.generate("${name}.jsx")`);
  for(const l of codeFor(name)){if(!live())return;addLine(esc(l),'hl');await sleep(110)}
  setStep(3,'run',1300);await sleep(300);if(!live())return;
  const checks=['heading is non-empty','spacing token valid','accent bound to token','no unsafe markup'];
  for(const c of checks){addLine(`✓ ${c}`,'ok');await sleep(260)}
  setStep(3,'done');stepEls.forEach(e=>e.classList.add('done'));
  addLine('4/4 fixture checks passed. These validate demo data, not a compiler.','ok');
  running=false;$('#run').disabled=false;toast('Workflow complete');
}
$('#prompt-form').addEventListener('submit',e=>{e.preventDefault();running=false;run()});
$$('#chips .chip').forEach(c=>c.addEventListener('click',()=>{promptEl.value=c.textContent;runId++;running=false;run()}));
headingEl.addEventListener('input',()=>{state.heading=headingEl.value;applyPreview()});
gapEl.addEventListener('input',()=>{state.gap=+gapEl.value;applyPreview()});
$$('#swatches button').forEach(b=>b.addEventListener('click',()=>{$$('#swatches button').forEach(x=>x.setAttribute('aria-pressed',x===b));state.accent=b.dataset.c;state.accentName=b.getAttribute('aria-label').toLowerCase();applyPreview()}));
$('#mock-btn').addEventListener('click',()=>toast('That is a preview button. Open the prototype for the real thing.'));
applyPreview();

/* ---------- hardware profiles ---------- */
const HW=[
  {tag:'H0 · LIMITED LOCAL',name:'A lighter local workspace',desc:'Proposed H0 profile: memory and canvas editing, with a small CPU model on a best-effort basis. Inference speed is not guaranteed.',pc:'CPU inference',disk:'SSD required',pct:30,ram:'16 GB RAM'},
  {tag:'H1 · REFERENCE INFERENCE',name:'Your personal engineering engine',desc:'Proposed H1 reference: one compact local model, project retrieval, and an active engineering task. The exact model will be selected through trials.',pc:'12 GB NVIDIA VRAM',disk:'30 GB free · NVMe',pct:60,ram:'32 GB RAM'},
  {tag:'H2 · FUTURE ADAPTATION',name:'Room to explore further',desc:'Proposed H2 profile for later, optional adapter experiments in an isolated Linux environment. Training is a separate, consented roadmap capability.',pc:'24 GB NVIDIA VRAM',disk:'100 GB free',pct:95,ram:'64 GB RAM'}];
const ram=$('#ram');
function setHW(){const h=HW[+ram.value],c=$('#hw-card');c.animate([{opacity:.4,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:reduce?0:400,easing:'cubic-bezier(.16,1,.3,1)'});
  $('#ram-out').textContent=h.ram;$('#hw-tag').textContent=h.tag;$('#hw-name').textContent=h.name;$('#hw-desc').textContent=h.desc;$('#hw-compute').textContent=h.pc;$('#hw-disk').textContent=h.disk;$('#hw-pct').textContent=h.pct+'%';$('#hw-meter').style.setProperty('--w',h.pct+'%')}
ram.addEventListener('input',setHW);setHW();

/* ---------- FAQ: one open at a time ---------- */
$$('#faq details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)$$('#faq details').forEach(o=>{if(o!==d)o.open=false})}));

onScroll();
