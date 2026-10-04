ALTER TABLE "applications" ADD COLUMN "stage" text DEFAULT 'not_applied' NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "stage_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "applied_at" timestamp with time zone;