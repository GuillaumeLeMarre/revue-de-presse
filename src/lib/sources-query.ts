import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { sources, categories } from "@/db/schema";

export interface SourceRowData {
  id: number;
  name: string;
  type: string;
  query: string | null;
  rssUrl: string | null;
  language: string;
  country: string;
  enabled: boolean;
  lastFetchedAt: Date | null;
  categoryName: string | null;
}

export async function getSources(): Promise<SourceRowData[]> {
  return db
    .select({
      id: sources.id,
      name: sources.name,
      type: sources.type,
      query: sources.query,
      rssUrl: sources.rssUrl,
      language: sources.language,
      country: sources.country,
      enabled: sources.enabled,
      lastFetchedAt: sources.lastFetchedAt,
      categoryName: categories.name,
    })
    .from(sources)
    .leftJoin(categories, eq(sources.categoryId, categories.id))
    .orderBy(desc(sources.createdAt));
}
