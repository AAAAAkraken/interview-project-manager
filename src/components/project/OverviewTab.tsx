import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Project } from '@/types/project';
import type { Analysis } from '@/types/analysis';

export function OverviewTab({ project, analysis }: { project: Project; analysis: Analysis | null }) {
  if (!analysis) {
    return (
      <EmptyState
        icon={
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
        title="尚未导入分析数据"
        description="点击右上角「导入分析」按钮，使用 AI 分析项目代码后导入结果"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">项目概述</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="编程语言" value={analysis.language} />
            <InfoItem label="数据库" value={analysis.databaseUsed || '无'} />
            <InfoItem label="分析时间" value={new Date(analysis.createdAt).toLocaleString('zh-CN')} />
            <InfoItem label="代码路径" value={project.repoPath || '未设置'} />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">架构说明</h3>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{analysis.architecture}</p>
      </Card>

      {Object.keys(analysis.directoryStructure).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">目录结构</h3>
          <div className="space-y-2">
            {Object.entries(analysis.directoryStructure).map(([dir, desc]) => (
              <div key={dir} className="flex gap-3 items-start py-2 border-b border-gray-100 last:border-0">
                <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded text-blue-700 shrink-0">{dir}</code>
                <span className="text-sm text-gray-600">{desc as string}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 mb-0.5">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value || '-'}</dd>
    </div>
  );
}
