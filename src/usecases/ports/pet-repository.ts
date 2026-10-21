import type { Pet, PetInput } from "@/entities";

export interface PetRepository {
  listByUser(userId: string): Promise<Pet[]>;
  findById(userId: string, id: string): Promise<Pet | null>;
  create(userId: string, data: PetInput): Promise<Pet>;
}
