import { randomBytes } from "node:crypto";
import type { TokenGenerator } from "@/usecases/ports/token-generator";

export class RandomTokenGenerator implements TokenGenerator {
  generate() {
    return randomBytes(32).toString("hex");
  }
}
