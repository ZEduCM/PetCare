import { describe, expect, test, vi } from "vitest";
import { UpdateAppointmentController } from "@/controllers/appointments/update-appointment-controller";
import { Appointment, Pet, User } from "@/entities";
import type { UpdateAppointmentInput } from "@/usecases/appointments/update-appointment";
import { passThroughValidator, rejectingValidator } from "@/tests/support/fakes";

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

describe("UpdateAppointmentController", { tags: ["RF-03", "RF-05"] }, () => {
  test("envia só os campos presentes no corpo", async () => {
    const updateAppointment = { execute: vi.fn(async () => vaccine) };
    const controller = new UpdateAppointmentController(passThroughValidator(), updateAppointment);

    await controller.handle({ body: { completed: true }, query: { id: vaccine.id }, user: ana });

    expect(updateAppointment.execute).toHaveBeenCalledWith({
      userId: ana.id,
      id: vaccine.id,
      data: {
        petId: undefined,
        title: undefined,
        category: undefined,
        date: undefined,
        time: undefined,
        notes: undefined,
        completed: true,
      },
    });
  });

  test("ignora completed que não é booleano", async () => {
    const updateAppointment = { execute: vi.fn<(input: UpdateAppointmentInput) => Promise<Appointment>>(async () => vaccine) };
    const controller = new UpdateAppointmentController(passThroughValidator(), updateAppointment);

    await controller.handle({ body: { completed: "yes" }, query: { id: vaccine.id }, user: ana });

    expect(updateAppointment.execute.mock.calls[0][0].data.completed).toBeUndefined();
  });

  test("recusa id inválido", async () => {
    const updateAppointment = { execute: vi.fn() };
    const controller = new UpdateAppointmentController(rejectingValidator("invalid id"), updateAppointment);

    await expect(controller.handle({ body: {}, query: { id: "1" }, user: ana })).rejects.toThrow("invalid id");
    expect(updateAppointment.execute).not.toHaveBeenCalled();
  });
});
