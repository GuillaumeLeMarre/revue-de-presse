import { createHash } from "crypto";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { articles } from "@/db/schema";

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function hashTitle(title: string): string {
  return createHash("sha256").update(normalizeTitle(title)).digest("hex");
}

interface DedupCandidate {
  originalUrl?: string | null;
  feedUrl?: string | null;
  title: string;
}

export async function findExistingArticleId(
  candidate: DedupCandidate
): Promise<number | null> {
  const titleHash = hashTitle(candidate.title);

  const conditions = [];
  if (candidate.originalUrl) {
    conditions.push(eq(articles.originalUrl, candidate.originalUrl));
  }
  if (candidate.feedUrl) {
    conditions.push(eq(articles.feedUrl, candidate.feedUrl));
  }
  conditions.push(eq(articles.contentHash, titleHash));

  const existing = await db.query.articles.findFirst({
    where: or(...conditions),
    columns: { id: true },
  });

  return existing?.id ?? null;
}
