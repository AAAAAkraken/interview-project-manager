import assert from 'node:assert/strict';
import test from 'node:test';
import { formatTextExport } from '../.test-dist/lib/export/formatExport.js';

test('formats markdown export with actual project and analysis values', () => {
  const markdown = formatTextExport({
    project: {
      id: 'project-1',
      name: '面试项目管理',
      description: '管理项目并生成面试材料',
      repoPath: 'C:/projects/interview',
      createdAt: '2026-08-21T00:00:00.000Z',
      updatedAt: '2026-08-21T00:00:00.000Z',
    },
    analyses: [],
    analysis: {
      id: 'analysis-1',
      projectId: 'project-1',
      language: 'TypeScript',
      frameworks: ['Next.js', 'Electron'],
      databaseUsed: 'SQLite',
      architecture: '本地桌面应用 + 服务端 API 路由',
      directoryStructure: { src: '应用源码' },
      rawAiResponse: '{}',
      createdAt: '2026-08-21T00:00:00.000Z',
    },
    keyFiles: [
      {
        id: 'file-1',
        analysisId: 'analysis-1',
        filePath: 'src/app/page.tsx',
        role: '首页',
        description: '负责项目列表',
        keyTechnologies: ['React'],
      },
    ],
    questions: [
      {
        id: 'q-1',
        analysisId: 'analysis-1',
        category: '架构设计',
        question: '如何组织 Electron 和 Next.js？',
        suggestedAnswer: 'Electron 负责窗口，Next.js 负责页面和 API。',
      },
    ],
    highlights: [
      {
        id: 'h-1',
        analysisId: 'analysis-1',
        content: '实现项目分析导入、归档和导出闭环。',
      },
    ],
  });

  assert.match(markdown, /^# 面试项目管理 - 面试档案/);
  assert.match(markdown, /TypeScript/);
  assert.match(markdown, /Next\.js、Electron/);
  assert.match(markdown, /src\/app\/page\.tsx/);
  assert.doesNotMatch(markdown, /\{data\.project/);
});
