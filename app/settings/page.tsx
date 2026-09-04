'use client';

import { useEffect, useState } from 'react';
import { Save, CreditCard, Award, Trash2, ShieldAlert, Database } from 'lucide-react';

export default function SettingsPage() {
  const [stampsRequired, setStampsRequired] = useState(11);
  const [riderDiscountPercent, setRiderDiscountPercent] = useState(20);
  const [isManager, setIsManager] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState('');
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setIsManager(data.user?.role === 'manager');
    }).catch(() => undefined);
  }, []);

  async function purgeDeleted() {
    if (cleaning || !window.confirm('Permanently remove all transactions already marked DELETED? Audit logs will be preserved.')) return;
    setCleaning(true);
    setCleanupMessage('');
    try {
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purge-deleted-transactions', reason: 'Manager removed deleted records' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Cleanup failed.');
      setCleanupMessage(`${data.deletedCount} deleted transaction record(s) permanently removed.`);
    } catch (error) {
      setCleanupMessage(error instanceof Error ? error.message : 'Cleanup failed.');
    } finally {
      setCleaning(false);
    }
  }

  async function purgeAll() {
    if (cleaning) return;
    const confirmation = window.prompt('This permanently removes ALL transaction records. Type DELETE ALL TRANSACTIONS to continue.');
    if (confirmation !== 'DELETE ALL TRANSACTIONS') return;
    const reason = window.prompt('Enter a reason for this database cleanup:');
    if (!reason?.trim()) return;
    setCleaning(true);
    setCleanupMessage('');
    try {
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purge-all-transactions', confirmation, reason: reason.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Cleanup failed.');
      setCleanupMessage(`${data.deletedCount} transaction record(s) permanently removed. Audit logs were preserved.`);
    } catch (error) {
      setCleanupMessage(error instanceof Error ? error.message : 'Cleanup failed.');
    } finally {
      setCleaning(false);
    }
  }

  return (
    <div className="h-full w-full p-6 space-y-6 overflow-y-auto bg-slate-50/60 font-sans select-none text-slate-900">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg font-black text-slate-950">System Configuration</h1>
          <p className="text-xs text-slate-600 mt-0.5">Configure terminal rules, pricing rules, loyalty thresholds, and data maintenance.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-blue-600/20">
          <Save className="w-4 h-4" /> Save System Rules
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600" />
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Stamp Loyalty Rules</h2>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-600 block mb-1">Stamps Required For Free Wash</label>
              <input type="number" value={stampsRequired} onChange={(e) => setStampsRequired(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-600 block mb-1">Rider Partner Discount (%)</label>
              <input type="number" value={riderDiscountPercent} onChange={(e) => setRiderDiscountPercent(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Terminal Payment Options</h2>
          </div>
          <div className="space-y-2 text-xs">
            {['Cash Drawer Integration', 'GCash QR Merchant', 'Maya QR Integration', 'Card Terminal (POS Terminal)'].map((method) => (
              <label key={method} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <span className="font-bold text-slate-800">{method}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600 rounded" />
              </label>
            ))}
          </div>
        </div>
      </div>

      {isManager && (
        <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-red-50 p-2"><Database className="w-5 h-5 text-red-600" /></div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-950">Manager Data Management</h2>
              <p className="text-xs text-slate-600 mt-1">Use this for test-data cleanup. Audit logs are never removed by these controls.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button onClick={purgeDeleted} disabled={cleaning} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-left hover:bg-slate-50 disabled:opacity-50">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900"><Trash2 className="w-4 h-4 text-amber-600" /> Purge Deleted Transactions</div>
              <p className="text-[10px] text-slate-600 mt-1">Permanently remove records already marked deleted.</p>
            </button>
            <button onClick={purgeAll} disabled={cleaning} className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-left hover:bg-red-100 disabled:opacity-50">
              <div className="flex items-center gap-2 text-xs font-extrabold text-red-800"><ShieldAlert className="w-4 h-4" /> Purge ALL Transactions</div>
              <p className="text-[10px] text-red-700 mt-1">Dangerous: permanently removes every transaction record.</p>
            </button>
          </div>
          {cleanupMessage && <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">{cleanupMessage}</div>}
        </div>
      )}
    </div>
  );
}
