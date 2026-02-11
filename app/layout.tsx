import type { ReactNode } from 'react';
import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  metadataBase: new URL('https://stondemporium.tech'),
  title: {
    default: "Stondemporium | Premier E-commerce Marketplace",
    template: "%s | Stondemporium",
  },
  description: "Discover a curated selection of premium products at Stondemporium. The ultimate marketplace for quality and innovation.",
  keywords: ["e-commerce", "marketplace", "premium products", "shopping", "Stondemporium"],
  authors: [{ name: "Stondemporium Team" }],
  creator: "Stondemporium",
  publisher: "Stondemporium",
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
    locale: 'en_US',
    url: 'https://stondemporium.tech',
    siteName: 'Stondemporium',
    title: 'Stondemporium | Premier E-commerce Marketplace',
    description: 'Discover a curated selection of premium products at Stondemporium. The ultimate marketplace for quality and innovation.',
    images: [
      {
        url: '/icon.jpg',
        width: 1200,
        height: 630,
        alt: 'Stondemporium Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stondemporium | Premier E-commerce Marketplace',
    description: 'Discover a curated selection of premium products at Stondemporium. The ultimate marketplace for quality and innovation.',
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
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

