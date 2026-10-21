import type { User } from "@/entities";
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
    const email = input.email.trim().toLowerCase();
    if (await this.users.findByEmail(email)) {
      throw new ConflictError("Este e-mail já está cadastrado.");
    }

    return this.users.create({
      name: input.name.trim(),
      email,
      password: await this.hasher.hash(input.password),
    });
  }
}
