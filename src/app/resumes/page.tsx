'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import type { ResumeDocument } from '@/types/resume';

export default function ResumesPage() {
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ResumeDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadResumes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/resumes');
      if (!res.ok) throw new Error('加载简历列表失败');
      setResumes(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载简历列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadResumes(); }, []);

  const deleteResume = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/resumes/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '删除简历失败');
      setResumes(current => current.filter(item => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除简历失败');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner text="加载简历列表..." />;
  if (error && resumes.length === 0) return <ErrorState title="加载失败" description={error} onRetry={loadResumes} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">简历编辑</h1>
          <p className="text-sm text-gray-500 mt-1">导入 Word，查看整份简历预览，再框选内容归类。</p>
        </div>
        <Link
          href="/resumes/import"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 no-underline"
        >
          导入 Word 简历
        </Link>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {resumes.length === 0 ? (
        <EmptyState
          title="还没有简历"
          description="导入一个 .docx，按预览内容填写模块，再框选内容归类。"
          actionLabel="导入 Word 简历"
          onAction={() => window.location.assign('/resumes/import')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumes.map(resume => (
            <Card key={resume.id} hover className="p-5">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/resumes/${resume.id}`} className="no-underline min-w-0 flex-1">
                  <h2 className="font-semibold text-gray-900 hover:text-blue-600 truncate">{resume.name}</h2>
                  <p className="text-sm text-gray-500 mt-2">{resume.targetRole || '未设置目标岗位'}</p>
                  <p className="text-xs text-gray-400 mt-4">最近修改：{new Date(resume.updatedAt).toLocaleString('zh-CN')}</p>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(resume)}>
                  删除
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={deleteResume}
        title="删除简历"
        message={`确定删除「${deleteTarget?.name || ''}」吗？删除后无法恢复。`}
        confirmLabel={deleting ? '删除中...' : '删除'}
      />
    </div>
  );
}
