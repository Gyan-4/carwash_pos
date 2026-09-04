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
    setMessage('');
  };

  const changeVehicleSize = (size: VehicleSize) => {
    setVehicleSize(size);
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
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-950">POS Terminal</h1>
              <p className="mt-1 text-xs font-medium text-slate-600">Select the vehicle class, size, and service package.</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <Car className="w-5 h-5 text-blue-700" />
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-700">Vehicle type</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['motorcycle', 'sedan', 'suv', 'truck'] as VehicleType[]).map((type) => (
                <button key={type} onClick={() => changeVehicleType(type)} className={`rounded-lg border px-3 py-2.5 text-xs font-extrabold capitalize transition ${vehicleType === type ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50'}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          {vehicleType !== 'motorcycle' && (
            <div className="mt-4">
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-700">Vehicle size</div>
              <div className="grid grid-cols-5 gap-2">
                {VEHICLE_SIZES.map((size) => (
                  <button key={size.id} onClick={() => changeVehicleSize(size.id)} className={`rounded-lg border px-2 py-2.5 text-xs font-extrabold transition ${vehicleSize === size.id ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50'}`}>
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-700">Vehicle plate</div>
            <input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="Enter vehicle plate number" className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 text-xs font-mono font-bold uppercase text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold tracking-tight text-slate-950">Services & Packages</h2>
              <p className="mt-0.5 text-[11px] font-medium text-slate-600">Choose one or more services for this order.</p>
            </div>
            <div className="relative w-52">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services" className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-2 py-2 text-[11px] font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          {Object.entries(groupedServices).map(([category, items]) => (
            <section key={category} className="mb-4">
              <h3 className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-700">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map((service) => {
                  const selected = selectedServices.some((item) => item.id === service.id);
                  const price = getPrice(service, vehicleType, vehicleSize);
                  return <button key={service.id} onClick={() => toggleService(service)} className={`text-left rounded-xl border p-4 min-h-28 transition ${selected ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-300 bg-white hover:border-blue-300 hover:shadow-sm'}`}>
                    <div className="flex justify-between gap-2"><span className="text-[9px] font-extrabold uppercase tracking-wide text-blue-700">{category}</span>{selected && <Check className="w-4 h-4 text-blue-700" />}</div>
                    <div className="mt-3 text-xs font-extrabold text-slate-950">{service.name}</div>
                    {service.description && <div className="mt-1 text-[10px] leading-4 font-medium text-slate-600 line-clamp-2">{service.description}</div>}
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
        <div className="p-4 border-b border-slate-200"><h2 className="text-sm font-extrabold tracking-tight text-slate-950">Current Order</h2><p className="text-[10px] font-medium text-slate-600 mt-1">{vehicleType === 'motorcycle' ? 'Motorcycle pricing' : `${vehicleSize.toUpperCase()} vehicle pricing`}</p></div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {selectedServices.length === 0 ? <div className="py-12 text-center text-xs font-medium text-slate-500">Select services to build the order.</div> : selectedServices.map((service) => <div key={service.id} className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex justify-between gap-2"><span className="text-xs font-bold text-slate-800">{service.name}</span><span className="text-xs font-mono font-bold text-slate-900">₱{getPrice(service, vehicleType, vehicleSize).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div>)}
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
