"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { articles, subcategories } from "@/db/schema";

export interface SubcategoryFormState {
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

export async function createSubcategory(
  _prevState: SubcategoryFormState,
  formData: FormData
): Promise<SubcategoryFormState> {
  const name = formData.get("name");
  const description = formData.get("description");
  const categoryIdRaw = formData.get("categoryId");

  if (typeof name !== "string" || name.trim().length === 0) {
    return { error: "Le nom est requis." };
  }
  if (typeof description !== "string" || description.trim().length === 0) {
    return { error: "La description est requise." };
  }
  const categoryId = Number(categoryIdRaw);
  if (!categoryId || Number.isNaN(categoryId)) {
    return { error: "Catégorie invalide." };
  }

  const slug = slugify(name);

  await db.insert(subcategories).values({
    categoryId,
    name: name.trim(),
    slug,
    description: description.trim(),
    enabled: true,
  });

  revalidatePath("/settings");
  return {};
}

export async function toggleSubcategory(id: number, enabled: boolean): Promise<void> {
  await db
    .update(subcategories)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(subcategories.id, id));
  revalidatePath("/settings");
}

export async function deleteSubcategory(id: number): Promise<void> {
  await db.delete(subcategories).where(eq(subcategories.id, id));
  revalidatePath("/settings");
}

export async function deleteArticlesBySubcategory(
  subcategoryId: number
): Promise<void> {
  await db.delete(articles).where(eq(articles.subcategoryId, subcategoryId));
  revalidatePath("/settings");
  revalidatePath("/");
}
