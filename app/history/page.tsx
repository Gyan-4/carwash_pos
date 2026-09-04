'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, RotateCcw, Trash2, XCircle, ShieldAlert } from 'lucide-react';

type Transaction = {
  _id: string;
  transactionNo: string;
  plate: string;
  vehicleType: string;
  services: { name: string; price: number }[];
  total: number;
  status: 'completed' | 'voided' | 'deleted';
  createdAt: string;
};

type AuditLog = {
  _id: string;
  userName: string;
  role: string;
  action: string;
  transactionNo?: string;
  reason: string;
  previousStatus?: string;
  newStatus?: string;
  createdAt: string;
};

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [txRes, meRes, auditRes] = await Promise.all([fetch('/api/transactions'), fetch('/api/auth/me'), fetch('/api/audit')]);
      const txData = await txRes.json();
      const meData = await meRes.json();
      const auditData = await auditRes.json();
      if (txRes.ok) setTransactions(txData.transactions || []);
      setIsManager(meData.user?.role === 'manager');
      if (auditRes.ok) setLogs(auditData.logs || []);
    } catch {
      setError('Unable to load transaction history.');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function action(id: string, actionName: 'void' | 'restore' | 'delete') {
    const labels = { void: 'void', restore: 'restore', delete: 'permanently delete' };
    const reason = window.prompt(`Reason to ${labels[actionName]} this transaction:`)?.trim();
    if (!reason) return;
    if (actionName === 'delete' && !window.confirm('This permanently marks the transaction as deleted. Continue?')) return;
    setBusy(id);
    setError('');
    try {
      const response = await fetch(`/api/transactions/${id}/action`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: actionName, reason }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Action failed.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Action failed.'); }
    finally { setBusy(null); }
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/60 p-6 font-sans">
      <div className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-black text-slate-900">Transactions & History</h1>
        <p className="mt-0.5 text-xs text-slate-500">Review real POS transactions. Manager actions are recorded in the audit trail.</p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{error}</div>}

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-4"><h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Transactions</h2>{isManager && <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600"><ShieldAlert className="w-3.5 h-3.5" /> Manager controls enabled</span>}</div>
        {loading ? <div className="p-10 text-center text-xs text-slate-400">Loading...</div> : transactions.length === 0 ? <div className="p-10 text-center text-xs text-slate-400">No transactions yet.</div> : <div className="divide-y divide-slate-100">
          {transactions.map((tx) => <div key={tx._id} className="p-4 flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
            <div className="min-w-0"><div className="flex items-center gap-2"><span className="font-mono text-xs font-black text-slate-800">{tx.transactionNo}</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${tx.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : tx.status === 'voided' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{tx.status}</span></div><p className="mt-1 text-[11px] text-slate-500">{tx.plate} · {tx.vehicleType} · {tx.services.map((s) => s.name).join(', ')}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleString()}</p></div>
            <div className="flex items-center gap-3"><span className="font-mono text-sm font-black text-slate-900">₱{Number(tx.total).toFixed(2)}</span>{isManager && <div className="flex gap-1">{tx.status === 'completed' && <button disabled={busy === tx._id} onClick={() => action(tx._id, 'void')} title="Void" className="rounded-lg border border-amber-200 p-2 text-amber-600 hover:bg-amber-50 disabled:opacity-50"><XCircle className="w-4 h-4" /></button>}{tx.status === 'voided' && <button disabled={busy === tx._id} onClick={() => action(tx._id, 'restore')} title="Restore" className="rounded-lg border border-emerald-200 p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"><RotateCcw className="w-4 h-4" /></button>}{tx.status !== 'deleted' && <button disabled={busy === tx._id} onClick={() => action(tx._id, 'delete')} title="Delete" className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>}</div>}</div>
          </div>)}
        </div>}
      </section>

      {isManager && <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden"><div className="border-b border-slate-100 p-4"><h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Audit Log</h2></div>{logs.length === 0 ? <div className="p-8 text-center text-xs text-slate-400">No audit activity yet.</div> : <div className="divide-y divide-slate-100">{logs.map((log) => <div key={log._id} className="p-4 flex flex-col md:flex-row md:justify-between gap-2"><div><div className="text-xs font-black text-slate-800">{log.action.replaceAll('_', ' ')} · {log.transactionNo || '—'}</div><div className="mt-1 text-[11px] text-slate-500">{log.reason}</div><div className="mt-1 text-[10px] text-slate-400">{log.userName} ({log.role}) · {log.previousStatus || '—'} → {log.newStatus || '—'}</div></div><span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span></div>)}</div>}</section>}
    </div>
  );
}
