import { describe, expect, test } from "vitest";
import { Session, User } from "@/entities";
import { Authenticate } from "@/usecases/auth/authenticate";
import { Logout } from "@/usecases/auth/logout";
import { InMemorySessionRepository, InMemoryUserRepository } from "@/tests/support/fakes";

function setup() {
  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository(users);
  const ana = new User({ name: "Ana", email: "ana@petcare.com", passwordHash: "hash" });
  users.users.push(ana);
  sessions.sessions.push(new Session("phone", ana.id), new Session("laptop", ana.id));

  return {
    ana,
    sessions,
    authenticate: new Authenticate(sessions),
    logout: new Logout(sessions),
  };
}

describe("Authenticate", { tags: ["RF-01", "RF-09"] }, () => {
  test("retorna o usuário de um token de sessão conhecido", async () => {
    const { ana, authenticate } = setup();

    expect(await authenticate.execute({ token: "phone" })).toBe(ana);
  });

  test("retorna null para token desconhecido", async () => {
    const { authenticate } = setup();

    expect(await authenticate.execute({ token: "unknown" })).toBeNull();
  });
});

describe("Logout", { tags: ["RF-01"] }, () => {
  test("encerra só a sessão informada", async () => {
    const { authenticate, logout, sessions } = setup();

    await logout.execute({ token: "phone" });

    expect(sessions.sessions.map((session) => session.token)).toEqual(["laptop"]);
    expect(await authenticate.execute({ token: "phone" })).toBeNull();
  });
});
