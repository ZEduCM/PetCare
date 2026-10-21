import type { DeleteAppointmentInput } from "@/usecases/appointments/delete-appointment";
import type { UseCase } from "@/usecases/use-case";
import type { Validator } from "@/validators/validator";
import {
  badRequest,
  noContent,
  type AuthenticatedRequest,
  type Controller,
} from "../http";

export class DeleteAppointmentController
  implements Controller<AuthenticatedRequest>
{
  constructor(
    private readonly validator: Validator,
    private readonly deleteAppointment: UseCase<DeleteAppointmentInput, void>,
  ) {}

  async handle({ query, user }: AuthenticatedRequest) {
    const id = query.id ?? "";
    const error = this.validator.validate({ id });
    if (error) return badRequest(error);

    await this.deleteAppointment.execute({ userId: user.id, id });
    return noContent();
  }
}
