import { describe, expect, test } from "vitest";
import { pool } from "@/database/db";
import { messages } from "@/messages";
import { ApiClient } from "@/tests/support/api-client";
import { createPet, signUp } from "@/tests/support/builders";
import type { Appointment } from "@/types";

async function countAppointments() {
  const { rows } = await pool.query("SELECT count(*)::int AS total FROM appointments");
  return rows[0].total as number;
}

async function signedIn() {
  const client = new ApiClient();
  const user = await signUp(client);
  const pet = await createPet(client);
  return { client, user, pet };
}

function validAppointment(petId: string) {
  return {
    petId,
    title: "Banho do Thor",
    category: "Higiene",
    date: "2026-11-20",
    time: "10:30",
    notes: "Shampoo neutro",
  };
}

async function withAppointment() {
  const session = await signedIn();
  const response = await session.client.post<Appointment>(
    "/api/appointments",
    validAppointment(session.pet.id),
  );
  return { ...session, appointment: response.body };
}

describe("Compromissos sem login", { tags: ["RF-09"] }, () => {
  test("APT-01 — os quatro métodos sem login respondem 401 e não mudam nada", async () => {
    const { appointment, pet } = await withAppointment();
    const anonymous = new ApiClient();
    const path = `/api/appointments?id=${appointment.id}`;

    const responses = [
      await anonymous.get("/api/appointments"),
      await anonymous.post("/api/appointments", validAppointment(pet.id)),
      await anonymous.put(path, { title: "Outro título" }),
      await anonymous.delete(path),
    ];

    for (const response of responses) {
      expect(response).toEqual({
        status: 401,
        body: { message: messages.loginRequired },
      });
    }
    expect(await countAppointments()).toBe(1);
  });
});

describe("GET /api/appointments", { tags: ["RF-03", "RF-09"] }, () => {
  test("APT-02 — lista só os compromissos do usuário logado", async () => {
    const { client, appointment } = await withAppointment();
    await withAppointment();

    const response = await client.get<Appointment[]>("/api/appointments");

    expect(response).toEqual({ status: 200, body: [appointment] });
  });
});

describe("POST /api/appointments", { tags: ["RF-03", "RF-04"] }, () => {
  test.each(["petId", "title", "category", "date", "time"])(
    "APT-03 — campo obrigatório vazio (%s) responde 400 e não grava",
    async (field) => {
      const { client, pet } = await signedIn();

      const response = await client.post("/api/appointments", {
        ...validAppointment(pet.id),
        [field]: "",
      });

      expect(response).toEqual({
        status: 400,
        body: { message: messages.requiredFields },
      });
      expect(await countAppointments()).toBe(0);
    },
  );

  test("APT-04 — pet com id que não é UUID responde 404 e não grava", async () => {
    const { client, pet } = await signedIn();

    const response = await client.post("/api/appointments", {
      ...validAppointment(pet.id),
      petId: "nao-e-uuid",
    });

    expect(response).toEqual({
      status: 404,
      body: { message: messages.petNotFound },
    });
    expect(await countAppointments()).toBe(0);
  });

  test("APT-05 — pet de outro usuário responde 404 e não grava", async () => {
    const { client } = await signedIn();
    const other = await signedIn();

    const response = await client.post(
      "/api/appointments",
      validAppointment(other.pet.id),
    );

    expect(response).toEqual({
      status: 404,
      body: { message: messages.petNotFound },
    });
    expect(await countAppointments()).toBe(0);
  });

  test("APT-06 — criação válida responde 201 e aparece na lista ligada ao pet", async () => {
    const { client, pet } = await signedIn();

    const response = await client.post<Appointment>(
      "/api/appointments",
      validAppointment(pet.id),
    );

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      petId: pet.id,
      pet: pet.name,
      title: "Banho do Thor",
      category: "Higiene",
      date: "2026-11-20",
      time: "10:30",
      notes: "Shampoo neutro",
      completed: false,
    });
    expect((await client.get<Appointment[]>("/api/appointments")).body).toEqual([
      response.body,
    ]);
  });

  test("APT-07 — sem observação grava texto vazio", async () => {
    const { client, pet } = await signedIn();
    const { notes: _, ...withoutNotes } = validAppointment(pet.id);

    const response = await client.post<Appointment>(
      "/api/appointments",
      withoutNotes,
    );

    expect(response.status).toBe(201);
    expect(response.body.notes).toBe("");
  });

  test("APT-08 — JSON malformado responde 400", async () => {
    const { client } = await signedIn();

    expect(await client.post("/api/appointments", "{")).toEqual({
      status: 400,
      body: { message: messages.invalidBody },
    });
    expect(await countAppointments()).toBe(0);
  });

  test("DEF-09 — título só com espaços responde 400", async () => {
    const { client, pet } = await signedIn();

    const response = await client.post("/api/appointments", {
      ...validAppointment(pet.id),
      title: "   ",
    });

    expect(response).toEqual({
      status: 400,
      body: { message: messages.requiredFields },
    });
  });

  test("DEF-10 — data inexistente responde 400", async () => {
    const { client, pet } = await signedIn();

    const response = await client.post("/api/appointments", {
      ...validAppointment(pet.id),
      date: "2026-02-31",
    });

    expect(response).toEqual({
      status: 400,
      body: { message: messages.invalidDate },
    });
  });

  test("DEF-11 — horário inválido responde 400", async () => {
    const { client, pet } = await signedIn();

    const response = await client.post("/api/appointments", {
      ...validAppointment(pet.id),
      time: "25:99",
    });

    expect(response).toEqual({
      status: 400,
      body: { message: messages.invalidTime },
    });
  });

  test("DEF-12 — corpo null responde 400", async () => {
    const { client } = await signedIn();

    expect(await client.post("/api/appointments", "null")).toEqual({
      status: 400,
      body: { message: messages.invalidBody },
    });
  });
});

describe("PUT /api/appointments", { tags: ["RF-05", "RF-09"] }, () => {
  test("APT-09 — id inválido responde 400 e não atualiza", async () => {
    const { client, appointment } = await withAppointment();

    const response = await client.put("/api/appointments?id=123", {
      title: "Outro título",
    });

    expect(response).toEqual({
      status: 400,
      body: { message: messages.invalidId },
    });
    expect((await client.get<Appointment[]>("/api/appointments")).body).toEqual([
      appointment,
    ]);
  });

  test("APT-10 — pet inválido responde 404", async () => {
    const { client, appointment } = await withAppointment();

    const response = await client.put(
      `/api/appointments?id=${appointment.id}`,
      { petId: "xyz" },
    );

    expect(response).toEqual({
      status: 404,
      body: { message: messages.petNotFound },
    });
  });

  test("APT-11 — compromisso inexistente ou de outro usuário responde 404", async () => {
    const { client } = await signedIn();
    const other = await withAppointment();

    const missing = await client.put(
      `/api/appointments?id=${crypto.randomUUID()}`,
      { title: "Outro título" },
    );
    const notMine = await client.put(
      `/api/appointments?id=${other.appointment.id}`,
      { title: "Outro título" },
    );

    for (const response of [missing, notMine]) {
      expect(response).toEqual({
        status: 404,
        body: { message: messages.appointmentNotFound },
      });
    }
    expect(
      (await other.client.get<Appointment[]>("/api/appointments")).body,
    ).toEqual([other.appointment]);
  });

  test("APT-12 — edição válida muda só o título", async () => {
    const { client, appointment } = await withAppointment();

    const response = await client.put<Appointment>(
      `/api/appointments?id=${appointment.id}`,
      { title: "Banho e tosa" },
    );

    expect(response).toEqual({
      status: 200,
      body: { ...appointment, title: "Banho e tosa" },
    });
  });
});

describe("DELETE /api/appointments", { tags: ["RF-05", "RF-09"] }, () => {
  test("APT-13 — id inválido responde 400 e não exclui", async () => {
    const { client } = await withAppointment();

    expect(await client.delete("/api/appointments?id=abc")).toEqual({
      status: 400,
      body: { message: messages.invalidId },
    });
    expect(await countAppointments()).toBe(1);
  });

  test("APT-14 — compromisso inexistente ou de outro usuário responde 404", async () => {
    const { client } = await signedIn();
    const other = await withAppointment();

    const missing = await client.delete(
      `/api/appointments?id=${crypto.randomUUID()}`,
    );
    const notMine = await client.delete(
      `/api/appointments?id=${other.appointment.id}`,
    );

    for (const response of [missing, notMine]) {
      expect(response).toEqual({
        status: 404,
        body: { message: messages.appointmentNotFound },
      });
    }
    expect(await countAppointments()).toBe(1);
  });

  test("APT-15 — exclusão válida responde 204 e remove do banco", async () => {
    const { client, appointment } = await withAppointment();

    expect(
      await client.delete(`/api/appointments?id=${appointment.id}`),
    ).toEqual({ status: 204, body: null });
    expect(await countAppointments()).toBe(0);
  });
});

describe("Defeitos do cadastro de compromisso", { tags: ["RF-03", "RF-04"] }, () => {
  test.each(["a", "ab"])("DEF-17 — título %s responde 400", async (title) => {
    const { client, pet } = await signedIn();

    const response = await client.post("/api/appointments", {
      ...validAppointment(pet.id),
      title,
    });

    expect(response).toEqual({
      status: 400,
      body: { message: messages.shortTitle },
    });
    expect(await countAppointments()).toBe(0);
  });

  test("DEF-17 — título com 3 caracteres é aceito", async () => {
    const { client, pet } = await signedIn();

    const response = await client.post("/api/appointments", {
      ...validAppointment(pet.id),
      title: "abc",
    });

    expect(response.status).toBe(201);
  });
  
  test("DEF-18 — categoria fora da lista responde 400", async () => {
    const { client, pet } = await signedIn();

    const response = await client.post("/api/appointments", {
      ...validAppointment(pet.id),
      category: "Festa",
    });

    expect(response).toEqual({
      status: 400,
      body: { message: messages.invalidCategory },
    });
    expect(await countAppointments()).toBe(0);
  });

});
