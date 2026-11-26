'use client';

import { setLengthUnit, useLengthUnit } from '@/lib/units';

/** ft / m switch shown in the header; changes every length and area in the app. */
export default function UnitSwitch() {
  const u = useLengthUnit();
  return (
    <div role="radiogroup" aria-label="Units" className="flex rounded-full border border-line p-0.5 text-xs font-semibold">
      {(['ft', 'm'] as const).map((x) => (
        <button key={x} type="button" role="radio" aria-checked={u === x} onClick={() => setLengthUnit(x)}
          className={`rounded-full px-3 py-1 ${u === x ? 'bg-card text-ink' : 'text-ink/80 hover:text-ink'}`}>
          {x === 'ft' ? 'Feet' : 'Metres'}
        </button>
      ))}
    </div>
  );
}
