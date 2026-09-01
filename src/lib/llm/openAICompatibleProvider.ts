export interface OpenAICompatibleConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs?: number;
}

export interface LlmProvider {
  generateText(prompt: string): Promise<string>;
}

export function buildChatCompletionsUrl(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/+$/, '');
  if (normalized.endsWith('/chat/completions')) return normalized;
  if (normalized.endsWith('/v1')) return `${normalized}/chat/completions`;
  return `${normalized}/v1/chat/completions`;
}

export function extractChatCompletionText(data: unknown): string {
  const root = data as {
    choices?: Array<{
      message?: { content?: unknown };
      text?: unknown;
    }>;
  };

  const content = root?.choices?.[0]?.message?.content ?? root?.choices?.[0]?.text;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('API 响应中没有可用的文本内容');
  }
  return content;
}

export class OpenAICompatibleProvider implements LlmProvider {
  constructor(private readonly config: OpenAICompatibleConfig) {}

  async generateText(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs || 300_000);

    try {
      const res = await fetch(buildChatCompletionsUrl(this.config.baseUrl), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: '你是严格输出 JSON 的代码分析助手。不要输出 markdown 或解释文字。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      const text = await res.text();
      let data: unknown = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const message = typeof data === 'object' && data && 'error' in data
          ? JSON.stringify((data as { error: unknown }).error)
          : text;
        throw new Error(`API 请求失败 (${res.status}): ${message || res.statusText}`);
      }

      return extractChatCompletionText(data);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('API 请求超时，请稍后重试；如果项目较大，可以减少代码文件后再分析');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
