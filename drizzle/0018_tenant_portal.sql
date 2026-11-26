CREATE TABLE "payment_claim" (
	"id" text PRIMARY KEY NOT NULL,
	"landlord_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"paid_on" timestamp NOT NULL,
	"method" text NOT NULL,
	"reference" text,
	"note" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"reviewed_at" timestamp,
	"payment_receipt_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant" ADD COLUMN "portal_token" text DEFAULT replace(gen_random_uuid()::text, '-', '') NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_claim" ADD CONSTRAINT "payment_claim_landlord_id_landlord_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlord"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_claim" ADD CONSTRAINT "payment_claim_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_claim" ADD CONSTRAINT "payment_claim_payment_receipt_id_payment_receipt_id_fk" FOREIGN KEY ("payment_receipt_id") REFERENCES "public"."payment_receipt"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_claim_landlord_status_idx" ON "payment_claim" USING btree ("landlord_id","status");--> statement-breakpoint
CREATE INDEX "payment_claim_tenant_id_idx" ON "payment_claim" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_portal_token_unique" UNIQUE("portal_token");