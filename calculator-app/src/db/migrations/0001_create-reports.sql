CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"country_id" text NOT NULL,
	"api_report_id" text NOT NULL,
	"title" text,
	"source_note" text,
	"provisions" jsonb NOT NULL,
	"reform_id" uuid,
	"year" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "reports_user_country_idx" ON "reports" USING btree ("user_id","country_id");