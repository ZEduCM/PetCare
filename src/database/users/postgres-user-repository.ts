import type { Pool } from "pg";
import type { User, UserWithPassword } from "@/entities";
import type { NewUser, UserRepository } from "@/usecases/ports/user-repository";

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: Pool) {}

  async findByEmail(email: string) {
    const queryText = `SELECT id, name, email, password FROM users WHERE lower(email) = lower($1)`;

    const res = await this.db.query<UserWithPassword>(queryText, [email]);
    return res.rows[0] ?? null;
  }

  async create(user: NewUser) {
    const queryText = `INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING id, name, email`;

    const res = await this.db.query<User>(queryText, [
      user.name,
      user.email,
      user.password,
    ]);
    return res.rows[0];
  }
}
