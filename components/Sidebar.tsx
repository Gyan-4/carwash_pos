'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, LayoutDashboard, Users, Clock, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const auth = useAuth();

  const role = auth?.role || 'cashier';
  const logout = auth?.logout || (() => {});
  const userName = auth?.user?.name || (role === 'manager' ? 'Mr. DM (Owner)' : 'Cashier Station 1');

  const cashierLinks = [
    { name: 'POS Terminal', href: '/', icon: ShoppingCart },
    { name: 'Active Queue', href: '/queue', icon: Clock },
  ];

  const managerLinks = [
    { name: 'POS Terminal', href: '/', icon: ShoppingCart },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Loyalty & Clients', href: '/clients', icon: Users },
    { name: 'History & Audits', href: '/history', icon: Clock },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const links = role === 'manager' ? managerLinks : cashierLinks;

  return (
    <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 shrink-0 h-screen select-none border-r border-slate-800">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="bg-blue-600 text-white font-black text-xs px-2.5 py-1.5 rounded-lg shadow-sm">
            DM
          </div>
          <div className="overflow-hidden">
            <h1 className="text-xs font-black text-white tracking-wide truncate">Mr. DM's Carwash</h1>
            <p className="text-[10px] text-slate-400 font-medium capitalize truncate">{role} • {userName}</p>
          </div>
        </div>

        {/* Dynamic Navigation */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Account Footer */}
      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center justify-start gap-2.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}