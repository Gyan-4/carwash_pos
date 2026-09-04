'use client';

import { useEffect, useMemo, useState } from 'react';
import { Car, Check, CircleDollarSign, RotateCcw, Search, UserRound, X } from 'lucide-react';
import { conflictsWithSelection, findPackageUpgrade, getPrice, hasPrice, packageContainsSelection, SERVICE_CATALOG, VEHICLE_SIZES, type CatalogItem, type VehicleSize, type VehicleType } from '@/lib/serviceCatalog';

type CustomerVehicle = { plate: string; vehicleType: string; vehicleSize?: string; visitCount: number; lastVisitAt?: string };
type CustomerMatch = { _id: string; name: string; vehicles: CustomerVehicle[]; totalVisits: number };

export default function POSInterface() {
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan');
  const [vehicleSize, setVehicleSize] = useState<VehicleSize>('medium');
  const [plate, setPlate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMatch, setCustomerMatch] = useState<CustomerMatch | null>(null);
  const [lookingUpCustomer, setLookingUpCustomer] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedServices, setSelectedServices] = useState<CatalogItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const normalizedPlate = plate.trim().toUpperCase();
    if (!normalizedPlate) {
      setCustomerMatch(null);
      setLookingUpCustomer(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLookingUpCustomer(true);
      try {
        const response = await fetch(`/api/customers?q=${encodeURIComponent(normalizedPlate)}`, { cache: 'no-store' });
        const data = await response.json();
        if (cancelled) return;
        const match = (data.customers || []).find((customer: CustomerMatch) =>
          customer.vehicles?.some((vehicle) => vehicle.plate.toUpperCase() === normalizedPlate),
        ) as CustomerMatch | undefined;
        setCustomerMatch(match || null);
        if (match) {
          setCustomerName(match.name === 'Walk-in Customer' ? '' : match.name);
          const vehicle = match.vehicles.find((item) => item.plate.toUpperCase() === normalizedPlate);
          if (vehicle) {
            if (vehicle.vehicleType) setVehicleType(vehicle.vehicleType as VehicleType);
            if (vehicle.vehicleSize && vehicle.vehicleType !== 'motorcycle') setVehicleSize(vehicle.vehicleSize as VehicleSize);
          }
        } else {
          setCustomerMatch(null);
        }
      } catch {
        if (!cancelled) setCustomerMatch(null);
      } finally {
        if (!cancelled) setLookingUpCustomer(false);
      }
    }, 250);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [plate]);

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

  const orderItems = useMemo(() => selectedServices.map((service) => ({
    service,
    available: hasPrice(service, vehicleType, vehicleSize),
    price: getPrice(service, vehicleType, vehicleSize),
  })), [selectedServices, vehicleType, vehicleSize]);

  const subtotal = orderItems.reduce((sum, item) => sum + (item.available ? item.price : 0), 0);
  const hasUnavailableItems = orderItems.some((item) => !item.available);

  const changeVehicleType = (type: VehicleType) => {
    setVehicleType(type);
    setMessage('');
  };

  const changeVehicleSize = (size: VehicleSize) => {
    setVehicleSize(size);
    setMessage('');
  };

  const toggleService = (service: CatalogItem) => {
    if (selectedServices.some((item) => item.id === service.id)) {
      setSelectedServices((current) => current.filter((item) => item.id !== service.id));
      setMessage('');
      return;
    }

    const isPackage = service.category === 'Car Wash Packages' || service.category === 'Premium Wash' || service.category === 'Motorcycle';
    const selectedPackages = selectedServices.filter((item) => item.category === 'Car Wash Packages' || item.category === 'Premium Wash' || item.category === 'Motorcycle');

    if (isPackage) {
      const withoutPackages = selectedServices.filter((item) => !selectedPackages.some((pkg) => pkg.id === item.id));
      const packageComponents = new Set(service.components ?? []);
      const keptExtras = withoutPackages.filter((item) => {
        if (!item.components?.length) return true;
        return !item.components.some((component) => packageComponents.has(component));
      });
      setSelectedServices([...keptExtras, service]);
      setMessage(`Package selected: ${service.name}.`);
      return;
    }

    const upgrade = findPackageUpgrade([...selectedServices, service], vehicleType, vehicleSize);
    if (upgrade) {
      const upgradeComponents = new Set(upgrade.components ?? []);
      const replaced = selectedServices.filter((item) => {
        if (!item.components?.length) return true;
        return !item.components.some((component) => upgradeComponents.has(component));
      });
      setSelectedServices([...replaced, upgrade]);
      setMessage(`Package selected: ${upgrade.name}.`);
      return;
    }

    const selectedPackage = selectedServices.find((item) =>
      (item.category === 'Car Wash Packages' || item.category === 'Premium Wash' || item.category === 'Motorcycle') && packageContainsSelection(item, [service]),
    );
    if (selectedPackage) {
      setMessage(`${service.name} is already included in ${selectedPackage.name}.`);
      return;
    }

    setSelectedServices((current) => [...current, service]);
    setMessage('');
  };

  async function completeOrder() {
    if (!plate.trim() || selectedServices.length === 0 || saving || hasUnavailableItems) return;
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate,
          customerName: customerName.trim(),
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
      setCustomerName('');
      setCustomerMatch(null);
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
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">POS Terminal</h1>
              <p className="mt-0.5 text-xs text-slate-500">Select the vehicle, customer, and service package.</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <Car className="w-5 h-5 text-blue-700" />
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-800">Vehicle type</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['motorcycle', 'sedan', 'suv', 'truck'] as VehicleType[]).map((type) => (
                <button key={type} onClick={() => changeVehicleType(type)} className={`rounded-lg border px-3 py-2.5 text-xs font-bold capitalize transition ${vehicleType === type ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50'}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          {vehicleType !== 'motorcycle' && (
            <div className="mt-4">
              <div className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-800">Vehicle size</div>
              <div className="grid grid-cols-5 gap-2">
                {VEHICLE_SIZES.map((size) => (
                  <button key={size.id} onClick={() => changeVehicleSize(size.id)} className={`rounded-lg border px-2 py-2.5 text-xs font-bold transition ${vehicleSize === size.id ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50'}`}>
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-800">Vehicle plate</div>
              <input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="Enter plate number" className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 text-xs font-bold uppercase text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <div className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-800">Customer name <span className="font-medium normal-case tracking-normal text-slate-400">(optional)</span></div>
              <div className="relative">
                <UserRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input value={customerName} onChange={(e) => { setCustomerName(e.target.value); setCustomerMatch(null); }} placeholder="Customer name" className="w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
          </div>

          {plate.trim() && <div className={`mt-3 flex items-center justify-between rounded-lg border px-3 py-2.5 ${customerMatch ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
            {lookingUpCustomer ? <span className="text-[10px] font-medium text-slate-500">Checking plate...</span> : customerMatch ? <div><div className="text-[11px] font-extrabold text-blue-900">Existing customer found: {customerMatch.name}</div><div className="text-[10px] text-blue-700">{customerMatch.vehicles.find(v => v.plate.toUpperCase() === plate.trim().toUpperCase())?.vehicleType || 'Vehicle'} • {customerMatch.totalVisits} previous visit{customerMatch.totalVisits === 1 ? '' : 's'}</div></div> : <span className="text-[10px] font-medium text-slate-500">New plate — enter a customer name if available.</span>}
          </div>}
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
                  const conflict = !selected && conflictsWithSelection(service, selectedServices);
                  const price = getPrice(service, vehicleType, vehicleSize);
                  return <button key={service.id} onClick={() => toggleService(service)} className={`text-left rounded-xl border p-4 min-h-28 transition ${selected ? 'border-blue-600 bg-blue-50 shadow-sm' : conflict ? 'border-slate-200 bg-slate-100/80 opacity-60' : 'border-slate-300 bg-white hover:border-blue-300 hover:shadow-sm'}`}>
                    <div className="flex justify-between gap-2"><span className="text-[9px] font-extrabold uppercase tracking-wide text-blue-700">{category}</span>{selected && <Check className="w-4 h-4 text-blue-700" />}</div>
                    <div className="mt-3 text-xs font-extrabold text-slate-950">{service.name}</div>
                    {service.description && <div className="mt-1 text-[10px] leading-4 font-medium text-slate-600 line-clamp-2">{service.description}</div>}
                    {conflict ? <div className="mt-2 text-[10px] font-semibold text-slate-500">Already covered by current selection</div> : <div className="mt-2 text-sm font-mono font-black text-slate-950">₱{price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>}
                  </button>;
                })}
              </div>
            </section>
          ))}
          {services.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-xs font-medium text-slate-600">No services match the current vehicle selection.</div>}
        </div>
      </div>

      <div className="w-80 shrink-0 h-full bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
        <div className="p-4 border-b border-slate-200"><h2 className="text-sm font-extrabold tracking-tight text-slate-950">Current Order</h2><p className="text-[10px] font-medium text-slate-600 mt-1">{customerName ? customerName : 'Walk-in Customer'} • {plate || 'No plate'}</p><p className="text-[10px] font-medium text-slate-500 mt-0.5">{vehicleType === 'motorcycle' ? 'Motorcycle pricing' : `${vehicleSize.toUpperCase()} vehicle pricing`}</p></div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {orderItems.length === 0 ? <div className="py-12 text-center text-xs font-medium text-slate-500">Select services to build the order.</div> : orderItems.map(({ service, available, price }) => <div key={service.id} className={`rounded-lg bg-slate-50 border border-slate-200 p-3 flex justify-between gap-2 ${available ? '' : 'bg-amber-50 border-amber-200'}`}><div className="min-w-0"><span className="text-xs font-bold text-slate-800">{service.name}</span>{!available && <div className="mt-1 text-[10px] font-medium text-amber-700">Not available for {vehicleType}. Switch back or remove.</div>}</div><div className="flex items-start gap-2"><span className="text-xs font-mono font-bold text-slate-900">{available ? `₱${price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'}</span><button onClick={() => toggleService(service)} className="text-slate-400 hover:text-red-600" aria-label={`Remove ${service.name}`}><X className="w-3.5 h-3.5" /></button></div></div>)}
        </div>
        <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
          {hasUnavailableItems && <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] font-medium text-amber-800">This order has a service from another vehicle type. Remove it before completing the order.</div>}
          {message && <div className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-[11px] font-medium text-slate-700">{message}</div>}
          <div className="flex justify-between text-sm font-black text-slate-950"><span>Total</span><span className="text-blue-700 font-mono">₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div>
          <button onClick={completeOrder} disabled={!plate.trim() || selectedServices.length === 0 || saving || hasUnavailableItems} className="w-full rounded-lg bg-blue-600 py-3 text-xs font-extrabold text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 flex items-center justify-center gap-2">
            {saving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <CircleDollarSign className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Complete Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
