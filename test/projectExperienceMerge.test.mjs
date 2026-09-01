import test from 'node:test';
import assert from 'node:assert/strict';
import { appendProjectExperienceContent } from '../.test-dist/lib/resume/projectExperienceMerge.js';

test('uses generated project experience directly when existing content is empty', () => {
  assert.equal(
    appendProjectExperienceContent('  ', ' 新生成项目经历 '),
    '新生成项目经历'
  );
});

test('appends generated project experience after existing content', () => {
  assert.equal(
    appendProjectExperienceContent('原本项目经历', 'AI 生成项目经历'),
    '原本项目经历\n\nAI 生成项目经历'
  );
});

test('does not add anything when generated project experience is empty', () => {
  assert.equal(
    appendProjectExperienceContent('原本项目经历', '   '),
    '原本项目经历'
  );
});
