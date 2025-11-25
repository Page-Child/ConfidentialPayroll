import type { NextConfig } from "next";

// Get basePath from environment variable, default to empty string
const basePath = process.env.BASE_PATH || '';

// Check if this is a static export for GitHub Pages
const isStaticExport = process.env.NODE_ENV === 'production' && process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  // Enable static export
  output: 'export',
  
  // Set basePath for GitHub Pages (empty for username.github.io, /repo-name for others)
  basePath: basePath,
  
  // Enable trailing slash
  trailingSlash: true,
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // Headers (effective in server mode)
  ...(!isStaticExport && {
    headers() {
      // Required by FHEVM
      return Promise.resolve([
        {
          source: '/:path*',
          headers: [
            { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
            { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          ],
        },
        {
          source: '/:path*.wasm',
          headers: [
            { key: 'Content-Type', value: 'application/wasm' },
            { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          ],
        },
      ]);
    },
  })
};

export default nextConfig;

