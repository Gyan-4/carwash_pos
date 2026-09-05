'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  User,
  X,
} from 'lucide-react';

type AuditLog = {
  _id: string;
  userId?: string;
  userName: string;
  role: 'cashier' | 'manager' | string;
  action: string;
  transactionId?: string;
  transactionNo?: string;
  reason: string;
  previousStatus?: string;
  newStatus?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

type FilterState = {
  action: string;
  user: string;
  module: string;
  status: string;
  from: string;
  to: string;
};

const PAGE_SIZE = 15;

const actionLabels: Record<string, string> = {
  VOID_TRANSACTION: 'Void transaction',
  RESTORE_TRANSACTION: 'Restore transaction',
  DELETE_TRANSACTION: 'Delete transaction',
  RESTOCK_INVENTORY: 'Restock inventory',
  ADJUST_INVENTORY: 'Adjust inventory',
  ADD_CUSTOMER: 'Add customer',
  EDIT_CUSTOMER: 'Edit customer',
  REMOVE_VEHICLE: 'Remove vehicle',
  CREATE_PROMO: 'Create promo',
  UPDATE_PROMO: 'Update promo',
  LOGIN: 'Login',
};

const moduleForAction = (action: string) => {
  if (action.includes('TRANSACTION')) return 'Transactions';
  if (action.includes('INVENTORY')) return 'Inventory';
  if (action.includes('CUSTOMER') || action.includes('VEHICLE')) return 'Customers';
  if (action.includes('PROMO')) return 'Promos';
  if (action === 'LOGIN') return 'Authentication';
  return 'System';
};

const humanAction = (action: string) => actionLabels[action] || action.replaceAll('_', ' ').toLowerCase().replace(/(^| )\w/g, (letter) => letter.toUpperCase());
const humanStatus = (status?: string) => status ? status.replaceAll('_', ' ').replace(/(^| )\w/g, (letter) => letter.toUpperCase()) : '—';
const formatDate = (value: string) => new Date(value).toLocaleString('en-PH', {
  year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit',
});
const dateOnly = (value: string) => new Date(value).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

function ActionBadge({ action }: { action: string }) {
  const tone = action.includes('DELETE') || action.includes('VOID')
    ? 'bg-rose-50 text-rose-700 border-rose-100'
    : action.includes('RESTORE') || action.includes('RESTOCK')
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : action === 'LOGIN'
        ? 'bg-slate-100 text-slate-600 border-slate-200'
        : 'bg-blue-50 text-blue-700 border-blue-100';

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide ${tone}`}>{humanAction(action)}</span>;
}

function DetailValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') return <span className="text-slate-400">—</span>;
  if (typeof value === 'object') return <span>{JSON.stringify(value)}</span>;
  return <span>{String(value)}</span>;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({ action: 'all', user: 'all', module: 'all', status: 'all', from: '', to: '' });
  const [query, setQuery] = useState('');

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    setError('');

    try {
      const [auditResponse, meResponse] = await Promise.all([
        fetch('/api/audit', { cache: 'no-store' }),
        fetch('/api/auth/me', { cache: 'no-store' }),
      ]);
      const auditData = await auditResponse.json();
      const meData = await meResponse.json();

      setIsManager(meData.user?.role === 'manager');
      if (!auditResponse.ok) throw new Error(auditData.error || 'Unable to load audit logs.');
      setLogs(Array.isArray(auditData.logs) ? auditData.logs : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load audit logs.');
    } finally {
      if (showSpinner) setLoading(false);
      else setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    const interval = window.setInterval(() => load(false), 5000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') load(false);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const users = useMemo(() => Array.from(new Set(logs.map((log) => log.userName).filter(Boolean))).sort(), [logs]);
  const actions = useMemo(() => Array.from(new Set(logs.map((log) => log.action).filter(Boolean))).sort(), [logs]);
  const modules = useMemo(() => Array.from(new Set(logs.map((log) => moduleForAction(log.action)))).sort(), [logs]);

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromTime = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : null;
    const toTime = filters.to ? new Date(`${filters.to}T23:59:59.999`).getTime() : null;

    return logs.filter((log) => {
      const searchable = [
        log.userName,
        log.role,
        log.action,
        humanAction(log.action),
        log.transactionNo || '',
        log.reason,
        log.previousStatus || '',
        log.newStatus || '',
        JSON.stringify(log.metadata || {}),
      ].join(' ').toLowerCase();
      const timestamp = new Date(log.createdAt).getTime();
      const status = log.newStatus || log.previousStatus || '';

      return (!q || searchable.includes(q))
        && (filters.action === 'all' || log.action === filters.action)
        && (filters.user === 'all' || log.userName === filters.user)
        && (filters.module === 'all' || moduleForAction(log.action) === filters.module)
        && (filters.status === 'all' || status === filters.status)
        && (fromTime === null || timestamp >= fromTime)
        && (toTime === null || timestamp <= toTime);
    });
  }, [logs, query, filters]);

  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = query.trim() || filters.action !== 'all' || filters.user !== 'all' || filters.module !== 'all' || filters.status !== 'all' || filters.from || filters.to;

  useEffect(() => {
    setPage(1);
  }, [query, filters.action, filters.user, filters.module, filters.status, filters.from, filters.to]);

  const stats = useMemo(() => ({
    total: logs.length,
    filtered: filteredLogs.length,
    destructive: logs.filter((log) => log.action.includes('DELETE') || log.action.includes('VOID')).length,
    users: users.length,
  }), [logs, filteredLogs, users]);

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setQuery('');
    setFilters({ action: 'all', user: 'all', module: 'all', status: 'all', from: '', to: '' });
  }

  function exportCsv() {
    const header = ['Date & Time', 'User', 'Role', 'Action', 'Module', 'Transaction', 'Reason', 'Previous Status', 'New Status'];
    const rows = filteredLogs.map((log) => [
      formatDate(log.createdAt), log.userName, log.role, humanAction(log.action), moduleForAction(log.action),
      log.transactionNo || '', log.reason, log.previousStatus || '', log.newStatus || '',
    ]);
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!isManager && !loading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="mb-4 rounded-full bg-rose-100 p-4 text-rose-600"><ShieldAlert className="h-8 w-8" /></div>
        <h1 className="text-base font-extrabold text-slate-900">Access Restricted</h1>
        <p className="mt-1 max-w-sm text-xs text-slate-500">Audit logs are restricted to managers and owners.</p>
        <Link href="/" className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700">Return to POS Terminal</Link>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/60 p-5 font-sans md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><FileText className="h-5 w-5" /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Management</p>
              <h1 className="mt-1 text-lg font-black text-slate-950">Audit Logs</h1>
              <p className="mt-0.5 text-xs text-slate-500">Track important actions performed in the carwash POS.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={exportCsv} disabled={!filteredLogs.length} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </header>

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{error}</div>}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Logs', value: stats.total, icon: FileText },
            { label: 'Matching Logs', value: stats.filtered, icon: Filter },
            { label: 'Destructive Actions', value: stats.destructive, icon: ShieldAlert },
            { label: 'Users Recorded', value: stats.users, icon: User },
          ].map((card) => {
            const Icon = card.icon;
            return <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{card.label}</p><Icon className="h-4 w-4 text-slate-300" /></div><p className="mt-2 text-xl font-black text-slate-900">{card.value}</p></div>;
          })}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><Filter className="h-4 w-4 text-slate-400" /><h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Filters</h2></div>
            {hasFilters && <button onClick={clearFilters} className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700"><X className="h-3.5 w-3.5" /> Clear filters</button>}
          </div>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <label className="relative xl:col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search user, action, transaction, reason..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
            <select value={filters.action} onChange={(event) => updateFilter('action', event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"><option value="all">All actions</option>{actions.map((action) => <option key={action} value={action}>{humanAction(action)}</option>)}</select>
            <select value={filters.user} onChange={(event) => updateFilter('user', event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"><option value="all">All users</option>{users.map((user) => <option key={user} value={user}>{user}</option>)}</select>
            <select value={filters.module} onChange={(event) => updateFilter('module', event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"><option value="all">All modules</option>{modules.map((module) => <option key={module} value={module}>{module}</option>)}</select>
            <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"><option value="all">All statuses</option><option value="completed">Completed</option><option value="voided">Voided</option><option value="deleted">Deleted</option></select>
          </div>
          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:max-w-md">
            <label className="relative"><CalendarDays className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100" /></label>
            <label className="relative"><CalendarDays className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input type="date" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100" /></label>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Activity history</h2><p className="mt-0.5 text-[10px] text-slate-400">Showing {paginatedLogs.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length} matching logs</p></div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400"><Activity className={`h-3.5 w-3.5 ${refreshing ? 'animate-pulse' : ''}`} /> Live updates every 5 seconds</span>
          </div>

          {loading ? <div className="p-12 text-center text-xs font-medium text-slate-400">Loading audit activity...</div> : paginatedLogs.length === 0 ? <div className="p-12 text-center"><div className="mx-auto mb-3 w-fit rounded-full bg-slate-100 p-3 text-slate-400"><FileText className="h-5 w-5" /></div><p className="text-xs font-bold text-slate-600">No audit logs found</p><p className="mt-1 text-[10px] text-slate-400">Try clearing your filters or wait for a new system action.</p></div> : <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-50/80 text-[9px] font-black uppercase tracking-wider text-slate-400"><tr><th className="px-4 py-3">Date & Time</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Module</th><th className="px-4 py-3">Details</th><th className="px-4 py-3">Reference</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{paginatedLogs.map((log) => <tr key={log._id} onClick={() => setSelected(log)} className="cursor-pointer hover:bg-slate-50/80"><td className="whitespace-nowrap px-4 py-3.5"><p className="text-[10px] font-bold text-slate-700">{dateOnly(log.createdAt)}</p><p className="mt-0.5 text-[9px] text-slate-400">{new Date(log.createdAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}</p></td><td className="px-4 py-3.5"><p className="text-[11px] font-bold text-slate-800">{log.userName}</p><p className="mt-0.5 text-[9px] capitalize text-slate-400">{log.role}</p></td><td className="px-4 py-3.5"><ActionBadge action={log.action} /></td><td className="px-4 py-3.5 text-[10px] font-bold text-slate-600">{moduleForAction(log.action)}</td><td className="max-w-xs px-4 py-3.5"><p className="truncate text-[10px] font-semibold text-slate-700">{log.reason}</p>{(log.previousStatus || log.newStatus) && <p className="mt-1 text-[9px] text-slate-400">{humanStatus(log.previousStatus)} → {humanStatus(log.newStatus)}</p>}</td><td className="px-4 py-3.5 font-mono text-[10px] font-bold text-slate-500">{log.transactionNo || '—'}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 md:hidden">{paginatedLogs.map((log) => <button key={log._id} onClick={() => setSelected(log)} className="block w-full p-4 text-left hover:bg-slate-50"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold text-slate-400">{formatDate(log.createdAt)}</p><p className="mt-1 text-xs font-black text-slate-800">{log.userName}</p></div><ActionBadge action={log.action} /></div><p className="mt-2 text-[10px] font-semibold text-slate-600">{log.reason}</p><p className="mt-1 text-[9px] text-slate-400">{moduleForAction(log.action)} · {log.transactionNo || 'No transaction reference'}</p></button>)}</div>
          </>}

          {pageCount > 1 && <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3"><p className="text-[10px] font-bold text-slate-400">Page {currentPage} of {pageCount}</p><div className="flex gap-1"><button disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><button disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div>}
        </section>
      </div>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 p-5"><div><p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Audit event</p><h2 className="mt-1 text-base font-black text-slate-900">{humanAction(selected.action)}</h2><p className="mt-1 text-[10px] text-slate-400">{formatDate(selected.createdAt)}</p></div><button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><X className="h-4 w-4" /></button></div><div className="grid grid-cols-2 gap-4 p-5"><div><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">User</p><p className="mt-1 text-xs font-bold text-slate-800">{selected.userName}</p><p className="mt-0.5 text-[10px] capitalize text-slate-400">{selected.role}</p></div><div><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Module</p><p className="mt-1 text-xs font-bold text-slate-800">{moduleForAction(selected.action)}</p></div><div><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Transaction</p><p className="mt-1 font-mono text-xs font-bold text-slate-800">{selected.transactionNo || '—'}</p></div><div><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Status change</p><p className="mt-1 text-xs font-bold text-slate-800">{humanStatus(selected.previousStatus)} → {humanStatus(selected.newStatus)}</p></div><div className="col-span-2"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Reason</p><p className="mt-1 rounded-xl bg-slate-50 p-3 text-xs font-medium leading-5 text-slate-700">{selected.reason}</p></div>{selected.metadata && Object.keys(selected.metadata).length > 0 && <div className="col-span-2"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Additional details</p><div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">{Object.entries(selected.metadata).map(([key, value]) => <div key={key} className="flex gap-4 px-3 py-2.5 text-[10px]"><span className="w-32 shrink-0 font-bold text-slate-400">{key.replaceAll('_', ' ')}</span><span className="min-w-0 break-words font-semibold text-slate-700"><DetailValue value={value} /></span></div>)}</div></div>}</div></div></div>}
    </div>
  );
}
