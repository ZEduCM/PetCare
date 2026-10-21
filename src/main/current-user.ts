import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { makeAuthenticate } from "./factories/auth";

export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? makeAuthenticate().execute({ token }) : null;
}
