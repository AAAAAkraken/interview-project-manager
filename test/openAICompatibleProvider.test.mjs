import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildChatCompletionsUrl,
  extractChatCompletionText,
  OpenAICompatibleProvider,
} from '../.test-dist/lib/llm/openAICompatibleProvider.js';

test('builds chat completions URL from root or v1 base URL', () => {
  assert.equal(buildChatCompletionsUrl('https://api.example.com'), 'https://api.example.com/v1/chat/completions');
  assert.equal(buildChatCompletionsUrl('https://api.example.com/v1'), 'https://api.example.com/v1/chat/completions');
  assert.equal(
    buildChatCompletionsUrl('https://api.example.com/v1/chat/completions'),
    'https://api.example.com/v1/chat/completions'
  );
});

test('extracts text from chat completions response', () => {
  const text = extractChatCompletionText({
    choices: [
      {
        message: {
          content: '{"ok":true}',
        },
      },
    ],
  });

  assert.equal(text, '{"ok":true}');
});

test('throws when chat completions response has no text', () => {
  assert.throws(
    () => extractChatCompletionText({ choices: [{ message: {} }] }),
    /没有可用的文本内容/
  );
});

test('reports a friendly timeout error', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => {
      const error = new Error('aborted');
      error.name = 'AbortError';
      reject(error);
    });
  });

  try {
    const provider = new OpenAICompatibleProvider({
      baseUrl: 'https://api.example.com',
      apiKey: 'test-key',
      model: 'test-model',
      timeoutMs: 5,
    });
    await assert.rejects(
      () => provider.generateText('hello'),
      /API 请求超时，请稍后重试/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
