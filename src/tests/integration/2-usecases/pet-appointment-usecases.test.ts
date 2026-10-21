import { beforeEach, describe, expect, test } from "vitest";
import { PostgresAppointmentRepository } from "@/database/appointments/postgres-appointment-repository";
import { pool } from "@/database/db";
import { PostgresPetRepository } from "@/database/pets/postgres-pet-repository";
import { PostgresUserRepository } from "@/database/users/postgres-user-repository";
import { User } from "@/entities";
import { CreateAppointment } from "@/usecases/appointments/create-appointment";
import { DeleteAppointment } from "@/usecases/appointments/delete-appointment";
import { ListAppointments } from "@/usecases/appointments/list-appointments";
import { UpdateAppointment } from "@/usecases/appointments/update-appointment";
import { NotFoundError } from "@/usecases/errors";
import { CreatePet } from "@/usecases/pets/create-pet";
import { GetPet } from "@/usecases/pets/get-pet";
import { ListPets } from "@/usecases/pets/list-pets";
import { ValidationError } from "@/validators/validation-error";

const pets = new PostgresPetRepository(pool);
const appointments = new PostgresAppointmentRepository(pool);

const createPet = new CreatePet(pets);
const listPets = new ListPets(pets);
const getPet = new GetPet(pets);
const createAppointment = new CreateAppointment(appointments, pets);
const listAppointments = new ListAppointments(appointments);
const updateAppointment = new UpdateAppointment(appointments, pets);
const deleteAppointment = new DeleteAppointment(appointments);

const petData = { name: "Thor", type: "Cachorro", breed: "Labrador", age: "3", weight: "12" };
const details = { title: "Banho do Thor", category: "Higiene", date: "2026-11-20", time: "10:30" };

let ana: User;
let bia: User;

beforeEach(async () => {
  const users = new PostgresUserRepository(pool);
  ana = new User({ name: "Ana", email: "ana@petcare.com", passwordHash: "salt:hash" });
  bia = new User({ name: "Bia", email: "bia@petcare.com", passwordHash: "salt:hash" });
  await users.create(ana);
  await users.create(bia);
});

describe("CreatePet + ListPets + GetPet + PostgresPetRepository", { tags: ["RF-02", "RF-09"] }, () => {
  test("grava o pet e o lê de volta só para o dono", async () => {
    const thor = await createPet.execute({ userId: ana.id, data: petData });

    expect((await listPets.execute({ userId: ana.id })).map((pet) => pet.id)).toEqual([thor.id]);
    expect((await getPet.execute({ userId: ana.id, id: thor.id }))?.toJSON()).toEqual(thor.toJSON());
    expect(await getPet.execute({ userId: bia.id, id: thor.id })).toBeNull();
  });

  test("não grava nada quando a entidade recusa os dados", async () => {
    await expect(createPet.execute({ userId: ana.id, data: { ...petData, breed: " " } })).rejects.toThrow(
      ValidationError,
    );

    expect(await listPets.execute({ userId: ana.id })).toEqual([]);
  });
});

describe("Casos de uso de compromisso + repositórios Postgres", { tags: ["RF-03", "RF-09"] }, () => {
  test("cria, altera e exclui um compromisso do pet do usuário", async () => {
    const thor = await createPet.execute({ userId: ana.id, data: petData });
    const luna = await createPet.execute({ userId: ana.id, data: { ...petData, name: "Luna", type: "Gato" } });

    const appointment = await createAppointment.execute({ userId: ana.id, data: { ...details, petId: thor.id } });
    await updateAppointment.execute({ userId: ana.id, id: appointment.id, data: { petId: luna.id, completed: true } });

    const [stored] = await listAppointments.execute({ userId: ana.id });
    expect(stored.toJSON()).toMatchObject({ petId: luna.id, pet: "Luna", completed: true, title: details.title });

    await deleteAppointment.execute({ userId: ana.id, id: appointment.id });
    expect(await listAppointments.execute({ userId: ana.id })).toEqual([]);
  });

  test("recusa pets e compromissos de outro usuário", async () => {
    const thor = await createPet.execute({ userId: ana.id, data: petData });
    const appointment = await createAppointment.execute({ userId: ana.id, data: { ...details, petId: thor.id } });

    await expect(createAppointment.execute({ userId: bia.id, data: { ...details, petId: thor.id } })).rejects.toThrow(
      NotFoundError,
    );
    await expect(
      updateAppointment.execute({ userId: bia.id, id: appointment.id, data: { title: "Changed" } }),
    ).rejects.toThrow(NotFoundError);
    await expect(deleteAppointment.execute({ userId: bia.id, id: appointment.id })).rejects.toThrow(NotFoundError);

    expect((await listAppointments.execute({ userId: ana.id }))[0].title).toBe(details.title);
  });
});
