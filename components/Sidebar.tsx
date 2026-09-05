'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, LayoutDashboard, Users, Clock, Settings, LogOut, Package, BarChart3, Tag, FileText, UserCog, WalletCards } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type SidebarLink = { name: string; href: string; icon: typeof ShoppingCart };
type SidebarSection = { label: string; links: SidebarLink[] };

export default function Sidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const role = auth?.role || 'cashier';
  const logout = auth?.logout || (() => {});
  const userName = auth?.user?.name || (role === 'manager' ? 'Mr. DM (Owner)' : 'Cashier Station 1');

  const cashierSections: SidebarSection[] = [
    {
      label: 'Operations',
      links: [
        { name: 'POS Terminal', href: '/', icon: ShoppingCart },
        { name: 'Cashier Shift', href: '/shift', icon: WalletCards },
        { name: 'Active Queue', href: '/queue', icon: Clock },
      ],
    },
  ];

  const managerSections: SidebarSection[] = [
    {
      label: 'Overview',
      links: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'POS Terminal', href: '/', icon: ShoppingCart },
        { name: 'Cashier Shift', href: '/shift', icon: WalletCards },
      ],
    },
    {
      label: 'Operations',
      links: [
        { name: 'Active Queue', href: '/queue', icon: Clock },
        { name: 'Customers', href: '/clients', icon: Users },
        { name: 'Inventory', href: '/inventory', icon: Package },
        { name: 'Promos & Discounts', href: '/promos', icon: Tag },
      ],
    },
    {
      label: 'Reports',
      links: [
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'Transactions', href: '/history', icon: Clock },
      ],
    },
    {
      label: 'Administration',
      links: [
        { name: 'Audit Logs', href: '/audit', icon: FileText },
        { name: 'User Management', href: '/users', icon: UserCog },
        { name: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  const sections = role === 'manager' ? managerSections : cashierSections;

  return (
    <aside className="w-60 bg-slate-950 text-slate-300 flex flex-col shrink-0 h-screen select-none border-r border-slate-800">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-7 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs shadow-sm">DM</div>
          <div className="min-w-0 overflow-hidden">
            <h1 className="truncate text-xs font-black tracking-wide text-white">Mr. DM's Carwash</h1>
            <p className="mt-0.5 truncate text-[10px] font-medium capitalize text-slate-400">{role} · {userName}</p>
          </div>
        </div>

        <nav className="space-y-6">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">{section.label}</p>
              <div className="space-y-1">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-800 p-4">
        <button onClick={logout} className="flex w-full items-center justify-start gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-400 transition hover:bg-slate-900 hover:text-rose-400">
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
