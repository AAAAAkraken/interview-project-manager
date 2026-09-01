'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Project } from '@/types/project';

export function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const hasAnalysis = Boolean(project.analysisCount && project.analysisCount > 0);

  return (
    <Card hover className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <Link href={`/project/${project.id}`} className="no-underline">
            <h3 className="text-base font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
              {project.name}
            </h3>
          </Link>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
          )}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirm(true); }}
          className="text-gray-300 hover:text-red-500 transition-colors shrink-0 ml-3 cursor-pointer"
          title="删除项目"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {hasAnalysis ? (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.latestAnalysisLanguage && <Badge color="blue">{project.latestAnalysisLanguage}</Badge>}
          {(project.latestAnalysisFrameworks || []).slice(0, 3).map(fw => (
            <Badge key={fw} color="purple">{fw}</Badge>
          ))}
          {project.latestAnalysisDatabase && project.latestAnalysisDatabase !== '无' && (
            <Badge color="green">{project.latestAnalysisDatabase}</Badge>
          )}
        </div>
      ) : (
        <div className="mb-3">
          <Badge color="gray">未分析</Badge>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {hasAnalysis && project.latestAnalysisAt
            ? `最近分析：${new Date(project.latestAnalysisAt).toLocaleDateString('zh-CN')}`
            : '尚未导入分析'}
        </span>
        <Link href={`/project/${project.id}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium no-underline">
          查看
        </Link>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
            <p className="text-sm text-gray-600 mb-6">确定要删除“{project.name}”吗？相关分析数据也会一起删除，此操作不可撤销。</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>取消</Button>
              <Button variant="danger" onClick={() => onDelete(project.id)}>删除</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
