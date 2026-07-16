'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ResumeHighlight } from '@/types/analysis';

export function ResumeTab({ highlights, projectId }: { highlights: ResumeHighlight[]; projectId: string }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (highlights.length === 0) {
    return (
      <EmptyState
        title="暂无简历亮点数据"
        description="导入 AI 分析后，这里会展示适合写进简历的项目亮点"
      />
    );
  }

  return (
    <div className="space-y-4">
      {highlights.map((h, idx) => (
        <Card key={h.id} className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-800 leading-relaxed">{h.content}</p>
            </div>
            <Button
              variant={copiedId === h.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleCopy(h.content, h.id)}
            >
              {copiedId === h.id ? '已复制 ✓' : '复制'}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
