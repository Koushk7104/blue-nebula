const icons={canvas:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 9v12"/>',code:'<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 20"/>',memory:'<path d="M6 3h12v18l-6-4-6 4z"/><path d="M9 7h6M9 10h6"/>',evaluation:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'};
const views={canvas:['Canvas','Shape the screen. Keep its implementation connected.'],code:['Code','Inspect the source and compare it with a checkpoint.'],memory:['Project memory','Explore the sample decisions behind this project.'],evaluation:['Checks','Inspect named checks and their observed results.']};

/** Recompose the same stateful editor DOM; no duplicate or simulated controls. */
export function initPrototypeUI(){
  const $=s=>document.querySelector(s),host=$('.studio-workspace-shell'),tabs=$('.workspace-tabs');
  document.body.classList.add('workspace-redesign');
  const rail=document.createElement('aside');rail.className='app-rail';rail.setAttribute('aria-label','Workspace navigation');
  rail.innerHTML='<div class="rail-project"><span class="project-monogram">N</span><div><b>Next chapter</b><small>Example project / main</small></div></div><span class="rail-label">WORKSPACE</span><div class="rail-footer"><span><i></i> On this device</span><small>Browser-local prototype</small><a href="/how-it-works/">Product guide <span>↗</span></a></div>';
  host.prepend(rail);rail.querySelector('.rail-footer').before(tabs);
  for(const button of tabs.querySelectorAll('[data-tab]')){
    const key=button.dataset.tab;
    button.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${icons[key]}</svg><span>${key==='memory'?'Memory':views[key][0]}</span>`;
  }
  const layout=matchMedia('(min-width: 901px)');
  const orientation=()=>tabs.setAttribute('aria-orientation',layout.matches?'vertical':'horizontal');
  layout.addEventListener('change',orientation);orientation();
  const context=document.createElement('div');context.className='app-view-header';
  context.innerHTML='<div><span class="app-breadcrumb">NEXT CHAPTER <i>/</i> WORKSPACE</span><h2 id="app-view-title">Canvas</h2><p id="app-view-description"></p></div><div class="app-view-tools"></div>';
  $('.workspace-main').prepend(context);
  const template=$('.template-label');context.querySelector('.app-view-tools').append(template);
  $('#panel-canvas .panel-toolbar').firstElementChild.textContent='WorkspaceScreen / Preview';
  const update=()=>{
    const key=tabs.querySelector('[aria-selected="true"]')?.dataset.tab||'canvas';
    $('#app-view-title').textContent=views[key][0];$('#app-view-description').textContent=views[key][1];template.hidden=key!=='canvas';
  };
  new MutationObserver(update).observe(tabs,{subtree:true,attributes:true,attributeFilter:['aria-selected']});update();
  const brand=$('.studio-brand');brand.insertAdjacentHTML('afterbegin','<a class="studio-wordmark" href="/" aria-label="Blue Nebula home"><span class="logo-crop"><img src="/logo.png" width="200" height="200" alt="Blue Nebula"></span></a>');
  brand.querySelector(':scope>span').remove();brand.querySelector('small').textContent='INTERACTIVE PROTOTYPE';
  $('.studio-notification').textContent='Your work stays in this browser.';
  for(const [selector,label,icon] of [['[data-studio-import]','Import','↑'],['[data-studio-export]','Export','↓']]){
    const button=$(selector);button.innerHTML=`<span>${label}</span> ${icon}`;button.setAttribute('aria-label',label+' project');button.title=label+' project';
  }
  const motionButton=document.createElement('button');motionButton.className='workspace-motion';motionButton.title='Pause animations';motionButton.setAttribute('aria-label','Pause workspace animations');motionButton.setAttribute('aria-pressed','false');motionButton.textContent='Ⅱ';
  $('.studio-header-actions').prepend(motionButton);motionButton.addEventListener('click',()=>$('#motion-toggle').click());
  const updateMotionControl=()=>{const source=$('#motion-toggle'),paused=source.getAttribute('aria-pressed')==='true';motionButton.disabled=source.disabled;motionButton.setAttribute('aria-pressed',paused);motionButton.setAttribute('aria-label',source.disabled?'Reduced motion enabled':paused?'Play workspace animations':'Pause workspace animations');motionButton.title=motionButton.getAttribute('aria-label');motionButton.textContent=paused?'▷':'Ⅱ';};
  new MutationObserver(updateMotionControl).observe($('#motion-toggle'),{attributes:true,attributeFilter:['aria-pressed','disabled']});
  $('.workbench-title .window-controls').remove();
  $('.workbench-title>span:first-of-type').textContent='PROJECT / NEXT CHAPTER';
  $('.project-sidebar').hidden=true;
  $('.prompt-editor>label').textContent='GUIDED TASK';
  $('.sidebar-bottom')?.remove();
  document.querySelectorAll('[data-open-studio]').forEach(button=>{
    const link=document.createElement('a');link.className=button.className;link.href='/prototype/';link.innerHTML=button.innerHTML;button.replaceWith(link);
  });
  const heroLink=$('.startup-actions>a:not(.button)');heroLink.href='/how-it-works/';
  const local=$('.local-copy>.feature-link');local.outerHTML='<a class="feature-link" href="/why-local/">Explore the local-first design <span>↗</span></a>';
  $('.connected-section .section-heading').insertAdjacentHTML('beforeend','<a class="feature-link full-guide-link" href="/how-it-works/">See the complete workflow <span>↗</span></a>');
  if(document.body.hasAttribute('data-prototype-page')){
    $('.studio-close').setAttribute('aria-label','Return to website');$('.studio-close').classList.add('studio-back');$('.studio-close').innerHTML='<span>Back to site</span> ↗';
  }
}
