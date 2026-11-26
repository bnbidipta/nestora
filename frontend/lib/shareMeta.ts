/** Server-side: title and picture for a shared house link (photo, else the saved street view, else the brand image). */
import type { Metadata } from 'next';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const words = (s?: string) => (s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '');

export async function houseMeta(id: string, prefix = ''): Promise<Metadata> {
  try {  // the free backend may be asleep: give up after 4 s and use the brand image
    const r = await fetch(`${API}/api/v1/house/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(4000), next: { revalidate: 300 } });
    const t = (await r.json()).data;
    const md = t?.metadata ?? {};
    const style = words(md.look?.style);
    const floors = (t?.floors?.length ?? 1) > 1 ? `G+${t.floors.length - 1}` : 'single-storey';
    const plot = t?.plot ? `${Math.round(t.plot.plot_width_ft)}×${Math.round(t.plot.plot_depth_ft)} ft plot` : '';
    const title = `${prefix}${style ? `${style} ` : ''}${floors} home${plot ? `, ${plot}` : ''} · Nestora`;
    const image = md.render?.photo || md.render?.preview;
    return {
      title, description: 'A concept house design with rule checks and a cost estimate, made on Nestora.',
      openGraph: { title, images: [image ? { url: image, width: 1344, height: 768 } : { url: '/video/hero-poster.jpg', width: 1920, height: 1080 }] },
      robots: { index: false },  // people's houses stay out of search results
    };
  } catch {
    return { title: `${prefix}A home designed on Nestora`, robots: { index: false } };
  }
}
