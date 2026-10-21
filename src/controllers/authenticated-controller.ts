import type { User } from "@/entities";
import type { AuthenticateInput } from "@/usecases/auth/authenticate";
import type { UseCase } from "@/usecases/use-case";
import {
  unauthorized,
  type AuthenticatedRequest,
  type Controller,
  type HttpRequest,
} from "./http";

export class AuthenticatedController implements Controller {
  constructor(
    private readonly authenticate: UseCase<AuthenticateInput, User | null>,
    private readonly controller: Controller<AuthenticatedRequest>,
  ) {}

  async handle(request: HttpRequest) {
    const user = request.sessionToken
      ? await this.authenticate.execute({ token: request.sessionToken })
      : null;
    if (!user) return unauthorized();

    return this.controller.handle({ ...request, user });
  }
}
