'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AlertTriangle, KeyRound, Pencil, Plus, ShieldCheck, Trash2, UserCheck, UserX, Users, X } from 'lucide-react';

type User = {
  id: string;
  name: string;
  role: 'cashier' | 'manager';
  active: boolean;
  createdAt?: string;
  failedPinAttempts?: number;
  lockedUntil?: string | null;
  lockoutLevel?: number;
  lockoutAfterAttempts?: number;
  lockoutBaseMinutes?: number;
  lockoutMultiplier?: number;
  lockoutMaxMinutes?: number;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | 'pin' | 'delete' | null>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'cashier' | 'manager'>('cashier');
  const [pin, setPin] = useState('');
  const [active, setActive] = useState(true);
  const [lockoutAfterAttempts, setLockoutAfterAttempts] = useState('5');
  const [lockoutBaseMinutes, setLockoutBaseMinutes] = useState('1');
  const [lockoutMultiplier, setLockoutMultiplier] = useState('3');
  const [lockoutMaxMinutes, setLockoutMaxMinutes] = useState('60');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    setError('');
    try {
      const [meResponse, usersResponse] = await Promise.all([fetch('/api/auth/me', { cache: 'no-store' }), fetch('/api/users', { cache: 'no-store' })]);
      const me = await meResponse.json();
      if (!meResponse.ok || me.user?.role !== 'manager') { setIsManager(false); return; }
      setIsManager(true);
      const data = await usersResponse.json();
      if (!usersResponse.ok) throw new Error(data.error || 'Unable to load users.');
      setUsers(data.users || []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load users.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setSelected(null); setName(''); setRole('cashier'); setPin(''); setActive(true); setLockoutAfterAttempts('5'); setLockoutBaseMinutes('1'); setLockoutMultiplier('3'); setLockoutMaxMinutes('60'); setMessage(''); setModal('create'); }
  function openEdit(user: User) {
    setSelected(user); setName(user.name); setRole(user.role); setActive(user.active); setPin('');
    setLockoutAfterAttempts(String(user.lockoutAfterAttempts ?? 5)); setLockoutBaseMinutes(String(user.lockoutBaseMinutes ?? 1)); setLockoutMultiplier(String(user.lockoutMultiplier ?? 3)); setLockoutMaxMinutes(String(user.lockoutMaxMinutes ?? 60));
    setMessage(''); setModal('edit');
  }
  function openPin(user: User) { setSelected(user); setPin(''); setMessage(''); setModal('pin'); }
  function openDelete(user: User) { setSelected(user); setMessage(''); setModal('delete'); }

  async function resetLockout(user: User) {
    setSaving(true); setMessage('');
    try {
      const response = await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: user.id, resetLockout: true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to reset lockout.');
      setMessage(`PIN lockout reset for ${user.name}.`);
      await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to reset lockout.'); }
    finally { setSaving(false); }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setMessage('');
    try {
      const isDelete = modal === 'delete';
      const body = isDelete
        ? { id: selected?.id }
        : modal === 'create'
          ? { name, role, pin, ...(role === 'cashier' ? { lockoutAfterAttempts: Number(lockoutAfterAttempts), lockoutBaseMinutes: Number(lockoutBaseMinutes), lockoutMultiplier: Number(lockoutMultiplier), lockoutMaxMinutes: Number(lockoutMaxMinutes) } : {}) }
          : modal === 'pin'
            ? { id: selected?.id, pin }
            : { id: selected?.id, name, role, active, ...(role === 'cashier' ? { lockoutAfterAttempts: Number(lockoutAfterAttempts), lockoutBaseMinutes: Number(lockoutBaseMinutes), lockoutMultiplier: Number(lockoutMultiplier), lockoutMaxMinutes: Number(lockoutMaxMinutes) } : {}) };
      const response = await fetch('/api/users', { method: isDelete ? 'DELETE' : modal === 'create' ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (isDelete ? 'Unable to delete user.' : 'Unable to save user.'));
      setModal(null);
      setMessage(isDelete ? 'User deleted successfully.' : modal === 'create' ? 'User created successfully.' : modal === 'pin' ? 'PIN updated successfully.' : 'User updated successfully.');
      await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to complete action.'); }
    finally { setSaving(false); }
  }

  if (!loading && !isManager) return <div className="p-8 text-sm font-bold text-slate-600">Manager access required.</div>;

  const lockoutPreview = role === 'cashier'
    ? `After ${lockoutAfterAttempts || '5'} failed attempts: ${lockoutBaseMinutes || '1'} min → ${Math.min(Number(lockoutMaxMinutes) || 60, Math.round((Number(lockoutBaseMinutes) || 1) * (Number(lockoutMultiplier) || 3)))} min → increases by ×${lockoutMultiplier || '3'} up to ${lockoutMaxMinutes || '60'} min.`
    : '';

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/60 p-6 font-sans text-slate-900">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div><div className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-600" /><h1 className="text-lg font-black">User Management</h1></div><p className="mt-1 text-xs text-slate-600">Manage cashier and manager accounts, access status, PINs, and cashier login lockout policy.</p></div>
          <button onClick={openCreate} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"><Plus className="h-4 w-4" /> Add User</button>
        </div>
        {message && <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-800">{message}</div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{error}</div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => {
            const locked = Boolean(user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now());
            return (
              <div key={user.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${user.active ? 'border-slate-200' : 'border-slate-300 opacity-70'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${user.role === 'manager' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>{user.role === 'manager' ? <ShieldCheck className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}</div><div className="min-w-0"><h2 className="truncate text-sm font-black">{user.name}</h2><p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{user.role}</p></div></div>
                  <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${locked ? 'bg-amber-50 text-amber-700' : user.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{locked ? 'Locked' : user.active ? 'Active' : 'Inactive'}</span>
                </div>
                {user.role === 'cashier' && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[10px] font-bold text-slate-600"><div className="flex justify-between"><span>Failed attempts</span><span>{user.failedPinAttempts ?? 0}</span></div><div className="flex justify-between"><span>Escalation level</span><span>{user.lockoutLevel ?? 0}</span></div><div className="mt-1 text-slate-500">Policy: {user.lockoutAfterAttempts ?? 5} attempts → {user.lockoutBaseMinutes ?? 1} min × {user.lockoutMultiplier ?? 3}, max {user.lockoutMaxMinutes ?? 60} min.</div></div>}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button onClick={() => openEdit(user)} className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-extrabold hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                  <button onClick={() => openPin(user)} className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-extrabold hover:bg-slate-50"><KeyRound className="h-3.5 w-3.5" /> Change PIN</button>
                </div>
                {user.role === 'cashier' && locked && <button disabled={saving} onClick={() => resetLockout(user)} className="mt-2 w-full rounded-lg border border-amber-200 px-3 py-2 text-[11px] font-extrabold text-amber-700 hover:bg-amber-50 disabled:opacity-50">Reset Lockout</button>}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button onClick={() => { setSelected(user); setName(user.name); setRole(user.role); setActive(!user.active); setPin(''); setLockoutAfterAttempts(String(user.lockoutAfterAttempts ?? 5)); setLockoutBaseMinutes(String(user.lockoutBaseMinutes ?? 1)); setLockoutMultiplier(String(user.lockoutMultiplier ?? 3)); setLockoutMaxMinutes(String(user.lockoutMaxMinutes ?? 60)); setModal('edit'); }} className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-extrabold ${user.active ? 'border-red-200 text-red-700 hover:bg-red-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}>{user.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />} {user.active ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => openDelete(user)} className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-[11px] font-extrabold text-red-700 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                </div>
              </div>
            );
          })}
        </div>
        {!loading && users.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-xs font-bold text-slate-500">No user accounts found.</div>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          {modal === 'delete' ? (
            <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5" /></div>
              <h2 className="mt-4 text-base font-black">Delete user?</h2>
              <p className="mt-2 text-sm text-slate-600">You are about to permanently delete <span className="font-black text-slate-900">{selected?.name}</span>.</p>
              <p className="mt-2 text-xs font-bold text-slate-500">Users with transaction history cannot be deleted. Deactivate them instead so historical records remain intact.</p>
              {message && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700">{message}</p>}
              <div className="mt-5 flex gap-2"><button type="button" onClick={() => setModal(null)} className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-extrabold">Cancel</button><button disabled={saving} className="flex-1 rounded-xl bg-red-600 py-3 text-xs font-extrabold text-white hover:bg-red-700 disabled:opacity-50">{saving ? 'Deleting...' : 'Delete User'}</button></div>
            </form>
          ) : (
            <form onSubmit={submit} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between"><div><h2 className="text-base font-black">{modal === 'create' ? 'Add User' : modal === 'pin' ? 'Change PIN' : 'Edit User'}</h2><p className="mt-0.5 text-[11px] text-slate-500">{modal === 'pin' ? `Set a new PIN for ${selected?.name}.` : 'Account details and access control.'}</p></div><button type="button" onClick={() => setModal(null)}><X className="h-5 w-5 text-slate-400" /></button></div>
              {modal !== 'pin' && <div className="space-y-4"><div><label className="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Name</label><input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" /></div><div><label className="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Role</label><select value={role} onChange={(e) => setRole(e.target.value as 'cashier' | 'manager')} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="cashier">Cashier</option><option value="manager">Manager</option></select></div><label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3"><span><span className="block text-xs font-extrabold">Account status</span><span className="text-[10px] text-slate-500">Inactive users cannot sign in.</span></span><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-blue-600" /></label></div>}
              {(modal === 'create' || modal === 'pin') && <div className="mt-4"><label className="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">4-Digit PIN</label><input required inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-center font-mono text-lg font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>}
              {modal !== 'pin' && role === 'cashier' && <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4"><div className="mb-3"><h3 className="text-xs font-black text-slate-900">Cashier PIN Lockout</h3><p className="mt-1 text-[10px] leading-4 text-slate-600">Lockout duration increases after each lockout. Successful login resets the escalation level.</p></div><div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Failed attempts</label><input required type="number" min="1" max="20" value={lockoutAfterAttempts} onChange={(e) => setLockoutAfterAttempts(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold" /></div><div><label className="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Starting minutes</label><input required type="number" min="1" max="1440" value={lockoutBaseMinutes} onChange={(e) => setLockoutBaseMinutes(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold" /></div><div><label className="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Multiplier</label><input required type="number" min="1" max="10" step="0.1" value={lockoutMultiplier} onChange={(e) => setLockoutMultiplier(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold" /></div><div><label className="mb-1 block text-[10px] font-extrabold uppercase text-slate-500">Maximum minutes</label><input required type="number" min="1" max="10080" value={lockoutMaxMinutes} onChange={(e) => setLockoutMaxMinutes(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold" /></div></div><p className="mt-3 text-[10px] font-bold text-amber-800">{lockoutPreview}</p></div>}
              {message && <p className="mt-3 text-xs font-bold text-red-600">{message}</p>}
              <button disabled={saving} className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : modal === 'create' ? 'Create Account' : 'Save Changes'}</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
