import { describe, expect, test } from "vitest";
import { Appointment, Pet } from "@/entities";
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
