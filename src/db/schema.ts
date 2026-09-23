import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

export const sourceTypeValues = ["google_news", "rss"] as const;
export type SourceType = (typeof sourceTypeValues)[number];

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  type: varchar("type", { length: 20 }).$type<SourceType>(),
  query: text("query"),
  rssUrl: text("rss_url"),
  language: varchar("language", { length: 10 }).notNull().default("fr"),
  country: varchar("country", { length: 10 }).notNull().default("FR"),
  lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subcategories = pgTable("subcategories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export interface DailySummaryChapter {
  label: string;
  text: string;
}

export const dailySummaries = pgTable(
  "daily_summaries",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    articleCount: integer("article_count").notNull().default(0),
    globalSummary: text("global_summary").notNull().default(""),
    chapters: jsonb("chapters").$type<DailySummaryChapter[]>().notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.categoryId, table.date)]
);

export const articleStatusValues = [
  "discovered",
  "fetching",
  "extracted",
  "summarizing",
  "ready",
  "failed",
  "irrelevant",
] as const;
export type ArticleStatus = (typeof articleStatusValues)[number];

export const summarySourceValues = ["full_text", "rss_excerpt"] as const;
export type SummarySource = (typeof summarySourceValues)[number];

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  source: varchar("source", { length: 200 }),
  feedUrl: text("feed_url"),
  originalUrl: text("original_url"),
  description: text("description"),
  content: text("content"),
  summary: text("summary"),
  summarySource: varchar("summary_source", {
    length: 20,
  }).$type<SummarySource>(),
  categoryId: integer("category_id").references(() => categories.id),
  subcategoryId: integer("subcategory_id").references(() => subcategories.id, {
    onDelete: "set null",
  }),
  imageUrl: text("image_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }),
  summarizedAt: timestamp("summarized_at", { withTimezone: true }),
  status: varchar("status", { length: 20 })
    .notNull()
    .default("discovered")
    .$type<ArticleStatus>(),
  contentHash: varchar("content_hash", { length: 64 }).unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
