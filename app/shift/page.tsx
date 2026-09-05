'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Banknote, ArrowDownToLine, ArrowUpFromLine, Clock3, RefreshCw, LockKeyhole, UnlockKeyhole } from 'lucide-react';

const peso = (n: number) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateTime = (value: string) => new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

type Shift = {
  _id: string; cashierId: string; cashierName: string; openedAt: string; openingCash: number; cashIn: number; cashOut: number;
  closedAt?: string; actualCash?: number; expectedCash?: number; variance?: number; status: 'open' | 'closed'; closingNote?: string;
  summary?: { cashSales: number; gcashSales: number; cardSales: number; sales: number; transactions: number };
};

type Modal = 'open' | 'cash-in' | 'cash-out' | 'close' | null;

export default function ShiftPage() {
  const [active, setActive] = useState<Shift | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/shifts', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load shifts.');
      setActive(data.active || null); setShifts(data.shifts || []); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load shifts.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const timer = window.setInterval(load, 5000); return () => window.clearInterval(timer); }, [load]);
  const expected = useMemo(() => Number(active?.expectedCash || 0), [active]);
  const openModal = (next: Modal) => { setAmount(''); setReason(''); setError(''); setModal(next); };

  async function submit() {
    if (saving || !modal) return;
    setSaving(true); setError('');
    try {
      const payload: Record<string, unknown> = { action: modal };
      if (modal === 'open') payload.openingCash = Number(amount);
      if (modal === 'cash-in' || modal === 'cash-out') { payload.shiftId = active?._id; payload.amount = Number(amount); payload.reason = reason.trim(); }
      if (modal === 'close') { payload.shiftId = active?._id; payload.actualCash = Number(amount); payload.closingNote = reason.trim(); }
      const response = await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update shift.');
      setModal(null); setMessage(modal === 'open' ? 'Shift opened successfully.' : modal === 'close' ? 'Shift closed successfully.' : 'Cash movement recorded.'); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update shift.'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="h-full p-6 text-sm font-semibold text-slate-500">Loading shift...</div>;

  return (
    <div className="h-full overflow-y-auto bg-slate-50/60 p-6 text-slate-900 font-sans"><div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Cashier Operations</p><h1 className="mt-1 text-xl font-black text-slate-950">Cashier Shift</h1><p className="mt-1 text-xs text-slate-500">Track opening cash, cash movements, sales, and end-of-shift variance.</p></div><button onClick={load} className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button></div>
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">{message}</div>}
      {error && !modal && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{error}</div>}
      {!active ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm"><UnlockKeyhole className="mx-auto h-10 w-10 text-blue-600" /><h2 className="mt-3 text-base font-black text-slate-950">No open shift</h2><p className="mx-auto mt-1 max-w-md text-xs text-slate-500">Open a shift and enter the physical cash currently in the drawer before processing sales.</p><button onClick={() => openModal('open')} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">Open Shift</button></div> : <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat icon={Banknote} label="Opening Cash" value={peso(active.openingCash)} /><Stat icon={ArrowDownToLine} label="Cash In" value={peso(active.cashIn)} /><Stat icon={ArrowUpFromLine} label="Cash Out" value={peso(active.cashOut)} /><Stat icon={Clock3} label="Expected Drawer" value={peso(expected)} /></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><h2 className="text-sm font-black">Shift Open</h2></div><p className="mt-1 text-xs text-slate-500">{active.cashierName} · opened {dateTime(active.openedAt)}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => openModal('cash-in')} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Cash In</button><button onClick={() => openModal('cash-out')} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">Cash Out</button><button onClick={() => openModal('close')} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white"><LockKeyhole className="mr-1 inline h-3.5 w-3.5" />Close Shift</button></div></div><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5"><Metric label="Transactions" value={String(active.summary?.transactions || 0)} /><Metric label="Total Sales" value={peso(active.summary?.sales || 0)} /><Metric label="Cash Sales" value={peso(active.summary?.cashSales || 0)} /><Metric label="GCash" value={peso(active.summary?.gcashSales || 0)} /><Metric label="Card" value={peso(active.summary?.cardSales || 0)} /></div></div>
      </>}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><h2 className="text-sm font-black">Shift History</h2><p className="mt-1 text-xs text-slate-500">Previous cashier sessions and final cash variance.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Cashier</th><th className="px-5 py-3">Opened</th><th className="px-5 py-3">Opening</th><th className="px-5 py-3">Expected</th><th className="px-5 py-3">Actual</th><th className="px-5 py-3">Variance</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{shifts.map((shift) => <tr key={shift._id} className="border-t border-slate-100"><td className="px-5 py-3 font-bold">{shift.cashierName}</td><td className="px-5 py-3 text-slate-500">{dateTime(shift.openedAt)}</td><td className="px-5 py-3 font-mono">{peso(shift.openingCash)}</td><td className="px-5 py-3 font-mono">{shift.expectedCash == null ? '—' : peso(shift.expectedCash)}</td><td className="px-5 py-3 font-mono">{shift.actualCash == null ? '—' : peso(shift.actualCash)}</td><td className={`px-5 py-3 font-mono font-black ${(shift.variance || 0) < 0 ? 'text-rose-600' : (shift.variance || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{shift.variance == null ? '—' : peso(shift.variance)}</td><td className="px-5 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-black ${shift.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{shift.status}</span></td></tr>)}</tbody></table>{shifts.length === 0 && <div className="p-8 text-center text-xs text-slate-500">No shift records yet.</div>}</div></div>
    </div>
    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><h3 className="text-base font-black text-slate-950">{modal === 'open' ? 'Open Shift' : modal === 'close' ? 'Close Shift' : modal === 'cash-in' ? 'Cash In' : 'Cash Out'}</h3><p className="mt-1 text-xs text-slate-500">{modal === 'open' ? 'Count the physical opening cash in the drawer.' : modal === 'close' ? `Expected drawer cash: ${peso(expected)}. Enter the physical count.` : 'Record a cash movement with a reason.'}</p><label className="mt-5 block text-[10px] font-black uppercase tracking-wider text-slate-500">{modal === 'close' ? 'Actual Cash' : modal === 'open' ? 'Opening Cash' : 'Amount'}</label><input autoFocus type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />{modal !== 'open' && <><label className="mt-4 block text-[10px] font-black uppercase tracking-wider text-slate-500">{modal === 'close' ? 'Closing Note (optional)' : 'Reason'}</label><textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 min-h-20 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder={modal === 'close' ? 'Optional note about the closing count' : 'e.g. Change fund replenishment'} />{error && <p className="mt-3 text-xs font-bold text-rose-600">{error}</p>}</>}<div className="mt-5 flex justify-end gap-2"><button onClick={() => setModal(null)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700">Cancel</button><button disabled={saving || !amount || (modal !== 'open' && modal !== 'close' && !reason.trim())} onClick={submit} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">{saving ? 'Saving...' : modal === 'open' ? 'Open Shift' : modal === 'close' ? 'Close Shift' : 'Record Movement'}</button></div></div></div>}
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><Icon className="h-4 w-4 text-blue-600" /><p className="mt-3 text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-lg font-black text-slate-950">{value}</p></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-slate-900">{value}</p></div>; }
