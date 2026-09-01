'use client';

import { useAuth } from '@/context/AuthContext';
import { LogOut, User } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs font-bold tracking-widest text-zinc-400 uppercase">
          AutoShine POS
        </span>
        <span className="text-zinc-700">/</span>
        <span className="text-xs text-zinc-400 font-mono">Terminal 01</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <User className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-medium text-zinc-200">{user?.name}</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="text-zinc-500 hover:text-zinc-200 transition text-xs flex items-center gap-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          Exit
        </button>
      </div>
    </header>
  );
}