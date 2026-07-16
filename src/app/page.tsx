'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { ProjectList } from '@/components/dashboard/ProjectList';
import { CreateProjectModal } from '@/components/dashboard/CreateProjectModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Project } from '@/types/project';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filtered, setFiltered] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        setFiltered(data);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFiltered(projects);
    } else {
      const q = query.toLowerCase();
      setFiltered(projects.filter(p =>
        p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      ));
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) loadProjects();
  };

  if (loading) return <LoadingSpinner text="加载项目列表..." />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">项目列表</h1>
          <p className="text-sm text-gray-500 mt-1">牛马速通器 — 面试准备利器</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="lg">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          创建项目
        </Button>
      </div>

      {/* Search */}
      {projects.length > 0 && (
        <div className="mb-6">
          <SearchBar onSearch={handleSearch} />
        </div>
      )}

      {/* Content */}
      {projects.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          }
          title="还没有项目"
          description="创建你的第一个项目，然后用 AI 分析项目代码，生成面试档案"
          actionLabel="创建项目"
          onAction={() => setShowCreate(true)}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="没有匹配的项目"
          description="试试其他关键词"
        />
      ) : (
        <ProjectList projects={filtered} onDelete={handleDelete} />
      )}

      <CreateProjectModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadProjects}
      />
    </div>
  );
}
