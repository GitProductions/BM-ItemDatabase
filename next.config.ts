import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  images: { unoptimized: true },
  
  reactCompiler: true,
  turbopack: {
    // Force Turbopack to treat this folder as the project root to avoid mis-detected lockfiles higher up the tree.
    root: __dirname,
  },
};

export default nextConfig;
