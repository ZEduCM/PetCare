import type { ValidationInput, Validator } from "./validator";

export class ValidatorComposite implements Validator {
  constructor(private readonly validators: Validator[]) {}

  validate(input: ValidationInput) {
    for (const validator of this.validators) {
      const error = validator.validate(input);
      if (error) return error;
    }
    return null;
  }
}
