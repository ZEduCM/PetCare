import type { Pool } from "pg";
import type { Appointment, AppointmentInput } from "@/entities";
import { isUuid } from "@/lib/uuid";
import type { AppointmentRepository } from "@/usecases/ports/appointment-repository";
import { appointmentColumns } from "./columns";

export class PostgresAppointmentRepository implements AppointmentRepository {
  constructor(private readonly db: Pool) {}

  async listByUser(userId: string) {
    const queryText = `
      SELECT ${appointmentColumns}
      FROM appointments a
      JOIN pets p ON p.id = a.pet_id
      WHERE p.user_id = $1
      ORDER BY a.date, a.time`;

    const res = await this.db.query<Appointment>(queryText, [userId]);
    return res.rows;
  }

  // Só insere se o pet pertence ao usuário; caso contrário retorna null.
  async create(userId: string, data: AppointmentInput) {
    if (!isUuid(data.petId)) return null;

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

    const res = await this.db.query<Appointment>(queryText, [
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

  // Atualiza só os campos enviados. Retorna null se o compromisso (ou o novo
  // pet) não pertence ao usuário.
  async update(userId: string, id: string, data: Partial<AppointmentInput>) {
    if (!isUuid(id) || (data.petId !== undefined && !isUuid(data.petId))) {
      return null;
    }

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

    const res = await this.db.query<Appointment>(queryText, [
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

  async delete(userId: string, id: string) {
    if (!isUuid(id)) return false;

    const queryText = `
      DELETE FROM appointments a
      USING pets p
      WHERE a.id = $1 AND p.id = a.pet_id AND p.user_id = $2`;

    const res = await this.db.query(queryText, [id, userId]);
    return res.rowCount === 1;
  }
}
