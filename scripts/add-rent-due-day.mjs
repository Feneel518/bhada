import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

const sql = neon(process.env.DATABASE_URL);

await sql`
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tenant'
        AND column_name = 'rent_due_day'
    ) THEN
      ALTER TABLE "tenant"
        ADD COLUMN "rent_due_day" integer DEFAULT 1 NOT NULL;

      UPDATE "tenant"
      SET "rent_due_day" = "rent_billing_day";
    END IF;
  END
  $$;
`;

console.log("Rent due-day schema is ready.");
