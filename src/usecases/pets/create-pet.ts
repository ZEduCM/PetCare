import type { Pet, PetInput } from "@/entities";
import type { PetRepository } from "../ports/pet-repository";
import type { UseCase } from "../use-case";

export interface CreatePetInput {
  userId: string;
  data: Pick<PetInput, "name" | "type" | "breed" | "age" | "weight"> &
    Partial<Pick<PetInput, "vaccine" | "icon" | "description">>;
}

export class CreatePet implements UseCase<CreatePetInput, Pet> {
  constructor(private readonly pets: PetRepository) {}

  execute({ userId, data }: CreatePetInput) {
    return this.pets.create(userId, {
      name: data.name.trim(),
      type: data.type.trim(),
      breed: data.breed.trim(),
      age: data.age,
      weight: data.weight,
      vaccine: data.vaccine ?? "",
      icon: data.icon ?? "🐾",
      description: data.description ?? "",
    });
  }
}
