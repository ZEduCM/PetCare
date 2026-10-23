import { describe, expect, test } from "vitest";
import { Pet } from "@/entities";
import { messages } from "@/messages";
import { ValidationError } from "@/validators/validation-error";

describe("Pet", { tags: ["RF-02", "RF-04"] }, () => {
  test("aplica os valores padrão e esconde o dono no JSON", () => {
    const rex = new Pet({ ownerId: "user-1", name: "Rex", type: "Cachorro", breed: "SRD", age: "3", weight: "12" });

    expect(rex.vaccine).toBe("");
    expect(rex.icon).toBe("🐾");
    expect(rex.description).toBe("");
    expect(rex.ownerId).toBe("user-1");
    expect(JSON.parse(JSON.stringify(rex))).not.toHaveProperty("ownerId");
  });

  test.each(["0", "100", " 7 "])("aceita a idade %j", (age) => {
    expect(new Pet({ ownerId: "user-1", name: "Rex", type: "Cachorro", breed: "SRD", age, weight: "12" }).age).toBe(age.trim());
  });

  test.each(["-1", "101", "abc", "2.5"])("recusa a idade %j", (age) => {
    expect(() => new Pet({ ownerId: "user-1", name: "Rex", type: "Cachorro", breed: "SRD", age, weight: "12" })).toThrow(
      new ValidationError(messages.invalidAge),
    );
  });

  test("recusa campos ausentes e datas de vacina inválidas", () => {
    expect(() => new Pet({ ownerId: "user-1", name: "Rex", type: "", breed: "SRD", age: "3", weight: "12" })).toThrow(
      new ValidationError(messages.requiredFields),
    );
    expect(() =>
      new Pet({ ownerId: "user-1", name: "Rex", type: "Cachorro", breed: "SRD", age: "3", weight: "12", vaccine: "2026-02-30" }),
    ).toThrow(new ValidationError(messages.invalidVaccineDate));
  });
});
