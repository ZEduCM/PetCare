import type { Appointment, AppointmentInput } from "@/entities";
import { pool } from "../db";
import { appointmentColumns } from "./columns";

// Só insere se o pet pertence ao usuário; caso contrário retorna null.
export async function insertAppointment(
  userId: string,
  data: AppointmentInput,
): Promise<Appointment | null> {
  const queryText = `
    WITH inserted AS (
      INSERT INTO appointments(pet_id, title, category, date, time, notes)
      SELECT id, $3, $4, $5::date, $6::time, $7
      FROM pets
      WHERE id = $1 AND user_id = $2
      RETURNING *
    )
    SELECT ${appointmentColumns}
    FROM inserted a
    JOIN pets p ON p.id = a.pet_id`;

  const res = await pool.query<Appointment>(queryText, [
    data.petId,
    userId,
    data.title,
    data.category,
    data.date,
    data.time,
    data.notes,
  ]);
  return res.rows[0] ?? null;
}
