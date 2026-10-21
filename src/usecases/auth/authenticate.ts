import type { User } from "@/entities";
import type { SessionRepository } from "../ports/session-repository";
import type { UseCase } from "../use-case";

export interface AuthenticateInput {
  token: string;
}

export class Authenticate implements UseCase<AuthenticateInput, User | null> {
  constructor(private readonly sessions: SessionRepository) {}

  execute({ token }: AuthenticateInput) {
    return this.sessions.findUser(token);
  }
}
