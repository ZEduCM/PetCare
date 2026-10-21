import { isFilled, type ValidationInput, type Validator } from "./validator";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export class DateValidator implements Validator {
  constructor(
    private readonly field: string,
    private readonly message = "Informe uma data válida.",
  ) {}

  validate(input: ValidationInput) {
    const value = input[this.field];
    return isFilled(value) && !isDate(value) ? this.message : null;
  }
}
