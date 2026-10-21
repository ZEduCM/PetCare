import type { Session, User } from "@/entities";
import { messages } from "@/messages";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "@/usecases/errors";
import { ValidationError } from "@/validators/validation-error";

export interface HttpRequest {
  body: Record<string, unknown>;
  query: Record<string, string>;
  sessionToken?: string;
}

export interface AuthenticatedRequest extends HttpRequest {
  user: User;
}

export interface HttpResponse {
  statusCode: number;
  body?: unknown;
  session?: Session | null;
}

export interface Controller<Request extends HttpRequest = HttpRequest> {
  handle(request: Request): Promise<HttpResponse>;
}

export const ok = (body: unknown): HttpResponse => ({ statusCode: 200, body });

export const created = (body: unknown): HttpResponse => ({
  statusCode: 201,
  body,
});

export const noContent = (): HttpResponse => ({ statusCode: 204 });

export const badRequest = (message: string): HttpResponse => ({
  statusCode: 400,
  body: { message },
});

export const unauthorized = (
  message: string = messages.loginRequired,
): HttpResponse => ({ statusCode: 401, body: { message } });

export const notFound = (message: string): HttpResponse => ({
  statusCode: 404,
  body: { message },
});

export const conflict = (message: string): HttpResponse => ({
  statusCode: 409,
  body: { message },
});

export const serverError = (): HttpResponse => ({
  statusCode: 500,
  body: { message: messages.unexpectedError },
});

export function errorResponse(error: unknown): HttpResponse {
  if (error instanceof ValidationError) return badRequest(error.message);
  if (error instanceof NotFoundError) return notFound(error.message);
  if (error instanceof ConflictError) return conflict(error.message);
  if (error instanceof UnauthorizedError) return unauthorized(error.message);

  console.error(error);
  return serverError();
}

export function optionalText(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export function text(value: unknown) {
  return optionalText(value) ?? "";
}

export function numberText(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return text(value);
}
