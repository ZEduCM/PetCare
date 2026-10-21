import { z } from "zod";
import { AuthenticatedController } from "@/controllers/authenticated-controller";
import { LoginController } from "@/controllers/auth/login-controller";
import { LogoutController } from "@/controllers/auth/logout-controller";
import { RegisterController } from "@/controllers/auth/register-controller";
import type { AuthenticatedRequest, Controller } from "@/controllers/http";
import { ScryptPasswordHasher } from "@/lib/password";
import { RandomTokenGenerator } from "@/lib/token";
import { messages } from "@/messages";
import { Authenticate } from "@/usecases/auth/authenticate";
import { Login } from "@/usecases/auth/login";
import { Logout } from "@/usecases/auth/logout";
import { RegisterUser } from "@/usecases/auth/register-user";
import { requiredText } from "@/validators/fields";
import { ZodValidator } from "@/validators/zod-validator";
import { makeSessionRepository, makeUserRepository } from "./repositories";

export const makeAuthenticate = () => new Authenticate(makeSessionRepository());

export const withAuthentication = (
  controller: Controller<AuthenticatedRequest>,
) => new AuthenticatedController(makeAuthenticate(), controller);

export const makeRegisterController = () =>
  new RegisterController(
    new RegisterUser(makeUserRepository(), new ScryptPasswordHasher()),
  );

export const makeLoginController = () =>
  new LoginController(
    new ZodValidator(
      z.object({
        email: requiredText(messages.missingCredentials),
        password: z
          .string({ error: messages.missingCredentials })
          .min(1, messages.missingCredentials),
      }),
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
