import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRoleFocusCategories,
  rankInterviewQuestions,
} from '../.test-dist/lib/project/interviewQuestionRanking.js';

const questions = [
  { id: '1', analysisId: 'a', category: '数据库', question: '数据库怎么设计？', suggestedAnswer: '...'},
  { id: '2', analysisId: 'a', category: '性能优化', question: '怎么做性能优化？', suggestedAnswer: '...'},
  { id: '3', analysisId: 'a', category: '部署运维', question: '怎么部署？', suggestedAnswer: '...'},
];

test('returns frontend-oriented focus categories', () => {
  assert.deepEqual(getRoleFocusCategories('前端开发工程师').slice(0, 3), ['架构设计', '性能优化', '代码质量']);
});

test('ranks backend-related questions first for backend roles', () => {
  const ranked = rankInterviewQuestions(questions, 'Java 后端工程师');
  assert.equal(ranked[0].category, '数据库');
});
