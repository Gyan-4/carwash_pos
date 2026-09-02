'use client';

import { useState } from 'react';
import { Save, ShieldCheck, CreditCard, Award, Sliders } from 'lucide-react';

export default function SettingsPage() {
  const [stampsRequired, setStampsRequired] = useState(11);
  const [riderDiscountPercent, setRiderDiscountPercent] = useState(20);

  return (
    <div className="h-full w-full p-6 space-y-6 overflow-y-auto bg-slate-50/60 font-sans select-none">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-lg font-black text-slate-900">System Configuration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure terminal rules, pricing rules, loyalty thresholds, and integrations.
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-blue-600/20">
          <Save className="w-4 h-4" /> Save System Rules
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Loyalty Program Rules */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600" />
            <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Stamp Loyalty Rules
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                Stamps Required For Free Wash
              </label>
              <input
                type="number"
                value={stampsRequired}
                onChange={(e) => setStampsRequired(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                Rider Partner Discount (%)
              </label>
              <input
                type="number"
                value={riderDiscountPercent}
                onChange={(e) => setRiderDiscountPercent(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Enabled Payment Gateways */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Terminal Payment Options
            </h2>
          </div>

          <div className="space-y-2 text-xs">
            {['Cash Drawer Integration', 'GCash QR Merchant', 'Maya QR Integration', 'Card Terminal (POS Terminal)'].map((method, idx) => (
              <label key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                <span className="font-bold text-slate-700">{method}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600 rounded" />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}