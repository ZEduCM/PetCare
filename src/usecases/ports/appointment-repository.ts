import type { Appointment, AppointmentInput } from "@/entities";

export interface AppointmentRepository {
  listByUser(userId: string): Promise<Appointment[]>;
  create(userId: string, data: AppointmentInput): Promise<Appointment | null>;
  update(
    userId: string,
    id: string,
    data: Partial<AppointmentInput>,
  ): Promise<Appointment | null>;
  delete(userId: string, id: string): Promise<boolean>;
}
