import withBundleAnalyzerInit from '@next/bundle-analyzer';
import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const withBundleAnalyzer = withBundleAnalyzerInit({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
      },
      {
        protocol: "https",
        hostname: "stondemporium.tech",
      },
      {
        protocol: "https",
        hostname: "www.stondemporium.tech",
      },
      {
        protocol: "https",
        hostname: "5d24be3406adc0ad4610405062859db9.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      }
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 31536000, // 1 year cache
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@radix-ui/react-icons'],
  },
};

export default withBundleAnalyzer(withPayload(nextConfig));
