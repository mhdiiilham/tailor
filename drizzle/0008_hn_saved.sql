CREATE TABLE "hn_saved" (
	"user_id" text NOT NULL,
	"post_id" integer NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hn_saved_user_id_post_id_pk" PRIMARY KEY("user_id","post_id")
);
--> statement-breakpoint
ALTER TABLE "hn_saved" ADD CONSTRAINT "hn_saved_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hn_saved" ADD CONSTRAINT "hn_saved_post_id_hn_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."hn_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hn_saved_user_saved_idx" ON "hn_saved" USING btree ("user_id","saved_at");