import { describe, expect, test, vi } from "vitest";
import { LogoutController } from "@/controllers/auth/logout-controller";

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
