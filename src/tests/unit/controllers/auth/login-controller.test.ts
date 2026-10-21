import { describe, expect, test, vi } from "vitest";
import { LoginController } from "@/controllers/auth/login-controller";
import { Session, User } from "@/entities";
import { ValidationError } from "@/validators/validation-error";
import { passThroughValidator, rejectingValidator } from "@/tests/support/fakes";

const ana = new User({ name: "Ana", email: "ana@petcare.com", passwordHash: "hash" });

describe("LoginController", { tags: ["RF-01"] }, () => {
  test("retorna o usuário e pede ao adaptador para iniciar a sessão", async () => {
    const session = new Session("token", ana.id);
    const login = { execute: vi.fn(async () => ({ user: ana, session })) };
    const controller = new LoginController(passThroughValidator(), login);

    const response = await controller.handle({
      body: { email: "ana@petcare.com", password: "petcare123" },
      query: {},
    });

    expect(login.execute).toHaveBeenCalledWith({ email: "ana@petcare.com", password: "petcare123" });
    expect(response).toEqual({ statusCode: 200, body: ana, session });
  });

  test("não chama o caso de uso quando as credenciais são inválidas", async () => {
    const login = { execute: vi.fn() };
    const controller = new LoginController(rejectingValidator("missing"), login);

    await expect(controller.handle({ body: {}, query: {} })).rejects.toThrow(ValidationError);
    expect(login.execute).not.toHaveBeenCalled();
  });
});
