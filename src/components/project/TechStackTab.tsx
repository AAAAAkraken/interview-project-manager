import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Analysis } from '@/types/analysis';

const BADGE_COLORS = ['blue', 'purple', 'green', 'orange', 'red'] as const;

export function TechStackTab({ analysis }: { analysis: Analysis | null }) {
  if (!analysis) {
    return (
      <EmptyState
        title="尚未导入分析数据"
        description="点击右上角「导入分析」按钮导入 AI 分析结果"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">技术概览</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">编程语言</h4>
            <Badge color="blue" className="text-sm px-3 py-1">{analysis.language}</Badge>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">数据库</h4>
            <p className="text-sm text-gray-900">{analysis.databaseUsed || '无'}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">框架 & 库</h3>
        {analysis.frameworks.length === 0 ? (
          <p className="text-sm text-gray-400">暂无数据</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {analysis.frameworks.map((fw, i) => (
              <Badge key={fw} color={BADGE_COLORS[i % BADGE_COLORS.length]} className="text-sm px-3 py-1">
                {fw}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">架构模式</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{analysis.architecture}</p>
      </Card>
    </div>
  );
}
