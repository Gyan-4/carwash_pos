'use client';

import { useState } from 'react';
import { CreditCard, Wallet, Banknote, ShieldCheck } from 'lucide-react';

interface PaymentModalProps {
  totalAmount: number;
  onComplete: (paymentDetails: any) => void;
  onClose: () => void;
}

export default function PaymentModal({ totalAmount, onComplete, onClose }: PaymentModalProps) {
  const [method, setMethod] = useState<'cash' | 'gcash' | 'maya' | 'card'>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [refNumber, setRefNumber] = useState<string>('');

  const change = Math.max(0, (parseFloat(cashTendered) || 0) - totalAmount);

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-black">Complete Payment</h2>
            <p className="text-[11px] text-slate-400">Select payment method & tender amount</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Due</span>
            <span className="text-lg font-black font-mono text-emerald-400">₱{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'cash', label: 'Cash', icon: Banknote },
              { id: 'gcash', label: 'GCash', icon: Wallet },
              { id: 'maya', label: 'Maya', icon: Wallet },
              { id: 'card', label: 'Card', icon: CreditCard },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setMethod(item.id as any)}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 text-xs font-extrabold border transition ${
                    method === item.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {method === 'cash' ? (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400">Cash Received</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-base font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs font-bold">
                <span className="text-slate-500">Change Due:</span>
                <span className="font-mono text-sm text-emerald-600">₱{change.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="text-[10px] font-extrabold uppercase text-slate-400">
                {method.toUpperCase()} Reference / Approval No.
              </label>
              <input
                type="text"
                placeholder="e.g. 104928571"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => onComplete({ method, cashTendered, refNumber, change })}
              className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" /> Complete Transaction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}