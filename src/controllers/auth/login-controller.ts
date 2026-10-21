import type { LoginInput, LoginOutput } from "@/usecases/auth/login";
import type { UseCase } from "@/usecases/use-case";
import type { Validator } from "@/validators/validator";
import { ok, type Controller, type HttpRequest } from "../http";

export class LoginController implements Controller {
  constructor(
    private readonly validator: Validator<LoginInput>,
    private readonly login: UseCase<LoginInput, LoginOutput>,
  ) {}

  async handle({ body }: HttpRequest) {
    const { user, session } = await this.login.execute(
      this.validator.validate(body),
    );
    return { ...ok(user), session };
  }
}
