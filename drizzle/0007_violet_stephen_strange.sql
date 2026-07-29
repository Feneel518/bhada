ALTER TABLE "electricity_bill" ADD COLUMN "previous_reading" numeric(14, 3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "electricity_bill" ADD COLUMN "current_reading" numeric(14, 3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "electricity_bill" ADD COLUMN "units_consumed" numeric(14, 3) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "electricity_bill" ADD COLUMN "unit_rate" numeric(12, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "opening_balance" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "unit" ADD COLUMN "opening_meter_reading" real;--> statement-breakpoint
ALTER TABLE "unit" ADD COLUMN "opening_meter_reading_date" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX "electricity_bill_unit_period_unique" ON "electricity_bill" USING btree ("unit_id","billing_period");