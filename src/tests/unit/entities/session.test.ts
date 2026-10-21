import { describe, expect, test } from "vitest";
import { Session } from "@/entities";

describe("Session", { tags: ["RF-01"] }, () => {
  test("expira em sete dias", () => {
    const now = new Date("2026-10-21T12:00:00Z");

    const session = new Session("token", "user-1", now);

    expect(session.expiresAt.toISOString()).toBe("2026-10-28T12:00:00.000Z");
  });
});
