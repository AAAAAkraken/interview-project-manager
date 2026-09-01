'use client';

import Link from 'next/link';
import { ResumeImportWizard } from '@/components/resume/ResumeImportWizard';

export default function ResumeImportPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/resumes" className="text-sm text-gray-500 hover:text-gray-700 no-underline">
          返回简历列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">导入 Word 简历</h1>
        <p className="text-sm text-gray-500 mt-1">先上传 Word，再按预览内容填写模块并框选归类。</p>
      </div>

      <ResumeImportWizard />
    </div>
  );
}
