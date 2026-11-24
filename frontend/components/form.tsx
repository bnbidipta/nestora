'use client';

/**
 * Form controls for the intake screens. One control per kind of answer, all the same height:
 * NumberField (type or use the arrows), Select (any list choice), Toggle (yes/no), TextArea.
 * Explanations live behind an (i) tip, never as text under the field.
 */
import { ChevronDown, Info, Minus, Plus } from 'lucide-react';
import { ReactNode, useId } from 'react';

const ring = 'focus:outline-none focus:ring-2 focus:ring-sage-600/40 focus:border-sage-600';
const box = `h-11 w-full rounded-lg border border-slate-300 bg-white text-base text-slate-900 shadow-sm ${ring}`;

export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button type="button" aria-label={text} className="rounded-full text-slate-400 hover:text-slate-600 focus:text-slate-600 focus:outline-none">
        <Info className="h-4 w-4" aria-hidden />
      </button>
      <span role="tooltip"
        className="pointer-events-none absolute left-1/2 top-6 z-20 hidden w-64 -translate-x-1/2 rounded-lg bg-slate-900 p-2.5 text-xs font-normal leading-relaxed text-white shadow-lg group-focus-within:block group-hover:block">
        {text}
      </span>
    </span>
  );
}

export function Field({ label, info, children, htmlFor }: { label: string; info?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex h-5 items-center gap-1.5">
        <label htmlFor={htmlFor} title={label} className="truncate text-sm font-semibold text-slate-800">{label}</label>
        {info && <InfoTip text={info} />}
      </div>
      {children}
    </div>
  );
}

/** A number you can type, or nudge with the arrows. */
export function NumberField({ label, info, value, onChange, unit, min = 0, max, step = 1, placeholder }: {
  label: string; info?: string; value: number; onChange: (v: number) => void; unit?: string; min?: number; max?: number; step?: number; placeholder?: string;
}) {
  const id = useId();
  const clamp = (v: number) => Math.min(max ?? Infinity, Math.max(min, v));
  const nudge = (d: number) => onChange(clamp((Number.isFinite(value) ? value : min) + d));
  const btn = `flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 ${ring}`;
  return (
    <Field label={label} info={info} htmlFor={id}>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`Less: ${label}`} className={btn} disabled={value <= min} onClick={() => nudge(-step)}><Minus className="h-4 w-4" /></button>
        <div className="relative flex-1">
          <input id={id} type="number" inputMode="decimal" value={Number.isFinite(value) ? value : ''} min={min} max={max} step={step} placeholder={placeholder}
            onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
            className={`${box} px-3 text-center ${unit ? 'pr-10' : ''} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`} />
          {unit && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">{unit}</span>}
        </div>
        <button type="button" aria-label={`More: ${label}`} className={btn} disabled={max !== undefined && value >= max} onClick={() => nudge(step)}><Plus className="h-4 w-4" /></button>
      </div>
    </Field>
  );
}

export function TextArea({ label, info, value, onChange, placeholder, rows = 4 }: {
  label: string; info?: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  const id = useId();
  return (
    <Field label={label} info={info} htmlFor={id}>
      <textarea id={id} rows={rows} value={value} placeholder={placeholder} maxLength={2000} onChange={(e) => onChange(e.target.value)}
        className={`w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 shadow-sm placeholder:text-slate-400 ${ring}`} />
    </Field>
  );
}

export function Select<T extends string | number>({ label, info, value, onChange, options }: {
  label: string; info?: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[];
}) {
  const id = useId();
  return (
    <Field label={label} info={info} htmlFor={id}>
      <div className="relative">
        <select id={id} value={String(value)}
          onChange={(e) => onChange(options.find((o) => String(o.value) === e.target.value)!.value)}
          className={`${box} appearance-none px-3 pr-10`}>
          {options.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>
    </Field>
  );
}

/** Yes/no. Same height as the other fields so grids line up. */
export function Toggle({ label, info, checked, onChange }: { label: string; info?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 hover:border-slate-400">
      <label className="flex flex-1 cursor-pointer items-center gap-3">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 shrink-0 rounded border-slate-400 accent-sage-700" />
        <span className="text-sm font-semibold text-slate-800">{label}</span>
      </label>
      {info && <InfoTip text={info} />}
    </div>
  );
}
