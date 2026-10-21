import { describe, expect, test } from "vitest";
import { User } from "@/entities";
import { messages } from "@/messages";
import { ValidationError } from "@/validators/validation-error";

describe("User", { tags: ["RF-01"] }, () => {
  test("mantém o id informado e gera um quando falta", () => {
    const data = { name: "Ana", email: "ana@petcare.com", passwordHash: "hash" };

    expect(new User({ ...data, id: "user-1" }).id).toBe("user-1");
    expect(new User(data).id).not.toBe(new User(data).id);
  });

  test("normaliza nome e e-mail e esconde o hash da senha no JSON", () => {
    const user = new User({ name: " Ana ", email: " Ana@PetCare.com ", passwordHash: "hash" });

    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.name).toBe("Ana");
    expect(user.email).toBe("ana@petcare.com");
    expect(user.passwordHash).toBe("hash");
    expect(JSON.parse(JSON.stringify(user))).toEqual({ id: user.id, name: "Ana", email: "ana@petcare.com" });
  });

  test("recusa campos ausentes e e-mails inválidos", () => {
    expect(() => new User({ name: "", email: "ana@petcare.com", passwordHash: "hash" })).toThrow(
      new ValidationError(messages.requiredFields),
    );
    expect(() => new User({ name: "Ana", email: "ana@petcare", passwordHash: "hash" })).toThrow(
      new ValidationError(messages.invalidEmail),
    );
  });
});
