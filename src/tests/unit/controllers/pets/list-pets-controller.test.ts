import { describe, expect, test, vi } from "vitest";
import { ListPetsController } from "@/controllers/pets/list-pets-controller";
import { Pet, User } from "@/entities";

const ana = new User({ name: "Ana", email: "ana@petcare.com", passwordHash: "hash" });
const luna = new Pet({ ownerId: ana.id, name: "Luna", type: "Gato", breed: "SRD", age: "2", weight: "3" });

describe("ListPetsController", { tags: ["RF-02", "RF-05"] }, () => {
  test("lista os pets do usuário da sessão", async () => {
    const listPets = { execute: vi.fn(async () => [luna]) };

    const response = await new ListPetsController(listPets).handle({ body: {}, query: {}, user: ana });

    expect(listPets.execute).toHaveBeenCalledWith({ userId: ana.id });
    expect(response).toEqual({ statusCode: 200, body: [luna] });
  });
});
