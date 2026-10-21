import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";
import { ScryptPasswordHasher } from "@/lib/password";
import { RandomTokenGenerator } from "@/lib/token";
import { isUuid } from "@/lib/uuid";

describe("ScryptPasswordHasher", { tags: ["RF-01"] }, () => {
  const hasher = new ScryptPasswordHasher();

  test("LIB-01 — o hash tem o formato salt:hash em hexadecimal (32 + 128 caracteres)", async () => {
    expect(await hasher.hash("petcare123")).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
  });

  test("LIB-02 — o hash não expõe a senha", async () => {
    expect(await hasher.hash("petcare123")).not.toContain("petcare123");
  });

  test("LIB-03 — o salt é aleatório", async () => {
    expect(await hasher.hash("petcare123")).not.toBe(await hasher.hash("petcare123"));
  });

  test("LIB-04 — a senha correta é verificada", async () => {
    expect(await hasher.verify("petcare123", await hasher.hash("petcare123"))).toBe(true);
  });

  test("LIB-05 — senhas incorretas são recusadas", async () => {
    const stored = await hasher.hash("petcare123");

    expect(await hasher.verify("petcare124", stored)).toBe(false);
    expect(await hasher.verify("PETCARE123", stored)).toBe(false);
  });

  test.each(["", "abc", "a:b", ":", "salt:"])(
    "LIB-06 — hash armazenado malformado (%j) é recusado sem lançar erro",
    async (stored) => {
      await expect(hasher.verify("petcare123", stored)).resolves.toBe(false);
    },
  );

  test("LIB-07 — a senha do usuário de demonstração confere com o hash do seed.sql", async () => {
    const seed = await readFile(new URL("../../../database/seed.sql", import.meta.url), "utf8");
    const stored = seed.match(/'([0-9a-f]{32}:[0-9a-f]{128})'/)?.[1] ?? "";

    expect(await hasher.verify("petcare123", stored)).toBe(true);
  });
});

describe("isUuid", { tags: ["RF-09"] }, () => {
  test("UID-01 — aceita UUID em minúsculas e em maiúsculas", () => {
    const uuid = "0b6a2a8e-3f1c-4c55-9a4e-5f0a4e1d2c3b";

    expect(isUuid(uuid)).toBe(true);
    expect(isUuid(uuid.toUpperCase())).toBe(true);
  });

  test.each([
    ["vazio", ""],
    ["123", "123"],
    ["sem hífens", "0b6a2a8e3f1c4c559a4e5f0a4e1d2c3b"],
    ["um dígito a menos", "0b6a2a8e-3f1c-4c55-9a4e-5f0a4e1d2c3"],
    ["um dígito a mais", "0b6a2a8e-3f1c-4c55-9a4e-5f0a4e1d2c3bb"],
    ["letra fora do hexadecimal", "0b6a2a8e-3f1c-4c55-9a4e-5f0a4e1d2c3g"],
    ["tentativa de injeção", "1; DROP TABLE pets;--"],
  ])("UID-02 — recusa texto que não é UUID (%s)", (_, value) => {
    expect(isUuid(value)).toBe(false);
  });

  test.each([null, undefined, 123, {}, []])("UID-03 — recusa valor que não é texto (%j)", (value) => {
    expect(isUuid(value)).toBe(false);
  });
});

describe("RandomTokenGenerator", { tags: ["RF-01"] }, () => {
  test("gera tokens de 256 bits em hexadecimal, sem repetir", () => {
    const generator = new RandomTokenGenerator();
    const tokens = new Set(Array.from({ length: 100 }, () => generator.generate()));

    expect(tokens.size).toBe(100);
    for (const token of tokens) expect(token).toMatch(/^[0-9a-f]{64}$/);
  });
});
