import { z } from "zod";
import { CreateAppointmentController } from "@/controllers/appointments/create-appointment-controller";
import { DeleteAppointmentController } from "@/controllers/appointments/delete-appointment-controller";
import { ListAppointmentsController } from "@/controllers/appointments/list-appointments-controller";
import { UpdateAppointmentController } from "@/controllers/appointments/update-appointment-controller";
import { messages } from "@/messages";
import { CreateAppointment } from "@/usecases/appointments/create-appointment";
import { DeleteAppointment } from "@/usecases/appointments/delete-appointment";
import { ListAppointments } from "@/usecases/appointments/list-appointments";
import { UpdateAppointment } from "@/usecases/appointments/update-appointment";
import { requiredText } from "@/validators/fields";
import { ZodValidator } from "@/validators/zod-validator";
import { withAuthentication } from "./auth";
import { makeAppointmentRepository, makePetRepository } from "./repositories";

const makeIdValidator = () =>
  new ZodValidator(z.object({ id: z.uuid({ error: messages.invalidId }) }));

export const makeListAppointmentsController = () =>
  withAuthentication(
    new ListAppointmentsController(
      new ListAppointments(makeAppointmentRepository()),
    ),
  );

export const makeCreateAppointmentController = () =>
  withAuthentication(
    new CreateAppointmentController(
      new ZodValidator(
        z.object({ petId: requiredText(messages.requiredFields) }),
      ),
      new CreateAppointment(makeAppointmentRepository(), makePetRepository()),
    ),
  );

export const makeUpdateAppointmentController = () =>
  withAuthentication(
    new UpdateAppointmentController(
      makeIdValidator(),
      new UpdateAppointment(makeAppointmentRepository(), makePetRepository()),
    ),
  );

export const makeDeleteAppointmentController = () =>
  withAuthentication(
    new DeleteAppointmentController(
      makeIdValidator(),
      new DeleteAppointment(makeAppointmentRepository()),
    ),
  );
