import type { Appointment, AppointmentInput } from "@/entities";
import { NotFoundError } from "../errors";
import type { AppointmentRepository } from "../ports/appointment-repository";
import type { UseCase } from "../use-case";

export interface CreateAppointmentInput {
  userId: string;
  data: Pick<AppointmentInput, "petId" | "title" | "category" | "date" | "time"> &
    Partial<Pick<AppointmentInput, "notes">>;
}

export class CreateAppointment
  implements UseCase<CreateAppointmentInput, Appointment>
{
  constructor(private readonly appointments: AppointmentRepository) {}

  async execute({ userId, data }: CreateAppointmentInput) {
    const appointment = await this.appointments.create(userId, {
      ...data,
      notes: data.notes ?? "",
    });
    if (!appointment) throw new NotFoundError("Pet não encontrado.");
    return appointment;
  }
}
