import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const serverOnlyEnvSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
});

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

export function getServerOnlyEnv() {
  if (typeof window !== "undefined") {
    throw new Error("getServerOnlyEnv() must not be called from the browser");
  }
  return serverOnlyEnvSchema.parse({
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });
}
