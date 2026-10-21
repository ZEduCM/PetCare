import { adaptRoute } from "@/main/adapters/next-route-adapter";
import { makeRegisterController } from "@/main/factories/auth";

export const POST = adaptRoute(makeRegisterController());
