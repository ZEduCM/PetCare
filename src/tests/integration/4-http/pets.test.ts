import { describe, expect, test } from "vitest";
import { pool } from "@/database/db";
import { messages } from "@/messages";
import { ApiClient } from "@/tests/support/api-client";
import { signUp } from "@/tests/support/builders";
import type { Pet } from "@/types";

const validPet = { name: "Rex", type: "Cachorro", breed: "Labrador", age: 3, weight: 12, icon: "🐶" };

async function countPets() {
  const { rows } = await pool.query("SELECT count(*)::int AS total FROM pets");
  return rows[0].total as number;
}

async function signedIn() {
  const client = new ApiClient();
  const user = await signUp(client);
  return { client, user };
}

describe("GET /api/pets", { tags: ["RF-02", "RF-09"] }, () => {
  test("PET-01 — listar pets sem estar logado responde 401", async () => {
    expect(await new ApiClient().get("/api/pets")).toEqual({ status: 401, body: { message: messages.loginRequired } });
  });

  test("PET-03 — lista só os pets do usuário logado", async () => {
    const { client } = await signedIn();
    const other = await signedIn();
    await client.post("/api/pets", { ...validPet, name: "Thor" });
    await other.client.post("/api/pets", { ...validPet, name: "Bob" });

    const response = await client.get<Pet[]>("/api/pets");

    expect(response.status).toBe(200);
    expect(response.body.map((pet) => pet.name)).toEqual(["Thor"]);
  });
});

describe("POST /api/pets", { tags: ["RF-02", "RF-04"] }, () => {
  test("PET-02 — cadastrar pet sem estar logado responde 401 e não grava", async () => {
    const response = await new ApiClient().post("/api/pets", validPet);

    expect(response.status).toBe(401);
    expect(await countPets()).toBe(0);
  });

  test("PET-04 — JSON malformado responde 400 e não grava", async () => {
    const { client } = await signedIn();

    expect(await client.post("/api/pets", "{")).toEqual({ status: 400, body: { message: messages.invalidBody } });
    expect(await countPets()).toBe(0);
  });

  test.each([
    ["nome vazio", { name: "" }],
    ["nome só com espaços", { name: "   " }],
    ["tipo vazio", { type: "" }],
    ["raça só com espaço", { breed: " " }],
    ["idade ausente", { age: undefined }],
    ["peso ausente", { weight: undefined }],
    ["idade nula", { age: null }],
  ])("PET-05 — campo obrigatório inválido (%s) responde 400 e não grava", async (_, change) => {
    const { client } = await signedIn();

    const response = await client.post("/api/pets", { ...validPet, ...change });

    expect(response).toEqual({ status: 400, body: { message: messages.requiredFields } });
    expect(await countPets()).toBe(0);
  });

  test("PET-06 — cadastro válido responde 201 com o pet gravado", async () => {
    const { client } = await signedIn();

    const response = await client.post<Pet>("/api/pets", validPet);

    expect(response.status).toBe(201);
    expect((await client.get<Pet[]>("/api/pets")).body).toEqual([response.body]);
  });

  test("PET-07 — normaliza os dados antes de gravar", async () => {
    const { client } = await signedIn();

    const response = await client.post<Pet>("/api/pets", { ...validPet, name: " Rex ", breed: " Labrador " });

    expect(response.body).toMatchObject({ name: "Rex", breed: "Labrador", age: "3", weight: "12" });
  });

  test("PET-08 — aplica os valores padrão dos campos opcionais", async () => {
    const { client } = await signedIn();

    const response = await client.post<Pet>("/api/pets", {
      name: "Rex",
      type: "Cachorro",
      breed: "Labrador",
      age: 3,
      weight: 12,
    });

    expect(response.body).toMatchObject({ icon: "🐾", vaccine: "", description: "" });
  });

  test("idade 100 é aceita (limite superior)", async () => {
    const { client } = await signedIn();

    expect((await client.post("/api/pets", { ...validPet, age: 100 })).status).toBe(201);
  });

  test("PET-09 — idade 0 é aceita", async () => {
    const { client } = await signedIn();

    expect((await client.post("/api/pets", { ...validPet, age: 0 })).status).toBe(201);
  });

  test("PET-10 — peso 0,1 é aceito", async () => {
    const { client } = await signedIn();

    expect((await client.post("/api/pets", { ...validPet, weight: 0.1 })).status).toBe(201);
  });

  test("DEF-06 — corpo null responde 400", async () => {
    const { client } = await signedIn();

    expect(await client.post("/api/pets", "null")).toEqual({ status: 400, body: { message: messages.invalidBody } });
  });

  test.each(["31/02/2026", "2026-02-31"])("DEF-08 — data de vacina inválida (%s) responde 400", async (vaccine) => {
    const { client } = await signedIn();

    const response = await client.post("/api/pets", { ...validPet, vaccine });

    expect(response).toEqual({ status: 400, body: { message: messages.invalidVaccineDate } });
    expect(await countPets()).toBe(0);
  });
});

describe("Defeitos do cadastro de pet", { tags: ["RF-02", "RF-04"] }, () => {
  async function expectRejected(change: Record<string, unknown>) {
    const { client } = await signedIn();

    const response = await client.post("/api/pets", { ...validPet, ...change });

    expect(response.status).toBe(400);
    expect(await countPets()).toBe(0);
    return response;
  }

  test("DEF-01 — idade negativa responde 400", async () => {
    expect((await expectRejected({ age: -5 })).body).toEqual({ message: messages.invalidAge });
  });

  test("DEF-02 — idade acima de 100 responde 400", async () => {
    expect((await expectRejected({ age: 101 })).body).toEqual({ message: messages.invalidAge });
  });

  test.each(["abc", "2.5", "2 anos"])("DEF-04 — idade não numérica (%s) responde 400", async (age) => {
    expect((await expectRejected({ age })).body).toEqual({ message: messages.invalidAge });
  });

  test.each(["name", "type", "breed"])("DEF-05 — %s que não é texto responde 400", async (field) => {
    expect((await expectRejected({ [field]: 123 })).body).toEqual({ message: messages.requiredFields });
  });
});
