import type { Pool } from "pg";
import { User, type UserProps } from "@/entities";
import type { UserRepository } from "@/usecases/ports/user-repository";

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: Pool) {}

  async findByEmail(email: string) {
    const queryText = `
      SELECT id, name, email, password AS "passwordHash"
      FROM users
      WHERE lower(email) = lower($1)`;

    const res = await this.db.query<UserProps>(queryText, [email]);
    return res.rows[0] ? new User(res.rows[0]) : null;
  }

  async create(user: User) {
    const queryText = `INSERT INTO users(id, name, email, password) VALUES($1, $2, $3, $4)`;
    await this.db.query(queryText, [
      user.id,
      user.name,
      user.email,
      user.passwordHash,
    ]);
  }
}
