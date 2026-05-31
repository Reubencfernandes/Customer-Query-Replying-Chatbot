import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['motion'],
  // Keep these Node-only parsers/SDK out of the server bundle so their
  // dynamic requires (pdf.js worker, native bits) resolve at runtime.
  serverExternalPackages: ['pdf-parse', 'mammoth', 'xlsx', 'cohere-ai'],
  // Allow the brand file-type icons served from icons8 to flow through
  // the next/image optimizer. The query string carries the icon id, so
  // `search` is omitted to permit it.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.icons8.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
