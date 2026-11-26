'use client';

/**
 * Shown while designs are being made (about 30-60 s): the steps the engine actually goes through, and a sketch of a
 * plan whose rooms keep rearranging until they settle. The sketch is illustrative; the steps are real.
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

const STEPS = [
  ['Reading your brief', 2],
  ['Applying the building rules for your plot: setbacks, FSI, height', 4],
  ['Sketching arrangements from Indian home layouts', 7],
  ['Solving each plan: every room reachable, store and puja kept', 14],
  ['Stacking bathrooms and the stair floor over floor', 6],
  ['Giving each option its own roof and look', 3],
  ['Checking every design against the rules', 5],
  ['Estimating the cost', 3],
] as const;

const ROOMS = [
  { n: 'Living', c: '#E9DFC9' }, { n: 'Kitchen', c: '#F2C9A8' }, { n: 'Dining', c: '#EFE3CC' }, { n: 'Bed', c: '#CFE0C9' },
  { n: 'Bath', c: '#C7DCE6' }, { n: 'Puja', c: '#F3DB8A' }, { n: 'Stair', c: '#C9C6D6' }, { n: 'Bed', c: '#D7E6CF' },
];
// a few arrangements (grid areas on a 4x3 grid) the sketch cycles through before settling on the last
const LAYOUTS = [
  ['1/1/2/3', '3/1/4/2', '2/1/3/3', '1/3/3/5', '3/2/4/3', '3/3/4/4', '2/3/3/4', '3/4/4/5'],
  ['2/1/4/3', '1/1/2/2', '1/2/2/3', '1/3/2/5', '2/3/3/4', '3/3/4/4', '2/4/3/5', '3/4/4/5'],
  ['1/1/3/3', '3/1/4/2', '3/2/4/3', '1/3/2/5', '2/3/3/4', '2/4/3/5', '3/3/4/4', '3/4/4/5'],
];

export default function Designing() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const s = Date.now();
    const id = setInterval(() => setT((Date.now() - s) / 1000), 250);
    return () => clearInterval(id);
  }, []);
  let acc = 0;
  const at = STEPS.findIndex(([, d]) => (acc += d) > t);
  const cur = at === -1 ? STEPS.length - 1 : at;  // the last step waits for the server
  const layout = LAYOUTS[Math.min(LAYOUTS.length - 1, Math.floor(t / 4) % (t > 30 ? 1 : LAYOUTS.length) + (t > 30 ? LAYOUTS.length - 1 : 0))];

  return (
    <div className="mx-auto grid max-w-4xl gap-8 py-10 md:grid-cols-2" role="status" aria-live="polite">
      <div className="grid aspect-[4/3] grid-cols-4 grid-rows-3 gap-1.5 rounded-2xl bg-paper p-3 shadow-xl">
        {ROOMS.map((r, i) => (
          <motion.div key={i} layout transition={{ type: 'spring', stiffness: 120, damping: 18 }} style={{ gridArea: layout[i], background: r.c }}
            className="flex items-center justify-center rounded-md border border-black/10 text-xs font-semibold text-ink/80">{r.n}</motion.div>
        ))}
      </div>
      <div>
        <h1 className="text-2xl font-bold text-ink">Designing your home</h1>
        <p className="mt-1 text-sm text-muted">This takes about a minute. Every option is solved and checked, not picked from a catalogue.</p>
        <ol className="mt-5 space-y-2.5">
          {STEPS.map(([label], i) => (
            <li key={label} className={`flex items-start gap-2.5 text-sm ${i < cur ? 'text-muted' : i === cur ? 'text-ink' : 'text-muted'}`}>
              {i < cur ? <Check className="mt-0.5 h-4 w-4 flex-none text-green" aria-hidden />
                : i === cur ? <Loader2 className="mt-0.5 h-4 w-4 flex-none animate-spin" aria-hidden />
                  : <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-line" aria-hidden />}
              {label}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
