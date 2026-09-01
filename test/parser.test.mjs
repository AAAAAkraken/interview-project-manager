import assert from 'node:assert/strict';
import test from 'node:test';
import { ParseError, parseAiResponse } from '../.test-dist/lib/parser/aiResponseParser.js';

function validResponse(overrides = {}) {
  return {
    overview: {
      language: 'TypeScript',
      summary: '桌面面试项目管理工具',
      architecture: 'Next.js API routes + SQLite repository',
      directoryStructure: { src: '前端与接口代码' },
    },
    techStack: {
      frameworks: ['Next.js', 'Electron'],
      database: 'SQLite',
      keyLibraries: ['better-sqlite3'],
    },
    keyFiles: [
      {
        filePath: 'src/app/page.tsx',
        role: '项目列表页面',
        description: '展示和管理项目',
        keyTechnologies: ['React'],
      },
    ],
    interviewQuestions: [
      {
        category: '架构设计',
        question: '为什么选择 Electron + Next.js？',
        suggestedAnswer: '复用 Web 技术栈并支持本地桌面数据管理。',
      },
    ],
    resumeHighlights: [
      { content: '实现本地化项目分析管理和导出流程。' },
    ],
    ...overrides,
  };
}

test('parses valid raw JSON', () => {
  const parsed = parseAiResponse(JSON.stringify(validResponse()));

  assert.equal(parsed.overview.language, 'TypeScript');
  assert.deepEqual(parsed.techStack.frameworks, ['Next.js', 'Electron']);
});

test('parses JSON wrapped in markdown fences', () => {
  const parsed = parseAiResponse(`\`\`\`json\n${JSON.stringify(validResponse())}\n\`\`\``);

  assert.equal(parsed.techStack.database, 'SQLite');
});

test('parses JSON with surrounding AI explanation text', () => {
  const parsed = parseAiResponse(`下面是分析结果：\n${JSON.stringify(validResponse())}\n请查收。`);

  assert.equal(parsed.overview.architecture, 'Next.js API routes + SQLite repository');
});

test('throws field-specific ParseError when a required field is missing', () => {
  const invalid = validResponse({ techStack: { frameworks: ['Next.js'], database: 'SQLite' } });

  assert.throws(
    () => parseAiResponse(JSON.stringify(invalid)),
    (error) => error instanceof ParseError && error.userMessage.includes('techStack.keyLibraries')
  );
});

test('throws field-specific ParseError when an array contains non-string values', () => {
  const invalid = validResponse({
    techStack: {
      frameworks: ['Next.js', 123],
      database: 'SQLite',
      keyLibraries: ['better-sqlite3'],
    },
  });

  assert.throws(
    () => parseAiResponse(JSON.stringify(invalid)),
    (error) => error instanceof ParseError && error.userMessage.includes('techStack.frameworks[1]')
  );
});
