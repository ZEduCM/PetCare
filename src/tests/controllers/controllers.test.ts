import { describe, expect, test, vi } from "vitest";
import { z } from "zod";
import { DeleteAppointmentController } from "@/controllers/appointments/delete-appointment-controller";
import { AuthenticatedController } from "@/controllers/authenticated-controller";
import { RegisterController } from "@/controllers/auth/register-controller";
import { errorResponse, ok, type AuthenticatedRequest, type Controller } from "@/controllers/http";
import { User } from "@/entities";
import { messages } from "@/messages";
import { RegisterUser } from "@/usecases/auth/register-user";
import { NotFoundError } from "@/usecases/errors";
import { ValidationError } from "@/validators/validation-error";
import { ZodValidator } from "@/validators/zod-validator";
import { InMemoryUserRepository, fakeHasher } from "../usecases/fakes";

const ana = new User({ name: "Ana", email: "ana@petcare.com", passwordHash: "hash" });

describe("AuthenticatedController", () => {
  const inner: Controller<AuthenticatedRequest> = {
    handle: async ({ user }) => ok({ userId: user.id }),
  };
  const authenticate = { execute: async ({ token }: { token: string }) => (token === "valid" ? ana : null) };
  const controller = new AuthenticatedController(authenticate, inner);

  test("returns 401 without a valid session", async () => {
    for (const sessionToken of [undefined, "expired"]) {
      expect(await controller.handle({ body: {}, query: {}, sessionToken })).toEqual({
        statusCode: 401,
        body: { message: messages.loginRequired },
      });
    }
  });

  test("passes the session user to the inner controller", async () => {
    expect(await controller.handle({ body: {}, query: {}, sessionToken: "valid" })).toEqual(ok({ userId: ana.id }));
  });
});

describe("errorResponse", () => {
  test("maps known errors to HTTP status codes", () => {
    expect(errorResponse(new ValidationError(messages.invalidDate))).toEqual({
      statusCode: 400,
      body: { message: messages.invalidDate },
    });
    expect(errorResponse(new NotFoundError(messages.petNotFound)).statusCode).toBe(404);
  });

  test("hides unexpected errors", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(errorResponse(new Error("connection refused"))).toEqual({
      statusCode: 500,
      body: { message: messages.unexpectedError },
    });
    log.mockRestore();
  });
});

describe("RegisterController", () => {
  test("returns 201 with the public user data", async () => {
    const controller = new RegisterController(new RegisterUser(new InMemoryUserRepository(), fakeHasher));

    const response = await controller.handle({
      body: { name: "Ana", email: "ana@petcare.com", password: "petcare123" },
      query: {},
    });

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(JSON.stringify(response.body))).toEqual({
      message: messages.userRegistered,
      user: { id: expect.any(String), name: "Ana", email: "ana@petcare.com" },
    });
  });
});

describe("DeleteAppointmentController", () => {
  test("rejects an invalid id before calling the use case", async () => {
    const deleteAppointment = { execute: vi.fn() };
    const controller = new DeleteAppointmentController(
      new ZodValidator(z.object({ id: z.uuid({ error: messages.invalidId }) })),
      deleteAppointment,
    );

    await expect(controller.handle({ body: {}, query: { id: "123" }, user: ana })).rejects.toThrow(
      new ValidationError(messages.invalidId),
    );
    expect(deleteAppointment.execute).not.toHaveBeenCalled();
  });
});
