export interface AiSettings {
  provider: 'openai-compatible';
  baseUrl: string;
  apiKey: string;
  model: string;
  updatedAt: string;
}

export interface PublicAiSettings {
  provider: 'openai-compatible';
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
  updatedAt: string | null;
}

export interface SaveAiSettingsInput {
  provider?: 'openai-compatible';
  baseUrl: string;
  apiKey?: string;
  model: string;
}
