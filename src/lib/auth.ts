import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  appName: "Bhada",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  // A transient secret keeps demo builds healthy without shipping a known fallback.
  // Production authentication requires BETTER_AUTH_SECRET for stable sessions.
  secret: process.env.BETTER_AUTH_SECRET ?? crypto.randomUUID(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});
