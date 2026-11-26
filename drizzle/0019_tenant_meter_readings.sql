CREATE TABLE "meter_reading_submission" (
	"id" text PRIMARY KEY NOT NULL,
	"landlord_id" text NOT NULL,
	"unit_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"reading" numeric(14, 3) NOT NULL,
	"reading_date" text NOT NULL,
	"note" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"reviewed_at" timestamp,
	"electricity_bill_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "property" ADD COLUMN "electricity_rate" real;--> statement-breakpoint
ALTER TABLE "meter_reading_submission" ADD CONSTRAINT "meter_reading_submission_landlord_id_landlord_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlord"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_reading_submission" ADD CONSTRAINT "meter_reading_submission_unit_id_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."unit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_reading_submission" ADD CONSTRAINT "meter_reading_submission_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_reading_submission" ADD CONSTRAINT "meter_reading_submission_electricity_bill_id_electricity_bill_id_fk" FOREIGN KEY ("electricity_bill_id") REFERENCES "public"."electricity_bill"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meter_reading_landlord_status_idx" ON "meter_reading_submission" USING btree ("landlord_id","status");--> statement-breakpoint
CREATE INDEX "meter_reading_unit_id_idx" ON "meter_reading_submission" USING btree ("unit_id");