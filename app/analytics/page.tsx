'use client';

import Link from 'next/link';
import { BarChart3, TrendingUp, Car, Wallet, ArrowLeft, CalendarDays } from 'lucide-react';

const serviceMix = [
  { name: 'Package 1 · Express Wash', value: 42, sales: '₱5,460' },
  { name: 'Package 2 · Wash + Vacuum', value: 31, sales: '₱4,020' },
  { name: 'Package 3 · Full Service', value: 18, sales: '₱2,475' },
  { name: 'Add-ons & Detailing', value: 9, sales: '₱525' },
];

const dailySales = [
  { day: 'Mon', value: 58 },
  { day: 'Tue', value: 72 },
  { day: 'Wed', value: 64 },
  { day: 'Thu', value: 81 },
  { day: 'Fri', value: 68 },
  { day: 'Sat', value: 92 },
  { day: 'Sun', value: 78 },
];

export default function AnalyticsPage() {
  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-5 md:p-7">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">Analytics</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Sales & performance</h1>
            <p className="mt-1 text-sm text-slate-500">A simple view of how the carwash is performing.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            This week
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Weekly Sales', value: '₱78,420', note: '+14.2%', icon: Wallet },
            { label: 'Vehicles Serviced', value: '246', note: '+9.8%', icon: Car },
            { label: 'Avg. Transaction', value: '₱319', note: '+4.1%', icon: TrendingUp },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{item.label}</span>
                  <Icon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <span className="text-2xl font-black tracking-tight text-slate-900">{item.value}</span>
                  <span className="text-[10px] font-black text-emerald-600">{item.note}</span>
                </div>
              </div>
            );
          })}
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900">Sales this week</h2>
                <p className="text-[11px] text-slate-500">Relative daily sales volume</p>
              </div>
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="mt-7 flex h-52 items-end gap-2 sm:gap-4">
              {dailySales.map((item) => (
                <div key={item.day} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div className="text-[9px] font-bold text-slate-400">{item.value}%</div>
                  <div className="w-full max-w-10 rounded-t-lg bg-blue-600/90" style={{ height: `${item.value}%` }} />
                  <span className="text-[10px] font-bold text-slate-500">{item.day}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black text-slate-900">Service mix</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Share of completed sales</p>
            <div className="mt-5 space-y-4">
              {serviceMix.map((item) => (
                <div key={item.name}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="truncate text-[10px] font-bold text-slate-700">{item.name}</span>
                    <span className="shrink-0 text-[10px] font-black text-slate-900">{item.sales}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${item.value * 2.35}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <div>
            <p className="text-xs font-black text-slate-800">Need to make a sale?</p>
            <p className="mt-0.5 text-[10px] text-slate-500">Jump back to the POS terminal.</p>
          </div>
          <Link href="/" className="rounded-xl bg-blue-600 px-4 py-2.5 text-[11px] font-extrabold text-white hover:bg-blue-700">Open POS</Link>
        </div>

        <div className="pb-2 text-center text-[10px] text-slate-400">Analytics values are currently presentation data and should be connected to transaction records next.</div>
      </div>
    </div>
  );
}
