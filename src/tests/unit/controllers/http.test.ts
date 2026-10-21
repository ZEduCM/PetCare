import { describe, expect, test, vi } from "vitest";
import { errorResponse, numberText, optionalText, text } from "@/controllers/http";
import { messages } from "@/messages";
import { ConflictError, NotFoundError, UnauthorizedError } from "@/usecases/errors";
import { ValidationError } from "@/validators/validation-error";

describe("helpers de texto", { tags: ["RF-04"] }, () => {
  test("text aceita só textos e usa texto vazio como padrão", () => {
    expect(text("Luna")).toBe("Luna");
    expect(text(123)).toBe("");
    expect(text(undefined)).toBe("");
    expect(text({ name: "Luna" })).toBe("");
  });

  test("optionalText deixa como undefined valores ausentes ou que não são texto", () => {
    expect(optionalText(undefined)).toBeUndefined();
    expect(optionalText(null)).toBeUndefined();
    expect(optionalText(123)).toBeUndefined();
    expect(optionalText("")).toBe("");
  });

  test("numberText aceita textos e números finitos", () => {
    expect(numberText("3")).toBe("3");
    expect(numberText(3.5)).toBe("3.5");
    expect(numberText(Number.NaN)).toBe("");
    expect(numberText(undefined)).toBe("");
  });
});

describe("errorResponse", { tags: ["RF-06"] }, () => {
  test("converte erros conhecidos em códigos HTTP", () => {
    expect(errorResponse(new ValidationError(messages.invalidDate))).toEqual({
      statusCode: 400,
      body: { message: messages.invalidDate },
    });
    expect(errorResponse(new NotFoundError(messages.petNotFound)).statusCode).toBe(404);
    expect(errorResponse(new ConflictError(messages.emailTaken)).statusCode).toBe(409);
    expect(errorResponse(new UnauthorizedError(messages.invalidCredentials))).toEqual({
      statusCode: 401,
      body: { message: messages.invalidCredentials },
    });
  });

  test("esconde erros inesperados", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(errorResponse(new Error("connection refused"))).toEqual({
      statusCode: 500,
      body: { message: messages.unexpectedError },
    });
    log.mockRestore();
  });
});
