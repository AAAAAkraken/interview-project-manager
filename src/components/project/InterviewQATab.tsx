'use client';
import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
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

export function InterviewQATab({ questions }: { questions: InterviewQuestion[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');

  const categories = useMemo(() => {
    const cats = new Set<string>();
    questions.forEach(q => cats.add(q.category));
    return Array.from(cats);
  }, [questions]);

  const filtered = filterCategory
    ? questions.filter(q => q.category === filterCategory)
    : questions;

  if (questions.length === 0) {
    return (
      <EmptyState
        title="暂无面试问答数据"
        description="导入 AI 分析后，这里会展示针对项目的面试问题和建议回答"
      />
    );
  }

  return (
    <div>
      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterCategory('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              !filterCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部 ({questions.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat === filterCategory ? '' : cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                cat === filterCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat} ({questions.filter(q => q.category === cat).length})
            </button>
          ))}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-3">
        {filtered.map(q => (
          <Card key={q.id} className="p-5">
            <div
              className="flex items-start justify-between gap-4 cursor-pointer"
              onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge color={CATEGORY_COLORS[q.category] || 'gray'}>{q.category}</Badge>
                </div>
                <p className="text-sm font-medium text-gray-900">{q.question}</p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 shrink-0 transition-transform mt-1 ${expandedId === q.id ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {expandedId === q.id && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{q.suggestedAnswer}</p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
