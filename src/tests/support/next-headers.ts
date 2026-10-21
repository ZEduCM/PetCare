import { vi } from "vitest";

vi.mock("next/headers", async () => {
  const { currentCookieJar } = await import("./cookie-jar");
  return { cookies: async () => currentCookieJar() };
});
