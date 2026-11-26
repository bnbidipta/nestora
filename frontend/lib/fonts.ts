/**
 * Nestora's two fonts, everywhere (pages, share video, 3D labels, plans):
 *  - Libre Caslon Display, regular only: page and section titles.
 *  - Schibsted Grotesk 400/500/600: everything else (labels, buttons, prices, measurements).
 */
import { Libre_Caslon_Display, Schibsted_Grotesk } from 'next/font/google';

export const display = Libre_Caslon_Display({ subsets: ['latin'], weight: '400', variable: '--font-display', display: "swap" });
export const body = Schibsted_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body', display: "swap" });

/** CSS font-family lists for canvas text (canvas can't read CSS variables). */
export const CANVAS_BODY = `${body.style.fontFamily}, sans-serif`;
export const CANVAS_DISPLAY = `${display.style.fontFamily}, serif`;
