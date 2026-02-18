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
