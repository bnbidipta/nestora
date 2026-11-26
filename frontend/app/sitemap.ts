import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nestora-studio.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/questionnaire', '/contact', '/privacy', '/terms'].map((p) => ({ url: `${SITE}${p}`, changeFrequency: 'weekly' }));
}
