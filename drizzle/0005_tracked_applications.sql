ALTER TABLE "applications" ALTER COLUMN "fit" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "job_url" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "notes" text;