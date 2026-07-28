import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  console.warn("DATABASE_URL is not configured. Database-backed features will be unavailable.");
}

export const db = drizzle(process.env.DATABASE_URL ?? "postgresql://demo:demo@localhost:5432/bhada", {
  schema,
});
