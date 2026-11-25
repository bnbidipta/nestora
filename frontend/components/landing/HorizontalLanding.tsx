'use client';

/**
 * The landing page as one fold that moves sideways: scroll, swipe or use the arrow keys to go from scene to scene.
 * A mix of the three Stitch directions: warm paper + terracotta and serif type (A), numbered plates and full-bleed
 * imagery (B), family warmth and big friendly numbers (C). No vertical scrolling.
 */
import Link from 'next/link';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import styles from '@/content/landing-styles.json';

const PlotHouse3D = dynamic(() => import('./PlotHouse3D'), { ssr: false });
const BUILD_STEPS = ['Your plot', 'Plinth and foundation', 'Ground floor walls', 'Upper floor', 'Roof terrace'];

const C = { paper: '#FAF7F2', ink: '#1F1B16', muted: '#6B6358', terra: '#B4532A', green: '#1F4D45', gold: '#C9962B', line: '#E6DFD3' };
const SCENES = ['Home', 'How it works', 'Designs', 'Family', 'In numbers', 'Styles', 'Start'];
const DESIGNS = [
  { src: '/video/hero-poster.jpg', name: 'The Terrace House', note: 'Roof garden and pergola' },
  { src: '/styles/indian_contemporary/ai-1.webp', name: 'The Jaali House', note: 'Screens that cool and shade' },
  { src: '/styles/indian_contemporary/ai-2.webp', name: 'The Courtyard House', note: 'Light at the centre' },
  { src: '/styles/indian_contemporary/ai-3.webp', name: 'The Verandah House', note: 'Deep eaves, open sides' },
];

function Reveal({ on, delay = 0, children, className = '' }: { on: boolean; delay?: number; children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 28 }} animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

function Plate({ n, label, light }: { n: number; label: string; light?: boolean }) {
  return (
    <p className={`font-mono text-[11px] uppercase tracking-[0.25em] ${light ? 'text-white/75' : ''}`} style={light ? undefined : { color: C.muted }}>
      <span style={{ color: light ? C.gold : C.terra }}>{String(n).padStart(2, '0')}</span> / {label}
    </p>
  );
}

function Film({ src, mobile, poster }: { src: string; mobile: string; poster: string }) {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = v.current;
    if (!el) return;
    el.muted = true;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? el.play().catch(() => {}) : el.pause()), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <video ref={v} poster={poster} muted loop playsInline autoPlay preload="metadata" aria-hidden className="absolute inset-0 h-full w-full object-cover">
      <source src={mobile} type="video/mp4" media="(max-width: 767px)" />
      <source src={src} type="video/mp4" />
    </video>
  );
}

function Cta({ href, children, ghost }: { href: string; children: ReactNode; ghost?: boolean }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${ghost ? 'border border-white/60 text-white hover:bg-white/10' : 'text-white shadow-lg'}`}
      style={ghost ? undefined : { background: C.terra }}>
      {children} {!ghost && <ArrowRight className="h-4 w-4" aria-hidden />}
    </Link>
  );
}

/** Options as cards on a turning 3D carousel. */
function Carousel({ on }: { on: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setI((x) => (x + 1) % DESIGNS.length), 3200);
    return () => clearInterval(t);
  }, [on]);
  return (
    <div className="relative h-full w-full [perspective:1400px]" aria-roledescription="carousel">
      {DESIGNS.map((d, k) => {
        let o = k - i;
        if (o > DESIGNS.length / 2) o -= DESIGNS.length;
        if (o < -DESIGNS.length / 2) o += DESIGNS.length;
        const a = Math.abs(o);
        return (
          <motion.figure key={d.name} onClick={() => setI(k)}
            className="absolute left-1/2 top-1/2 w-[min(78vw,420px)] cursor-pointer overflow-hidden rounded-2xl bg-white shadow-2xl"
            animate={{ x: `calc(-50% + ${o * 58}%)`, y: '-50%', rotateY: o * -32, scale: 1 - a * 0.16, opacity: a > 1 ? 0 : 1 - a * 0.35, zIndex: 10 - a }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} style={{ transformStyle: 'preserve-3d' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.src} alt="" className="aspect-[4/3] w-full object-cover" />
            <figcaption className="flex items-baseline justify-between px-5 py-4">
              <span className="font-display text-xl" style={{ color: C.ink }}>{d.name}</span>
              <span className="text-xs" style={{ color: C.muted }}>{d.note}</span>
            </figcaption>
          </motion.figure>
        );
      })}
    </div>
  );
}

/** v1: the films lead. v2: the visitor's own plot grows a 3D house, and "How it works" builds it as you scroll. */
export default function HorizontalLanding({ variant = 'v1' }: { variant?: 'v1' | 'v2' }) {
  const v2 = variant === 'v2';
  const track = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState(0);
  const lock = useRef(0);
  const [plot, setPlot] = useState({ w: 30, d: 40 });
  const [grow, setGrow] = useState(0);
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  stepRef.current = step;
  useEffect(() => {  // the hero house grows again whenever the plot size changes
    if (!v2) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => { const p = Math.min(1, (t - t0) / 3200); setGrow(p); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [v2, plot.w, plot.d]);

  const go = useCallback((n: number) => {
    const el = track.current;
    if (!el) return;
    const k = Math.max(0, Math.min(SCENES.length - 1, n));
    el.scrollTo({ left: k * el.clientWidth, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setCur(Math.round(el.scrollLeft / el.clientWidth))); };
    // vertical wheel / trackpad moves one scene per gesture
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      const now = Date.now();
      if (now - lock.current < 750 || Math.abs(e.deltaY) < 8) return;
      lock.current = now;
      const i = Math.round(el.scrollLeft / el.clientWidth), fwd = e.deltaY > 0;
      if (v2 && i === 1 && (fwd ? stepRef.current < BUILD_STEPS.length - 1 : stepRef.current > 0)) { setStep((s) => s + (fwd ? 1 : -1)); return; }
      go(i + (fwd ? 1 : -1));
    };
    const onKey = (e: KeyboardEvent) => {
      const i = Math.round(el.scrollLeft / el.clientWidth);
      const fwd = ['ArrowRight', 'PageDown', ' '].includes(e.key), back = ['ArrowLeft', 'PageUp'].includes(e.key);
      if (!fwd && !back) return;
      e.preventDefault();
      if (v2 && i === 1 && (fwd ? stepRef.current < BUILD_STEPS.length - 1 : stepRef.current > 0)) { setStep((s) => s + (fwd ? 1 : -1)); return; }
      go(i + (fwd ? 1 : -1));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => { el.removeEventListener('scroll', onScroll); el.removeEventListener('wheel', onWheel); window.removeEventListener('keydown', onKey); cancelAnimationFrame(raf); };
  }, [go, v2]);

  const scene = 'relative h-[100svh] w-screen flex-none snap-start overflow-hidden';
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: C.paper, color: C.ink }}>
      <header className={`fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 md:px-10 ${(v2 ? [3, 4] : [0, 3, 4]).includes(cur) ? 'text-white' : ''}`}>
        <Link href="/" className="flex items-center gap-2.5" aria-label="Nestora home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={30} height={30} className="h-[30px] w-[30px]" />
          <span className="font-display text-lg tracking-wide">Nestora</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/house/nest_f24390ae0f" className="hidden underline-offset-4 hover:underline sm:inline">See a sample home</Link>
          <Link href="/questionnaire" className="rounded-full px-4 py-2 font-semibold text-white" style={{ background: C.terra }}>Design my home</Link>
        </nav>
      </header>

      <div ref={track} className="flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" tabIndex={0}
        aria-label="Nestora, scroll sideways">
        {/* 01 hero (v2): your plot, a house growing on it */}
        {v2 && (
          <section className={scene} aria-label={SCENES[0]}>
            <div className="grid h-full grid-rows-[auto_1fr] px-6 pb-16 pt-24 md:grid-cols-[1fr_1.15fr] md:grid-rows-1 md:px-14 md:pt-24">
              <div className="flex flex-col justify-center gap-6">
                <Reveal on={cur === 0}><Plate n={1} label="Home" /></Reveal>
                <Reveal on={cur === 0} delay={0.1}>
                  <h1 className="font-display text-5xl leading-[1.02] md:text-7xl">Your family.<br />Your plot.<br /><em className="not-italic" style={{ color: C.terra }}>A home that fits.</em></h1>
                </Reveal>
                <Reveal on={cur === 0} delay={0.2}>
                  <p className="text-sm font-semibold" style={{ color: C.muted }}>How big is your plot?</p>
                  <div className="mt-2 flex items-center gap-2 text-lg">
                    {(['w', 'd'] as const).map((k, n) => (
                      <span key={k} className="contents">
                        {n === 1 && <span style={{ color: C.muted }}>×</span>}
                        <input type="number" inputMode="numeric" min={15} max={120} value={plot[k]} aria-label={k === 'w' ? 'Plot width in feet' : 'Plot depth in feet'}
                          onChange={(e) => { const v = Math.max(15, Math.min(120, Number(e.target.value) || 0)); setPlot((p) => ({ ...p, [k]: v })); }}
                          className="h-12 w-24 rounded-xl border bg-white px-3 text-center font-semibold" style={{ borderColor: C.line }} />
                      </span>
                    ))}
                    <span style={{ color: C.muted }}>ft</span>
                  </div>
                </Reveal>
                <Reveal on={cur === 0} delay={0.3} className="flex flex-wrap gap-3">
                  <Cta href={`/questionnaire?w=${plot.w}&d=${plot.d}`}>Design my home</Cta>
                  <Link href="/house/nest_f24390ae0f" className="inline-flex items-center rounded-full border px-6 py-3 text-sm font-semibold" style={{ borderColor: C.ink }}>See a sample home</Link>
                </Reveal>
              </div>
              <div className="relative min-h-0">
                <PlotHouse3D plotW={plot.w} plotD={plot.d} progress={grow} className="absolute inset-0" />
                <p className="absolute bottom-2 right-2 text-[11px]" style={{ color: C.muted }}>{plot.w} × {plot.d} ft, an example home drawn by Nestora</p>
              </div>
            </div>
          </section>
        )}

        {/* 01 hero (v1): the house being built on the plot */}
        {!v2 && <section className={scene} aria-label={SCENES[0]}>
          <Film src="/video/hero.mp4" mobile="/video/hero-mobile.mp4" poster="/video/hero-poster.jpg" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          <div className="relative flex h-full max-w-3xl flex-col justify-end gap-6 px-6 pb-24 text-white md:px-14 md:pb-28">
            <Reveal on={cur === 0}><Plate n={1} label="Home" light /></Reveal>
            <Reveal on={cur === 0} delay={0.1}>
              <h1 className="font-display text-5xl leading-[1.02] md:text-7xl">Your family.<br />Your plot.<br /><em className="not-italic" style={{ color: C.gold }}>A home that fits.</em></h1>
            </Reveal>
            <Reveal on={cur === 0} delay={0.2}><p className="max-w-md text-base text-white/85 md:text-lg">Answer a few questions. Get four house designs that follow the building rules, with a cost estimate and a walk-through in 3D.</p></Reveal>
            <Reveal on={cur === 0} delay={0.3} className="flex flex-wrap gap-3"><Cta href="/questionnaire">Design my home</Cta><Cta href="/house/nest_f24390ae0f" ghost>See a sample home</Cta></Reveal>
          </div>
        </section>}

        {/* 02 how it works: three big numbered steps */}
        <section className={scene} aria-label={SCENES[1]}>
          <div className="grid h-full grid-rows-[auto_1fr] gap-6 px-6 pb-20 pt-24 md:grid-cols-[1.1fr_1fr] md:grid-rows-1 md:gap-12 md:px-14 md:pt-28">
            <div className="flex flex-col justify-center gap-6">
              <Reveal on={cur === 1}><Plate n={2} label="How it works" /></Reveal>
              <Reveal on={cur === 1} delay={0.1}><h2 className="font-display text-4xl leading-tight md:text-6xl">Three steps.<br />No drawings needed.</h2></Reveal>
              <ol className="mt-2 grid gap-5">
                {[['Tell us about your plot and family', 'Size, direction, who lives with you, your budget.'],
                  ['Pick from four designs', 'Each one different, each checked against the rules.'],
                  ['Walk through it', 'In 3D, room by room, with a cost estimate in ₹ lakh.']].map(([t, d], k) => (
                  <Reveal key={t} on={cur === 1} delay={0.2 + k * 0.1}>
                    <li className="flex items-baseline gap-5 border-t pt-4" style={{ borderColor: C.line }}>
                      <span className="font-display text-4xl" style={{ color: C.terra }}>{k + 1}</span>
                      <span><span className="block text-lg font-semibold">{t}</span><span className="text-sm" style={{ color: C.muted }}>{d}</span></span>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>
            {v2 ? (
              <div className="relative min-h-0 overflow-hidden rounded-3xl bg-[#F2EDE4]">
                <PlotHouse3D plotW={plot.w} plotD={plot.d} progress={step / (BUILD_STEPS.length - 1)} className="absolute inset-0" />
                <ol className="absolute left-4 top-4 space-y-1 text-xs">
                  {BUILD_STEPS.map((s, k) => (
                    <li key={s} className="flex items-center gap-2" style={{ color: k <= step ? C.ink : C.muted, fontWeight: k === step ? 700 : 400 }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: k <= step ? C.terra : C.line }} />{s}
                    </li>
                  ))}
                </ol>
                <p className="absolute bottom-3 right-4 text-[11px]" style={{ color: C.muted }}>Keep scrolling to build</p>
              </div>
            ) : (
              <Reveal on={cur === 1} delay={0.2} className="relative hidden overflow-hidden rounded-3xl md:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/video/hero-poster.jpg" alt="A finished house on its plot" className="h-full w-full animate-[kenburns_18s_ease-in-out_infinite_alternate] object-cover" />
              </Reveal>
            )}
          </div>
        </section>

        {/* 03 designs: a 3D carousel of options */}
        <section className={scene} aria-label={SCENES[2]}>
          <div className="flex h-full flex-col px-6 pb-16 pt-24 md:px-14 md:pt-28">
            <Reveal on={cur === 2}><Plate n={3} label="Your designs" /></Reveal>
            <Reveal on={cur === 2} delay={0.1}><h2 className="mt-3 font-display text-4xl md:text-6xl">Four designs. <span style={{ color: C.terra }}>Each one different.</span></h2></Reveal>
            <div className="relative mt-4 min-h-0 flex-1"><Carousel on={cur === 2} /></div>
            <p className="text-center text-[11px]" style={{ color: C.muted }}>Illustrations</p>
          </div>
        </section>

        {/* 04 family film */}
        <section className={scene} aria-label={SCENES[3]}>
          <Film src="/video/family.mp4" mobile="/video/family-mobile.mp4" poster="/video/family-poster.jpg" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="relative flex h-full max-w-3xl flex-col justify-end gap-5 px-6 pb-24 text-white md:px-14 md:pb-28">
            <Reveal on={cur === 3}><Plate n={4} label="Family" light /></Reveal>
            <Reveal on={cur === 3} delay={0.1}><h2 className="font-display text-4xl leading-tight md:text-6xl">A home the whole family grows into.</h2></Reveal>
            <Reveal on={cur === 3} delay={0.2}><p className="max-w-lg text-white/85">Room for the grandparents downstairs, the kids to play, and evenings together on the terrace. See it in 3D before a brick is laid.</p></Reveal>
          </div>
        </section>

        {/* 05 numbers */}
        <section className={scene} aria-label={SCENES[4]} style={{ background: C.green, color: '#F4EFE6' }}>
          <div className="flex h-full flex-col justify-center gap-10 px-6 md:px-14">
            <Reveal on={cur === 4}><Plate n={5} label="In numbers" light /></Reveal>
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
              {[['4', 'designs for every family'], ['53', 'architectural styles'], ['3D', 'walk-through of every room'], ['₹', 'cost estimate in lakh, by finish']].map(([n, t], k) => (
                <Reveal key={t} on={cur === 4} delay={0.1 + k * 0.1}>
                  <p className="font-display text-7xl md:text-8xl" style={{ color: C.gold }}>{n}</p>
                  <p className="mt-2 max-w-[14rem] text-base text-[#F4EFE6]/85">{t}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 06 styles ribbon */}
        <section className={scene} aria-label={SCENES[5]}>
          <div className="flex h-full flex-col gap-6 pb-14 pt-24 md:pt-28">
            <div className="px-6 md:px-14">
              <Reveal on={cur === 5}><Plate n={6} label="Styles" /></Reveal>
              <Reveal on={cur === 5} delay={0.1}><h2 className="mt-3 font-display text-4xl md:text-6xl">From Kerala to the Konkan coast.</h2></Reveal>
            </div>
            <div className="flex min-h-0 flex-1 gap-4 overflow-hidden px-6 md:px-14">
              {styles.slice(0, 6).map((s, k) => (
                <Reveal key={s.style} on={cur === 5} delay={0.1 + k * 0.07} className="group relative min-w-[42vw] flex-1 overflow-hidden rounded-2xl md:min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt={s.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                    <p className="font-display text-xl">{s.name}</p>
                    <a href={s.page} target="_blank" rel="noreferrer" className="text-[10px] text-white/70 underline-offset-2 hover:underline">Photo: {s.author}, {s.licence}</a>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 07 start */}
        <section className={scene} aria-label={SCENES[6]}>
          <div className="flex h-full flex-col items-start justify-center gap-7 px-6 md:px-14">
            <Reveal on={cur === 6}><Plate n={7} label="Start" /></Reveal>
            <Reveal on={cur === 6} delay={0.1}><h2 className="font-display text-5xl leading-[1.02] md:text-8xl">Start with<br />your plot.</h2></Reveal>
            <Reveal on={cur === 6} delay={0.2} className="flex flex-wrap gap-3">
              <Cta href="/questionnaire">Design my home</Cta>
              <Link href="/house/nest_f24390ae0f" className="inline-flex items-center rounded-full border px-6 py-3 text-sm font-semibold" style={{ borderColor: C.ink }}>See a sample home</Link>
            </Reveal>
            <p className="max-w-md text-xs" style={{ color: C.muted }}>Concept designs and estimates. A licensed architect and structural engineer must review any plan before you build.</p>
            <nav className="flex gap-5 text-xs" style={{ color: C.muted }}><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
          </div>
        </section>
      </div>

      {/* progress and arrows */}
      <div className={`fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 px-5 pb-5 md:px-10 ${(v2 ? [3, 4] : [0, 3, 4]).includes(cur) ? 'text-white' : ''}`}>
        <button type="button" onClick={() => go(cur - 1)} disabled={cur === 0} aria-label="Previous" className="rounded-full border border-current p-2 disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button>
        <div className="h-px flex-1 bg-current/30 relative"><div className="absolute inset-y-0 left-0 bg-current transition-all duration-500" style={{ width: `${((cur + 1) / SCENES.length) * 100}%`, height: 2, top: -0.5 }} /></div>
        <span className="font-mono text-xs tabular-nums">{String(cur + 1).padStart(2, '0')} / {String(SCENES.length).padStart(2, '0')}</span>
        <button type="button" onClick={() => go(cur + 1)} disabled={cur === SCENES.length - 1} aria-label="Next" className="rounded-full border border-current p-2 disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
