'use client';

/** "Make a share video": records the 10-second sketch-to-house fly-in in the browser, then preview, share or download it. */
import { useEffect, useState } from 'react';
import { Clapperboard, Download, Share2 } from 'lucide-react';
import type { Look } from '@/lib/house3d';
import type { FlyRoom } from '@/lib/flyIn';
import { track } from '@/lib/analytics';

export default function FlyInVideo({ rooms, look, plot, caption, fileName }: {
  rooms: FlyRoom[]; look?: Look; plot?: [number, number, number, number]; caption: string; fileName: string;
}) {
  const [ok, setOk] = useState(false);
  const [p, setP] = useState<number | null>(null);
  const [vid, setVid] = useState<{ url: string; blob: Blob; ext: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { import('@/lib/flyIn').then((m) => setOk(m.flyInSupported())); }, []);
  useEffect(() => () => { if (vid) URL.revokeObjectURL(vid.url); }, [vid]);
  if (!ok) return null;

  const make = async () => {
    setErr(null); setP(0);
    try {
      const { recordFlyIn } = await import('@/lib/flyIn');
      const r = await recordFlyIn(rooms, look, plot, caption, setP);
      setVid({ url: URL.createObjectURL(r.blob), ...r });
      track('flyin_made');
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not make the video on this device.'); } finally { setP(null); }
  };
  const file = () => vid && new File([vid.blob], `${fileName}.${vid.ext}`, { type: vid.blob.type });
  const share = async () => {
    const f = file();
    if (f && navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], title: caption }).catch(() => {}); track('flyin_shared'); }
  };
  const canShareFile = (() => { const f = file(); return !!f && !!navigator.canShare?.({ files: [f] }); })();

  return (
    <div className="space-y-3 print:hidden">
      <button type="button" onClick={make} disabled={p !== null} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs text-ink hover:bg-paper2 disabled:opacity-60">
        <Clapperboard className="h-3.5 w-3.5" aria-hidden />
        {p !== null ? `Making the video… ${Math.round(p * 100)}%` : vid ? 'Make the video again' : 'Make a share video (10 s)'}
      </button>
      {p !== null && <p className="text-xs text-muted">Keep this tab open while it records.</p>}
      {err && <p role="alert" className="text-xs text-red-700">{err}</p>}
      {vid && (
        <div className="space-y-2">
          <video src={vid.url} controls playsInline loop className="mx-auto max-h-[420px] rounded-lg" aria-label="Fly-in video of this house" />
          <div className="flex gap-2">
            {canShareFile && <button type="button" onClick={share} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green px-3 py-2 text-xs font-semibold text-white"><Share2 className="h-3.5 w-3.5" aria-hidden />Share</button>}
            <a href={vid.url} download={`${fileName}.${vid.ext}`} onClick={() => track('flyin_downloaded')} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs text-ink"><Download className="h-3.5 w-3.5" aria-hidden />Download</a>
          </div>
        </div>
      )}
    </div>
  );
}
