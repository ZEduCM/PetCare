import type { User, UserWithPassword } from "@/entities";

export type NewUser = Omit<UserWithPassword, "id">;

export interface UserRepository {
  findByEmail(email: string): Promise<UserWithPassword | null>;
  create(user: NewUser): Promise<User>;
}
