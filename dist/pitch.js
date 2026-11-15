// Demo strip: one scripted edit travels canvas -> diff -> checks -> memory, on a loop.
// Pure presentation of sample data; nothing here calls a model or the network.
const win=document.getElementById('demo-win');
if(win){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const h=document.getElementById('demo-h'),els=[...win.querySelectorAll('[data-s]')],pills=[...document.querySelectorAll('#demo-steps>span')];
  const FROM='Welcome back.',TO='Ship the next idea.';
  let timers=[],visible=false,gen=0;
  const later=(fn,ms)=>timers.push(setTimeout(fn,ms));
  const stage=n=>{win.dataset.stage=n;els.forEach(e=>e.classList.toggle('on',+e.dataset.s<=n));pills.forEach((p,i)=>p.classList.toggle('on',i===n-1))};
  const showCaret=on=>{h.querySelector('.caret')?.remove();if(on){const c=document.createElement('span');c.className='caret';h.append(c)}};
  function type(text,done){let i=0;const id=gen;(function step(){if(id!==gen)return;h.textContent=text.slice(0,++i);showCaret(true);if(i<text.length)later(step,38);else{showCaret(false);done()}})()}
  function run(){
    gen++;timers.forEach(clearTimeout);timers=[];
    h.textContent=FROM;showCaret(false);stage(0);
    later(()=>{stage(1);h.textContent='';type(TO,()=>{later(()=>stage(2),500);later(()=>stage(3),1900);later(()=>stage(4),3300);later(run,7600)})},1100);
  }
  function still(){h.textContent=TO;stage(4)}
  if(reduce)still();
  else{
    h.textContent=FROM;
    new IntersectionObserver(([e])=>{
      if(e.isIntersecting&&!visible){visible=true;run()}
      else if(!e.isIntersecting&&visible){visible=false;gen++;timers.forEach(clearTimeout);timers=[]}
    },{threshold:.35}).observe(win);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){gen++;timers.forEach(clearTimeout);timers=[]}else if(visible)run()});
  }
}
