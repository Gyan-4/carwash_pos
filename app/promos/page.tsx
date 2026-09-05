'use client';

import { useEffect, useState } from 'react';
import { Edit3, Plus, RefreshCw, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';

const TYPES = ['motorcycle', 'sedan', 'suv', 'truck'];
const SIZES = ['small', 'medium', 'large', 'xl', 'xxl'];
const PLATFORMS = ['Grab', 'Foodpanda', 'JoyRide', 'Maxim', 'inDrive', 'SPX Express', 'J&T Express'];

const emptyForm = () => ({ name: '', description: '', discountType: 'percentage', discountValue: 20, eligibleVehicleTypes: [...TYPES], eligibleVehicleSizes: [...SIZES], eligiblePlatforms: [...PLATFORMS], requiresVerification: false, active: true });

export default function PromosPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(emptyForm());
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/promos', { cache: 'no-store' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.success === false) throw new Error(d.error || 'Unable to load promos.');
      setPromos(Array.isArray(d.promos) ? d.promos : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load promos.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = (key: string, value: string) => setForm((f: any) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((x: string) => x !== value) : [...f[key], value] }));

  const openNew = () => { setEditing(null); setForm(emptyForm()); setError(''); setShow(true); };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name || '', description: p.description || '', discountType: p.discountType || 'percentage', discountValue: Number(p.discountValue) || 0,
      eligibleVehicleTypes: Array.isArray(p.eligibleVehicleTypes) ? [...p.eligibleVehicleTypes] : [],
      eligibleVehicleSizes: Array.isArray(p.eligibleVehicleSizes) ? [...p.eligibleVehicleSizes] : [],
      eligiblePlatforms: Array.isArray(p.eligiblePlatforms) ? [...p.eligiblePlatforms] : [],
      requiresVerification: Boolean(p.requiresVerification), active: p.active !== false,
    });
    setError(''); setShow(true);
  };

  const save = async () => {
    if (!form.name.trim()) return setError('Promo name is required.');
    const value = Number(form.discountValue);
    if (!Number.isFinite(value) || value < 0) return setError('Enter a valid discount value.');
    if (form.discountType === 'percentage' && value > 100) return setError('Percentage discount cannot exceed 100%.');
    setSaving(true); setError('');
    try {
      const r = await fetch(editing ? `/api/promos?id=${encodeURIComponent(editing._id)}` : '/api/promos', {
        method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, name: form.name.trim(), discountValue: value }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Unable to save promo.');
      setShow(false); setEditing(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save promo.'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (p: any) => {
    try {
      const r = await fetch(`/api/promos?id=${encodeURIComponent(p._id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: p.name, description: p.description || '', discountType: p.discountType, discountValue: Number(p.discountValue), eligibleVehicleTypes: p.eligibleVehicleTypes || [], eligibleVehicleSizes: p.eligibleVehicleSizes || [], eligiblePlatforms: p.eligiblePlatforms || [], eligibleServiceIds: p.eligibleServiceIds || [], eligibleCategories: p.eligibleCategories || [], requiresVerification: Boolean(p.requiresVerification), active: p.active === false }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Unable to change promo status.');
      setPromos((current) => current.map((item) => item._id === p._id ? d.promo : item));
    } catch (e) { alert(e instanceof Error ? e.message : 'Unable to change promo status.'); }
  };

  const remove = async (p: any) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      const r = await fetch(`/api/promos?id=${encodeURIComponent(p._id)}`, { method: 'DELETE' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Unable to delete promo.');
      setPromos((current) => current.filter((item) => item._id !== p._id));
    } catch (e) { alert(e instanceof Error ? e.message : 'Unable to delete promo.'); }
  };

  return <div className="min-h-full overflow-y-auto bg-slate-50/60 p-6 text-slate-900"><div className="mx-auto max-w-6xl space-y-5">
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-lg font-black">Promos & Discounts</h1><p className="mt-1 text-xs text-slate-500">Manage promotions used by the cashier POS.</p></div><div className="flex gap-2"><button onClick={load} className="rounded-xl border border-slate-200 p-2.5"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button><button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white"><Plus className="h-4 w-4" /> New Promo</button></div></div>
    {error && !show && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{error}</div>}
    {loading && promos.length === 0 ? <div className="rounded-2xl border bg-white py-16 text-center text-xs text-slate-500">Loading promotions...</div> : promos.length === 0 ? <div className="rounded-2xl border border-dashed bg-white py-16 text-center"><div className="text-sm font-black">No promotions yet</div><p className="mt-1 text-xs text-slate-500">Create one here and it will appear in POS.</p><button onClick={openNew} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white">Create Promo</button></div> : <div className="grid gap-4 md:grid-cols-2">{promos.map((p) => <div key={p._id} className={`rounded-2xl border bg-white p-5 shadow-sm ${p.active === false ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate text-sm font-black">{p.name}</h2><span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${p.active === false ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>{p.active === false ? 'Inactive' : 'Active'}</span></div>{p.description && <p className="mt-1 text-xs text-slate-500">{p.description}</p>}</div><button onClick={() => toggleActive(p)} title="Toggle active">{p.active === false ? <ToggleLeft className="h-7 w-7 text-slate-400" /> : <ToggleRight className="h-7 w-7 text-emerald-600" />}</button></div>
      <div className="mt-4 text-xl font-black">{p.discountType === 'percentage' ? `${p.discountValue}% OFF` : `₱${Number(p.discountValue).toLocaleString('en-PH', { minimumFractionDigits: 2 })} OFF`}</div>
      <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-[10px] text-slate-600"><p><b>Vehicles:</b> {p.eligibleVehicleTypes?.length ? p.eligibleVehicleTypes.join(', ') : 'All vehicles'}</p><p><b>Sizes:</b> {p.eligibleVehicleSizes?.length ? p.eligibleVehicleSizes.join(', ') : 'All sizes'}</p><p><b>Platforms:</b> {p.eligiblePlatforms?.length ? p.eligiblePlatforms.join(', ') : 'All platforms'}</p><p><b>Verification:</b> {p.requiresVerification ? 'Required' : 'Not required'}</p></div>
      <div className="mt-4 flex gap-2"><button onClick={() => openEdit(p)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold"><Edit3 className="h-3.5 w-3.5" /> Edit</button><button onClick={() => remove(p)} className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-600"><Trash2 className="h-3.5 w-3.5" /> Delete</button></div>
    </div>)}</div>}
    {show && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"><div className="flex items-center justify-between"><div><h2 className="text-sm font-black">{editing ? 'Edit Promotion' : 'New Promotion'}</h2><p className="mt-1 text-[10px] text-slate-500">Configure when this promo can be used.</p></div><button onClick={() => !saving && setShow(false)}><X className="h-4 w-4 text-slate-400" /></button></div><div className="mt-5 space-y-4"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Promo name" className="w-full rounded-xl border p-3 text-xs" /><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className="w-full rounded-xl border p-3 text-xs" /><div className="grid grid-cols-2 gap-3"><select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="rounded-xl border p-3 text-xs"><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select><input type="number" min="0" max={form.discountType === 'percentage' ? 100 : undefined} step="0.01" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} className="rounded-xl border p-3 text-xs" /></div><Group title="Vehicle types" values={TYPES} selected={form.eligibleVehicleTypes} onToggle={(v) => toggle('eligibleVehicleTypes', v)} /><Group title="Vehicle sizes" values={SIZES} selected={form.eligibleVehicleSizes} onToggle={(v) => toggle('eligibleVehicleSizes', v)} /><Group title="Rider platforms" values={PLATFORMS} selected={form.eligiblePlatforms} onToggle={(v) => toggle('eligiblePlatforms', v)} /><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={form.requiresVerification} onChange={(e) => setForm({ ...form, requiresVerification: e.target.checked })} /> Require cashier verification</label><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Promo is active</label>{error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-700">{error}</div>}<div className="flex gap-2"><button onClick={() => setShow(false)} disabled={saving} className="flex-1 rounded-xl border py-3 text-xs font-bold">Cancel</button><button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-black text-white disabled:bg-slate-300">{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Promo'}</button></div></div></div></div>}
  </div></div>;
}

function Group({ title, values, selected, onToggle }: { title: string; values: string[]; selected: string[]; onToggle: (value: string) => void }) { return <div><p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-500">{title}</p><div className="flex flex-wrap gap-2">{values.map((v) => <button key={v} type="button" onClick={() => onToggle(v)} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-bold ${selected.includes(v) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'}`}>{v}</button>)}</div></div>; }
