import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getResumePageDensity,
  getResumePageWarning,
  shouldShowResumePageWarning,
} from '../.test-dist/lib/resume/pageLayout.js';

test('maps target page count to density mode', () => {
  assert.equal(getResumePageDensity(1, 1), 'normal');
  assert.equal(getResumePageDensity(1, 2), 'compact');
  assert.equal(getResumePageDensity(1, 3), 'tight');
  assert.equal(getResumePageDensity(1, 4), 'overflow');
  assert.equal(getResumePageDensity(2, 1), 'relaxed');
  assert.equal(getResumePageDensity(2, 6), 'tight');
  assert.equal(getResumePageDensity(3, 7), 'tight');
  assert.equal(getResumePageDensity(3, 8), 'overflow');
});

test('returns warning only when target page is still exceeded at max compression', () => {
  assert.equal(getResumePageWarning(1, 'overflow'), '内容太多，当前 1 页模板装不下，请删减内容或改成更多页');
  assert.equal(getResumePageWarning(2, 'overflow'), '内容太多，当前 2 页模板还是装不下，请继续删减内容或改成更多页');
  assert.equal(getResumePageWarning(3, 'overflow'), '内容太多，当前 3 页模板还是装不下，请继续删减内容或改成更多页');
  assert.equal(getResumePageWarning(2, 'compact'), '');
  assert.equal(getResumePageWarning(3, 'relaxed'), '');
});

test('only shows page warnings in the editable preview, never in print output', () => {
  assert.equal(shouldShowResumePageWarning(false, '内容太多'), true);
  assert.equal(shouldShowResumePageWarning(true, '内容太多'), false);
  assert.equal(shouldShowResumePageWarning(false, ''), false);
});
