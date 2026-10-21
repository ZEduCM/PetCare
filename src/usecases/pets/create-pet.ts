import { Pet, type PetData } from "@/entities";
import type { PetRepository } from "../ports/pet-repository";
import type { UseCase } from "../use-case";

export interface CreatePetInput {
  userId: string;
  data: Omit<PetData, "id" | "ownerId">;
}

export class CreatePet implements UseCase<CreatePetInput, Pet> {
  constructor(private readonly pets: PetRepository) {}

  async execute({ userId, data }: CreatePetInput) {
    const pet = new Pet({ ...data, ownerId: userId });
    await this.pets.create(pet);
    return pet;
  }
}
