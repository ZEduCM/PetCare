import type { Pool } from "pg";
import { Appointment, type AppointmentProps } from "@/entities";
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

    const res = await this.db.query<AppointmentProps>(queryText, [userId]);
    return res.rows.map((row) => new Appointment(row));
  }

  async findById(userId: string, id: string) {
    if (!isUuid(id)) return null;

    const queryText = `
      SELECT ${appointmentColumns}
      FROM appointments a
      JOIN pets p ON p.id = a.pet_id
      WHERE a.id = $1 AND p.user_id = $2`;

    const res = await this.db.query<AppointmentProps>(queryText, [id, userId]);
    return res.rows[0] ? new Appointment(res.rows[0]) : null;
  }

  async create(appointment: Appointment) {
    const queryText = `
      INSERT INTO appointments(
        id, pet_id, title, category, date, time, notes, completed
      )
      VALUES ($1, $2, $3, $4, $5::date, $6::time, $7, $8)`;

    await this.db.query(queryText, [
      appointment.id,
      appointment.petId,
      appointment.title,
      appointment.category,
      appointment.date,
      appointment.time,
      appointment.notes,
      appointment.completed,
    ]);
  }

  async update(appointment: Appointment) {
    const queryText = `
      UPDATE appointments SET
        pet_id = $2,
        title = $3,
        category = $4,
        date = $5::date,
        time = $6::time,
        notes = $7,
        completed = $8
      WHERE id = $1`;

    await this.db.query(queryText, [
      appointment.id,
      appointment.petId,
      appointment.title,
      appointment.category,
      appointment.date,
      appointment.time,
      appointment.notes,
      appointment.completed,
    ]);
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
