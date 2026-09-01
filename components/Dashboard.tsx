'use client';

import { useState } from 'react';
import Header from './Header';
import VehicleSelector from './VehicleSelector';
import TechnicianSelector from './TechnicianSelector';
import ActiveQueue, { OrderTicket } from './ActiveQueue';
import { Plus } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  category: 'Wash' | 'Detailing' | 'Add-on';
  prices: { sedan: number; suv: number; truck: number };
}

const SERVICES: Service[] = [
  { id: '1', name: 'Express Wash', category: 'Wash', prices: { sedan: 15, suv: 20, truck: 25 } },
  { id: '2', name: 'Full Interior & Exterior', category: 'Wash', prices: { sedan: 35, suv: 45, truck: 55 } },
  { id: '3', name: 'Paint Correction & Wax', category: 'Detailing', prices: { sedan: 120, suv: 160, truck: 200 } },
  { id: '4', name: 'Engine Bay Wash', category: 'Detailing', prices: { sedan: 40, suv: 50, truck: 60 } },
  { id: '5', name: 'Tire Shine & Dress', category: 'Add-on', prices: { sedan: 10, suv: 10, truck: 10 } },
  { id: '6', name: 'Cabin Sanitization', category: 'Add-on', prices: { sedan: 20, suv: 25, truck: 30 } },
];

export default function Dashboard() {
  const [vehicleType, setVehicleType] = useState<'sedan' | 'suv' | 'truck'>('sedan');
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [plate, setPlate] = useState('');
  const [technician, setTechnician] = useState('Unassigned');
  const [orders, setOrders] = useState<OrderTicket[]>([]);

  const toggleService = (s: Service) => {
    setSelectedServices((prev) =>
      prev.some((item) => item.id === s.id)
        ? prev.filter((item) => item.id !== s.id)
        : [...prev, s]
    );
  };

  const total = selectedServices.reduce((acc, s) => acc + s.prices[vehicleType], 0);

  const handleCheckout = () => {
    if (!plate) return alert('Enter plate number');
    if (selectedServices.length === 0) return alert('Select services');

    const newTicket: OrderTicket = {
      id: Date.now().toString(),
      plate: plate.toUpperCase(),
      total,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Queued',
    };

    setOrders([newTicket, ...orders]);
    setPlate('');
    setSelectedServices([]);
  };

  const advanceStatus = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const nextStatus =
          o.status === 'Queued' ? 'In Progress' : o.status === 'In Progress' ? 'Done' : 'Done';
        return { ...o, status: nextStatus };
      })
    );
  };

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Workspace */}
        <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-500 block mb-2">
              Vehicle Classification
            </label>
            <VehicleSelector selected={vehicleType} onSelect={setVehicleType} />
          </div>

          <div className="flex-1">
            <label className="text-[10px] font-mono uppercase text-zinc-500 block mb-2">
              Available Services
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
                        ? 'bg-zinc-900 border-zinc-100'
                        : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="text-[9px] font-mono uppercase text-zinc-500 mb-1">{s.category}</div>
                      <div className="text-xs font-semibold text-zinc-200">{s.name}</div>
                    </div>
                    <div className="text-sm font-mono font-bold text-zinc-100 mt-4">
                      ${s.prices[vehicleType]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Right Checkout Panel */}
        <aside className="w-80 border-l border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between gap-6">
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

            <TechnicianSelector selected={technician} onSelect={setTechnician} />

            <div className="border border-zinc-800 rounded p-3 bg-zinc-900/50 space-y-2">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Summary</div>
              {selectedServices.length === 0 ? (
                <div className="text-xs text-zinc-600 font-mono py-1">No services selected</div>
              ) : (
                selectedServices.map((s) => (
                  <div key={s.id} className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-400">{s.name}</span>
                    <span className="text-zinc-200">${s.prices[vehicleType]}</span>
                  </div>
                ))
              )}
            </div>

            <ActiveQueue orders={orders} onUpdateStatus={advanceStatus} />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-4 font-mono">
              <span className="text-xs text-zinc-500 uppercase">Total</span>
              <span className="text-2xl font-bold text-zinc-100">${total}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-mono font-bold py-3 rounded text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Issue Ticket
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}