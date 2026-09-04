'use client';

import { useState } from 'react';
import { Award, Search, Users } from 'lucide-react';

export default function ClientsPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="h-full w-full p-6 space-y-6 overflow-y-auto bg-slate-50/60 font-sans select-none">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-900">Customers</h1>
          <p className="mt-0.5 text-xs text-slate-500">Customer profiles, vehicles, loyalty, and visit history.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search customer or plate..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <Users className="mx-auto h-9 w-9 text-slate-300" />
        <h2 className="mt-3 text-sm font-black text-slate-800">No customers yet</h2>
        <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">Customer records will appear here after the POS starts saving customer and vehicle information.</p>
        {search && <p className="mt-3 text-[10px] font-bold text-slate-400">No results for “{search}”.</p>}
      </div>
    </div>
  );
}
