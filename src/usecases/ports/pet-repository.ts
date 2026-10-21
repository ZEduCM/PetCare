import type { Pet } from "@/entities";

export interface PetRepository {
  listByUser(userId: string): Promise<Pet[]>;
  findById(userId: string, id: string): Promise<Pet | null>;
  create(pet: Pet): Promise<void>;
}
