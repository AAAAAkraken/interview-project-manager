'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import type { Project } from '@/types/project';

interface PublicSettings {
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
}

interface AnalysisJob {
  projectId: string;
  status: 'idle' | 'running' | 'success' | 'error';
  analysisId?: string;
  scannedFiles?: number;
  error?: string;
  details?: string;
}

export default function AutoAnalyzePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [interviewRole, setInterviewRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [details, setDetails] = useState('');
  const [success, setSuccess] = useState('');

  const storageKey = `project-interview-role:${projectId}`;

  const syncJobMessage = useCallback((nextJob: AnalysisJob) => {
    setJob(nextJob);
    if (nextJob.status === 'running') {
      setError('');
      setDetails('');
      setSuccess('');
      return;
    }
    if (nextJob.status === 'success') {
      setError('');
      setDetails('');
      setSuccess(`分析完成，已扫描 ${nextJob.scannedFiles || 0} 个文件并保存为新的分析版本。`);
      return;
    }
    if (nextJob.status === 'error') {
      setSuccess('');
      setError(nextJob.error || 'AI 自动分析失败');
      setDetails(nextJob.details || '');
    }
  }, []);

  const loadJob = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/auto-analyze`);
    if (!res.ok) return;
    syncJobMessage(await res.json());
  }, [projectId, syncJobMessage]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projectRes, settingsRes, jobRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch('/api/settings/ai'),
        fetch(`/api/projects/${projectId}/auto-analyze`),
      ]);
      if (!projectRes.ok) throw new Error('项目未找到');
      if (!settingsRes.ok) throw new Error('加载 AI 设置失败');
      setProject(await projectRes.json());
      setSettings(await settingsRes.json());
      if (jobRes.ok) {
        syncJobMessage(await jobRes.json());
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [projectId, syncJobMessage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    try {
      setInterviewRole(localStorage.getItem(storageKey) || '');
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

  useEffect(() => {
    if (job?.status !== 'running') return;
    const timer = window.setInterval(() => {
      void loadJob();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [job?.status, loadJob]);

  const ready = Boolean(
    project?.repoPath?.trim() &&
    settings?.baseUrl &&
    settings?.model &&
    settings?.hasApiKey
  );
  const running = job?.status === 'running';

  const handleAnalyze = async () => {
    setError('');
    setDetails('');
    setSuccess('');
    try {
      const res = await fetch(`/api/projects/${projectId}/auto-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDetails(data.details || '');
        throw new Error(data.error || 'AI 自动分析失败');
      }
      syncJobMessage(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'AI 自动分析失败');
    }
  };

  if (loading) return <LoadingSpinner text="加载自动分析配置..." />;
  if (!project || !settings) return <ErrorState title="加载失败" description={error || '无法加载项目或设置'} onRetry={loadData} />;

  return (
    <div className="max-w-3xl">
      <Link href={`/project/${projectId}`} className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 no-underline hover:text-gray-700">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回项目
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">AI 自动分析</h1>
        <p className="mt-1 text-sm text-gray-500">读取本地项目源码，调用 OpenAI-compatible API，自动生成面试档案。</p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <StatusRow label="项目" value={project.name} ok />
          <StatusRow label="代码路径" value={project.repoPath || '未填写'} ok={Boolean(project.repoPath?.trim())} />
          <StatusRow label="Base URL" value={settings.baseUrl || '未配置'} ok={Boolean(settings.baseUrl)} />
          <StatusRow label="模型" value={settings.model || '未配置'} ok={Boolean(settings.model)} />
          <StatusRow label="API Key" value={settings.hasApiKey ? '已配置' : '未配置'} ok={settings.hasApiKey} />

          <label className="block text-sm font-medium text-gray-700">
            面试岗位
            <input
              value={interviewRole}
              onChange={event => setInterviewRole(event.target.value)}
              placeholder="例如：前端开发工程师 / Java 后端 / 测试开发"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            填写面试岗位后，AI 生成的面试问答会更贴近这个岗位。默认会忽略 node_modules、.git、dist、.next、release 等目录。
          </div>

          {running && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              AI 正在分析中，可以切换到别的页面；回来后这里会继续显示进度。
            </div>
          )}

          {!ready && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              请先补全代码路径和 AI 设置后再开始分析。
              <Link href="/settings" className="ml-2 text-blue-700 underline">去配置 AI 设置</Link>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <div>{error}</div>
              {details && <pre className="mt-2 whitespace-pre-wrap text-xs">{details}</pre>}
            </div>
          )}

          {success && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="flex justify-end gap-3">
            {success && (
              <Button variant="secondary" onClick={() => router.push(`/project/${projectId}`)}>
                查看分析结果
              </Button>
            )}
            <Button onClick={handleAnalyze} disabled={!ready || running}>
              {running ? '分析中...' : '开始 AI 自动分析'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 last:border-0">
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="break-all text-sm text-gray-500">{value}</div>
      </div>
      <span className={`text-xs font-medium ${ok ? 'text-green-600' : 'text-red-600'}`}>
        {ok ? '可用' : '缺失'}
      </span>
    </div>
  );
}
