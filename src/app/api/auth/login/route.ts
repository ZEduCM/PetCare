import { adaptRoute } from "@/main/adapters/next-route-adapter";
import { makeLoginController } from "@/main/factories/auth";

export const POST = adaptRoute(makeLoginController());
