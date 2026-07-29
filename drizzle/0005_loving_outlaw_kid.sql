CREATE TYPE "public"."rent_bill_status" AS ENUM('pending', 'paid', 'overdue');--> statement-breakpoint
CREATE TABLE "rent_bill" (
	"id" text PRIMARY KEY NOT NULL,
	"landlord_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"bill_number" text NOT NULL,
	"billing_period" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" "rent_bill_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "rent_billing_day" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "rent_bill" ADD CONSTRAINT "rent_bill_landlord_id_landlord_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlord"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rent_bill" ADD CONSTRAINT "rent_bill_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rent_bill_tenant_period_unique" ON "rent_bill" USING btree ("tenant_id","billing_period");--> statement-breakpoint
CREATE UNIQUE INDEX "rent_bill_landlord_number_unique" ON "rent_bill" USING btree ("landlord_id","bill_number");--> statement-breakpoint
CREATE INDEX "rent_bill_landlord_id_idx" ON "rent_bill" USING btree ("landlord_id");--> statement-breakpoint
CREATE INDEX "rent_bill_tenant_id_idx" ON "rent_bill" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "rent_bill_due_date_idx" ON "rent_bill" USING btree ("due_date");