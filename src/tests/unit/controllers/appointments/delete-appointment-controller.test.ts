import { describe, expect, test, vi } from "vitest";
import { z } from "zod";
import { DeleteAppointmentController } from "@/controllers/appointments/delete-appointment-controller";
import { User } from "@/entities";
import { messages } from "@/messages";
import { ValidationError } from "@/validators/validation-error";
import { ZodValidator } from "@/validators/zod-validator";

const ana = new User({ name: "Ana", email: "ana@petcare.com", passwordHash: "hash" });

describe("DeleteAppointmentController", { tags: ["RF-03", "RF-05"] }, () => {
  test("recusa id inválido antes de chamar o caso de uso", async () => {
    const deleteAppointment = { execute: vi.fn() };
    const controller = new DeleteAppointmentController(
      new ZodValidator(z.object({ id: z.uuid({ error: messages.invalidId }) })),
      deleteAppointment,
    );

    await expect(controller.handle({ body: {}, query: { id: "123" }, user: ana })).rejects.toThrow(
      new ValidationError(messages.invalidId),
    );
    expect(deleteAppointment.execute).not.toHaveBeenCalled();
  });
});
