import type { User } from "@/entities";
import { pool } from "../db";

export async function getSessionUser(token: string): Promise<User | null> {
  const queryText = `
    SELECT u.id, u.name, u.email
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = $1 AND s.expires_at > now()`;

  const res = await pool.query<User>(queryText, [token]);
  return res.rows[0] ?? null;
}
