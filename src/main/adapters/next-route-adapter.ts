import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  badRequest,
  errorResponse,
  type Controller,
  type HttpResponse,
} from "@/controllers/http";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { messages } from "@/messages";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

async function readBody(request: NextRequest) {
  const raw = await request.text();
  if (!raw) return {};

  try {
    const body: unknown = JSON.parse(raw);
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function applySession(store: CookieStore, session: HttpResponse["session"]) {
  if (session === null) {
    store.delete(SESSION_COOKIE);
  } else if (session) {
    store.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: session.expiresAt,
    });
  }
}

function toResponse({ statusCode, body }: HttpResponse) {
  return body === undefined
    ? new Response(null, { status: statusCode })
    : Response.json(body, { status: statusCode });
}

export function adaptRoute(controller: Controller) {
  return async (request: NextRequest) => {
    const body = await readBody(request);
    if (!body) return toResponse(badRequest(messages.invalidBody));

    const store = await cookies();
    let response: HttpResponse;
    try {
      response = await controller.handle({
        body,
        query: Object.fromEntries(request.nextUrl.searchParams),
        sessionToken: store.get(SESSION_COOKIE)?.value,
      });
    } catch (error) {
      response = errorResponse(error);
    }

    applySession(store, response.session);
    return toResponse(response);
  };
}
