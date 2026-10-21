import { describe, expect, test } from "vitest";
import { messages } from "@/messages";
import { translate } from "@/services/translate";

describe("translate", { tags: ["RF-04", "RF-06"] }, () => {
  test("traduz para português todas as mensagens do catálogo da API", () => {
    for (const message of Object.values(messages)) {
      const translated = translate(message);

      expect(translated).not.toBe(message);
      expect(translated).toMatch(/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ].*[.!]$/);
    }
  });

  test("usa as mensagens esperadas pelos casos do roteiro", () => {
    expect(translate(messages.invalidCredentials)).toBe("E-mail ou senha inválidos.");
    expect(translate(messages.emailTaken)).toBe("Este e-mail já está cadastrado.");
    expect(translate(messages.missingCredentials)).toBe("Informe e-mail e senha para continuar.");
    expect(translate(messages.loginRequired)).toBe("Faça login para continuar.");
  });

  test("mantém as mensagens que não são do catálogo", () => {
    expect(translate("Failed to fetch")).toBe("Failed to fetch");
  });
});
