import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nestora-studio.vercel.app';

// Houses, votes and /v1, /v2 carry a noindex tag instead of being blocked here, so link-preview crawlers can still read them.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/login'] }, sitemap: `${SITE}/sitemap.xml` };
}
