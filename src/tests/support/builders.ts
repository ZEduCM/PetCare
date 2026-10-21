import type { Appointment, Pet, User } from "@/types";
import type { ApiClient } from "./api-client";

let sequence = 0;

export function uniqueEmail(prefix = "tutor") {
  sequence += 1;
  return `${prefix}.${Date.now()}.${sequence}@petcare.test`;
}

export function newUser(overrides: Partial<{ name: string; email: string; password: string }> = {}) {
  return {
    name: "Ana Tutora",
    email: uniqueEmail(),
    password: "petcare123",
    ...overrides,
  };
}

export function newPet(overrides: Record<string, unknown> = {}) {
  return {
    name: "Thor",
    type: "Cachorro",
    breed: "Golden Retriever",
    age: "4",
    weight: "12",
    vaccine: "2030-05-20",
    description: "Gosta de passear.",
    ...overrides,
  };
}

export function newAppointment(petId: string, overrides: Record<string, unknown> = {}) {
  return {
    petId,
    title: "Vacina anual",
    category: "Saúde",
    date: "2030-05-20",
    time: "09:30",
    notes: "Levar a carteirinha.",
    ...overrides,
  };
}

export async function signUp(client: ApiClient, overrides: Parameters<typeof newUser>[0] = {}) {
  const user = newUser(overrides);
  await client.post("/api/auth/register", user);
  const response = await client.post<User>("/api/auth/login", {
    email: user.email,
    password: user.password,
  });
  return { ...user, id: response.body.id };
}

export async function createPet(client: ApiClient, overrides: Record<string, unknown> = {}) {
  const response = await client.post<Pet>("/api/pets", newPet(overrides));
  return response.body;
}

export async function createAppointment(
  client: ApiClient,
  petId: string,
  overrides: Record<string, unknown> = {},
) {
  const response = await client.post<Appointment>(
    "/api/appointments",
    newAppointment(petId, overrides),
  );
  return response.body;
}
