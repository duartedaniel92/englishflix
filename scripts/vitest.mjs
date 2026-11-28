// No Windows, um terminal aberto em `c:` minúsculo faz o Vitest se carregar duas vezes (`c:` e `C:`
// viram módulos diferentes) e nenhum teste roda. Chamá-lo a partir do caminho canônico evita isso.
import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";

const result = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", ...process.argv.slice(2)], {
  cwd: realpathSync.native(process.cwd()),
  stdio: "inherit",
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
