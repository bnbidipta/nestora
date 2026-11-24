'use client';

import { useEffect, useMemo, useState } from 'react';
import { NumberField, Select } from '@/components/form';
import { areaUnits, defaultAreaUnit, plotArea, saveRegional, useLengthUnit } from '@/lib/units';

/** Side-length units. ft and m follow the header switch by default; yards are common in some regions. */
const SIDE: Record<string, number> = { ft: 1, m: 3.28084, yd: 3 };

/**
 * Plot size, entered either as two sides or as an area in a regional unit plus the side on the road.
 * Always reports feet to the brief.
 */
export default function PlotSize({ widthFt, lengthFt, onChange }: {
  widthFt: number; lengthFt: number; onChange: (widthFt: number, lengthFt: number) => void;
}) {
  const lu = useLengthUnit();
  const [mode, setMode] = useState<'sides' | 'area'>('sides');
  const [sideUnit, setSideUnit] = useState<string>(lu);
  useEffect(() => setSideUnit(lu), [lu]);
  const [units, setUnits] = useState(() => areaUnits(null));
  const [unitId, setUnitId] = useState('sqft');
  const [custom, setCustom] = useState<Record<string, number>>({});
  useEffect(() => { setUnits(areaUnits()); setUnitId(defaultAreaUnit()); }, []);

  const unit = useMemo(() => {
    const u = units.find((x) => x.id === unitId) ?? units[0];
    return custom[u.id] ? { ...u, sqft: custom[u.id] } : u;
  }, [units, unitId, custom]);
  useEffect(() => saveRegional(unit), [unit]);

  const k = SIDE[sideUnit];
  const r1 = (v: number) => Math.round(v * 10) / 10;
  const [areaVal, setAreaVal] = useState(() => r1((widthFt * lengthFt) / unit.sqft));
  useEffect(() => { if (mode === 'sides') setAreaVal(r1((widthFt * lengthFt) / unit.sqft)); }, [mode, widthFt, lengthFt, unit.sqft]);

  const fromArea = (a: number, wFt: number) => onChange(wFt, Number.isFinite(a) && wFt > 0 ? Math.round(((a * unit.sqft) / wFt) * 10) / 10 : NaN);

  return (
    <>
      <Select label="How do you know your plot size?" value={mode} onChange={setMode}
        options={[{ value: 'sides', label: 'I know the lengths of the sides' }, { value: 'area', label: 'I only know the area' }]} />
      {mode === 'sides' ? (
        <Select label="Measured in" value={sideUnit} onChange={setSideUnit}
          options={[{ value: 'ft', label: 'Feet' }, { value: 'm', label: 'Metres' }, { value: 'yd', label: 'Yards' }]} />
      ) : (
        <Select label="Area unit" value={unitId} onChange={setUnitId} options={units.map((u) => ({ value: u.id, label: u.name }))} />
      )}
      {mode === 'sides' ? (
        <>
          <NumberField label="Width (side on the road)" unit={sideUnit} value={r1(widthFt / k)} min={1} onChange={(v) => onChange(v * k, lengthFt)} placeholder="e.g. 30" />
          <NumberField label="Length (away from the road)" unit={sideUnit} value={r1(lengthFt / k)} min={1} onChange={(v) => onChange(widthFt, v * k)} placeholder="e.g. 40" />
        </>
      ) : (
        <>
          <NumberField label="Plot area" unit={unit.name.split(' ')[0]} value={areaVal} min={0} step={unit.sqft >= 1000 ? 0.5 : 1}
            onChange={(a) => { setAreaVal(a); fromArea(a, widthFt); }} />
          <NumberField label={`Width (side on the road)`} unit={lu} value={r1(lu === 'ft' ? widthFt : widthFt / 3.28084)} min={1}
            onChange={(v) => { const w = lu === 'ft' ? v : v * 3.28084; fromArea(areaVal, w); }} />
          {unit.varies && (
            <NumberField label={`1 ${unit.name} = how many sq ft?`} unit="sq ft" value={unit.sqft} min={1}
              info={`The size of a ${unit.name} differs between states. We used the usual value for your area; change it if yours is different.`}
              onChange={(v) => Number.isFinite(v) && v > 0 && setCustom((c) => ({ ...c, [unit.id]: v }))} />
          )}
        </>
      )}
      <p className="text-sm text-slate-600 sm:col-span-2">
        {Number.isFinite(widthFt * lengthFt) && widthFt > 0 && lengthFt > 0
          ? <>Plot: <strong>{plotArea(widthFt * lengthFt, lu, unit)}</strong>{mode === 'area' && <> · about {r1(lu === 'ft' ? widthFt : widthFt / 3.28084)} × {r1(lu === 'ft' ? lengthFt : lengthFt / 3.28084)} {lu}</>}</>
          : 'Enter the plot size.'}
      </p>
    </>
  );
}
