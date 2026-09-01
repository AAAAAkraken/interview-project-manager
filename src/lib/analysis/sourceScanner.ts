import fs from 'fs';
import path from 'path';
import { normalizeRepoPath } from '../projects/repoPath';

export interface SourceFile {
  relativePath: string;
  content: string;
  bytes: number;
}

export interface ScanOptions {
  maxFiles?: number;
  maxBytesPerFile?: number;
  maxTotalBytes?: number;
}

const DEFAULT_OPTIONS: Required<ScanOptions> = {
  maxFiles: 40,
  maxBytesPerFile: 12_000,
  maxTotalBytes: 120_000,
};

const IGNORED_DIRS = new Set([
  '.git',
  '.next',
  '.test-dist',
  'node_modules',
  'dist',
  'build',
  'release',
  'database',
  'coverage',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.css',
  '.scss',
  '.html',
  '.py',
  '.java',
  '.go',
  '.rs',
  '.sql',
]);

export function scanSourceFiles(repoPath: string, options: ScanOptions = {}): SourceFile[] {
  const normalizedRepoPath = normalizeRepoPath(repoPath);
  const resolvedRoot = path.resolve(normalizedRepoPath);
  if (!fs.existsSync(resolvedRoot) || !fs.statSync(resolvedRoot).isDirectory()) {
    throw new Error('项目代码路径不存在或不是文件夹');
  }

  const limits = { ...DEFAULT_OPTIONS, ...options };
  const results: SourceFile[] = [];
  let totalBytes = 0;

  function walk(currentDir: string) {
    if (results.length >= limits.maxFiles || totalBytes >= limits.maxTotalBytes) return;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      if (results.length >= limits.maxFiles || totalBytes >= limits.maxTotalBytes) break;

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) walk(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) continue;

      const stat = fs.statSync(fullPath);
      if (stat.size <= 0) continue;

      const remaining = limits.maxTotalBytes - totalBytes;
      const readLimit = Math.min(limits.maxBytesPerFile, remaining);
      if (readLimit <= 0) break;

      const buffer = Buffer.alloc(Math.min(stat.size, readLimit));
      const fd = fs.openSync(fullPath, 'r');
      const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
      fs.closeSync(fd);

      const content = buffer.subarray(0, bytesRead).toString('utf8');
      results.push({
        relativePath: path.relative(resolvedRoot, fullPath).replace(/\\/g, '/'),
        content,
        bytes: bytesRead,
      });
      totalBytes += bytesRead;
    }
  }

  walk(resolvedRoot);
  return results;
}
