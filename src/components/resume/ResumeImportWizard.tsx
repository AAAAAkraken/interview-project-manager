'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DEFAULT_RESUME_TEMPLATE_ID, RESUME_TEMPLATES } from '@/lib/resume/templates';
import type { ResumeImportBlock, ResumeImportModule, ResumeSection, ResumeSectionType } from '@/types/resume';

const DEFAULT_MODULES: ResumeImportModule[] = [
  { id: crypto.randomUUID(), title: '个人信息' },
  { id: crypto.randomUUID(), title: '教育背景' },
  { id: crypto.randomUUID(), title: '工作经历' },
  { id: crypto.randomUUID(), title: '项目经历' },
  { id: crypto.randomUUID(), title: '技能' },
];

const TYPE_RULES: Array<{ type: ResumeSectionType; patterns: RegExp[] }> = [
  { type: 'basic', patterns: [/个人信息|基本信息|联系方式/] },
  { type: 'target', patterns: [/求职目标|求职意向|应聘职位/] },
  { type: 'education', patterns: [/教育背景|教育经历/] },
  { type: 'work', patterns: [/工作经历|工作经验|实习经历/] },
  { type: 'projects', patterns: [/项目经历|项目经验/] },
  { type: 'skills', patterns: [/技能|技术栈|专业技能/] },
  { type: 'summary', patterns: [/自我评价|个人总结|个人优势/] },
];

interface AssignedText {
  id: string;
  start: number;
  end: number;
  text: string;
}

function createModule(title = ''): ResumeImportModule {
  return { id: crypto.randomUUID(), title };
}

function inferSectionType(title: string): ResumeSectionType {
  return TYPE_RULES.find(rule => rule.patterns.some(pattern => pattern.test(title)))?.type || 'custom';
}

function normalizeText(text: string) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');
}

export function ResumeImportWizard() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('我的简历');
  const [targetRole, setTargetRole] = useState('');
  const [templateId, setTemplateId] = useState(DEFAULT_RESUME_TEMPLATE_ID);
  const [sourceFileName, setSourceFileName] = useState('');
  const [modules, setModules] = useState<ResumeImportModule[]>(DEFAULT_MODULES);
  const [resumeText, setResumeText] = useState('');
  const [resumeHtml, setResumeHtml] = useState('');
  const [resumeBlocks, setResumeBlocks] = useState<ResumeImportBlock[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [assignments, setAssignments] = useState<Record<string, AssignedText[]>>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const assignedTexts = useMemo(() => Object.values(assignments).flat(), [assignments]);

  const updateModule = (id: string, patch: Partial<ResumeImportModule>) => {
    setModules(current => current.map(module => module.id === id ? { ...module, ...patch } : module));
  };

  const addModule = () => setModules(current => [...current, createModule('')]);

  const removeModule = (id: string) => {
    setModules(current => current.filter(module => module.id !== id));
    setAssignments(current => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const refreshSelection = () => {
    const preview = previewRef.current;
    const selection = window.getSelection();
    if (!preview || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!preview.contains(range.commonAncestorContainer)) return;

    const beforeSelection = document.createRange();
    beforeSelection.selectNodeContents(preview);
    beforeSelection.setEnd(range.startContainer, range.startOffset);

    const start = beforeSelection.toString().length;
    const text = selection.toString().trim();
    const end = start + text.length;
    setSelectedText(text);
    setSelectedRange(text ? { start, end } : null);
  };

  const assignSelection = (moduleId: string) => {
    const text = normalizeText(selectedText);
    const range = selectedRange;
    if (!text) {
      setError('请先在右边简历中框选一段内容。');
      return;
    }
    if (!range) {
      setError('请先在右边简历中框选一段内容。');
      return;
    }
    setAssignments(current => ({
      ...current,
      [moduleId]: [...(current[moduleId] || []), { id: crypto.randomUUID(), start: range.start, end: range.end, text }]
        .sort((a, b) => a.start - b.start || a.end - b.end),
    }));
    setSelectedText('');
    setSelectedRange(null);
    setError('');
  };

  const removeAssignedText = (moduleId: string, itemId: string) => {
    setAssignments(current => ({
      ...current,
      [moduleId]: (current[moduleId] || []).filter(item => item.id !== itemId),
    }));
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/resumes/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '导入 Word 失败');

      setSourceFileName(data.sourceFileName || file.name);
      setResumeText(typeof data.text === 'string' ? data.text : '');
      setResumeHtml(typeof data.html === 'string' ? data.html : '');
      setResumeBlocks(Array.isArray(data.blocks) ? data.blocks : []);
      setAssignments({});
      setSelectedText('');
      setSelectedRange(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '导入 Word 失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const buildSections = () => {
    const sections: ResumeSection[] = modules
      .map(module => ({ ...module, title: module.title.trim() }))
      .filter(module => module.title.length > 0)
      .map(module => ({
        id: crypto.randomUUID(),
        type: inferSectionType(module.title),
        title: module.title,
        enabled: true,
        content: normalizeText(
          (assignments[module.id] || [])
            .slice()
            .sort((a, b) => a.start - b.start || a.end - b.end)
            .map(item => item.text)
            .join('\n\n'),
        ),
      }))
      .filter(section => section.content.length > 0);

    if (sections.length === 0) {
      throw new Error('请至少框选一段内容并分配到模块。');
    }

    return sections;
  };

  const previewBlocks = useMemo(() => {
    if (resumeHtml.trim()) return [];
    if (resumeBlocks.length > 0) return resumeBlocks;
    const text = resumeText.trim();
    if (!text) return [];
    return text.split(/\n{2,}/).map((block, index) => ({
      id: `fallback-${index}`,
      kind: 'paragraph' as const,
      text: block,
    }));
  }, [resumeBlocks, resumeHtml, resumeText]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const sections = buildSections();
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          targetRole: targetRole.trim(),
          sourceFileName,
          templateId,
          sections,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '保存简历失败');
      router.push(`/resumes/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存简历失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <label className="text-sm text-gray-700">
            简历名称
            <input value={name} onChange={event => setName(event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
          </label>
          <label className="text-sm text-gray-700">
            目标岗位
            <input value={targetRole} onChange={event => setTargetRole(event.target.value)} placeholder="例如：前端开发工程师" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
          </label>
          <div className="text-sm text-gray-700">
            来源文件
            <div className="mt-1 rounded-md border border-dashed border-gray-300 px-3 py-2 text-gray-500">
              {sourceFileName || '尚未上传 Word'}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-gray-900">选择简历模板</h2>
          <p className="text-sm text-gray-500 mt-1">先选一个导出样式，后面也可以在简历编辑页再换。</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {RESUME_TEMPLATES.map(template => (
            <button
              key={template.id}
              type="button"
              onClick={() => setTemplateId(template.id)}
              className={`rounded-lg border p-4 text-left transition-colors ${templateId === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
            >
              <div className="font-semibold text-gray-900">{template.name}</div>
              <div className="mt-1 text-sm text-gray-500">{template.description}</div>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
        <Card className="max-h-[760px] overflow-y-auto p-5">
          {resumeText.trim() ? (
            <>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900">模块</h2>
                  <p className="mt-1 text-xs text-gray-500 xl:whitespace-nowrap">先在右边框选文字，再放进模块。</p>
                </div>
                <Button variant="secondary" onClick={addModule} className="whitespace-nowrap px-5">
                  + 新增
                </Button>
              </div>

              <div className="space-y-3">
                {modules.map(module => {
                  const items = [...(assignments[module.id] || [])].sort((a, b) => a.start - b.start || a.end - b.end);
                  return (
                    <div key={module.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center gap-2">
                        <input
                          value={module.title}
                          onChange={event => updateModule(module.id, { title: event.target.value })}
                          placeholder="模块名称"
                          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeModule(module.id)} disabled={modules.length <= 1}>
                          删除
                        </Button>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <Badge color="gray">{items.length} 段内容</Badge>
                        <Button size="sm" onClick={() => assignSelection(module.id)} disabled={!module.title.trim() || !selectedText.trim()}>
                          放入这里
                        </Button>
                      </div>
                      {items.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {items.map(item => (
                            <div key={item.id} className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                              <p className="line-clamp-3 whitespace-pre-wrap">{item.text}</p>
                              <button className="mt-2 text-red-600 hover:text-red-700" onClick={() => removeAssignedText(module.id, item.id)}>
                                移除
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="rounded-md border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400">
              先上传 Word，再填写模块名称
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">整份简历</h2>
              <p className="text-sm text-gray-500 mt-1">用鼠标框选需要的文字，再点左边模块的“放入这里”。</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge color="blue">已分配 {assignedTexts.length} 段</Badge>
              <input ref={fileRef} type="file" accept=".docx" className="hidden" onChange={event => handleUpload(event.target.files?.[0])} />
              <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? '解析中...' : '上传 Word'}
              </Button>
            </div>
          </div>

          {selectedText.trim() && (
            <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              当前选中：{selectedText.trim().slice(0, 120)}{selectedText.trim().length > 120 ? '...' : ''}
            </div>
          )}

          {resumeHtml.trim() || previewBlocks.length > 0 ? (
            <div className="max-h-[760px] overflow-auto rounded-lg bg-gray-100 px-4 py-6">
              {resumeHtml.trim() ? (
                <div
                  ref={previewRef}
                  className="resume-import-preview mx-auto min-h-[760px] max-w-[780px] bg-white px-10 py-12 text-gray-900 shadow-sm ring-1 ring-gray-200"
                  onMouseUp={refreshSelection}
                  onKeyUp={refreshSelection}
                  dangerouslySetInnerHTML={{ __html: resumeHtml }}
                />
              ) : (
                <div
                  ref={previewRef}
                  className="resume-import-preview mx-auto min-h-[760px] max-w-[780px] bg-white px-10 py-12 text-gray-900 shadow-sm ring-1 ring-gray-200"
                  onMouseUp={refreshSelection}
                  onKeyUp={refreshSelection}
                >
                  {previewBlocks.map(block => (
                    <p key={block.id}>
                      {block.text.split('\n').map((line, index) => (
                        <span key={`${block.id}-${index}`}>
                          {index > 0 && <br />}
                          {line}
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              tabIndex={0}
              className="min-h-[620px] w-full rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-24 text-center text-sm text-gray-400"
              onPaste={event => {
                const text = event.clipboardData.getData('text/plain');
                if (!text.trim()) return;
                event.preventDefault();
                setResumeText(text);
                setResumeHtml('');
                setResumeBlocks([]);
              }}
            >
              上传 Word 后，这里会显示整份简历。也可以直接粘贴简历文本。
            </div>
          )}
        </Card>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={() => router.push('/resumes')}>返回列表</Button>
        <Button onClick={handleSave} disabled={saving || (!resumeHtml.trim() && previewBlocks.length === 0)}>
          {saving ? '保存中...' : '保存结构化简历'}
        </Button>
      </div>
    </div>
  );
}
