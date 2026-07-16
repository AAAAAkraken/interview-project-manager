import type { ParsedAIResponse } from '@/types/analysis';

export class ParseError extends Error {
  public userMessage: string;
  public details: string;

  constructor(userMessage: string, details?: string) {
    super(userMessage);
    this.name = 'ParseError';
    this.userMessage = userMessage;
    this.details = details || '';
  }
}

function validateParsedResponse(data: unknown): ParsedAIResponse {
  if (!data || typeof data !== 'object') {
    throw new ParseError('JSON格式错误', '返回的数据不是一个有效的JSON对象');
  }

  const d = data as Record<string, unknown>;

  // Validate overview
  if (!d.overview || typeof d.overview !== 'object') {
    throw new ParseError('缺少 overview 字段', '请确保AI返回的JSON包含 overview 对象');
  }
  const overview = d.overview as Record<string, unknown>;
  if (typeof overview.language !== 'string') {
    throw new ParseError('overview.language 字段缺失或格式错误');
  }
  if (typeof overview.summary !== 'string') {
    throw new ParseError('overview.summary 字段缺失或格式错误');
  }
  if (typeof overview.architecture !== 'string') {
    throw new ParseError('overview.architecture 字段缺失或格式错误');
  }
  if (!overview.directoryStructure || typeof overview.directoryStructure !== 'object') {
    throw new ParseError('overview.directoryStructure 字段缺失或格式错误', 'directoryStructure 应该是一个对象，键为目录名，值为目录说明');
  }

  // Validate techStack
  if (!d.techStack || typeof d.techStack !== 'object') {
    throw new ParseError('缺少 techStack 字段', '请确保AI返回的JSON包含 techStack 对象');
  }
  const techStack = d.techStack as Record<string, unknown>;
  if (!Array.isArray(techStack.frameworks)) {
    throw new ParseError('techStack.frameworks 字段缺失或格式错误', 'frameworks 应该是一个字符串数组');
  }
  if (typeof techStack.database !== 'string') {
    throw new ParseError('techStack.database 字段缺失或格式错误');
  }
  if (!Array.isArray(techStack.keyLibraries)) {
    throw new ParseError('techStack.keyLibraries 字段缺失或格式错误', 'keyLibraries 应该是一个字符串数组');
  }

  // Validate keyFiles
  if (!Array.isArray(d.keyFiles)) {
    throw new ParseError('缺少 keyFiles 字段', 'keyFiles 应该是一个数组');
  }
  if (d.keyFiles.length === 0) {
    throw new ParseError('keyFiles 数组不能为空', '请至少列出 5 个关键文件');
  }
  for (let i = 0; i < d.keyFiles.length; i++) {
    const kf = d.keyFiles[i] as Record<string, unknown>;
    if (typeof kf.filePath !== 'string') {
      throw new ParseError(`keyFiles[${i}].filePath 字段缺失或格式错误`);
    }
    if (typeof kf.role !== 'string') {
      throw new ParseError(`keyFiles[${i}].role 字段缺失或格式错误`);
    }
    if (typeof kf.description !== 'string') {
      throw new ParseError(`keyFiles[${i}].description 字段缺失或格式错误`);
    }
    if (!Array.isArray(kf.keyTechnologies)) {
      throw new ParseError(`keyFiles[${i}].keyTechnologies 字段缺失或格式错误`, 'keyTechnologies 应该是一个字符串数组');
    }
  }

  // Validate interviewQuestions
  if (!Array.isArray(d.interviewQuestions)) {
    throw new ParseError('缺少 interviewQuestions 字段', 'interviewQuestions 应该是一个数组');
  }
  if (d.interviewQuestions.length === 0) {
    throw new ParseError('interviewQuestions 数组不能为空', '请至少生成 5 个面试问题');
  }
  for (let i = 0; i < d.interviewQuestions.length; i++) {
    const q = d.interviewQuestions[i] as Record<string, unknown>;
    if (typeof q.category !== 'string') {
      throw new ParseError(`interviewQuestions[${i}].category 字段缺失或格式错误`);
    }
    if (typeof q.question !== 'string') {
      throw new ParseError(`interviewQuestions[${i}].question 字段缺失或格式错误`);
    }
    if (typeof q.suggestedAnswer !== 'string') {
      throw new ParseError(`interviewQuestions[${i}].suggestedAnswer 字段缺失或格式错误`);
    }
  }

  // Validate resumeHighlights
  if (!Array.isArray(d.resumeHighlights)) {
    throw new ParseError('缺少 resumeHighlights 字段', 'resumeHighlights 应该是一个数组');
  }
  if (d.resumeHighlights.length === 0) {
    throw new ParseError('resumeHighlights 数组不能为空', '请至少生成 3 个简历亮点');
  }
  for (let i = 0; i < d.resumeHighlights.length; i++) {
    const h = d.resumeHighlights[i] as Record<string, unknown>;
    if (typeof h.content !== 'string') {
      throw new ParseError(`resumeHighlights[${i}].content 字段缺失或格式错误`);
    }
  }

  return data as ParsedAIResponse;
}

export function parseAiResponse(rawText: string): ParsedAIResponse {
  let jsonText = rawText.trim();

  if (!jsonText) {
    throw new ParseError('粘贴内容为空', '请从 ChatGPT/Claude 复制完整的分析结果后粘贴到这里');
  }

  // Step 1: Strip markdown code fences if present
  const fencePattern = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
  const fenceMatch = jsonText.match(fencePattern);
  if (fenceMatch) {
    jsonText = fenceMatch[1].trim();
  }

  // Step 2: Try to find JSON object boundaries if extra text exists
  const firstBrace = jsonText.indexOf('{');
  const lastBrace = jsonText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonText = jsonText.slice(firstBrace, lastBrace + 1);
  }

  // Step 3: Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    const errorMsg = (e as Error).message;
    // Try to show where the error is
    throw new ParseError(
      '无法解析JSON格式，请检查粘贴的内容是否完整。错误信息：' + errorMsg,
      `JSON解析失败: ${errorMsg}\n前200字符: ${jsonText.slice(0, 200)}`
    );
  }

  // Step 4: Validate schema
  return validateParsedResponse(parsed);
}
