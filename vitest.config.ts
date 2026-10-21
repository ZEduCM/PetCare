import { defineConfig } from "vitest/config";
import { BaseSequencer, type TestSpecification } from "vitest/node";
import react from "@vitejs/plugin-react";
import path from "path";

class PathOrderSequencer extends BaseSequencer {
  async sort(files: TestSpecification[]) {
    return [...files].sort((a, b) => a.moduleId.localeCompare(b.moduleId));
  }
}

export default defineConfig({
  plugins: [react()],
  test: {
    // Enables the global testing API (e.g., describe, test, expect) without explicit imports
    globals: true,
    // Configures path aliases to match your Next.js tsconfig paths (if using '@/*')
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
    sequence: { sequencer: PathOrderSequencer },
    tags: [
      { name: "RF-01", description: "Cadastro e login de usuário" },
      { name: "RF-02", description: "Cadastro e listagem de pets" },
      { name: "RF-03", description: "Compromissos (criar, editar, excluir)" },
      { name: "RF-04", description: "Formulário com validações e mensagens de erro" },
      { name: "RF-05", description: "API REST com GET, POST, PUT e DELETE" },
      { name: "RF-06", description: "Tratamento de loading e erros da API" },
      { name: "RF-07", description: "Acessibilidade (labels, foco, ARIA)" },
      { name: "RF-08", description: "Telas responsivas" },
      { name: "RF-09", description: "Proteção de páginas e isolamento dos dados por usuário" },
    ],
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/tests/unit/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "components",
          // Simulates a browser environment using jsdom
          environment: "jsdom",
          include: ["src/tests/unit/**/*.test.tsx"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["src/tests/integration/**/*.test.ts"],
          globalSetup: ["src/tests/support/database-global-setup.ts"],
          setupFiles: [
            "src/tests/support/next-headers.ts",
            "src/tests/support/database-setup.ts",
          ],
          fileParallelism: false,
        },
      },
    ],
  },
});
