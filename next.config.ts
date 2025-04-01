import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: process.env.NEXT_PUBLIC_KEYCLOAK_URL + '/:path*',
      },
    ];
  },
};

export default nextConfig;
