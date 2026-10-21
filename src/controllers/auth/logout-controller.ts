import type { LogoutInput } from "@/usecases/auth/logout";
import type { UseCase } from "@/usecases/use-case";
import { noContent, type Controller, type HttpRequest } from "../http";

export class LogoutController implements Controller {
  constructor(private readonly logout: UseCase<LogoutInput, void>) {}

  async handle({ sessionToken }: HttpRequest) {
    if (sessionToken) await this.logout.execute({ token: sessionToken });
    return { ...noContent(), session: null };
  }
}
