
import type { Pet, PetInput } from "@/entities";
import { pool } from "../db";
import { petColumns } from "./columns";


export async function insertPet(
  userId: string,
  data: PetInput,
): Promise<Pet> {
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

  const res = await pool.query<Pet>(queryText, [
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
