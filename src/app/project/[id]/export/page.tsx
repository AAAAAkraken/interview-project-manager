'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ExportPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [format, setFormat] = useState<'text' | 'json'>('text');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [noAnalysis, setNoAnalysis] = useState(false);

  const loadExport = async (fmt: string) => {
    setLoading(true);
    setError('');
    setNoAnalysis(false);
    try {
      const res = await fetch(`/api/export/${projectId}?format=${fmt}`);
      if (!res.ok) throw new Error('导出失败');
      if (fmt === 'json') {
        const data = await res.json();
        setProjectName(data?.project?.name || '');
        setNoAnalysis(!data?.analysis);
        setContent(JSON.stringify(data, null, 2));
      } else {
        const text = await res.text();
        // Extract project name from the markdown
        const nameMatch = text.match(/^# (.+?) - 面试档案/m);
        if (nameMatch) setProjectName(nameMatch[1]);
        setNoAnalysis(!text.includes('## 项目概览'));
        setContent(text);
      }
    } catch (e: any) {
      setError(e.message || '导出失败');
    }
    setLoading(false);
  };

  useEffect(() => { loadExport(format); }, [projectId, format]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ext = format === 'json' ? 'json' : 'md';
    a.href = url;
    a.download = `${projectName || 'export'}-面试档案.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Link href={`/project/${projectId}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 no-underline">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回项目
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">导出面试档案</h1>
          <p className="text-sm text-gray-500">导出为 Markdown 文本，方便复制到简历或分享</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Format toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setFormat('text')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                format === 'text' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Markdown
            </button>
            <button
              onClick={() => setFormat('json')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                format === 'json' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              JSON
            </button>
          </div>
          <Button variant="secondary" size="sm" onClick={handleCopy} disabled={noAnalysis}>
            {copied ? '已复制 ✓' : '📋 复制'}
          </Button>
          <Button variant="primary" size="sm" onClick={handleDownload} disabled={noAnalysis}>
            💾 下载文件
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="加载导出内容..." />
      ) : error ? (
        <ErrorState title={error} />
      ) : noAnalysis ? (
        <EmptyState
          title="还没有可导出的分析"
          description="请先导入一次 AI 分析结果，再导出面试档案。"
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <pre className="p-6 text-sm text-gray-700 whitespace-pre-wrap font-mono max-h-[70vh] overflow-y-auto leading-relaxed">
            {content}
          </pre>
        </Card>
      )}
    </div>
  );
}
