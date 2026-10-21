import { describe, expect, test } from "vitest";
import { DateValidator } from "@/validators/date-validator";
import { EmailValidator } from "@/validators/email-validator";
import { MinLengthValidator } from "@/validators/min-length-validator";
import { NotBlankFieldsValidator } from "@/validators/not-blank-fields-validator";
import { RequiredFieldsValidator } from "@/validators/required-fields-validator";
import { TimeValidator } from "@/validators/time-validator";
import { UuidValidator } from "@/validators/uuid-validator";
import { ValidatorComposite } from "@/validators/validator-composite";

describe("RequiredFieldsValidator", () => {
  const validator = new RequiredFieldsValidator(["name", "email"], "required");

  test("passes when every field is filled", () => {
    expect(validator.validate({ name: "Ana", email: "ana@petcare.com" })).toBeNull();
  });

  test("fails when a field is missing or blank", () => {
    expect(validator.validate({ name: "Ana" })).toBe("required");
    expect(validator.validate({ name: "  ", email: "ana@petcare.com" })).toBe("required");
  });
});

describe("NotBlankFieldsValidator", () => {
  const validator = new NotBlankFieldsValidator(["title"], "blank");

  test("ignores absent fields", () => {
    expect(validator.validate({})).toBeNull();
  });

  test("fails when a present field is blank", () => {
    expect(validator.validate({ title: " " })).toBe("blank");
  });
});

describe("EmailValidator", () => {
  const validator = new EmailValidator("email");

  test("accepts a valid e-mail and ignores empty values", () => {
    expect(validator.validate({ email: " ana@petcare.com " })).toBeNull();
    expect(validator.validate({ email: "" })).toBeNull();
  });

  test("rejects an invalid e-mail", () => {
    expect(validator.validate({ email: "ana@petcare" })).toBe("Informe um e-mail válido.");
  });
});

describe("MinLengthValidator", () => {
  const validator = new MinLengthValidator("password", 8, "short");

  test("checks the minimum length", () => {
    expect(validator.validate({ password: "1234567" })).toBe("short");
    expect(validator.validate({ password: "12345678" })).toBeNull();
  });
});

describe("UuidValidator", () => {
  const validator = new UuidValidator("id");

  test("checks the uuid format", () => {
    expect(validator.validate({ id: "123" })).toBe("Informe um id válido.");
    expect(validator.validate({ id: "0b6a2a8e-3f1c-4c55-9a4e-5f0a4e1d2c3b" })).toBeNull();
  });
});

describe("DateValidator", () => {
  const validator = new DateValidator("date");

  test("accepts real calendar dates", () => {
    expect(validator.validate({ date: "2026-02-28" })).toBeNull();
  });

  test("rejects malformed or impossible dates", () => {
    expect(validator.validate({ date: "28/02/2026" })).toBe("Informe uma data válida.");
    expect(validator.validate({ date: "2026-02-30" })).toBe("Informe uma data válida.");
  });
});

describe("TimeValidator", () => {
  const validator = new TimeValidator("time");

  test("accepts HH:MM and HH:MM:SS", () => {
    expect(validator.validate({ time: "09:30" })).toBeNull();
    expect(validator.validate({ time: "23:59:59" })).toBeNull();
  });

  test("rejects invalid times", () => {
    expect(validator.validate({ time: "24:00" })).toBe("Informe um horário válido.");
  });
});

describe("ValidatorComposite", () => {
  test("returns the first error found", () => {
    const validator = new ValidatorComposite([
      new RequiredFieldsValidator(["email"], "required"),
      new EmailValidator("email"),
    ]);

    expect(validator.validate({})).toBe("required");
    expect(validator.validate({ email: "invalid" })).toBe("Informe um e-mail válido.");
    expect(validator.validate({ email: "ana@petcare.com" })).toBeNull();
  });
});
