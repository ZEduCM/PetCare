import { adaptRoute } from "@/main/adapters/next-route-adapter";
import { makeLogoutController } from "@/main/factories/auth";

export const POST = adaptRoute(makeLogoutController());
