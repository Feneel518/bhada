import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  appName: "Bhada",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  // This keeps static/demo builds healthy. Always override it in a deployed environment.
  secret: process.env.BETTER_AUTH_SECRET ?? "bhada-local-demo-secret-change-before-production",
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
