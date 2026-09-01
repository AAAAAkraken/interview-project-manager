import test from 'node:test';
import assert from 'node:assert/strict';
import { applyProjectExperienceToSections } from '../.test-dist/lib/resume/projectExperienceApply.js';

const baseSections = [
  { id: 'basic', type: 'basic', title: '个人信息', enabled: true, content: '张三' },
  { id: 'projects', type: 'projects', title: '项目经验', enabled: true, content: '原项目' },
];

test('appends generated content to selected section', () => {
  const sections = applyProjectExperienceToSections(baseSections, {
    mode: 'append',
    content: 'AI 项目',
    targetSectionId: 'projects',
  });

  assert.equal(sections[1].content, '原项目\n\nAI 项目');
});

test('replaces selected section content when requested', () => {
  const sections = applyProjectExperienceToSections(baseSections, {
    mode: 'replace',
    content: 'AI 项目',
    targetSectionId: 'projects',
  });

  assert.equal(sections[1].content, 'AI 项目');
});

test('creates a new projects section when no existing target is selected', () => {
  const sections = applyProjectExperienceToSections(baseSections, {
    mode: 'append',
    content: 'AI 项目',
    newSectionTitle: '科研项目',
  });

  assert.equal(sections.length, 3);
  assert.equal(sections[2].type, 'projects');
  assert.equal(sections[2].title, '科研项目');
  assert.equal(sections[2].content, 'AI 项目');
});
