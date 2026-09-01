'use client';

import { usePathname } from 'next/navigation';
import { isResumePrintRoute } from '@/lib/layout/printRoute';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isResumePrintRoute(pathname)) {
    return (
      <main className="min-h-screen bg-white p-0">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
