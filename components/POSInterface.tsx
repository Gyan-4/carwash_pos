'use client';

import { useMemo, useState } from 'react';
import { Car, Check, CircleDollarSign, RotateCcw, Search } from 'lucide-react';
import { getPrice, hasPrice, SERVICE_CATALOG, VEHICLE_SIZES, type CatalogItem, type VehicleSize, type VehicleType } from '@/lib/serviceCatalog';

export default function POSInterface() {
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan');
  const [vehicleSize, setVehicleSize] = useState<VehicleSize>('medium');
  const [plate, setPlate] = useState('');
  const [search, setSearch] = useState('');
  const [selectedServices, setSelectedServices] = useState<CatalogItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const services = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SERVICE_CATALOG.filter((service) => {
      const correctVehicle = vehicleType === 'motorcycle'
        ? service.category === 'Motorcycle'
        : service.category !== 'Motorcycle' && hasPrice(service, vehicleType, vehicleSize);
      const matchesSearch = !q || service.name.toLowerCase().includes(q) || service.category.toLowerCase().includes(q);
      return correctVehicle && matchesSearch && getPrice(service, vehicleType, vehicleSize) > 0;
    });
  }, [search, vehicleType, vehicleSize]);

  const groupedServices = useMemo(() => services.reduce<Record<string, CatalogItem[]>>((groups, service) => {
    (groups[service.category] ||= []).push(service);
    return groups;
  }, {}), [services]);

  const subtotal = selectedServices.reduce((sum, service) => sum + getPrice(service, vehicleType, vehicleSize), 0);

  const changeVehicleType = (type: VehicleType) => {
    setVehicleType(type);
    setSelectedServices([]);
    setMessage('');
  };

  const toggleService = (service: CatalogItem) => setSelectedServices((current) =>
    current.some((item) => item.id === service.id)
      ? current.filter((item) => item.id !== service.id)
      : [...current, service]
  );

  async function completeOrder() {
    if (!plate.trim() || selectedServices.length === 0 || saving) return;
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate,
          vehicleType,
          vehicleSize: vehicleType === 'motorcycle' ? undefined : vehicleSize,
          services: selectedServices.map((service) => ({
            id: service.id,
            name: service.name,
            category: service.category,
            price: getPrice(service, vehicleType, vehicleSize),
          })),
          subtotal,
          discount: 0,
          total: subtotal,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save transaction.');
      setMessage(`Saved ${data.transaction.transactionNo}`);
      setPlate('');
      setSelectedServices([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save transaction.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full h-full flex gap-4 p-4 overflow-hidden bg-slate-50/60 text-slate-900">
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h1 className="text-sm font-black text-slate-950">POS Terminal</h1>
              <p className="text-[11px] text-slate-600">Select the vehicle class and service package.</p>
            </div>
            <Car className="w-5 h-5 text-blue-600" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(['motorcycle', 'sedan', 'suv', 'truck'] as VehicleType[]).map((type) => (
              <button key={type} onClick={() => changeVehicleType(type)} className={`rounded-lg border px-3 py-2 text-xs font-bold capitalize ${vehicleType === type ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`}>
                {type}
              </button>
            ))}
          </div>
          {vehicleType !== 'motorcycle' && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {VEHICLE_SIZES.map((size) => (
                <button key={size.id} onClick={() => { setVehicleSize(size.id); setSelectedServices([]); }} className={`rounded-lg border px-2 py-2 text-xs font-bold ${vehicleSize === size.id ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-300 bg-white text-slate-700'}`}>
                  {size.label}
                </button>
              ))}
            </div>
          )}
          <input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="Vehicle plate number" className="mt-3 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-mono font-bold uppercase text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Services & Packages</h2>
            <div className="relative w-52">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services" className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-2 py-1.5 text-[11px] text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          {Object.entries(groupedServices).map(([category, items]) => (
            <section key={category} className="mb-4">
              <h3 className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map((service) => {
                  const selected = selectedServices.some((item) => item.id === service.id);
                  const price = getPrice(service, vehicleType, vehicleSize);
                  return <button key={service.id} onClick={() => toggleService(service)} className={`text-left rounded-xl border p-4 min-h-28 transition ${selected ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-300 bg-white hover:border-blue-300 hover:shadow-sm'}`}>
                    <div className="flex justify-between gap-2"><span className="text-[9px] font-extrabold uppercase text-blue-700">{category}</span>{selected && <Check className="w-4 h-4 text-blue-700" />}</div>
                    <div className="mt-3 text-xs font-bold text-slate-900">{service.name}</div>
                    {service.description && <div className="mt-1 text-[10px] leading-4 text-slate-600 line-clamp-2">{service.description}</div>}
                    <div className="mt-2 text-sm font-mono font-black text-slate-950">₱{price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                  </button>;
                })}
              </div>
            </section>
          ))}
          {services.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-xs font-medium text-slate-600">No services match the current vehicle selection.</div>}
        </div>
      </div>

      <div className="w-80 shrink-0 h-full bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
        <div className="p-4 border-b border-slate-200"><h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Current Order</h2><p className="text-[10px] text-slate-600 mt-1">{vehicleType === 'motorcycle' ? 'Motorcycle pricing' : `${vehicleSize.toUpperCase()} vehicle pricing`}</p></div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {selectedServices.length === 0 ? <div className="py-12 text-center text-xs text-slate-500">Select services to build the order.</div> : selectedServices.map((service) => <div key={service.id} className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex justify-between gap-2"><span className="text-xs font-bold text-slate-800">{service.name}</span><span className="text-xs font-mono font-bold text-slate-900">₱{getPrice(service, vehicleType, vehicleSize).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div>)}
        </div>
        <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex justify-between text-sm font-black text-slate-950"><span>Total</span><span className="text-blue-700 font-mono">₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div>
          {message && <div className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-[11px] font-medium text-slate-700">{message}</div>}
          <button onClick={completeOrder} disabled={!plate.trim() || selectedServices.length === 0 || saving} className="w-full rounded-lg bg-blue-600 py-3 text-xs font-extrabold text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 flex items-center justify-center gap-2">
            {saving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <CircleDollarSign className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Complete Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
