import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'localhost',
      'www.stondemporium.tech',
      '5d24be3406adc0ad4610405062859db9.r2.cloudflarestorage.com'
    ],
    unoptimized: true,
  },
};

export default withPayload(nextConfig);
