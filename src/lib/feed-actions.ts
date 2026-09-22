"use server";

import { runCollection } from "@/lib/collect";
import {
  getReadyArticles,
  getNewerReadyArticles,
  type ArticleCardData,
} from "@/lib/articles-query";

export interface RefreshResult {
  message: string;
  newArticles: number;
}

export async function refreshFeed(): Promise<RefreshResult> {
  const result = await runCollection();
  return {
    newArticles: result.newArticles,
    message:
      result.newArticles > 0
        ? `${result.newArticles} nouvel${result.newArticles > 1 ? "s" : ""} article${
            result.newArticles > 1 ? "s" : ""
          }`
        : "Aucun nouvel article",
  };
}

export async function loadArticlesForCategory(
  categorySlug: string | null,
  subcategorySlug: string | null = null
): Promise<ArticleCardData[]> {
  return getReadyArticles({
    categorySlug: categorySlug ?? undefined,
    subcategorySlug: subcategorySlug ?? undefined,
  });
}

export async function loadMoreArticles(
  beforeId: number,
  categorySlug: string | null,
  subcategorySlug: string | null = null
): Promise<ArticleCardData[]> {
  return getReadyArticles({
    beforeId,
    categorySlug: categorySlug ?? undefined,
    subcategorySlug: subcategorySlug ?? undefined,
  });
}

export async function loadNewerArticles(
  afterId: number,
  categorySlug: string | null,
  subcategorySlug: string | null = null
): Promise<ArticleCardData[]> {
  return getNewerReadyArticles(
    afterId,
    categorySlug ?? undefined,
    subcategorySlug ?? undefined
  );
}
