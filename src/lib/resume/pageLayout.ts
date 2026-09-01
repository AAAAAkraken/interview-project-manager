import type { ResumeDocument, ResumePageCount } from '@/types/resume';

export type ResumePageDensity = 'relaxed' | 'normal' | 'compact' | 'tight' | 'overflow';

export const RESUME_PAGE_COUNTS: ResumePageCount[] = [1, 2, 3];
export const DEFAULT_RESUME_PAGE_COUNT: ResumePageCount = 1;

export function normalizeResumePageCount(value?: unknown): ResumePageCount {
  return value === 2 || value === 3 ? value : 1;
}

export function getResumePageDensity(targetPages: ResumePageCount, actualPages: number): ResumePageDensity {
  if (targetPages === 1) {
    if (actualPages <= 1) return 'normal';
    if (actualPages === 2) return 'compact';
    if (actualPages === 3) return 'tight';
    return 'overflow';
  }

  if (targetPages === 2) {
    if (actualPages <= 2) return 'relaxed';
    if (actualPages === 3) return 'compact';
    if (actualPages <= 6) return 'tight';
    return 'overflow';
  }

  if (actualPages <= 3) return 'relaxed';
  if (actualPages <= 5) return 'compact';
  if (actualPages <= 7) return 'tight';
  return 'overflow';
}

export function getResumePageWarning(targetPages: ResumePageCount, density: ResumePageDensity): string {
  if (density !== 'overflow') return '';
  return targetPages === 1
    ? '内容太多，当前 1 页模板装不下，请删减内容或改成更多页'
    : `内容太多，当前 ${targetPages} 页模板还是装不下，请继续删减内容或改成更多页`;
}

export function shouldShowResumePageWarning(print: boolean, warning: string): boolean {
  return !print && Boolean(warning);
}

export function getResumePageDensityClass(density: ResumePageDensity): string {
  switch (density) {
    case 'normal':
      return 'resume-density-normal';
    case 'compact':
      return 'resume-density-compact';
    case 'tight':
      return 'resume-density-tight';
    case 'overflow':
      return 'resume-density-overflow';
    default:
      return 'resume-density-relaxed';
  }
}

export function estimateResumePageCount(resume: Pick<ResumeDocument, 'name' | 'targetRole' | 'sections' | 'photoDataUrl'>): number {
  const enabledSections = resume.sections.filter(section => section.enabled);
  let score = 0.8;
  score += resume.name.trim() ? 0.15 : 0;
  score += resume.targetRole.trim() ? 0.1 : 0;
  score += resume.photoDataUrl ? 0.12 : 0;

  for (const section of enabledSections) {
    score += 0.18;
    score += Math.ceil(section.content.trim().length / 900);
    score += section.content.split(/\r?\n/).filter(Boolean).length * 0.06;
    if (section.type === 'basic') score += 0.15;
  }

  return Math.max(1, Math.ceil(score));
}
