'use client';

import { useState } from 'react';
import { Clock, CheckCircle2, Play, AlertCircle, Car, User } from 'lucide-react';

interface QueueItem {
  id: string;
  ticketNo: string;
  plate: string;
  clientName: string;
  vehicle: string;
  service: string;
  status: 'waiting' | 'washing' | 'completed';
  washer: string;
  timeIn: string;
}

const INITIAL_QUEUE: QueueItem[] = [
  {
    id: 'q-1',
    ticketNo: '#12',
    plate: 'FAB 7365',
    clientName: 'Juan Dela Cruz',
    vehicle: 'Toyota Vios • Sedan',
    service: 'Package 3: Wash, Interior & Hand Wax',
    status: 'washing',
    washer: 'Mark Santos',
    timeIn: '10:45 AM'
  },
  {
    id: 'q-2',
    ticketNo: '#13',
    plate: 'MC-8890',
    clientName: 'Pedro Penduko',
    vehicle: 'Yamaha NMAX • Motorcycle',
    service: 'Package 1: Express Wash',
    status: 'waiting',
    washer: 'Unassigned',
    timeIn: '11:02 AM'
  },
  {
    id: 'q-3',
    ticketNo: '#14',
    plate: 'NDG 4120',
    clientName: 'Maria Clara',
    vehicle: 'Fortuner • SUV',
    service: 'Graphene Coating Campaign',
    status: 'waiting',
    washer: 'John Doe',
    timeIn: '11:15 AM'
  }
];

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE);

  const updateStatus = (id: string, newStatus: 'washing' | 'completed') => {
    setQueue(prev =>
      prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
    );
  };

  return (
    <div className="h-full w-full p-6 space-y-6 overflow-y-auto bg-slate-50/60 font-sans select-none">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-lg font-black text-slate-900">Active Bay Operations & Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor live wash bay statuses and update vehicle progress.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl text-xs font-extrabold border border-amber-200">
            2 Vehicles Waiting
          </span>
          <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-extrabold border border-blue-200">
            1 Washing Bay Active
          </span>
        </div>
      </div>

      {/* Queue Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {queue.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-2xl border transition space-y-4 bg-white shadow-sm ${
              item.status === 'washing'
                ? 'border-blue-500 ring-2 ring-blue-500/10'
                : item.status === 'completed'
                ? 'border-emerald-200 bg-emerald-50/20'
                : 'border-slate-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xl font-black font-mono text-slate-900 block">
                  {item.ticketNo}
                </span>
                <span className="font-mono text-xs font-black bg-blue-600 text-white px-2 py-0.5 rounded mt-1 inline-block">
                  {item.plate}
                </span>
              </div>
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                  item.status === 'washing'
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : item.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-amber-50 text-amber-600 border-amber-200'
                }`}
              >
                {item.status}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-extrabold text-slate-800">{item.clientName}</h3>
              <p className="text-[11px] text-slate-500">{item.vehicle}</p>
              <p className="text-xs font-bold text-blue-600 pt-1">{item.service}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{item.washer}</span>
              </div>
              <span className="font-mono">{item.timeIn}</span>
            </div>

            {/* Action Buttons */}
            {item.status === 'waiting' && (
              <button
                onClick={() => updateStatus(item.id, 'washing')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" /> Start Wash
              </button>
            )}

            {item.status === 'washing' && (
              <button
                onClick={() => updateStatus(item.id, 'completed')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}