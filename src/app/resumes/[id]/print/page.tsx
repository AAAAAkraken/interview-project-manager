'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { ResumeTemplatePreview } from '@/components/resume/ResumeTemplatePreview';
import type { ResumeDocument } from '@/types/resume';

export default function ResumePrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [resume, setResume] = useState<ResumeDocument | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/resumes/${id}`)
      .then(async res => {
        if (!res.ok) throw new Error('简历未找到');
        const data = await res.json();
        setResume({
          ...data,
          templateId: searchParams.get('template') || data.templateId,
          pageCount: data.pageCount || 1,
        });
      })
      .catch(e => setError(e instanceof Error ? e.message : '加载简历失败'));
  }, [id, searchParams]);

  useEffect(() => {
    if (!resume) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        if ('fonts' in document && document.fonts?.ready) {
          await document.fonts.ready;
        }
        await Promise.all(
          Array.from(document.images).map(image => (
            image.complete
              ? Promise.resolve()
              : new Promise<void>(resolve => {
                  image.addEventListener('load', () => resolve(), { once: true });
                  image.addEventListener('error', () => resolve(), { once: true });
                })
          ))
        );
        if (!cancelled) window.print();
      } catch {
        if (!cancelled) window.print();
      }
    }, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [resume]);

  if (error) return <ErrorState title="加载失败" description={error} />;
  if (!resume) return <LoadingSpinner text="加载 PDF 预览..." />;

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[860px] justify-end gap-3 print:hidden">
        <button className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700" onClick={() => window.print()}>
          打印 / 另存为 PDF
        </button>
        <button className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700" onClick={() => window.close()}>
          关闭
        </button>
      </div>
      <ResumeTemplatePreview resume={resume} print />
    </main>
  );
}
