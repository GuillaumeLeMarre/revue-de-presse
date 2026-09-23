import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, dailySummaries, subcategories } from "@/db/schema";
import { logEvent } from "@/lib/logger";

const CHAPTER_SYSTEM_PROMPT = `Tu rédiges un chapitre de la synthèse quotidienne d'une revue de presse.

Tu reçois une liste d'articles du jour appartenant tous au même volet thématique.

Rédige un court paragraphe de synthèse (3 à 6 lignes) qui dégage les faits marquants du jour pour ce volet, sans lister les articles un par un ni les nommer individuellement.
N'invente aucune information, utilise uniquement le contenu fourni.

Réponds uniquement avec un objet JSON de la forme :
{"text": "..."}`;

const GLOBAL_SYSTEM_PROMPT = `Tu rédiges le résumé global quotidien d'une catégorie de revue de presse.

Tu reçois tous les articles du jour de cette catégorie, tous volets thématiques confondus.

Rédige un court paragraphe (3 à 6 lignes) qui donne une vue d'ensemble des faits marquants du jour pour cette catégorie, sans lister les articles un par un ni les nommer individuellement.
N'invente aucune information, utilise uniquement le contenu fourni.

Réponds uniquement avec un objet JSON de la forme :
{"text": "..."}`;

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
}

async function callLlmForText(
  systemPrompt: string,
  userContent: string
): Promise<string | null> {
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  const baseUrl = process.env.LLM_BASE_URL ?? "https://api.openai.com/v1";
  if (!apiKey || !model) return null;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
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
    return typeof parsed.text === "string" ? parsed.text.trim() : null;
  } catch {
    return null;
  }
}

function formatArticleList(items: ArticleForSummary[]): string {
  return items
    .map((a, i) => `${i + 1}. ${a.title}${a.summary ? ` — ${a.summary}` : ""}`)
    .join("\n");
}

async function summarizeGroup(
  categoryName: string,
  label: string,
  items: ArticleForSummary[]
): Promise<string | null> {
  return callLlmForText(
    CHAPTER_SYSTEM_PROMPT,
    `CATÉGORIE\n${categoryName}\n\nVOLET\n${label}\n\nARTICLES\n${formatArticleList(items)}`
  );
}

async function summarizeGlobal(
  categoryName: string,
  items: ArticleForSummary[]
): Promise<string | null> {
  return callLlmForText(
    GLOBAL_SYSTEM_PROMPT,
    `CATÉGORIE\n${categoryName}\n\nARTICLES\n${formatArticleList(items)}`
  );
}

export async function generateDailySummaries(): Promise<void> {
  const date = todayParisDate();
  const since = startOfTodayParis();

  const activeCategories = await db.query.categories.findMany({
    where: eq(categories.enabled, true),
  });

  for (const category of activeCategories) {
    try {
      const [rows, categorySubcategories] = await Promise.all([
        db
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
          ),
        db.query.subcategories.findMany({
          where: and(
            eq(subcategories.categoryId, category.id),
            eq(subcategories.enabled, true)
          ),
          orderBy: (s) => s.sortOrder,
        }),
      ]);

      if (rows.length === 0) continue;

      const groups = new Map<string, ArticleForSummary[]>();
      for (const row of rows) {
        if (!row.subcategoryName) continue;
        if (!groups.has(row.subcategoryName)) groups.set(row.subcategoryName, []);
        groups
          .get(row.subcategoryName)!
          .push({ title: row.title, summary: row.summary });
      }

      const orderedLabels = categorySubcategories
        .map((s) => s.name)
        .filter((name) => groups.has(name));

      const chapters: Array<{ label: string; text: string }> = [];
      for (const label of orderedLabels) {
        const text = await summarizeGroup(category.name, label, groups.get(label)!);
        if (text) chapters.push({ label, text });
      }

      const globalSummary = await summarizeGlobal(
        category.name,
        rows.map((r) => ({ title: r.title, summary: r.summary }))
      );

      if (chapters.length === 0 && !globalSummary) continue;

      await db
        .insert(dailySummaries)
        .values({
          categoryId: category.id,
          date,
          articleCount: rows.length,
          globalSummary: globalSummary ?? "",
          chapters,
        })
        .onConflictDoUpdate({
          target: [dailySummaries.categoryId, dailySummaries.date],
          set: {
            articleCount: rows.length,
            globalSummary: globalSummary ?? "",
            chapters,
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
