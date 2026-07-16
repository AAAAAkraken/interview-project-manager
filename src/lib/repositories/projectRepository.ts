import db from '@/lib/db';
import type { Project, CreateProjectInput } from '@/types/project';

interface ProjectRow {
  id: string;
  name: string;
  description: string;
  repo_path: string;
  created_at: string;
  updated_at: string;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    repoPath: row.repo_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getAllProjects(): Project[] {
  const rows = db.prepare(
    'SELECT * FROM projects ORDER BY updated_at DESC'
  ).all() as ProjectRow[];
  return rows.map(rowToProject);
}

export function getProjectById(id: string): Project | undefined {
  const row = db.prepare(
    'SELECT * FROM projects WHERE id = ?'
  ).get(id) as ProjectRow | undefined;
  return row ? rowToProject(row) : undefined;
}

export function createProject(input: CreateProjectInput): Project {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO projects (id, name, description, repo_path, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, input.name, input.description, input.repoPath, now, now);
  return getProjectById(id)!;
}

export function updateProject(id: string, input: Partial<CreateProjectInput>): Project | undefined {
  const project = getProjectById(id);
  if (!project) return undefined;

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE projects
    SET name = ?, description = ?, repo_path = ?, updated_at = ?
    WHERE id = ?
  `).run(
    input.name ?? project.name,
    input.description ?? project.description,
    input.repoPath ?? project.repoPath,
    now,
    id
  );
  return getProjectById(id)!;
}

export function deleteProject(id: string): boolean {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  return result.changes > 0;
}

export function searchProjects(query: string): Project[] {
  const rows = db.prepare(
    `SELECT * FROM projects
     WHERE name LIKE ? OR description LIKE ?
     ORDER BY updated_at DESC`
  ).all(`%${query}%`, `%${query}%`) as ProjectRow[];
  return rows.map(rowToProject);
}
