import test from 'node:test';
import assert from 'node:assert/strict';
import * as motion from '../dist/motion-core.mjs';

test('product surface settles toward its natural size as it enters the viewport',()=>{
  const entering=motion.surfaceFrame(650,600,720);
  const settled=motion.surfaceFrame(-600,600,720);
  assert.ok(entering.scale<settled.scale);
  assert.ok(entering.lift>settled.lift);
  assert.deepEqual(settled,{scale:1,lift:0});
});

test('surface transforms stay finite and bounded through overscroll and invalid dimensions',()=>{
  for(const top of [-10000,0,500,10000,NaN])for(const height of [0,600,NaN])for(const viewport of [0,720,NaN]){
    const frame=motion.surfaceFrame(top,height,viewport);
    assert.ok(Number.isFinite(frame.scale)&&frame.scale>=.98&&frame.scale<=1);
    assert.ok(Number.isFinite(frame.lift)&&frame.lift>=0&&frame.lift<=18);
  }
  assert.deepEqual(motion.surfaceFrame(600,600,720,false),{scale:1,lift:0});
});

test('pointer detail stays centered at rest and bounded outside its surface',()=>{
  assert.deepEqual(motion.pointerMotion(100,50,200,100),{x:0,y:0});
  for(const [x,y] of [[0,0],[200,100],[-999,999]]){
    const offset=motion.pointerMotion(x,y,200,100);
    assert.ok(Math.abs(offset.x)<=4&&Math.abs(offset.y)<=3);
  }
  assert.deepEqual(motion.pointerMotion(10,10,0,0),{x:0,y:0});
});
