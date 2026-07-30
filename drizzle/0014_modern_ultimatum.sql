CREATE TABLE "saas_billing_event" (
	"id" text PRIMARY KEY NOT NULL,
	"landlord_id" text,
	"provider" text DEFAULT 'razorpay' NOT NULL,
	"event_type" text NOT NULL,
	"subscription_id" text,
	"amount_paise" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text,
	"occurred_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saas_billing_event" ADD CONSTRAINT "saas_billing_event_landlord_id_landlord_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlord"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saas_billing_event_landlord_id_idx" ON "saas_billing_event" USING btree ("landlord_id");--> statement-breakpoint
CREATE INDEX "saas_billing_event_occurred_at_idx" ON "saas_billing_event" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "saas_billing_event_event_type_idx" ON "saas_billing_event" USING btree ("event_type");