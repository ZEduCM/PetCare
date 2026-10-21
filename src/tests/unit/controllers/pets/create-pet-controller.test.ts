import { describe, expect, test, vi } from "vitest";
import { CreatePetController } from "@/controllers/pets/create-pet-controller";
import { Pet, User } from "@/entities";

const ana = new User({ name: "Ana", email: "ana@petcare.com", passwordHash: "hash" });
const luna = new Pet({ ownerId: ana.id, name: "Luna", type: "Gato", breed: "SRD", age: "2", weight: "3" });

describe("CreatePetController", { tags: ["RF-02", "RF-05"] }, () => {
  test("mapeia só os campos conhecidos do corpo", async () => {
    const createPet = { execute: vi.fn(async () => luna) };

    const response = await new CreatePetController(createPet).handle({
      body: { name: "Luna", type: "Gato", breed: "SRD", age: 2, weight: 3.5, ownerId: "someone-else", id: "forged" },
      query: {},
      user: ana,
    });

    expect(createPet.execute).toHaveBeenCalledWith({
      userId: ana.id,
      data: {
        name: "Luna",
        type: "Gato",
        breed: "SRD",
        age: "2",
        weight: "3.5",
        vaccine: undefined,
        icon: undefined,
        description: undefined,
      },
    });
    expect(response).toEqual({ statusCode: 201, body: luna });
  });
});
