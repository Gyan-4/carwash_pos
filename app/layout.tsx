'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import LoginScreen from '@/components/LoginScreen';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [checkingShift, setCheckingShift] = useState(false);

  useEffect(() => {
    if (loading || !user || user.role !== 'cashier' || pathname === '/shift') {
      setCheckingShift(false);
      return;
    }

    let cancelled = false;
    const checkShift = async () => {
      setCheckingShift(true);
      try {
        const response = await fetch('/api/shifts', { cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        if (!cancelled && response.ok && !data.active) router.replace('/shift');
      } catch {
        // Do not block access when the shift status check itself fails.
      } finally {
        if (!cancelled) setCheckingShift(false);
      }
    };

    checkShift();
    return () => { cancelled = true; };
  }, [loading, user, pathname, router]);

  useEffect(() => {
    if (loading || !user) return;

    let cleanup: (() => void) | undefined;
    const frame = window.requestAnimationFrame(() => {
      const main = document.querySelector('main');
      if (!main) return;

      const heading = main.querySelector('h1');
      if (!heading) return;

      let candidate = heading.closest('header') as HTMLElement | null;

      if (!candidate) {
        let node = heading.parentElement as HTMLElement | null;
        while (node && node !== main) {
          const classes = typeof node.className === 'string' ? node.className : '';
          const rect = node.getBoundingClientRect();
          const looksLikeCard = classes.includes('rounded-2xl') && (classes.includes('bg-white') || classes.includes('border'));
          if (looksLikeCard && rect.height <= 230 && rect.width >= main.clientWidth * 0.5) {
            candidate = node;
            break;
          }
          node = node.parentElement as HTMLElement | null;
        }
      }

      if (!candidate) return;

      const previousClassName = candidate.className;
      candidate.classList.add('sticky', 'top-0', 'z-30', 'bg-slate-50/95', 'backdrop-blur-md');
      cleanup = () => { candidate!.className = previousClassName; };
    });

    return () => {
      window.cancelAnimationFrame(frame);
      cleanup?.();
    };
  }, [loading, user, pathname]);

  if (loading) return <div className="w-screen h-screen bg-slate-900" />;
  if (!user) return <LoginScreen />;

  if (checkingShift && user.role === 'cashier' && pathname !== '/shift') {
    return (
      <div className="w-screen h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white px-6 py-7 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-sm font-black text-slate-900">Checking cashier shift...</p>
          <p className="mt-1 text-xs text-slate-500">Checking whether your drawer is ready.</p>
        </div>
      </div>
    );
  }

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
