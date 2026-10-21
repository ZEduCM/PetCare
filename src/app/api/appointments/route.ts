import { adaptRoute } from "@/main/adapters/next-route-adapter";
import {
  makeCreateAppointmentController,
  makeDeleteAppointmentController,
  makeListAppointmentsController,
  makeUpdateAppointmentController,
} from "@/main/factories/appointments";

export const GET = adaptRoute(makeListAppointmentsController());
export const POST = adaptRoute(makeCreateAppointmentController());
export const PUT = adaptRoute(makeUpdateAppointmentController());
export const DELETE = adaptRoute(makeDeleteAppointmentController());
