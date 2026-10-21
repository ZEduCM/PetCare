import { Session, type User } from "@/entities";
import { messages } from "@/messages";
import { UnauthorizedError } from "../errors";
import type { PasswordHasher } from "../ports/password-hasher";
import type { SessionRepository } from "../ports/session-repository";
import type { TokenGenerator } from "../ports/token-generator";
import type { UserRepository } from "../ports/user-repository";
import type { UseCase } from "../use-case";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  user: User;
  session: Session;
}

export class Login implements UseCase<LoginInput, LoginOutput> {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenGenerator,
  ) {}

  async execute({ email, password }: LoginInput) {
    const user = await this.users.findByEmail(email.trim());
    if (!user || !(await this.hasher.verify(password, user.passwordHash))) {
      throw new UnauthorizedError(messages.invalidCredentials);
    }

    const session = new Session(this.tokens.generate(), user.id);
    await this.sessions.create(session);
    return { user, session };
  }
}
