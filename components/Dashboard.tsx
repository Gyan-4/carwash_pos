'use client';

import Link from 'next/link';
import { BarChart3, Car, Clock3, Package, ShoppingCart, Users, Wallet, ChevronRight } from 'lucide-react';

const quickActions = [
  { title: 'POS Terminal', description: 'Start a new carwash transaction', href: '/', icon: ShoppingCart },
  { title: 'Customers', description: 'View customers and vehicles', href: '/clients', icon: Users },
  { title: 'Inventory', description: 'Manage stock and supplies', href: '/inventory', icon: Package },
  { title: 'Analytics', description: 'View sales and performance', href: '/analytics', icon: BarChart3 },
];

const overview = [
  { label: "Today's Sales", value: '—', note: 'No sales yet', icon: Wallet, href: '/history' },
  { label: 'Vehicles Washed', value: '—', note: 'No records yet', icon: Car, href: '/history' },
  { label: 'Active Queue', value: '—', note: 'No vehicles queued', icon: Clock3, href: '/queue' },
  { label: 'Customers', value: '—', note: 'No customers yet', icon: Users, href: '/clients' },
];

export default function Dashboard() {
  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 font-sans">
      <div className="mx-auto max-w-7xl space-y-6 p-5 md:p-7">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">Manager Overview</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Your carwash overview will appear here as real transactions are recorded.</p>
          </div>
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-700">
            <ShoppingCart className="h-4 w-4" /> Open POS Terminal
          </Link>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {overview.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-xs font-semibold text-slate-500">{item.label}</p>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <p className="text-xl font-black tracking-tight text-slate-900">{item.value}</p>
                  <span className="text-[10px] font-bold text-slate-400">{item.note}</span>
                </div>
              </Link>
            );
          })}
        </section>

        <section>
          <div className="mb-3">
            <h2 className="text-sm font-black text-slate-900">Quick Access</h2>
            <p className="text-xs text-slate-500">Open the area you need without navigating through multiple menus.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/30">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-slate-900">{action.title}</p>
                    <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{action.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
          <h2 className="mt-3 text-sm font-black text-slate-800">No business data yet</h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">Sales, customers, queue activity, inventory alerts, and analytics will appear here once the POS starts storing real records.</p>
          <Link href="/" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-blue-700">
            <ShoppingCart className="h-4 w-4" /> Create First Transaction
          </Link>
        </section>
      </div>
    </div>
  );
}
