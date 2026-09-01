'use client';

import { useState } from 'react';
import { Award, Search, Car, Calendar, ShieldCheck } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  plate: string;
  vehicle: string;
  stamps: number;
  totalVisits: number;
  lastVisit: string;
}

const CLIENTS: Client[] = [
  {
    id: 'c-1',
    name: 'Juan Dela Cruz',
    plate: 'FAB 7365',
    vehicle: 'Toyota Vios • White',
    stamps: 7,
    totalVisits: 14,
    lastVisit: 'Aug 29, 2026'
  },
  {
    id: 'c-2',
    name: 'Marco Santos',
    plate: 'MC 4521',
    vehicle: 'Yamaha Aerox • Black',
    stamps: 4,
    totalVisits: 6,
    lastVisit: 'Aug 31, 2026'
  }
];

export default function ClientsPage() {
  const [search, setSearch] = useState('');

  const filteredClients = CLIENTS.filter(
    c => c.name.toLowerCase().includes(search.toLowerCase()) || c.plate.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full w-full p-6 space-y-6 overflow-y-auto bg-slate-50/60 font-sans select-none">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-lg font-black text-slate-900">Loyalty Cards & Client Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track plate stamp cards and visit history.
          </p>
        </div>
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Plate or Client Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Client List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black bg-blue-600 text-white px-2 py-0.5 rounded">
                    {client.plate}
                  </span>
                  <h3 className="text-xs font-extrabold text-slate-900">{client.name}</h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{client.vehicle}</p>
              </div>
              <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                {client.stamps} / 11 Stamps
              </span>
            </div>

            {/* Stamp Card Grid Visual */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Stamp Progress</span>
              <div className="flex gap-1.5 flex-wrap">
                {Array.from({ length: 11 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold ${
                      idx < client.stamps
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-medium">
              <span>Total Visits: <b className="text-slate-800 font-bold">{client.totalVisits}</b></span>
              <span>Last Visit: <b className="text-slate-800 font-bold">{client.lastVisit}</b></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}