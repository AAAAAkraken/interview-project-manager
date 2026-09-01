import type { InterviewQuestion } from '@/types/analysis';

const ROLE_FOCUS_RULES: Array<{ patterns: RegExp[]; categories: string[] }> = [
  {
    patterns: [/前端|web|react|vue|小程序|h5/i],
    categories: ['架构设计', '性能优化', '代码质量', '测试', '安全'],
  },
  {
    patterns: [/后端|服务端|backend|java|go|python|node/i],
    categories: ['架构设计', '数据库', '部署运维', '安全', '性能优化'],
  },
  {
    patterns: [/全栈|full[\s-]?stack/i],
    categories: ['架构设计', '数据库', '性能优化', '代码质量', '部署运维'],
  },
  {
    patterns: [/测试|qa|quality assurance/i],
    categories: ['测试', '代码质量', '安全', '性能优化'],
  },
  {
    patterns: [/运维|devops|sre/i],
    categories: ['部署运维', '安全', '性能优化', '架构设计'],
  },
];

const ROLE_KEYWORDS: Array<{ patterns: RegExp[]; keywords: string[] }> = [
  { patterns: [/前端|web|react|vue|小程序|h5/i], keywords: ['组件', '页面', '渲染', '交互', '状态', '性能'] },
  { patterns: [/后端|服务端|backend|java|go|python|node/i], keywords: ['接口', '并发', '数据库', '缓存', '事务', '服务'] },
  { patterns: [/测试|qa/i], keywords: ['测试', '覆盖率', '用例', '回归', '自动化'] },
  { patterns: [/运维|devops|sre/i], keywords: ['部署', '监控', '发布', '容器', '日志', '告警'] },
];

export function getRoleFocusCategories(role: string): string[] {
  const normalized = role.trim();
  if (!normalized) return [];
  return ROLE_FOCUS_RULES.find(rule => rule.patterns.some(pattern => pattern.test(normalized)))?.categories || [];
}

export function rankInterviewQuestions(questions: InterviewQuestion[], role: string): InterviewQuestion[] {
  const focusCategories = getRoleFocusCategories(role);
  const roleKeywords = ROLE_KEYWORDS.find(rule => rule.patterns.some(pattern => pattern.test(role.trim())))?.keywords || [];

  return questions
    .map((question, index) => ({
      question,
      index,
      score: scoreQuestion(question, focusCategories, roleKeywords),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(item => item.question);
}

function scoreQuestion(question: InterviewQuestion, focusCategories: string[], roleKeywords: string[]): number {
  let score = 0;
  const categoryIndex = focusCategories.indexOf(question.category);
  if (categoryIndex >= 0) {
    score += 100 - categoryIndex * 10;
  }

  for (const keyword of roleKeywords) {
    if (question.question.includes(keyword) || question.suggestedAnswer.includes(keyword)) {
      score += 5;
    }
  }

  if (/架构|设计/.test(question.category)) score += 2;
  if (/性能/.test(question.category)) score += 2;
  if (/数据库/.test(question.category)) score += 2;
  return score;
}
