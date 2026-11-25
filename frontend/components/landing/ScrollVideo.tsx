'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useRef } from 'react';

/** A full-width video scene: muted, looping, plays while on screen and pauses when scrolled away (saves battery and CPU). */
export default function ScrollVideo({ src, mobileSrc, poster, children, cta }: {
  src: string; mobileSrc?: string; poster: string; children: ReactNode; cta?: { href: string; text: string };
}) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.muted = true;  // some browsers only autoplay when muted is set as a property
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.15 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <section className="relative h-[88vh] min-h-[480px] w-full overflow-hidden bg-black">
      <video ref={video} poster={poster} muted loop playsInline autoPlay preload="metadata" aria-hidden
        className="absolute inset-0 h-full w-full object-cover">
        {mobileSrc && <source src={mobileSrc} type="video/mp4" media="(max-width: 767px)" />}
        <source src={src} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-6 pb-16 text-white md:px-12">
        {children}
        {cta && (
          <Link href={cta.href} className="mt-6 inline-flex rounded-full bg-ivory-50 px-6 py-3 text-sm font-bold text-sage-900 shadow-lg transition hover:bg-white">
            {cta.text}
          </Link>
        )}
      </div>
    </section>
  );
}
