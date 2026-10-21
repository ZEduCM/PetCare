import { describe, expect, test } from "vitest";
import { messages } from "@/messages";
import { Login } from "@/usecases/auth/login";
import { RegisterUser } from "@/usecases/auth/register-user";
import { ConflictError, UnauthorizedError } from "@/usecases/errors";
import { ValidationError } from "@/validators/validation-error";
import { InMemorySessionRepository, InMemoryUserRepository, fakeHasher } from "./fakes";

const ana = { name: "Ana", email: "ana@petcare.com", password: "petcare123" };

describe("RegisterUser", () => {
  test("stores a normalized user with the hashed password", async () => {
    const users = new InMemoryUserRepository();

    const user = await new RegisterUser(users, fakeHasher).execute({
      name: " Ana ",
      email: " Ana@PetCare.com ",
      password: "petcare123",
    });

    expect(user.toJSON()).toEqual({ id: user.id, name: "Ana", email: "ana@petcare.com" });
    expect(users.users).toEqual([user]);
    expect(user.passwordHash).toBe("hashed:petcare123");
  });

  test("rejects a short password", async () => {
    const users = new InMemoryUserRepository();

    await expect(new RegisterUser(users, fakeHasher).execute({ ...ana, password: "123" })).rejects.toThrow(
      new ValidationError(messages.shortPassword),
    );
    expect(users.users).toEqual([]);
  });

  test("rejects an email that is already registered", async () => {
    const registerUser = new RegisterUser(new InMemoryUserRepository(), fakeHasher);
    await registerUser.execute(ana);

    await expect(registerUser.execute({ ...ana, email: "ANA@petcare.com" })).rejects.toThrow(ConflictError);
  });
});

describe("Login", () => {
  async function setup() {
    const users = new InMemoryUserRepository();
    const sessions = new InMemorySessionRepository(users);
    await new RegisterUser(users, fakeHasher).execute(ana);
    const login = new Login(users, sessions, fakeHasher, { generate: () => "token" });
    return { login, sessions };
  }

  test("creates a session for valid credentials", async () => {
    const { login, sessions } = await setup();

    const { user, session } = await login.execute({ email: " ana@petcare.com ", password: "petcare123" });

    expect(user.email).toBe("ana@petcare.com");
    expect(session.token).toBe("token");
    expect(session.userId).toBe(user.id);
    expect(sessions.sessions).toEqual([session]);
  });

  test("rejects a wrong password or an unknown email", async () => {
    const { login, sessions } = await setup();

    await expect(login.execute({ email: ana.email, password: "wrong-password" })).rejects.toThrow(
      new UnauthorizedError(messages.invalidCredentials),
    );
    await expect(login.execute({ email: "bia@petcare.com", password: ana.password })).rejects.toThrow(
      UnauthorizedError,
    );
    expect(sessions.sessions).toEqual([]);
  });
});
