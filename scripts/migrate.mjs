// Runs before `next build` so a deploy never ships code that expects columns
// the database doesn't have yet. Every statement is safe to run again, so it
// works whether the database was set up with `drizzle-kit migrate` or
// `drizzle-kit push`, and it can run on every build.
//
// - No DATABASE_URL locally: skipped.
// - No DATABASE_URL on a Vercel production build: fails the build, so the
//   currently live version keeps running instead of a broken one.
// - Any SQL error: fails the build for the same reason.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const statements = [
  // 0017: UPI, morning summary email, billing interval
  `ALTER TABLE "landlord" ADD COLUMN IF NOT EXISTS "billing_interval" text`,
  `ALTER TABLE "landlord" ADD COLUMN IF NOT EXISTS "upi_id" text`,
  `ALTER TABLE "landlord" ADD COLUMN IF NOT EXISTS "daily_summary_email" boolean DEFAULT true NOT NULL`,
  `ALTER TABLE "landlord" ADD COLUMN IF NOT EXISTS "last_summary_email_at" timestamp`,

  // 0018: tenant private links + payment claims
  `CREATE TABLE IF NOT EXISTS "payment_claim" (
    "id" text PRIMARY KEY NOT NULL,
    "landlord_id" text NOT NULL CONSTRAINT "payment_claim_landlord_id_landlord_id_fk" REFERENCES "landlord"("id") ON DELETE cascade,
    "tenant_id" text NOT NULL CONSTRAINT "payment_claim_tenant_id_tenant_id_fk" REFERENCES "tenant"("id") ON DELETE cascade,
    "amount" numeric(12, 2) NOT NULL,
    "paid_on" timestamp NOT NULL,
    "method" text NOT NULL,
    "reference" text,
    "note" text,
    "status" text DEFAULT 'pending' NOT NULL,
    "review_note" text,
    "reviewed_at" timestamp,
    "payment_receipt_id" text CONSTRAINT "payment_claim_payment_receipt_id_payment_receipt_id_fk" REFERENCES "payment_receipt"("id") ON DELETE set null,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "payment_claim_landlord_status_idx" ON "payment_claim" USING btree ("landlord_id","status")`,
  `CREATE INDEX IF NOT EXISTS "payment_claim_tenant_id_idx" ON "payment_claim" USING btree ("tenant_id")`,
  // A volatile default gives every existing tenant their own random token.
  `ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "portal_token" text DEFAULT replace(gen_random_uuid()::text, '-', '') NOT NULL`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_portal_token_unique') THEN
      ALTER TABLE "tenant" ADD CONSTRAINT "tenant_portal_token_unique" UNIQUE ("portal_token");
    END IF;
  END $$`,

  // 0019: property electricity rate + tenant meter readings
  `ALTER TABLE "property" ADD COLUMN IF NOT EXISTS "electricity_rate" real`,
  `CREATE TABLE IF NOT EXISTS "meter_reading_submission" (
    "id" text PRIMARY KEY NOT NULL,
    "landlord_id" text NOT NULL CONSTRAINT "meter_reading_submission_landlord_id_landlord_id_fk" REFERENCES "landlord"("id") ON DELETE cascade,
    "unit_id" text NOT NULL CONSTRAINT "meter_reading_submission_unit_id_unit_id_fk" REFERENCES "unit"("id") ON DELETE cascade,
    "tenant_id" text NOT NULL CONSTRAINT "meter_reading_submission_tenant_id_tenant_id_fk" REFERENCES "tenant"("id") ON DELETE cascade,
    "reading" numeric(14, 3) NOT NULL,
    "reading_date" text NOT NULL,
    "note" text,
    "status" text DEFAULT 'pending' NOT NULL,
    "review_note" text,
    "reviewed_at" timestamp,
    "electricity_bill_id" text CONSTRAINT "meter_reading_submission_electricity_bill_id_electricity_bill_i" REFERENCES "electricity_bill"("id") ON DELETE set null,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "meter_reading_landlord_status_idx" ON "meter_reading_submission" USING btree ("landlord_id","status")`,
  `CREATE INDEX IF NOT EXISTS "meter_reading_unit_id_idx" ON "meter_reading_submission" USING btree ("unit_id")`,
];

// Drizzle files these statements correspond to. If the database tracks
// drizzle-kit migrations, they're recorded as applied so a later
// `drizzle-kit migrate` doesn't try to run them again.
const drizzleTags = ["0017_plans_upi_and_summary", "0018_tenant_portal", "0019_tenant_meter_readings"];

export function drizzleRecords(root = process.cwd()) {
  const journal = JSON.parse(readFileSync(resolve(root, "drizzle/meta/_journal.json"), "utf8"));
  return drizzleTags.map((tag) => {
    const entry = journal.entries.find((item) => item.tag === tag);
    if (!entry) throw new Error(`Missing drizzle journal entry ${tag}`);
    const sql = readFileSync(resolve(root, `drizzle/${tag}.sql`), "utf8");
    return { tag, hash: createHash("sha256").update(sql).digest("hex"), createdAt: entry.when };
  });
}

export const recordStatements = (records) => [
  `DO $$ BEGIN
    IF to_regclass('drizzle.__drizzle_migrations') IS NOT NULL THEN
      ${records.map((record) => `
      INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at")
        SELECT '${record.hash}', ${record.createdAt}
        WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE "created_at" = ${record.createdAt});`).join("")}
    END IF;
  END $$`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (process.env.VERCEL_ENV === "production") {
      console.error("[migrate] DATABASE_URL is not available during the production build. Add it to the Vercel project's Production environment. Stopping so the live site isn't replaced by a version that needs new columns.");
      process.exit(1);
    }
    console.log("[migrate] No DATABASE_URL, skipping database migration.");
    return;
  }

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);
  const all = [...statements, ...recordStatements(drizzleRecords())];
  for (const statement of all) {
    await sql.query(statement);
  }
  console.log(`[migrate] Database is up to date (${all.length} idempotent statements).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error("[migrate] Migration failed; stopping the build so the live site keeps running.", error);
    process.exit(1);
  });
}
