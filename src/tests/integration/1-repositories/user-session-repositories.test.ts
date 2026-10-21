import { describe, expect, test } from "vitest";
import { pool } from "@/database/db";
import { PostgresSessionRepository } from "@/repositories/sessions/postgres-session-repository";
import { PostgresUserRepository } from "@/repositories/users/postgres-user-repository";
import { Session, User } from "@/entities";

const users = new PostgresUserRepository(pool);
const sessions = new PostgresSessionRepository(pool);

async function createUser(email = "ana@petcare.com") {
  const user = new User({ name: "Ana", email, passwordHash: "salt:hash" });
  await users.create(user);
  return user;
}

describe("PostgresUserRepository", { tags: ["RF-01"] }, () => {
  test("grava o usuário e o encontra pelo e-mail sem diferenciar maiúsculas", async () => {
    const ana = await createUser();

    const found = await users.findByEmail("ANA@PetCare.com");

    expect(found?.toJSON()).toEqual(ana.toJSON());
    expect(found?.passwordHash).toBe("salt:hash");
  });

  test("retorna null para e-mail desconhecido", async () => {
    expect(await users.findByEmail("nobody@petcare.com")).toBeNull();
  });

  test("mantém e-mails únicos no banco", async () => {
    await createUser();

    await expect(createUser()).rejects.toThrow(/duplicate key/);
  });
});

describe("PostgresSessionRepository", { tags: ["RF-01", "RF-09"] }, () => {
  test("encontra o usuário de uma sessão ativa", async () => {
    const ana = await createUser();
    await sessions.create(new Session("token", ana.id));

    expect((await sessions.findUser("token"))?.id).toBe(ana.id);
  });

  test("ignora sessões expiradas", async () => {
    const ana = await createUser();
    await sessions.create(new Session("old-token", ana.id, new Date("2020-01-01")));

    expect(await sessions.findUser("old-token")).toBeNull();
  });

  test("exclui uma sessão", async () => {
    const ana = await createUser();
    await sessions.create(new Session("token", ana.id));

    await sessions.delete("token");

    expect(await sessions.findUser("token")).toBeNull();
  });

  test("remove as sessões de um usuário excluído", async () => {
    const ana = await createUser();
    await sessions.create(new Session("token", ana.id));

    await pool.query("DELETE FROM users WHERE id = $1", [ana.id]);

    const { rowCount } = await pool.query("SELECT 1 FROM sessions WHERE token = 'token'");
    expect(rowCount).toBe(0);
  });
});
