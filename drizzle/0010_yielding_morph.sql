ALTER TABLE "tenant" ADD COLUMN "rent_due_day" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
UPDATE "tenant" SET "rent_due_day" = "rent_billing_day";
