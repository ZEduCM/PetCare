import { describe, expect, test, vi } from "vitest";
import { CreateAppointmentController } from "@/controllers/appointments/create-appointment-controller";
import { ListAppointmentsController } from "@/controllers/appointments/list-appointments-controller";
import { UpdateAppointmentController } from "@/controllers/appointments/update-appointment-controller";
import { LoginController } from "@/controllers/auth/login-controller";
import { LogoutController } from "@/controllers/auth/logout-controller";
import { optionalText, text } from "@/controllers/http";
import { CreatePetController } from "@/controllers/pets/create-pet-controller";
import { ListPetsController } from "@/controllers/pets/list-pets-controller";
import { Appointment, Pet, Session, User } from "@/entities";
import { ValidationError } from "@/validators/validation-error";
import type { UpdateAppointmentInput } from "@/usecases/appointments/update-appointment";
import type { Validator } from "@/validators/validator";

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

const passThrough = <T>(): Validator<T> => ({ validate: (input) => input as T });
const rejecting = <T>(message: string): Validator<T> => ({
  validate: () => {
    throw new ValidationError(message);
  },
});

describe("helpers de texto", { tags: ["RF-04"] }, () => {
  test("text aceita só textos e usa texto vazio como padrão", () => {
    expect(text("Luna")).toBe("Luna");
    expect(text(123)).toBe("");
    expect(text(undefined)).toBe("");
    expect(text({ name: "Luna" })).toBe("");
  });

  test("optionalText deixa como undefined valores ausentes ou que não são texto", () => {
    expect(optionalText(undefined)).toBeUndefined();
    expect(optionalText(null)).toBeUndefined();
    expect(optionalText(123)).toBeUndefined();
    expect(optionalText("")).toBe("");
  });
});

describe("LoginController", { tags: ["RF-01"] }, () => {
  test("retorna o usuário e pede ao adaptador para iniciar a sessão", async () => {
    const session = new Session("token", ana.id);
    const login = { execute: vi.fn(async () => ({ user: ana, session })) };
    const controller = new LoginController(passThrough(), login);

    const response = await controller.handle({
      body: { email: "ana@petcare.com", password: "petcare123" },
      query: {},
    });

    expect(login.execute).toHaveBeenCalledWith({ email: "ana@petcare.com", password: "petcare123" });
    expect(response).toEqual({ statusCode: 200, body: ana, session });
  });

  test("não chama o caso de uso quando as credenciais são inválidas", async () => {
    const login = { execute: vi.fn() };
    const controller = new LoginController(rejecting("missing"), login);

    await expect(controller.handle({ body: {}, query: {} })).rejects.toThrow(ValidationError);
    expect(login.execute).not.toHaveBeenCalled();
  });
});

describe("LogoutController", { tags: ["RF-01"] }, () => {
  test("encerra a sessão atual e limpa o cookie", async () => {
    const logout = { execute: vi.fn(async () => {}) };
    const controller = new LogoutController(logout);

    const response = await controller.handle({ body: {}, query: {}, sessionToken: "token" });

    expect(logout.execute).toHaveBeenCalledWith({ token: "token" });
    expect(response).toEqual({ statusCode: 204, session: null });
  });

  test("limpa o cookie mesmo sem sessão", async () => {
    const logout = { execute: vi.fn() };

    const response = await new LogoutController(logout).handle({ body: {}, query: {} });

    expect(logout.execute).not.toHaveBeenCalled();
    expect(response.session).toBeNull();
  });
});

describe("controllers de pets", { tags: ["RF-02", "RF-05"] }, () => {
  test("ListPetsController lista os pets do usuário da sessão", async () => {
    const listPets = { execute: vi.fn(async () => [luna]) };

    const response = await new ListPetsController(listPets).handle({ body: {}, query: {}, user: ana });

    expect(listPets.execute).toHaveBeenCalledWith({ userId: ana.id });
    expect(response).toEqual({ statusCode: 200, body: [luna] });
  });

  test("CreatePetController mapeia só os campos conhecidos do corpo", async () => {
    const createPet = { execute: vi.fn(async () => luna) };

    const response = await new CreatePetController(createPet).handle({
      body: { name: "Luna", type: "Gato", breed: "SRD", age: 2, weight: 3.5, ownerId: "someone-else", id: "forged" },
      query: {},
      user: ana,
    });

    expect(createPet.execute).toHaveBeenCalledWith({
      userId: ana.id,
      data: {
        name: "Luna",
        type: "Gato",
        breed: "SRD",
        age: "2",
        weight: "3.5",
        vaccine: undefined,
        icon: undefined,
        description: undefined,
      },
    });
    expect(response).toEqual({ statusCode: 201, body: luna });
  });
});

describe("controllers de compromissos", { tags: ["RF-03", "RF-05"] }, () => {
  test("ListAppointmentsController lista os compromissos do usuário da sessão", async () => {
    const listAppointments = { execute: vi.fn(async () => [vaccine]) };

    const response = await new ListAppointmentsController(listAppointments).handle({ body: {}, query: {}, user: ana });

    expect(listAppointments.execute).toHaveBeenCalledWith({ userId: ana.id });
    expect(response.body).toEqual([vaccine]);
  });

  test("CreateAppointmentController valida o pet e mapeia o corpo", async () => {
    const createAppointment = { execute: vi.fn(async () => vaccine) };
    const controller = new CreateAppointmentController(passThrough(), createAppointment);

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

  test("UpdateAppointmentController envia só os campos presentes no corpo", async () => {
    const updateAppointment = { execute: vi.fn(async () => vaccine) };
    const controller = new UpdateAppointmentController(passThrough(), updateAppointment);

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

  test("UpdateAppointmentController ignora completed que não é booleano", async () => {
    const updateAppointment = { execute: vi.fn<(input: UpdateAppointmentInput) => Promise<Appointment>>(async () => vaccine) };
    const controller = new UpdateAppointmentController(passThrough(), updateAppointment);

    await controller.handle({ body: { completed: "yes" }, query: { id: vaccine.id }, user: ana });

    expect(updateAppointment.execute.mock.calls[0][0].data.completed).toBeUndefined();
  });

  test("UpdateAppointmentController recusa id inválido", async () => {
    const updateAppointment = { execute: vi.fn() };
    const controller = new UpdateAppointmentController(rejecting("invalid id"), updateAppointment);

    await expect(controller.handle({ body: {}, query: { id: "1" }, user: ana })).rejects.toThrow("invalid id");
    expect(updateAppointment.execute).not.toHaveBeenCalled();
  });
});
