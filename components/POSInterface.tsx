'use client';

import { useState } from 'react';
import { Car, Check, CircleDollarSign, RotateCcw } from 'lucide-react';

type VehicleType = 'motorcycle' | 'sedan' | 'suv' | 'truck';
interface ServiceItem { id: string; name: string; category: string; prices: Record<VehicleType, number>; }

// Temporary catalog. Replace these with the final packages/prices when provided.
const SERVICES: ServiceItem[] = [
  { id: '1', name: 'Temporary Package 1', category: 'Packages', prices: { motorcycle: 0, sedan: 0, suv: 0, truck: 0 } },
  { id: '2', name: 'Temporary Package 2', category: 'Packages', prices: { motorcycle: 0, sedan: 0, suv: 0, truck: 0 } },
  { id: '3', name: 'Temporary Add-on', category: 'Add-ons', prices: { motorcycle: 0, sedan: 0, suv: 0, truck: 0 } },
];

export default function POSInterface() {
  const [vehicleType, setVehicleType] = useState<VehicleType>('sedan');
  const [plate, setPlate] = useState('');
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const toggleService = (service: ServiceItem) => setSelectedServices((current) =>
    current.some((item) => item.id === service.id)
      ? current.filter((item) => item.id !== service.id)
      : [...current, service]
  );

  const subtotal = selectedServices.reduce((sum, service) => sum + service.prices[vehicleType], 0);

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
          services: selectedServices.map((service) => ({
            id: service.id,
            name: service.name,
            category: service.category,
            price: service.prices[vehicleType],
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
    <div className="w-full h-full flex gap-4 p-4 overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h1 className="text-sm font-black text-slate-900">POS Terminal</h1>
              <p className="text-[11px] text-slate-500">Create a transaction using the current temporary catalog.</p>
            </div>
            <Car className="w-5 h-5 text-blue-600" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(['motorcycle', 'sedan', 'suv', 'truck'] as VehicleType[]).map((type) => (
              <button key={type} onClick={() => setVehicleType(type)} className={`rounded-lg border px-3 py-2 text-xs font-bold capitalize ${vehicleType === type ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                {type}
              </button>
            ))}
          </div>
          <input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="Vehicle plate number" className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-mono font-bold uppercase focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Services</h2>
            <span className="text-[10px] text-slate-400">Temporary until final packages are provided</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SERVICES.map((service) => {
              const selected = selectedServices.some((item) => item.id === service.id);
              return <button key={service.id} onClick={() => toggleService(service)} className={`text-left rounded-xl border p-4 h-28 transition ${selected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <div className="flex justify-between"><span className="text-[9px] font-extrabold uppercase text-blue-600">{service.category}</span>{selected && <Check className="w-4 h-4 text-blue-600" />}</div>
                <div className="mt-5 text-xs font-bold text-slate-800">{service.name}</div>
                <div className="mt-1 text-xs font-mono font-extrabold text-slate-900">₱{service.prices[vehicleType].toFixed(2)}</div>
              </button>;
            })}
          </div>
        </div>
      </div>

      <div className="w-80 shrink-0 h-full bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
        <div className="p-4 border-b border-slate-100"><h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Current Order</h2></div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {selectedServices.length === 0 ? <div className="py-12 text-center text-xs text-slate-400">Select services to build the order.</div> : selectedServices.map((service) => <div key={service.id} className="rounded-lg bg-slate-50 border border-slate-100 p-3 flex justify-between gap-2"><span className="text-xs font-bold text-slate-700">{service.name}</span><span className="text-xs font-mono font-bold">₱{service.prices[vehicleType].toFixed(2)}</span></div>)}
        </div>
        <div className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-3">
          <div className="flex justify-between text-sm font-black"><span>Total</span><span className="text-blue-600 font-mono">₱{subtotal.toFixed(2)}</span></div>
          {message && <div className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-[11px] text-slate-600">{message}</div>}
          <button onClick={completeOrder} disabled={!plate.trim() || selectedServices.length === 0 || saving} className="w-full rounded-lg bg-blue-600 py-3 text-xs font-extrabold text-white disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-2">
            {saving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <CircleDollarSign className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Complete Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
