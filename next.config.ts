import type { NextConfig } from "next";
import { assertNoPublicSecrets } from "./lib/env";

// O build (e o dev) para antes de uma chave secreta ir parar no JavaScript do navegador.
assertNoPublicSecrets();

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
