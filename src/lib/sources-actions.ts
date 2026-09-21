"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { articles, sources, type SourceType } from "@/db/schema";

export interface SourceFormState {
  error?: string;
}

export async function createSource(
  _prevState: SourceFormState,
  formData: FormData
): Promise<SourceFormState> {
  const type = formData.get("type");
  const name = formData.get("name");
  const query = formData.get("query");
  const rssUrl = formData.get("rssUrl");
  const categoryIdRaw = formData.get("categoryId");

  if (type !== "google_news" && type !== "rss") {
    return { error: "Type de source invalide." };
  }
  if (typeof name !== "string" || name.trim().length === 0) {
    return { error: "Le nom est requis." };
  }
  const categoryId = Number(categoryIdRaw);
  if (!categoryId || Number.isNaN(categoryId)) {
    return { error: "La catégorie est requise." };
  }

  if (type === "google_news") {
    if (typeof query !== "string" || query.trim().length === 0) {
      return { error: "La recherche est requise pour Google News." };
    }
  } else {
    if (typeof rssUrl !== "string" || !isValidUrl(rssUrl)) {
      return { error: "URL RSS invalide." };
    }
  }

  await db.insert(sources).values({
    name: name.trim(),
    type: type as SourceType,
    query: type === "google_news" ? (query as string).trim() : null,
    rssUrl: type === "rss" ? (rssUrl as string).trim() : null,
    categoryId,
    enabled: true,
  });

  revalidatePath("/settings");
  return {};
}

export async function toggleSource(id: number, enabled: boolean): Promise<void> {
  await db
    .update(sources)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(sources.id, id));
  revalidatePath("/settings");
}

export async function deleteSource(id: number): Promise<void> {
  await db.delete(sources).where(eq(sources.id, id));
  revalidatePath("/settings");
}

export async function deleteArticlesBySource(sourceId: number): Promise<void> {
  await db.delete(articles).where(eq(articles.sourceId, sourceId));
  revalidatePath("/settings");
  revalidatePath("/");
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
