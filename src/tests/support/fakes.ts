import type { Appointment, Pet, Session, User } from "@/entities";
import type { AppointmentRepository } from "@/usecases/ports/appointment-repository";
import type { PasswordHasher } from "@/usecases/ports/password-hasher";
import type { PetRepository } from "@/usecases/ports/pet-repository";
import type { SessionRepository } from "@/usecases/ports/session-repository";
import type { UserRepository } from "@/usecases/ports/user-repository";
import { ValidationError } from "@/validators/validation-error";
import type { Validator } from "@/validators/validator";

export class InMemoryUserRepository implements UserRepository {
  users: User[] = [];

  async findByEmail(email: string) {
    return this.users.find((user) => user.email === email.toLowerCase()) ?? null;
  }

  async create(user: User) {
    this.users.push(user);
  }
}

export class InMemorySessionRepository implements SessionRepository {
  sessions: Session[] = [];

  constructor(private readonly users: InMemoryUserRepository) {}

  async create(session: Session) {
    this.sessions.push(session);
  }

  async findUser(token: string) {
    const session = this.sessions.find((item) => item.token === token);
    return this.users.users.find((user) => user.id === session?.userId) ?? null;
  }

  async delete(token: string) {
    this.sessions = this.sessions.filter((session) => session.token !== token);
  }
}

export class InMemoryPetRepository implements PetRepository {
  pets: Pet[] = [];

  async listByUser(userId: string) {
    return this.pets.filter((pet) => pet.ownerId === userId);
  }

  async findById(userId: string, id: string) {
    return this.pets.find((pet) => pet.id === id && pet.ownerId === userId) ?? null;
  }

  async create(pet: Pet) {
    this.pets.push(pet);
  }
}

export class InMemoryAppointmentRepository implements AppointmentRepository {
  appointments: Appointment[] = [];

  constructor(private readonly pets: InMemoryPetRepository) {}

  async listByUser(userId: string) {
    return this.appointments.filter((appointment) => this.ownedBy(appointment, userId));
  }

  async findById(userId: string, id: string) {
    return (
      this.appointments.find((appointment) => appointment.id === id && this.ownedBy(appointment, userId)) ?? null
    );
  }

  async create(appointment: Appointment) {
    this.appointments.push(appointment);
  }

  async update(appointment: Appointment) {
    this.appointments = this.appointments.map((item) => (item.id === appointment.id ? appointment : item));
  }

  async delete(userId: string, id: string) {
    const appointment = await this.findById(userId, id);
    this.appointments = this.appointments.filter((item) => item !== appointment);
    return appointment !== null;
  }

  private ownedBy(appointment: Appointment, userId: string) {
    return this.pets.pets.some((pet) => pet.id === appointment.petId && pet.ownerId === userId);
  }
}

export const fakeHasher: PasswordHasher = {
  hash: async (password) => `hashed:${password}`,
  verify: async (password, hash) => hash === `hashed:${password}`,
};

export const passThroughValidator = <T>(): Validator<T> => ({ validate: (input) => input as T });

export const rejectingValidator = <T>(message: string): Validator<T> => ({
  validate: () => {
    throw new ValidationError(message);
  },
});
