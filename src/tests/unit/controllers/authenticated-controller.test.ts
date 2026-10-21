import { describe, expect, test } from "vitest";
import { AuthenticatedController } from "@/controllers/authenticated-controller";
import { ok, type AuthenticatedRequest, type Controller } from "@/controllers/http";
import { User } from "@/entities";
import { messages } from "@/messages";

const ana = new User({ name: "Ana", email: "ana@petcare.com", passwordHash: "hash" });

describe("AuthenticatedController", { tags: ["RF-09"] }, () => {
  const inner: Controller<AuthenticatedRequest> = {
    handle: async ({ user }) => ok({ userId: user.id }),
  };
  const authenticate = { execute: async ({ token }: { token: string }) => (token === "valid" ? ana : null) };
  const controller = new AuthenticatedController(authenticate, inner);

  test("responde 401 sem sessão válida", async () => {
    for (const sessionToken of [undefined, "expired"]) {
      expect(await controller.handle({ body: {}, query: {}, sessionToken })).toEqual({
        statusCode: 401,
        body: { message: messages.loginRequired },
      });
    }
  });

  test("repassa o usuário da sessão ao controller interno", async () => {
    expect(await controller.handle({ body: {}, query: {}, sessionToken: "valid" })).toEqual(ok({ userId: ana.id }));
  });
});
