'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Search, Users, Car, RefreshCw, Pencil, X, Plus, Wallet, Clock3, Trash2 } from 'lucide-react';

type Vehicle = { plate: string; vehicleType: string; vehicleSize?: string; visitCount: number; lastVisitAt?: string };
type History = { transactionNo: string; plate: string; vehicleType: string; vehicleSize?: string; services: { name: string; price: number }[]; total: number; discount: number; paymentMethod?: string; createdAt: string };
type Customer = { _id: string; name: string; displayName?: string; named?: boolean; vehicles: Vehicle[]; totalVisits: number; totalSpent: number; lastVisitAt?: string; lastService?: string; history: History[] };

const money = (value: number) => `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const date = (value?: string) => value ? new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const vehicleLabel = (vehicle: Vehicle) => `${vehicle.vehicleType}${vehicle.vehicleSize ? ` • ${vehicle.vehicleSize}` : ''}`;

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
  const [deletingPlate, setDeletingPlate] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState('');

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/customers?q=${encodeURIComponent(search)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load customers.');
      const nextCustomers = data.customers || [];
      setCustomers(nextCustomers);
      if (selected) setSelected(nextCustomers.find((customer: Customer) => customer._id === selected._id) || null);
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : 'Unable to load customers.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' }).then(async response => {
      if (!response.ok) return;
      const data = await response.json();
      setRole(data.user?.role || '');
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const interval = window.setInterval(() => load(true), 5000);
    const onFocus = () => load(true);
    window.addEventListener('focus', onFocus);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, [search, selected?._id]);

  const totals = useMemo(() => ({
    vehicles: customers.reduce((total, customer) => total + customer.vehicles.length, 0),
    visits: customers.reduce((total, customer) => total + customer.totalVisits, 0),
    spent: customers.reduce((total, customer) => total + customer.totalSpent, 0),
  }), [customers]);

  const closeEditor = () => { setEditing(null); setAdding(false); setVehicleIndex(0); setOriginalPlate(''); setError(''); };

  const openEdit = (customer: Customer, index = 0) => {
    const vehicle = customer.vehicles[index];
    setSelected(null); setEditing(customer); setAdding(false); setVehicleIndex(index); setOriginalPlate(vehicle?.plate || '');
    setName(customer.named ? customer.name : ''); setPlate(vehicle?.plate || ''); setVehicleType(vehicle?.vehicleType || 'sedan');
    setVehicleSize(vehicle?.vehicleSize || 'medium'); setError('');
  };

  const openAddCustomer = () => {
    setSelected(null); setEditing(null); setAdding(true); setVehicleIndex(0); setOriginalPlate(''); setName(''); setPlate('');
    setVehicleType('sedan'); setVehicleSize('medium'); setError('');
  };

  const openAddVehicle = (customer: Customer) => {
    setSelected(null); setEditing(customer); setAdding(false); setVehicleIndex(-1); setOriginalPlate('');
    setName(customer.named ? customer.name : ''); setPlate(''); setVehicleType('sedan'); setVehicleSize('medium'); setError('');
  };

  const save = async () => {
    if (!plate.trim() || !vehicleType) return setError('Plate and vehicle type are required.');
    if (vehicleType !== 'motorcycle' && !vehicleSize) return setError('Vehicle size is required.');
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/customers', {
        method: adding ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: editing?._id, mode: vehicleIndex === -1 ? 'add-vehicle' : 'edit-vehicle', originalPlate, name: name.trim(), vehicle: { plate: plate.trim().toUpperCase(), vehicleType, vehicleSize: vehicleType === 'motorcycle' ? '' : vehicleSize } }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to save customer.');
      closeEditor(); await load(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save customer.'); }
    finally { setSaving(false); }
  };

  const removeVehicle = async (customer: Customer, vehicle: Vehicle) => {
    if (role !== 'manager') return setError('Only managers can remove vehicles.');
    const confirmed = window.confirm(`Remove vehicle ${vehicle.plate} from ${customer.name}?\n\nThis removes the vehicle from this customer profile. Existing transaction records are kept for accounting/history.`);
    if (!confirmed) return;
    setDeletingPlate(vehicle.plate); setError('');
    try {
      const response = await fetch('/api/customers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: customer._id, plate: vehicle.plate }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to remove vehicle.');
      setSelected(null); await load(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to remove vehicle.'); }
    finally { setDeletingPlate(''); }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/60 p-6 font-sans select-none">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-lg font-black text-slate-900">Customers</h1><p className="mt-0.5 text-xs text-slate-500">Profiles, vehicles, visit history, and customer spending.</p></div>
          <div className="flex w-full gap-2 sm:w-auto">
            <button onClick={openAddCustomer} className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-slate-800"><Plus className="h-4 w-4" />Add customer</button>
            <button onClick={() => load()} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50" title="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
            <div className="relative w-full sm:w-72"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><input placeholder="Search customer or plate..." value={search} onChange={event => setSearch(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
        </div>

        {error && !editing && !adding && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{error}</div>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat icon={<Users />} label="Customers" value={customers.length} /><Stat icon={<Car />} label="Vehicles" value={totals.vehicles} /><Stat icon={<Clock3 />} label="Total visits" value={totals.visits} /><Stat icon={<Wallet />} label="Customer spending" value={money(totals.spent)} blue /></div>

        {customers.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm"><Users className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-3 text-sm font-black text-slate-800">{loading ? 'Loading customers...' : 'No customers found'}</h2><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">Customers appear here from completed POS transactions. You can also add a customer manually.</p></div> :
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{customers.map(customer => <div key={customer._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <div className="flex items-start justify-between gap-3"><button onClick={() => setSelected(customer)} className="min-w-0 text-left"><h2 className="truncate text-sm font-black text-slate-900">{customer.name}</h2><p className="mt-1 text-[10px] font-bold text-slate-400">{customer.totalVisits} visit{customer.totalVisits === 1 ? '' : 's'} • {customer.vehicles.length} vehicle{customer.vehicles.length === 1 ? '' : 's'}{!customer.named && ' • plate identity'}</p></button><button onClick={() => openEdit(customer)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700" title="Edit customer"><Pencil className="h-4 w-4" /></button></div>
            <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Total spent</p><p className="mt-1 text-sm font-black text-slate-900">{money(customer.totalSpent)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Last service</p><p className="mt-1 truncate text-[10px] font-bold text-slate-700">{customer.lastService || '—'}</p></div></div>
            <div className="mt-3 space-y-2">{customer.vehicles.slice(0, 3).map(vehicle => <button key={vehicle.plate} onClick={() => setSelected(customer)} className="flex w-full items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50"><span className="flex min-w-0 items-center gap-2"><Car className="h-4 w-4 shrink-0 text-slate-400" /><span className="min-w-0"><span className="block text-xs font-black text-slate-800">{vehicle.plate}</span><span className="block text-[10px] capitalize text-slate-500">{vehicleLabel(vehicle)} • {vehicle.visitCount} visits</span></span></span><span className="text-[9px] text-slate-400">{date(vehicle.lastVisitAt)}</span></button>)}{customer.vehicles.length > 3 && <p className="text-center text-[10px] font-bold text-slate-400">+{customer.vehicles.length - 3} more vehicles</p>}</div>
            <button onClick={() => openAddVehicle(customer)} className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 py-2 text-[10px] font-bold text-slate-500 hover:bg-slate-50"><Plus className="h-3 w-3" />Add vehicle</button>
          </div>)}</div>}
      </div>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}>
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div className="sticky top-0 flex items-start justify-between border-b border-slate-100 bg-white p-5"><div><h2 className="text-base font-black text-slate-900">{selected.name}</h2><p className="mt-1 text-[10px] text-slate-500">{selected.named ? 'Named customer' : 'Plate-based customer'} • Last visit: {date(selected.lastVisitAt)}</p></div><div className="flex items-center gap-1"><button onClick={() => openEdit(selected)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700" title="Edit customer"><Pencil className="h-4 w-4" /></button><button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><X className="h-4 w-4" /></button></div></div>
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4"><Stat label="Visits" value={selected.totalVisits} /><Stat label="Vehicles" value={selected.vehicles.length} /><Stat label="Total spent" value={money(selected.totalSpent)} blue /><Stat label="Last service" value={selected.lastService || '—'} /></div>
          <div className="px-5 pb-5">
            <div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Vehicles</h3><span className="text-[9px] font-bold text-slate-400">Manager can remove vehicles</span></div>
            <div className="grid gap-2 sm:grid-cols-2">{selected.vehicles.map((vehicle, index) => <div key={vehicle.plate} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><Car className="h-4 w-4 shrink-0 text-slate-400" /><span className="font-mono text-xs font-black text-slate-800">{vehicle.plate}</span></div><div className="flex items-center gap-1"><button onClick={() => openEdit(selected, index)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700" title="Edit this vehicle"><Pencil className="h-3.5 w-3.5" /></button>{role === 'manager' && <button onClick={() => removeVehicle(selected, vehicle)} disabled={deletingPlate === vehicle.plate} className="rounded-lg p-1.5 text-rose-400 hover:bg-white hover:text-rose-600 disabled:opacity-50" title="Remove this vehicle"><Trash2 className="h-3.5 w-3.5" /></button>}</div></div><p className="mt-1 text-[10px] capitalize text-slate-500">{vehicleLabel(vehicle)}</p><p className="mt-1 text-[10px] text-slate-400">{vehicle.visitCount} visits • Last {date(vehicle.lastVisitAt)}</p></div>)}</div>
            <h3 className="mb-3 mt-6 text-xs font-black uppercase tracking-wider text-slate-800">Visit history</h3>
            {selected.history.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">No completed transactions yet.</p> : <div className="space-y-2">{selected.history.map(history => <div key={history.transactionNo} className="rounded-xl border border-slate-100 p-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-[10px] font-black text-slate-800">{history.transactionNo}</p><p className="mt-1 text-[10px] text-slate-400">{date(history.createdAt)} • {history.plate} • {history.paymentMethod || 'cash'}</p><p className="mt-1 text-[10px] text-slate-600">{history.services.map(service => service.name).join(', ') || 'Car wash'}</p></div><div className="text-right"><p className="text-sm font-black text-slate-900">{money(history.total)}</p>{history.discount > 0 && <p className="text-[9px] font-bold text-emerald-600">Discount {money(history.discount)}</p>}</div></div></div>)}</div>}
          </div>
        </div>
      </div>}

      {(editing || adding) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" onMouseDown={event => { if (event.target === event.currentTarget) closeEditor(); }}><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"><div className="flex items-center justify-between"><div><h2 className="text-sm font-black text-slate-900">{adding ? 'Add customer' : vehicleIndex === -1 ? 'Add vehicle' : 'Edit vehicle'}</h2><p className="mt-0.5 text-[10px] text-slate-500">{adding ? 'Create a customer and their first vehicle.' : vehicleIndex === -1 ? 'Adds another vehicle to this customer.' : 'Changes the existing vehicle record; it will not create another vehicle.'}</p></div><button onClick={closeEditor} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><X className="h-4 w-4" /></button></div><div className="mt-4 space-y-3">
        <label className="block"><span className="text-[10px] font-bold text-slate-500">Customer name</span><input value={name} onChange={event => setName(event.target.value)} placeholder="Optional for plate-only customer" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" /></label>
        <label className="block"><span className="text-[10px] font-bold text-slate-500">Plate number</span><input value={plate} onChange={event => setPlate(event.target.value.toUpperCase())} placeholder="ABC 1234" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-xs font-bold uppercase text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" /></label>
        <div className="grid grid-cols-2 gap-3"><label className="block"><span className="text-[10px] font-bold text-slate-500">Vehicle type</span><select value={vehicleType} onChange={event => setVehicleType(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"><option value="sedan">Sedan</option><option value="suv">SUV</option><option value="truck">Truck</option><option value="motorcycle">Motorcycle</option></select></label><label className="block"><span className="text-[10px] font-bold text-slate-500">Vehicle size</span><select value={vehicleSize} onChange={event => setVehicleSize(event.target.value)} disabled={vehicleType === 'motorcycle'} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="xl">XL</option><option value="xxl">XXL</option></select></label></div>
        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[10px] font-bold text-rose-700">{error}</div>}
        <button onClick={save} disabled={saving} className="w-full rounded-xl bg-slate-900 py-3 text-xs font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving...' : adding ? 'Add customer' : vehicleIndex === -1 ? 'Add vehicle' : 'Save changes'}</button>
      </div></div></div>}
    </div>
  );
}

function Stat({ icon, label, value, blue = false }: { icon?: ReactNode; label: string; value: ReactNode; blue?: boolean }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-slate-400">{icon && <span className="h-4 w-4 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}<span className="text-[9px] font-bold uppercase tracking-wide">{label}</span></div><p className={`mt-2 text-base font-black ${blue ? 'text-blue-600' : 'text-slate-900'}`}>{value}</p></div>;
}
