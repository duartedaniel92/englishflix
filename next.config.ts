import type { NextConfig } from "next";

// cacheComponents fica desligado: a CSP com nonce exige renderização dinâmica (ver docs/adr/0001).
const nextConfig: NextConfig = {
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
