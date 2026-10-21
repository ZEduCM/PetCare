import type { Appointment } from "@/entities";
import type { UpdateAppointmentInput } from "@/usecases/appointments/update-appointment";
import type { UseCase } from "@/usecases/use-case";
import type { Validator } from "@/validators/validator";
import {
  badRequest,
  ok,
  optionalText,
  type AuthenticatedRequest,
  type Controller,
} from "../http";

export class UpdateAppointmentController
  implements Controller<AuthenticatedRequest>
{
  constructor(
    private readonly validator: Validator,
    private readonly updateAppointment: UseCase<
      UpdateAppointmentInput,
      Appointment
    >,
  ) {}

  async handle({ body, query, user }: AuthenticatedRequest) {
    const id = query.id ?? "";
    const data = {
      petId: optionalText(body.petId),
      title: optionalText(body.title),
      category: optionalText(body.category),
      date: optionalText(body.date),
      time: optionalText(body.time),
      notes: optionalText(body.notes),
      completed:
        typeof body.completed === "boolean" ? body.completed : undefined,
    };
    const error = this.validator.validate({ ...data, id });
    if (error) return badRequest(error);

    return ok(
      await this.updateAppointment.execute({ userId: user.id, id, data }),
    );
  }
}
