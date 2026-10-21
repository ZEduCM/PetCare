import { describe, expect, test } from "vitest";
import { messages } from "@/messages";
import { CreatePet } from "@/usecases/pets/create-pet";
import { GetPet } from "@/usecases/pets/get-pet";
import { ListPets } from "@/usecases/pets/list-pets";
import { ValidationError } from "@/validators/validation-error";
import { InMemoryPetRepository } from "@/tests/support/fakes";

const data = { name: " Luna ", type: "Gato", breed: "SRD", age: "2", weight: "3.5" };

function setup() {
  const pets = new InMemoryPetRepository();
  return {
    pets,
    createPet: new CreatePet(pets),
    listPets: new ListPets(pets),
    getPet: new GetPet(pets),
  };
}

describe("CreatePet", { tags: ["RF-02"] }, () => {
  test("grava o pet do usuário com os dados normalizados", async () => {
    const { pets, createPet } = setup();

    const pet = await createPet.execute({ userId: "user-1", data });

    expect(pet.ownerId).toBe("user-1");
    expect(pet.name).toBe("Luna");
    expect(pet.icon).toBe("🐾");
    expect(pets.pets).toEqual([pet]);
  });

  test("não grava nada quando os dados são inválidos", async () => {
    const { pets, createPet } = setup();

    await expect(createPet.execute({ userId: "user-1", data: { ...data, breed: "" } })).rejects.toThrow(
      new ValidationError(messages.requiredFields),
    );
    expect(pets.pets).toEqual([]);
  });
});

describe("ListPets", { tags: ["RF-02", "RF-09"] }, () => {
  test("retorna só os pets do usuário", async () => {
    const { createPet, listPets } = setup();
    const luna = await createPet.execute({ userId: "user-1", data });
    await createPet.execute({ userId: "user-2", data: { ...data, name: "Bob" } });

    expect(await listPets.execute({ userId: "user-1" })).toEqual([luna]);
  });
});

describe("GetPet", { tags: ["RF-02", "RF-09"] }, () => {
  test("encontra o pet só para o dono", async () => {
    const { createPet, getPet } = setup();
    const luna = await createPet.execute({ userId: "user-1", data });

    expect(await getPet.execute({ userId: "user-1", id: luna.id })).toBe(luna);
    expect(await getPet.execute({ userId: "user-2", id: luna.id })).toBeNull();
  });
});
