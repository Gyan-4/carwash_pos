'use client';

interface Props {
  selected: string;
  onSelect: (tech: string) => void;
}

const TECHNICIANS = ['Unassigned', 'Marcus (Bay 1)', 'Dave (Bay 2)', 'Sarah (Detailing)'];

export default function TechnicianSelector({ selected, onSelect }: Props) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase text-zinc-500 block mb-1.5">
        Assigned Detailer
      </label>
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 font-mono"
      >
        {TECHNICIANS.map((tech) => (
          <option key={tech} value={tech}>
            {tech}
          </option>
        ))}
      </select>
    </div>
  );
}