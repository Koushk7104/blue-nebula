import test from 'node:test';
import assert from 'node:assert/strict';

test('scroll scene clamps overscroll and never produces invalid transforms',async()=>{
  const m=await import('../dist/motion-core.mjs');
  for(const p of [-3,0,.18,.4,.7,1,8,NaN]){
    const f=m.sceneFrame(p);
    assert.ok(f.progress>=0&&f.progress<=1);
    assert.ok(Object.values(f).every(Number.isFinite));
  }
});
test('scroll chapters have distinct readable states',async()=>{
  const {sceneFrame}=await import('../dist/motion-core.mjs');
  assert.equal(sceneFrame(0).intro,1);
  assert.equal(sceneFrame(.43).chapterOne,1);
  assert.equal(sceneFrame(.88).chapterTwo,1);
  assert.equal(sceneFrame(.88).intro,0);
});
test('morph geometry preserves particle identity while changing spatial structure',async()=>{
  const {createMorphPoints,morphPoint,sceneFrame}=await import('../dist/motion-core.mjs');
  const points=createMorphPoints(120);
  assert.equal(points.length,120);
  assert.deepEqual(points,createMorphPoints(120));
  const a=morphPoint(points[15],sceneFrame(0));
  const b=morphPoint(points[15],sceneFrame(.5));
  assert.notDeepEqual(a,b);
  assert.ok([...a,...b].every(Number.isFinite));
});
test('final scene separates the four panels without losing finite positions',async()=>{
  const {createMorphPoints,morphPoint,sceneFrame}=await import('../dist/motion-core.mjs');
  const points=createMorphPoints(64),frame=sceneFrame(1);
  const centers=[0,1,2,3].map(layer=>points.filter(p=>p.layer===layer).map(p=>morphPoint(p,frame)));
  assert.ok(centers.every(group=>group.length===16));
  assert.ok(centers.flat(2).every(Number.isFinite));
  assert.ok(frame.spread>.99);
});
