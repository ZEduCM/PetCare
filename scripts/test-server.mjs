import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { startTestDatabase } from "./test-database.mjs";

const port = process.env.TEST_SERVER_PORT ?? "3200";

if (!existsSync(new URL("../.next/BUILD_ID", import.meta.url))) {
  console.error("Run `next build` before starting the test server.");
  process.exit(1);
}

const database = await startTestDatabase({ seed: true });
const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");

const server = spawn(
  process.execPath,
  [nextBin, "start", "--hostname", "127.0.0.1", "--port", port],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URI: database.url,
      DATABASE_SSL: "false",
      CLARITY_PROJECT_ID: "",
    },
  },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}

server.on("exit", async (code) => {
  await database.stop();
  process.exit(code ?? 0);
});
