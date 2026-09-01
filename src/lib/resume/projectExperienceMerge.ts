export function appendProjectExperienceContent(existing: string, incoming: string): string {
  const current = existing.trim();
  const next = incoming.trim();

  if (!next) return current;
  if (!current) return next;

  return `${current}\n\n${next}`;
}
