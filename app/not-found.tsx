'use client';

export default function NotFound() {
  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Carwash POS</p>
        <div className="mt-2 text-5xl font-black tracking-tight text-slate-200">404</div>
        <h1 className="mt-2 text-xl font-black text-slate-950">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">The requested POS screen does not exist or is no longer available.</p>
        <button
          onClick={() => window.location.assign('/')}
          className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700"
        >
          Return to POS
        </button>
      </div>
    </div>
  );
}
