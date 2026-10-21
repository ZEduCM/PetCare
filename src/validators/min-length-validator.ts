import { isFilled, type ValidationInput, type Validator } from "./validator";

export class MinLengthValidator implements Validator {
  constructor(
    private readonly field: string,
    private readonly minLength: number,
    private readonly message: string,
  ) {}

  validate(input: ValidationInput) {
    const value = input[this.field];
    return isFilled(value) && value.length < this.minLength
      ? this.message
      : null;
  }
}
