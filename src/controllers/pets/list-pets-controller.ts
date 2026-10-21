import type { Pet } from "@/entities";
import type { ListPetsInput } from "@/usecases/pets/list-pets";
import type { UseCase } from "@/usecases/use-case";
import { ok, type AuthenticatedRequest, type Controller } from "../http";

export class ListPetsController implements Controller<AuthenticatedRequest> {
  constructor(private readonly listPets: UseCase<ListPetsInput, Pet[]>) {}

  async handle({ user }: AuthenticatedRequest) {
    return ok(await this.listPets.execute({ userId: user.id }));
  }
}
