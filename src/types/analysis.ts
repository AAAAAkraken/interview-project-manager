export interface Analysis {
  id: string;
  projectId: string;
  language: string;
  frameworks: string[];
  databaseUsed: string;
  architecture: string;
  directoryStructure: Record<string, string>;
  rawAiResponse: string;
  createdAt: string;
}

export interface AnalysisSummary {
  id: string;
  projectId: string;
  language: string;
  frameworks: string[];
  databaseUsed: string;
  createdAt: string;
  keyFileCount: number;
  questionCount: number;
  highlightCount: number;
}

export interface KeyFile {
  id: string;
  analysisId: string;
  filePath: string;
  role: string;
  description: string;
  keyTechnologies: string[];
}

export interface InterviewQuestion {
  id: string;
  analysisId: string;
  category: string;
  question: string;
  suggestedAnswer: string;
}

export interface ResumeHighlight {
  id: string;
  analysisId: string;
  content: string;
}

export interface CreateAnalysisInput {
  projectId: string;
  language: string;
  frameworks: string[];
  databaseUsed: string;
  architecture: string;
  directoryStructure: Record<string, string>;
  rawAiResponse: string;
  keyFiles: Omit<KeyFile, 'id' | 'analysisId'>[];
  interviewQuestions: Omit<InterviewQuestion, 'id' | 'analysisId'>[];
  resumeHighlights: Omit<ResumeHighlight, 'id' | 'analysisId'>[];
}

export interface ParsedAIResponse {
  overview: {
    language: string;
    summary: string;
    architecture: string;
    directoryStructure: Record<string, string>;
  };
  techStack: {
    frameworks: string[];
    database: string;
    keyLibraries: string[];
  };
  keyFiles: {
    filePath: string;
    role: string;
    description: string;
    keyTechnologies: string[];
  }[];
  interviewQuestions: {
    category: string;
    question: string;
    suggestedAnswer: string;
  }[];
  resumeHighlights: {
    content: string;
  }[];
}
