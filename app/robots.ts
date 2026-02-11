import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/administrator/', '/seller/', '/api/'],
    },
    sitemap: 'https://stondemporium.tech/sitemap.xml',
  };
}
