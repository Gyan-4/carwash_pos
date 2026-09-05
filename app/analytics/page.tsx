'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Car, CreditCard, RefreshCw, Tag, TrendingUp, Wallet, ShoppingCart } from 'lucide-react';

type Mix = { name: string; count: number; sales: number };
type Daily = { date: string; sales: number; transactions: number };
type Data = {
  range: 'today' | '7d' | '30d';
  overview: { sales: number; subtotal: number; discounts: number; transactions: number; vehicles: number; averageTransaction: number };
  dailySales: Daily[];
  paymentMix: Mix[];
  vehicleMix: Mix[];
  serviceMix: Mix[];
  statusMix: { name: string; count: number; amount: number }[];
  promo: { transactions: number; discounts: number; salesAfterDiscount: number };
};

const peso = (value: number) => `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const label = (value: string) => value === 'gcash' ? 'GCash' : value === 'suv' ? 'SUV' : value.charAt(0).toUpperCase() + value.slice(1);
const dateLabel = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

function Section({ title, icon: Icon, children }: { title: string; icon: typeof BarChart3; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"><Icon className="h-4 w-4 text-slate-400"/><h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">{title}</h2></div>{children}</section>;
}

function Empty({ text = 'No data for this period.' }: { text?: string }) {
  return <div className="p-10 text-center text-xs font-medium text-slate-400">{text}</div>;
}

function MixList({ items, valueLabel = 'sales' }: { items: Mix[]; valueLabel?: 'sales' | 'count' }) {
  if (!items.length) return <Empty />;
  const max = Math.max(...items.map((x) => valueLabel === 'sales' ? x.sales : x.count), 1);
  return <div className="divide-y divide-slate-100">{items.map((item) => { const value = valueLabel === 'sales' ? item.sales : item.count; return <div key={item.name} className="p-4"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{label(item.name)}</p><p className="mt-1 text-[10px] text-slate-400">{item.count} transaction{item.count === 1 ? '' : 's'}</p></div><p className="shrink-0 font-mono text-xs font-black text-slate-900">{valueLabel === 'sales' ? peso(item.sales) : item.count}</p></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(4, (value / max) * 100)}%` }} /></div></div> })}</div>;
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<Data['range']>('30d');
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(showLoading = true) {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/analytics?range=${range}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load analytics.');
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load analytics.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => { load(); const interval = window.setInterval(() => load(false), 5000); return () => window.clearInterval(interval); }, [range]);

  const maxDaily = useMemo(() => Math.max(...(data?.dailySales || []).map((x) => x.sales), 1), [data]);
  const completed = data?.overview.transactions || 0;
  const voided = data?.statusMix.find((x) => x.name === 'voided')?.count || 0;

  return <div className="h-full w-full overflow-y-auto bg-slate-50"><div className="mx-auto max-w-7xl space-y-6 p-5 md:p-7">
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">Analytics</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Sales & Performance</h1><p className="mt-1 text-sm text-slate-500">Real transaction data from MongoDB, grouped in Philippine time.</p></div><div className="flex gap-2"><div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">{([['today','Today'],['7d','7 Days'],['30d','30 Days']] as const).map(([value, text]) => <button key={value} onClick={() => setRange(value)} className={`rounded-lg px-3 py-2 text-xs font-extrabold transition ${range === value ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{text}</button>)}</div><button onClick={() => load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>Refresh</button></div></header>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{error}</div>}

    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
      { label: 'Net Sales', value: peso(data?.overview.sales || 0), icon: Wallet },
      { label: 'Transactions', value: String(completed), icon: ShoppingCart },
      { label: 'Average Transaction', value: peso(data?.overview.averageTransaction || 0), icon: TrendingUp },
      { label: 'Discounts Given', value: peso(data?.overview.discounts || 0), icon: Tag },
    ].map((card) => { const Icon = card.icon; return <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{card.label}</span><Icon className="h-4 w-4 text-slate-400"/></div><p className="mt-3 text-2xl font-black tracking-tight text-slate-900">{loading && !data ? '—' : card.value}</p><p className="mt-1 text-[10px] font-bold text-slate-400">{range === 'today' ? 'Today' : range === '7d' ? 'Last 7 days' : 'Last 30 days'}</p></div> })}</section>

    <Section title="Daily Sales Trend" icon={BarChart3}><div className="p-5">{data?.dailySales.length ? <div className="flex h-64 items-end gap-1.5 overflow-x-auto pb-7">{data.dailySales.map((day) => <div key={day.date} className="group flex min-w-[22px] flex-1 flex-col items-center justify-end self-stretch"><div className="relative flex w-full flex-1 items-end"><div className="w-full rounded-t-md bg-blue-500 transition-opacity group-hover:opacity-75" style={{ height: `${Math.max(day.sales ? 4 : 1, (day.sales / maxDaily) * 100)}%` }} title={`${day.date}: ${peso(day.sales)}`} /></div><span className="mt-2 whitespace-nowrap text-[9px] font-bold text-slate-400">{dateLabel(day.date)}</span></div>)}</div> : <Empty text="No completed sales yet." />}</div></Section>

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2"><Section title="Payment Methods" icon={CreditCard}><MixList items={data?.paymentMix || []} /></Section><Section title="Vehicle Types" icon={Car}><MixList items={data?.vehicleMix || []} /></Section></div>

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2"><Section title="Top Services & Packages" icon={BarChart3}><MixList items={data?.serviceMix || []} /></Section><Section title="Promo Impact" icon={Tag}>{data?.promo.transactions ? <div className="grid grid-cols-2 gap-3 p-5"><div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Promo Transactions</p><p className="mt-2 text-xl font-black text-slate-900">{data.promo.transactions}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Discounts</p><p className="mt-2 text-xl font-black text-slate-900">{peso(data.promo.discounts)}</p></div><div className="col-span-2 rounded-xl border border-slate-100 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Sales After Discounts</p><p className="mt-2 text-xl font-black text-slate-900">{peso(data.promo.salesAfterDiscount)}</p></div></div> : <Empty text="No promo discounts used in this period." />}</Section></div>

    <Section title="Transaction Status" icon={TrendingUp}><div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">{['completed','voided'].map((status) => { const item = data?.statusMix.find((x) => x.name === status); return <div key={status} className="rounded-xl border border-slate-100 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label(status)}</p><p className="mt-2 text-xl font-black text-slate-900">{item?.count || 0}</p><p className="mt-1 text-[10px] text-slate-400">{status === 'completed' ? 'Completed transactions' : 'Voided transactions'}</p></div> })}<div className="rounded-xl border border-slate-100 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Vehicles Serviced</p><p className="mt-2 text-xl font-black text-slate-900">{data?.overview.vehicles || 0}</p><p className="mt-1 text-[10px] text-slate-400">Completed services</p></div></div></Section>

    <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"><div><p className="text-xs font-bold text-slate-600">Period summary</p><p className="mt-1 text-[11px] text-slate-400">{completed} completed transaction{completed === 1 ? '' : 's'} · {voided} voided</p></div><Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-blue-700"><ShoppingCart className="h-4 w-4"/>Open POS</Link></div>
  </div></div>;
}
