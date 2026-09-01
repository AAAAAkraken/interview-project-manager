'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { AnalysisSummary } from '@/types/analysis';

export function AnalysisHistory({
  projectId,
  analyses,
  selectedAnalysisId,
  deletingAnalysisId,
  deleteError,
  onSelect,
  onDelete,
  onCancelDelete,
  onRequestDelete,
}: {
  projectId: string;
  analyses: AnalysisSummary[];
  selectedAnalysisId: string | null;
  deletingAnalysisId: string | null;
  deleteError: string;
  onSelect: (analysisId: string) => void;
  onDelete: (analysisId: string) => void;
  onCancelDelete: () => void;
  onRequestDelete: (analysisId: string) => void;
}) {
  const deleting = analyses.find(item => item.id === deletingAnalysisId);

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">分析历史</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {analyses.length > 0 ? `共 ${analyses.length} 个版本` : '还没有导入过分析结果'}
          </p>
        </div>
        <Link href={`/project/${projectId}/import`}>
          <Button size="sm" variant="secondary">
            {analyses.length > 0 ? '重新导入' : '导入分析'}
          </Button>
        </Link>
      </div>

      {deleteError && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {deleteError}
        </div>
      )}

      {analyses.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {analyses.map((analysis, index) => {
            const active = analysis.id === selectedAnalysisId;
            return (
              <div
                key={analysis.id}
                className={`min-w-52 rounded-md border p-3 ${
                  active ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(analysis.id)}
                  className="w-full text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {index === 0 ? '最新分析' : `历史版本 ${analyses.length - index}`}
                    </span>
                    {active && <span className="text-xs text-blue-600">当前</span>}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {new Date(analysis.createdAt).toLocaleString('zh-CN')}
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    {analysis.language || '未知语言'} · {analysis.keyFileCount} 文件 · {analysis.questionCount} 问答
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onRequestDelete(analysis.id)}
                  className="mt-2 text-xs text-red-600 hover:text-red-700 cursor-pointer"
                >
                  删除此版本
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={onCancelDelete}
        onConfirm={() => deleting && onDelete(deleting.id)}
        title="确认删除分析"
        message="删除后该版本的关键文件、面试问答和简历亮点都会一起删除。"
        confirmLabel="删除"
        variant="danger"
      />
    </div>
  );
}
