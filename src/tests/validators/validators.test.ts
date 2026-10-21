import { describe, expect, test } from "vitest";
import { z } from "zod";
import { requiredText } from "@/validators/fields";
import { ValidationError } from "@/validators/validation-error";
import { ZodValidator } from "@/validators/zod-validator";

describe("requiredText", () => {
  const schema = requiredText("required");

  test("trims filled values", () => {
    expect(schema.parse(" Rex ")).toBe("Rex");
  });

  test("rejects missing, blank or non-string values", () => {
    for (const value of [undefined, "   ", 42]) {
      expect(schema.safeParse(value).error?.issues[0].message).toBe("required");
    }
  });
});

describe("ZodValidator", () => {
  const validator = new ZodValidator(
    z.object({
      name: requiredText("required"),
      email: requiredText("required").pipe(z.email({ error: "invalid email" })),
    }),
  );

  test("returns the parsed data without unknown keys", () => {
    expect(validator.validate({ name: " Ana ", email: "ana@petcare.com", admin: true })).toEqual({
      name: "Ana",
      email: "ana@petcare.com",
    });
  });

  test("throws a ValidationError with the first issue message", () => {
    expect(() => validator.validate({ email: "invalid" })).toThrow(new ValidationError("required"));
    expect(() => validator.validate({ name: "Ana", email: "invalid" })).toThrow(
      new ValidationError("invalid email"),
    );
  });
});
