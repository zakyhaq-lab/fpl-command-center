import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Experimental: proxy the FPL API through Vercel's edge, which may not be
  // blocked the way serverless functions are (they get 403).
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
