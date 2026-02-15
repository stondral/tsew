import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

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
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
  },
};

export default withPayload(nextConfig);
