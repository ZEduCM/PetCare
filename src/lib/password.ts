import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { PasswordHasher } from "@/usecases/ports/password-hasher";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keyLength: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

export class ScryptPasswordHasher implements PasswordHasher {
  // Formato salvo no banco: "<salt>:<hash>", ambos em hexadecimal.
  async hash(password: string) {
    const salt = randomBytes(16).toString("hex");
    const hash = await scryptAsync(password, salt, KEY_LENGTH);
    return `${salt}:${hash.toString("hex")}`;
  }

  async verify(password: string, stored: string) {
    const [salt, hash] = stored.split(":");
    const expected = Buffer.from(hash ?? "", "hex");
    if (!salt || expected.length !== KEY_LENGTH) return false;

    const actual = await scryptAsync(password, salt, KEY_LENGTH);
    return timingSafeEqual(actual, expected);
  }
}
