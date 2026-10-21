import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

function readSql(file) {
  return readFile(new URL(`../src/database/${file}`, import.meta.url), "utf8");
}

export async function startTestDatabase({ seed = false } = {}) {
  const db = await PGlite.create();
  await db.exec(await readSql("schema.sql"));
  if (seed) await db.exec(await readSql("seed.sql"));

  const server = new PGLiteSocketServer({
    db,
    host: "127.0.0.1",
    port: 0,
    maxConnections: 100,
  });
  await server.start();

  return {
    url: `postgres://postgres@${server.getServerConn()}/postgres`,
    async stop() {
      await server.stop();
      await db.close();
    },
  };
}
