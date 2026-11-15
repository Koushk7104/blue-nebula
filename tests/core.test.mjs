import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoState, advanceDemo, togglePause, generateComponent, verifyWorkspace, getHardwareProfile } from '../dist/core.mjs';

test('workflow reaches completion only after every stage', () => {
  let state = createDemoState();
  assert.equal(state.status, 'idle');
  for (let i=0;i<4;i++) state=advanceDemo(state);
  assert.equal(state.step, 3);
  assert.equal(state.status, 'running');
  state=advanceDemo(state);
  assert.equal(state.status, 'complete');
  assert.equal(advanceDemo(state), state);
});

test('paused workflow cannot advance; resume preserves the current stage', () => {
  let state=advanceDemo(createDemoState());
  state=togglePause(state);
  assert.equal(state.status, 'paused');
  assert.equal(advanceDemo(state), state);
  state=togglePause(state);
  assert.equal(state.step, 0);
  assert.equal(advanceDemo(state).step, 1);
});

test('reset state has no completed stages from a prior run', () => {
  const fresh=createDemoState();
  assert.equal(fresh.step, -1);
  assert.equal(fresh.status, 'idle');
});

test('generated JSX treats HTML and expressions as literal text', () => {
  const output=generateComponent({title:'<script>{alert(1)}</script>', accent:'blue', gap:16});
  assert.ok(output.includes('{"<script>{alert(1)}</script>"}'));
  assert.ok(!output.includes('<h2><script>'));
});

test('code generation clamps invalid layout and never interpolates arbitrary CSS', () => {
  const output=generateComponent({title:'Hello', accent:'red;position:fixed', gap:999});
  assert.ok(output.includes('gap: 32'));
  assert.ok(output.includes('#459eff'));
  assert.ok(!output.includes('position:fixed'));
});

test('actual fixture checks report missing heading instead of claiming every check passed', () => {
  const checks=verifyWorkspace({title:'  ',accent:'blue',gap:16});
  assert.equal(checks.find(c=>c.id==='heading').passed, false);
  assert.ok(checks.some(c=>c.passed));
});

test('valid example passes every local fixture check', () => {
  assert.ok(verifyWorkspace({title:'Build something great.',accent:'blue',gap:16}).every(c=>c.passed));
});

test('hardware guide distinguishes minimum and reference profile without speed guarantees', () => {
  assert.equal(getHardwareProfile(16).id, 'limited');
  assert.equal(getHardwareProfile(32).id, 'reference');
  assert.equal(getHardwareProfile(64).id, 'advanced');
  assert.equal(getHardwareProfile(8).id, 'unsupported');
});

test('exported evidence retains a failing check and labels its validation limits', async () => {
  const core=await import('../dist/core.mjs');
  assert.equal(typeof core.createEvidenceReport, 'function');
  const report=core.createEvidenceReport({title:'',accent:'blue',gap:16}, '2026-11-01T00:00:00Z');
  assert.equal(report.summary.passed,4);
  assert.equal(report.checks.find(c=>c.id==='heading').passed,false);
  assert.ok(report.limitations.some(text=>text.includes('compiler')));
  assert.equal(report.generatedAt,'2026-11-01T00:00:00Z');
});
