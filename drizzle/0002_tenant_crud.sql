ALTER TABLE "tenant" ADD COLUMN "unit_id" text;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "landlord_id" text;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "aadhaar_masked" text;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "pan_masked" text;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "gstin" text;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "emergency_contact" text;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "emergency_phone" text;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "lease_start" timestamp;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "lease_end" timestamp;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "security_deposit" real;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "lock_in_months" integer;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "notice_period_months" integer;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "rent_escalation_pct" real;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "rent_escalation_months" integer;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "next_escalation_date" timestamp;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "lease_doc_url" text;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "credit_balance" real DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
UPDATE "tenant"
SET "landlord_id" = "landlord"."id"
FROM "landlord"
WHERE "landlord"."user_id" = "tenant"."owner_id";
--> statement-breakpoint
UPDATE "tenant"
SET "unit_id" = (
  SELECT "lease"."unit_id"
  FROM "lease"
  WHERE "lease"."tenant_id" = "tenant"."id"
  ORDER BY
    CASE "lease"."status"
      WHEN 'active' THEN 0
      WHEN 'upcoming' THEN 1
      ELSE 2
    END,
    "lease"."created_at" DESC
  LIMIT 1
);
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "tenant"
    WHERE "landlord_id" IS NULL OR "unit_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot migrate tenant rows without an owning landlord and unit';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "tenant" ALTER COLUMN "unit_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "tenant" ALTER COLUMN "landlord_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "tenant" ALTER COLUMN "email" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_unit_id_unit_id_fk"
FOREIGN KEY ("unit_id") REFERENCES "public"."unit"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_landlord_id_landlord_id_fk"
FOREIGN KEY ("landlord_id") REFERENCES "public"."landlord"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "tenant_landlord_id_idx" ON "tenant" USING btree ("landlord_id");
--> statement-breakpoint
CREATE INDEX "tenant_unit_id_idx" ON "tenant" USING btree ("unit_id");
--> statement-breakpoint
ALTER TABLE "tenant" DROP COLUMN "owner_id";
