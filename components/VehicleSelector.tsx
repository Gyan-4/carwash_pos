'use client';

interface Props {
  selected: 'sedan' | 'suv' | 'truck';
  onSelect: (type: 'sedan' | 'suv' | 'truck') => void;
}

export default function VehicleSelector({ selected, onSelect }: Props) {
  const types = ['sedan', 'suv', 'truck'] as const;

  return (
    <div className="flex gap-2">
      {types.map((type) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={`flex-1 py-2 text-xs font-mono font-semibold uppercase tracking-wider rounded border transition ${
            selected === type
              ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
}