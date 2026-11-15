import test from 'node:test';
import assert from 'node:assert/strict';

test('slow scrolling releases manual selection after cumulative movement while compact modes stay selected',async()=>{
  const {resolveNebulaMode}=await import('../dist/nebula-core.mjs');
  let manual=1;
  for(let scroll=1;scroll<=7;scroll++){
    const state=resolveNebulaMode({manual,origin:0,scroll,progress:.3,scrollDriven:true});
    assert.equal(state.manual,scroll<=6?1:null);
    assert.equal(state.target,scroll<=6?1:.3);
    manual=state.manual;
  }
  assert.deepEqual(resolveNebulaMode({manual:1,origin:0,scroll:900,progress:.6,scrollDriven:false}),{manual:1,target:1});
});

test('hero geometry stays finite and bounded through scroll, pointer extremes, and invalid inputs',async()=>{
  const {createNebulaPoints,nebulaPoint,projectNebulaPoint}=await import('../dist/nebula-core.mjs');
  const points=createNebulaPoints(192);
  for(const progress of [-9,0,.5,1,8,NaN])for(const pointerX of [-200,0,300,NaN]){
    for(const point of points){
      const position=nebulaPoint(point,{progress,pointerX,pointerY:Infinity,time:NaN});
      assert.ok(position.every(value=>Number.isFinite(value)&&Math.abs(value)<5));
      const screen=projectNebulaPoint(position,0,NaN);
      assert.ok(Object.values(screen).every(Number.isFinite));
    }
  }
});

test('scroll resolves the same particles into four distinct connected sheets',async()=>{
  const {createNebulaPoints,nebulaPoint}=await import('../dist/nebula-core.mjs');
  const points=createNebulaPoints(192);
  const opening=points.map(point=>nebulaPoint(point,{progress:0,time:0}));
  const layers=points.map(point=>nebulaPoint(point,{progress:1,time:0}));
  assert.ok(opening.some((position,i)=>Math.hypot(...position.map((value,j)=>value-layers[i][j]))>1));
  const centers=[0,1,2,3].map(layer=>nebulaPoint({...points[0],layer,gridX:0,gridY:0},{progress:1,time:0}));
  assert.equal(new Set(centers.map(center=>center.map(n=>n.toFixed(3)).join(','))).size,4);
});

test('particle budgets are capped and geometry is deterministic at a fixed frame',async()=>{
  const {createNebulaPoints,nebulaPoint}=await import('../dist/nebula-core.mjs');
  assert.ok(createNebulaPoints(1e8).length<=2600);
  assert.ok(createNebulaPoints(NaN).length<=2600);
  const point=createNebulaPoints(192)[13];
  assert.deepEqual(nebulaPoint(point,{progress:.4,time:12,pointerX:.2}),nebulaPoint(point,{progress:.4,time:12,pointerX:.2}));
});
