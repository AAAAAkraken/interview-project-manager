import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: '面试项目管理系统',
  description: '面试项目管理系统 — 面试准备利器',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
