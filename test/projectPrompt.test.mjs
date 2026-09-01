import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProjectResumePrompt, parseGeneratedProjectResponse } from '../.test-dist/lib/resume/projectPrompt.js';

test('includes target role and project evidence in resume prompt', () => {
  const prompt = buildProjectResumePrompt('前端开发工程师', 'React、性能优化', [{
    project: {
      id: 'p1', name: '项目管理器', description: '管理项目', repoPath: '', createdAt: '', updatedAt: '',
    },
    analysis: {
      id: 'a1', projectId: 'p1', language: 'TypeScript', frameworks: ['Next.js'], databaseUsed: 'SQLite',
      architecture: '分层架构', directoryStructure: {}, rawAiResponse: '', createdAt: '',
    },
    keyFiles: [],
    highlights: [{ id: 'h1', analysisId: 'a1', content: '实现项目导入流程' }],
    questions: [],
  }]);

  assert.match(prompt, /前端开发工程师/);
  assert.match(prompt, /React、性能优化/);
  assert.match(prompt, /实现项目导入流程/);
});

test('validates generated project response', () => {
  const result = parseGeneratedProjectResponse(JSON.stringify({
    projects: [{
      projectId: 'p1', projectName: '项目管理器', role: '前端开发', duration: '', techStack: ['React'], content: '负责项目页面开发',
    }],
  }));

  assert.equal(result.projects[0].projectId, 'p1');
  assert.throws(() => parseGeneratedProjectResponse('{"projects":[{"projectId":"p1","projectName":"项目管理器"}]}'), /缺少简历内容字段/);
});
