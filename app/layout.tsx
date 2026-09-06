'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import LoginScreen from '@/components/LoginScreen';

const inter = Inter({ subsets: ['latin'] });

function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="w-screen h-screen bg-slate-900" />;
  if (!user) return <LoginScreen />;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <main className="min-w-0 min-h-0 flex-1 h-full overflow-y-auto overflow-x-hidden overscroll-contain bg-slate-100">
        {children}
      </main>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-100 antialiased overflow-hidden`}>
        <AuthProvider>
          <MainLayout>{children}</MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
