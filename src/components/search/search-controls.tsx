import { Search } from 'lucide-react';
import Input from '../ui/Input';
import ComboBox from '../ui/ComboBox';
import { SlotKey, slotLabel } from '@/lib/slots';

type SearchControlsProps = {
  search: string;
  onSearchChange: (value: string) => void;
  slotFilter: string;
  onSlotChange: (value: string) => void;
  slotOptions: string[];
};

export function SearchControls({
  search,
  onSearchChange,
  slotFilter,
  onSlotChange,
  slotOptions,
}: SearchControlsProps) {
  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-sm flex flex-col md:flex-row gap-4 md:items-end">
      <div className="relative flex-1">
        <span className="text-[11px] uppercase tracking-wide text-zinc-500">Search</span>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 mt-3" size={18} />
        <Input
          type="text"
          className="bg-zinc-950 border-zinc-700 rounded-lg pl-10 pr-3 h-10 text-sm"
          placeholder="Search by name, keywords, or stats (e.g. 'str', 'hit-n-dam')..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1 w-full md:w-72">
        <span className="text-[11px] uppercase tracking-wide text-zinc-500">Slot</span>
        <ComboBox
          options={slotOptions}
          value={[slotFilter]}
          allowCustom={false}
          onChange={(vals) => onSlotChange(vals[0] ?? 'all')}
          placeholder="All slots"
          className="w-full"
          size="md"
          singleSelect
          labelForOption={(opt) => (opt === 'all' ? 'All slots' : slotLabel(opt as SlotKey))}
        />
      </div>
    </div>
  );
}
