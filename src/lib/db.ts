import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// In Electron production mode, use the path passed via DB_PATH env var
// In dev mode, use ./database/ relative to project root
const DB_PATH = process.env.DB_PATH
  || path.join(process.cwd(), 'database', 'interview-projects.db');

const DB_DIR = path.dirname(DB_PATH);

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    repo_path TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT '',
    frameworks TEXT NOT NULL DEFAULT '[]',
    database_used TEXT NOT NULL DEFAULT '',
    architecture TEXT NOT NULL DEFAULT '',
    directory_structure TEXT NOT NULL DEFAULT '{}',
    raw_ai_response TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS key_files (
    id TEXT PRIMARY KEY,
    analysis_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    key_technologies TEXT NOT NULL DEFAULT '[]',
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS interview_questions (
    id TEXT PRIMARY KEY,
    analysis_id TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    question TEXT NOT NULL,
    suggested_answer TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS resume_highlights (
    id TEXT PRIMARY KEY,
    analysis_id TEXT NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_analyses_project_id ON analyses(project_id);
  CREATE INDEX IF NOT EXISTS idx_key_files_analysis_id ON key_files(analysis_id);
  CREATE INDEX IF NOT EXISTS idx_interview_questions_analysis_id ON interview_questions(analysis_id);
  CREATE INDEX IF NOT EXISTS idx_resume_highlights_analysis_id ON resume_highlights(analysis_id);
`);

export default db;
