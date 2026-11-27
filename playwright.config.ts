import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // A primeira visita a uma rota no `next dev` compila sob demanda; 30 s por teste é pouco a frio.
  timeout: 90_000,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: { baseURL: BASE_URL },
  projects: [
    {
      name: "celular-360",
      use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    // No CI o build já foi feito, então `next start` sobe rápido; local, reaproveita o `next dev`.
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
