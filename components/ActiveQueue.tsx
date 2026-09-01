'use client';

export interface OrderTicket {
  id: string;
  plate: string;
  total: number;
  time: string;
  status: 'Queued' | 'In Progress' | 'Done';
}

interface Props {
  orders: OrderTicket[];
  onUpdateStatus: (id: string) => void;
}

export default function ActiveQueue({ orders, onUpdateStatus }: Props) {
  return (
    <div className="border-t border-zinc-800 pt-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-mono uppercase text-zinc-500">Live Wash Bay</span>
        <span className="text-xs font-mono text-zinc-400">{orders.length} active</span>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
        {orders.length === 0 ? (
          <p className="text-xs text-zinc-600 font-mono py-2">No active tickets</p>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              onClick={() => onUpdateStatus(o.id)}
              className="p-2.5 rounded bg-zinc-900 border border-zinc-800/80 flex items-center justify-between cursor-pointer hover:border-zinc-700 transition"
            >
              <div>
                <span className="font-mono text-xs font-bold text-zinc-200 block">{o.plate}</span>
                <span className="text-[10px] text-zinc-500 font-mono">{o.time}</span>
              </div>
              <span
                className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${
                  o.status === 'Queued'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : o.status === 'In Progress'
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}
              >
                {o.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}