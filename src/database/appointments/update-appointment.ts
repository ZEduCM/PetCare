import type { Appointment, AppointmentInput } from "@/entities";
import { pool } from "../db";
import { appointmentColumns } from "./columns";

// Atualiza só os campos enviados. Retorna null se o compromisso (ou o novo
// pet) não pertence ao usuário.
export async function updateAppointment(
  id: string,
  userId: string,
  data: Partial<AppointmentInput>,
): Promise<Appointment | null> {
  const queryText = `
    WITH updated AS (
      UPDATE appointments a SET
        pet_id = coalesce($3, a.pet_id),
        title = coalesce($4, a.title),
        category = coalesce($5, a.category),
        date = coalesce($6, a.date),
        time = coalesce($7, a.time),
        notes = coalesce($8, a.notes),
        completed = coalesce($9, a.completed)
      FROM pets owner
      WHERE a.id = $1
        AND owner.id = a.pet_id
        AND owner.user_id = $2
        AND ($3::uuid IS NULL OR EXISTS (
          SELECT 1 FROM pets WHERE id = $3 AND user_id = $2
        ))
      RETURNING a.*
    )
    SELECT ${appointmentColumns}
    FROM updated a
    JOIN pets p ON p.id = a.pet_id`;

  const res = await pool.query<Appointment>(queryText, [
    id,
    userId,
    data.petId,
    data.title,
    data.category,
    data.date,
    data.time,
    data.notes,
    data.completed,
  ]);
  return res.rows[0] ?? null;
}
