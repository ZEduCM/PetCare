import { AuthenticatedController } from "@/controllers/authenticated-controller";
import { LoginController } from "@/controllers/auth/login-controller";
import { LogoutController } from "@/controllers/auth/logout-controller";
import { RegisterController } from "@/controllers/auth/register-controller";
import type { AuthenticatedRequest, Controller } from "@/controllers/http";
import { ScryptPasswordHasher } from "@/lib/password";
import { RandomTokenGenerator } from "@/lib/token";
import { Authenticate } from "@/usecases/auth/authenticate";
import { Login } from "@/usecases/auth/login";
import { Logout } from "@/usecases/auth/logout";
import { RegisterUser } from "@/usecases/auth/register-user";
import { EmailValidator } from "@/validators/email-validator";
import { MinLengthValidator } from "@/validators/min-length-validator";
import { RequiredFieldsValidator } from "@/validators/required-fields-validator";
import { ValidatorComposite } from "@/validators/validator-composite";
import { makeSessionRepository, makeUserRepository } from "./repositories";

export const makeAuthenticate = () => new Authenticate(makeSessionRepository());

export const withAuthentication = (
  controller: Controller<AuthenticatedRequest>,
) => new AuthenticatedController(makeAuthenticate(), controller);

export const makeRegisterController = () =>
  new RegisterController(
    new ValidatorComposite([
      new RequiredFieldsValidator(
        ["name", "email", "password"],
        "Preencha todos os campos obrigatórios.",
      ),
      new EmailValidator("email"),
      new MinLengthValidator(
        "password",
        8,
        "A senha deve ter pelo menos 8 caracteres.",
      ),
    ]),
    new RegisterUser(makeUserRepository(), new ScryptPasswordHasher()),
  );

export const makeLoginController = () =>
  new LoginController(
    new RequiredFieldsValidator(
      ["email", "password"],
      "Informe e-mail e senha para continuar.",
    ),
    new Login(
      makeUserRepository(),
      makeSessionRepository(),
      new ScryptPasswordHasher(),
      new RandomTokenGenerator(),
    ),
  );

export const makeLogoutController = () =>
  new LogoutController(new Logout(makeSessionRepository()));
