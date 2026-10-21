import type { Session, User } from "@/entities";

export interface SessionRepository {
  create(session: Session): Promise<void>;
  findUser(token: string): Promise<User | null>;
  delete(token: string): Promise<void>;
}
