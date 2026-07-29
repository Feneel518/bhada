CREATE TYPE "public"."receipt_allocation_mode" AS ENUM('lump_sum', 'bill_wise');--> statement-breakpoint
CREATE TYPE "public"."receipt_charge_type" AS ENUM('rent', 'light_bill', 'other');--> statement-breakpoint
CREATE TABLE "payment_allocation" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_receipt_id" text NOT NULL,
	"charge_type" "receipt_charge_type" NOT NULL,
	"description" text,
	"bill_reference" text,
	"amount_before_gst" numeric(12, 2) NOT NULL,
	"gst_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"gst_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_receipt" (
	"id" text PRIMARY KEY NOT NULL,
	"landlord_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"receipt_number" text NOT NULL,
	"allocation_mode" "receipt_allocation_mode" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"paid_at" timestamp NOT NULL,
	"method" "payment_method" NOT NULL,
	"reference" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_payment_receipt_id_payment_receipt_id_fk" FOREIGN KEY ("payment_receipt_id") REFERENCES "public"."payment_receipt"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_receipt" ADD CONSTRAINT "payment_receipt_landlord_id_landlord_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlord"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_receipt" ADD CONSTRAINT "payment_receipt_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_allocation_receipt_id_idx" ON "payment_allocation" USING btree ("payment_receipt_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_receipt_landlord_number_unique" ON "payment_receipt" USING btree ("landlord_id","receipt_number");--> statement-breakpoint
CREATE INDEX "payment_receipt_landlord_id_idx" ON "payment_receipt" USING btree ("landlord_id");--> statement-breakpoint
CREATE INDEX "payment_receipt_tenant_id_idx" ON "payment_receipt" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "payment_receipt_paid_at_idx" ON "payment_receipt" USING btree ("paid_at");