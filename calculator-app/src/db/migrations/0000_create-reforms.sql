CREATE TABLE "reforms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"country_id" text NOT NULL,
	"label" text,
	"policy_id" text,
	"parameters" jsonb NOT NULL,
	"baseline" text DEFAULT 'current-law' NOT NULL,
	"provenance" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "reforms_user_country_idx" ON "reforms" USING btree ("user_id","country_id");