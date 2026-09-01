import db from '../db';

export type AnalysisJobStatus = 'idle' | 'running' | 'success' | 'error';

export interface AnalysisJob {
  projectId: string;
  status: AnalysisJobStatus;
  startedAt?: string;
  updatedAt?: string;
  analysisId?: string;
  scannedFiles?: number;
  error?: string;
  details?: string;
}

export interface AnalysisJobResult {
  analysisId: string;
  scannedFiles: number;
}

interface AnalysisJobRow {
  project_id: string;
  status: AnalysisJobStatus;
  started_at: string;
  updated_at: string;
  analysis_id: string;
  scanned_files: number;
  error: string;
  details: string;
}

const STALE_RUNNING_MS = 8 * 60 * 1000;

function now(): string {
  return new Date().toISOString();
}

function rowToJob(row: AnalysisJobRow): AnalysisJob {
  return {
    projectId: row.project_id,
    status: row.status,
    startedAt: row.started_at || undefined,
    updatedAt: row.updated_at || undefined,
    analysisId: row.analysis_id || undefined,
    scannedFiles: row.scanned_files || undefined,
    error: row.error || undefined,
    details: row.details || undefined,
  };
}

function saveAnalysisJob(job: AnalysisJob): AnalysisJob {
  db.prepare(`
    INSERT INTO analysis_jobs (
      project_id, status, started_at, updated_at, analysis_id, scanned_files, error, details
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(project_id) DO UPDATE SET
      status = excluded.status,
      started_at = excluded.started_at,
      updated_at = excluded.updated_at,
      analysis_id = excluded.analysis_id,
      scanned_files = excluded.scanned_files,
      error = excluded.error,
      details = excluded.details
  `).run(
    job.projectId,
    job.status,
    job.startedAt || '',
    job.updatedAt || '',
    job.analysisId || '',
    job.scannedFiles || 0,
    job.error || '',
    job.details || ''
  );
  return job;
}

function markStaleIfNeeded(job: AnalysisJob): AnalysisJob {
  if (job.status !== 'running' || !job.updatedAt) return job;

  const elapsed = Date.now() - new Date(job.updatedAt).getTime();
  if (elapsed <= STALE_RUNNING_MS) return job;

  return saveAnalysisJob({
    ...job,
    status: 'error',
    error: 'AI 自动分析可能已中断',
    details: '上一次分析超过 8 分钟没有更新，请重新开始分析。',
    updatedAt: now(),
  });
}

export function getAnalysisJob(projectId: string): AnalysisJob {
  const row = db.prepare(
    'SELECT * FROM analysis_jobs WHERE project_id = ?'
  ).get(projectId) as AnalysisJobRow | undefined;
  return row ? markStaleIfNeeded(rowToJob(row)) : { projectId, status: 'idle' };
}

export function startAnalysisJob(
  projectId: string,
  runner: () => Promise<AnalysisJobResult>
): AnalysisJob {
  const current = getAnalysisJob(projectId);
  if (current?.status === 'running') return current;

  const job: AnalysisJob = {
    projectId,
    status: 'running',
    startedAt: now(),
    updatedAt: now(),
  };
  saveAnalysisJob(job);

  void runner()
    .then((result) => {
      saveAnalysisJob({
        ...job,
        status: 'success',
        analysisId: result.analysisId,
        scannedFiles: result.scannedFiles,
        updatedAt: now(),
      });
    })
    .catch((error) => {
      saveAnalysisJob({
        ...job,
        status: 'error',
        error: 'AI 自动分析失败',
        details: error instanceof Error ? error.message : '未知错误',
        updatedAt: now(),
      });
    });

  return job;
}

export function resetAnalysisJobsForTest(): void {
  db.prepare('DELETE FROM analysis_jobs').run();
}
