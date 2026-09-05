'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BarChart3, Car, Package, ShoppingCart, Users, Wallet, ChevronRight, RefreshCw } from 'lucide-react';

const quickActions = [
  { title: 'POS Terminal', description: 'Start a new carwash transaction', href: '/', icon: ShoppingCart },
  { title: 'Customers', description: 'View customers and vehicles', href: '/clients', icon: Users },
  { title: 'Inventory', description: 'Manage stock and supplies', href: '/inventory', icon: Package },
  { title: 'Analytics', description: 'View sales and performance', href: '/analytics', icon: BarChart3 },
];

type Breakdown = { name: string; count: number; sales: number };
type DashboardData = {
  overview: { sales: number; vehicles: number; customers: number };
  weeklySales: { date: string; sales: number; vehicles: number }[];
  recent: { transactionNo: string; plate: string; vehicleType: string; total: number; status: string; createdAt: string }[];
  serviceMix: Breakdown[];
  paymentMix: Breakdown[];
  vehicleMix: Breakdown[];
};

const money = (value: number) => `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const label = (value: string) => value.replace(/^./, (char) => char.toUpperCase());

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(showLoading = true) {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/dashboard', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load dashboard.');
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const refresh = () => load(false);
    const interval = window.setInterval(refresh, 5000);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  const overview = [
    { label: "Today's Sales", value: money(data?.overview.sales || 0), note: 'Completed transactions', icon: Wallet, href: '/history' },
    { label: 'Vehicles Washed', value: String(data?.overview.vehicles || 0), note: 'Today', icon: Car, href: '/history' },
    { label: 'Customers', value: String(data?.overview.customers || 0), note: 'Unique plates', icon: Users, href: '/clients' },
    { label: 'Services Sold', value: String(data?.serviceMix.reduce((sum, item) => sum + item.count, 0) || 0), note: 'All completed sales', icon: Package, href: '/analytics' },
  ];

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 font-sans">
      <div className="mx-auto max-w-7xl space-y-6 p-5 md:p-7">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">Manager Overview</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Dashboard</h1><p className="mt-1 text-sm text-slate-500">Live business information from your POS records.</p></div>
          <div className="flex gap-2"><button onClick={() => load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button><Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-700"><ShoppingCart className="h-4 w-4" /> Open POS Terminal</Link></div>
        </header>
        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{error}</div>}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{overview.map((item) => { const Icon = item.icon; return <Link key={item.label} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Icon className="h-5 w-5" /></div><p className="mt-4 text-xs font-semibold text-slate-500">{item.label}</p><div className="mt-1 flex items-end justify-between gap-2"><p className="text-xl font-black tracking-tight text-slate-900">{item.value}</p><span className="text-[10px] font-bold text-slate-400">{item.note}</span></div></Link>; })}</section>
        <section><div className="mb-3"><h2 className="text-sm font-black text-slate-900">Quick Access</h2><p className="text-xs text-slate-500">Open the area you need without navigating through multiple menus.</p></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{quickActions.map((action) => { const Icon = action.icon; return <Link key={action.title} href={action.href} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/30"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-900">{action.title}</p><p className="mt-0.5 text-[10px] leading-4 text-slate-500">{action.description}</p></div><ChevronRight className="h-4 w-4 shrink-0 text-slate-300" /></Link>; })}</div></section>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Recent Transactions</h2></div>{loading && !data ? <div className="p-8 text-center text-xs text-slate-400">Loading...</div> : data?.recent.length ? <div className="divide-y divide-slate-100">{data.recent.map((tx) => <div key={tx.transactionNo} className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="font-mono text-xs font-black text-slate-800">{tx.transactionNo}</p><p className="mt-1 truncate text-[11px] text-slate-500">{tx.plate} · {label(tx.vehicleType)}</p></div><div className="text-right"><p className="font-mono text-xs font-black text-slate-900">{money(tx.total)}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleString()}</p></div></div>)}</div> : <div className="p-8 text-center text-xs text-slate-400">No transactions yet.</div>}</section>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-4"><h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Top Services</h2></div>{data?.serviceMix.length ? <div className="divide-y divide-slate-100">{data.serviceMix.map((service) => <div key={service.name} className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{service.name}</p><p className="mt-1 text-[10px] text-slate-400">{service.count} sold</p></div><p className="font-mono text-xs font-black text-slate-900">{money(service.sales)}</p></div>)}</div> : <div className="p-8 text-center text-xs text-slate-400">No service sales yet.</div>}</section>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Payment Methods · Last 7 Days</h2>{data?.paymentMix.length ? <div className="mt-4 space-y-3">{data.paymentMix.map((item) => <div key={item.name} className="flex items-center justify-between"><div><p className="text-xs font-bold text-slate-800">{label(item.name)}</p><p className="text-[10px] text-slate-400">{item.count} transactions</p></div><p className="font-mono text-xs font-black text-slate-900">{money(item.sales)}</p></div>)}</div> : <p className="mt-6 text-center text-xs text-slate-400">No completed payments yet.</p>}</section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Vehicle Types · Last 7 Days</h2>{data?.vehicleMix.length ? <div className="mt-4 space-y-3">{data.vehicleMix.map((item) => <div key={item.name} className="flex items-center justify-between"><div><p className="text-xs font-bold text-slate-800">{label(item.name)}</p><p className="text-[10px] text-slate-400">{item.count} vehicles</p></div><p className="font-mono text-xs font-black text-slate-900">{money(item.sales)}</p></div>)}</div> : <p className="mt-6 text-center text-xs text-slate-400">No completed vehicle sales yet.</p>}</section>
        </div>
      </div>
    </div>
  );
}
