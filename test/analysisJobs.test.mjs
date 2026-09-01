import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAnalysisJob,
  resetAnalysisJobsForTest,
  startAnalysisJob,
} from '../.test-dist/lib/analysis/analysisJobs.js';

test('analysis job keeps running status and stores success result', async () => {
  resetAnalysisJobsForTest();
  let resolveRunner;
  const runnerPromise = new Promise((resolve) => { resolveRunner = resolve; });

  const started = startAnalysisJob('p1', () => runnerPromise);
  assert.equal(started.status, 'running');
  assert.equal(getAnalysisJob('p1').status, 'running');

  resolveRunner({ analysisId: 'a1', scannedFiles: 3 });
  await runnerPromise;
  await new Promise((resolve) => setTimeout(resolve, 0));

  const done = getAnalysisJob('p1');
  assert.equal(done.status, 'success');
  assert.equal(done.analysisId, 'a1');
  assert.equal(done.scannedFiles, 3);
});

test('analysis job reuses current running task and stores error details', async () => {
  resetAnalysisJobsForTest();
  let rejectRunner;
  const runnerPromise = new Promise((_resolve, reject) => { rejectRunner = reject; });

  const first = startAnalysisJob('p2', () => runnerPromise);
  const second = startAnalysisJob('p2', async () => ({ analysisId: 'a2', scannedFiles: 1 }));
  assert.equal(second.status, 'running');
  assert.equal(second.startedAt, first.startedAt);

  rejectRunner(new Error('API 请求超时'));
  await runnerPromise.catch(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, 0));

  const failed = getAnalysisJob('p2');
  assert.equal(failed.status, 'error');
  assert.equal(failed.error, 'AI 自动分析失败');
  assert.equal(failed.details, 'API 请求超时');
});
