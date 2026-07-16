'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';

interface Props {
  projectId: string;
  onNext: () => void;
}

export function Step1GeneratePrompt({ projectId, onNext }: Props) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/prompt`)
      .then(res => res.ok ? res.json() : Promise.reject('加载失败'))
      .then(data => setPrompt(data.prompt))
      .catch(() => setError('生成提示词失败'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <LoadingSpinner text="正在生成提示词..." />;
  if (error) return <ErrorState title={error} />;

  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          📋 <strong>操作步骤：</strong>复制下方的提示词 → 粘贴到 ChatGPT 或 Claude → AI 分析完成后 → 复制 AI 返回的 JSON → 进入下一步粘贴回来
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">AI 分析提示词</span>
          <Button
            variant={copied ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleCopy}
          >
            {copied ? '已复制 ✓' : '📋 复制到剪贴板'}
          </Button>
        </div>
        <pre className="p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto leading-relaxed">
          {prompt}
        </pre>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={onNext} size="lg">
          下一步：我已完成 AI 分析 →
        </Button>
      </div>
    </div>
  );
}
