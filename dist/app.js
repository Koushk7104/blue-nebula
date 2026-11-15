import { ACCENTS, createDemoState, advanceDemo, togglePause, normalizeConfig, generateComponent, verifyWorkspace, getHardwareProfile, createEvidenceReport } from './core.mjs';
import { mountEditorialHero, initEditorialScene } from './editorial-scene.js';
import { initPageMotion } from './premium-motion.js';
import { initStudio } from './studio.js';
import { initLandingExplorer } from './landing-explorer.js';
import { parseProject } from './studio-core.mjs';
import { mountStartupLanding, finishStartupLanding } from './startup-landing.js';
import { initPrototypeUI } from './prototype-ui.js';
import { readPrototypeLaunch } from './prototype-core.mjs';
import { initNebulaHero } from './nebula-hero.js';

const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
mountEditorialHero();
mountStartupLanding();
let sceneControls=null;
let config=normalizeConfig();
let studio=null;
let storedProject=null;
try {const savedProject=localStorage.getItem('bn-project-v1');if(savedProject){storedProject=parseProject(savedProject);config=storedProject.configuration;}else{const saved=JSON.parse(localStorage.getItem('bn-canvas-v1'));if(saved&&typeof saved==='object'&&!Array.isArray(saved))config=normalizeConfig(saved);}}catch{/* Private browsing and disabled storage must remain fully usable. */}
let demo=createDemoState(),timer,epoch=0,toastTimer,checksHaveRun=false;
const live=$('#workflow-live');
function toast(message){const element=$('#toast');element.textContent=message;element.classList.add('visible');studio?.notify(message);clearTimeout(toastTimer);toastTimer=setTimeout(()=>element.classList.remove('visible'),3600);}
function setConfig(input,record=true){config=normalizeConfig(input);if(record)studio?.record(config);applyConfig();}
function download(filename,content,type='text/plain;charset=utf-8'){
  const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function applyConfig(persist=true){
  $('#card-heading').textContent=config.title || '\u00a0';
  $('#design-card').style.setProperty('--card-accent',ACCENTS[config.accent]);
  $('#design-card').style.setProperty('--card-gap',`${config.gap}px`);
  $('#card-title').value=config.title;$('#card-gap').value=config.gap;$('#gap-output').textContent=`${config.gap} px`;
  $$('[data-accent]').forEach(b=>{const selected=b.dataset.accent===config.accent;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});
  const code=generateComponent(config);$('#generated-code').textContent=code;$('.code-lines').textContent=code.split('\n').map((_,i)=>i+1).join('\n');
  if(checksHaveRun)renderChecks();
  studio?.render();
  if(persist)try {if(studio)studio.persist();else localStorage.setItem('bn-canvas-v1',JSON.stringify(config));if($('#save-state'))$('#save-state').textContent='Saved in this browser';}catch{if($('#save-state'))$('#save-state').textContent='Session only';}
}
$('#card-title').addEventListener('input',e=>setConfig({...config,title:e.target.value}));
$('#card-gap').addEventListener('input',e=>setConfig({...config,gap:e.target.value}));
$$('[data-accent]').forEach(b=>b.addEventListener('click',()=>setConfig({...config,accent:b.dataset.accent})));
$('#undo-edit').addEventListener('click',()=>{setConfig(normalizeConfig());toast('Canvas values restored to the original example.');});
$('#canvas-theme').addEventListener('click',()=>{const light=$('.canvas-stage').classList.toggle('light');$('#canvas-theme').setAttribute('aria-label',light?'Use dark canvas preview':'Use light canvas preview');});
$('#card-open').addEventListener('click',()=>showResource('sample-project'));
$('#copy-code').addEventListener('click',async()=>{
  try {await navigator.clipboard.writeText(studio?.getCode()||generateComponent(config));toast('Generated content copied.');}
  catch {toast('Clipboard access is unavailable. Download the component instead.');}
});
$('#download-code').addEventListener('click',()=>{download(studio?.getFilename()||'WorkspaceScreen.jsx',studio?.getCode()||generateComponent(config));toast('Generated file downloaded.');});

function setTab(name,focus=false){
  if(!['canvas','code','memory','evaluation'].includes(name))return;
  $$('.workspace-tabs [role=tab]').forEach(tab=>{const selected=tab.dataset.tab===name;tab.setAttribute('aria-selected',selected);tab.tabIndex=selected?0:-1;if(selected&&focus)tab.focus();});
  $$('.workspace-main>[role=tabpanel]').forEach(panel=>panel.hidden=panel.id!==`panel-${name}`);
  $$('.sidebar-item').forEach(b=>b.classList.toggle('active',b.dataset.demoTab===name));
}
$$('[data-tab]').forEach(tab=>tab.addEventListener('click',()=>setTab(tab.dataset.tab)));
$('.workspace-tabs').addEventListener('keydown',e=>{
  const tabs=$$('.workspace-tabs [role=tab]');const index=tabs.indexOf(document.activeElement);if(index<0)return;
  let next=index;if(['ArrowRight','ArrowDown'].includes(e.key))next=(index+1)%tabs.length;else if(['ArrowLeft','ArrowUp'].includes(e.key))next=(index+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;
  e.preventDefault();setTab(tabs[next].dataset.tab,true);
});
$$('[data-demo-tab]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();setTab(b.dataset.demoTab);closeMenus();if(!b.closest('.workbench'))$('#workspace').scrollIntoView({behavior:scrollBehavior(),block:'start'});}));

const memories=[
  {title:'Use shared color tokens',source:'design-system.md · §2',scope:'main / design',text:'The example project uses registered blue, violet, and mint accent tokens. Component colors should refer to these shared tokens instead of arbitrary CSS.',kind:'◈'},
  {title:'Keep layout changes reviewable',source:'architecture.md · decision 04',scope:'main / engineering',text:'Supported canvas properties should generate a small, inspectable component change. Custom application logic stays in code and is not silently rewritten.',kind:'⌁'},
  {title:'Project knowledge stays scoped',source:'project-brief.md · §3',scope:'main / memory',text:'In this sample, decisions apply to the next-chapter project on main. A different branch or project should retrieve only its own authorized context.',kind:'⌘'},
  {title:'Checks travel with the outcome',source:'quality.md · acceptance 02',scope:'main / verification',text:'A completed engineering change needs named checks and observed results. Missing, skipped, or failing checks cannot be displayed as passed.',kind:'◎'}
];
memories.forEach((m,i)=>{m.id=`decision-${i}`;m.branch=i===0?'all':'main';});memories[0].scope='project-wide / design';
memories.push({id:'settings-1',branch:'feature/settings',title:'Keep preferences explicit',source:'settings-plan.md · decision 01',scope:'feature/settings / experience',text:'The settings branch explores explicit local-only routing and optional activity notifications. These are authored example preferences, not a connection to a live model runtime.',kind:'◈'},{id:'settings-2',branch:'feature/settings',title:'Retain a visible save action',source:'settings-plan.md · decision 02',scope:'feature/settings / canvas',text:'The sample settings screen should retain an action label and use the shared accent token. Review changes against a checkpoint before exporting the generated component.',kind:'⌁'});
let memoryBranch='main',pinnedOnly=false,pinnedMemories=new Set();
try{const saved=JSON.parse(localStorage.getItem('bn-pinned-memories'));if(Array.isArray(saved))pinnedMemories=new Set(saved.filter(id=>memories.some(m=>m.id===id)));}catch{}
$('.memory-content').insertAdjacentHTML('beforebegin','<div class="memory-filters"><label for="memory-branch">BRANCH <select id="memory-branch"><option value="main">main</option><option value="feature/settings">feature/settings</option></select></label><button id="memory-pinned" aria-pressed="false">Pinned <span>0</span></button></div>');
$('#memory-branch').addEventListener('change',e=>{memoryBranch=e.target.value;renderMemories($('#memory-search').value);});$('#memory-pinned').addEventListener('click',()=>{pinnedOnly=!pinnedOnly;renderMemories($('#memory-search').value);});
function renderMemories(query=''){
  const container=$('#memory-results');container.replaceChildren();
  const scoped=memories.filter(m=>m.branch==='all'||m.branch===memoryBranch),filtered=scoped.filter(m=>(!pinnedOnly||pinnedMemories.has(m.id))&&`${m.title} ${m.source} ${m.text}`.toLowerCase().includes(query.toLowerCase().trim()));
  $('#panel-memory .mini-tag').textContent=`${scoped.length} scoped records`;$('#memory-pinned').setAttribute('aria-pressed',pinnedOnly);$('#memory-pinned span').textContent=pinnedMemories.size;
  if(!filtered.length){const p=document.createElement('p');p.className='memory-empty';p.textContent=pinnedOnly?'No pinned decisions match this branch and search. Switch off Pinned to explore the scoped records.':'No matching example decisions in this branch. Try “tokens”, “layout”, or “settings”.';container.append(p);return;}
  filtered.forEach(m=>{
    const row=document.createElement('div');row.className='memory-record';const icon=document.createElement('i');icon.textContent=m.kind;
    const body=document.createElement('div'),title=document.createElement('b'),source=document.createElement('small');title.textContent=m.title;source.textContent=`${m.source} · ${m.scope}`;body.append(title,source);
    const pin=document.createElement('button');pin.className='pin-memory';pin.id=`pin-${m.id}`;pin.textContent=pinnedMemories.has(m.id)?'★':'☆';pin.setAttribute('aria-pressed',pinnedMemories.has(m.id));pin.setAttribute('aria-label',`Pin ${m.title}`);pin.addEventListener('click',()=>{if(pinnedMemories.has(m.id))pinnedMemories.delete(m.id);else pinnedMemories.add(m.id);try{localStorage.setItem('bn-pinned-memories',JSON.stringify([...pinnedMemories]));}catch{}renderMemories($('#memory-search').value);(document.getElementById(`pin-${m.id}`)||$('#memory-pinned')).focus();});
    const button=document.createElement('button');button.textContent='View source ↗';button.setAttribute('aria-label',`View source for ${m.title}`);button.addEventListener('click',()=>showMemory(m));row.append(icon,body,pin,button);container.append(row);
  });
}
$('#memory-search').addEventListener('input',e=>renderMemories(e.target.value));

function renderChecks(){
  const checks=verifyWorkspace(config),count=checks.filter(c=>c.passed).length;
  $('#eval-count').textContent=`${count} / ${checks.length}`;$('#eval-ring').style.borderColor=count===checks.length?'#467d72':'#bd8068';
  const result=$('#check-results');result.replaceChildren();
  checks.forEach(c=>{const row=document.createElement('div');row.className=`check-row${c.passed?'':' fail'}`;row.title=c.detail;const icon=document.createElement('i');icon.textContent=c.passed?'✓':'×';const label=document.createElement('span');label.textContent=c.name;const status=document.createElement('small');status.textContent=c.passed?'PASS':'NEEDS ATTENTION';row.append(icon,label,status);result.append(row);});
  return {count,total:checks.length};
}
$('#run-checks').addEventListener('click',()=>{checksHaveRun=true;const result=renderChecks();studio?.recordRun();toast(`${result.count} of ${result.total} local fixture checks passed.`);});
$('#export-evidence').addEventListener('click',()=>{checksHaveRun=true;renderChecks();download('Blue-Nebula-Example-Evidence.json',JSON.stringify(createEvidenceReport(config),null,2),'application/json');toast('Current fixture evidence exported, including any failing checks.');});

function updateWorkflow(){
  const button=$('#run-workflow');
  const names={idle:'Run the workflow',running:'Pause workflow',paused:'Resume workflow',complete:'Run again'};
  button.replaceChildren(document.createTextNode(names[demo.status]));const icon=document.createElement('span');icon.textContent=demo.status==='running'?'Ⅱ':demo.status==='paused'?'▷':'↗';button.append(icon);
  $$('[data-step]').forEach(el=>{const i=Number(el.dataset.step);el.classList.toggle('done',i<demo.step||demo.status==='complete');el.classList.toggle('running',i===demo.step&&demo.status!=='complete');$('i',el).textContent=i<demo.step||demo.status==='complete'?'✓':i+1;});
}
const stepTabs=['memory','canvas','code','evaluation'];
function scheduleStep(){
  const currentEpoch=epoch;clearTimeout(timer);
  timer=setTimeout(()=>{if(currentEpoch!==epoch||demo.status!=='running')return;demo=advanceDemo(demo);showWorkflowStage();if(demo.status==='running')scheduleStep();},2000);
}
function showWorkflowStage(){
  updateWorkflow();
  if(demo.status==='complete'){
    const result=renderChecks();studio?.recordRun();live.textContent=`Guided workflow finished. ${result.count} of ${result.total} fixture checks passed.`;
    toast(result.count===result.total?'Workflow explored. Your example passes all five local checks.':`Workflow explored. ${result.total-result.count} check needs attention; inspect the results.`);return;
  }
  if(demo.step>=0){setTab(stepTabs[demo.step]);live.textContent=`Guided workflow: ${['recalling example project context','showing the editable canvas','reviewing generated React code','checking the example outcome'][demo.step]}.`;if(demo.step===3){checksHaveRun=true;renderChecks();}}
}
function runWorkflow(){
  if(demo.status==='running'||demo.status==='paused'){epoch++;clearTimeout(timer);demo=togglePause(demo);updateWorkflow();live.textContent=`Guided workflow ${demo.status}.`;if(demo.status==='running')scheduleStep();return;}
  if(studio&&!studio.prepareWorkflow())return;
  epoch++;clearTimeout(timer);demo=advanceDemo(createDemoState());showWorkflowStage();scheduleStep();
}
function cancelWorkflow(){epoch++;clearTimeout(timer);demo=createDemoState();updateWorkflow();}
function pauseGuidedWorkflow(reason){if(demo.status!=='running')return;epoch++;clearTimeout(timer);demo=togglePause(demo);updateWorkflow();live.textContent=reason;}
document.addEventListener('focusin',e=>{if(e.target.closest('.workspace-main'))pauseGuidedWorkflow('Workflow paused while you edit or inspect the workspace.');});
$('#run-workflow').addEventListener('click',runWorkflow);
$('#reset-workflow').addEventListener('click',()=>{epoch++;clearTimeout(timer);demo=createDemoState();updateWorkflow();setTab('canvas');live.textContent='Guided workflow reset.';toast('Workflow reset. Your canvas edits are preserved.');});
function scrollBehavior(){return document.body.classList.contains('motion-paused')||matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';}
$('#hero-tour').addEventListener('click',()=>sceneControls?.toggleExplode());

function updateHardware(){const ram=[16,32,64][Number($('#ram-slider').value)],p=getHardwareProfile(ram);$('#ram-label').textContent=`${ram} GB RAM`;$('#hardware-tag').textContent=p.tag;$('#hardware-name').textContent=p.name;$('#hardware-description').textContent=p.description;$('#hardware-vram').textContent=p.vram;$('#hardware-disk').textContent=p.disk;$('#ram-slider').setAttribute('aria-valuetext',`${ram} gigabytes RAM: ${p.name}`);}
$('#ram-slider').addEventListener('input',updateHardware);

function closeMenus(){
  $$('.nav-trigger').forEach(button=>{button.setAttribute('aria-expanded','false');document.getElementById(button.getAttribute('aria-controls')).hidden=true;});
  $('.mobile-toggle').setAttribute('aria-expanded','false');$('.mobile-toggle').setAttribute('aria-label','Open navigation');$('#mobile-nav').hidden=true;
}
$$('.nav-trigger').forEach(button=>button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')==='true';closeMenus();button.setAttribute('aria-expanded',!open);document.getElementById(button.getAttribute('aria-controls')).hidden=open;}));
$('.mobile-toggle').addEventListener('click',()=>{const open=$('#mobile-nav').hidden;closeMenus();$('.mobile-toggle').setAttribute('aria-expanded',open);$('.mobile-toggle').setAttribute('aria-label',open?'Close navigation':'Open navigation');$('#mobile-nav').hidden=!open;});
document.addEventListener('click',e=>{if(!e.target.closest('.nav-dropdown')&&!e.target.closest('#mobile-nav')&&!e.target.closest('.mobile-toggle'))closeMenus();});
$$('#mobile-nav a').forEach(a=>a.addEventListener('click',closeMenus));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const expanded=$('.nav-trigger[aria-expanded=true]');if(expanded){closeMenus();expanded.focus();}else if(!$('#mobile-nav').hidden){closeMenus();$('.mobile-toggle').focus();}}});

const dialog=$('#resource-dialog');let dialogTrigger;
const resources={
  vision:`<span class="dialog-label">PRODUCT VISION / NOVEMBER 2026</span><h2 id="dialog-title">A workspace that keeps<br>your intent connected.</h2><p>Blue Nebula is a proposed local-first engineering application connecting a repository, an editable visual canvas, persistent project memory, model runtimes, and permissioned actions.</p><h3>Start with one complete journey</h3><p>Resume a project with cited decisions. Shape a supported interface. Review the generated patch. Watch the validation. Keep the evidence with the outcome.</p><h3>A deliberately focused beginning</h3><p>The initial proposal centers on a single developer or small studio using Windows 11, VS Code, and React with TypeScript. Local inference and local storage are the defaults.</p><h3>What this site demonstrates</h3><p>The interactive workspace is a browser concept with generated JSX, example decisions, and local fixture checks. The desktop runtime, repository integration, local AI, and hardware support remain product requirements to build and qualify.</p>`,
  privacy:`<span class="dialog-label">OWNERSHIP PRINCIPLES / PROPOSED CONTRACT</span><h2 id="dialog-title">Your work deserves<br>clear boundaries.</h2><h3>Local is the starting point</h3><p>The proposed supported workflow runs locally after installation, without required remote inference, cloud embeddings, or a cloud account. Network-dependent integrations are optional.</p><h3>Permissions live outside the model</h3><p>Project scope, filesystem access, cloud requests, and consequential actions need explicit controls enforced by the application. A model’s suggestion cannot grant its own authority.</p><h3>Memory remains inspectable</h3><p>Project knowledge should have sources, branch applicability, correction, deletion, and readable export. Training is a separate later workflow; memory updates do not silently alter model weights.</p><h3>How this demonstration behaves</h3><p>This page makes no AI or analytics calls. Canvas preferences are saved only in this browser when storage is available. Exports are generated on your device. The hosting provider handles ordinary page delivery; no project files are uploaded by this demo.</p>`,
  'sample-project':`<span class="dialog-label">EXAMPLE PROJECT / NEXT CHAPTER</span><h2 id="dialog-title">A little project.<br>A bigger possibility.</h2><p>You’re exploring an illustrative welcome-screen project. The canvas values generate the React component in the Code tab. They are saved only in this browser when storage is available.</p><h3>Try the complete loop</h3><ul><li>Change the card’s heading and accent token.</li><li>Switch to Connected code to copy or download the JSX.</li><li>Explore the cited example decisions in Project memory.</li><li>Run the local fixture checks in Visible evidence.</li></ul><p>No repository, local model, or desktop app is connected to this example.</p>`
};
function openDialog(){pauseGuidedWorkflow('Workflow paused while you inspect a source or report.');const active=document.activeElement;dialogTrigger=active?.closest('.nav-dropdown')?.querySelector('.nav-trigger')||active;closeMenus();dialog.showModal();$('.dialog-close').focus();}
function showResource(id){if(!resources[id])return;$('#resource-content').innerHTML=resources[id];openDialog();}
function showMemory(memory){
  const content=$('#resource-content');content.replaceChildren();const label=document.createElement('span');label.className='dialog-label';label.textContent='ILLUSTRATIVE PROJECT DECISION';const title=document.createElement('h2');title.id='dialog-title';title.textContent=memory.title;const source=document.createElement('p');source.textContent=`Source: ${memory.source} · Scope: ${memory.scope}`;const text=document.createElement('p');text.textContent=memory.text;const note=document.createElement('p');note.textContent='This is authored example content, not a retrieved file from your machine. The intended product would link each decision to its actual source revision.';content.append(label,title,source,text,note);openDialog();
}
$$('[data-resource]').forEach(b=>b.addEventListener('click',()=>showResource(b.dataset.resource)));
$('.dialog-close').addEventListener('click',()=>dialog.close());$('.dialog-dismiss').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
dialog.addEventListener('close',()=>{if(dialogTrigger?.isConnected)dialogTrigger.focus();});
$$('[data-download="brief"]').forEach(button=>button.addEventListener('click',async()=>{
  try {const response=await fetch('/product-brief.md');if(!response.ok)throw Error('Unavailable');download('Blue-Nebula-Product-Brief.md',await response.text(),'text/markdown;charset=utf-8');toast('Product brief downloaded. Make room for your next idea.');}
  catch {toast('The brief could not be loaded. Please try again.');}
}));

initLandingExplorer({closeMenus});
finishStartupLanding();
const nebula=initNebulaHero();
studio=initStudio({initialCheckpoint:storedProject?.checkpoint,getConfig:()=>config,setConfig,setTab,toast,download,closeMenus,cancelWorkflow,showNode(node){$('#resource-content').replaceChildren(node);openDialog();},closeResource(){if(dialog.open)dialog.close();}});
initPrototypeUI();
const orbit=initEditorialScene($('#cinematic')),pageMotion=initPageMotion();sceneControls=orbit;let graphicsPaused=false;const motion=$('#motion-toggle'),motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
function updateMotion(){const reduced=motionPreference.matches;motion.disabled=reduced;motion.setAttribute('aria-pressed',graphicsPaused||reduced);motion.textContent=reduced?'Reduced motion enabled':graphicsPaused?'Play graphics ▷':'Pause graphics Ⅱ';orbit.setPaused(graphicsPaused||reduced);pageMotion.setPaused(graphicsPaused||reduced);nebula.setPaused(graphicsPaused||reduced);const scenePause=$('.scene-pause');scenePause.disabled=reduced;scenePause.setAttribute('aria-pressed',graphicsPaused||reduced);scenePause.setAttribute('aria-label',reduced?'Reduced motion enabled':graphicsPaused?'Play scene animation':'Pause scene animation');scenePause.innerHTML=reduced?'Reduced motion':graphicsPaused?'▷ <span>Resume animation</span>':'Ⅱ <span>Pause animation</span>';}
$('.scene-pause').addEventListener('click',()=>motion.click());
motion.addEventListener('click',()=>{graphicsPaused=!graphicsPaused;document.body.classList.toggle('motion-paused',graphicsPaused);updateMotion();});motionPreference.addEventListener('change',updateMotion);
applyConfig(false);renderMemories();updateHardware();updateWorkflow();updateMotion();
if(document.body.hasAttribute('data-prototype-page')){
  const launch=readPrototypeLaunch(location.search);
  studio.open(launch);
  // A template link is an initial action; a refresh should restore subsequent edits.
  if(launch.template){const url=new URL(location.href);url.searchParams.delete('template');history.replaceState(history.state,'',url.pathname+url.search+url.hash);}
  $('#studio-dialog').addEventListener('close',()=>location.assign('/'),{once:true});
}
