import type { Pool } from "pg";
import { Pet, type PetProps } from "@/entities";
import { isUuid } from "@/lib/uuid";
import type { PetRepository } from "@/usecases/ports/pet-repository";
import { petColumns } from "./columns";

export class PostgresPetRepository implements PetRepository {
  constructor(private readonly db: Pool) {}

  async listByUser(userId: string) {
    const queryText = `SELECT ${petColumns} FROM pets WHERE user_id = $1 ORDER BY name`;

    const res = await this.db.query<PetProps>(queryText, [userId]);
    return res.rows.map((row) => new Pet(row));
  }

  async findById(userId: string, id: string) {
    if (!isUuid(id)) return null;

    const queryText = `SELECT ${petColumns} FROM pets WHERE id = $1 AND user_id = $2`;

    const res = await this.db.query<PetProps>(queryText, [id, userId]);
    return res.rows[0] ? new Pet(res.rows[0]) : null;
  }

  async create(pet: Pet) {
    const queryText = `
      INSERT INTO pets (
        id, user_id, name, type, breed, age, weight,
        next_vaccine, icon, description
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        NULLIF($8, '')::date, $9, $10
      )`;

    await this.db.query(queryText, [
      pet.id,
      pet.ownerId,
      pet.name,
      pet.type,
      pet.breed,
      pet.age,
      pet.weight,
      pet.vaccine,
      pet.icon,
      pet.description,
    ]);
  }
}
