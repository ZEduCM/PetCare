import { describe, expect, test, vi } from "vitest";
import { CreateAppointmentController } from "@/controllers/appointments/create-appointment-controller";
import { Appointment, Pet, User } from "@/entities";
import { passThroughValidator } from "@/tests/support/fakes";

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

describe("CreateAppointmentController", { tags: ["RF-03", "RF-05"] }, () => {
  test("valida o pet e mapeia o corpo", async () => {
    const createAppointment = { execute: vi.fn(async () => vaccine) };
    const controller = new CreateAppointmentController(passThroughValidator(), createAppointment);

    const response = await controller.handle({
      body: { petId: luna.id, title: "Vacina", category: "Saúde", date: "2030-01-10", time: "09:00", completed: true },
      query: {},
      user: ana,
    });

    expect(createAppointment.execute).toHaveBeenCalledWith({
      userId: ana.id,
      data: { petId: luna.id, title: "Vacina", category: "Saúde", date: "2030-01-10", time: "09:00", notes: undefined },
    });
    expect(response).toEqual({ statusCode: 201, body: vaccine });
  });
});
