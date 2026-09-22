import { eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, subcategories } from "@/db/schema";
import { fetchPage } from "@/lib/fetch-page";
import { extractArticle } from "@/lib/extract-article";
import { categorizeByKeywords } from "@/lib/categorize";
import { summarizeArticle } from "@/lib/llm";
import { logEvent } from "@/lib/logger";

const MIN_CONTENT_LENGTH = 500;

type Article = typeof articles.$inferSelect;

export async function processArticle(articleId: number): Promise<void> {
  const article = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
  });
  if (!article) return;

  const url = article.originalUrl ?? article.feedUrl;
  if (!url) {
    await markFailed(article.id, "No URL available");
    return;
  }

  await db
    .update(articles)
    .set({ status: "fetching", updatedAt: new Date() })
    .where(eq(articles.id, article.id));

  let extractedText: string | null = null;
  let extractedImage: string | null = null;
  let finalUrl = url;

  try {
    const { html, finalUrl: resolvedUrl } = await fetchPage(url);
    finalUrl = resolvedUrl;
    logEvent("ARTICLE_FETCH_SUCCESS", { articleId: article.id, url: finalUrl });

    const extracted = extractArticle(html, finalUrl);
    if (extracted && extracted.textContent.length >= MIN_CONTENT_LENGTH) {
      extractedText = extracted.textContent;
      extractedImage = extracted.imageUrl;
      logEvent("ARTICLE_EXTRACTION_SUCCESS", {
        articleId: article.id,
        length: extracted.textContent.length,
      });
    } else {
      logEvent("ARTICLE_EXTRACTION_FAILED", {
        articleId: article.id,
        reason: extracted ? "content too short" : "readability failed",
      });
    }
  } catch (error) {
    logEvent("ARTICLE_FETCH_FAILED", {
      articleId: article.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  let content: string;
  let summarySource: "full_text" | "rss_excerpt";

  if (extractedText) {
    content = extractedText;
    summarySource = "full_text";
  } else if (article.description && article.description.length > 0) {
    content = article.description;
    summarySource = "rss_excerpt";
  } else {
    await markFailed(article.id, "No usable content (extraction and RSS fallback both empty)");
    return;
  }

  if (content.length < 50) {
    await markFailed(article.id, "Insufficient content to summarize");
    return;
  }

  await db
    .update(articles)
    .set({
      status: "summarizing",
      content,
      originalUrl: finalUrl,
      imageUrl: article.imageUrl ?? extractedImage,
      summarySource,
      fetchedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(articles.id, article.id));

  await summarizeAndCategorize(article, content);
}

async function summarizeAndCategorize(
  article: Article,
  content: string
): Promise<void> {
  const allCategories = await db.query.categories.findMany({
    where: eq(categories.enabled, true),
  });

  try {
    const categoryId = await resolveCategoryId(
      article.categoryId,
      article.title,
      content,
      null,
      allCategories
    );

    const relevantSubcategories = categoryId
      ? await db.query.subcategories.findMany({
          where: eq(subcategories.categoryId, categoryId),
        })
      : [];
    const activeSubcategories = relevantSubcategories.filter((s) => s.enabled);

    const result = await summarizeArticle({
      source: article.source ?? "Inconnu",
      title: article.title,
      date: article.publishedAt ? article.publishedAt.toISOString() : null,
      content,
      candidateCategories: allCategories.map((c) => c.name),
      candidateSubcategories: activeSubcategories.map((s) => ({
        name: s.name,
        description: s.description,
      })),
    });

    const finalCategoryId = await resolveCategoryId(
      article.categoryId,
      article.title,
      content,
      result.category,
      allCategories
    );

    const subcategoryId = resolveSubcategoryId(
      result.subcategory,
      activeSubcategories
    );

    await db
      .update(articles)
      .set({
        summary: result.summary,
        categoryId: finalCategoryId,
        subcategoryId,
        status: result.relevant ? "ready" : "irrelevant",
        summarizedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(articles.id, article.id));

    logEvent("LLM_SUCCESS", {
      articleId: article.id,
      relevant: result.relevant,
    });
  } catch (error) {
    logEvent("LLM_FAILED", {
      articleId: article.id,
      error: error instanceof Error ? error.message : String(error),
    });
    await markFailed(article.id, "LLM summarization failed");
  }
}

async function resolveCategoryId(
  sourceCategoryId: number | null,
  title: string,
  content: string,
  llmCategoryName: string | null,
  allCategories: Array<typeof categories.$inferSelect>
): Promise<number | null> {
  if (sourceCategoryId) return sourceCategoryId;

  const keywordSlug = categorizeByKeywords(`${title} ${content}`);
  if (keywordSlug) {
    const match = allCategories.find((c) => c.slug === keywordSlug);
    if (match) return match.id;
  }

  if (llmCategoryName) {
    const normalized = llmCategoryName.trim().toLowerCase();
    const match = allCategories.find(
      (c) => c.name.toLowerCase() === normalized || c.slug === normalized
    );
    if (match) return match.id;
  }

  return null;
}

function resolveSubcategoryId(
  llmSubcategoryName: string | null,
  candidates: Array<typeof subcategories.$inferSelect>
): number | null {
  if (!llmSubcategoryName) return null;
  const normalized = llmSubcategoryName.trim().toLowerCase();
  const match = candidates.find(
    (s) => s.name.toLowerCase() === normalized || s.slug === normalized
  );
  return match ? match.id : null;
}

async function markFailed(articleId: number, reason: string): Promise<void> {
  await db
    .update(articles)
    .set({ status: "failed", updatedAt: new Date() })
    .where(eq(articles.id, articleId));
  logEvent("ARTICLE_FETCH_FAILED", { articleId, reason });
}
