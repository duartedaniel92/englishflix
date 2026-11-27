import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Os specs de e2e/ usam o runner do Playwright, não o do Vitest.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
