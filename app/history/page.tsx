'use client';

import { useState } from 'react';
import { Clock, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

interface AuditLog {
  id: string;
  time: string;
  user: string;
  action: string;
  details: string;
}

const AUDIT_LOGS: AuditLog[] = [
  {
    id: 'a-1',
    time: '10:45 AM',
    user: 'Mark (Cashier)',
    action: 'Processed Order #TX-1001',
    details: 'FAB 7365 • Package 3 (₱550.00)'
  },
  {
    id: 'a-2',
    time: '09:30 AM',
    user: 'Mr. DM (Manager)',
    action: 'Applied Promo Discount',
    details: 'MC-4521 • 20% Rider Discount applied'
  }
];

export default function HistoryPage() {
  return (
    <div className="h-full w-full p-6 space-y-6 overflow-y-auto bg-slate-50/60 font-sans select-none">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-lg font-black text-slate-900">System History & Audit Trails</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review completed orders and terminal activity logs.
          </p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Audit Log Stream</h2>
        
        <div className="divide-y divide-slate-100">
          {AUDIT_LOGS.map((log) => (
            <div key={log.id} className="py-3 flex justify-between items-center text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-800">{log.action}</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{log.details}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-700 block">{log.user}</span>
                <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}