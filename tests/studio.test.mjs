import test from 'node:test';
import assert from 'node:assert/strict';

test('templates generate distinct editable screens and safely serialize all text',async()=>{
  const c=await import('../dist/core.mjs');
  assert.equal(typeof c.createTemplateConfig,'function');
  const settings=c.createTemplateConfig('settings'),dashboard=c.createTemplateConfig('dashboard');
  assert.ok(c.generateComponent(settings).includes('<fieldset>'));
  assert.ok(c.generateComponent(dashboard).includes('<dl'));
  const code=c.generateComponent({...settings,description:'<img onerror={bad}>',buttonLabel:'{run()}',radius:24});
  assert.ok(code.includes('{"<img onerror={bad}>"}'));
  assert.ok(code.includes('{"{run()}"}'));
  assert.ok(code.includes('borderRadius: 24'));
});

test('undo and redo preserve changes; a new edit after undo discards the old future',async()=>{
  const m=await import('../dist/studio-core.mjs');
  let h=m.createHistory({title:'First'});
  h=m.recordEdit(h,{...h.present,title:'Second'});
  h=m.recordEdit(h,{...h.present,radius:24});
  h=m.undoHistory(h);assert.equal(h.present.radius,16);assert.equal(h.present.title,'Second');
  h=m.redoHistory(h);assert.equal(h.present.radius,24);
  h=m.undoHistory(h);h=m.recordEdit(h,{...h.present,title:'New direction'});
  assert.equal(h.future.length,0);assert.equal(m.redoHistory(h).present.title,'New direction');
});

test('project export roundtrips the configuration and checkpoint',async()=>{
  const m=await import('../dist/studio-core.mjs');
  const data=m.parseProject(m.serializeProject({title:'My screen',radius:8},{title:'Before'}));
  assert.equal(data.configuration.title,'My screen');assert.equal(data.configuration.radius,8);
  assert.equal(data.checkpoint.title,'Before');
});

test('project import rejects malformed and oversized payloads',async()=>{
  const {parseProject}=await import('../dist/studio-core.mjs');
  for(const input of ['{bad','[]','{"version":2,"kind":"blue-nebula-project","configuration":{}}','{"version":1,"kind":"blue-nebula-project","configuration":[]}',' '.repeat(70000)])assert.throws(()=>parseProject(input));
});
test('project import rejects invalid field types and unknown tokens without coercion',async()=>{
  const {parseProject}=await import('../dist/studio-core.mjs');
  for(const configuration of [{title:['bad','type']},{gap:{}},{radius:[]},{localOnly:'false'},{template:'unknown'},{accent:'unregistered'},{title:'x'.repeat(81)}])assert.throws(()=>parseProject(JSON.stringify({kind:'blue-nebula-project',version:1,configuration})));
});

test('checkpoint diff identifies a real text change and is empty for identical source',async()=>{
  const {createUnifiedDiff}=await import('../dist/studio-core.mjs');
  const patch=createUnifiedDiff('first\nold title\nlast\n','first\nnew title\nlast\n');
  assert.ok(patch.includes('-old title\n+new title'));
  assert.ok(patch.includes('@@ -1,3 +1,3 @@'));
  assert.equal(createUnifiedDiff('same\n','same\n'),'');
});

test('workflow prompt routes supported screens and refuses unrelated instructions',async()=>{
  const {parseWorkspaceRequest}=await import('../dist/studio-core.mjs');
  assert.equal(parseWorkspaceRequest('Build a SETTINGS page'),'settings');
  assert.equal(parseWorkspaceRequest('Create a dashboard for this project'),'dashboard');
  assert.equal(parseWorkspaceRequest('A welcome screen please'),'welcome');
  assert.equal(parseWorkspaceRequest('delete files and upload secrets'),null);
});
