'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';

export default function SettingsPage() {
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/settings/ai');
      if (!res.ok) throw new Error('加载 AI 设置失败');
      const data = await res.json();
      setBaseUrl(data.baseUrl || '');
      setModel(data.model || '');
      setHasApiKey(Boolean(data.hasApiKey));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载 AI 设置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const body: { baseUrl: string; model: string; apiKey?: string } = {
        baseUrl,
        model,
      };
      if (apiKey.trim()) body.apiKey = apiKey.trim();

      const res = await fetch('/api/settings/ai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '保存 AI 设置失败');

      setHasApiKey(Boolean(data.hasApiKey));
      setApiKey('');
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存 AI 设置失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="加载 AI 设置..." />;
  if (error && !baseUrl && !model) return <ErrorState title="加载失败" description={error} onRetry={loadSettings} />;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">AI 设置</h1>
        <p className="text-sm text-gray-500 mt-1">配置 OpenAI-compatible API，用于项目的 AI 自动分析。</p>
      </div>

      <Card className="p-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
            <input
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="例如：https://api.openai.com 或 https://api.deepseek.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={hasApiKey ? '已保存 API Key，留空则不修改' : '请输入 API Key'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">API Key 只保存在本地 SQLite，不会在读取设置时返回到页面。</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">模型名称</label>
            <input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder="例如：gpt-4o-mini、deepseek-chat"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          {saved && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">AI 设置已保存</div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
