import db from '@/lib/db';
import type { AiSettings, PublicAiSettings, SaveAiSettingsInput } from '@/types/settings';

const SETTINGS_ID = 'default';

interface AiSettingsRow {
  provider: 'openai-compatible';
  base_url: string;
  api_key: string;
  model: string;
  updated_at: string;
}

function rowToSettings(row: AiSettingsRow): AiSettings {
  return {
    provider: row.provider,
    baseUrl: row.base_url,
    apiKey: row.api_key,
    model: row.model,
    updatedAt: row.updated_at,
  };
}

export function getAiSettings(): AiSettings | null {
  const row = db.prepare('SELECT * FROM ai_settings WHERE id = ?').get(SETTINGS_ID) as AiSettingsRow | undefined;
  return row ? rowToSettings(row) : null;
}

export function getPublicAiSettings(): PublicAiSettings {
  const settings = getAiSettings();
  return {
    provider: 'openai-compatible',
    baseUrl: settings?.baseUrl || '',
    model: settings?.model || '',
    hasApiKey: Boolean(settings?.apiKey),
    updatedAt: settings?.updatedAt || null,
  };
}

export function saveAiSettings(input: SaveAiSettingsInput): PublicAiSettings {
  const existing = getAiSettings();
  const apiKey = input.apiKey !== undefined ? input.apiKey : existing?.apiKey || '';
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO ai_settings (id, provider, base_url, api_key, model, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      provider = excluded.provider,
      base_url = excluded.base_url,
      api_key = excluded.api_key,
      model = excluded.model,
      updated_at = excluded.updated_at
  `).run(
    SETTINGS_ID,
    input.provider || 'openai-compatible',
    input.baseUrl,
    apiKey,
    input.model,
    now
  );

  return getPublicAiSettings();
}
