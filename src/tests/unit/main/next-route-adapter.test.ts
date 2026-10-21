import { NextRequest } from "next/server";
import { afterEach, describe, expect, test, vi } from "vitest";
import { noContent, ok, type Controller, type HttpRequest } from "@/controllers/http";
import { Session } from "@/entities";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { adaptRoute } from "@/main/adapters/next-route-adapter";
import { messages } from "@/messages";
import { NotFoundError } from "@/usecases/errors";
import { CookieJar, activateCookieJar } from "@/tests/support/cookie-jar";

vi.mock("next/headers", async () => {
  const { currentCookieJar } = await import("@/tests/support/cookie-jar");
  return { cookies: async () => currentCookieJar() };
});

function request(body?: string, path = "/api/test") {
  return new NextRequest(new URL(path, "http://localhost"), { method: body === undefined ? "GET" : "POST", body });
}

function spyController(handle: Controller["handle"] = async () => ok({ ok: true })) {
  return { handle: vi.fn(handle) };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("adaptRoute", { tags: ["RF-05", "RF-06"] }, () => {
  test("repassa corpo, query e token de sessão ao controller", async () => {
    const jar = new CookieJar();
    jar.set(SESSION_COOKIE, "token");
    activateCookieJar(jar);
    const controller = spyController();

    await adaptRoute(controller)(request('{"name":"Luna"}', "/api/test?id=1"));

    expect(controller.handle).toHaveBeenCalledWith<[HttpRequest]>({
      body: { name: "Luna" },
      query: { id: "1" },
      sessionToken: "token",
    });
  });

  test("usa corpo vazio quando a requisição não tem corpo", async () => {
    activateCookieJar(new CookieJar());
    const controller = spyController();

    await adaptRoute(controller)(request());

    expect(controller.handle.mock.calls[0][0].body).toEqual({});
  });

  test.each(["{bad json", "[1, 2]", '"text"', "null"])("recusa o corpo %s", async (body) => {
    activateCookieJar(new CookieJar());
    const controller = spyController();

    const response = await adaptRoute(controller)(request(body));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: messages.invalidBody });
    expect(controller.handle).not.toHaveBeenCalled();
  });

  test("inicia a sessão com cookie httpOnly e SameSite", async () => {
    const jar = new CookieJar();
    activateCookieJar(jar);
    const session = new Session("token", "user-1");

    await adaptRoute(spyController(async () => ({ ...ok({}), session })))(request("{}"));

    expect(jar.cookies.get(SESSION_COOKIE)).toEqual({
      value: "token",
      options: { httpOnly: true, sameSite: "lax", secure: false, path: "/", expires: session.expiresAt },
    });
  });

  test("limpa o cookie de sessão", async () => {
    const jar = new CookieJar();
    jar.set(SESSION_COOKIE, "token");
    activateCookieJar(jar);

    const response = await adaptRoute(spyController(async () => ({ ...noContent(), session: null })))(request("{}"));

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(jar.cookies.has(SESSION_COOKIE)).toBe(false);
  });

  test("transforma erros conhecidos em respostas HTTP", async () => {
    activateCookieJar(new CookieJar());
    const controller = spyController(async () => {
      throw new NotFoundError(messages.petNotFound);
    });

    const response = await adaptRoute(controller)(request());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: messages.petNotFound });
  });

  test("esconde erros inesperados atrás de uma resposta 500", async () => {
    activateCookieJar(new CookieJar());
    vi.spyOn(console, "error").mockImplementation(() => {});
    const controller = spyController(async () => {
      throw new Error("database is down");
    });

    const response = await adaptRoute(controller)(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: messages.unexpectedError });
  });
});
