'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  BarChart3,
  Car,
  ChevronRight,
  Clock3,
  Droplets,
  Package,
  ShoppingCart,
  Users,
  Wallet,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

const stats = [
  { label: "Today's Sales", value: '₱12,480', change: '+12.5%', icon: Wallet, href: '/history' },
  { label: 'Vehicles Washed', value: '38', change: '+8 today', icon: Car, href: '/' },
  { label: 'Active Queue', value: '7', change: '3 washing', icon: Clock3, href: '/queue' },
  { label: 'Customers', value: '284', change: '+6 this week', icon: Users, href: '/clients' },
];

const quickActions = [
  { title: 'POS Terminal', description: 'Start a new carwash transaction', href: '/', icon: ShoppingCart },
  { title: 'Customers', description: 'View clients, vehicles and loyalty', href: '/clients', icon: Users },
  { title: 'Inventory', description: 'Check stock and restocking needs', href: '/inventory', icon: Package },
  { title: 'Analytics', description: 'Review sales and service performance', href: '/analytics', icon: BarChart3 },
];

const recentTransactions = [
  { id: '#TX-1048', customer: 'Juan Dela Cruz', service: 'Package 2', amount: '₱300', time: '2 min ago' },
  { id: '#TX-1047', customer: 'Marco Santos', service: 'Package 1 + Sanitizer', amount: '₱180', time: '8 min ago' },
  { id: '#TX-1046', customer: 'Ana Reyes', service: 'Package 3', amount: '₱550', time: '14 min ago' },
  { id: '#TX-1045', customer: 'Walk-in', service: 'Express Wash', amount: '₱150', time: '21 min ago' },
];

const inventoryAlerts = [
  { name: 'Nano Graphene Coating Formula', stock: '2 bottles', severity: 'Critical' },
  { name: 'Tire Shine & Degreaser Solution', stock: '3.2 L', severity: 'Low' },
];

export default function Dashboard() {
  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 font-sans">
      <div className="mx-auto max-w-7xl p-5 md:p-7 space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">Manager Overview</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Good evening, Mr. DM</h1>
            <p className="mt-1 text-sm text-slate-500">Here is what is happening at the carwash today.</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-700"
          >
            <ShoppingCart className="h-4 w-4" />
            Open POS Terminal
          </Link>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-blue-500" />
                </div>
                <p className="mt-4 text-xs font-semibold text-slate-500">{stat.label}</p>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <p className="text-xl font-black tracking-tight text-slate-900">{stat.value}</p>
                  <span className="text-[10px] font-bold text-emerald-600">{stat.change}</span>
                </div>
              </Link>
            );
          })}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">Quick Access</h2>
              <p className="text-xs text-slate-500">Jump directly to the area you need.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/30"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
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

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-black text-slate-900">Recent Transactions</h2>
                <p className="text-[11px] text-slate-500">Latest completed sales</p>
              </div>
              <Link href="/history" className="text-[11px] font-bold text-blue-600 hover:text-blue-700">View all</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Droplets className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-extrabold text-slate-800">{tx.customer}</p>
                      <span className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-500 sm:inline">{tx.id}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500">{tx.service} · {tx.time}</p>
                  </div>
                  <p className="text-xs font-black font-mono text-slate-900">{tx.amount}</p>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-slate-900">Today at a glance</h2>
                  <p className="text-[11px] text-slate-500">Simple operating metrics</p>
                </div>
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-1.5 flex justify-between text-[10px] font-bold text-slate-500"><span>Capacity used</span><span>68%</span></div>
                  <div className="h-2 rounded-full bg-slate-100"><div className="h-2 w-[68%] rounded-full bg-blue-600" /></div>
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-[10px] font-bold text-slate-500"><span>Daily sales target</span><span>78%</span></div>
                  <div className="h-2 rounded-full bg-slate-100"><div className="h-2 w-[78%] rounded-full bg-emerald-500" /></div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-black text-slate-900">Inventory attention</h2>
                  <p className="mt-0.5 text-[11px] text-slate-600">{inventoryAlerts.length} items need review.</p>
                  <div className="mt-3 space-y-2">
                    {inventoryAlerts.map((item) => (
                      <Link key={item.name} href="/inventory" className="flex items-center justify-between gap-3 rounded-xl bg-white/70 p-2.5 hover:bg-white">
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-extrabold text-slate-800">{item.name}</p>
                          <p className="text-[9px] text-slate-500">{item.stock}</p>
                        </div>
                        <span className="shrink-0 text-[9px] font-black uppercase text-amber-700">{item.severity}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-center gap-2 pb-2 text-[10px] font-medium text-slate-400">
          <span>Mr. DM's Carwash</span>
          <span>•</span>
          <span>Manager dashboard</span>
        </div>
      </div>
    </div>
  );
}
