export interface Appointment {
  id: string;
  petId: string;
  pet: string;
  title: string;
  category: string;
  date: string;
  time: string;
  notes: string;
  completed?: boolean;
}

export type AppointmentInput = Omit<Appointment, "id" | "pet">;
