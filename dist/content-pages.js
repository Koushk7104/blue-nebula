import {ACCENTS,normalizeConfig,generateComponent,verifyWorkspace,getHardwareProfile} from './core.mjs';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];

function bindTabs(selector,attribute,select){
  const tabs=$$(selector),container=tabs[0]?.parentElement;if(!container)return;
  tabs.forEach(tab=>tab.addEventListener('click',()=>select(tab.dataset[attribute])));
  container.addEventListener('keydown',event=>{
    const index=tabs.indexOf(document.activeElement);if(index<0)return;let next=index;
    if(['ArrowRight','ArrowDown'].includes(event.key))next=(index+1)%tabs.length;else if(['ArrowLeft','ArrowUp'].includes(event.key))next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;
    event.preventDefault();select(tabs[next].dataset[attribute]);tabs[next].focus();
  });
}

if($('[data-walkthrough]')){
  const content=['context','canvas','code','checks'];let step='context';
  const captions={context:'Start with the reason behind the change.',canvas:'Edit a supported property and see the screen respond.',code:'The generated text reflects the current example values.',checks:'Inspect named results, including an empty-heading failure.'};
  const launch={context:'memory',canvas:'canvas',code:'code',checks:'checks'};
  content.forEach(id=>$('#walkthrough-'+id).dataset.stepContent='');
  function render(){
    const configuration=normalizeConfig({title:$('#walkthrough-title').value,description:'A small screen with a readable implementation.',accent:$('#walkthrough-accent').value,gap:Number($('#walkthrough-gap').value)});
    $('#walkthrough-gap-value').textContent=configuration.gap+' px';
    $('#walkthrough-preview-title').textContent=configuration.title||'Add a heading';
    $('.walkthrough-screen').style.setProperty('--example-accent',ACCENTS[configuration.accent]);
    $('.walkthrough-screen').style.gap=configuration.gap+'px';
    $('#walkthrough-source').textContent=generateComponent(configuration);
    const results=verifyWorkspace(configuration),passed=results.filter(item=>item.passed).length;
    $('#walkthrough-check-summary').textContent=`${passed} of ${results.length} checks passed.`;
    const host=$('#walkthrough-results');host.replaceChildren();
    for(const result of results){const row=document.createElement('div');row.className='walkthrough-result'+(result.passed?'':' result-failed');const label=document.createElement('span');label.textContent=result.name;const status=document.createElement('b');status.textContent=result.passed?'PASS':'NEEDS ATTENTION';row.append(label,status);host.append(row);}
  }
  function select(id){
    if(!content.includes(id))return;step=id;
    $$('[data-step]').forEach(tab=>{const chosen=tab.dataset.step===step;tab.setAttribute('aria-selected',chosen);tab.tabIndex=chosen?0:-1;});
    content.forEach(key=>$('#walkthrough-'+key).hidden=key!==step);
    $('#walkthrough-panel').setAttribute('aria-labelledby','step-'+step);$('#walkthrough-caption').textContent=captions[step];$('#walkthrough-launch').href='/prototype/?tab='+launch[step];
  }
  bindTabs('[data-step]','step',select);
  ['walkthrough-title','walkthrough-accent','walkthrough-gap'].forEach(id=>$('#'+id).addEventListener('input',render));render();
}

if($('[data-boundary]')){
  const modes={
    browser:{device:'THIS BROWSER',runtime:'Scripted workflow · no AI model connected',gate:'No project upload',external:'Not used by this prototype',status:'CURRENT DEMO BEHAVIOR',title:'Edits stay in this browser.',description:'Configuration and checkpoints use this browser’s storage when available. Files and reports are exported on your device. The demo makes no AI or analytics requests.'},
    local:{device:'PROPOSED DESKTOP WORKSPACE',runtime:'Qualified local model + project retrieval',gate:'Local by default',external:'Optional integrations remain outside this path',status:'PLANNED LOCAL RUNTIME',title:'Keep the supported workflow on your machine.',description:'The planned desktop application would connect authorized project files, persistent memory, and a qualified local model. This local runtime and repository connection are not implemented by the browser prototype.'},
    cloud:{device:'PROPOSED DESKTOP WORKSPACE',runtime:'Local workspace + explicit external request',gate:'Permission + data scope',external:'A chosen provider, after explicit authorization',status:'OPTIONAL ARCHITECTURE PATH',title:'Make the destination and scope explicit.',description:'An optional cloud integration would identify its purpose, destination, and authorized data before making a request. Selecting this illustration does not connect a provider or send project data.'}
  };
  function select(mode){
    if(!modes[mode])return;const item=modes[mode];
    $$('[data-boundary]').forEach(tab=>{const chosen=tab.dataset.boundary===mode;tab.setAttribute('aria-selected',chosen);tab.tabIndex=chosen?0:-1;});
    $('#boundary-panel').setAttribute('aria-labelledby','boundary-'+mode);$('.boundary-diagram').classList.toggle('has-network',mode==='cloud');
    for(const [id,value] of Object.entries({deviceLabel:item.device,runtime:item.runtime,gate:item.gate,externalLabel:item.external,status:item.status,title:item.title,description:item.description})){
      const name=id.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase());$('#boundary-'+name).textContent=value;
    }
    document.dispatchEvent(new CustomEvent('bn:guide-change',{detail:'boundary'}));
  }
  bindTabs('[data-boundary]','boundary',select);
}
if($('[data-profile]')){
  function select(ram){const profile=getHardwareProfile(ram);$$('[data-profile]').forEach(button=>button.setAttribute('aria-pressed',Number(button.dataset.profile)===ram));for(const [id,value] of Object.entries({tag:profile.tag,title:profile.name,description:profile.description,ram:ram+' GB RAM',vram:profile.vram,disk:profile.disk}))$('#profile-'+id).textContent=value;}
  $$('[data-profile]').forEach(button=>button.addEventListener('click',()=>{select(Number(button.dataset.profile));document.dispatchEvent(new CustomEvent('bn:guide-change',{detail:'hardware'}));}));select(32);
}
