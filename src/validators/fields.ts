import { z } from "zod";

export const requiredText = (message: string) =>
  z.string({ error: message }).trim().min(1, message);
