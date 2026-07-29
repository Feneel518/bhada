ALTER TABLE "rent_bill" ADD COLUMN "base_amount" numeric(12, 2);--> statement-breakpoint
UPDATE "rent_bill" SET "base_amount" = "amount";--> statement-breakpoint
ALTER TABLE "rent_bill" ALTER COLUMN "base_amount" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "rent_bill" ADD COLUMN "gst_rate" numeric(5, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "rent_bill" ADD COLUMN "gst_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "rent_bill" ADD COLUMN "tds_rate" numeric(5, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "rent_bill" ADD COLUMN "tds_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "gst_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "gst_rate" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "tds_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "tds_rate" real DEFAULT 0 NOT NULL;
