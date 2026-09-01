export type ResumeTemplateId = 'classic' | 'campus' | 'technical';

export interface ResumeTemplate {
  id: ResumeTemplateId;
  name: string;
  description: string;
  accentClass: string;
}

export const DEFAULT_RESUME_TEMPLATE_ID: ResumeTemplateId = 'classic';

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: 'classic',
    name: '简洁通用',
    description: '黑白清爽，适合大多数岗位投递。',
    accentClass: 'resume-template-classic',
  },
  {
    id: 'campus',
    name: '校园招聘',
    description: '突出教育背景、实习经历和获奖证书。',
    accentClass: 'resume-template-campus',
  },
  {
    id: 'technical',
    name: '技术岗位',
    description: '突出技能、项目经历和技术关键词。',
    accentClass: 'resume-template-technical',
  },
];

export function getResumeTemplate(id?: string): ResumeTemplate {
  return RESUME_TEMPLATES.find(template => template.id === id) || RESUME_TEMPLATES[0];
}
