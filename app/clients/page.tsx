'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Users, Car, RefreshCw, Pencil, X, Plus } from 'lucide-react';

type Vehicle = { plate: string; vehicleType: string; vehicleSize?: string; visitCount: number; lastVisitAt?: string };
type Customer = { _id: string; name: string; vehicles: Vehicle[]; totalVisits: number; lastVisitAt?: string };

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [vehicleIndex, setVehicleIndex] = useState(0);
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleSize, setVehicleSize] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(search)}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setCustomers(data.customers || []);
    } finally { if (!silent) setLoading(false); }
  };

  useEffect(() => { const t = setTimeout(() => load(), 250); return () => clearTimeout(t); }, [search]);
  useEffect(() => { const id = setInterval(() => load(true), 5000); const onFocus = () => load(true); window.addEventListener('focus', onFocus); return () => { clearInterval(id); window.removeEventListener('focus', onFocus); }; }, [search]);

  const totalVehicles = useMemo(() => customers.reduce((n, c) => n + c.vehicles.length, 0), [customers]);

  const openEdit = (customer: Customer, index = 0) => {
    const v = customer.vehicles[index];
    setEditing(customer); setVehicleIndex(index); setName(customer.name === 'Walk-in Customer' ? '' : customer.name);
    setPlate(v?.plate || ''); setVehicleType(v?.vehicleType || ''); setVehicleSize(v?.vehicleSize || ''); setError('');
  };

  const save = async () => {
    if (!editing || !name.trim() || !plate.trim()) { setError('Customer name and plate are required.'); return; }
    setSaving(true); setError('');
    try {
      const current = editing.vehicles[vehicleIndex];
      const res = await fetch('/api/customers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: editing._id, name: name.trim(), totalVisits: editing.totalVisits, vehicle: { plate: plate.trim().toUpperCase(), vehicleType, vehicleSize, visitCount: current?.visitCount || 0, lastVisitAt: current?.lastVisitAt } }) });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || 'Unable to save customer.'); return; }
      setEditing(null); await load(true);
    } catch { setError('Unable to save customer.'); } finally { setSaving(false); }
  };

  const addVehicle = () => {
    if (!editing) return;
    setVehicleIndex(editing.vehicles.length); setPlate(''); setVehicleType(''); setVehicleSize(''); setError('');
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/60 p-6 font-sans select-none">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-lg font-black text-slate-900">Customers</h1><p className="mt-0.5 text-xs text-slate-500">Customer profiles, vehicles, and visit history.</p></div>
          <div className="flex gap-2"><button onClick={() => load()} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50" title="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button><div className="relative w-full sm:w-72"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><input placeholder="Search customer or plate..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div></div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Customers</p><p className="mt-1 text-2xl font-black text-slate-900">{customers.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Vehicles</p><p className="mt-1 text-2xl font-black text-slate-900">{totalVehicles}</p></div><div className="hidden rounded-2xl border border-slate-200 bg-white p-4 sm:block"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total visits</p><p className="mt-1 text-2xl font-black text-slate-900">{customers.reduce((n,c)=>n+c.totalVisits,0)}</p></div></div>

        {customers.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm"><Users className="mx-auto h-9 w-9 text-slate-300" /><h2 className="mt-3 text-sm font-black text-slate-800">{loading ? 'Loading customers...' : 'No customers found'}</h2><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">Completed POS transactions will automatically create customer and vehicle records.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{customers.map(c => <div key={c._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><h2 className="text-sm font-black text-slate-900">{c.name || 'Walk-in Customer'}</h2><p className="mt-1 text-[10px] font-bold text-slate-400">{c.totalVisits} visit{c.totalVisits === 1 ? '' : 's'}</p></div><button onClick={() => openEdit(c)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700" title="Edit customer"><Pencil className="h-4 w-4" /></button></div><div className="mt-4 space-y-2">{c.vehicles.map((v, i) => <div key={v.plate} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"><button onClick={() => openEdit(c, i)} className="flex min-w-0 items-center gap-2 text-left"><Car className="h-4 w-4 shrink-0 text-slate-400" /><div><p className="text-xs font-black text-slate-800">{v.plate}</p><p className="text-[10px] capitalize text-slate-500">{v.vehicleType} {v.vehicleSize ? `• ${v.vehicleSize}` : ''}</p></div></button><span className="text-[10px] font-bold text-slate-500">{v.visitCount} visits</span></div>)}<button onClick={() => { openEdit(c); setTimeout(addVehicle, 0); }} className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 py-2 text-[10px] font-bold text-slate-500 hover:bg-slate-50"><Plus className="h-3 w-3" /> Add vehicle</button></div></div>)}</div>}
      </div>

      {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"><div className="flex items-center justify-between"><div><h2 className="text-sm font-black text-slate-900">Edit Customer</h2><p className="text-[10px] text-slate-500">Update the customer name or link a vehicle by plate.</p></div><button onClick={() => setEditing(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><X className="h-4 w-4" /></button></div><div className="mt-4 space-y-3"><label className="block"><span className="text-[10px] font-bold text-slate-500">Customer name</span><input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" /></label><label className="block"><span className="text-[10px] font-bold text-slate-500">Plate number</span><input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold uppercase text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" /></label><div className="grid grid-cols-2 gap-3"><label><span className="text-[10px] font-bold text-slate-500">Vehicle type</span><input value={vehicleType} onChange={e => setVehicleType(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 outline-none" /></label><label><span className="text-[10px] font-bold text-slate-500">Vehicle size</span><input value={vehicleSize} onChange={e => setVehicleSize(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 outline-none" /></label></div>{error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[10px] font-bold text-red-600">{error}</p>}<div className="flex justify-end gap-2 pt-2"><button onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Cancel</button><button onClick={save} disabled={saving} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save changes'}</button></div></div></div></div>}
    </div>
  );
}
