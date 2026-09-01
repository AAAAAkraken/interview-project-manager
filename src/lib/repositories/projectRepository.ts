import db from '@/lib/db';
import { normalizeRepoPath } from '@/lib/projects/repoPath';
import type { Project, CreateProjectInput } from '@/types/project';

interface ProjectRow {
  id: string;
  name: string;
  description: string;
  repo_path: string;
  created_at: string;
  updated_at: string;
}

interface ProjectWithAnalysisRow extends ProjectRow {
  analysis_count: number;
  latest_analysis_at: string | null;
  latest_analysis_language: string | null;
  latest_analysis_frameworks: string | null;
  latest_analysis_database: string | null;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    repoPath: normalizeRepoPath(row.repo_path),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToProjectWithAnalysis(row: ProjectWithAnalysisRow): Project {
  return {
    ...rowToProject(row),
    analysisCount: row.analysis_count,
    latestAnalysisAt: row.latest_analysis_at,
    latestAnalysisLanguage: row.latest_analysis_language,
    latestAnalysisFrameworks: row.latest_analysis_frameworks
      ? JSON.parse(row.latest_analysis_frameworks)
      : [],
    latestAnalysisDatabase: row.latest_analysis_database,
  };
}

export function getAllProjects(): Project[] {
  const rows = db.prepare(
    'SELECT * FROM projects ORDER BY updated_at DESC'
  ).all() as ProjectRow[];
  return rows.map(rowToProject);
}

export function getAllProjectsWithAnalysisStatus(): Project[] {
  const rows = db.prepare(`
    SELECT
      p.*,
      COUNT(a.id) AS analysis_count,
      latest.created_at AS latest_analysis_at,
      latest.language AS latest_analysis_language,
      latest.frameworks AS latest_analysis_frameworks,
      latest.database_used AS latest_analysis_database
    FROM projects p
    LEFT JOIN analyses a ON a.project_id = p.id
    LEFT JOIN analyses latest ON latest.id = (
      SELECT id FROM analyses
      WHERE project_id = p.id
      ORDER BY created_at DESC
      LIMIT 1
    )
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `).all() as ProjectWithAnalysisRow[];
  return rows.map(rowToProjectWithAnalysis);
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
  `).run(id, input.name, input.description, normalizeRepoPath(input.repoPath), now, now);
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
    input.repoPath === undefined ? project.repoPath : normalizeRepoPath(input.repoPath),
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
