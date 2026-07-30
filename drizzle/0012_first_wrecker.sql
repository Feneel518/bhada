CREATE TABLE "notification_read" (
	"id" text PRIMARY KEY NOT NULL,
	"landlord_id" text NOT NULL,
	"notification_key" text NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_read" ADD CONSTRAINT "notification_read_landlord_id_landlord_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlord"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_read_landlord_key_unique" ON "notification_read" USING btree ("landlord_id","notification_key");--> statement-breakpoint
CREATE INDEX "notification_read_landlord_id_idx" ON "notification_read" USING btree ("landlord_id");