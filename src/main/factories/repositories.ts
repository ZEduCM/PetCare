import { PostgresAppointmentRepository } from "@/database/appointments/postgres-appointment-repository";
import { pool } from "@/database/db";
import { PostgresPetRepository } from "@/database/pets/postgres-pet-repository";
import { PostgresSessionRepository } from "@/database/sessions/postgres-session-repository";
import { PostgresUserRepository } from "@/database/users/postgres-user-repository";

export const makeUserRepository = () => new PostgresUserRepository(pool);

export const makeSessionRepository = () => new PostgresSessionRepository(pool);

export const makePetRepository = () => new PostgresPetRepository(pool);

export const makeAppointmentRepository = () =>
  new PostgresAppointmentRepository(pool);
