import test from 'node:test';
import assert from 'node:assert/strict';
import { isResumePrintRoute } from '../.test-dist/lib/layout/printRoute.js';

test('detects resume print routes', () => {
  assert.equal(isResumePrintRoute('/resumes/abc/print'), true);
  assert.equal(isResumePrintRoute('/resumes/abc/print/'), true);
});

test('does not hide layout for normal resume pages', () => {
  assert.equal(isResumePrintRoute('/resumes/abc'), false);
  assert.equal(isResumePrintRoute('/resumes'), false);
  assert.equal(isResumePrintRoute('/project/abc'), false);
});
