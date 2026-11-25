'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useRef, useState } from 'react';

/**
 * A full-screen video scene. Desktop: pinned while you scroll, and scrolling plays the video (every frame is a keyframe,
 * so seeking is smooth). Phones: plays on a quiet loop. Reduced motion: the still frame only.
 */
export default function ScrollVideo({ src, poster, children, cta, tall = 220 }: {
  src: string; poster: string; children: ReactNode; cta?: { href: string; text: string }; tall?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<'scrub' | 'loop' | 'still'>('still');
  const [p, setP] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setMode(reduce ? 'still' : window.matchMedia('(min-width: 768px)').matches ? 'scrub' : 'loop');
  }, []);

  useEffect(() => {
    if (mode !== 'scrub') return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = wrap.current, v = video.current;
      if (!el || !v || !v.duration) return;
      const r = el.getBoundingClientRect();
      const prog = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
      setP(prog);
      const t = prog * (v.duration - 0.05);
      if (Math.abs(v.currentTime - t) > 0.03) v.currentTime = t;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  return (
    <section ref={wrap} className="relative" style={{ height: mode === 'scrub' ? `${tall}vh` : 'auto' }}>
      <div className={`${mode === 'scrub' ? 'sticky top-0 h-screen' : 'relative h-[80vh] min-h-[480px]'} w-full overflow-hidden bg-black`}>
        {mode === 'still' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <video ref={video} src={src} poster={poster} muted playsInline preload="auto" aria-hidden
            autoPlay={mode === 'loop'} loop={mode === 'loop'} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-6 pb-16 text-white md:px-12"
          style={mode === 'scrub' ? { opacity: Math.min(1, 0.25 + p * 2), transform: `translateY(${(1 - Math.min(1, p * 2)) * 24}px)` } : undefined}>
          {children}
          {cta && (
            <Link href={cta.href} className="mt-6 inline-flex rounded-full bg-ivory-50 px-6 py-3 text-sm font-bold text-sage-900 shadow-lg transition hover:bg-white">
              {cta.text}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
