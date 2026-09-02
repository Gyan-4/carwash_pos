'use client';

import { useState } from 'react';
import { Package, AlertTriangle, Plus, ArrowDown, Droplets } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  estimatedWashesLeft: number;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Premium Car Foam Shampoo',
    category: 'Chemicals',
    quantity: 14.5,
    unit: 'Liters',
    minThreshold: 5.0,
    estimatedWashesLeft: 145
  },
  {
    id: 'inv-2',
    name: 'Nano Graphene Coating Formula',
    category: 'Detailing',
    quantity: 2,
    unit: 'Bottles (500ml)',
    minThreshold: 3,
    estimatedWashesLeft: 4
  },
  {
    id: 'inv-3',
    name: 'Heavy-Duty Microfiber Towels',
    category: 'Supplies',
    quantity: 28,
    unit: 'Pieces',
    minThreshold: 15,
    estimatedWashesLeft: 84
  },
  {
    id: 'inv-4',
    name: 'Tire Shine & Degreaser Solution',
    category: 'Chemicals',
    quantity: 3.2,
    unit: 'Liters',
    minThreshold: 4.0,
    estimatedWashesLeft: 32
  }
];

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);

  return (
    <div className="h-full w-full p-6 space-y-6 overflow-y-auto bg-slate-50/60 font-sans select-none">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-lg font-black text-slate-900">Chemical & Stock Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated consumption tracking per carwash package completed.
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-blue-600/20">
          <Plus className="w-4 h-4" /> Restock Chemical Batch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {inventory.map((item) => {
          const isLowStock = item.quantity <= item.minThreshold;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition space-y-3 bg-white shadow-sm ${
                isLowStock ? 'border-amber-300 ring-2 ring-amber-400/10' : 'border-slate-200/80'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                  {item.category}
                </span>
                {isLowStock && (
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> Low Stock
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xs font-extrabold text-slate-800">{item.name}</h3>
                <div className="text-lg font-black font-mono text-slate-900 mt-1">
                  {item.quantity} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                <span>Est. Service Capacity</span>
                <span className="text-blue-600 font-mono">~{item.estimatedWashesLeft} Washes</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}