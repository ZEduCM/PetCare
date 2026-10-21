import type { User } from "@/entities";
import { hashPassword } from "@/lib/password";
import { pool } from "../db";

export async function insertUser(params: {
  name: string;
  email: string;
  password: string;
}) {
  const queryText = `INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING id, name, email`;

  const res = await pool.query<User>(queryText, [
    params.name,
    params.email,
    await hashPassword(params.password),
  ]);
  return res.rows[0];
}
