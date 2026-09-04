'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Printer, RotateCcw, Search, Trash2, X, XCircle, ShieldAlert, RefreshCw } from 'lucide-react';

type Transaction = {
  _id: string; transactionNo: string; customerName?: string; plate: string; vehicleType: string; vehicleSize?: string;
  services: { name: string; price: number }[]; subtotal: number; discount: number; total: number;
  paymentMethod?: 'cash' | 'gcash' | 'card'; amountPaid?: number; change?: number;
  status: 'completed' | 'voided' | 'deleted'; createdAt: string;
};
type AuditLog = { _id:string; userName:string; role:string; action:string; transactionNo?:string; reason:string; previousStatus?:string; newStatus?:string; createdAt:string };

const money = (value: number) => `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all'|'completed'|'voided'>('all');
  const [payment, setPayment] = useState<'all'|'cash'|'gcash'|'card'>('all');
  const [selected, setSelected] = useState<Transaction | null>(null);

  async function load(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      const [txRes, meRes, auditRes] = await Promise.all([
        fetch('/api/transactions', { cache: 'no-store' }), fetch('/api/auth/me', { cache: 'no-store' }), fetch('/api/audit', { cache: 'no-store' })
      ]);
      const txData = await txRes.json(); const meData = await meRes.json(); const auditData = await auditRes.json();
      if (!txRes.ok) throw new Error(txData.error || 'Unable to load transactions.');
      setTransactions(txData.transactions || []); setIsManager(meData.user?.role === 'manager'); if (auditRes.ok) setLogs(auditData.logs || []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load transaction history.'); }
    finally { if (showLoading) setLoading(false); }
  }

  useEffect(() => { load(); const interval = window.setInterval(() => load(false), 5000); const onVisible = () => document.visibilityState === 'visible' && load(false); document.addEventListener('visibilitychange', onVisible); return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); }; }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter(tx => {
      const matchesQuery = !q || [tx.transactionNo, tx.customerName || '', tx.plate, ...(tx.services || []).map(s => s.name)].join(' ').toLowerCase().includes(q);
      return matchesQuery && (status === 'all' || tx.status === status) && (payment === 'all' || (tx.paymentMethod || 'cash') === payment);
    });
  }, [transactions, query, status, payment]);

  const printReceipt = (tx: Transaction) => {
    const rows = (tx.services || []).map(s => `<tr><td>${escapeHtml(s.name)}</td><td class="right">${money(s.price)}</td></tr>`).join('');
    const html = `<!doctype html><html><head><title>${escapeHtml(tx.transactionNo)}</title><style>body{font-family:Arial,sans-serif;width:300px;margin:20px auto;color:#111;font-size:12px}h2{text-align:center;margin:0 0 4px}.center{text-align:center}.muted{color:#666}table{width:100%;border-collapse:collapse;margin:12px 0}td{padding:4px 0;border-bottom:1px dashed #ddd}.right{text-align:right}.total{font-size:16px;font-weight:800;border-top:1px solid #111;padding-top:8px}</style></head><body><h2>CARWASH RECEIPT</h2><p class="center">${escapeHtml(tx.transactionNo)}</p><p class="muted">${new Date(tx.createdAt).toLocaleString('en-PH')}</p><p>Customer: ${escapeHtml(tx.customerName || 'Walk-in Customer')}</p><p>Plate: <b>${escapeHtml(tx.plate)}</b></p><p>Vehicle: ${escapeHtml(tx.vehicleType)}${tx.vehicleSize ? ` • ${escapeHtml(tx.vehicleSize)}` : ''}</p><table>${rows}</table><p>Subtotal: <span class="right">${money(tx.subtotal)}</span></p><p>Discount: <span class="right">${money(tx.discount)}</span></p><p class="total">TOTAL <span class="right">${money(tx.total)}</span></p><p>Payment: <span class="right">${escapeHtml((tx.paymentMethod || 'cash').toUpperCase())}</span></p><p>Paid: <span class="right">${money(tx.amountPaid || 0)}</span></p><p>Change: <span class="right">${money(tx.change || 0)}</span></p><p class="center" style="margin-top:20px">Thank you!</p><script>window.onload=()=>window.print()</script></body></html>`;
    const win = window.open('', '_blank', 'width=420,height=700');
    if (!win) { setError('Please allow pop-ups to print receipts.'); return; }
    win.document.write(html); win.document.close();
  };

  async function action(id: string, actionName: 'void'|'restore'|'delete') {
    const labels = { void:'void', restore:'restore', delete:'permanently delete' };
    const reason = window.prompt(`Reason to ${labels[actionName]} this transaction:`)?.trim();
    if (!reason) return;
    if (actionName === 'delete' && !window.confirm('This permanently marks the transaction as deleted. Continue?')) return;
    setBusy(id); setError('');
    try {
      const response = await fetch(`/api/transactions/${id}/action`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:actionName, reason }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Action failed.'); await load(false); if (selected?._id === id) setSelected(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Action failed.'); } finally { setBusy(null); }
  }

  const completedTotal = filtered.filter(t => t.status === 'completed').reduce((n,t) => n + Number(t.total || 0), 0);

  return <div className="h-full w-full overflow-y-auto bg-slate-50/60 p-6 font-sans"><div className="mx-auto max-w-7xl space-y-5">
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-lg font-black text-slate-900">Transactions & History</h1><p className="mt-0.5 text-xs text-slate-500">Review sales, reprint receipts, and manage transaction corrections.</p></div><div className="flex gap-2"><button onClick={() => load()} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50" title="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button><div className="relative w-full lg:w-72"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search transaction, customer, plate..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"/></div></div></div></div>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{error}</div>}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-bold uppercase text-slate-400">Shown</p><p className="mt-1 text-xl font-black text-slate-900">{filtered.length}</p></div><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-bold uppercase text-slate-400">Completed</p><p className="mt-1 text-xl font-black text-slate-900">{filtered.filter(t=>t.status==='completed').length}</p></div><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-bold uppercase text-slate-400">Voided</p><p className="mt-1 text-xl font-black text-slate-900">{filtered.filter(t=>t.status==='voided').length}</p></div><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-bold uppercase text-slate-400">Completed sales</p><p className="mt-1 text-xl font-black text-blue-700">{money(completedTotal)}</p></div></div>
    <div className="flex flex-wrap gap-2"><select value={status} onChange={e=>setStatus(e.target.value as any)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"><option value="all">All statuses</option><option value="completed">Completed</option><option value="voided">Voided</option></select><select value={payment} onChange={e=>setPayment(e.target.value as any)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"><option value="all">All payments</option><option value="cash">Cash</option><option value="gcash">GCash</option><option value="card">Card</option></select></div>
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-4"><h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Sales history</h2>{isManager&&<span className="flex items-center gap-1 text-[10px] font-bold text-blue-600"><ShieldAlert className="h-3.5 w-3.5"/> Manager controls enabled</span>}</div>{loading?<div className="p-10 text-center text-xs text-slate-400">Loading...</div>:filtered.length===0?<div className="p-10 text-center text-xs text-slate-400">No transactions match your filters.</div>:<div className="divide-y divide-slate-100">{filtered.map(tx=><div key={tx._id} className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-black text-slate-800">{tx.transactionNo}</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${tx.status==='completed'?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}`}>{tx.status}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-500">{tx.paymentMethod || 'cash'}</span></div><p className="mt-1 text-[11px] font-medium text-slate-700">{tx.customerName || 'Walk-in Customer'} · {tx.plate}</p><p className="mt-1 text-[10px] text-slate-400">{tx.vehicleType}{tx.vehicleSize ? ` · ${tx.vehicleSize}` : ''} · {(tx.services||[]).map(s=>s.name).join(', ')}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleString('en-PH')}</p></div><div className="flex items-center justify-between gap-3 xl:justify-end"><span className="font-mono text-sm font-black text-slate-900">{money(tx.total)}</span><div className="flex gap-1"><button onClick={()=>setSelected(tx)} title="View details" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><Eye className="h-4 w-4"/></button><button onClick={()=>printReceipt(tx)} title="Reprint receipt" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><Printer className="h-4 w-4"/></button>{isManager&&<>{tx.status==='completed'&&<button disabled={busy===tx._id} onClick={()=>action(tx._id,'void')} title="Void" className="rounded-lg border border-amber-200 p-2 text-amber-600 hover:bg-amber-50 disabled:opacity-50"><XCircle className="h-4 w-4"/></button>}{tx.status==='voided'&&<button disabled={busy===tx._id} onClick={()=>action(tx._id,'restore')} title="Restore" className="rounded-lg border border-emerald-200 p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"><RotateCcw className="h-4 w-4"/></button>}{tx.status!=='deleted'&&<button disabled={busy===tx._id} onClick={()=>action(tx._id,'delete')} title="Delete" className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4"/></button>}</>}</div></div></div>)}</div>}</section>
    {isManager&&<section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Audit Log</h2></div>{logs.length===0?<div className="p-8 text-center text-xs text-slate-400">No audit activity yet.</div>:<div className="divide-y divide-slate-100">{logs.map(log=><div key={log._id} className="flex flex-col gap-2 p-4 md:flex-row md:justify-between"><div><div className="text-xs font-black text-slate-800">{log.action.replaceAll('_',' ')} · {log.transactionNo||'—'}</div><div className="mt-1 text-[11px] text-slate-500">{log.reason}</div><div className="mt-1 text-[10px] text-slate-400">{log.userName} ({log.role}) · {log.previousStatus||'—'} → {log.newStatus||'—'}</div></div><span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString('en-PH')}</span></div>)}</div>}</section>}
    {selected&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"><div className="flex items-start justify-between"><div><h2 className="text-sm font-black text-slate-900">{selected.transactionNo}</h2><p className="mt-1 text-[10px] text-slate-500">{new Date(selected.createdAt).toLocaleString('en-PH')}</p></div><button onClick={()=>setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><X className="h-4 w-4"/></button></div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><span className="text-[10px] text-slate-400">Customer</span><p className="font-bold text-slate-800">{selected.customerName||'Walk-in Customer'}</p></div><div><span className="text-[10px] text-slate-400">Plate</span><p className="font-bold uppercase text-slate-800">{selected.plate}</p></div><div><span className="text-[10px] text-slate-400">Vehicle</span><p className="font-bold capitalize text-slate-800">{selected.vehicleType}{selected.vehicleSize?` · ${selected.vehicleSize}`:''}</p></div><div><span className="text-[10px] text-slate-400">Status</span><p className="font-bold capitalize text-slate-800">{selected.status}</p></div></div><div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">{selected.services.map((s,i)=><div key={`${s.name}-${i}`} className="flex justify-between p-3 text-xs"><span className="font-medium text-slate-700">{s.name}</span><span className="font-mono font-bold">{money(s.price)}</span></div>)}</div><div className="mt-4 space-y-1 text-xs"><p className="flex justify-between"><span className="text-slate-500">Subtotal</span><b>{money(selected.subtotal)}</b></p><p className="flex justify-between"><span className="text-slate-500">Discount</span><b>{money(selected.discount)}</b></p><p className="flex justify-between border-t border-slate-200 pt-2 text-sm"><span className="font-black">Total</span><b className="text-blue-700">{money(selected.total)}</b></p><p className="flex justify-between"><span className="text-slate-500">Payment</span><b className="uppercase">{selected.paymentMethod||'cash'}</b></p><p className="flex justify-between"><span className="text-slate-500">Paid</span><b>{money(selected.amountPaid||0)}</b></p><p className="flex justify-between"><span className="text-slate-500">Change</span><b>{money(selected.change||0)}</b></p></div><button onClick={()=>printReceipt(selected)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white hover:bg-blue-700"><Printer className="h-4 w-4"/> Reprint Receipt</button></div></div>}
  </div></div>;
}

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char] || char)); }
