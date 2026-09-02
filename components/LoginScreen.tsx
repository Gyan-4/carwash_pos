'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, UserCheck, Lock, Car } from 'lucide-react';

export default function LoginScreen() {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'cashier' | 'manager'>('cashier');
  const [pin, setPin] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const userName = selectedRole === 'manager' ? 'Mr. DM (Owner)' : 'Cashier Station 1';
    login(userName, selectedRole);
  };

  return (
    <div className="w-screen h-screen bg-slate-900 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-blue-600 p-6 text-white text-center space-y-2">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-md">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wide">Mr. DM's Carwash</h1>
            <p className="text-[11px] text-blue-100 font-medium">Point of Sale & Management System</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Select Shift Role
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedRole('cashier')}
                className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  selectedRole === 'cashier'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" /> Cashier
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('manager')}
                className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  selectedRole === 'manager'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Manager
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Enter Terminal PIN
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-sm font-mono tracking-widest text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-md shadow-blue-600/20"
          >
            Start Shift ({selectedRole === 'manager' ? 'Owner / Manager' : 'Cashier'})
          </button>
        </form>
      </div>
    </div>
  );
}