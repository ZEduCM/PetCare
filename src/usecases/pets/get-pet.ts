import type { Pet } from "@/entities";
import type { PetRepository } from "../ports/pet-repository";
import type { UseCase } from "../use-case";

export interface GetPetInput {
  userId: string;
  id: string;
}

export class GetPet implements UseCase<GetPetInput, Pet | null> {
  constructor(private readonly pets: PetRepository) {}

  execute({ userId, id }: GetPetInput) {
    return this.pets.findById(userId, id);
  }
}
