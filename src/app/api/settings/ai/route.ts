import { NextResponse } from 'next/server';
import * as settingsRepo from '@/lib/repositories/aiSettingsRepository';

export async function GET() {
  try {
    return NextResponse.json(settingsRepo.getPublicAiSettings());
  } catch (error) {
    return NextResponse.json({ error: '获取 AI 设置失败' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const baseUrl = String(body.baseUrl || '').trim();
    const model = String(body.model || '').trim();
    const apiKey = body.apiKey === undefined ? undefined : String(body.apiKey).trim();

    if (!baseUrl) {
      return NextResponse.json({ error: 'Base URL 不能为空' }, { status: 400 });
    }
    if (!model) {
      return NextResponse.json({ error: '模型名称不能为空' }, { status: 400 });
    }

    const settings = settingsRepo.saveAiSettings({
      provider: 'openai-compatible',
      baseUrl: baseUrl.replace(/\/+$/, ''),
      apiKey,
      model,
    });
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: '保存 AI 设置失败' }, { status: 500 });
  }
}
