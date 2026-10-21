import type { Pool } from "pg";
import type { Pet, PetInput } from "@/entities";
import { isUuid } from "@/lib/uuid";
import type { PetRepository } from "@/usecases/ports/pet-repository";
import { petColumns } from "./columns";

export class PostgresPetRepository implements PetRepository {
  constructor(private readonly db: Pool) {}

  async listByUser(userId: string) {
    const queryText = `SELECT ${petColumns} FROM pets WHERE user_id = $1 ORDER BY name`;

    const res = await this.db.query<Pet>(queryText, [userId]);
    return res.rows;
  }

  async findById(userId: string, id: string) {
    if (!isUuid(id)) return null;

    const queryText = `SELECT ${petColumns} FROM pets WHERE id = $1 AND user_id = $2`;

    const res = await this.db.query<Pet>(queryText, [id, userId]);
    return res.rows[0] ?? null;
  }

  async create(userId: string, data: PetInput) {
    const queryText = `
      WITH inserted AS (
        INSERT INTO pets (
          user_id, name, type, breed, age, weight,
          next_vaccine, icon, description
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          NULLIF($7, '')::date, $8, $9
        )
        RETURNING *
      )
      SELECT ${petColumns}
      FROM inserted
    `;

    const res = await this.db.query<Pet>(queryText, [
      userId,
      data.name,
      data.type,
      data.breed,
      data.age,
      data.weight,
      data.vaccine,
      data.icon,
      data.description,
    ]);
    return res.rows[0];
  }
}
