import db from '@/lib/db';
import { sanitizeResumePhotoDataUrl } from '@/lib/resume/photo';
import { DEFAULT_RESUME_PAGE_COUNT, normalizeResumePageCount } from '@/lib/resume/pageLayout';
import { DEFAULT_RESUME_TEMPLATE_ID, getResumeTemplate } from '@/lib/resume/templates';
import type { CreateResumeInput, ResumeDocument, ResumeSection, UpdateResumeInput } from '@/types/resume';

interface ResumeRow {
  id: string;
  name: string;
  target_role: string;
  source_file_name: string;
  template_id?: string;
  page_count?: number;
  photo_data_url?: string;
  sections: string;
  created_at: string;
  updated_at: string;
}

function rowToResume(row: ResumeRow): ResumeDocument {
  return {
    id: row.id,
    name: row.name,
    targetRole: row.target_role,
    sourceFileName: row.source_file_name,
    templateId: getResumeTemplate(row.template_id || DEFAULT_RESUME_TEMPLATE_ID).id,
    pageCount: normalizeResumePageCount(row.page_count || DEFAULT_RESUME_PAGE_COUNT),
    photoDataUrl: sanitizeResumePhotoDataUrl(row.photo_data_url || ''),
    sections: JSON.parse(row.sections) as ResumeSection[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getAllResumes(): ResumeDocument[] {
  const rows = db.prepare('SELECT * FROM resumes ORDER BY updated_at DESC').all() as ResumeRow[];
  return rows.map(rowToResume);
}

export function getResumeById(id: string): ResumeDocument | undefined {
  const row = db.prepare('SELECT * FROM resumes WHERE id = ?').get(id) as ResumeRow | undefined;
  return row ? rowToResume(row) : undefined;
}

export function createResume(input: CreateResumeInput): ResumeDocument {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO resumes (id, name, target_role, source_file_name, template_id, page_count, photo_data_url, sections, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, input.name, input.targetRole || '', input.sourceFileName || '', getResumeTemplate(input.templateId).id, normalizeResumePageCount(input.pageCount), sanitizeResumePhotoDataUrl(input.photoDataUrl), JSON.stringify(input.sections), now, now);
  return getResumeById(id)!;
}

export function updateResume(id: string, input: UpdateResumeInput): ResumeDocument | undefined {
  const existing = getResumeById(id);
  if (!existing) return undefined;
  const updatedAt = new Date().toISOString();
  db.prepare(`
    UPDATE resumes
    SET name = ?, target_role = ?, template_id = ?, page_count = ?, photo_data_url = ?, sections = ?, updated_at = ?
    WHERE id = ?
  `).run(
    input.name ?? existing.name,
    input.targetRole ?? existing.targetRole,
    getResumeTemplate(input.templateId ?? existing.templateId).id,
    normalizeResumePageCount(input.pageCount ?? existing.pageCount),
    sanitizeResumePhotoDataUrl(input.photoDataUrl ?? existing.photoDataUrl),
    JSON.stringify(input.sections ?? existing.sections),
    updatedAt,
    id
  );
  return getResumeById(id)!;
}

export function deleteResume(id: string): boolean {
  return db.prepare('DELETE FROM resumes WHERE id = ?').run(id).changes > 0;
}
