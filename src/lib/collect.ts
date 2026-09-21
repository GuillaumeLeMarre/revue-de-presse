import { eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, sources } from "@/db/schema";
import { buildGoogleNewsRssUrl } from "@/lib/google-news";
import { fetchRssItems } from "@/lib/rss-collector";
import { resolveOriginalUrl } from "@/lib/original-url";
import { findExistingArticleId, hashTitle } from "@/lib/dedup";
import { processArticle } from "@/lib/process-article";
import { logEvent } from "@/lib/logger";

export interface CollectResult {
  newArticles: number;
  sourcesProcessed: number;
  errors: Array<{ sourceId: number; sourceName: string; message: string }>;
}

let collectionInProgress = false;

export async function runCollection(): Promise<CollectResult> {
  if (collectionInProgress) {
    return { newArticles: 0, sourcesProcessed: 0, errors: [] };
  }
  collectionInProgress = true;

  try {
    const activeSources = await db.query.sources.findMany({
      where: eq(sources.enabled, true),
    });

    let newArticles = 0;
    const errors: CollectResult["errors"] = [];

    for (const source of activeSources) {
      try {
        newArticles += await collectSource(source);
      } catch (error) {
        errors.push({
          sourceId: source.id,
          sourceName: source.name,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      newArticles,
      sourcesProcessed: activeSources.length,
      errors,
    };
  } finally {
    collectionInProgress = false;
  }
}

async function collectSource(
  source: typeof sources.$inferSelect
): Promise<number> {
  const rssUrl =
    source.type === "google_news"
      ? buildGoogleNewsRssUrl(source.query ?? "", source.language, source.country)
      : source.rssUrl;

  if (!rssUrl) {
    throw new Error("Source has no RSS URL configured");
  }

  let items;
  try {
    items = await fetchRssItems(rssUrl);
    logEvent("RSS_FETCH_SUCCESS", { sourceId: source.id, count: items.length });
  } catch (error) {
    logEvent("RSS_FETCH_FAILED", {
      sourceId: source.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  let inserted = 0;

  for (const item of items) {
    if (!item.title || !item.feedUrl) continue;

    const existingId = await findExistingArticleId({
      feedUrl: item.feedUrl,
      title: item.title,
    });
    if (existingId) {
      logEvent("ARTICLE_DUPLICATE", { sourceId: source.id, title: item.title });
      continue;
    }

    const originalUrl = await resolveOriginalUrl(item.feedUrl);

    if (originalUrl) {
      const dupByOriginal = await findExistingArticleId({
        originalUrl,
        title: item.title,
      });
      if (dupByOriginal) continue;
    }

    let insertedRow;
    try {
      [insertedRow] = await db
        .insert(articles)
        .values({
          title: item.title,
          source: item.sourceName ?? source.name,
          feedUrl: item.feedUrl,
          originalUrl,
          description: item.description,
          categoryId: source.categoryId,
          sourceId: source.id,
          imageUrl: item.imageUrl,
          publishedAt: item.publishedAt,
          status: "discovered",
          contentHash: hashTitle(item.title),
        })
        .onConflictDoNothing({ target: articles.contentHash })
        .returning({ id: articles.id });
    } catch (error) {
      logEvent("ARTICLE_FETCH_FAILED", {
        sourceId: source.id,
        title: item.title,
        error: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    if (!insertedRow) {
      logEvent("ARTICLE_DUPLICATE", { sourceId: source.id, title: item.title });
      continue;
    }

    logEvent("ARTICLE_DISCOVERED", { articleId: insertedRow.id, title: item.title });
    inserted += 1;

    try {
      await processArticle(insertedRow.id);
    } catch (error) {
      logEvent("ARTICLE_FETCH_FAILED", {
        articleId: insertedRow.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await db
    .update(sources)
    .set({ lastFetchedAt: new Date(), updatedAt: new Date() })
    .where(eq(sources.id, source.id));

  return inserted;
}
