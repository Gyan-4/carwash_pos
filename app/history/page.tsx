'use client';

import { Clock } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="h-full w-full p-6 space-y-6 overflow-y-auto bg-slate-50/60 font-sans select-none">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-black text-slate-900">Transactions & History</h1>
        <p className="mt-0.5 text-xs text-slate-500">Review completed sales and system activity once real records are available.</p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <Clock className="mx-auto h-9 w-9 text-slate-300" />
        <h2 className="mt-3 text-sm font-black text-slate-800">No transaction history</h2>
        <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">Completed POS transactions and audit activity will appear here after they are stored in the database.</p>
      </div>
    </div>
  );
}
