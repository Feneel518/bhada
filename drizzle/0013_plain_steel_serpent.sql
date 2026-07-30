ALTER TABLE "landlord" ADD COLUMN "plan" text DEFAULT 'one_door' NOT NULL;--> statement-breakpoint
ALTER TABLE "landlord" ADD COLUMN "subscription_status" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "landlord" ADD COLUMN "razorpay_subscription_id" text;--> statement-breakpoint
ALTER TABLE "landlord" ADD COLUMN "subscription_current_period_end" timestamp;--> statement-breakpoint
ALTER TABLE "landlord" ADD CONSTRAINT "landlord_razorpay_subscription_id_unique" UNIQUE("razorpay_subscription_id");