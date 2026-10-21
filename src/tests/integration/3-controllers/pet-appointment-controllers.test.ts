import { beforeEach, describe, expect, test } from "vitest";
import type { HttpRequest, HttpResponse } from "@/controllers/http";
import type { Pet } from "@/entities";
import {
  makeCreateAppointmentController,
  makeDeleteAppointmentController,
  makeListAppointmentsController,
  makeUpdateAppointmentController,
} from "@/main/factories/appointments";
import { makeLoginController, makeRegisterController } from "@/main/factories/auth";
import { makeCreatePetController } from "@/main/factories/pets";
import { messages } from "@/messages";
import { ValidationError } from "@/validators/validation-error";

function request(overrides: Partial<HttpRequest> = {}): HttpRequest {
  return { body: {}, query: {}, ...overrides };
}

let sessionToken: string;

beforeEach(async () => {
  const credentials = { email: "ana@petcare.com", password: "petcare123" };
  await makeRegisterController().handle(request({ body: { name: "Ana", ...credentials } }));
  const response = await makeLoginController().handle(request({ body: credentials }));
  sessionToken = (response.session as { token: string }).token;
});

describe("Controllers de pets e compromissos ↔ casos de uso ↔ repositórios", { tags: ["RF-02", "RF-03", "RF-05"] }, () => {
  test("percorre o ciclo de vida do compromisso com uma sessão real", async () => {
    const created: HttpResponse = await makeCreatePetController().handle(
      request({ sessionToken, body: { name: "Thor", type: "Cachorro", breed: "Labrador", age: "3", weight: "12" } }),
    );
    const pet = created.body as Pet;

    const appointment = await makeCreateAppointmentController().handle(
      request({
        sessionToken,
        body: { petId: pet.id, title: "Banho do Thor", category: "Higiene", date: "2026-11-20", time: "10:30" },
      }),
    );
    const id = (appointment.body as { id: string }).id;

    const updated = await makeUpdateAppointmentController().handle(
      request({ sessionToken, query: { id }, body: { completed: true } }),
    );
    expect(updated.statusCode).toBe(200);

    const list = await makeListAppointmentsController().handle(request({ sessionToken }));
    expect(JSON.parse(JSON.stringify(list.body))).toEqual([
      expect.objectContaining({ id, pet: "Thor", completed: true }),
    ]);

    expect(await makeDeleteAppointmentController().handle(request({ sessionToken, query: { id } }))).toEqual({
      statusCode: 204,
    });
  });

  test("deixa os erros de validação chegarem ao adaptador HTTP", async () => {
    await expect(
      makeCreatePetController().handle(request({ sessionToken, body: { name: "Thor" } })),
    ).rejects.toThrow(new ValidationError(messages.requiredFields));
  });
});
