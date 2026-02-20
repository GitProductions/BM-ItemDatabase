import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // output: 'export',
  // images: { unoptimized: true },

  // reactCompiler: true,
  // turbopack: {
  //   // Force Turbopack to treat this folder as the project root to avoid mis-detected lockfiles higher up the tree.
  //   root: __dirname,
  // },

  
  images: {
    path: '/_next/image',
    qualities: [50, 70, 95],

    // deviceSizes: [320, 420, 768, 1024, 1200, 1920],
    // imageSizes: [32, 48, 64, 96, 128, 256, 384],
    // minimumCacheTTL: 345600, // 4 days in seconds  - this does not seem to be respected by next/image in our current setup
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/avatars/**',
      },
    ],
  },
};

export default nextConfig;
