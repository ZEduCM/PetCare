import type { AppointmentJSON, PetJSON, UserJSON } from '@/entities'

export type User = UserJSON

export type Pet = PetJSON

export type Appointment = AppointmentJSON

export type AppointmentInput = Omit<Appointment, 'id' | 'pet' | 'completed'> & {
  completed?: boolean
}
