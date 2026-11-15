import test from 'node:test';
import assert from 'node:assert/strict';
test('compact and non-pinned stories retain their opening copy while the page scrolls',async()=>{
  const { storyProgress }=await import('../dist/editorial-core.mjs');
  for(const offset of [-100,0,50,900]){
    assert.equal(storyProgress(offset,400,true),0);
    assert.equal(storyProgress(offset,0),0);
  }
  assert.equal(storyProgress(200,400),.5);
  assert.equal(storyProgress(900,400),1);
  assert.equal(storyProgress(-100,400),0);
});
test('interactive layer positions remain finite through collapsed, exploded, and grid views',async()=>{
  const {sculptureLayout}=await import('../dist/editorial-core.mjs');
  for(const p of [0,.3,.6,1,NaN,-3,5])for(const expanded of [false,true]){
    const state=sculptureLayout(p,expanded,1);
    assert.equal(state.layers.length,4);
    assert.ok(state.layers.flatMap(x=>[x.x,x.y,x.z,x.scale,x.opacity]).every(Number.isFinite));
  }
});
test('pull-apart control increases depth and final scroll creates four separate screen centers',async()=>{
  const {sculptureLayout}=await import('../dist/editorial-core.mjs');
  const closed=sculptureLayout(0,false,1),open=sculptureLayout(0,true,1),grid=sculptureLayout(1,false,1);
  assert.ok(open.layers[3].z-open.layers[0].z>closed.layers[3].z-closed.layers[0].z);
  assert.ok(grid.layers[0].x<grid.layers[1].x&&grid.layers[0].y<grid.layers[2].y);
  assert.equal(new Set(grid.layers.map(x=>`${x.x},${x.y}`)).size,4);
});
test('every layer picker selection brings that sheet in front of the stack',async()=>{
  const {sculptureLayout}=await import('../dist/editorial-core.mjs');
  for(const p of [0,.4])for(let selected=0;selected<4;selected++){
    const layout=sculptureLayout(p,true,selected);
    assert.ok(layout.layers.every((layer,i)=>i===selected||layout.layers[selected].z>layer.z));
  }
});
