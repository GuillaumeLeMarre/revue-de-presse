ALTER TABLE "categories" ADD COLUMN "type" varchar(20);--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "query" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "rss_url" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "language" varchar(10) DEFAULT 'fr' NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "country" varchar(10) DEFAULT 'FR' NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "last_fetched_at" timestamp with time zone;--> statement-breakpoint
UPDATE "categories" c
SET "type" = s."type",
    "query" = s."query",
    "rss_url" = s."rss_url",
    "language" = s."language",
    "country" = s."country",
    "last_fetched_at" = s."last_fetched_at"
FROM (
  SELECT DISTINCT ON (category_id) category_id, type, query, rss_url, language, country, last_fetched_at
  FROM "sources"
  WHERE category_id IS NOT NULL
  ORDER BY category_id, created_at ASC
) s
WHERE s.category_id = c.id;--> statement-breakpoint
ALTER TABLE "articles" DROP COLUMN "source_id";--> statement-breakpoint
DROP TABLE "sources" CASCADE;
