export default function Loading() {
  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 p-6">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        <p className="mt-3 text-xs font-black text-slate-700">Loading POS...</p>
        <p className="mt-1 text-[11px] text-slate-500">Please wait.</p>
      </div>
    </div>
  );
}
