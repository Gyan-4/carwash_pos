'use client';

import { useEffect, useState } from 'react';
import { Save, CreditCard, Award, Trash2, ShieldAlert, Database, Store, ReceiptText } from 'lucide-react';

type Settings = { storeName: string; address: string; contactNumber: string; receiptFooter: string; stampsRequired: number; riderDiscountPercent: number; paymentMethods: { cash: boolean; gcash: boolean; card: boolean } };
const defaults: Settings = { storeName: 'Car Wash POS', address: '', contactNumber: '', receiptFooter: 'Thank you for choosing us!', stampsRequired: 11, riderDiscountPercent: 20, paymentMethods: { cash: true, gcash: true, card: true } };

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cleanupMessage, setCleanupMessage] = useState('');
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const meResponse = await fetch('/api/auth/me', { cache: 'no-store' });
        const me = await meResponse.json();
        if (!meResponse.ok || me.user?.role !== 'manager') return;
        setIsManager(true);
        const response = await fetch('/api/settings', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load settings.');
        const s = data.settings || {};
        setSettings({ ...defaults, ...s, paymentMethods: { ...defaults.paymentMethods, ...(s.paymentMethods || {}) } });
      } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load settings.'); }
      finally { setLoading(false); }
    })();
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) { setSettings((current) => ({ ...current, [key]: value })); }

  async function save() {
    setSaving(true); setMessage(''); setError('');
    try {
      const response = await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save settings.');
      setSettings({ ...defaults, ...data.settings, paymentMethods: { ...defaults.paymentMethods, ...(data.settings?.paymentMethods || {}) } });
      setMessage('System settings saved successfully.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save settings.'); }
    finally { setSaving(false); }
  }

  async function purgeDeleted() {
    if (cleaning || !window.confirm('Permanently remove all transactions already marked DELETED? Audit logs will be preserved.')) return;
    setCleaning(true); setCleanupMessage('');
    try { const response = await fetch('/api/admin/cleanup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'purge-deleted-transactions', reason: 'Manager removed deleted records' }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Cleanup failed.'); setCleanupMessage(`${data.deletedCount} deleted transaction record(s) permanently removed.`); } catch (e) { setCleanupMessage(e instanceof Error ? e.message : 'Cleanup failed.'); } finally { setCleaning(false); }
  }

  async function purgeAll() {
    if (cleaning) return;
    const confirmation = window.prompt('This permanently removes ALL transaction records. Type DELETE ALL TRANSACTIONS to continue.');
    if (confirmation !== 'DELETE ALL TRANSACTIONS') return;
    const reason = window.prompt('Enter a reason for this database cleanup:');
    if (!reason?.trim()) return;
    setCleaning(true); setCleanupMessage('');
    try { const response = await fetch('/api/admin/cleanup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'purge-all-transactions', confirmation, reason: reason.trim() }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Cleanup failed.'); setCleanupMessage(`${data.deletedCount} transaction record(s) permanently removed. Audit logs were preserved.`); } catch (e) { setCleanupMessage(e instanceof Error ? e.message : 'Cleanup failed.'); } finally { setCleaning(false); }
  }

  if (!loading && !isManager) return <div className="p-8 text-sm font-bold text-slate-600">Manager access required.</div>;

  return (
    <div className="h-full w-full p-6 space-y-6 overflow-y-auto bg-slate-50/60 font-sans text-slate-900">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-lg font-black text-slate-950">System Configuration</h1><p className="mt-0.5 text-xs text-slate-600">Configure store identity, receipts, loyalty rules, payments, and data maintenance.</p></div>
        <button onClick={save} disabled={saving || loading} className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}</button>
      </div>
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">{message}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2"><Store className="h-4 w-4 text-blue-600" /><h2 className="text-xs font-extrabold uppercase tracking-wider">Store Information</h2></div>
          <div><label className="mb-1 block text-[10px] font-extrabold uppercase text-slate-600">Store Name</label><input value={settings.storeName} onChange={(e) => update('storeName', e.target.value)} maxLength={120} className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-[10px] font-extrabold uppercase text-slate-600">Address</label><input value={settings.address} onChange={(e) => update('address', e.target.value)} maxLength={200} className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-[10px] font-extrabold uppercase text-slate-600">Contact Number</label><input value={settings.contactNumber} onChange={(e) => update('contactNumber', e.target.value)} maxLength={50} className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2"><ReceiptText className="h-4 w-4 text-blue-600" /><h2 className="text-xs font-extrabold uppercase tracking-wider">Receipt Settings</h2></div>
          <div><label className="mb-1 block text-[10px] font-extrabold uppercase text-slate-600">Receipt Footer</label><textarea value={settings.receiptFooter} onChange={(e) => update('receiptFooter', e.target.value)} maxLength={250} rows={4} className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="rounded-xl bg-slate-50 p-3 text-[10px] font-bold text-slate-500">These store details are saved in MongoDB and are available to the POS for receipt configuration.</div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2"><Award className="h-4 w-4 text-purple-600" /><h2 className="text-xs font-extrabold uppercase tracking-wider">Loyalty & Partner Rules</h2></div>
          <div><label className="mb-1 block text-[10px] font-extrabold uppercase text-slate-600">Stamps Required For Free Wash</label><input type="number" min={1} max={999} value={settings.stampsRequired} onChange={(e) => update('stampsRequired', Number(e.target.value))} className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="mb-1 block text-[10px] font-extrabold uppercase text-slate-600">Rider Partner Discount (%)</label><input type="number" min={0} max={100} step="0.01" value={settings.riderDiscountPercent} onChange={(e) => update('riderDiscountPercent', Number(e.target.value))} className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-600" /><h2 className="text-xs font-extrabold uppercase tracking-wider">Payment Methods</h2></div>
          <div className="space-y-2 text-xs">
            {([['cash', 'Cash'], ['gcash', 'GCash'], ['card', 'Card']] as const).map(([key, label]) => <label key={key} className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3"><span className="font-bold">{label}</span><input type="checkbox" checked={settings.paymentMethods[key]} onChange={(e) => update('paymentMethods', { ...settings.paymentMethods, [key]: e.target.checked })} className="h-4 w-4 accent-blue-600" /></label>)}
            <p className="pt-1 text-[10px] text-slate-500">At least one payment method must stay enabled. These controls are persisted for future POS enforcement.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-red-50 p-2"><Database className="h-5 w-5 text-red-600" /></div><div><h2 className="text-sm font-extrabold text-slate-950">Manager Data Management</h2><p className="mt-1 text-xs text-slate-600">Use this for test-data cleanup. Audit logs are never removed by these controls.</p></div></div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2"><button onClick={purgeDeleted} disabled={cleaning} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-left hover:bg-slate-50 disabled:opacity-50"><div className="flex items-center gap-2 text-xs font-extrabold"><Trash2 className="h-4 w-4 text-amber-600" /> Purge Deleted Transactions</div><p className="mt-1 text-[10px] text-slate-600">Permanently remove records already marked deleted.</p></button><button onClick={purgeAll} disabled={cleaning} className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-left hover:bg-red-100 disabled:opacity-50"><div className="flex items-center gap-2 text-xs font-extrabold text-red-800"><ShieldAlert className="h-4 w-4" /> Purge ALL Transactions</div><p className="mt-1 text-[10px] text-red-700">Dangerous: permanently removes every transaction record.</p></button></div>
        {cleanupMessage && <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">{cleanupMessage}</div>}
      </div>
    </div>
  );
}
