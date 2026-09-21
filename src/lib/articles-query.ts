import { desc, eq, and, lt, gt } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";

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
}

export async function getCategories() {
  return db.query.categories.findMany({
    where: eq(categories.enabled, true),
    orderBy: (c) => c.sortOrder,
  });
}

export async function getReadyArticles(options: {
  beforeId?: number;
  limit?: number;
} = {}): Promise<ArticleCardData[]> {
  const limit = options.limit ?? PAGE_SIZE;

  const rows = await db
    .select({
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
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(
      options.beforeId
        ? and(eq(articles.status, "ready"), lt(articles.id, options.beforeId))
        : eq(articles.status, "ready")
    )
    .orderBy(desc(articles.id))
    .limit(limit);

  return rows;
}

export async function getNewerReadyArticles(
  afterId: number
): Promise<ArticleCardData[]> {
  return db
    .select({
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
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(and(eq(articles.status, "ready"), gt(articles.id, afterId)))
    .orderBy(desc(articles.id));
}
