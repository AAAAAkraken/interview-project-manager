export interface Project {
  id: string;
  name: string;
  description: string;
  repoPath: string;
  createdAt: string;
  updatedAt: string;
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
