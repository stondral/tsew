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
    unoptimized: false,
  },
};

export default withPayload(nextConfig);
