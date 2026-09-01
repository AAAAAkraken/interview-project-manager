import db from '@/lib/db';
import type { Analysis, AnalysisSummary, KeyFile, InterviewQuestion, ResumeHighlight, CreateAnalysisInput } from '@/types/analysis';

interface AnalysisRow {
  id: string;
  project_id: string;
  language: string;
  frameworks: string;
  database_used: string;
  architecture: string;
  directory_structure: string;
  raw_ai_response: string;
  created_at: string;
}

interface AnalysisSummaryRow {
  id: string;
  project_id: string;
  language: string;
  frameworks: string;
  database_used: string;
  created_at: string;
  key_file_count: number;
  question_count: number;
  highlight_count: number;
}

function rowToAnalysis(row: AnalysisRow): Analysis {
  return {
    id: row.id,
    projectId: row.project_id,
    language: row.language,
    frameworks: JSON.parse(row.frameworks),
    databaseUsed: row.database_used,
    architecture: row.architecture,
    directoryStructure: JSON.parse(row.directory_structure),
    rawAiResponse: row.raw_ai_response,
    createdAt: row.created_at,
  };
}

function rowToAnalysisSummary(row: AnalysisSummaryRow): AnalysisSummary {
  return {
    id: row.id,
    projectId: row.project_id,
    language: row.language,
    frameworks: JSON.parse(row.frameworks),
    databaseUsed: row.database_used,
    createdAt: row.created_at,
    keyFileCount: row.key_file_count,
    questionCount: row.question_count,
    highlightCount: row.highlight_count,
  };
}

export function getAnalysesByProjectId(projectId: string): Analysis[] {
  const rows = db.prepare(
    'SELECT * FROM analyses WHERE project_id = ? ORDER BY created_at DESC'
  ).all(projectId) as AnalysisRow[];
  return rows.map(rowToAnalysis);
}

export function getAnalysisSummariesByProjectId(projectId: string): AnalysisSummary[] {
  const rows = db.prepare(`
    SELECT
      a.id,
      a.project_id,
      a.language,
      a.frameworks,
      a.database_used,
      a.created_at,
      COUNT(DISTINCT k.id) AS key_file_count,
      COUNT(DISTINCT q.id) AS question_count,
      COUNT(DISTINCT h.id) AS highlight_count
    FROM analyses a
    LEFT JOIN key_files k ON k.analysis_id = a.id
    LEFT JOIN interview_questions q ON q.analysis_id = a.id
    LEFT JOIN resume_highlights h ON h.analysis_id = a.id
    WHERE a.project_id = ?
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `).all(projectId) as AnalysisSummaryRow[];
  return rows.map(rowToAnalysisSummary);
}

export function getAnalysisById(id: string): Analysis | undefined {
  const row = db.prepare(
    'SELECT * FROM analyses WHERE id = ?'
  ).get(id) as AnalysisRow | undefined;
  return row ? rowToAnalysis(row) : undefined;
}

export function getLatestAnalysisByProjectId(projectId: string): Analysis | undefined {
  const row = db.prepare(
    'SELECT * FROM analyses WHERE project_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(projectId) as AnalysisRow | undefined;
  return row ? rowToAnalysis(row) : undefined;
}

export function createAnalysis(input: CreateAnalysisInput): Analysis {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const insertAnalysis = db.prepare(`
    INSERT INTO analyses (id, project_id, language, frameworks, database_used, architecture, directory_structure, raw_ai_response, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertKeyFile = db.prepare(`
    INSERT INTO key_files (id, analysis_id, file_path, role, description, key_technologies)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertQuestion = db.prepare(`
    INSERT INTO interview_questions (id, analysis_id, category, question, suggested_answer)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertHighlight = db.prepare(`
    INSERT INTO resume_highlights (id, analysis_id, content)
    VALUES (?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertAnalysis.run(
      id, input.projectId, input.language,
      JSON.stringify(input.frameworks),
      input.databaseUsed, input.architecture,
      JSON.stringify(input.directoryStructure),
      input.rawAiResponse, now
    );

    for (const kf of input.keyFiles) {
      insertKeyFile.run(
        crypto.randomUUID(), id, kf.filePath, kf.role,
        kf.description, JSON.stringify(kf.keyTechnologies)
      );
    }

    for (const q of input.interviewQuestions) {
      insertQuestion.run(
        crypto.randomUUID(), id, q.category, q.question, q.suggestedAnswer
      );
    }

    for (const h of input.resumeHighlights) {
      insertHighlight.run(crypto.randomUUID(), id, h.content);
    }
  });

  transaction();
  return getAnalysisById(id)!;
}

export function deleteAnalysis(id: string): boolean {
  const result = db.prepare('DELETE FROM analyses WHERE id = ?').run(id);
  return result.changes > 0;
}

// Key Files
export function getKeyFilesByAnalysisId(analysisId: string): KeyFile[] {
  const rows = db.prepare(
    'SELECT * FROM key_files WHERE analysis_id = ?'
  ).all(analysisId) as any[];
  return rows.map(r => ({
    id: r.id,
    analysisId: r.analysis_id,
    filePath: r.file_path,
    role: r.role,
    description: r.description,
    keyTechnologies: JSON.parse(r.key_technologies),
  }));
}

// Interview Questions
export function getQuestionsByAnalysisId(analysisId: string, category?: string): InterviewQuestion[] {
  let query = 'SELECT * FROM interview_questions WHERE analysis_id = ?';
  const params: string[] = [analysisId];
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  const rows = db.prepare(query).all(...params) as any[];
  return rows.map(r => ({
    id: r.id,
    analysisId: r.analysis_id,
    category: r.category,
    question: r.question,
    suggestedAnswer: r.suggested_answer,
  }));
}

export function getQuestionCategoriesByAnalysisId(analysisId: string): string[] {
  const rows = db.prepare(
    'SELECT DISTINCT category FROM interview_questions WHERE analysis_id = ?'
  ).all(analysisId) as any[];
  return rows.map(r => r.category);
}

// Resume Highlights
export function getHighlightsByAnalysisId(analysisId: string): ResumeHighlight[] {
  const rows = db.prepare(
    'SELECT * FROM resume_highlights WHERE analysis_id = ?'
  ).all(analysisId) as any[];
  return rows.map(r => ({
    id: r.id,
    analysisId: r.analysis_id,
    content: r.content,
  }));
}
