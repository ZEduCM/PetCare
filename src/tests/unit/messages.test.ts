import { describe, expect, test } from "vitest";
import { messages } from "@/messages";

describe("messages", { tags: ["RF-06"] }, () => {
  test("todas as mensagens da API estão em inglês e terminam com ponto", () => {
    for (const message of Object.values(messages)) {
      expect(message).toMatch(/^[A-Z][\x20-\x7E]+\.$/);
    }
  });

  test("não há mensagens repetidas no catálogo", () => {
    const values = Object.values(messages);

    expect(new Set(values).size).toBe(values.length);
  });
});
