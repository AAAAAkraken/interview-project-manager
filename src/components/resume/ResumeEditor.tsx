'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { sanitizeResumePhotoDataUrl } from '@/lib/resume/photo';
import type { ResumeDocument, ResumeSection } from '@/types/resume';

export function ResumeEditor({
  resume,
  onSave,
  onChange,
}: {
  resume: ResumeDocument;
  onSave: (resume: ResumeDocument) => Promise<void>;
  onChange: (resume: ResumeDocument) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const photoRef = useRef<HTMLInputElement>(null);

  const updateResume = (patch: Partial<ResumeDocument>) => onChange({ ...resume, ...patch });

  const updateSection = (id: string, patch: Partial<ResumeSection>) => {
    updateResume({ sections: resume.sections.map(section => section.id === id ? { ...section, ...patch } : section) });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= resume.sections.length) return;
    const sections = [...resume.sections];
    [sections[index], sections[nextIndex]] = [sections[nextIndex], sections[index]];
    updateResume({ sections });
  };

  const addSection = () => {
    updateResume({
      sections: [...resume.sections, {
        id: crypto.randomUUID(),
        type: 'custom',
        title: '自定义模块',
        enabled: true,
        content: '',
      }],
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await onSave(resume);
      setMessage('已保存');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('请选择图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage('照片不能超过 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const photoDataUrl = sanitizeResumePhotoDataUrl(reader.result);
      if (!photoDataUrl) {
        setMessage('照片格式不支持，请使用 PNG、JPG、GIF 或 WebP');
        return;
      }
      updateResume({ photoDataUrl });
      setMessage('照片已更换，记得保存简历');
    };
    reader.onerror = () => setMessage('读取照片失败，请重试');
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm text-gray-700">
            简历名称
            <input value={resume.name} onChange={event => updateResume({ name: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
          </label>
          <label className="text-sm text-gray-700">
            目标岗位
            <input value={resume.targetRole} onChange={event => updateResume({ targetRole: event.target.value })} placeholder="例如：前端开发工程师" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4">
          <div className="flex h-28 w-[88px] items-center justify-center overflow-hidden rounded-md border border-dashed border-gray-300 bg-gray-50">
            {resume.photoDataUrl ? (
              <img src={resume.photoDataUrl} alt="简历照片" className="h-full w-full object-cover" />
            ) : (
              <span className="px-2 text-center text-xs text-gray-400">右上角照片</span>
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">简历照片</div>
            <div className="mt-1 text-xs text-gray-500">照片会显示在“个人信息”区域右侧，并随 PDF 导出。</div>
            <input
              ref={photoRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={event => {
                handlePhotoChange(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
            <div className="mt-2 flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => photoRef.current?.click()}>上传照片</Button>
              {resume.photoDataUrl && <Button variant="ghost" size="sm" onClick={() => { updateResume({ photoDataUrl: '' }); setMessage('照片已移除，记得保存简历'); }}>移除照片</Button>}
            </div>
          </div>
        </div>
      </Card>

      {resume.sections.map((section, index) => (
        <Card key={section.id} className={`p-5 ${section.enabled ? '' : 'opacity-60'}`}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 flex-1">
              <input type="checkbox" checked={section.enabled} onChange={event => updateSection(section.id, { enabled: event.target.checked })} />
              <input value={section.title} onChange={event => updateSection(section.id, { title: event.target.value })} className="font-semibold text-gray-900 border-b border-transparent focus:border-blue-400 outline-none" />
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => moveSection(index, -1)} disabled={index === 0}>上移</Button>
              <Button variant="ghost" size="sm" onClick={() => moveSection(index, 1)} disabled={index === resume.sections.length - 1}>下移</Button>
            </div>
          </div>
          <textarea
            value={section.content}
            onChange={event => updateSection(section.id, { content: event.target.value })}
            disabled={!section.enabled}
            className="min-h-32 w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-400"
            placeholder="在这里编辑模块内容..."
          />
        </Card>
      ))}

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={addSection}>新增自定义模块</Button>
        <div className="flex items-center gap-3">
          {message && <span className="text-sm text-gray-500">{message}</span>}
          <Button onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存简历'}</Button>
        </div>
      </div>
    </div>
  );
}
