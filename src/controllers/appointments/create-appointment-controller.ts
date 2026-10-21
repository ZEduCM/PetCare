import type { Appointment } from "@/entities";
import type { CreateAppointmentInput } from "@/usecases/appointments/create-appointment";
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

export class CreateAppointmentController
  implements Controller<AuthenticatedRequest>
{
  constructor(
    private readonly validator: Validator,
    private readonly createAppointment: UseCase<
      CreateAppointmentInput,
      Appointment
    >,
  ) {}

  async handle({ body, user }: AuthenticatedRequest) {
    const data = {
      petId: text(body.petId),
      title: text(body.title),
      category: text(body.category),
      date: text(body.date),
      time: text(body.time),
      notes: optionalText(body.notes),
    };
    const error = this.validator.validate(data);
    if (error) return badRequest(error);

    return created(
      await this.createAppointment.execute({ userId: user.id, data }),
    );
  }
}
