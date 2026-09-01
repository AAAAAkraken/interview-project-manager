'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { rankInterviewQuestions } from '@/lib/project/interviewQuestionRanking';
import type { InterviewQuestion } from '@/types/analysis';

const CATEGORY_COLORS: Record<string, 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'gray'> = {
  '架构设计': 'blue',
  '性能优化': 'orange',
  '技术难点': 'red',
  '代码质量': 'purple',
  '安全': 'red',
  '测试': 'green',
  '数据库': 'blue',
  '部署运维': 'gray',
};

export function InterviewQATab({
  projectId,
  questions,
}: {
  projectId: string;
  questions: InterviewQuestion[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [interviewRole, setInterviewRole] = useState('');

  const storageKey = `project-interview-role:${projectId}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey) || '';
      setInterviewRole(saved);
    } catch {
      setInterviewRole('');
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, interviewRole);
    } catch {
      // ignore storage errors
    }
  }, [storageKey, interviewRole]);

  const sortedQuestions = useMemo(
    () => rankInterviewQuestions(questions, interviewRole),
    [questions, interviewRole]
  );

  const categories = useMemo(() => {
    const cats = new Set<string>();
    sortedQuestions.forEach(question => cats.add(question.category));
    return Array.from(cats);
  }, [sortedQuestions]);

  const visibleQuestions = filterCategory
    ? sortedQuestions.filter(question => question.category === filterCategory)
    : sortedQuestions;

  if (questions.length === 0) {
    return (
      <EmptyState
        title="暂无面试问答数据"
        description="导入 AI 分析后，这里会显示针对项目的面试问题和建议回答。"
      />
    );
  }

  return (
    <div>
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
        <label className="block text-sm font-medium text-gray-700">
          面试岗位
          <input
            value={interviewRole}
            onChange={event => setInterviewRole(event.target.value)}
            placeholder="例如：前端开发工程师 / Java 后端 / 测试开发"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </label>
        <p className="mt-2 text-xs text-gray-500">
          填写后，系统会优先把更贴近这个岗位的问题排到前面。
        </p>
      </div>

      {categories.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCategory('')}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !filterCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部 ({sortedQuestions.length})
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setFilterCategory(category === filterCategory ? '' : category)}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                category === filterCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category} ({sortedQuestions.filter(question => question.category === category).length})
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {visibleQuestions.map(question => (
          <Card key={question.id} className="p-5">
            <div
              className="flex cursor-pointer items-start justify-between gap-4"
              onClick={() => setExpandedId(expandedId === question.id ? null : question.id)}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Badge color={CATEGORY_COLORS[question.category] || 'gray'}>{question.category}</Badge>
                </div>
                <p className="text-sm font-medium text-gray-900">{question.question}</p>
              </div>
              <svg
                className={`mt-1 h-5 w-5 shrink-0 text-gray-400 transition-transform ${expandedId === question.id ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {expandedId === question.id && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{question.suggestedAnswer}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
