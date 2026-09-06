'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Banknote, Clock3, LockKeyhole, RefreshCw, UnlockKeyhole, WalletCards } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const peso = (n: number) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateTime = (value: string) => new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

type Shift = {
  _id: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  openingCash: number;
  cashIn: number;
  cashOut: number;
  closedAt?: string;
  actualCash?: number;
  expectedCash?: number;
  variance?: number;
  status: 'open' | 'closed';
  closingNote?: string;
  summary?: { cashSales: number; gcashSales: number; cardSales: number; sales: number; transactions: number };
};

type Modal = 'open' | 'cash-in' | 'cash-out' | 'close' | null;

type PaymentTone = 'cash' | 'gcash' | 'card' | 'total';

function paymentStyle(type: PaymentTone) {
  return {
    cash: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    gcash: 'border-sky-200 bg-sky-50 text-sky-800',
    card: 'border-violet-200 bg-violet-50 text-violet-800',
    total: 'border-slate-200 bg-slate-950 text-white',
  }[type];
}

export default function ShiftPage() {
  const auth = useAuth();
  const role = auth?.role || 'cashier';
  const isManager = role === 'manager';

  const [active, setActive] = useState<Shift | null>(null);
  const [activeShifts, setActiveShifts] = useState<Shift[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
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
      setActive(data.active || null);
      setActiveShifts(data.activeShifts || []);
      setShifts(data.shifts || []);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load shifts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  const openModal = (next: Modal, shift?: Shift | null) => {
    setAmount('');
    setReason('');
    setError('');
    setSelectedShift(shift || active);
    setModal(next);
  };

  const targetShift = selectedShift || active;
  const targetExpected = Number(targetShift?.expectedCash || 0);

  async function submit() {
    if (saving || !modal) return;
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = { action: modal };
      if (modal === 'open') payload.openingCash = Number(amount);
      if (modal === 'cash-in' || modal === 'cash-out') {
        payload.shiftId = targetShift?._id;
        payload.amount = Number(amount);
        payload.reason = reason.trim();
      }
      if (modal === 'close') {
        payload.shiftId = targetShift?._id;
        payload.actualCash = Number(amount);
        payload.closingNote = reason.trim();
      }

      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update shift.');

      setModal(null);
      setSelectedShift(null);
      setMessage(
        modal === 'open'
          ? 'Shift opened successfully.'
          : modal === 'close'
            ? `${targetShift?.cashierName || 'Cashier'} shift closed successfully.`
            : 'Cash movement recorded.',
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update shift.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="h-full p-6 text-sm font-semibold text-slate-500">Loading shift...</div>;

  return (
    <>
      <div className="h-full overflow-y-auto bg-slate-50/60 p-6 font-sans text-slate-900">
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">{isManager ? 'Manager Operations' : 'Cashier Operations'}</p>
              <h1 className="mt-1 text-xl font-black text-slate-950">Cashier Shift</h1>
              <p className="mt-1 text-xs text-slate-500">
                {isManager ? 'Monitor every cashier shift, cash position, payment mix, and closing variance.' : 'Track your opening cash, cash movements, sales, and end-of-shift variance.'}
              </p>
            </div>
            <button onClick={load} className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">{message}</div>}
          {error && !modal && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{error}</div>}

          {isManager ? (
            <>
              <section className="space-y-3">
                <div className="flex items-end justify-between">
                  <div><h2 className="text-sm font-black">Active Cashier Shifts</h2><p className="mt-1 text-xs text-slate-500">Each open drawer is shown separately.</p></div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">{activeShifts.length} OPEN</span>
                </div>

                {activeShifts.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <WalletCards className="mx-auto h-9 w-9 text-slate-300" />
                    <p className="mt-3 text-sm font-black text-slate-900">No cashier shift is open</p>
                    <p className="mt-1 text-xs text-slate-500">A cashier must open a shift before the terminal can process sales.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {activeShifts.map((shift) => <ShiftCard key={shift._id} shift={shift} manager onCashIn={() => openModal('cash-in', shift)} onCashOut={() => openModal('cash-out', shift)} onClose={() => openModal('close', shift)} />)}
                  </div>
                )}
              </section>
            </>
          ) : active ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat icon={Banknote} label="Opening Cash" value={peso(active.openingCash)} />
                <Stat icon={ArrowDownToLine} label="Cash In" value={peso(active.cashIn)} />
                <Stat icon={ArrowUpFromLine} label="Cash Out" value={peso(active.cashOut)} />
                <Stat icon={Clock3} label="Expected Drawer" value={peso(Number(active.expectedCash || 0))} />
              </div>
              <ShiftCard shift={active} onCashIn={() => openModal('cash-in', active)} onCashOut={() => openModal('cash-out', active)} onClose={() => openModal('close', active)} />
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <UnlockKeyhole className="mx-auto h-10 w-10 text-blue-600" />
              <h2 className="mt-3 text-base font-black text-slate-950">No open shift</h2>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">Open your shift and enter the physical cash currently in the drawer before processing sales.</p>
              <button onClick={() => openModal('open')} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">Open Shift</button>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-sm font-black">Shift History</h2>
              <p className="mt-1 text-xs text-slate-500">{isManager ? 'All cashier sessions and their final cash variance.' : 'Your previous sessions and final cash variance.'}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <tr><th className="px-5 py-3">Cashier</th><th className="px-5 py-3">Opened</th><th className="px-5 py-3">Opening</th><th className="px-5 py-3">Total Sales</th><th className="px-5 py-3">Payment Mix</th><th className="px-5 py-3">Expected</th><th className="px-5 py-3">Actual</th><th className="px-5 py-3">Variance</th><th className="px-5 py-3">Status</th></tr>
                </thead>
                <tbody>
                  {shifts.map((shift) => <tr key={shift._id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-bold">{shift.cashierName}</td>
                    <td className="px-5 py-3 text-slate-500">{dateTime(shift.openedAt)}</td>
                    <td className="px-5 py-3 font-mono">{peso(shift.openingCash)}</td>
                    <td className="px-5 py-3"><span className={`rounded-lg border px-2 py-1 text-[10px] font-black ${paymentStyle('total')}`}>{peso(shift.summary?.sales || 0)}</span></td>
                    <td className="px-5 py-3"><div className="flex flex-wrap gap-1"><span className={`rounded-md border px-1.5 py-1 text-[9px] font-black ${paymentStyle('cash')}`}>Cash {peso(shift.summary?.cashSales || 0)}</span><span className={`rounded-md border px-1.5 py-1 text-[9px] font-black ${paymentStyle('gcash')}`}>GCash {peso(shift.summary?.gcashSales || 0)}</span><span className={`rounded-md border px-1.5 py-1 text-[9px] font-black ${paymentStyle('card')}`}>Card {peso(shift.summary?.cardSales || 0)}</span></div></td>
                    <td className="px-5 py-3 font-mono">{shift.expectedCash == null ? '—' : peso(shift.expectedCash)}</td>
                    <td className="px-5 py-3 font-mono">{shift.actualCash == null ? '—' : peso(shift.actualCash)}</td>
                    <td className={`px-5 py-3 font-mono font-black ${(shift.variance || 0) < 0 ? 'text-rose-600' : (shift.variance || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{shift.variance == null ? '—' : peso(shift.variance)}</td>
                    <td className="px-5 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-black ${shift.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{shift.status}</span></td>
                  </tr>)}
                </tbody>
              </table>
              {shifts.length === 0 && <div className="p-8 text-center text-xs text-slate-500">No shift records yet.</div>}
            </div>
          </div>
        </div>
      </div>

      {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-base font-black text-slate-950">{modal === 'open' ? 'Open Shift' : modal === 'close' ? `Close ${targetShift?.cashierName || 'Cashier'} Shift` : modal === 'cash-in' ? 'Cash In' : 'Cash Out'}</h3>
        <p className="mt-1 text-xs text-slate-500">{modal === 'open' ? 'Count the physical opening cash in the drawer.' : modal === 'close' ? `Expected drawer cash: ${peso(targetExpected)}. Enter the physical count.` : `Record a cash movement for ${targetShift?.cashierName || 'this shift'}.`}</p>
        <label className="mt-5 block text-[10px] font-black uppercase tracking-wider text-slate-500">{modal === 'close' ? 'Actual Cash' : modal === 'open' ? 'Opening Cash' : 'Amount'}</label>
        <input autoFocus type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
        {modal !== 'open' && <><label className="mt-4 block text-[10px] font-black uppercase tracking-wider text-slate-500">{modal === 'close' ? 'Closing Note (optional)' : 'Reason'}</label><textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 min-h-20 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder={modal === 'close' ? 'Optional note about the closing count' : 'e.g. Change fund replenishment'} />{error && <p className="mt-3 text-xs font-bold text-rose-600">{error}</p>}</>}
        <div className="mt-5 flex justify-end gap-2"><button onClick={() => { setModal(null); setSelectedShift(null); }} className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700">Cancel</button><button disabled={saving || !amount || (modal !== 'open' && modal !== 'close' && !reason.trim())} onClick={submit} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">{saving ? 'Saving...' : modal === 'open' ? 'Open Shift' : modal === 'close' ? 'Close Shift' : 'Record Movement'}</button></div>
      </div></div>}
    </>
  );
}

function ShiftCard({ shift, manager = false, onCashIn, onCashOut, onClose }: { shift: Shift; manager?: boolean; onCashIn: () => void; onCashOut: () => void; onClose: () => void }) {
  const expected = Number(shift.expectedCash || 0);
  const summary = shift.summary || { cashSales: 0, gcashSales: 0, cardSales: 0, sales: 0, transactions: 0 };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><h2 className="text-sm font-black">{manager ? shift.cashierName : 'Shift Open'}</h2></div><p className="mt-1 text-xs text-slate-500">{manager ? `Opened ${dateTime(shift.openedAt)}` : `${shift.cashierName} · opened ${dateTime(shift.openedAt)}`}</p></div>
      <div className="flex flex-wrap gap-2"><button onClick={onCashIn} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Cash In</button><button onClick={onCashOut} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">Cash Out</button><button onClick={onClose} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white"><LockKeyhole className="mr-1 inline h-3.5 w-3.5" />Close Shift</button></div>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5"><Metric label="Transactions" value={String(summary.transactions)} /><PaymentMetric type="total" label="Total Sales" value={peso(summary.sales)} /><PaymentMetric type="cash" label="Cash" value={peso(summary.cashSales)} /><PaymentMetric type="gcash" label="GCash" value={peso(summary.gcashSales)} /><PaymentMetric type="card" label="Card" value={peso(summary.cardSales)} /></div>
    <div className="mt-3 grid grid-cols-3 gap-3"><Metric label="Opening" value={peso(shift.openingCash)} /><Metric label="Cash In / Out" value={`${peso(shift.cashIn)} / ${peso(shift.cashOut)}`} /><Metric label="Expected Drawer" value={peso(expected)} /></div>
  </div>;
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><Icon className="h-4 w-4 text-blue-600" /><p className="mt-3 text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-lg font-black text-slate-950">{value}</p></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-slate-900">{value}</p></div>; }
function PaymentMetric({ type, label, value }: { type: PaymentTone; label: string; value: string }) { return <div className={`rounded-xl border p-3 ${paymentStyle(type)}`}><p className="text-[9px] font-black uppercase tracking-wider opacity-70">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>; }
