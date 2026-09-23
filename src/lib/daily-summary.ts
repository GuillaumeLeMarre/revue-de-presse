import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, dailySummaries, subcategories } from "@/db/schema";
import { logEvent } from "@/lib/logger";

const SYSTEM_PROMPT = `Tu rédiges la synthèse quotidienne d'une revue de presse, pour une seule catégorie.

Tu reçois une liste d'articles du jour, chacun avec un titre, un résumé, et éventuellement une sous-catégorie.

Regroupe les articles par sous-catégorie et rédige, pour chaque groupe, un court paragraphe de synthèse (3 à 6 lignes) qui dégage les faits marquants du jour, sans lister les articles un par un ni les nommer individuellement.
Les articles sans sous-catégorie vont dans un groupe "label": "Général".
N'invente aucune information, utilise uniquement le contenu fourni.

Réponds uniquement avec un objet JSON de la forme :
{"chapters": [{"label": "...", "text": "..."}]}`;

function todayParisDate(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

function startOfTodayParis(): Date {
  const dateStr = todayParisDate();
  return new Date(`${dateStr}T00:00:00+02:00`);
}

interface ArticleForSummary {
  title: string;
  summary: string | null;
  subcategoryName: string | null;
}

async function callLlm(
  categoryName: string,
  items: ArticleForSummary[]
): Promise<{ chapters: Array<{ label: string; text: string }> } | null> {
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  const baseUrl = process.env.LLM_BASE_URL ?? "https://api.openai.com/v1";
  if (!apiKey || !model) return null;

  const body = items
    .map(
      (a, i) =>
        `${i + 1}. [${a.subcategoryName ?? "Général"}] ${a.title}${
          a.summary ? ` — ${a.summary}` : ""
        }`
    )
    .join("\n");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `CATÉGORIE\n${categoryName}\n\nARTICLES\n${body}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!response.ok) throw new Error(`LLM API error: HTTP ${response.status}`);

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") return null;

  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed.chapters)) return null;
    return {
      chapters: parsed.chapters
        .filter(
          (c: unknown): c is { label: string; text: string } =>
            typeof c === "object" &&
            c !== null &&
            typeof (c as { label?: unknown }).label === "string" &&
            typeof (c as { text?: unknown }).text === "string"
        )
        .map((c: { label: string; text: string }) => ({
          label: c.label.trim(),
          text: c.text.trim(),
        })),
    };
  } catch {
    return null;
  }
}

export async function generateDailySummaries(): Promise<void> {
  const date = todayParisDate();
  const since = startOfTodayParis();

  const activeCategories = await db.query.categories.findMany({
    where: eq(categories.enabled, true),
  });

  for (const category of activeCategories) {
    try {
      const rows = await db
        .select({
          title: articles.title,
          summary: articles.summary,
          subcategoryName: subcategories.name,
        })
        .from(articles)
        .leftJoin(subcategories, eq(articles.subcategoryId, subcategories.id))
        .where(
          and(
            eq(articles.categoryId, category.id),
            eq(articles.status, "ready"),
            gte(articles.publishedAt, since)
          )
        );

      if (rows.length === 0) continue;

      const result = await callLlm(category.name, rows);
      if (!result || result.chapters.length === 0) continue;

      await db
        .insert(dailySummaries)
        .values({
          categoryId: category.id,
          date,
          articleCount: rows.length,
          chapters: result.chapters,
        })
        .onConflictDoUpdate({
          target: [dailySummaries.categoryId, dailySummaries.date],
          set: {
            articleCount: rows.length,
            chapters: result.chapters,
            generatedAt: new Date(),
          },
        });

      logEvent("DAILY_SUMMARY_SUCCESS", { categoryId: category.id, date });
    } catch (error) {
      logEvent("DAILY_SUMMARY_FAILED", {
        categoryId: category.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
