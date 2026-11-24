/** Room colours and names, shared by every plan drawing. Every type has a name: nothing on a plan is unlabelled. */
export const FILL: Record<string, string> = {
  living: '#E8DCC4', lounge: '#E8DCC4', dining: '#EFE3CB', kitchen: '#F3C9A5', bedroom: '#C9D8C5', bedroom_master: '#B7CDB2',
  bedroom_elder: '#A9C7B8', bedroom_guest: '#C9D8C5', study: '#D4DCE8', toilet: '#BFD9E6', stair: '#9CA3AF', lift: '#7C8594',
  lift_shaft: '#7C8594', passage: '#F1F1EE', porch: '#D6D3CC', entrance: '#E4E0D6', puja: '#F4D47A', balcony: '#DCE9D5',
  utility: '#E5E5E2', help: '#D9D2E6', laundry: '#CFE3EC', store: '#E2DED7', dress: '#D8CFC0', garden: '#CFE3C0', lawn: '#CFE3C0',
  open: '#ECEAE3', parking: '#D6D3CC', terrace: '#E7E3D8',
};

const NAME: Record<string, [string, string]> = {  // [full, short]
  living: ['Living room', 'Living'], lounge: ['Family lounge', 'Lounge'], dining: ['Dining', 'Dining'], kitchen: ['Kitchen', 'Kitchen'],
  bedroom: ['Bedroom', 'Bed'], bedroom_master: ['Master bedroom', 'Master'], bedroom_elder: ["Elders' bedroom", 'Elders'],
  bedroom_guest: ['Guest bedroom', 'Guest'], study: ['Study', 'Study'], toilet: ['Bathroom', 'Bath'], stair: ['Stair', 'Stair'],
  lift: ['Lift', 'Lift'], lift_shaft: ['Lift', 'Lift'], passage: ['Passage', 'Pass.'], porch: ['Car parking', 'Parking'],
  entrance: ['Entrance', 'Entry'], puja: ['Puja', 'Puja'], balcony: ['Balcony', 'Balc.'], utility: ['Utility', 'Util.'],
  help: ["Help's room", 'Help'], laundry: ['Wash area', 'Wash'], store: ['Store', 'Store'], dress: ['Dressing', 'Dress'],
  garden: ['Garden', 'Garden'], lawn: ['Garden', 'Garden'], open: ['Open space', 'Open'], parking: ['Parking', 'Parking'],
  terrace: ['Terrace', 'Terrace'],
};

const title = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** "Bedroom 2", "Master bedroom", "Bathroom (master)": readable name from the room id and type. */
export function roomName(id: string, type?: string, short = false): string {
  const t = type ?? id.replace(/_\d+$/, '');
  const base = NAME[t]?.[short ? 1 : 0] ?? title(t);
  const n = id.match(/_(\d+)$/)?.[1];
  if (t === 'toilet') {
    const who = id.replace(/^toilet_?/, '').replace(/_?\d+$/, '');
    if (!short && who && who !== 'common') return `${base} (${who.replace(/_/g, ' ')})`;
  }
  if (id.startsWith('rental_')) return `Rental ${base.toLowerCase()}`;
  return n && t === 'bedroom' ? `${base} ${n}` : base;  // other ids end in a floor number, not a room number
}

/**
 * Label for a box w x d (drawing units): the largest font that fits, or null when even a small font won't fit
 * (the caller then draws a numbered tag and lists it in the key).
 */
export function fitLabel(text: string, w: number, d: number, max = 1.6, min = 0.75): number | null {
  const size = Math.min(max, (w * 0.9) / (text.length * 0.56), d * 0.4);
  return size >= min ? size : null;
}
