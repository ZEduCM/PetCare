import type { Pet } from "@/entities";
import { pool } from "../db";
import { petColumns } from "./columns";

export async function getPets(userId: string) {
  const queryText = `SELECT ${petColumns} FROM pets WHERE user_id = $1 ORDER BY name`;

  const res = await pool.query<Pet>(queryText, [userId]);
  return res.rows;
}
