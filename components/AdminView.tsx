'use client';

import { Ticket } from './CashierView';
import { DollarSign, Car, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  tickets: Ticket[];
  onUpdateStatus: (id: string, newStatus: Ticket['status']) => void;
}

export default function AdminView({ tickets, onUpdateStatus }: Props) {
  const totalRevenue = tickets.reduce((acc, t) => acc + t.total, 0);
  const activeQueue = tickets.filter((t) => t.status !== 'Completed');

  return (
    <div className="h-full p-6 space-y-6 overflow-y-auto">
      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Today's Revenue</span>
            <span className="text-2xl font-bold text-zinc-100 font-mono">${totalRevenue}</span>
          </div>
          <DollarSign className="w-5 h-5 text-zinc-500" />
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Cars Serviced</span>
            <span className="text-2xl font-bold text-zinc-100 font-mono">{tickets.length}</span>
          </div>
          <Car className="w-5 h-5 text-zinc-500" />
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Active Queue</span>
            <span className="text-2xl font-bold text-zinc-100 font-mono">{activeQueue.length}</span>
          </div>
          <Clock className="w-5 h-5 text-zinc-500" />
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Completed Today</span>
            <span className="text-2xl font-bold text-zinc-100 font-mono">
              {tickets.filter((t) => t.status === 'Completed').length}
            </span>
          </div>
          <CheckCircle2 className="w-5 h-5 text-zinc-500" />
        </div>
      </div>

      {/* Queue Management Table */}
      <div className="border border-zinc-800 bg-zinc-900 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
          <span className="text-xs font-mono font-bold uppercase text-zinc-300">
            Live Wash Bay Operations
          </span>
          <span className="text-[10px] font-mono text-zinc-500">Click status to advance vehicle stage</span>
        </div>

        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-500 text-[10px] uppercase">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">License Plate</th>
              <th className="p-3">Type</th>
              <th className="p-3">Services</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-zinc-600">
                  No transaction history recorded yet.
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/30 transition">
                  <td className="p-3 text-zinc-500">{t.time}</td>
                  <td className="p-3 font-bold text-zinc-200">{t.plate}</td>
                  <td className="p-3 text-zinc-400 uppercase">{t.vehicleType}</td>
                  <td className="p-3 text-zinc-400">{t.services.join(', ')}</td>
                  <td className="p-3 font-bold text-zinc-100">${t.total}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {(['Queued', 'In Bay', 'Completed'] as const).map((stage) => (
                        <button
                          key={stage}
                          onClick={() => onUpdateStatus(t.id, stage)}
                          className={`px-2 py-1 rounded text-[10px] border transition ${
                            t.status === stage
                              ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-bold'
                              : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {stage}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}