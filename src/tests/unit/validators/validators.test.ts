import { describe, expect, test } from "vitest";
import { z } from "zod";
import { requiredText } from "@/validators/fields";
import { ValidationError } from "@/validators/validation-error";
import { ZodValidator } from "@/validators/zod-validator";

describe("requiredText", { tags: ["RF-04"] }, () => {
  const schema = requiredText("required");

  test("remove os espaços das pontas dos valores preenchidos", () => {
    expect(schema.parse(" Rex ")).toBe("Rex");
  });

  test("recusa valores ausentes, vazios ou que não são texto", () => {
    for (const value of [undefined, "   ", 42]) {
      expect(schema.safeParse(value).error?.issues[0].message).toBe("required");
    }
  });
});

describe("ZodValidator", { tags: ["RF-04"] }, () => {
  const validator = new ZodValidator(
    z.object({
      name: requiredText("required"),
      email: requiredText("required").pipe(z.email({ error: "invalid email" })),
    }),
  );

  test("retorna os dados validados sem chaves desconhecidas", () => {
    expect(validator.validate({ name: " Ana ", email: "ana@petcare.com", admin: true })).toEqual({
      name: "Ana",
      email: "ana@petcare.com",
    });
  });

  test("lança ValidationError com a mensagem do primeiro problema", () => {
    expect(() => validator.validate({ email: "invalid" })).toThrow(new ValidationError("required"));
    expect(() => validator.validate({ name: "Ana", email: "invalid" })).toThrow(
      new ValidationError("invalid email"),
    );
  });
});
