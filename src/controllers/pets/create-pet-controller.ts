import type { Pet } from "@/entities";
import type { CreatePetInput } from "@/usecases/pets/create-pet";
import type { UseCase } from "@/usecases/use-case";
import type { Validator } from "@/validators/validator";
import {
  badRequest,
  created,
  optionalText,
  text,
  type AuthenticatedRequest,
  type Controller,
} from "../http";

export class CreatePetController implements Controller<AuthenticatedRequest> {
  constructor(
    private readonly validator: Validator,
    private readonly createPet: UseCase<CreatePetInput, Pet>,
  ) {}

  async handle({ body, user }: AuthenticatedRequest) {
    const data = {
      name: text(body.name),
      type: text(body.type),
      breed: text(body.breed),
      age: text(body.age),
      weight: text(body.weight),
      vaccine: optionalText(body.vaccine),
      icon: optionalText(body.icon),
      description: optionalText(body.description),
    };
    const error = this.validator.validate(data);
    if (error) return badRequest(error);

    return created(await this.createPet.execute({ userId: user.id, data }));
  }
}
