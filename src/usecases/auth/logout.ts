import type { SessionRepository } from "../ports/session-repository";
import type { UseCase } from "../use-case";

export interface LogoutInput {
  token: string;
}

export class Logout implements UseCase<LogoutInput, void> {
  constructor(private readonly sessions: SessionRepository) {}

  execute({ token }: LogoutInput) {
    return this.sessions.delete(token);
  }
}
