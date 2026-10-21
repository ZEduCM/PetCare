import { CreatePetController } from "@/controllers/pets/create-pet-controller";
import { ListPetsController } from "@/controllers/pets/list-pets-controller";
import { CreatePet } from "@/usecases/pets/create-pet";
import { GetPet } from "@/usecases/pets/get-pet";
import { ListPets } from "@/usecases/pets/list-pets";
import { withAuthentication } from "./auth";
import { makePetRepository } from "./repositories";

export const makeGetPet = () => new GetPet(makePetRepository());

export const makeListPetsController = () =>
  withAuthentication(new ListPetsController(new ListPets(makePetRepository())));

export const makeCreatePetController = () =>
  withAuthentication(new CreatePetController(new CreatePet(makePetRepository())));
