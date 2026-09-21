import { eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, sources } from "@/db/schema";
import { buildGoogleNewsRssUrl } from "@/lib/google-news";
import { fetchRssItems } from "@/lib/rss-collector";
import { resolveOriginalUrl } from "@/lib/original-url";
import { findExistingArticleId, hashTitle } from "@/lib/dedup";

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

  const items = await fetchRssItems(rssUrl);
  let inserted = 0;

  for (const item of items) {
    if (!item.title || !item.feedUrl) continue;

    const existingId = await findExistingArticleId({
      feedUrl: item.feedUrl,
      title: item.title,
    });
    if (existingId) continue;

    const originalUrl = await resolveOriginalUrl(item.feedUrl);

    if (originalUrl) {
      const dupByOriginal = await findExistingArticleId({
        originalUrl,
        title: item.title,
      });
      if (dupByOriginal) continue;
    }

    await db.insert(articles).values({
      title: item.title,
      source: item.sourceName ?? source.name,
      feedUrl: item.feedUrl,
      originalUrl,
      description: item.description,
      categoryId: source.categoryId,
      imageUrl: item.imageUrl,
      publishedAt: item.publishedAt,
      status: "discovered",
      contentHash: hashTitle(item.title),
    });
    inserted += 1;
  }

  await db
    .update(sources)
    .set({ lastFetchedAt: new Date(), updatedAt: new Date() })
    .where(eq(sources.id, source.id));

  return inserted;
}
