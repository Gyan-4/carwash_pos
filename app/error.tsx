'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Carwash POS application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <span className="text-xl font-black">!</span>
        </div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-rose-600">System Error</p>
        <h1 className="mt-1 text-xl font-black text-slate-950">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          This screen could not be loaded correctly. Your saved POS data is not being deleted by this message.
        </p>
        {error.digest && (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-[10px] text-slate-500">
            Reference: {error.digest}
          </p>
        )}
        <div className="mt-5 flex justify-center gap-2">
          <button
            onClick={() => reset()}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.assign('/')}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            Return to POS
          </button>
        </div>
      </div>
    </div>
  );
}
