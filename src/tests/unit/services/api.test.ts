import { afterEach, describe, expect, test, vi } from "vitest";
import { messages } from "@/messages";
import { ApiError, api } from "@/services/api";

function respondWith(status: number, body: unknown) {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json(body, { status })));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api", { tags: ["RF-06"] }, () => {
  test("lança o erro da API com a mensagem em português", async () => {
    respondWith(401, { message: messages.invalidCredentials });

    const error = await api.login("ana@petcare.com", "errada123").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: "E-mail ou senha inválidos.", status: 401 });
  });

  test("devolve a mensagem de cadastro em português", async () => {
    respondWith(201, {
      message: messages.userRegistered,
      user: { id: "1", name: "Ana", email: "ana@petcare.com" },
    });

    const result = await api.register("Ana", "ana@petcare.com", "senha1234");

    expect(result.message).toBe("Usuário cadastrado com sucesso!");
  });
});
