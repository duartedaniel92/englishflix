import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          // e2e/ usa o runner do Playwright; supabase/tests/ é o projeto "db".
          exclude: [...configDefaults.exclude, "e2e/**", "supabase/**"],
          // Projetos com número de workers diferente precisam de grupos diferentes:
          // primeiro os unitários (em paralelo), depois os de banco (um worker só).
          sequence: { groupOrder: 0 },
        },
      },
      {
        test: {
          name: "db",
          include: ["supabase/tests/**/*.test.ts"],
          // O PGlite (Postgres em WebAssembly) leva mais de 1 min para iniciar numa máquina de 4 GB:
          // um único worker, sem isolamento, compartilha a mesma instância entre os arquivos.
          isolate: false,
          fileParallelism: false,
          sequence: { groupOrder: 1 },
          hookTimeout: 300_000,
          testTimeout: 60_000,
        },
      },
    ],
  },
});
