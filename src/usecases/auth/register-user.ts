import { Password, User } from "@/entities";
import { messages } from "@/messages";
import { ConflictError } from "../errors";
import type { PasswordHasher } from "../ports/password-hasher";
import type { UserRepository } from "../ports/user-repository";
import type { UseCase } from "../use-case";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export class RegisterUser implements UseCase<RegisterUserInput, User> {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput) {
    const password = new Password(input.password);
    const user = new User({
      name: input.name,
      email: input.email,
      passwordHash: await this.hasher.hash(password.value),
    });

    if (await this.users.findByEmail(user.email)) {
      throw new ConflictError(messages.emailTaken);
    }

    await this.users.create(user);
    return user;
  }
}
