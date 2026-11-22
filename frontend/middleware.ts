import { NextRequest, NextResponse } from 'next/server';

/** Stores the visitor's country (Vercel edge header) so the app can default units, currency and city pack. */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const country = req.headers.get('x-vercel-ip-country');
  if (country && /^[A-Z]{2}$/.test(country) && req.cookies.get('nestora_country')?.value !== country) {
    res.cookies.set('nestora_country', country, { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' });
  }
  return res;
}

export const config = { matcher: ['/((?!_next|swipe/|images/|favicon).*)'] };
