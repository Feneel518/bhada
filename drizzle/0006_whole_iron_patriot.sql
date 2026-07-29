CREATE TABLE "electricity_bill" (
	"id" text PRIMARY KEY NOT NULL,
	"landlord_id" text NOT NULL,
	"unit_id" text NOT NULL,
	"tenant_id" text,
	"bill_number" text NOT NULL,
	"billing_period" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"due_date" timestamp NOT NULL,
	"note" text,
	"status" "rent_bill_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "electricity_bill" ADD CONSTRAINT "electricity_bill_landlord_id_landlord_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlord"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_bill" ADD CONSTRAINT "electricity_bill_unit_id_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."unit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_bill" ADD CONSTRAINT "electricity_bill_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "electricity_bill_landlord_number_unique" ON "electricity_bill" USING btree ("landlord_id","bill_number");--> statement-breakpoint
CREATE INDEX "electricity_bill_landlord_id_idx" ON "electricity_bill" USING btree ("landlord_id");--> statement-breakpoint
CREATE INDEX "electricity_bill_unit_id_idx" ON "electricity_bill" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "electricity_bill_tenant_id_idx" ON "electricity_bill" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "electricity_bill_due_date_idx" ON "electricity_bill" USING btree ("due_date");