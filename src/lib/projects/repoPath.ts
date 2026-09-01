export function normalizeRepoPath(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (raw.length < 2) return raw;

  const first = raw[0];
  const last = raw[raw.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return raw.slice(1, -1).trim();
  }

  return raw;
}
