import type { MetadataRoute } from 'next';

/**
 * Resolve base URL for sitemap with priority order:
 * 1. NEXT_PUBLIC_SITE_URL (explicitly configured)
 * 2. VERCEL_URL (auto-provided by Vercel, prepend https://)
 * 3. localhost:3000 (only for non-production)
 * 4. https://ghost-allocator.vercel.app (production fallback to avoid localhost)
 */
function getBaseUrl(): string {
  // Priority 1: Explicitly configured site URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Priority 2: Vercel auto-provided URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Priority 3: localhost only for non-production
  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:3000';
  }

  // Priority 4: Production fallback to avoid shipping localhost
  return 'https://ghost-allocator.vercel.app';
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const baseUrl = getBaseUrl();

  // Dev log to show which baseUrl was used
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Sitemap] Using baseUrl: ${baseUrl}`);
  }

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/ghostregime`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ghostregime/how-it-works`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/ghostregime/methodology`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/models`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/why-60-40-dead`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/learn`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/learn/457`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/learn/masterclass`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}
