import './globals.css';
import type { Metadata } from 'next';
import { AppProvider } from '@/components/AppContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import TaskModal from '@/components/TaskModal';
import DocumentUploadModal from '@/components/DocumentUploadModal';

export const metadata: Metadata = {
  title: 'Task & Requirement Management Portal',
  description: 'Enterprise Task & Requirement Management System with AI-powered document extraction and traceability.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        <AppProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                {children}
              </main>
            </div>
          </div>
          <TaskModal />
          <DocumentUploadModal />
        </AppProvider>
      </body>
    </html>
  );
}
