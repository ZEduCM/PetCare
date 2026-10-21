import { isFilled, type ValidationInput, type Validator } from "./validator";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class TimeValidator implements Validator {
  constructor(
    private readonly field: string,
    private readonly message = "Informe um horário válido.",
  ) {}

  validate(input: ValidationInput) {
    const value = input[this.field];
    return isFilled(value) && !TIME_PATTERN.test(value) ? this.message : null;
  }
}
