import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: 'https://keycloak.134.122.124.102.nip.io/:path*',
      },
    ];
  },
};

export default nextConfig;
