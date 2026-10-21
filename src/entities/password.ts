import { z } from "zod";
import { messages } from "@/messages";
import { ZodValidator } from "@/validators/zod-validator";

const validator = new ZodValidator(
  z
    .string({ error: messages.requiredFields })
    .min(1, messages.requiredFields)
    .min(8, messages.shortPassword),
);

export class Password {
  readonly value: string;

  constructor(value: string) {
    this.value = validator.validate(value);
  }
}
