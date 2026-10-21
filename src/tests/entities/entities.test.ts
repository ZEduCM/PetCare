import { describe, expect, test } from "vitest";
import { Appointment, Password, Pet, Session, User } from "@/entities";
import { messages } from "@/messages";
import { ValidationError } from "@/validators/validation-error";

const rex = new Pet({
  ownerId: "user-1",
  name: "Rex",
  type: "Cão",
  breed: "SRD",
  age: "3",
  weight: "12",
});

const appointmentData = {
  petId: rex.id,
  petName: rex.name,
  title: "Vacina",
  category: "Saúde",
  date: "2026-11-10",
  time: "09:30",
};

describe("User", () => {
  test("keeps the given id and generates one when it is missing", () => {
    const data = { name: "Ana", email: "ana@petcare.com", passwordHash: "hash" };

    expect(new User({ ...data, id: "user-1" }).id).toBe("user-1");
    expect(new User(data).id).not.toBe(new User(data).id);
  });

  test("normalizes name and email and hides the password hash in JSON", () => {
    const user = new User({ name: " Ana ", email: " Ana@PetCare.com ", passwordHash: "hash" });

    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.name).toBe("Ana");
    expect(user.email).toBe("ana@petcare.com");
    expect(user.passwordHash).toBe("hash");
    expect(JSON.parse(JSON.stringify(user))).toEqual({ id: user.id, name: "Ana", email: "ana@petcare.com" });
  });

  test("rejects missing fields and invalid emails", () => {
    expect(() => new User({ name: "", email: "ana@petcare.com", passwordHash: "hash" })).toThrow(
      new ValidationError(messages.requiredFields),
    );
    expect(() => new User({ name: "Ana", email: "ana@petcare", passwordHash: "hash" })).toThrow(
      new ValidationError(messages.invalidEmail),
    );
  });
});

describe("Password", () => {
  test("requires at least 8 characters", () => {
    expect(() => new Password("")).toThrow(new ValidationError(messages.requiredFields));
    expect(() => new Password("1234567")).toThrow(new ValidationError(messages.shortPassword));
    expect(new Password("12345678").value).toBe("12345678");
  });
});

describe("Session", () => {
  test("expires in seven days", () => {
    const now = new Date("2026-10-21T12:00:00Z");

    const session = new Session("token", "user-1", now);

    expect(session.expiresAt.toISOString()).toBe("2026-10-28T12:00:00.000Z");
  });
});

describe("Pet", () => {
  test("applies defaults and hides the owner in JSON", () => {
    expect(rex.vaccine).toBe("");
    expect(rex.icon).toBe("🐾");
    expect(rex.description).toBe("");
    expect(rex.ownerId).toBe("user-1");
    expect(JSON.parse(JSON.stringify(rex))).not.toHaveProperty("ownerId");
  });

  test("rejects missing fields and invalid vaccine dates", () => {
    expect(() => new Pet({ ownerId: "user-1", name: "Rex", type: "", breed: "SRD", age: "3", weight: "12" })).toThrow(
      new ValidationError(messages.requiredFields),
    );
    expect(() =>
      new Pet({ ownerId: "user-1", name: "Rex", type: "Cão", breed: "SRD", age: "3", weight: "12", vaccine: "2026-02-30" }),
    ).toThrow(new ValidationError(messages.invalidVaccineDate));
  });
});

describe("Appointment", () => {
  test("is created pending, linked to the pet", () => {
    const appointment = new Appointment(appointmentData);

    expect(appointment.toJSON()).toEqual({
      id: appointment.id,
      petId: rex.id,
      pet: "Rex",
      title: "Vacina",
      category: "Saúde",
      date: "2026-11-10",
      time: "09:30",
      notes: "",
      completed: false,
    });
  });

  test("rejects invalid data loaded from storage", () => {
    expect(() => new Appointment({ ...appointmentData, id: "appointment-1", title: "  " })).toThrow(
      new ValidationError(messages.requiredFields),
    );
  });

  test("rejects invalid dates and times", () => {
    expect(() => new Appointment({ ...appointmentData, date: "10/11/2026" })).toThrow(
      new ValidationError(messages.invalidDate),
    );
    expect(() => new Appointment({ ...appointmentData, time: "25:00" })).toThrow(
      new ValidationError(messages.invalidTime),
    );
  });

  test("updates only the given fields", () => {
    const appointment = new Appointment(appointmentData);
    const mimi = new Pet({ ownerId: "user-1", name: "Mimi", type: "Gato", breed: "SRD", age: "2", weight: "4" });

    appointment.update({ completed: true, pet: mimi });

    expect(appointment.completed).toBe(true);
    expect(appointment.petId).toBe(mimi.id);
    expect(appointment.petName).toBe("Mimi");
    expect(appointment.title).toBe("Vacina");
  });

  test("keeps its state when an update is invalid", () => {
    const appointment = new Appointment(appointmentData);

    expect(() => appointment.update({ title: " ", completed: true })).toThrow(
      new ValidationError(messages.requiredFields),
    );
    expect(appointment.title).toBe("Vacina");
    expect(appointment.completed).toBe(false);
  });
});
