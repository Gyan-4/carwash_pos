'use client';

import { Package, Plus } from 'lucide-react';

export default function InventoryPage() {
  return (
    <div className="h-full w-full p-6 overflow-y-auto bg-slate-50/60 font-sans select-none">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-900">Inventory</h1>
            <p className="mt-0.5 text-xs text-slate-500">Manage chemicals, supplies, and stock levels.</p>
          </div>
          <button className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <Package className="mx-auto h-9 w-9 text-slate-300" />
          <h2 className="mt-3 text-sm font-black text-slate-800">No inventory items</h2>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">Add your real chemicals and supplies here. Stock quantities will be shown once inventory records are connected to the database.</p>
          <button className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-blue-700">Add First Item</button>
        </div>
      </div>
    </div>
  );
}
