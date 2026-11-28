import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// O "piso" do CONSTRAINTS.md: regras que nenhuma mudança pode desligar.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Comentário `eslint-disable` não desliga regra: o erro continua aparecendo.
    linterOptions: { noInlineConfig: true },
    rules: {
      "no-console": "error",
      "no-empty": "error",
      // Pega comentário que começa com TODO/FIXME. Em português, "// Todo aluno..." também
      // é pego: reescreva o comentário ("Cada aluno...").
      "no-warning-comments": ["error", { terms: ["todo", "fixme"] }],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts"],
    rules: {
      // Nenhuma forma de calar o TypeScript, nem a "com descrição".
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": true, "ts-ignore": true, "ts-nocheck": true },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "e2e/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          // skipIf/runIf pulam por condição; fail/fails passam quando o teste falha.
          selector: "CallExpression[callee.property.name=/^(skip|skipIf|runIf|only|todo|fixme|fail|fails)$/]",
          message: "Teste pulado ou focado não entra no repositório (CONSTRAINTS.md).",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
