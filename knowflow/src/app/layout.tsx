import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/layout/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'KnowFlow — AI 知识助手',
  description: '极低门槛的知识管理工具，AI 自动整理、关联、提炼',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KnowFlow',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" className="h-full antialiased">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className={`min-h-full flex flex-col ${inter.className}`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
