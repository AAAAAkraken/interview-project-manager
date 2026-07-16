'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Props {
  onBack: () => void;
  onNext: (rawResponse: string) => void;
}

export function Step2PasteResponse({ onBack, onNext }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!text.trim()) {
      setError('请粘贴 AI 返回的 JSON 内容');
      return;
    }
    // Basic JSON check
    const trimmed = text.trim();
    const jsonText = trimmed.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```$/, '');
    try {
      JSON.parse(jsonText);
    } catch {
      // Also try finding JSON inside
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          JSON.parse(jsonText.slice(firstBrace, lastBrace + 1));
        } catch {
          setError('JSON 格式似乎不正确，请检查粘贴的内容是否完整');
          return;
        }
      } else {
        setError('JSON 格式似乎不正确，请检查粘贴的内容是否完整');
        return;
      }
    }
    setError('');
    onNext(text);
  };

  return (
    <div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          💡 <strong>提示：</strong>将 ChatGPT/Claude 返回的完整 JSON 内容粘贴到下方。支持普通 JSON 或被 markdown 代码块（```json```）包裹的 JSON。
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setError(''); }}
          placeholder={`在此粘贴 AI 返回的 JSON 内容...\n\n例如：\n{"overview": {"language": "TypeScript", ...}, ...}`}
          className="w-full h-80 p-4 text-sm font-mono text-gray-700 resize-none focus:outline-none"
          autoFocus
        />
      </Card>

      {error && (
        <p className="text-sm text-red-600 mt-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="mt-6 flex justify-between">
        <Button variant="secondary" onClick={onBack}>← 返回上一步</Button>
        <Button onClick={handleNext} size="lg">解析并预览 →</Button>
      </div>
    </div>
  );
}
