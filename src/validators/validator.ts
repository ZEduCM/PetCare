export type ValidationInput = Record<string, unknown>;

export interface Validator {
  validate(input: ValidationInput): string | null;
}

export function isFilled(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}
