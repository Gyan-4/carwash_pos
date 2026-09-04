'use client';

import Link from 'next/link';
import { BarChart3, Car, Wallet, TrendingUp, ShoppingCart } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-5 md:p-7">
        <header>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">Analytics</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Sales & Performance</h1>
          <p className="mt-1 text-sm text-slate-500">Real metrics will appear here when transaction records are available.</p>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Sales', icon: Wallet },
            { label: 'Vehicles Serviced', icon: Car },
            { label: 'Average Transaction', icon: TrendingUp },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{item.label}</span>
                  <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-3 text-2xl font-black tracking-tight text-slate-900">—</p>
                <p className="mt-1 text-[10px] font-bold text-slate-400">No data yet</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <BarChart3 className="mx-auto h-9 w-9 text-slate-300" />
          <h2 className="mt-3 text-sm font-black text-slate-800">Analytics will appear here</h2>
          <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-slate-500">There are no transaction records yet. Once completed POS sales are stored in MongoDB, this page can calculate daily sales, service mix, customer activity, and performance trends.</p>
          <Link href="/" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-blue-700">
            <ShoppingCart className="h-4 w-4" /> Open POS
          </Link>
        </section>
      </div>
    </div>
  );
}
