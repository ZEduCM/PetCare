import type { Pet } from "@/entities";
import type { PetRepository } from "../ports/pet-repository";
import type { UseCase } from "../use-case";

export interface ListPetsInput {
  userId: string;
}

export class ListPets implements UseCase<ListPetsInput, Pet[]> {
  constructor(private readonly pets: PetRepository) {}

  execute({ userId }: ListPetsInput) {
    return this.pets.listByUser(userId);
  }
}
