
import { z } from "zod";
import { messages } from "@/messages";
import { requiredText } from "@/validators/fields";
import { ZodValidator } from "@/validators/zod-validator";

export interface PetProps {
  id: string;
  ownerId: string;
  name: string;
  type: string;
  breed: string;
  age: string;
  weight: string;
  vaccine: string;
  icon: string;
  description: string;
}

export type PetData = Pick<
  PetProps,
  "ownerId" | "name" | "type" | "breed" | "age" | "weight"
> &
  Partial<Pick<PetProps, "id" | "vaccine" | "icon" | "description">>;

export type PetJSON = Omit<PetProps, "ownerId">;

const DEFAULT_ICON = "🐾";

const validator = new ZodValidator(
  z.object({
    id: z.string().default(() => crypto.randomUUID()),
    ownerId: z.string(),
    name: requiredText(messages.requiredFields).max(
      100,
      messages.invalidPetNameOrBreed,
    ),
    type: requiredText(messages.requiredFields).pipe(
      z.enum(["Cachorro", "Gato", "Ave", "Outro"], {
        error: messages.invalidPetType,
      }),
    ),
    breed: requiredText(messages.requiredFields).max(
      100,
      messages.invalidPetNameOrBreed,
    ),
    age: requiredText(messages.requiredFields)
      .regex(/^\d+$/, messages.invalidAge)
      .refine((age) => Number(age) <= 100, messages.invalidAge)
      .transform((age) => String(Number(age))),
    weight: z
      .string()
      .trim()
      .min(1, messages.requiredFields)
      .refine((weight) => {
        const value = Number(weight);
        return Number.isFinite(value) && value >= 0.1 && value <= 1000;
      }, messages.invalidWeight),
    vaccine: z
      .literal("")
      .or(z.iso.date({ error: messages.invalidVaccineDate }))
      .default(""),
    icon: z
      .string()
      .trim()
      .optional()
      .transform((icon) => icon || DEFAULT_ICON),
    description: z.string().trim().default(""),
  }),
);

export class Pet {
  private readonly props: PetProps;

  constructor(data: PetData) {
    this.props = validator.validate(data);
  }

  get id() {
    return this.props.id;
  }

  get ownerId() {
    return this.props.ownerId;
  }

  get name() {
    return this.props.name;
  }

  get type() {
    return this.props.type;
  }

  get breed() {
    return this.props.breed;
  }

  get age() {
    return this.props.age;
  }

  get weight() {
    return this.props.weight;
  }

  get vaccine() {
    return this.props.vaccine;
  }

  get icon() {
    return this.props.icon;
  }

  get description() {
    return this.props.description;
  }

  toJSON(): PetJSON {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      breed: this.breed,
      age: this.age,
      weight: this.weight,
      vaccine: this.vaccine,
      icon: this.icon,
      description: this.description,
    };
  }
}
