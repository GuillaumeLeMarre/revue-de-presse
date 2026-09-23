import { desc, eq, and, lt, gt, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  articles,
  categories,
  subcategories,
  dailySummaries,
  type DailySummaryChapter,
} from "@/db/schema";

const PAGE_SIZE = 20;

export interface ArticleCardData {
  id: number;
  title: string;
  source: string | null;
  originalUrl: string | null;
  feedUrl: string | null;
  summary: string | null;
  summarySource: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  categoryName: string | null;
  categorySlug: string | null;
  subcategoryName: string | null;
  subcategorySlug: string | null;
}

const articleCardSelect = {
  id: articles.id,
  title: articles.title,
  source: articles.source,
  originalUrl: articles.originalUrl,
  feedUrl: articles.feedUrl,
  summary: articles.summary,
  summarySource: articles.summarySource,
  imageUrl: articles.imageUrl,
  publishedAt: articles.publishedAt,
  categoryName: categories.name,
  categorySlug: categories.slug,
  subcategoryName: subcategories.name,
  subcategorySlug: subcategories.slug,
};

export async function getCategories() {
  return db.query.categories.findMany({
    where: eq(categories.enabled, true),
    orderBy: (c) => c.sortOrder,
  });
}

export async function getCategoriesFull() {
  return db.query.categories.findMany({
    orderBy: (c, { desc }) => desc(c.createdAt),
  });
}

export async function getSubcategories(categoryId?: number) {
  return db.query.subcategories.findMany({
    where: categoryId
      ? and(eq(subcategories.enabled, true), eq(subcategories.categoryId, categoryId))
      : eq(subcategories.enabled, true),
    orderBy: (s) => s.sortOrder,
  });
}

function baseQuery() {
  return db
    .select(articleCardSelect)
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(subcategories, eq(articles.subcategoryId, subcategories.id));
}

export async function getReadyArticles(options: {
  beforeId?: number;
  limit?: number;
  categorySlug?: string;
  subcategorySlug?: string;
} = {}): Promise<ArticleCardData[]> {
  const limit = options.limit ?? PAGE_SIZE;

  const conditions: SQL[] = [eq(articles.status, "ready")];
  if (options.beforeId) conditions.push(lt(articles.id, options.beforeId));
  if (options.categorySlug) conditions.push(eq(categories.slug, options.categorySlug));
  if (options.subcategorySlug)
    conditions.push(eq(subcategories.slug, options.subcategorySlug));

  return baseQuery()
    .where(and(...conditions))
    .orderBy(desc(articles.id))
    .limit(limit);
}

export interface DailySummaryData {
  categoryId: number;
  date: string;
  articleCount: number;
  chapters: DailySummaryChapter[];
  generatedAt: Date;
}

function todayParisDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function getTodayDailySummaries(): Promise<
  Map<number, DailySummaryData>
> {
  const rows = await db
    .select({
      categoryId: dailySummaries.categoryId,
      date: dailySummaries.date,
      articleCount: dailySummaries.articleCount,
      chapters: dailySummaries.chapters,
      generatedAt: dailySummaries.generatedAt,
    })
    .from(dailySummaries)
    .where(eq(dailySummaries.date, todayParisDate()));

  const map = new Map<number, DailySummaryData>();
  for (const row of rows) {
    map.set(row.categoryId, row);
  }
  return map;
}

export async function getNewerReadyArticles(
  afterId: number,
  categorySlug?: string,
  subcategorySlug?: string
): Promise<ArticleCardData[]> {
  const conditions: SQL[] = [eq(articles.status, "ready"), gt(articles.id, afterId)];
  if (categorySlug) conditions.push(eq(categories.slug, categorySlug));
  if (subcategorySlug) conditions.push(eq(subcategories.slug, subcategorySlug));

  return baseQuery()
    .where(and(...conditions))
    .orderBy(desc(articles.id));
}
