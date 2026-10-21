import type { LoginInput, LoginOutput } from "@/usecases/auth/login";
import type { UseCase } from "@/usecases/use-case";
import type { Validator } from "@/validators/validator";
import {
  badRequest,
  ok,
  text,
  type Controller,
  type HttpRequest,
} from "../http";

export class LoginController implements Controller {
  constructor(
    private readonly validator: Validator,
    private readonly login: UseCase<LoginInput, LoginOutput>,
  ) {}

  async handle({ body }: HttpRequest) {
    const input = { email: text(body.email), password: text(body.password) };
    const error = this.validator.validate(input);
    if (error) return badRequest(error);

    const { user, session } = await this.login.execute(input);
    return { ...ok(user), session };
  }
}
