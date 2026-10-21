import { describe, expect, test } from "vitest";
import type { Appointment, AppointmentInput, Pet } from "@/entities";
import { CreateAppointment } from "@/usecases/appointments/create-appointment";
import { DeleteAppointment } from "@/usecases/appointments/delete-appointment";
import { UpdateAppointment } from "@/usecases/appointments/update-appointment";
import { NotFoundError } from "@/usecases/errors";
import type { AppointmentRepository } from "@/usecases/ports/appointment-repository";
import type { PetRepository } from "@/usecases/ports/pet-repository";

const USER_ID = "user-1";

const rex: Pet = {
  id: "pet-1",
  name: "Rex",
  type: "Cachorro",
  breed: "Vira-lata",
  age: "3",
  weight: "12",
  vaccine: "",
  icon: "🐶",
  description: "",
};

class InMemoryPetRepository implements PetRepository {
  async listByUser() {
    return [rex];
  }

  async findById(userId: string, id: string) {
    return userId === USER_ID && id === rex.id ? rex : null;
  }

  async create(): Promise<Pet> {
    throw new Error("not used");
  }
}

class InMemoryAppointmentRepository implements AppointmentRepository {
  appointments: Appointment[] = [];

  constructor(private readonly pets: PetRepository) {}

  async listByUser() {
    return this.appointments;
  }

  async create(userId: string, data: AppointmentInput) {
    const pet = await this.pets.findById(userId, data.petId);
    if (!pet) return null;

    const appointment = { id: `appointment-${this.appointments.length + 1}`, pet: pet.name, ...data };
    this.appointments.push(appointment);
    return appointment;
  }

  async update(userId: string, id: string, data: Partial<AppointmentInput>) {
    const index = this.appointments.findIndex((appointment) => appointment.id === id);
    if (userId !== USER_ID || index === -1) return null;

    this.appointments[index] = { ...this.appointments[index], ...data };
    return this.appointments[index];
  }

  async delete(userId: string, id: string) {
    const before = this.appointments.length;
    this.appointments = this.appointments.filter((appointment) => appointment.id !== id);
    return userId === USER_ID && this.appointments.length < before;
  }
}

function setup() {
  const pets = new InMemoryPetRepository();
  const appointments = new InMemoryAppointmentRepository(pets);
  return {
    appointments,
    create: new CreateAppointment(appointments),
    update: new UpdateAppointment(appointments, pets),
    remove: new DeleteAppointment(appointments),
  };
}

const data = {
  petId: rex.id,
  title: "Vacina",
  category: "Saúde",
  date: "2026-11-10",
  time: "09:30",
};

describe("CreateAppointment", () => {
  test("creates an appointment with empty notes by default", async () => {
    const { create } = setup();

    const appointment = await create.execute({ userId: USER_ID, data });

    expect(appointment).toMatchObject({ ...data, pet: "Rex", notes: "" });
  });

  test("fails when the pet does not belong to the user", async () => {
    const { create } = setup();

    await expect(
      create.execute({ userId: USER_ID, data: { ...data, petId: "other-pet" } }),
    ).rejects.toThrow("Pet não encontrado.");
  });
});

describe("UpdateAppointment", () => {
  test("updates only the given fields", async () => {
    const { create, update } = setup();
    const { id } = await create.execute({ userId: USER_ID, data });

    const appointment = await update.execute({ userId: USER_ID, id, data: { completed: true } });

    expect(appointment).toMatchObject({ ...data, completed: true });
  });

  test("checks the new pet before updating", async () => {
    const { create, update, appointments } = setup();
    const { id } = await create.execute({ userId: USER_ID, data });

    await expect(
      update.execute({ userId: USER_ID, id, data: { petId: "other-pet", title: "Banho" } }),
    ).rejects.toThrow("Pet não encontrado.");
    expect(appointments.appointments[0].title).toBe("Vacina");
  });

  test("fails when the appointment does not exist", async () => {
    const { update } = setup();

    await expect(
      update.execute({ userId: USER_ID, id: "missing", data: { title: "Banho" } }),
    ).rejects.toThrow("Compromisso não encontrado.");
  });
});

describe("DeleteAppointment", () => {
  test("deletes an existing appointment", async () => {
    const { create, remove, appointments } = setup();
    const { id } = await create.execute({ userId: USER_ID, data });

    await remove.execute({ userId: USER_ID, id });

    expect(appointments.appointments).toEqual([]);
  });

  test("fails when the appointment does not exist", async () => {
    const { remove } = setup();

    await expect(remove.execute({ userId: USER_ID, id: "missing" })).rejects.toThrow(NotFoundError);
  });
});
