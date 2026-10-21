import { afterAll, beforeEach, inject } from "vitest";

process.env.DATABASE_URI = inject("databaseUrl");
process.env.DATABASE_SSL = "false";

const { pool } = await import("@/database/db");

beforeEach(async () => {
  await pool.query("TRUNCATE users, sessions, pets, appointments CASCADE");
});

afterAll(async () => {
  await pool.end();
});
