'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ResumeEditor } from '@/components/resume/ResumeEditor';
import { ProjectExperienceAssistant } from '@/components/resume/ProjectExperienceAssistant';
import { ResumeTemplatePreview } from '@/components/resume/ResumeTemplatePreview';
import { applyProjectExperienceToSections, type ApplyProjectExperienceOptions } from '@/lib/resume/projectExperienceApply';
import { RESUME_PAGE_COUNTS } from '@/lib/resume/pageLayout';
import { RESUME_TEMPLATES } from '@/lib/resume/templates';
import type { ResumeDocument } from '@/types/resume';
import type { Project } from '@/types/project';

export default function ResumeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [resume, setResume] = useState<ResumeDocument | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingTop, setSavingTop] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [resumeRes, projectsRes] = await Promise.all([fetch(`/api/resumes/${id}`), fetch('/api/projects')]);
      if (!resumeRes.ok) throw new Error('简历未找到');
      if (!projectsRes.ok) throw new Error('加载项目失败');
      setResume(await resumeRes.json());
      setProjects(await projectsRes.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const saveResume = async (nextResume: ResumeDocument) => {
    const res = await fetch(`/api/resumes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextResume),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '保存简历失败');
    setResume(data);
  };

  const applyProjectExperience = (options: ApplyProjectExperienceOptions) => {
    if (!resume) return;
    setResume({
      ...resume,
      sections: applyProjectExperienceToSections(resume.sections, options),
    });
  };

  const deleteResume = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '删除简历失败');
      router.push('/resumes');
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除简历失败');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const exportResume = () => {
    window.location.href = `/api/resumes/${id}/export`;
  };

  const exportPdf = () => {
    if (!resume) return;
    window.open(`/resumes/${id}/print?template=${encodeURIComponent(resume.templateId)}`, '_blank');
  };

  const handleTopSave = async () => {
    if (!resume) return;
    setSavingTop(true);
    setSaveMessage('');
    setError('');
    try {
      await saveResume(resume);
      setSaveMessage('已保存');
    } catch (e) {
      const message = e instanceof Error ? e.message : '保存简历失败';
      setSaveMessage(message);
      setError(message);
    } finally {
      setSavingTop(false);
    }
  };

  if (loading) return <LoadingSpinner text="加载简历..." />;
  if (!resume) return <ErrorState title="加载失败" description={error || '简历未找到'} onRetry={load} />;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Link href="/resumes" className="text-sm text-gray-500 hover:text-gray-700 no-underline">返回简历列表</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{resume.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && <span className="text-sm text-gray-500">{saveMessage}</span>}
          <Button onClick={handleTopSave} disabled={savingTop}>{savingTop ? '保存中...' : '保存简历'}</Button>
          <Button variant="secondary" onClick={exportPdf}>导出 PDF</Button>
          <Button variant="secondary" onClick={exportResume}>导出 Word 普通版</Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>删除简历</Button>
        </div>
      </div>
      <p className="mb-6 text-sm text-gray-500">
        PDF 会尽量保留模板排版和照片，Word 是普通版，格式可能略有差异。
      </p>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-gray-900">选择简历模板</h2>
          <p className="text-sm text-gray-500 mt-1">模板只控制样式，不限制你改模块名称、内容和顺序。</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {RESUME_TEMPLATES.map(template => (
          <button
            key={template.id}
            type="button"
            onClick={() => setResume({ ...resume, templateId: template.id })}
            className={`rounded-lg border p-4 text-left transition-colors ${resume.templateId === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
            >
              <div className="font-semibold text-gray-900">{template.name}</div>
              <div className="mt-1 text-sm text-gray-500">{template.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-gray-900">目标页数</h2>
          <p className="text-sm text-gray-500 mt-1">保存到简历里，PDF 会尽量按这个页数来排版。</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {RESUME_PAGE_COUNTS.map(pageCount => (
            <button
              key={pageCount}
              type="button"
              onClick={() => setResume({ ...resume, pageCount })}
              className={`rounded-md border px-4 py-2 text-sm transition-colors ${resume.pageCount === pageCount ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              {pageCount} 页
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(360px,0.85fr)_minmax(520px,1.15fr)_380px] gap-6 items-start">
        <ResumeEditor resume={resume} onChange={setResume} onSave={saveResume} />
        <div className="overflow-auto rounded-lg bg-gray-100 px-4 py-6">
          <div className="origin-top scale-[0.72] 2xl:scale-[0.78]">
            <ResumeTemplatePreview resume={resume} />
          </div>
        </div>
        <div className="xl:sticky xl:top-6">
          <ProjectExperienceAssistant
            resume={resume}
            projects={projects}
            onApply={applyProjectExperience}
            onTargetRoleChange={(targetRole) => setResume({ ...resume, targetRole })}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        onConfirm={deleteResume}
        title="删除简历"
        message={`确定删除「${resume.name}」吗？删除后无法恢复。`}
        confirmLabel={deleting ? '删除中...' : '删除'}
      />
    </div>
  );
}
