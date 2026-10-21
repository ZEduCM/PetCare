import { describe, expect, test } from "vitest";
import { RegisterController } from "@/controllers/auth/register-controller";
import { messages } from "@/messages";
import { RegisterUser } from "@/usecases/auth/register-user";
import { InMemoryUserRepository, fakeHasher } from "@/tests/support/fakes";

describe("RegisterController", { tags: ["RF-01"] }, () => {
  test("responde 201 com os dados públicos do usuário", async () => {
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
