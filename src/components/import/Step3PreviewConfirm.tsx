'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';

interface Props {
  projectId: string;
  rawResponse: string;
  onBack: () => void;
}

export function Step3PreviewConfirm({ projectId, rawResponse, onBack }: Props) {
  const router = useRouter();
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/projects/${projectId}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawResponse }),
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '导入失败');
        setPreview(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId, rawResponse]);

  const handleConfirm = () => {
    router.push(`/project/${projectId}`);
  };

  if (loading) return <LoadingSpinner text="正在解析并导入..." />;
  if (error) {
    return (
      <div>
        <ErrorState title="导入失败" description={error} />
        <div className="flex justify-between mt-6">
          <Button variant="secondary" onClick={onBack}>← 返回修改 JSON</Button>
        </div>
      </div>
    );
  }

  if (!preview) return null;

  return (
    <div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-green-800">
          ✅ <strong>导入成功！</strong>请确认以下数据，点击「完成」返回项目页面。
        </p>
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">📋 项目概述</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">语言：</span>{preview.language}</div>
            <div><span className="text-gray-500">数据库：</span>{preview.databaseUsed || '无'}</div>
            <div className="col-span-2"><span className="text-gray-500">架构：</span>{preview.architecture.slice(0, 300)}{preview.architecture.length > 300 ? '...' : ''}</div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">🛠 技术栈</h3>
          <div className="flex flex-wrap gap-1.5">
            {preview.frameworks.map((fw: string) => (
              <Badge key={fw} color="purple">{fw}</Badge>
            ))}
            {preview.frameworks.length === 0 && <span className="text-sm text-gray-400">无</span>}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            📄 关键文件 ({preview.keyFiles?.length || 0} 个)
          </h3>
          {preview.keyFiles?.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {preview.keyFiles.map((kf: any) => (
                <div key={kf.id} className="text-sm py-1.5 border-b border-gray-100 last:border-0">
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-blue-700">{kf.filePath}</code>
                  <span className="text-gray-500 ml-2">— {kf.role}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            🎤 面试问题 ({preview.interviewQuestions?.length || 0} 个)
          </h3>
          {preview.interviewQuestions?.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {preview.interviewQuestions.map((q: any) => (
                <div key={q.id} className="text-sm py-1.5 border-b border-gray-100 last:border-0 flex items-center gap-2">
                  <Badge color="blue">{q.category}</Badge>
                  <span>{q.question}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            ✨ 简历亮点 ({preview.resumeHighlights?.length || 0} 个)
          </h3>
          {preview.resumeHighlights?.length > 0 && (
            <div className="space-y-2">
              {preview.resumeHighlights.map((h: any) => (
                <p key={h.id} className="text-sm text-gray-700">• {h.content}</p>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="secondary" onClick={onBack}>← 返回修改</Button>
        <Button onClick={handleConfirm} size="lg" disabled={saving}>
          完成 ✓
        </Button>
      </div>
    </div>
  );
}
