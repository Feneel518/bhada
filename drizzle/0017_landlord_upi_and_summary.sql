ALTER TABLE "landlord" ADD COLUMN "upi_id" text;--> statement-breakpoint
ALTER TABLE "landlord" ADD COLUMN "daily_summary_email" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "landlord" ADD COLUMN "last_summary_email_at" timestamp;