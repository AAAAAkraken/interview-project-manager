import test from 'node:test';
import assert from 'node:assert/strict';
import { getResumeTemplateLayoutConfig } from '../.test-dist/lib/resume/templateLayout.js';

test('uses tighter personal-info spacing in dense layouts', () => {
  const config = getResumeTemplateLayoutConfig('compact');

  assert.equal(config.personalInfoGap, '10px');
  assert.equal(config.personalInfoRowPadding, '2px 0');
  assert.equal(config.sectionTitleMarginBottom, '8px');
});

test('keeps relaxed layout roomy for the default mode', () => {
  const config = getResumeTemplateLayoutConfig('relaxed');

  assert.equal(config.personalInfoGap, '14px');
  assert.equal(config.personalInfoRowPadding, '4px 0');
  assert.equal(config.sectionTitleMarginBottom, '10px');
});
