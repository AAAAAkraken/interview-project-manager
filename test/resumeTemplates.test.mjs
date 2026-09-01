import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_RESUME_TEMPLATE_ID,
  RESUME_TEMPLATES,
  getResumeTemplate,
} from '../.test-dist/lib/resume/templates.js';

test('provides three built-in resume templates', () => {
  assert.deepEqual(
    RESUME_TEMPLATES.map(template => template.id),
    ['classic', 'campus', 'technical']
  );
});

test('falls back to default resume template for unknown id', () => {
  assert.equal(getResumeTemplate('missing').id, DEFAULT_RESUME_TEMPLATE_ID);
  assert.equal(getResumeTemplate().id, DEFAULT_RESUME_TEMPLATE_ID);
});
