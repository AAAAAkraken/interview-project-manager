'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StepIndicator } from '@/components/import/StepIndicator';
import { Step1GeneratePrompt } from '@/components/import/Step1GeneratePrompt';
import { Step2PasteResponse } from '@/components/import/Step2PasteResponse';
import { Step3PreviewConfirm } from '@/components/import/Step3PreviewConfirm';

const STEPS = ['生成提示词', '粘贴AI回复', '预览确认'];

export default function ImportWizardPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [step, setStep] = useState(0);
  const [rawResponse, setRawResponse] = useState('');

  return (
    <div>
      {/* Back link */}
      <Link href={`/project/${projectId}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 no-underline">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回项目
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">导入 AI 分析</h1>
      <p className="text-sm text-gray-500 mb-8">使用 AI 分析项目代码，导入面试档案</p>

      <StepIndicator currentStep={step} steps={STEPS} />

      <div className="max-w-3xl">
        {step === 0 && (
          <Step1GeneratePrompt projectId={projectId} onNext={() => setStep(1)} />
        )}
        {step === 1 && (
          <Step2PasteResponse
            onBack={() => setStep(0)}
            onNext={(text) => { setRawResponse(text); setStep(2); }}
          />
        )}
        {step === 2 && (
          <Step3PreviewConfirm
            projectId={projectId}
            rawResponse={rawResponse}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </div>
  );
}
