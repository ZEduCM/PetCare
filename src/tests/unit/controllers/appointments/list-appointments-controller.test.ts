import { describe, expect, test, vi } from "vitest";
import { ListAppointmentsController } from "@/controllers/appointments/list-appointments-controller";
import { Appointment, Pet, User } from "@/entities";

const ana = new User({ name: "Ana", email: "ana@petcare.com", passwordHash: "hash" });
const luna = new Pet({ ownerId: ana.id, name: "Luna", type: "Gato", breed: "SRD", age: "2", weight: "3" });
const vaccine = new Appointment({
  petId: luna.id,
  petName: luna.name,
  title: "Vacina",
  category: "Saúde",
  date: "2030-01-10",
  time: "09:00",
});

describe("ListAppointmentsController", { tags: ["RF-03", "RF-05"] }, () => {
  test("lista os compromissos do usuário da sessão", async () => {
    const listAppointments = { execute: vi.fn(async () => [vaccine]) };

    const response = await new ListAppointmentsController(listAppointments).handle({ body: {}, query: {}, user: ana });

    expect(listAppointments.execute).toHaveBeenCalledWith({ userId: ana.id });
    expect(response.body).toEqual([vaccine]);
  });
});
