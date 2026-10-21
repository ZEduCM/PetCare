import { CreateAppointmentController } from "@/controllers/appointments/create-appointment-controller";
import { DeleteAppointmentController } from "@/controllers/appointments/delete-appointment-controller";
import { ListAppointmentsController } from "@/controllers/appointments/list-appointments-controller";
import { UpdateAppointmentController } from "@/controllers/appointments/update-appointment-controller";
import { CreateAppointment } from "@/usecases/appointments/create-appointment";
import { DeleteAppointment } from "@/usecases/appointments/delete-appointment";
import { ListAppointments } from "@/usecases/appointments/list-appointments";
import { UpdateAppointment } from "@/usecases/appointments/update-appointment";
import { DateValidator } from "@/validators/date-validator";
import { NotBlankFieldsValidator } from "@/validators/not-blank-fields-validator";
import { RequiredFieldsValidator } from "@/validators/required-fields-validator";
import { TimeValidator } from "@/validators/time-validator";
import { UuidValidator } from "@/validators/uuid-validator";
import { ValidatorComposite } from "@/validators/validator-composite";
import { withAuthentication } from "./auth";
import { makeAppointmentRepository, makePetRepository } from "./repositories";

const REQUIRED_FIELDS = ["petId", "title", "category", "date", "time"];
const REQUIRED_MESSAGE = "Preencha todos os campos obrigatórios.";
const ID_MESSAGE = "Informe um id válido.";

const makeIdValidator = () =>
  new ValidatorComposite([
    new RequiredFieldsValidator(["id"], ID_MESSAGE),
    new UuidValidator("id", ID_MESSAGE),
  ]);

export const makeListAppointmentsController = () =>
  withAuthentication(
    new ListAppointmentsController(
      new ListAppointments(makeAppointmentRepository()),
    ),
  );

export const makeCreateAppointmentController = () =>
  withAuthentication(
    new CreateAppointmentController(
      new ValidatorComposite([
        new RequiredFieldsValidator(REQUIRED_FIELDS, REQUIRED_MESSAGE),
        new DateValidator("date"),
        new TimeValidator("time"),
      ]),
      new CreateAppointment(makeAppointmentRepository()),
    ),
  );

export const makeUpdateAppointmentController = () =>
  withAuthentication(
    new UpdateAppointmentController(
      new ValidatorComposite([
        makeIdValidator(),
        new NotBlankFieldsValidator(REQUIRED_FIELDS, REQUIRED_MESSAGE),
        new DateValidator("date"),
        new TimeValidator("time"),
      ]),
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
