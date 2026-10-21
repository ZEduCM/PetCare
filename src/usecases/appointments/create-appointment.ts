import { Appointment, type AppointmentData } from "@/entities";
import { messages } from "@/messages";
import { NotFoundError } from "../errors";
import type { AppointmentRepository } from "../ports/appointment-repository";
import type { PetRepository } from "../ports/pet-repository";
import type { UseCase } from "../use-case";

export interface CreateAppointmentInput {
  userId: string;
  data: Omit<AppointmentData, "id" | "petName" | "completed">;
}

export class CreateAppointment
  implements UseCase<CreateAppointmentInput, Appointment>
{
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly pets: PetRepository,
  ) {}

  async execute({ userId, data }: CreateAppointmentInput) {
    const pet = await this.pets.findById(userId, data.petId);
    if (!pet) throw new NotFoundError(messages.petNotFound);

    const appointment = new Appointment({ ...data, petName: pet.name });
    await this.appointments.create(appointment);
    return appointment;
  }
}
