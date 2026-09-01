'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TabBar } from '@/components/project/TabBar';
import { OverviewTab } from '@/components/project/OverviewTab';
import { TechStackTab } from '@/components/project/TechStackTab';
import { FilesTab } from '@/components/project/FilesTab';
import { InterviewQATab } from '@/components/project/InterviewQATab';
import { ResumeTab } from '@/components/project/ResumeTab';
import { AnalysisHistory } from '@/components/project/AnalysisHistory';
import { EditProjectModal } from '@/components/project/EditProjectModal';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Project } from '@/types/project';
import type { Analysis, AnalysisSummary, KeyFile, InterviewQuestion, ResumeHighlight } from '@/types/analysis';

type Tab = 'overview' | 'techstack' | 'files' | 'interview' | 'resume';

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [keyFiles, setKeyFiles] = useState<KeyFile[]>([]);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [highlights, setHighlights] = useState<ResumeHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deletingAnalysisId, setDeletingAnalysisId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const clearAnalysisData = () => {
    setAnalysis(null);
    setKeyFiles([]);
    setQuestions([]);
    setHighlights([]);
  };

  const loadAnalysis = async (analysisId: string) => {
    const analysisRes = await fetch(`/api/analyses/${analysisId}`);
    if (!analysisRes.ok) throw new Error('加载分析数据失败');
    const a = await analysisRes.json();
    setAnalysis(a);
    setKeyFiles(a.keyFiles || []);
    setQuestions(a.interviewQuestions || []);
    setHighlights(a.resumeHighlights || []);
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) { setError('项目未找到'); setLoading(false); return; }
      const p = await res.json();
      setProject(p);

      const listRes = await fetch(`/api/projects/${id}/analyses`);
      if (!listRes.ok) throw new Error('加载分析历史失败');
      const list = await listRes.json();
      setAnalyses(list);

      if (list.length > 0) {
        await loadAnalysis(list[0].id);
      } else {
        clearAnalysisData();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const handleDelete = async () => {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      window.location.href = '/';
      return;
    }
    setError('删除项目失败');
  };

  const handleSelectAnalysis = async (analysisId: string) => {
    setDeleteError('');
    try {
      await loadAnalysis(analysisId);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : '加载分析数据失败');
    }
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    setDeleteError('');
    try {
      const res = await fetch(`/api/analyses/${analysisId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '删除分析记录失败');
      }

      setDeletingAnalysisId(null);
      const listRes = await fetch(`/api/projects/${id}/analyses`);
      if (!listRes.ok) throw new Error('刷新分析历史失败');
      const list = await listRes.json();
      setAnalyses(list);
      if (list.length > 0) {
        await loadAnalysis(list[0].id);
      } else {
        clearAnalysisData();
      }
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : '删除分析记录失败');
    }
  };

  if (loading) return <LoadingSpinner text="加载项目..." />;
  if (error || !project) return <ErrorState title={error || '项目未找到'} description="请返回项目列表" />;

  const tabs = [
    { key: 'overview' as Tab, label: '概览' },
    { key: 'techstack' as Tab, label: '技术栈' },
    { key: 'files' as Tab, label: '文件' },
    { key: 'interview' as Tab, label: '面试问答' },
    { key: 'resume' as Tab, label: '简历亮点' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && <p className="text-sm text-gray-500 mt-0.5">{project.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>编辑项目</Button>
          {analysis && (
            <Link href={`/project/${id}/export`}>
              <Button variant="secondary" size="sm">导出</Button>
            </Link>
          )}
          <Link href={`/project/${id}/auto-analyze`}>
            <Button variant="primary" size="sm">AI 自动分析</Button>
          </Link>
          <Link href={`/project/${id}/import`}>
            <Button variant="secondary" size="sm">手动导入分析</Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setShowDelete(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <AnalysisHistory
        projectId={id}
        analyses={analyses}
        selectedAnalysisId={analysis?.id || null}
        deletingAnalysisId={deletingAnalysisId}
        deleteError={deleteError}
        onSelect={handleSelectAnalysis}
        onRequestDelete={setDeletingAnalysisId}
        onCancelDelete={() => setDeletingAnalysisId(null)}
        onDelete={handleDeleteAnalysis}
      />

      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <OverviewTab project={project} analysis={analysis} />
        )}
        {activeTab === 'techstack' && (
          <TechStackTab analysis={analysis} />
        )}
        {activeTab === 'files' && (
          <FilesTab keyFiles={keyFiles} />
        )}
        {activeTab === 'interview' && (
          <InterviewQATab projectId={id} questions={questions} />
        )}
        {activeTab === 'resume' && (
          <ResumeTab highlights={highlights} projectId={id} />
        )}
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="确认删除"
        message={`确定要删除「${project.name}」吗？相关的所有分析数据也会被删除。`}
        confirmLabel="删除"
        variant="danger"
      />

      <EditProjectModal
        isOpen={showEdit}
        project={project}
        onClose={() => setShowEdit(false)}
        onSaved={(updatedProject) => setProject(updatedProject)}
      />
    </div>
  );
}
