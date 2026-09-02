'use client';

import { useState } from 'react';
import { Plus, Check, Clock } from 'lucide-react';

export interface Ticket {
  id: string;
  plate: string;
  vehicleType: string;
  services: string[];
  total: number;
  time: string;
  status: 'Queued' | 'In Bay' | 'Completed';
}

interface Props {
  onIssueTicket: (ticket: Ticket) => void;
  activeTickets: Ticket[];
}

const SERVICES = [
  { id: '1', name: 'Express Exterior', category: 'Wash', prices: { sedan: 15, suv: 20, truck: 25 } },
  { id: '2', name: 'Full Interior & Wash', category: 'Wash', prices: { sedan: 35, suv: 45, truck: 55 } },
  { id: '3', name: 'Hand Wax & Polish', category: 'Detailing', prices: { sedan: 80, suv: 100, truck: 120 } },
  { id: '4', name: 'Engine Bay Clean', category: 'Detailing', prices: { sedan: 40, suv: 50, truck: 60 } },
  { id: '5', name: 'Tire & Trim Dressing', category: 'Add-on', prices: { sedan: 10, suv: 10, truck: 10 } },
  { id: '6', name: 'Ozone Deodorizer', category: 'Add-on', prices: { sedan: 20, suv: 25, truck: 30 } },
];

export default function CashierView({ onIssueTicket, activeTickets }: Props) {
  const [vehicleType, setVehicleType] = useState<'sedan' | 'suv' | 'truck'>('sedan');
  const [selectedServices, setSelectedServices] = useState<typeof SERVICES>([]);
  const [plate, setPlate] = useState('');

  const toggleService = (s: typeof SERVICES[0]) => {
    setSelectedServices((prev) =>
      prev.some((item) => item.id === s.id)
        ? prev.filter((item) => item.id !== s.id)
        : [...prev, s]
    );
  };

  const total = selectedServices.reduce((sum, s) => sum + s.prices[vehicleType], 0);

  const handleSubmit = () => {
    if (!plate) return alert('Enter vehicle license plate');
    if (selectedServices.length === 0) return alert('Select at least one service');

    onIssueTicket({
      id: Date.now().toString(),
      plate: plate.toUpperCase(),
      vehicleType,
      services: selectedServices.map((s) => s.name),
      total,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Queued',
    });

    setPlate('');
    setSelectedServices([]);
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Quick Checkout Register */}
      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        {/* Vehicle Type Switcher */}
        <div>
          <label className="text-[10px] font-mono uppercase text-zinc-500 block mb-2">
            1. Vehicle Size
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['sedan', 'suv', 'truck'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setVehicleType(type)}
                className={`py-3 rounded text-xs font-mono font-bold uppercase transition border ${
                  vehicleType === type
                    ? 'bg-zinc-100 text-zinc-950 border-zinc-100 shadow'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="flex-1">
          <label className="text-[10px] font-mono uppercase text-zinc-500 block mb-2">
            2. Select Services
          </label>
          <div className="grid grid-cols-3 gap-3">
            {SERVICES.map((s) => {
              const active = selectedServices.some((item) => item.id === s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggleService(s)}
                  className={`p-4 rounded border cursor-pointer transition flex flex-col justify-between ${
                    active
                      ? 'bg-zinc-900 border-zinc-100 ring-1 ring-zinc-100'
                      : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-mono uppercase text-zinc-500">{s.category}</span>
                    {active && <Check className="w-3.5 h-3.5 text-zinc-100" />}
                  </div>
                  <div className="text-xs font-semibold text-zinc-200 mt-2">{s.name}</div>
                  <div className="text-sm font-mono font-bold text-zinc-100 mt-4">
                    ${s.prices[vehicleType]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Checkout Sidebar */}
      <aside className="w-80 border-l border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-500 block mb-1.5">
              License Plate
            </label>
            <input
              type="text"
              placeholder="ABC-1234"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2.5 text-xs text-zinc-100 font-mono uppercase tracking-widest focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="border border-zinc-800 rounded p-3 bg-zinc-900/50 space-y-2 max-h-48 overflow-y-auto">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Ticket Summary</span>
            {selectedServices.length === 0 ? (
              <span className="text-xs text-zinc-600 font-mono block py-1">No services selected</span>
            ) : (
              selectedServices.map((s) => (
                <div key={s.id} className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">{s.name}</span>
                  <span className="text-zinc-200">${s.prices[vehicleType]}</span>
                </div>
              ))
            )}
          </div>

          {/* Quick Queue Overview */}
          <div className="border-t border-zinc-800 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Live Bay Status</span>
              <span className="text-xs font-mono text-zinc-400">{activeTickets.length} cars</span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {activeTickets.map((t) => (
                <div key={t.id} className="p-2 bg-zinc-900 border border-zinc-800 rounded flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-300 font-bold">{t.plate}</span>
                  <span className="text-[10px] text-zinc-500">{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-4 font-mono border-t border-zinc-800 pt-3">
            <span className="text-xs text-zinc-500 uppercase">Total</span>
            <span className="text-2xl font-bold text-zinc-100">${total}</span>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-mono font-bold py-3 rounded text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Issue Ticket
          </button>
        </div>
      </aside>
    </div>
  );
}