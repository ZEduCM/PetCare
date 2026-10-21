import type { z } from "zod";
import { ValidationError } from "./validation-error";
import type { Validator } from "./validator";

export class ZodValidator<T> implements Validator<T> {
  constructor(private readonly schema: z.ZodType<T>) {}

  validate(input: unknown) {
    const result = this.schema.safeParse(input);
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message);
    }
    return result.data;
  }
}
