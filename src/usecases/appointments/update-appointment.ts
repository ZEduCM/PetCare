import type { Appointment, AppointmentChanges } from "@/entities";
import { messages } from "@/messages";
import { NotFoundError } from "../errors";
import type { AppointmentRepository } from "../ports/appointment-repository";
import type { PetRepository } from "../ports/pet-repository";
import type { UseCase } from "../use-case";

export interface UpdateAppointmentInput {
  userId: string;
  id: string;
  data: Omit<AppointmentChanges, "pet"> & { petId?: string };
}

export class UpdateAppointment
  implements UseCase<UpdateAppointmentInput, Appointment>
{
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly pets: PetRepository,
  ) {}

  async execute({ userId, id, data: { petId, ...changes } }: UpdateAppointmentInput) {
    const appointment = await this.appointments.findById(userId, id);
    if (!appointment) throw new NotFoundError(messages.appointmentNotFound);

    const pet =
      petId === undefined ? undefined : await this.pets.findById(userId, petId);
    if (pet === null) throw new NotFoundError(messages.petNotFound);

    appointment.update({ ...changes, pet });
    await this.appointments.update(appointment);
    return appointment;
  }
}
