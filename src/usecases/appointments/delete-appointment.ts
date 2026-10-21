import { NotFoundError } from "../errors";
import type { AppointmentRepository } from "../ports/appointment-repository";
import type { UseCase } from "../use-case";

export interface DeleteAppointmentInput {
  userId: string;
  id: string;
}

export class DeleteAppointment implements UseCase<DeleteAppointmentInput, void> {
  constructor(private readonly appointments: AppointmentRepository) {}

  async execute({ userId, id }: DeleteAppointmentInput) {
    if (!(await this.appointments.delete(userId, id))) {
      throw new NotFoundError("Compromisso não encontrado.");
    }
  }
}
