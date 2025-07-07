import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "xsgames.co",
      "s3-alpha-sig.figma.com",
      "picsum.photos",
      ...(process.env.NEXT_PUBLIC_API
        ? [new URL(process.env.NEXT_PUBLIC_API).hostname]
        : []),
    ],
  },
  webpack(config) {
    // Configures webpack to handle SVG files with SVGR. SVGR optimizes and transforms SVG files
    // into React components. See https://react-svgr.com/docs/next/

    // Grab the existing rule that handles SVG imports
    // @ts-ignore - this is a private property that is not typed
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg")
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: ["@svgr/webpack"],
      }
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
  env: {
    NEXT_PUBLIC_API: process.env.NEXT_PUBLIC_API,
  },
};

export default nextConfig;

// Configuration object tells the next-pwa plugin
/*const withPWA = require('next-pwa')({
	dest: 'public', // Destination directory for the PWA files
	register: true, // Register the PWA service worker
	skipWaiting: true, // Skip waiting for service worker activation
	sw: '/sw.js'
})

module.exports = withPWA(nextConfig)
*/
