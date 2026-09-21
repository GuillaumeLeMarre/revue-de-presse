import { desc, eq, and, lt, gt, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, sources } from "@/db/schema";

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
  searchTag: string | null;
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
  searchTag: sources.name,
};

export async function getCategories() {
  return db.query.categories.findMany({
    where: eq(categories.enabled, true),
    orderBy: (c) => c.sortOrder,
  });
}

export async function getReadyArticles(options: {
  beforeId?: number;
  limit?: number;
  categorySlug?: string;
} = {}): Promise<ArticleCardData[]> {
  const limit = options.limit ?? PAGE_SIZE;

  const conditions: SQL[] = [eq(articles.status, "ready")];
  if (options.beforeId) conditions.push(lt(articles.id, options.beforeId));
  if (options.categorySlug) conditions.push(eq(categories.slug, options.categorySlug));

  return db
    .select(articleCardSelect)
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(sources, eq(articles.sourceId, sources.id))
    .where(and(...conditions))
    .orderBy(desc(articles.id))
    .limit(limit);
}

export async function getNewerReadyArticles(
  afterId: number,
  categorySlug?: string
): Promise<ArticleCardData[]> {
  const conditions: SQL[] = [eq(articles.status, "ready"), gt(articles.id, afterId)];
  if (categorySlug) conditions.push(eq(categories.slug, categorySlug));

  return db
    .select(articleCardSelect)
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(sources, eq(articles.sourceId, sources.id))
    .where(and(...conditions))
    .orderBy(desc(articles.id));
}
