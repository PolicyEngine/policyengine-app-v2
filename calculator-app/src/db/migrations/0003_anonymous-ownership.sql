DROP INDEX "reforms_user_country_idx";--> statement-breakpoint
DROP INDEX "reports_user_country_idx";--> statement-breakpoint
ALTER TABLE "reforms" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reforms" ADD COLUMN "edit_token_hash" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "edit_token_hash" text;--> statement-breakpoint
CREATE INDEX "reforms_created_at_idx" ON "reforms" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "reports_created_at_idx" ON "reports" USING btree ("created_at");