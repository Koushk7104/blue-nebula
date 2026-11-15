import test from 'node:test';
import assert from 'node:assert/strict';

test('prototype launch accepts only supported templates and views',async()=>{
  const {readPrototypeLaunch}=await import('../dist/prototype-core.mjs');
  assert.deepEqual(readPrototypeLaunch('?template=dashboard&tab=code'),{template:'dashboard',tab:'code'});
  assert.deepEqual(readPrototypeLaunch('?tab=checks'),{tab:'evaluation'});
  assert.deepEqual(readPrototypeLaunch('?template=<script>&tab=https://example.com'),{tab:'canvas'});
  assert.deepEqual(readPrototypeLaunch(''),{tab:'canvas'});
});

test('all product routes load directly and keep the correct page script',async t=>{
  const {createStaticServer}=await import('../server.mjs');
  const server=createStaticServer();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const origin=`http://127.0.0.1:${server.address().port}`;
  for(const route of ['/','/product/','/how-it-works/','/why-local/','/prototype/']){
    const response=await fetch(origin+route);
    assert.equal(response.status,200,route);
    const html=await response.text();
    assert.match(html,/<title>Blue Nebula/);
    assert.match(html,route==='/'?/src="\/scale.js"/:route==='/prototype/'?/src="\/app.js"/:/src="\/content-pages.js"/);
  }
  const redirect=await fetch(origin+'/why-local?view=local',{redirect:'manual'});
  assert.equal(redirect.status,301);
  assert.equal(redirect.headers.get('location'),'/why-local/?view=local');
  assert.equal((await fetch(origin+'/missing-page/')).status,404);
});
