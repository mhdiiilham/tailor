CREATE TABLE "hn_posts" (
	"id" integer PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"author" text NOT NULL,
	"posted_at" timestamp with time zone NOT NULL,
	"text" text NOT NULL,
	"job" jsonb,
	"parsed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "hn_threads" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"posted_at" timestamp with time zone NOT NULL,
	"checked_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "hn_posts" ADD CONSTRAINT "hn_posts_thread_id_hn_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."hn_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hn_posts_thread_posted_idx" ON "hn_posts" USING btree ("thread_id","posted_at");