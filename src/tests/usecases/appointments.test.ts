import { describe, expect, test } from "vitest";
import { Pet } from "@/entities";
import { messages } from "@/messages";
import { CreateAppointment } from "@/usecases/appointments/create-appointment";
import { DeleteAppointment } from "@/usecases/appointments/delete-appointment";
import { UpdateAppointment } from "@/usecases/appointments/update-appointment";
import { NotFoundError } from "@/usecases/errors";
import { InMemoryAppointmentRepository, InMemoryPetRepository } from "./fakes";

const USER_ID = "user-1";

function setup() {
  const pets = new InMemoryPetRepository();
  const appointments = new InMemoryAppointmentRepository(pets);
  const rex = new Pet({ ownerId: USER_ID, name: "Rex", type: "Cão", breed: "SRD", age: "3", weight: "12" });
  const strangerPet = new Pet({ ownerId: "user-2", name: "Bob", type: "Cão", breed: "SRD", age: "5", weight: "20" });
  pets.pets.push(rex, strangerPet);

  return {
    rex,
    strangerPet,
    appointments,
    create: new CreateAppointment(appointments, pets),
    update: new UpdateAppointment(appointments, pets),
    remove: new DeleteAppointment(appointments),
  };
}

const details = { title: "Vacina", category: "Saúde", date: "2026-11-10", time: "09:30" };

describe("CreateAppointment", () => {
  test("creates an appointment for one of the user's pets", async () => {
    const { create, rex, appointments } = setup();

    const appointment = await create.execute({ userId: USER_ID, data: { ...details, petId: rex.id } });

    expect(appointment.toJSON()).toMatchObject({ ...details, petId: rex.id, pet: "Rex", completed: false });
    expect(appointments.appointments).toEqual([appointment]);
  });

  test("fails when the pet belongs to another user", async () => {
    const { create, strangerPet } = setup();

    await expect(
      create.execute({ userId: USER_ID, data: { ...details, petId: strangerPet.id } }),
    ).rejects.toThrow(new NotFoundError(messages.petNotFound));
  });
});

describe("UpdateAppointment", () => {
  test("applies the changes and saves the appointment", async () => {
    const { create, update, rex, appointments } = setup();
    const { id } = await create.execute({ userId: USER_ID, data: { ...details, petId: rex.id } });

    const appointment = await update.execute({ userId: USER_ID, id, data: { completed: true } });

    expect(appointment.completed).toBe(true);
    expect(appointment.title).toBe("Vacina");
    expect(appointments.appointments[0].completed).toBe(true);
  });

  test("fails when the new pet belongs to another user", async () => {
    const { create, update, rex, strangerPet } = setup();
    const appointment = await create.execute({ userId: USER_ID, data: { ...details, petId: rex.id } });

    await expect(
      update.execute({ userId: USER_ID, id: appointment.id, data: { petId: strangerPet.id, title: "Banho" } }),
    ).rejects.toThrow(new NotFoundError(messages.petNotFound));
    expect(appointment.title).toBe("Vacina");
  });

  test("fails when the appointment does not exist", async () => {
    const { update } = setup();

    await expect(update.execute({ userId: USER_ID, id: "missing", data: { title: "Banho" } })).rejects.toThrow(
      new NotFoundError(messages.appointmentNotFound),
    );
  });
});

describe("DeleteAppointment", () => {
  test("deletes the user's appointment", async () => {
    const { create, remove, rex, appointments } = setup();
    const { id } = await create.execute({ userId: USER_ID, data: { ...details, petId: rex.id } });

    await remove.execute({ userId: USER_ID, id });

    expect(appointments.appointments).toEqual([]);
  });

  test("does not delete another user's appointment", async () => {
    const { create, remove, rex, appointments } = setup();
    const { id } = await create.execute({ userId: USER_ID, data: { ...details, petId: rex.id } });

    await expect(remove.execute({ userId: "user-2", id })).rejects.toThrow(NotFoundError);
    expect(appointments.appointments).toHaveLength(1);
  });
});
