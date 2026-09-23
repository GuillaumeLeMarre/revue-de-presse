CREATE TABLE "daily_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"date" date NOT NULL,
	"article_count" integer DEFAULT 0 NOT NULL,
	"chapters" jsonb NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_summaries_category_id_date_unique" UNIQUE("category_id","date")
);
--> statement-breakpoint
ALTER TABLE "daily_summaries" ADD CONSTRAINT "daily_summaries_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;