CREATE TYPE "public"."unit_status" AS ENUM('vacant', 'occupied', 'maintenance');
--> statement-breakpoint
INSERT INTO "landlord" ("id", "user_id", "business_name")
SELECT 'landlord_' || "user"."id", "user"."id", "user"."name"
FROM "user"
WHERE NOT EXISTS (
  SELECT 1 FROM "landlord" WHERE "landlord"."user_id" = "user"."id"
);
--> statement-breakpoint
ALTER TABLE "property" DROP CONSTRAINT "property_owner_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "property" RENAME COLUMN "owner_id" TO "landlord_id";
--> statement-breakpoint
UPDATE "property"
SET "landlord_id" = "landlord"."id"
FROM "landlord"
WHERE "landlord"."user_id" = "property"."landlord_id";
--> statement-breakpoint
ALTER TABLE "property" ALTER COLUMN "address" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "property" ALTER COLUMN "city" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "property" ADD CONSTRAINT "property_landlord_id_landlord_id_fk"
FOREIGN KEY ("landlord_id") REFERENCES "public"."landlord"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "property_landlord_id_idx" ON "property" USING btree ("landlord_id");
--> statement-breakpoint
ALTER TABLE "unit" RENAME COLUMN "label" TO "unit_number";
--> statement-breakpoint
ALTER TABLE "unit" ADD COLUMN "landlord_id" text;
--> statement-breakpoint
ALTER TABLE "unit" ADD COLUMN "floor" text;
--> statement-breakpoint
ALTER TABLE "unit" ADD COLUMN "area_sqft" real;
--> statement-breakpoint
ALTER TABLE "unit" ADD COLUMN "status" "unit_status" DEFAULT 'vacant' NOT NULL;
--> statement-breakpoint
ALTER TABLE "unit" ADD COLUMN "last_meter_reading" real;
--> statement-breakpoint
ALTER TABLE "unit" ADD COLUMN "last_meter_reading_date" timestamp;
--> statement-breakpoint
ALTER TABLE "unit" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
UPDATE "unit"
SET "landlord_id" = "property"."landlord_id"
FROM "property"
WHERE "property"."id" = "unit"."property_id";
--> statement-breakpoint
ALTER TABLE "unit" ALTER COLUMN "landlord_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "unit" ADD CONSTRAINT "unit_landlord_id_landlord_id_fk"
FOREIGN KEY ("landlord_id") REFERENCES "public"."landlord"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "unit" DROP COLUMN "bedrooms";
--> statement-breakpoint
ALTER TABLE "unit" DROP COLUMN "bathrooms";
--> statement-breakpoint
ALTER TABLE "unit" DROP COLUMN "monthly_rent";
--> statement-breakpoint
CREATE UNIQUE INDEX "unit_property_id_unit_number_unique" ON "unit" USING btree ("property_id", "unit_number");
--> statement-breakpoint
CREATE INDEX "unit_landlord_id_idx" ON "unit" USING btree ("landlord_id");
--> statement-breakpoint
CREATE INDEX "unit_property_id_idx" ON "unit" USING btree ("property_id");
