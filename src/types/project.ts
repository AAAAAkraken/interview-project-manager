export interface Project {
  id: string;
  name: string;
  description: string;
  repoPath: string;
  createdAt: string;
  updatedAt: string;
  analysisCount?: number;
  latestAnalysisAt?: string | null;
  latestAnalysisLanguage?: string | null;
  latestAnalysisFrameworks?: string[];
  latestAnalysisDatabase?: string | null;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  repoPath: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  repoPath?: string;
}
