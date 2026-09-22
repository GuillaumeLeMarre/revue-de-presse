"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { articles, categories, type SourceType } from "@/db/schema";

export interface CategoryFormState {
  error?: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const type = formData.get("type");
  const name = formData.get("name");
  const query = formData.get("query");
  const rssUrl = formData.get("rssUrl");

  if (type !== "google_news" && type !== "rss") {
    return { error: "Type de catégorie invalide." };
  }
  if (typeof name !== "string" || name.trim().length === 0) {
    return { error: "Le nom est requis." };
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

  await db.insert(categories).values({
    name: name.trim(),
    slug: slugify(name),
    type: type as SourceType,
    query: type === "google_news" ? (query as string).trim() : null,
    rssUrl: type === "rss" ? (rssUrl as string).trim() : null,
    enabled: true,
  });

  revalidatePath("/settings");
  revalidatePath("/");
  return {};
}

export async function toggleCategory(id: number, enabled: boolean): Promise<void> {
  await db
    .update(categories)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(categories.id, id));
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function deleteCategory(id: number): Promise<void> {
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function deleteArticlesByCategory(categoryId: number): Promise<void> {
  await db.delete(articles).where(eq(articles.categoryId, categoryId));
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
