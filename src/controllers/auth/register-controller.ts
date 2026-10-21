import type { User } from "@/entities";
import { messages } from "@/messages";
import type { RegisterUserInput } from "@/usecases/auth/register-user";
import type { UseCase } from "@/usecases/use-case";
import { created, text, type Controller, type HttpRequest } from "../http";

export class RegisterController implements Controller {
  constructor(
    private readonly registerUser: UseCase<RegisterUserInput, User>,
  ) {}

  async handle({ body }: HttpRequest) {
    const user = await this.registerUser.execute({
      name: text(body.name),
      email: text(body.email),
      password: text(body.password),
    });
    return created({ message: messages.userRegistered, user });
  }
}
