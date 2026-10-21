import { isFilled, type ValidationInput, type Validator } from "./validator";

export class RequiredFieldsValidator implements Validator {
  constructor(
    private readonly fields: string[],
    private readonly message: string,
  ) {}

  validate(input: ValidationInput) {
    return this.fields.every((field) => isFilled(input[field]))
      ? null
      : this.message;
  }
}
