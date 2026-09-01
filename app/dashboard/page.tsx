'use client';

import { useAuth } from '@/context/AuthContext';
import Dashboard from '@/components/Dashboard';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function DashboardPage() {
  const auth = useAuth();
  const role = auth?.role || 'cashier';

  if (role !== 'manager') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="bg-rose-100 text-rose-600 p-4 rounded-full mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-base font-extrabold text-slate-800">Access Restricted</h1>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
          This section is restricted to managers and owners. Log in as Manager to view metrics.
        </p>
        <Link
          href="/"
          className="bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-700 transition"
        >
          Return to POS Terminal
        </Link>
      </div>
    );
  }

  return <Dashboard />;
}