import { adaptRoute } from "@/main/adapters/next-route-adapter";
import {
  makeCreatePetController,
  makeListPetsController,
} from "@/main/factories/pets";

export const GET = adaptRoute(makeListPetsController());
export const POST = adaptRoute(makeCreatePetController());
