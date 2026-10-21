import { z } from "zod";
import { messages } from "@/messages";
import { requiredText } from "@/validators/fields";
import { ZodValidator } from "@/validators/zod-validator";

export interface UserProps {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export type UserData = Omit<UserProps, "id"> & Partial<Pick<UserProps, "id">>;

export type UserJSON = Omit<UserProps, "passwordHash">;

const validator = new ZodValidator(
  z.object({
    id: z.string().default(() => crypto.randomUUID()),
    name: requiredText(messages.requiredFields),
    email: requiredText(messages.requiredFields)
      .toLowerCase()
      .pipe(z.email({ error: messages.invalidEmail })),
    passwordHash: z.string(),
  }),
);

export class User {
  private readonly props: UserProps;

  constructor(data: UserData) {
    this.props = validator.validate(data);
  }

  get id() {
    return this.props.id;
  }

  get name() {
    return this.props.name;
  }

  get email() {
    return this.props.email;
  }

  get passwordHash() {
    return this.props.passwordHash;
  }

  toJSON(): UserJSON {
    return { id: this.id, name: this.name, email: this.email };
  }
}
