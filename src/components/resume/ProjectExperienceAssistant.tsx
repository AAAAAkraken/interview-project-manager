'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { ApplyProjectExperienceOptions } from '@/lib/resume/projectExperienceApply';
import type { Project } from '@/types/project';
import type { ResumeDocument } from '@/types/resume';

interface GeneratedProject {
  projectId: string;
  projectName: string;
  role: string;
  duration: string;
  techStack: string[];
  content: string;
}

interface GenerationHistoryItem {
  id: string;
  createdAt: string;
  projectNames: string[];
  content: string;
}

function buildPreview(projects: GeneratedProject[]) {
  return projects.map(project => [
    `${project.projectName} | ${project.role}`,
    project.duration ? `项目周期：${project.duration}` : '',
    `技术栈：${project.techStack.join('、')}`,
    project.content,
  ].filter(Boolean).join('\n')).join('\n\n');
}

export function ProjectExperienceAssistant({
  resume,
  projects,
  onApply,
  onTargetRoleChange,
}: {
  resume: ResumeDocument;
  projects: Project[];
  onApply: (options: ApplyProjectExperienceOptions) => void;
  onTargetRoleChange: (targetRole: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState<GeneratedProject[]>([]);
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [targetMode, setTargetMode] = useState<'existing' | 'new'>('existing');
  const [targetSectionId, setTargetSectionId] = useState('');
  const [writeMode, setWriteMode] = useState<'append' | 'replace'>('append');
  const [newSectionTitle, setNewSectionTitle] = useState('项目经历');

  const analyzedProjects = projects.filter(project => (project.analysisCount || 0) > 0);
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const storageKey = `resume-project-generation-history:${resume.id}`;
  const sectionOptions = resume.sections.filter(section => section.enabled || section.content.trim());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setHistory(Array.isArray(parsed) ? parsed : []);
    } catch {
      setHistory([]);
    }
    setActiveHistoryId(null);
  }, [storageKey]);

  useEffect(() => {
    if (targetSectionId && resume.sections.some(section => section.id === targetSectionId)) return;
    const projectSection = resume.sections.find(section => section.type === 'projects')
      || resume.sections.find(section => /项目经历|项目经验|项目实践|项目实战|项目作品|项目案例|科研项目|课程项目/.test(section.title));
    setTargetSectionId(projectSection?.id || resume.sections[0]?.id || '');
  }, [resume.sections, targetSectionId]);

  const saveHistory = (items: GenerationHistoryItem[]) => {
    setHistory(items);
    localStorage.setItem(storageKey, JSON.stringify(items));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/resumes/${resume.id}/generate-projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: resume.targetRole, jobKeywords: resume.targetRole, projectIds: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details ? `${data.error}：${data.details}` : data.error || '生成失败');
      const nextGenerated = data.generated.projects || [];
      setGenerated(nextGenerated);
      const content = buildPreview(nextGenerated);
      if (content.trim()) {
        const item: GenerationHistoryItem = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          projectNames: nextGenerated.map((project: GeneratedProject) => project.projectName),
          content,
        };
        saveHistory([item, ...history].slice(0, 20));
        setActiveHistoryId(item.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成项目经历失败');
    } finally {
      setLoading(false);
    }
  };

  const preview = useMemo(() => buildPreview(generated), [generated]);

  const deleteHistory = (id: string) => {
    saveHistory(history.filter(item => item.id !== id));
    if (activeHistoryId === id) setActiveHistoryId(null);
  };

  const applyContent = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    if (targetMode === 'new' || !targetSectionId) {
      onApply({
        mode: writeMode,
        content: trimmed,
        newSectionTitle: newSectionTitle.trim() || '项目经历',
      });
      return;
    }

    onApply({
      mode: writeMode,
      content: trimmed,
      targetSectionId,
    });
  };

  return (
    <Card className="p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">AI 项目经历助手</h2>
        <p className="text-sm text-gray-500 mt-1">只生成项目经历，不会自动修改其他简历模块。</p>
      </div>

      <label className="block text-sm text-gray-700 mb-4">
        岗位关键词
        <input value={resume.targetRole} onChange={event => onTargetRoleChange(event.target.value)} placeholder="例如：前端开发工程师 / React、性能优化、工程化" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
      </label>

      <div className="space-y-2 mb-4">
        {analyzedProjects.length === 0 && <p className="text-sm text-gray-500">暂无已分析项目，请先在项目管理中完成项目分析。</p>}
        {analyzedProjects.map(project => (
          <label key={project.id} className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2 cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={selected.includes(project.id)} onChange={() => toggle(project.id)} />
            <span className="text-sm text-gray-800">{project.name}</span>
            <span className="ml-auto text-xs text-gray-400">{project.latestAnalysisLanguage || '已分析'}</span>
          </label>
        ))}
      </div>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <Button onClick={handleGenerate} disabled={loading || selected.length === 0 || !resume.targetRole.trim()}>{loading ? '生成中...' : '生成项目经历'}</Button>

      {generated.length > 0 && (
        <div className="mt-5 border-t border-gray-200 pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">生成预览</h3>
          <textarea value={preview} readOnly className="min-h-64 w-full rounded-md border border-gray-200 bg-gray-50 p-3 text-sm leading-6" />
          <ApplyControls
            sectionOptions={sectionOptions}
            targetMode={targetMode}
            targetSectionId={targetSectionId}
            writeMode={writeMode}
            newSectionTitle={newSectionTitle}
            onTargetModeChange={setTargetMode}
            onTargetSectionIdChange={setTargetSectionId}
            onWriteModeChange={setWriteMode}
            onNewSectionTitleChange={setNewSectionTitle}
            onApply={() => applyContent(preview)}
          />
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-5 border-t border-gray-200 pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">历史生成项目经历</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {history.map(item => (
              <div key={item.id} className="rounded-md border border-gray-200 px-3 py-2">
                <button
                  type="button"
                  className="block w-full text-left text-sm font-medium text-gray-900 hover:text-blue-700"
                  onClick={() => setActiveHistoryId(activeHistoryId === item.id ? null : item.id)}
                >
                  {item.projectNames.join('、') || '项目经历'}
                </button>
                <div className="mt-1 text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</div>
                {activeHistoryId === item.id && (
                  <textarea value={item.content} readOnly className="mt-2 min-h-40 w-full rounded-md border border-gray-200 bg-gray-50 p-3 text-sm leading-6" />
                )}
                <div className="mt-2 flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => applyContent(item.content)}>应用</Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteHistory(item.id)}>删除</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function ApplyControls({
  sectionOptions,
  targetMode,
  targetSectionId,
  writeMode,
  newSectionTitle,
  onTargetModeChange,
  onTargetSectionIdChange,
  onWriteModeChange,
  onNewSectionTitleChange,
  onApply,
}: {
  sectionOptions: Array<{ id: string; title: string }>;
  targetMode: 'existing' | 'new';
  targetSectionId: string;
  writeMode: 'append' | 'replace';
  newSectionTitle: string;
  onTargetModeChange: (mode: 'existing' | 'new') => void;
  onTargetSectionIdChange: (id: string) => void;
  onWriteModeChange: (mode: 'append' | 'replace') => void;
  onNewSectionTitleChange: (title: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <button
          type="button"
          className={`rounded-md border px-3 py-2 ${targetMode === 'existing' ? 'border-blue-500 bg-white text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}
          onClick={() => onTargetModeChange('existing')}
        >
          放到已有模块
        </button>
        <button
          type="button"
          className={`rounded-md border px-3 py-2 ${targetMode === 'new' ? 'border-blue-500 bg-white text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}
          onClick={() => onTargetModeChange('new')}
        >
          新建模块
        </button>
      </div>

      {targetMode === 'existing' ? (
        <label className="mt-3 block text-sm text-gray-700">
          选择模块
          <select
            value={targetSectionId}
            onChange={event => onTargetSectionIdChange(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2"
          >
            {sectionOptions.map(section => (
              <option key={section.id} value={section.id}>{section.title || '未命名模块'}</option>
            ))}
          </select>
        </label>
      ) : (
        <label className="mt-3 block text-sm text-gray-700">
          新模块名称
          <input
            value={newSectionTitle}
            onChange={event => onNewSectionTitleChange(event.target.value)}
            placeholder="例如：项目经验、科研项目"
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2"
          />
        </label>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <button
          type="button"
          className={`rounded-md border px-3 py-2 ${writeMode === 'append' ? 'border-blue-500 bg-white text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}
          onClick={() => onWriteModeChange('append')}
        >
          追加
        </button>
        <button
          type="button"
          className={`rounded-md border px-3 py-2 ${writeMode === 'replace' ? 'border-blue-500 bg-white text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}
          onClick={() => onWriteModeChange('replace')}
        >
          替换
        </button>
      </div>

      <div className="mt-3 flex justify-end">
        <Button onClick={onApply}>应用到模块</Button>
      </div>
    </div>
  );
}
