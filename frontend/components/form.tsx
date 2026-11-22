'use client';

/**
 * Form controls for the light "paper" intake screens. Every control looks editable: white field,
 * visible border, label above, placeholder or unit, focus ring. Nothing here looks like a stat tile.
 */
import { ChevronDown, Minus, Plus } from 'lucide-react';
import { ReactNode, useId } from 'react';

const ring = 'focus:outline-none focus:ring-2 focus:ring-sage-600/40 focus:border-sage-600';

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-800">{label}</label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-slate-500">{hint}</p>}
    </div>
  );
}

export function NumberInput({ label, hint, value, onChange, unit, min, max, step = 1, placeholder }: {
  label: string; hint?: string; value: number; onChange: (v: number) => void; unit?: string; min?: number; max?: number; step?: number; placeholder?: string;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="relative">
        <input
          id={id} type="number" inputMode="decimal" value={Number.isFinite(value) ? value : ''} min={min} max={max} step={step}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
          className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-14 text-base text-slate-900 shadow-sm placeholder:text-slate-400 ${ring}`}
        />
        {unit && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">{unit}</span>}
      </div>
    </Field>
  );
}

export function TextArea({ label, hint, value, onChange, placeholder, rows = 4 }: {
  label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <textarea id={id} rows={rows} value={value} placeholder={placeholder} maxLength={2000} onChange={(e) => onChange(e.target.value)}
        className={`w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 shadow-sm placeholder:text-slate-400 ${ring}`} />
    </Field>
  );
}

export function Select<T extends string | number>({ label, hint, value, onChange, options }: {
  label: string; hint?: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[];
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="relative">
        <select id={id} value={String(value)}
          onChange={(e) => onChange(options.find((o) => String(o.value) === e.target.value)!.value)}
          className={`w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-10 text-base text-slate-900 shadow-sm ${ring}`}>
          {options.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>
    </Field>
  );
}

/** Small set of mutually exclusive choices shown side by side. */
export function Segmented<T extends string | number>({ label, hint, value, onChange, options }: {
  label: string; hint?: string; value: T; onChange: (v: T) => void; options: { value: T; label: string; sub?: string }[];
}) {
  return (
    <Field label={label} hint={hint}>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button key={String(o.value)} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
              className={`min-w-[88px] flex-1 rounded-lg border px-3 py-2 text-left text-sm transition ${ring} ${on ? 'border-sage-600 bg-sage-50 text-sage-900 ring-1 ring-sage-600' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`}>
              <span className="block font-semibold">{o.label}</span>
              {o.sub && <span className="mt-0.5 block text-xs text-slate-500">{o.sub}</span>}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

export function Stepper({ label, hint, value, onChange, min = 0, max = 10 }: {
  label: string; hint?: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  const id = useId();
  const btn = `flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 ${ring}`;
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`Fewer: ${label}`} className={btn} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}><Minus className="h-4 w-4" /></button>
        <output id={id} aria-live="polite" className="w-10 text-center text-lg font-semibold text-slate-900">{value}</output>
        <button type="button" aria-label={`More: ${label}`} className={btn} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}><Plus className="h-4 w-4" /></button>
      </div>
    </Field>
  );
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 self-start rounded-lg border border-slate-300 bg-white p-3 hover:border-slate-400">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-400 accent-sage-700" />
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}
