import type { Appointment } from "@/entities";
import type { AppointmentRepository } from "../ports/appointment-repository";
import type { UseCase } from "../use-case";

export interface ListAppointmentsInput {
  userId: string;
}

export class ListAppointments
  implements UseCase<ListAppointmentsInput, Appointment[]>
{
  constructor(private readonly appointments: AppointmentRepository) {}

  execute({ userId }: ListAppointmentsInput) {
    return this.appointments.listByUser(userId);
  }
}
