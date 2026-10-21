import type { Appointment } from "@/entities";
import type { ListAppointmentsInput } from "@/usecases/appointments/list-appointments";
import type { UseCase } from "@/usecases/use-case";
import { ok, type AuthenticatedRequest, type Controller } from "../http";

export class ListAppointmentsController
  implements Controller<AuthenticatedRequest>
{
  constructor(
    private readonly listAppointments: UseCase<
      ListAppointmentsInput,
      Appointment[]
    >,
  ) {}

  async handle({ user }: AuthenticatedRequest) {
    return ok(await this.listAppointments.execute({ userId: user.id }));
  }
}
