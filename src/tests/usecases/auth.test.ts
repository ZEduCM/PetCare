import { describe, expect, test } from "vitest";
import type { Session, User, UserWithPassword } from "@/entities";
import { Login } from "@/usecases/auth/login";
import { RegisterUser } from "@/usecases/auth/register-user";
import { ConflictError, UnauthorizedError } from "@/usecases/errors";
import type { PasswordHasher } from "@/usecases/ports/password-hasher";
import type { SessionRepository } from "@/usecases/ports/session-repository";
import type { NewUser, UserRepository } from "@/usecases/ports/user-repository";

class InMemoryUserRepository implements UserRepository {
  users: UserWithPassword[] = [];

  async findByEmail(email: string) {
    return this.users.find((user) => user.email === email.toLowerCase()) ?? null;
  }

  async create(data: NewUser): Promise<User> {
    const user = { id: String(this.users.length + 1), ...data };
    this.users.push(user);
    return { id: user.id, name: user.name, email: user.email };
  }
}

class InMemorySessionRepository implements SessionRepository {
  sessions: Session[] = [];

  async create(session: Session) {
    this.sessions.push(session);
  }

  async findUser() {
    return null;
  }

  async delete(token: string) {
    this.sessions = this.sessions.filter((session) => session.token !== token);
  }
}

const hasher: PasswordHasher = {
  hash: async (password) => `hashed:${password}`,
  verify: async (password, hash) => hash === `hashed:${password}`,
};

describe("RegisterUser", () => {
  test("normalizes the data and stores the hashed password", async () => {
    const users = new InMemoryUserRepository();

    const user = await new RegisterUser(users, hasher).execute({
      name: " Ana ",
      email: " Ana@PetCare.com ",
      password: "petcare123",
    });

    expect(user).toEqual({ id: "1", name: "Ana", email: "ana@petcare.com" });
    expect(users.users[0].password).toBe("hashed:petcare123");
  });

  test("rejects an e-mail that is already registered", async () => {
    const users = new InMemoryUserRepository();
    const registerUser = new RegisterUser(users, hasher);
    await registerUser.execute({ name: "Ana", email: "ana@petcare.com", password: "petcare123" });

    await expect(
      registerUser.execute({ name: "Ana", email: "ANA@petcare.com", password: "petcare123" }),
    ).rejects.toThrow(ConflictError);
  });
});

describe("Login", () => {
  async function setup() {
    const users = new InMemoryUserRepository();
    const sessions = new InMemorySessionRepository();
    await new RegisterUser(users, hasher).execute({
      name: "Ana",
      email: "ana@petcare.com",
      password: "petcare123",
    });
    const login = new Login(users, sessions, hasher, { generate: () => "token" });
    return { login, sessions };
  }

  test("creates a session for valid credentials", async () => {
    const { login, sessions } = await setup();

    const { user, session } = await login.execute({
      email: "ana@petcare.com",
      password: "petcare123",
    });

    expect(user).toEqual({ id: "1", name: "Ana", email: "ana@petcare.com" });
    expect(session).toMatchObject({ token: "token", userId: "1" });
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(sessions.sessions).toEqual([session]);
  });

  test("rejects a wrong password or unknown e-mail", async () => {
    const { login, sessions } = await setup();

    await expect(
      login.execute({ email: "ana@petcare.com", password: "wrong-password" }),
    ).rejects.toThrow(UnauthorizedError);
    await expect(
      login.execute({ email: "bia@petcare.com", password: "petcare123" }),
    ).rejects.toThrow(UnauthorizedError);
    expect(sessions.sessions).toEqual([]);
  });
});
