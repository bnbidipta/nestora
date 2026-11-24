import { NextRequest, NextResponse } from 'next/server';

/** Stores the visitor's country and state/region (Vercel edge headers) so the app can default units and the plot-area unit. */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const month = { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' as const };
  const country = req.headers.get('x-vercel-ip-country');
  if (country && /^[A-Z]{2}$/.test(country) && req.cookies.get('nestora_country')?.value !== country) {
    res.cookies.set('nestora_country', country, month);
  }
  const region = req.headers.get('x-vercel-ip-country-region');
  if (region && /^[A-Z0-9]{1,3}$/.test(region) && req.cookies.get('nestora_region')?.value !== region) {
    res.cookies.set('nestora_region', region, month);
  }
  return res;
}

export const config = { matcher: ['/((?!_next|swipe/|images/|favicon).*)'] };
