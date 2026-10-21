import { describe, expect, test } from "vitest";
import { PostgresSessionRepository } from "@/repositories/sessions/postgres-session-repository";
import { PostgresUserRepository } from "@/repositories/users/postgres-user-repository";
import { pool } from "@/database/db";
import { ScryptPasswordHasher } from "@/lib/password";
import { RandomTokenGenerator } from "@/lib/token";
import { Authenticate } from "@/usecases/auth/authenticate";
import { Login } from "@/usecases/auth/login";
import { Logout } from "@/usecases/auth/logout";
import { RegisterUser } from "@/usecases/auth/register-user";
import { ConflictError, UnauthorizedError } from "@/usecases/errors";

const users = new PostgresUserRepository(pool);
const sessions = new PostgresSessionRepository(pool);
const hasher = new ScryptPasswordHasher();

const registerUser = new RegisterUser(users, hasher);
const login = new Login(users, sessions, hasher, new RandomTokenGenerator());
const authenticate = new Authenticate(sessions);
const logout = new Logout(sessions);

const ana = { name: " Ana ", email: " Ana@PetCare.com ", password: "petcare123" };

describe("RegisterUser + PostgresUserRepository + ScryptPasswordHasher", { tags: ["RF-01"] }, () => {
  test("grava o usuário normalizado com hash scrypt", async () => {
    const user = await registerUser.execute(ana);

    const { rows } = await pool.query("SELECT name, email, password FROM users WHERE id = $1", [user.id]);
    expect(rows[0]).toMatchObject({ name: "Ana", email: "ana@petcare.com" });
    expect(await hasher.verify("petcare123", rows[0].password)).toBe(true);
  });

  test("detecta e-mail duplicado pelo banco", async () => {
    await registerUser.execute(ana);

    await expect(registerUser.execute({ ...ana, email: "ANA@petcare.com" })).rejects.toThrow(ConflictError);
  });
});

describe("Login + Authenticate + Logout + PostgresSessionRepository", { tags: ["RF-01", "RF-09"] }, () => {
  test("cria uma sessão que autentica o usuário até o logout", async () => {
    const user = await registerUser.execute(ana);

    const { session } = await login.execute({ email: "ana@petcare.com", password: "petcare123" });
    expect((await authenticate.execute({ token: session.token }))?.id).toBe(user.id);

    await logout.execute({ token: session.token });
    expect(await authenticate.execute({ token: session.token })).toBeNull();
  });

  test("não cria sessão para credenciais erradas", async () => {
    await registerUser.execute(ana);

    await expect(login.execute({ email: "ana@petcare.com", password: "wrong-password" })).rejects.toThrow(
      UnauthorizedError,
    );
    const { rowCount } = await pool.query("SELECT 1 FROM sessions");
    expect(rowCount).toBe(0);
  });
});
