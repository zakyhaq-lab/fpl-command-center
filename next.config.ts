import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Proxy the FPL API through Vercel's edge: FPL answers serverless functions
  // with 403 but lets the edge through. Used by src/lib/fpl/api.ts on Vercel.
  async rewrites() {
    return [{ source: "/fpl/:path*", destination: "https://fantasy.premierleague.com/api/:path*/" }];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
