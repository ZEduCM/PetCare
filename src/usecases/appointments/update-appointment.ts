import type { Appointment, AppointmentInput } from "@/entities";
import { NotFoundError } from "../errors";
import type { AppointmentRepository } from "../ports/appointment-repository";
import type { PetRepository } from "../ports/pet-repository";
import type { UseCase } from "../use-case";

export interface UpdateAppointmentInput {
  userId: string;
  id: string;
  data: Partial<AppointmentInput>;
}

export class UpdateAppointment
  implements UseCase<UpdateAppointmentInput, Appointment>
{
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly pets: PetRepository,
  ) {}

  async execute({ userId, id, data }: UpdateAppointmentInput) {
    if (
      data.petId !== undefined &&
      !(await this.pets.findById(userId, data.petId))
    ) {
      throw new NotFoundError("Pet não encontrado.");
    }

    const appointment = await this.appointments.update(userId, id, data);
    if (!appointment) throw new NotFoundError("Compromisso não encontrado.");
    return appointment;
  }
}
