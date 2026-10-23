
import { describe, expect, test, vi } from "vitest";
import { pool } from "@/database/db";
import { messages } from "@/messages";
import { PostgresUserRepository } from "@/repositories/users/postgres-user-repository";
import { ApiClient } from "@/tests/support/api-client";
import { newUser, uniqueEmail } from "@/tests/support/builders";

async function countSessions(): Promise<number> {
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS total FROM sessions",
  );
  return rows[0].total;
}

async function countUsers(email?: string): Promise<number> {
  if (email) {
    const { rows } = await pool.query(
      "SELECT COUNT(*)::int AS total FROM users WHERE email = $1",
      [email],
    );
    return rows[0].total;
  }

  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS total FROM users",
  );
  return rows[0].total;
}

describe("POST /api/auth/login", { tags: ["RF-01"] }, () => {
  test("AUT-01 — credenciais ausentes ou inválidas respondem 400", async () => {
    const client = new ApiClient();
    const sessionsBefore = await countSessions();

    const cases = [
      { email: "", password: "petcare123" },
      { email: uniqueEmail(), password: "" },
      {},
    ];

    for (const body of cases) {
      const response = await client.post("/api/auth/login", body);
      expect(response.status).toBe(400);
    }

    const malformed = await client.request(
      "POST",
      "/api/auth/login",
      "{",
    );

    expect(malformed.status).toBe(400);
    expect(await countSessions()).toBe(sessionsBefore);
  });

  test("AUT-02 — email não cadastrado responde 401", async () => {
    const client = new ApiClient();
    const sessionsBefore = await countSessions();

    const response = await client.post("/api/auth/login", {
      email: uniqueEmail(),
      password: "petcare123",
    });

    expect(response.status).toBe(401);
    expect(await countSessions()).toBe(sessionsBefore);
  });

  test("AUT-03 — senha incorreta responde 401", async () => {
    const client = new ApiClient();
    const user = newUser();

    const registration = await client.post("/api/auth/register", user);
    expect(registration.status).toBe(201);

    const sessionsBefore = await countSessions();

    const response = await client.post("/api/auth/login", {
      email: user.email,
      password: "senhaErrada123",
    });

    expect(response.status).toBe(401);
    expect(await countSessions()).toBe(sessionsBefore);
  });

  test("AUT-04 — email inexistente e senha incorreta usam a mesma mensagem", async () => {
    const client = new ApiClient();
    const user = newUser();

    const registration = await client.post("/api/auth/register", user);
    expect(registration.status).toBe(201);

    const wrongPassword = await client.post("/api/auth/login", {
      email: user.email,
      password: "senhaErrada123",
    });

    const unknownEmail = await client.post("/api/auth/login", {
      email: uniqueEmail(),
      password: "petcare123",
    });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body).toEqual({
      message: messages.invalidCredentials,
    });
  });

  test("AUT-05 — login válido cria sessão e não expõe a senha", async () => {
    const client = new ApiClient();
    const user = newUser();

    const registration = await client.post("/api/auth/register", user);
    expect(registration.status).toBe(201);

    const sessionsBefore = await countSessions();

    const response = await client.post("/api/auth/login", {
      email: user.email,
      password: user.password,
    });

    expect(response.status).toBe(200);
    expect(await countSessions()).toBe(sessionsBefore + 1);
    expect(client.sessionCookie).toBeTruthy();
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name", user.name);
    expect(response.body).toHaveProperty("email", user.email);
    expect(response.body).not.toHaveProperty("password");
    expect(response.body).not.toHaveProperty("passwordHash");
    expect(response.body).not.toHaveProperty("password_hash");
  });

  test("AUT-06 — login remove espaços das bordas do email", async () => {
    const client = new ApiClient();
    const user = newUser();

    const registration = await client.post("/api/auth/register", user);
    expect(registration.status).toBe(201);

    const response = await client.post("/api/auth/login", {
      email: `  ${user.email}  `,
      password: user.password,
    });

    expect(response.status).toBe(200);
  });
});

describe("POST /api/auth/register", { tags: ["RF-02"] }, () => {
  test("AUT-07 — campos obrigatórios vazios respondem 400", async () => {
    const client = new ApiClient();
    const email = uniqueEmail();
    const usersBefore = await countUsers();

    const cases = [
      { name: "   ", email, password: "petcare123" },
      { name: "Ana", email: "", password: "petcare123" },
      { name: "Ana", email: uniqueEmail(), password: "" },
    ];

    for (const body of cases) {
      const response = await client.post("/api/auth/register", body);
      expect(response.status).toBe(400);
    }

    expect(await countUsers()).toBe(usersBefore);
  });

  test("AUT-08 — formatos inválidos de email respondem 400", async () => {
    const client = new ApiClient();
    const usersBefore = await countUsers();

    const invalidEmails = [
      "ana",
      "ana@",
      "ana@email",
      "@email.com",
      "ana @email.com",
    ];

    for (const email of invalidEmails) {
      const response = await client.post("/api/auth/register", {
        name: "Ana",
        email,
        password: "petcare123",
      });

      expect(response.status).toBe(400);
    }

    expect(await countUsers()).toBe(usersBefore);
  });

  test("AUT-09 — senha com menos de 8 caracteres responde 400", async () => {
    const client = new ApiClient();
    const email = uniqueEmail();
    const usersBefore = await countUsers();

    const response = await client.post("/api/auth/register", {
      name: "Ana",
      email,
      password: "1234567",
    });

    expect(response.status).toBe(400);
    expect(await countUsers(email)).toBe(0);
    expect(await countUsers()).toBe(usersBefore);
  });

  test("AUT-10 — senha com 8 caracteres permite cadastro", async () => {
    const client = new ApiClient();

    const response = await client.post("/api/auth/register", {
      name: "Ana",
      email: uniqueEmail(),
      password: "12345678",
    });

    expect(response.status).toBe(201);
  });

  test("AUT-11 — email duplicado responde 409 sem criar outro usuário", async () => {
    const client = new ApiClient();
    const user = newUser();

    const firstRegistration = await client.post(
      "/api/auth/register",
      user,
    );

    expect(firstRegistration.status).toBe(201);

    const usersAfterFirstRegistration = await countUsers();

    const secondRegistration = await client.post(
      "/api/auth/register",
      user,
    );

    expect(secondRegistration.status).toBe(409);
    expect(secondRegistration.body).toEqual({
      message: messages.emailTaken,
    });
    expect(await countUsers()).toBe(usersAfterFirstRegistration);
  });

  test("AUT-12 — normaliza o email antes de salvar no banco", async () => {
    const client = new ApiClient();
    const user = newUser({ email: " ANA@Email.COM " });

    const response = await client.post("/api/auth/register", user);
    expect(response.status).toBe(201);

    const body = response.body as {
      id?: string;
      user?: { id?: string };
    };
    const userId = body.user?.id ?? body.id;

    expect(userId).toBeTruthy();

    const { rows } = await pool.query(
      "SELECT email FROM users WHERE id = $1",
      [userId],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("ana@email.com");
  });

  test("AUT-13 — falha no banco retorna 500 sem expor detalhes internos", async () => {
    const client = new ApiClient();
    const user = newUser();

    vi.spyOn(
      PostgresUserRepository.prototype,
      "create",
    ).mockRejectedValueOnce(
      new Error("connect ECONNREFUSED 10.0.0.5:5432"),
    );

    const response = await client.post("/api/auth/register", user);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: messages.unexpectedError,
    });

    const responseText = JSON.stringify(response.body);

    expect(responseText).not.toContain("ECONNREFUSED");
    expect(responseText).not.toContain("10.0.0.5");
    expect(responseText).not.toContain("5432");
  });

  test("DEF-13 — JSON malformado no cadastro responde 400", async () => {
    const client = new ApiClient();
    const usersBefore = await countUsers();

    const response = await client.request(
      "POST",
      "/api/auth/register",
      "{",
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: messages.invalidBody,
    });
    expect(await countUsers()).toBe(usersBefore);
  });
});

describe("POST /api/auth/logout", { tags: ["RF-04"] }, () => {
  test("AUT-14 — logout remove a sessão e impede novo acesso autenticado", async () => {
    const client = new ApiClient();
    const user = newUser();

    const registration = await client.post("/api/auth/register", user);
    expect(registration.status).toBe(201);

    const login = await client.post("/api/auth/login", {
      email: user.email,
      password: user.password,
    });

    expect(login.status).toBe(200);

    const sessionCookie = client.sessionCookie;
    expect(sessionCookie).toBeTruthy();

    const sessionsBeforeLogout = await countSessions();
    expect(sessionsBeforeLogout).toBeGreaterThan(0);

    const logout = await client.post("/api/auth/logout");

    expect(logout.status).toBe(204);
    expect(await countSessions()).toBe(sessionsBeforeLogout - 1);
    expect(client.sessionCookie).toBeFalsy();

    const petsAfterLogout = await client.get("/api/pets");
    expect(petsAfterLogout.status).toBe(401);
  });
});
