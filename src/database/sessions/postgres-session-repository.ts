import type { Pool } from "pg";
import type { Session, User } from "@/entities";
import type { SessionRepository } from "@/usecases/ports/session-repository";

export class PostgresSessionRepository implements SessionRepository {
  constructor(private readonly db: Pool) {}

  async create({ token, userId, expiresAt }: Session) {
    const queryText = `INSERT INTO sessions(token, user_id, expires_at) VALUES($1, $2, $3)`;
    await this.db.query(queryText, [token, userId, expiresAt]);
  }

  async findUser(token: string) {
    const queryText = `
      SELECT u.id, u.name, u.email
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = $1 AND s.expires_at > now()`;

    const res = await this.db.query<User>(queryText, [token]);
    return res.rows[0] ?? null;
  }

  async delete(token: string) {
    const queryText = `DELETE FROM sessions WHERE token = $1`;
    await this.db.query(queryText, [token]);
  }
}
