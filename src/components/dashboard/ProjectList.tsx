'use client';
import { ProjectCard } from './ProjectCard';
import type { Project } from '@/types/project';

export function ProjectList({
  projects,
  onDelete,
}: {
  projects: Project[];
  onDelete: (id: string) => void;
}) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} onDelete={onDelete} />
      ))}
    </div>
  );
}
