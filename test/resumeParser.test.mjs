import assert from 'node:assert/strict';
import test from 'node:test';
import { detectSections } from '../.test-dist/lib/resume/docxParser.js';

test('detects common resume sections and preserves their content', () => {
  const sections = detectSections(`张三\n前端开发工程师\n\n教育经历\n某某大学\n\n项目经历\n项目 A：负责前端开发\n\n专业技能\nTypeScript、React`);

  assert.deepEqual(sections.map(section => section.title), ['基本信息', '教育经历', '项目经历', '技能清单']);
  assert.match(sections[2].content, /项目 A/);
  assert.equal(sections.every(section => section.enabled), true);
});

test('falls back to a custom section when no headings are detected', () => {
  const sections = detectSections('一段没有明确标题的简历内容');

  assert.equal(sections.length, 1);
  assert.equal(sections[0].type, 'custom');
  assert.equal(sections[0].content, '一段没有明确标题的简历内容');
});
