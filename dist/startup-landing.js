/** Presentation only: the editor and all project state stay in the existing app. */
export function mountStartupLanding(){
  const $=selector=>document.querySelector(selector);
  document.body.classList.add('startup-page');
  const hero=$('.startup-hero');

  // The actual editable product is the first visual, rather than a mock dashboard.
  hero.after($('#workspace'));
  $('#workspace-heading').textContent='One project. One connected workflow.';
  $('.workspace-section .section-heading .eyebrow').textContent='EXPLORE THE PROTOTYPE';
  $('.workspace-section .section-heading>p').textContent='Edit the canvas. Inspect the code. See what changed.';
  $('.demo-caption').innerHTML='<span>Works in your browser. Your edits stay on this device.</span><span>Scripted prototype · no AI model connected</span>';

  const problem=$('.connected-section');
  $('.stack-strip').after(problem);
  problem.querySelector('.section-heading').prepend(problem.querySelector('.eyebrow'));
  problem.querySelector('.eyebrow').textContent='THE PROBLEM';
  problem.querySelector('h2').innerHTML='Your project is more<br>than the last prompt.';
  problem.querySelector('.section-heading>p').textContent='Software work moves between conversations, designs, and a codebase. Blue Nebula is being built to keep those pieces connected.';
  const features=[
    ['.memory-feature','01','Keep the reason behind a decision.','Project memory should carry its source and branch context into the next session.','Explore example memory'],
    ['.canvas-feature','02','Move from design to a readable change.','Edit a supported interface, inspect the generated component, and compare it with a checkpoint.','Try a canvas edit'],
    ['.evidence-feature','03','Know what was actually checked.','Review the change and its named checks before deciding what to accept.','Run the fixture checks']
  ];
  for(const [selector,index,title,description,action] of features){
    const card=$(selector);
    card.querySelector('h3').textContent=title;
    card.querySelector(':scope>p').textContent=description;
    card.querySelector('.feature-kicker').textContent=index;
    card.querySelector('.feature-link').innerHTML=action+' <span aria-hidden="true">↗</span>';
  }
  problem.after($('#cinematic'));
  const story=$('#cinematic');
  story.setAttribute('aria-label','How project memory, design, code, and checks connect');
  const originalHeading=story.querySelector('h1'),heading=document.createElement('h2');
  heading.id=originalHeading.id;heading.innerHTML='One project.<br><em>Four connected layers.</em>';originalHeading.replaceWith(heading);
  const stories=[
    ['THE PRODUCT IDEA','A single workspace for the context behind your software. Select a layer, or pull the model apart to explore the connections.'],
    ['DESIGN → CODE','A design change should stay connected to its implementation. Edit a screen, then inspect exactly what changed.'],
    ['CONTEXT → REVIEW','Bring the project decisions into view. Review the code change and its checks in the same workflow.']
  ];
  story.querySelectorAll('[data-copy]').forEach((block,i)=>{block.querySelector('.editorial-kicker').textContent=stories[i][0];block.querySelector('p').textContent=stories[i][1];});
  story.querySelector('[data-copy="1"] h2').innerHTML='From a visual edit<br><em>to a readable change.</em>';
  story.querySelector('[data-copy="2"] h2').innerHTML='Keep the context.<br><em>Review the outcome.</em>';
  story.querySelector('.editorial-concept').textContent='Explore the model. Then try the working prototype.';

  $('.local-copy .eyebrow').textContent='LOCAL FIRST, BY DESIGN';
  $('.local-copy h2').innerHTML='Your machine.<br>Your project.<br><span class="muted">Your boundaries.</span>';
  $('.local-copy>p').textContent='The planned desktop workspace starts with local storage and local inference. External services would be optional, with explicit controls over what leaves the project.';

  $('#roadmap').innerHTML=`<div class="section-heading"><div><div class="eyebrow">WHERE WE ARE</div><h2>A working prototype.<br><span class="muted">A focused next step.</span></h2></div><p>Start with the workflow. Build the local runtime around it.</p></div>
    <div class="startup-progress"><article><span class="progress-status available">AVAILABLE TO EXPLORE</span><h3>The browser prototype</h3><p>Editable screens, generated JSX, checkpoint diffs, sample project memory, and local fixture checks.</p><button class="feature-link" data-open-studio>Try it yourself <span aria-hidden="true">↗</span></button></article><article><span class="progress-status">PLANNED MVP</span><h3>The local engineering workspace</h3><p>Windows, VS Code, and React with TypeScript. Local model qualification, repository integration, and permissioned actions.</p><button class="feature-link" data-download="brief">Read the product brief <span aria-hidden="true">↓</span></button></article></div>`;

  $('.faq-section .eyebrow').textContent='A FEW DETAILS';
  $('.faq-section h2').textContent='Good questions.';
  $('.closing-content .eyebrow').textContent='SEE THE WORKFLOW FOR YOURSELF';
  $('.closing-content h2').innerHTML='Make a change.<br><span>See the whole picture.</span>';
  $('.closing-content>p').textContent='Open the prototype and follow a design edit through to code.';
  const closing=$('.closing-content>.button');
  closing.outerHTML='<button class="button" data-open-studio>Try the prototype <span aria-hidden="true">↗</span></button>';
  $('.closing-caption').textContent='No account needed. Runs in your browser.';
  $('.closing-section').insertAdjacentHTML('afterbegin',`<svg class="closing-routes" viewBox="0 0 400 400" fill="none" aria-hidden="true"><path pathLength="1" d="M25 65H165Q190 65 190 90V310Q190 335 215 335H375"/><path pathLength="1" d="M25 335H95Q120 335 120 310V90Q120 65 145 65H375"/><path pathLength="1" d="M25 200H375"/><path pathLength="1" d="M260 25V375"/><circle cx="120" cy="65" r="7"/><circle cx="190" cy="200" r="9"/><circle cx="260" cy="335" r="7"/><circle cx="260" cy="65" r="5"/></svg>`);
  $('.footer-main>p').innerHTML='A local-first AI workspace.<br>Built around your project.';
  $('.footer-bottom>span:first-child').textContent='© 2026 Blue Nebula. In development.';
}

export function finishStartupLanding(){
  const $=selector=>document.querySelector(selector);
  // Shared navigation is authored by the static page generator.
  $('.editorial-copy .scene-actions>.button').innerHTML='Open the prototype <span aria-hidden="true">↗</span>';

  const details=document.createElement('section');details.className='product-details shell';
  details.setAttribute('aria-labelledby','details-heading');
  details.innerHTML='<div class="details-heading"><span class="eyebrow">GO A LITTLE DEEPER</span><h2 id="details-heading">The details, when you need them.</h2></div>';
  $('#local-first').after(details);
  const groups=[
    ['#solutions','Workflow examples','Three starting points you can open in the prototype.'],
    ['#architecture','Inside the proposed architecture','Memory, canvas, code, and verification.'],
    ['#hardware','Proposed hardware profiles','Explore the configurations in the product brief.']
  ];
  for(const [selector,title,description] of groups){
    const content=$(selector),disclosure=document.createElement('details');
    disclosure.className='product-disclosure';disclosure.id=content.id;content.id+='-content';
    disclosure.innerHTML=`<summary><span><b>${title}</b><small>${description}</small></span><i aria-hidden="true">+</i></summary>`;
    disclosure.append(content);details.append(disclosure);
  }
  const toolchain=$('.stack-strip');
  toolchain.querySelector('p').innerHTML='INITIAL PRODUCT SCOPE<br><b>Built around familiar tools.</b>';
  const small=toolchain.querySelector(':scope>small');if(small)small.textContent='PLANNED INTEGRATIONS';
  // Browser fragment navigation can reveal the requested native disclosure.
  function revealFragment(hash=location.hash){
    let id;try{id=decodeURIComponent(hash.slice(1));}catch{return;}
    const target=document.getElementById(id);
    if(!target)return;
    if(target.matches('.product-disclosure'))target.open=true;
    for(let parent=target.parentElement;parent;parent=parent.parentElement)if(parent.matches('.product-disclosure'))parent.open=true;
  }
  window.addEventListener('hashchange',()=>revealFragment());
  document.addEventListener('click',event=>{const link=event.target.closest('a[href^="#"]');if(link)revealFragment(link.hash);});
  revealFragment();
}
