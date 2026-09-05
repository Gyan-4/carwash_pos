'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Search, Users, Car, RefreshCw, Pencil, X, Plus, Wallet, Clock3 } from 'lucide-react';

type Vehicle = { plate: string; vehicleType: string; vehicleSize?: string; visitCount: number; lastVisitAt?: string };
type History = { transactionNo: string; plate: string; vehicleType: string; vehicleSize?: string; services: { name: string; price: number }[]; total: number; discount: number; paymentMethod?: string; createdAt: string };
type Customer = { _id: string; name: string; displayName?: string; named?: boolean; vehicles: Vehicle[]; totalVisits: number; totalSpent: number; lastVisitAt?: string; lastService?: string; history: History[] };

const money = (value: number) => `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const date = (value?: string) => value ? new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const vehicleLabel = (v: Vehicle) => `${v.vehicleType}${v.vehicleSize ? ` • ${v.vehicleSize}` : ''}`;

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [adding, setAdding] = useState(false);
  const [vehicleIndex, setVehicleIndex] = useState(0);
  const [originalPlate, setOriginalPlate] = useState('');
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [vehicleType, setVehicleType] = useState('sedan');
  const [vehicleSize, setVehicleSize] = useState('medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(search)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Unable to load customers.');
      setCustomers(data.customers || []);
      if (selected) setSelected((data.customers || []).find((c: Customer) => c._id === selected._id) || null);
    } catch (e) { if (!silent) setError(e instanceof Error ? e.message : 'Unable to load customers.'); }
    finally { if (!silent) setLoading(false); }
  };

  useEffect(() => { const t = setTimeout(() => load(), 250); return () => clearTimeout(t); }, [search]);
  useEffect(() => { const id = window.setInterval(() => load(true), 5000); const onFocus = () => load(true); window.addEventListener('focus', onFocus); return () => { window.clearInterval(id); window.removeEventListener('focus', onFocus); }; }, [search, selected?._id]);

  const totals = useMemo(() => ({ vehicles: customers.reduce((n, c) => n + c.vehicles.length, 0), visits: customers.reduce((n, c) => n + c.totalVisits, 0), spent: customers.reduce((n, c) => n + c.totalSpent, 0) }), [customers]);

  const closeEditor = () => { setEditing(null); setAdding(false); setOriginalPlate(''); setError(''); };
  const openEdit = (customer: Customer, index = 0) => {
    const v = customer.vehicles[index];
    setEditing(customer); setAdding(false); setVehicleIndex(index); setOriginalPlate(v?.plate || '');
    setName(customer.named ? customer.name : ''); setPlate(v?.plate || ''); setVehicleType(v?.vehicleType || 'sedan'); setVehicleSize(v?.vehicleSize || 'medium'); setError('');
  };
  const openAddCustomer = () => { setEditing(null); setAdding(true); setVehicleIndex(0); setOriginalPlate(''); setName(''); setPlate(''); setVehicleType('sedan'); setVehicleSize('medium'); setError(''); };
  const openAddVehicle = (customer: Customer) => { setEditing(customer); setAdding(false); setVehicleIndex(-1); setOriginalPlate(''); setName(customer.named ? customer.name : ''); setPlate(''); setVehicleType('sedan'); setVehicleSize('medium'); setError(''); };

  const save = async () => {
    if (!plate.trim() || !vehicleType) { setError('Plate and vehicle type are required.'); return; }
    if (vehicleType !== 'motorcycle' && !vehicleSize) { setError('Vehicle size is required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/customers', {
        method: adding ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: editing?._id,
          mode: vehicleIndex === -1 ? 'add-vehicle' : 'edit-vehicle',
          originalPlate,
          name: name.trim(),
          vehicle: { plate: plate.trim().toUpperCase(), vehicleType, vehicleSize: vehicleType === 'motorcycle' ? '' : vehicleSize },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Unable to save customer.');
      closeEditor();
      await load(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save customer.'); } finally { setSaving(false); }
  };

  return <div className="h-full w-full overflow-y-auto bg-slate-50/60 p-6 font-sans select-none"><div className="mx-auto max-w-7xl space-y-5">
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-lg font-black text-slate-900">Customers</h1><p className="mt-0.5 text-xs text-slate-500">Profiles, vehicles, visit history, and customer spending.</p></div><div className="flex w-full gap-2 sm:w-auto"><button onClick={openAddCustomer} className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-slate-800"><Plus className="h-4 w-4"/>Add customer</button><button onClick={() => load()} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50" title="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/></button><div className="relative w-full sm:w-72"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400"/><input placeholder="Search customer or plate..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"/></div></div></div>
    {error && !editing && !adding && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{error}</div>}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat icon={<Users/>} label="Customers" value={customers.length}/><Stat icon={<Car/>} label="Vehicles" value={totals.vehicles}/><Stat icon={<Clock3/>} label="Total visits" value={totals.visits}/><Stat icon={<Wallet/>} label="Customer spending" value={money(totals.spent)} blue/></div>
    {customers.length===0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm"><Users className="mx-auto h-10 w-10 text-slate-300"/><h2 className="mt-3 text-sm font-black text-slate-800">{loading?'Loading customers...':'No customers found'}</h2><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">Customers appear here from completed POS transactions. You can also add a customer manually.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{customers.map(c=><div key={c._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"><div className="flex items-start justify-between gap-3"><button onClick={()=>setSelected(c)} className="min-w-0 text-left"><h2 className="truncate text-sm font-black text-slate-900">{c.name}</h2><p className="mt-1 text-[10px] font-bold text-slate-400">{c.totalVisits} visit{c.totalVisits===1?'':'s'} • {c.vehicles.length} vehicle{c.vehicles.length===1?'':'s'}{!c.named && ' • plate identity'}</p></button><button onClick={()=>openEdit(c)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700" title="Edit customer"><Pencil className="h-4 w-4"/></button></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Total spent</p><p className="mt-1 text-sm font-black text-slate-900">{money(c.totalSpent)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Last service</p><p className="mt-1 truncate text-[10px] font-bold text-slate-700">{c.lastService || '—'}</p></div></div><div className="mt-3 space-y-2">{c.vehicles.slice(0,3).map((v,i)=><button key={v.plate} onClick={()=>setSelected(c)} className="flex w-full items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50"><span className="flex min-w-0 items-center gap-2"><Car className="h-4 w-4 shrink-0 text-slate-400"/><span className="min-w-0"><span className="block text-xs font-black text-slate-800">{v.plate}</span><span className="block text-[10px] capitalize text-slate-500">{vehicleLabel(v)} • {v.visitCount} visits</span></span></span><span className="text-[9px] text-slate-400">{date(v.lastVisitAt)}</span></button>)}{c.vehicles.length>3&&<p className="text-center text-[10px] font-bold text-slate-400">+{c.vehicles.length-3} more vehicles</p>}</div><button onClick={()=>openAddVehicle(c)} className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 py-2 text-[10px] font-bold text-slate-500 hover:bg-slate-50"><Plus className="h-3 w-3"/> Add vehicle</button></div>)}</div>}
  </div>
  {selected&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="sticky top-0 flex items-start justify-between border-b border-slate-100 bg-white p-5"><div><h2 className="text-base font-black text-slate-900">{selected.name}</h2><p className="mt-1 text-[10px] text-slate-500">{selected.named ? 'Named customer' : 'Plate-based customer'} • Last visit: {date(selected.lastVisitAt)}</p></div><div className="flex items-center gap-1"><button onClick={()=>openEdit(selected)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700" title="Edit customer"><Pencil className="h-4 w-4"/></button><button onClick={()=>setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><X className="h-4 w-4"/></button></div></div><div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4"><Stat label="Visits" value={selected.totalVisits}/><Stat label="Vehicles" value={selected.vehicles.length}/><Stat label="Total spent" value={money(selected.totalSpent)} blue/><Stat label="Last service" value={selected.lastService||'—'}/></div><div className="px-5 pb-5"><h3 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-800">Vehicles</h3><div className="grid gap-2 sm:grid-cols-2">{selected.vehicles.map((v,i)=><div key={v.plate} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><Car className="h-4 w-4 shrink-0 text-slate-400"/><span className="font-mono text-xs font-black text-slate-800">{v.plate}</span></div><button onClick={()=>openEdit(selected,i)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700" title="Edit this vehicle"><Pencil className="h-3.5 w-3.5"/></button></div><p className="mt-1 text-[10px] capitalize text-slate-500">{vehicleLabel(v)}</p><p className="mt-1 text-[10px] text-slate-400">{v.visitCount} visits • Last {date(v.lastVisitAt)}</p></div>)}</div><h3 className="mb-3 mt-6 text-xs font-black uppercase tracking-wider text-slate-800">Visit history</h3>{selected.history.length===0?<p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">No completed transactions yet.</p>:<div className="space-y-2">{selected.history.map(h=><div key={h.transactionNo} className="rounded-xl border border-slate-100 p-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-[10px] font-black text-slate-800">{h.transactionNo}</p><p className="mt-1 text-[10px] text-slate-400">{date(h.createdAt)} • {h.plate} • {h.paymentMethod||'cash'}</p><p className="mt-1 text-[10px] text-slate-600">{h.services.map(s=>s.name).join(', ')||'Car wash'}</p></div><div className="text-right"><p className="text-sm font-black text-slate-900">{money(h.total)}</p>{h.discount>0&&<p className="text-[9px] font-bold text-emerald-600">Discount {money(h.discount)}</p>}</div></div></div>)}</div>}</div></div></div>}
  {(editing||adding)&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" onMouseDown={e=>{if(e.target===e.currentTarget)closeEditor()}}><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"><div className="flex items-center justify-between"><div><h2 className="text-sm font-black text-slate-900">{adding?'Add customer':vehicleIndex===-1?'Add vehicle':'Edit vehicle'}</h2><p className="mt-0.5 text-[10px] text-slate-500">{vehicleIndex===-1?'Adds another vehicle to this customer.':'Changes the existing vehicle record; it will not create another vehicle.'}</p></div><button onClick={closeEditor} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><X className="h-4 w-4"/></button></div><div className="mt-4 space-y-3"><label className="block"><span className="text-[10px] font-bold text-slate-500">Customer name <span className="font-normal text-slate-400">(optional for plate-based customers)</span></span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Leave blank to use plate number" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"/></label><label className="block"><span className="text-[10px] font-bold text-slate-500">Plate number</span><input value={plate} onChange={e=>setPlate(e.target.value.toUpperCase())} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold uppercase text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"/></label><div className="grid grid-cols-2 gap-3"><label><span className="text-[10px] font-bold text-slate-500">Vehicle type</span><select value={vehicleType} onChange={e=>setVehicleType(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800"><option value="motorcycle">Motorcycle</option><option value="sedan">Sedan</option><option value="suv">SUV</option><option value="truck">Truck</option></select></label><label><span className="text-[10px] font-bold text-slate-500">Vehicle size</span><select value={vehicleSize} disabled={vehicleType==='motorcycle'} onChange={e=>setVehicleSize(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="xl">XL</option><option value="xxl">XXL</option></select></label></div>{error&&<p className="rounded-lg bg-red-50 px-3 py-2 text-[10px] font-bold text-red-600">{error}</p>}<div className="flex justify-end gap-2 pt-2"><button onClick={closeEditor} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Cancel</button><button onClick={save} disabled={saving} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving?'Saving...':adding?'Create customer':vehicleIndex===-1?'Add vehicle':'Save changes'}</button></div></div></div>}
</div>;
}

function Stat({ icon, label, value, blue = false }: { icon?: ReactNode; label: string; value: ReactNode; blue?: boolean }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">{icon&&<span className="h-4 w-4">{icon}</span>}{label}</div><p className={`mt-1 text-xl font-black ${blue?'text-blue-700':'text-slate-900'}`}>{value}</p></div>; }
