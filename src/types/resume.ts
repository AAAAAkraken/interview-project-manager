export type ResumeSectionType =
  | 'basic'
  | 'target'
  | 'education'
  | 'work'
  | 'projects'
  | 'skills'
  | 'summary'
  | 'custom';

export type ResumeImportBlockKind = 'paragraph' | 'table-row' | 'list-item';
export type ResumePageCount = 1 | 2 | 3;

export interface ResumeSection {
  id: string;
  type: ResumeSectionType;
  title: string;
  enabled: boolean;
  content: string;
}

export interface ResumeImportBlock {
  id: string;
  kind: ResumeImportBlockKind;
  text: string;
}

export interface ResumeImportModule {
  id: string;
  title: string;
}

export interface ResumeImportPreview {
  sourceFileName: string;
  blocks: ResumeImportBlock[];
  text: string;
  html: string;
}

export interface ResumeDocument {
  id: string;
  name: string;
  targetRole: string;
  sourceFileName: string;
  templateId: string;
  pageCount: ResumePageCount;
  photoDataUrl: string;
  sections: ResumeSection[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateResumeInput {
  name: string;
  targetRole?: string;
  sourceFileName?: string;
  templateId?: string;
  pageCount?: ResumePageCount;
  photoDataUrl?: string;
  sections: ResumeSection[];
}

export interface UpdateResumeInput {
  name?: string;
  targetRole?: string;
  templateId?: string;
  pageCount?: ResumePageCount;
  photoDataUrl?: string;
  sections?: ResumeSection[];
}
