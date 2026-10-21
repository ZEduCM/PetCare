import { isFilled, type ValidationInput, type Validator } from "./validator";

export class NotBlankFieldsValidator implements Validator {
  constructor(
    private readonly fields: string[],
    private readonly message: string,
  ) {}

  validate(input: ValidationInput) {
    const blank = this.fields.some(
      (field) => input[field] !== undefined && !isFilled(input[field]),
    );
    return blank ? this.message : null;
  }
}
