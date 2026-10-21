import type { Appointment } from "@/entities";

export interface AppointmentRepository {
  listByUser(userId: string): Promise<Appointment[]>;
  findById(userId: string, id: string): Promise<Appointment | null>;
  create(appointment: Appointment): Promise<void>;
  update(appointment: Appointment): Promise<void>;
  delete(userId: string, id: string): Promise<boolean>;
}
