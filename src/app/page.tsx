'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { ProjectList } from '@/components/dashboard/ProjectList';
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import type { Project } from '@/types/project';

type FilterMode = 'all' | 'analyzed' | 'unanalyzed';
type SortMode = 'updated' | 'created' | 'name';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sort, setSort] = useState<SortMode>('updated');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('加载项目列表失败');
      const data = await res.json();
      setProjects(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载项目列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const visibleProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .filter(project => {
        const hasAnalysis = Boolean(project.analysisCount && project.analysisCount > 0);
        if (filter === 'analyzed' && !hasAnalysis) return false;
        if (filter === 'unanalyzed' && hasAnalysis) return false;
        if (!q) return true;
        return project.name.toLowerCase().includes(q) || project.description.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name, 'zh-CN');
        const left = sort === 'created' ? a.createdAt : a.updatedAt;
        const right = sort === 'created' ? b.createdAt : b.updatedAt;
        return new Date(right).getTime() - new Date(left).getTime();
      });
  }, [projects, query, filter, sort]);

  const handleDelete = async (id: string) => {
    setDeleteError('');
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '删除项目失败');
      }
      await loadProjects();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : '删除项目失败');
    }
  };

  if (loading) return <LoadingSpinner text="加载项目列表..." />;
  if (error) return <ErrorState title="加载失败" description={error} onRetry={loadProjects} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">项目列表</h1>
          <p className="text-sm text-gray-500 mt-1">面试项目管理器</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="lg">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          创建项目
        </Button>
      </div>

      {deleteError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </div>
      )}

      {projects.length > 0 && (
        <div className="mb-6 space-y-4">
          <SearchBar onSearch={setQuery} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex rounded-lg bg-gray-100 p-0.5">
              {[
                ['all', '全部'],
                ['analyzed', '已分析'],
                ['unanalyzed', '未分析'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value as FilterMode)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    filter === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortMode)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700"
            >
              <option value="updated">最近更新</option>
              <option value="created">创建时间</option>
              <option value="name">项目名称</option>
            </select>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          }
          title="还没有项目"
          description="创建第一个项目，然后导入 AI 分析结果生成面试档案。"
          actionLabel="创建项目"
          onAction={() => setShowCreate(true)}
        />
      ) : visibleProjects.length === 0 ? (
        <EmptyState
          title="没有匹配的项目"
          description="调整搜索关键词、筛选条件或排序方式后再试。"
        />
      ) : (
        <ProjectList projects={visibleProjects} onDelete={handleDelete} />
      )}

      <CreateProjectModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadProjects}
      />
    </div>
  );
}
