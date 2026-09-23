import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, dailySummaries, subcategories } from "@/db/schema";
import { logEvent } from "@/lib/logger";

const FACTUAL_RULES = `Contraintes strictes :
- énonce uniquement des faits explicitement présents dans les articles fournis (qui, quoi, où, quand, chiffres) ;
- n'interprète pas, ne déduis pas d'intention, de tendance, de portée ou de signification ;
- n'utilise aucun terme d'analyse ou de jugement ("souligne", "illustre", "témoigne de", "marque une étape", "suscite des interrogations", "met en lumière", "reflète", "s'inscrit dans") ;
- ne relie pas les faits entre eux par une interprétation commune ; un fait = une phrase indépendante ;
- pas d'adjectifs ou adverbes évaluatifs ("important", "significatif", "inquiétant", "positif") ;
- n'invente aucune information, utilise uniquement le contenu fourni.`;

const FACTS_SYSTEM_PROMPT = `Tu extrais les faits marquants du jour à partir d'une liste d'articles numérotés.

Pour chaque fait retenu, rédige une phrase factuelle autonome (qui, quoi, où, quand) et indique le numéro de l'article dont il provient. Retiens entre 3 et 8 faits, les plus marquants, sans doublons. Ne cite pas le titre de l'article ni le nom du média.

${FACTUAL_RULES}

Réponds uniquement avec un objet JSON de la forme :
{"facts": [{"text": "...", "source": <numéro de l'article>}]}`;

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
  url: string | null;
}

interface Fact {
  text: string;
  url: string | null;
}

async function extractFacts(
  categoryName: string,
  label: string | null,
  items: ArticleForSummary[]
): Promise<Fact[]> {
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  const baseUrl = process.env.LLM_BASE_URL ?? "https://api.openai.com/v1";
  if (!apiKey || !model) return [];

  const body = items
    .map((a, i) => `${i + 1}. ${a.title}${a.summary ? ` — ${a.summary}` : ""}`)
    .join("\n");

  const context = label
    ? `CATÉGORIE\n${categoryName}\n\nVOLET\n${label}\n\nARTICLES\n${body}`
    : `CATÉGORIE\n${categoryName}\n\nARTICLES\n${body}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: FACTS_SYSTEM_PROMPT },
        { role: "user", content: context },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!response.ok) throw new Error(`LLM API error: HTTP ${response.status}`);

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") return [];

  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed.facts)) return [];
    return parsed.facts
      .filter(
        (f: unknown): f is { text: string; source: number } =>
          typeof f === "object" &&
          f !== null &&
          typeof (f as { text?: unknown }).text === "string" &&
          typeof (f as { source?: unknown }).source === "number"
      )
      .map((f: { text: string; source: number }) => {
        const article = items[f.source - 1];
        return { text: f.text.trim(), url: article?.url ?? null };
      });
  } catch {
    return [];
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
      const [rows, categorySubcategories] = await Promise.all([
        db
          .select({
            title: articles.title,
            summary: articles.summary,
            originalUrl: articles.originalUrl,
            feedUrl: articles.feedUrl,
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

      const toArticle = (r: (typeof rows)[number]): ArticleForSummary => ({
        title: r.title,
        summary: r.summary,
        url: r.originalUrl ?? r.feedUrl,
      });

      const groups = new Map<string, ArticleForSummary[]>();
      for (const row of rows) {
        if (!row.subcategoryName) continue;
        if (!groups.has(row.subcategoryName)) groups.set(row.subcategoryName, []);
        groups.get(row.subcategoryName)!.push(toArticle(row));
      }

      const orderedLabels = categorySubcategories
        .map((s) => s.name)
        .filter((name) => groups.has(name));

      const chapters: Array<{ label: string; facts: Fact[] }> = [];
      for (const label of orderedLabels) {
        const facts = await extractFacts(category.name, label, groups.get(label)!);
        if (facts.length > 0) chapters.push({ label, facts });
      }

      const globalFacts = await extractFacts(
        category.name,
        null,
        rows.map(toArticle)
      );

      if (chapters.length === 0 && globalFacts.length === 0) continue;

      await db
        .insert(dailySummaries)
        .values({
          categoryId: category.id,
          date,
          articleCount: rows.length,
          globalFacts,
          chapters,
        })
        .onConflictDoUpdate({
          target: [dailySummaries.categoryId, dailySummaries.date],
          set: {
            articleCount: rows.length,
            globalFacts,
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
