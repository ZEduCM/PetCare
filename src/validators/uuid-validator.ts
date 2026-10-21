import { isUuid } from "@/lib/uuid";
import { isFilled, type ValidationInput, type Validator } from "./validator";

export class UuidValidator implements Validator {
  constructor(
    private readonly field: string,
    private readonly message = "Informe um id válido.",
  ) {}

  validate(input: ValidationInput) {
    const value = input[this.field];
    return isFilled(value) && !isUuid(value) ? this.message : null;
  }
}
