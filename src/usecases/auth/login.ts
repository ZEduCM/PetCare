import type { Session, User } from "@/entities";
import { UnauthorizedError } from "../errors";
import type { PasswordHasher } from "../ports/password-hasher";
import type { SessionRepository } from "../ports/session-repository";
import type { TokenGenerator } from "../ports/token-generator";
import type { UserRepository } from "../ports/user-repository";
import type { UseCase } from "../use-case";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

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
    const found = await this.users.findByEmail(email.trim());
    if (!found || !(await this.hasher.verify(password, found.password))) {
      throw new UnauthorizedError("E-mail ou senha inválidos.");
    }

    const session: Session = {
      token: this.tokens.generate(),
      userId: found.id,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    };
    await this.sessions.create(session);

    const user = { id: found.id, name: found.name, email: found.email };
    return { user, session };
  }
}
