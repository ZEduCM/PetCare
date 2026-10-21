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

describe("User", { tags: ["RF-01"] }, () => {
  test("mantém o id informado e gera um quando falta", () => {
    const data = { name: "Ana", email: "ana@petcare.com", passwordHash: "hash" };

    expect(new User({ ...data, id: "user-1" }).id).toBe("user-1");
    expect(new User(data).id).not.toBe(new User(data).id);
  });

  test("normaliza nome e e-mail e esconde o hash da senha no JSON", () => {
    const user = new User({ name: " Ana ", email: " Ana@PetCare.com ", passwordHash: "hash" });

    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.name).toBe("Ana");
    expect(user.email).toBe("ana@petcare.com");
    expect(user.passwordHash).toBe("hash");
    expect(JSON.parse(JSON.stringify(user))).toEqual({ id: user.id, name: "Ana", email: "ana@petcare.com" });
  });

  test("recusa campos ausentes e e-mails inválidos", () => {
    expect(() => new User({ name: "", email: "ana@petcare.com", passwordHash: "hash" })).toThrow(
      new ValidationError(messages.requiredFields),
    );
    expect(() => new User({ name: "Ana", email: "ana@petcare", passwordHash: "hash" })).toThrow(
      new ValidationError(messages.invalidEmail),
    );
  });
});

describe("Password", { tags: ["RF-01", "RF-04"] }, () => {
  test("exige pelo menos 8 caracteres", () => {
    expect(() => new Password("")).toThrow(new ValidationError(messages.requiredFields));
    expect(() => new Password("1234567")).toThrow(new ValidationError(messages.shortPassword));
    expect(new Password("12345678").value).toBe("12345678");
  });
});

describe("Session", { tags: ["RF-01"] }, () => {
  test("expira em sete dias", () => {
    const now = new Date("2026-10-21T12:00:00Z");

    const session = new Session("token", "user-1", now);

    expect(session.expiresAt.toISOString()).toBe("2026-10-28T12:00:00.000Z");
  });
});

describe("Pet", { tags: ["RF-02", "RF-04"] }, () => {
  test("aplica os valores padrão e esconde o dono no JSON", () => {
    expect(rex.vaccine).toBe("");
    expect(rex.icon).toBe("🐾");
    expect(rex.description).toBe("");
    expect(rex.ownerId).toBe("user-1");
    expect(JSON.parse(JSON.stringify(rex))).not.toHaveProperty("ownerId");
  });

  test("recusa campos ausentes e datas de vacina inválidas", () => {
    expect(() => new Pet({ ownerId: "user-1", name: "Rex", type: "", breed: "SRD", age: "3", weight: "12" })).toThrow(
      new ValidationError(messages.requiredFields),
    );
    expect(() =>
      new Pet({ ownerId: "user-1", name: "Rex", type: "Cão", breed: "SRD", age: "3", weight: "12", vaccine: "2026-02-30" }),
    ).toThrow(new ValidationError(messages.invalidVaccineDate));
  });
});

describe("Appointment", { tags: ["RF-03", "RF-04"] }, () => {
  test("nasce pendente e ligado ao pet", () => {
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

  test("recusa dados inválidos lidos do banco", () => {
    expect(() => new Appointment({ ...appointmentData, id: "appointment-1", title: "  " })).toThrow(
      new ValidationError(messages.requiredFields),
    );
  });

  test("recusa datas e horários inválidos", () => {
    expect(() => new Appointment({ ...appointmentData, date: "10/11/2026" })).toThrow(
      new ValidationError(messages.invalidDate),
    );
    expect(() => new Appointment({ ...appointmentData, time: "25:00" })).toThrow(
      new ValidationError(messages.invalidTime),
    );
  });

  test("altera só os campos informados", () => {
    const appointment = new Appointment(appointmentData);
    const mimi = new Pet({ ownerId: "user-1", name: "Mimi", type: "Gato", breed: "SRD", age: "2", weight: "4" });

    appointment.update({ completed: true, pet: mimi });

    expect(appointment.completed).toBe(true);
    expect(appointment.petId).toBe(mimi.id);
    expect(appointment.petName).toBe("Mimi");
    expect(appointment.title).toBe("Vacina");
  });

  test("mantém o estado quando a alteração é inválida", () => {
    const appointment = new Appointment(appointmentData);

    expect(() => appointment.update({ title: " ", completed: true })).toThrow(
      new ValidationError(messages.requiredFields),
    );
    expect(appointment.title).toBe("Vacina");
    expect(appointment.completed).toBe(false);
  });
});
