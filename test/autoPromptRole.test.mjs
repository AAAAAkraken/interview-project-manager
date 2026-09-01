import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAutoAnalysisPrompt } from '../.test-dist/lib/analysis/autoPrompt.js';

const project = {
  id: 'p1',
  name: '测试项目',
  description: '项目描述',
  repoPath: 'C:/project',
  createdAt: '',
  updatedAt: '',
};

const files = [
  { relativePath: 'src/index.ts', content: 'console.log("hello")' },
];

test('includes interview role in auto analysis prompt when provided', () => {
  const prompt = buildAutoAnalysisPrompt(project, files, '前端开发工程师');

  assert.match(prompt, /面试岗位：前端开发工程师/);
  assert.match(prompt, /面试问答/);
});

test('omits interview role line when role is empty', () => {
  const prompt = buildAutoAnalysisPrompt(project, files, '');

  assert.doesNotMatch(prompt, /面试岗位：/);
});
