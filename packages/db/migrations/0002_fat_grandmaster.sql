ALTER TABLE "refresh_tokens" ADD COLUMN "family_id" text;--> statement-breakpoint
UPDATE "refresh_tokens" SET "family_id" = "token_id" WHERE "family_id" IS NULL;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "rotated_to" text;--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_family_id" ON "refresh_tokens" USING btree ("family_id");