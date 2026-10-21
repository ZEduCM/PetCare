import { beforeEach, describe, expect, test } from "vitest";
import { PostgresAppointmentRepository } from "@/repositories/appointments/postgres-appointment-repository";
import { pool } from "@/database/db";
import { PostgresPetRepository } from "@/repositories/pets/postgres-pet-repository";
import { PostgresUserRepository } from "@/repositories/users/postgres-user-repository";
import { Appointment, Pet, User } from "@/entities";

const users = new PostgresUserRepository(pool);
const pets = new PostgresPetRepository(pool);
const appointments = new PostgresAppointmentRepository(pool);

let ana: User;
let bia: User;

beforeEach(async () => {
  ana = new User({ name: "Ana", email: "ana@petcare.com", passwordHash: "salt:hash" });
  bia = new User({ name: "Bia", email: "bia@petcare.com", passwordHash: "salt:hash" });
  await users.create(ana);
  await users.create(bia);
});

async function createPet(owner: User, name: string, vaccine = "") {
  const pet = new Pet({ ownerId: owner.id, name, type: "Gato", breed: "SRD", age: "2", weight: "3", vaccine });
  await pets.create(pet);
  return pet;
}

async function createAppointment(pet: Pet, date: string, time: string, title = "Consulta") {
  const appointment = new Appointment({ petId: pet.id, petName: pet.name, title, category: "Saúde", date, time });
  await appointments.create(appointment);
  return appointment;
}

describe("PostgresPetRepository", { tags: ["RF-02", "RF-09"] }, () => {
  test("grava o pet e o lê de volta para o dono", async () => {
    const luna = await createPet(ana, "Luna", "2030-03-15");

    const found = await pets.findById(ana.id, luna.id);

    expect(found?.toJSON()).toEqual(luna.toJSON());
    expect(found?.ownerId).toBe(ana.id);
  });

  test("grava vacina ausente como null e lê como texto vazio", async () => {
    const luna = await createPet(ana, "Luna");

    const { rows } = await pool.query("SELECT next_vaccine FROM pets WHERE id = $1", [luna.id]);

    expect(rows[0].next_vaccine).toBeNull();
    expect((await pets.findById(ana.id, luna.id))?.vaccine).toBe("");
  });

  test("lista só os pets do dono, em ordem de nome", async () => {
    await createPet(ana, "Thor");
    await createPet(ana, "Luna");
    await createPet(bia, "Bob");

    const names = (await pets.listByUser(ana.id)).map((pet) => pet.name);

    expect(names).toEqual(["Luna", "Thor"]);
  });

  test("não encontra pet de outro usuário nem id malformado", async () => {
    const luna = await createPet(ana, "Luna");

    expect(await pets.findById(bia.id, luna.id)).toBeNull();
    expect(await pets.findById(ana.id, "not-a-uuid")).toBeNull();
  });
});

describe("PostgresAppointmentRepository", { tags: ["RF-03", "RF-09"] }, () => {
  test("lista os compromissos do usuário com o nome do pet, por data e horário", async () => {
    const luna = await createPet(ana, "Luna");
    const bob = await createPet(bia, "Bob");
    await createAppointment(luna, "2030-01-02", "08:00", "Second");
    await createAppointment(luna, "2030-01-01", "18:00", "First");
    await createAppointment(luna, "2030-01-02", "07:30", "Earlier on the second day");
    await createAppointment(bob, "2029-12-31", "10:00", "Other user");

    const list = await appointments.listByUser(ana.id);

    expect(list.map((item) => item.title)).toEqual(["First", "Earlier on the second day", "Second"]);
    expect(list.every((item) => item.petName === "Luna")).toBe(true);
  });

  test("grava todos os campos de uma alteração", async () => {
    const luna = await createPet(ana, "Luna");
    const thor = await createPet(ana, "Thor");
    const appointment = await createAppointment(luna, "2030-01-01", "08:00");

    appointment.update({ pet: thor, title: "Banho", category: "Higiene", date: "2030-02-02", time: "14:45", notes: "Shampoo neutro", completed: true });
    await appointments.update(appointment);

    expect((await appointments.findById(ana.id, appointment.id))?.toJSON()).toEqual({
      id: appointment.id,
      petId: thor.id,
      pet: "Thor",
      title: "Banho",
      category: "Higiene",
      date: "2030-02-02",
      time: "14:45",
      notes: "Shampoo neutro",
      completed: true,
    });
  });

  test("encontra e exclui só os compromissos do dono", async () => {
    const luna = await createPet(ana, "Luna");
    const appointment = await createAppointment(luna, "2030-01-01", "08:00");

    expect(await appointments.findById(bia.id, appointment.id)).toBeNull();
    expect(await appointments.delete(bia.id, appointment.id)).toBe(false);
    expect(await appointments.delete(ana.id, appointment.id)).toBe(true);
    expect(await appointments.findById(ana.id, appointment.id)).toBeNull();
  });

  test("trata ids malformados sem consultar o banco", async () => {
    expect(await appointments.findById(ana.id, "1")).toBeNull();
    expect(await appointments.delete(ana.id, "1")).toBe(false);
  });

  test("remove os compromissos de um pet excluído", async () => {
    const luna = await createPet(ana, "Luna");
    await createAppointment(luna, "2030-01-01", "08:00");

    await pool.query("DELETE FROM pets WHERE id = $1", [luna.id]);

    expect(await appointments.listByUser(ana.id)).toEqual([]);
  });
});
