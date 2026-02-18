import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import QueryProvider from '@/providers/QueryProvider';
import Script from 'next/script';

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata = {
  metadataBase: new URL('https://stondemporium.tech'),
  title: {
    default: "Buy Premium Products Online in India | Stondemporium",
    template: "%s | Stondemporium",
  },
  description: "Shop premium products online at Stondemporium. Multi-vendor marketplace with fast shipping across India. Affordable luxury delivered to your door.",
  keywords: [
    "online shopping India",
    "buy products online",
    "e-commerce marketplace",
    "premium products India",
    "multi-vendor marketplace",
    "online store India",
    "shop online",
    "best deals online",
    "fast delivery India",
    "affordable luxury",
    "Stondemporium",
    "buy jewellery online",
    "electronics online India",
    "fashion online shopping",
    "home decor India",
    "trending products 2026",
  ],
  authors: [{ name: "Stondemporium Team" }],
  creator: "Stondemporium",
  publisher: "Stondemporium",
  applicationName: "Stondemporium",
  category: "E-commerce",
  alternates: {
    canonical: 'https://stondemporium.tech',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/icon.jpg',
    apple: '/icon.jpg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://stondemporium.tech',
    siteName: 'Stondemporium',
    title: 'Buy Premium Products Online in India | Stondemporium',
    description: 'Shop premium products online at Stondemporium. Multi-vendor marketplace with fast shipping across India.',
    images: [
      {
        url: '/icon.jpg',
        width: 1200,
        height: 630,
        alt: 'Stondemporium - Premium Online Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buy Premium Products Online in India | Stondemporium',
    description: 'Shop premium products with fast delivery across India. Affordable luxury marketplace.',
    images: ['/icon.jpg'],
    creator: '@stondemporium',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Stondemporium",
    "url": "https://stondemporium.tech",
    "logo": "https://stondemporium.tech/icon.jpg",
    "description": "Premium multi-vendor e-commerce marketplace in India",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN"
    },
    "sameAs": [
      "https://twitter.com/stondemporium",
      "https://facebook.com/stondemporium",
      "https://instagram.com/stondemporium"
    ]
  };

  return (
    <html lang="en">
      <head>
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Google Fonts — non-render-blocking lazy load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          id="google-fonts"
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Outfit:wght@100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Roboto+Slab:wght@100..900&display=swap"
          media="print"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Outfit:wght@100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Roboto+Slab:wght@100..900&display=swap"
          />
        </noscript>
      </head>
      <body>
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema)
          }}
        />
        <Script
          id="google-fonts-loader"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var el = document.getElementById('google-fonts');
                if(el) {
                  if(document.readyState === 'complete') { el.media = 'all'; }
                  else { window.addEventListener('load', function(){ el.media = 'all'; }); }
                }
              })();
            `
          }}
        />
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}

