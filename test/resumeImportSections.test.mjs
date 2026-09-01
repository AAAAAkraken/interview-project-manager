import assert from 'node:assert/strict';
import test from 'node:test';
import { buildResumeSectionsFromImport } from '../.test-dist/lib/resume/importSections.js';

test('builds structured resume sections from assigned import blocks', () => {
  const sections = buildResumeSectionsFromImport({
    modules: [
      { id: 'basic', title: '个人信息' },
      { id: 'projects', title: '项目经历' },
    ],
    blocks: [
      { id: 'b1', kind: 'paragraph', text: '张三 | 138xxxx | xxx@qq.com' },
      { id: 'b2', kind: 'paragraph', text: '项目：电商后台管理系统' },
      { id: 'b3', kind: 'paragraph', text: 'React、TypeScript、Node.js' },
    ],
    assignments: {
      basic: ['b1'],
      projects: ['b2'],
    },
  });

  assert.equal(sections.length, 3);
  assert.equal(sections[0].type, 'basic');
  assert.equal(sections[0].content, '张三 | 138xxxx | xxx@qq.com');
  assert.equal(sections[1].type, 'projects');
  assert.equal(sections[2].title, '未归类内容');
  assert.equal(sections[2].content, 'React、TypeScript、Node.js');
});

test('infers custom type for user-defined module names', () => {
  const sections = buildResumeSectionsFromImport({
    modules: [{ id: 'm1', title: '证书奖项' }],
    blocks: [{ id: 'b1', kind: 'paragraph', text: '英语六级' }],
    assignments: { m1: ['b1'] },
  });

  assert.equal(sections[0].type, 'custom');
  assert.equal(sections[0].title, '证书奖项');
});

