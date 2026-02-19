import Link from 'next/link';

import { SlotKey, slotLabel } from '@/lib/slots';
import { buildItemPath } from '@/lib/slug';

type ItemWornSourceProps = {
  displaySlots: string[];
  droppedBy?: string;
  duplicateOf?: string;
};

export const ItemWornSource = ({ displaySlots, droppedBy, duplicateOf }: ItemWornSourceProps) => (
  <div className="card-section">

    <h2 className="text-sm font-semibold text-white">Worn & Source</h2>

    {/* Item Worn Slots */}
    <div className="flex flex-wrap gap-2">
      {displaySlots.length ? (
        displaySlots.map((slot) => (
          <span key={slot} className="badge-tag">
            {slotLabel(slot as SlotKey)}
          </span>
        ))
      ) : (
        <p className="text-sm text-zinc-500">Slot unknown</p>
      )}
    </div>
    
    {/* Item Dropped by label */}
    <p className="text-sm text-zinc-300">
      Dropped by: <span className="text-white">{droppedBy || 'Unknown'}</span>
    </p>

    {/* Is item a duplicate? If so what of? */}
    {duplicateOf ? (
      <p className="text-sm text-zinc-400">
        Possible duplicate of{' '}
        <Link href={buildItemPath(duplicateOf, undefined)} className="text-orange-300 hover:underline">
          {duplicateOf}
        </Link>
      </p>
    ) : null}

  </div>
);
