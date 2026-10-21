import { PostgresAppointmentRepository } from "@/repositories/appointments/postgres-appointment-repository";
import { pool } from "@/database/db";
import { PostgresPetRepository } from "@/repositories/pets/postgres-pet-repository";
import { PostgresSessionRepository } from "@/repositories/sessions/postgres-session-repository";
import { PostgresUserRepository } from "@/repositories/users/postgres-user-repository";

export const makeUserRepository = () => new PostgresUserRepository(pool);

export const makeSessionRepository = () => new PostgresSessionRepository(pool);

export const makePetRepository = () => new PostgresPetRepository(pool);

export const makeAppointmentRepository = () =>
  new PostgresAppointmentRepository(pool);
