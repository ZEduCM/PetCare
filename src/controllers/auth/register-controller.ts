import type { User } from "@/entities";
import type { RegisterUserInput } from "@/usecases/auth/register-user";
import type { UseCase } from "@/usecases/use-case";
import type { Validator } from "@/validators/validator";
import {
  badRequest,
  created,
  text,
  type Controller,
  type HttpRequest,
} from "../http";

export class RegisterController implements Controller {
  constructor(
    private readonly validator: Validator,
    private readonly registerUser: UseCase<RegisterUserInput, User>,
  ) {}

  async handle({ body }: HttpRequest) {
    const input = {
      name: text(body.name),
      email: text(body.email),
      password: text(body.password),
    };
    const error = this.validator.validate(input);
    if (error) return badRequest(error);

    const user = await this.registerUser.execute(input);
    return created({ message: "Usuário cadastrado com sucesso!", user });
  }
}
