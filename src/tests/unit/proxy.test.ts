import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, test } from "vitest";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { config, proxy } from "@/proxy";

function request(path: string, cookie?: string) {
  const headers = cookie ? { cookie: `${SESSION_COOKIE}=${cookie}` } : undefined;
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

describe("proxy", { tags: ["RF-09"] }, () => {
  test.each(["/dashboard", "/pets/abc", "/compromissos/novo"])(
    "PRX-01 — página protegida sem cookie (%s) redireciona (307) para /login",
    (path) => {
      const response = proxy(request(path));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/login");
    },
  );

  test("PRX-02 — página protegida com cookie segue sem redirecionar", () => {
    const response = proxy(request("/dashboard", "token"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  test.each([
    ["/dashboard", true],
    ["/pets/abc", true],
    ["/compromissos/novo", true],
    ["/compromissos/123/editar", true],
    ["/login", false],
    ["/cadastro", false],
    ["/api/pets", false],
  ])("PRX-03 — o matcher cobre %s: %s", (url, expected) => {
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(expected);
  });
});
