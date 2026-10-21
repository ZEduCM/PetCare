import { isFilled, type ValidationInput, type Validator } from "./validator";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EmailValidator implements Validator {
  constructor(
    private readonly field: string,
    private readonly message = "Informe um e-mail válido.",
  ) {}

  validate(input: ValidationInput) {
    const value = input[this.field];
    return isFilled(value) && !EMAIL_PATTERN.test(value.trim())
      ? this.message
      : null;
  }
}
