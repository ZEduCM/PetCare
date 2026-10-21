import { NextRequest } from "next/server";
import * as appointments from "@/app/api/appointments/route";
import * as login from "@/app/api/auth/login/route";
import * as logout from "@/app/api/auth/logout/route";
import * as register from "@/app/api/auth/register/route";
import * as pets from "@/app/api/pets/route";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { CookieJar, activateCookieJar } from "./cookie-jar";

type Method = "GET" | "POST" | "PUT" | "DELETE";
type Handler = (request: NextRequest) => Promise<Response>;

const routes: Record<string, Partial<Record<Method, Handler>>> = {
  "/api/appointments": appointments,
  "/api/auth/login": login,
  "/api/auth/logout": logout,
  "/api/auth/register": register,
  "/api/pets": pets,
};

export interface ApiResponse<Body> {
  status: number;
  body: Body;
}

export interface ErrorBody {
  message: string;
}

export class ApiClient {
  readonly cookies = new CookieJar();

  get sessionCookie() {
    return this.cookies.cookies.get(SESSION_COOKIE);
  }

  async request<Body = ErrorBody>(
    method: Method,
    path: string,
    body?: unknown,
  ): Promise<ApiResponse<Body>> {
    const url = new URL(path, "http://localhost:3000");
    const handler = routes[url.pathname]?.[method];
    if (!handler) throw new Error(`No route for ${method} ${url.pathname}`);

    activateCookieJar(this.cookies);
    const response = await handler(
      new NextRequest(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:
          body === undefined || typeof body === "string"
            ? body
            : JSON.stringify(body),
      }),
    );

    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  }

  get<Body = ErrorBody>(path: string) {
    return this.request<Body>("GET", path);
  }

  post<Body = ErrorBody>(path: string, body?: unknown) {
    return this.request<Body>("POST", path, body);
  }

  put<Body = ErrorBody>(path: string, body?: unknown) {
    return this.request<Body>("PUT", path, body);
  }

  delete<Body = ErrorBody>(path: string) {
    return this.request<Body>("DELETE", path);
  }
}
