import type { Appointment } from "@/entities";
import { pool } from "../db";
import { appointmentColumns } from "./columns";

export async function getAppointments(userId: string) {
  const queryText = `
    SELECT ${appointmentColumns}
    FROM appointments a
    JOIN pets p ON p.id = a.pet_id
    WHERE p.user_id = $1
    ORDER BY a.date, a.time`;

  const res = await pool.query<Appointment>(queryText, [userId]);
  return res.rows;
}
