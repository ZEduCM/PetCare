import type { Pool } from "pg";
import { User, type Session, type UserProps } from "@/entities";
import type { SessionRepository } from "@/usecases/ports/session-repository";

export class PostgresSessionRepository implements SessionRepository {
  constructor(private readonly db: Pool) {}

  async create(session: Session) {
    const queryText = `INSERT INTO sessions(token, user_id, expires_at) VALUES($1, $2, $3)`;
    await this.db.query(queryText, [
      session.token,
      session.userId,
      session.expiresAt,
    ]);
  }

  async findUser(token: string) {
    const queryText = `
      SELECT u.id, u.name, u.email, u.password AS "passwordHash"
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = $1 AND s.expires_at > now()`;

    const res = await this.db.query<UserProps>(queryText, [token]);
    return res.rows[0] ? new User(res.rows[0]) : null;
  }

  async delete(token: string) {
    const queryText = `DELETE FROM sessions WHERE token = $1`;
    await this.db.query(queryText, [token]);
  }
}
