import type { DeleteAppointmentInput } from "@/usecases/appointments/delete-appointment";
import type { UseCase } from "@/usecases/use-case";
import type { Validator } from "@/validators/validator";
import {
  noContent,
  type AuthenticatedRequest,
  type Controller,
} from "../http";

export class DeleteAppointmentController
  implements Controller<AuthenticatedRequest>
{
  constructor(
    private readonly validator: Validator<{ id: string }>,
    private readonly deleteAppointment: UseCase<DeleteAppointmentInput, void>,
  ) {}

  async handle({ query, user }: AuthenticatedRequest) {
    const { id } = this.validator.validate(query);
    await this.deleteAppointment.execute({ userId: user.id, id });
    return noContent();
  }
}
