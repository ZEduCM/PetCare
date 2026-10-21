import { CreatePetController } from "@/controllers/pets/create-pet-controller";
import { ListPetsController } from "@/controllers/pets/list-pets-controller";
import { CreatePet } from "@/usecases/pets/create-pet";
import { GetPet } from "@/usecases/pets/get-pet";
import { ListPets } from "@/usecases/pets/list-pets";
import { DateValidator } from "@/validators/date-validator";
import { RequiredFieldsValidator } from "@/validators/required-fields-validator";
import { ValidatorComposite } from "@/validators/validator-composite";
import { withAuthentication } from "./auth";
import { makePetRepository } from "./repositories";

export const makeGetPet = () => new GetPet(makePetRepository());

export const makeListPetsController = () =>
  withAuthentication(new ListPetsController(new ListPets(makePetRepository())));

export const makeCreatePetController = () =>
  withAuthentication(
    new CreatePetController(
      new ValidatorComposite([
        new RequiredFieldsValidator(
          ["name", "type", "breed", "age", "weight"],
          "Preencha os campos obrigatórios.",
        ),
        new DateValidator("vaccine", "Informe uma data de vacina válida."),
      ]),
      new CreatePet(makePetRepository()),
    ),
  );
