import { beforeEach, describe, expect, test } from "vitest";
import type { HttpRequest } from "@/controllers/http";
import { makeLoginController, makeLogoutController, makeRegisterController } from "@/main/factories/auth";
import { makeListPetsController } from "@/main/factories/pets";
import { messages } from "@/messages";

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

describe("Controllers de autenticação ↔ casos de uso ↔ repositórios", { tags: ["RF-01", "RF-09"] }, () => {
  test("o login devolve a sessão que o adaptador transforma em cookie", async () => {
    const response = await makeLoginController().handle(
      request({ body: { email: "ana@petcare.com", password: "petcare123" } }),
    );

    expect(response.statusCode).toBe(200);
    expect(response.session).toMatchObject({ token: expect.any(String) });
  });

  test("o logout encerra a sessão usada pelos controllers protegidos", async () => {
    const logout = await makeLogoutController().handle(request({ sessionToken }));

    expect(logout).toEqual({ statusCode: 204, session: null });
    expect(await makeListPetsController().handle(request({ sessionToken }))).toEqual({
      statusCode: 401,
      body: { message: messages.loginRequired },
    });
  });
});
