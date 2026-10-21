import { describe, expect, test } from "vitest";
import { Password } from "@/entities";
import { messages } from "@/messages";
import { ValidationError } from "@/validators/validation-error";

describe("Password", { tags: ["RF-01", "RF-04"] }, () => {
  test("exige pelo menos 8 caracteres", () => {
    expect(() => new Password("")).toThrow(new ValidationError(messages.requiredFields));
    expect(() => new Password("1234567")).toThrow(new ValidationError(messages.shortPassword));
    expect(new Password("12345678").value).toBe("12345678");
  });
});
