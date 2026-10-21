import type { User } from "@/entities";
import { pool } from "../db";

type UserWithPassword = User & { password: string };

export async function getUserByEmail(
  email: string,
): Promise<UserWithPassword | null> {
  const queryText = `SELECT id, name, email, password FROM users WHERE lower(email) = lower($1)`;

  const res = await pool.query<UserWithPassword>(queryText, [email]);
  return res.rows[0] ?? null;
}
