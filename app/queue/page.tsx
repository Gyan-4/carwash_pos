'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Car, CheckCircle2, Clock, Loader2, Play, RefreshCw } from 'lucide-react';

type QueueItem = {
  _id: string;
  transactionNo: string;
  plate: string;
  customerName: string;
  vehicleType: string;
  vehicleSize?: string;
  services: string[];
  total: number;
  status: 'waiting' | 'washing';
  washer: string;
  createdAt: string;
};

const statusConfig = {
  waiting: { label: 'Waiting', icon: Clock },
  washing: { label: 'Washing', icon: Play },
};

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const loadQueue = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/queue', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) throw new Error(data.error || 'Unable to load active queue.');
      setQueue(Array.isArray(data.queue) ? data.queue : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load active queue.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
    const timer = window.setInterval(() => loadQueue(true), 5000);
    const onVisible = () => { if (document.visibilityState === 'visible') loadQueue(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [loadQueue]);

  const updateStatus = async (item: QueueItem, status: 'washing' | 'completed') => {
    setUpdatingId(item._id);
    setError('');
    try {
      const response = await fetch('/api/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item._id, status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) throw new Error(data.error || 'Unable to update queue.');
      if (status === 'completed') setQueue((current) => current.filter((entry) => entry._id !== item._id));
      else setQueue((current) => current.map((entry) => entry._id === item._id ? { ...entry, ...data.queueItem } : entry));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update queue.');
    } finally {
      setUpdatingId('');
    }
  };

  const waitingCount = useMemo(() => queue.filter((item) => item.status === 'waiting').length, [queue]);
  const washingCount = useMemo(() => queue.filter((item) => item.status === 'washing').length, [queue]);

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/60 p-6 font-sans select-none">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-900">Active Queue</h1>
            <p className="mt-0.5 text-xs text-slate-500">Monitor vehicles waiting and currently being serviced.</p>
          </div>
          <button onClick={() => loadQueue(true)} disabled={refreshing} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Active</p><p className="mt-1 text-2xl font-black text-slate-900">{queue.length}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Waiting</p><p className="mt-1 text-2xl font-black text-amber-600">{waitingCount}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Washing</p><p className="mt-1 text-2xl font-black text-blue-600">{washingCount}</p></div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm"><Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" /><p className="mt-3 text-xs text-slate-500">Loading active queue...</p></div>
        ) : queue.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <Clock className="mx-auto h-9 w-9 text-slate-300" />
            <h2 className="mt-3 text-sm font-black text-slate-800">Queue is empty</h2>
            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">Completed POS sales will appear here as waiting vehicles.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item, index) => {
              const config = statusConfig[item.status];
              const StatusIcon = config.icon;
              const nextStatus = item.status === 'waiting' ? 'washing' : 'completed';
              return (
                <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Car className="h-5 w-5" /></div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-slate-900">#{index + 1} {item.plate}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600"><StatusIcon className="h-3 w-3" /> {config.label}</span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-700">{item.customerName || 'Walk-in Customer'} · {item.vehicleType}{item.vehicleSize ? ` · ${item.vehicleSize}` : ''}</p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-500">{item.services.join(' · ')}</p>
                        <p className="mt-1 text-[10px] text-slate-400">{item.transactionNo} · Washer: {item.washer || 'Unassigned'}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-4 lg:justify-end">
                      <div className="text-right"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total</p><p className="text-base font-black text-slate-900">₱{Number(item.total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p></div>
                      <button onClick={() => updateStatus(item, nextStatus)} disabled={updatingId === item._id} className="inline-flex h-10 min-w-32 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-50">
                        {updatingId === item._id ? <Loader2 className="h-4 w-4 animate-spin" /> : nextStatus === 'washing' ? <><Play className="h-3.5 w-3.5" /> Start Washing</> : <><CheckCircle2 className="h-3.5 w-3.5" /> Mark Done</>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
